# Chapter 31 — Only 10% Get It First

## Start of the week

Last night's deploy had a real bug — a wrong condition in `answer.js` made `chat-api` return a 500 error for roughly a third of all questions. ArgoCD did exactly its job: saw Git change, applied immediately, `RollingUpdate` replaced every old Pod with a new one in a few dozen seconds. The problem isn't speed — it's that ALL traffic hit the broken version at once, no way to let a small slice of users try it first.

A `Deployment`'s `RollingUpdate` only controls the **number of Pods** replaced over time (`maxSurge`, `maxUnavailable`) — it doesn't control what percentage of **requests** go to the old version versus the new one. While a rolling update is in progress, the fraction of requests landing on the new Pod is entirely random, depending on which Pod `kube-proxy` happens to pick at that moment, not a number you actually get to choose.

### Istio — adds a routing layer, doesn't replace the Service

```bash
istioctl install --set profile=default -y
```

```
✔ Istio core installed
✔ Istiod installed
✔ Ingress gateways installed
✔ Installation complete
```

Enable sidecar injection for the `ai-workspace` namespace — every Pod created after this automatically gets an extra `istio-proxy` (Envoy) container standing in front of the real one, intercepting all traffic in and out to decide where it actually routes.

```bash
kubectl label namespace ai-workspace istio-injection=enabled
kubectl rollout restart deployment/chat-api -n ai-workspace
```

```bash
kubectl get pods -n ai-workspace -l app=chat-api
```

```
NAME                          READY   STATUS
chat-api-...                  2/2     Running
```

`2/2` — not `1/1` anymore. The second container is `istio-proxy`, injected automatically, no changes needed in `chat-api-deployment.yaml` at all.

### Deploying two versions side by side, tagged by version

Set `chat-api`'s image tag back to the stable old build, label it `version: v1`. Deploy a separate one for the new code, `version: v2`, same `app: chat-api`, both equally matched by the `chat-api` Service (a Service only filters by `app`, doesn't care about `version`).

```yaml
# chat-api-v2 — a separate Deployment, only differs by image tag and version label
metadata:
  labels:
    app: chat-api
    version: v2
```

Write a `DestinationRule` — tells Istio that `version` is the criterion for splitting into "subsets."

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: chat-api
  namespace: ai-workspace
spec:
  host: chat-api
  subsets:
    - name: v1
      labels: { version: v1 }
    - name: v2
      labels: { version: v2 }
```

Write a `VirtualService` — the actual routing rule, splitting at exactly the desired ratio.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: chat-api
  namespace: ai-workspace
spec:
  hosts: [chat-api]
  http:
    - route:
        - destination: { host: chat-api, subset: v1 }
          weight: 90
        - destination: { host: chat-api, subset: v2 }
          weight: 10
```

```bash
kubectl apply -f destinationrule.yaml -f virtualservice.yaml
```

Before testing, add one small line to `index.js` to know which version actually answered a given request — no other way to tell from the client side.

```js
return c.json({ ...conversation, servedBy: process.env.APP_VERSION || "unknown" });
```

`APP_VERSION` is a new environment variable, declared differently between the two Deployments (`v1` sets `APP_VERSION=v1`, `v2` sets `APP_VERSION=v2`) — nothing to do with Istio itself, just the crudest way to see the difference with your own eyes.

### Testing for real — send a bunch of requests, count the split

```bash
for i in $(seq 1 50); do
  curl -s http://localhost/api/chat -H "Authorization: Bearer $TOKEN" \
    -d '{"message":"ping"}' | jq -r .servedBy
done | sort | uniq -c
```

```
 45 v1
  5 v2
```

Not an exact `90/10` — with 50 requests, some drift around the declared ratio is normal, the more requests, the closer it lands to the real number. What matters is `v2` genuinely only gets a small slice, not everyone the way it did last night.

Watch `v2`'s own logs/Grafana (already set up weeks ago) for a few hours, no unusual jump in errors — bump `weight` to `50/50`, then `0/100`, retiring `v1` entirely once confident.

Open the notes again, add a new line.

```
A Deployment's rolling update swaps Pods, can't split real
request percentages. Istio + DestinationRule/VirtualService
routes by exact %, independent of which Pods happen to be
running. The istio-proxy sidecar auto-injects into every Pod
in the namespace, no app code changes needed.
```

The last line from weeks ago — "running somewhere other than this laptop" — is still exactly where it was, untouched. But the list of things now *known how to do* is a lot longer than the list of things *still not known*, and that's a completely different feeling from that first night staring at nine incomprehensible lines.
