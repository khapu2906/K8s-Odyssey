# Chapter 9 — Service & DNS

**Part II — First Cluster**

**Tier:** Tier 1 — Core

**Touches `project/` code:** Yes — tag `ch09`.

---

## 🎯 Mission

`chat-api` now runs as three replicas (Chapter 7), and each one gets a new IP address every time it's recreated (Chapter 8's rollout just proved that). The frontend needs to talk to `chat-api`. Which of the three IPs does it use — and what happens the moment one of them changes, mid-request?

## 📖 Theory

A **Service** gives a group of Pods one stable address that doesn't change, no matter how many times those Pods are replaced. It finds its Pods the same way a Deployment does — a label selector — and it doesn't care *which* Pod answers a given request, only that the Pod is healthy and matches the selector.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: chat-api
  namespace: ai-workspace
spec:
  selector:
    app: chat-api
  ports:
    - port: 8080
      targetPort: 8080
```

Creating this gives you a **ClusterIP** — a virtual IP, internal to the cluster, that quietly load-balances across every Pod matching `app: chat-api`. But nobody hardcodes IPs, virtual or not. What actually makes this usable is **CoreDNS**, a cluster-internal DNS server that gives every Service a name: `chat-api.ai-workspace.svc.cluster.local`, or just `chat-api` from within the same namespace — exactly like `chat-api` reaching `postgres` by name in Chapter 2's Compose file. Same idea, same reason it exists, different machinery underneath.

## 🛠 Hands-on

Redeploy Chapters 6–7's `chat-api` Deployment first, then add the Service, plus one for Postgres:

```yaml
# postgres-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: ai-workspace
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
```

```bash
kubectl apply -f chat-api-service.yaml
kubectl apply -f postgres-service.yaml
kubectl get svc -n ai-workspace

# from inside the cluster, prove name resolution works
kubectl run -it --rm debug --image=busybox -n ai-workspace -- nslookup chat-api
kubectl run -it --rm debug --image=busybox -n ai-workspace -- wget -qO- chat-api:8080/health
```

Full guide: [`labs/ch09/`](../../labs/ch09/). Code: `git checkout ch09` in [`project/`](../../project/) — this tag also updates the frontend's config to call `http://chat-api:8080` instead of a hardcoded Pod IP.

## 🔬 Under the Hood

```
Frontend
   │  DNS lookup: "chat-api"
   ▼
CoreDNS
   │  resolves to the Service's ClusterIP
   ▼
Service (chat-api)
   │  picks a healthy backing Pod
   ▼
EndpointSlice
   │  the live, up-to-date list of matching Pod IPs
   ▼
Pod
```

A Service never stores Pod IPs itself — an **EndpointSlice** does, and it's kept in sync automatically every time a Pod matching the selector appears or disappears (which is exactly what happened three times during Chapter 8's rollout). `kubectl get endpointslices -n ai-workspace` shows this list directly. The full routing mechanism — how traffic to the ClusterIP actually reaches a real Pod on a real Node — is `kube-proxy`'s job, covered in depth in Chapter 20 and Chapter 58.

## 🧰 Production Notes

`ClusterIP` (what you just created) is internal-only by design — nothing outside the cluster can reach it, which is correct for `chat-api` talking to `postgres`, but wrong for the frontend talking to the outside world. `NodePort` and `LoadBalancer` exist for external access, but `NodePort` in particular is rarely the right call in production (Chapter 21 explains why, once Ingress is on the table).

## 🐞 Debug Lab

With `chat-api` and its Service both running, try each of these, one at a time, and use `kubectl describe svc`, `kubectl get endpointslices`, and `kubectl logs` to understand exactly what breaks and why, before checking [`incidents/ch09/`](../../incidents/ch09/):

- `kubectl delete svc chat-api -n ai-workspace`
- `kubectl scale deployment chat-api --replicas=0 -n ai-workspace`
- `kubectl delete pods -n kube-system -l k8s-app=kube-dns` (deletes CoreDNS)

## 💬 Interview Questions

- Why doesn't a Service route traffic directly to a Deployment?
- Does a Service store Pod IPs itself? If not, what does?
- What happens to in-flight requests if CoreDNS becomes unavailable for a few seconds?
- What is an EndpointSlice for, and why isn't it just called "Endpoints"?
- Should `NodePort` be used to expose a service in production? Why or why not?

## 🚀 Challenge

See [`challenges/ch09/`](../../challenges/ch09/) (easy → expert) — including exposing `chat-api` via `NodePort` temporarily, reaching it from outside the cluster, and then explaining why that approach doesn't scale to a real production setup.
