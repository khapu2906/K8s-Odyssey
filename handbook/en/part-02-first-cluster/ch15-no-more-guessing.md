# Chapter 15 — No More Guessing

## Still that day

`128Mi`, `256Mi` — the numbers you typed into `resources` this morning were really just a guess, "roughly a small Node.js app." Not based on any actual data. The question's been nagging all day: how much RAM does `chat-api` actually use, or did you just make up a number that sounded reasonable and moved on?

You type the first command that comes to mind.

```bash
kubectl top nodes
```

```
error: Metrics API not available
```

The last remaining line from the night you read that README comes back to mind:

```
Need observability
→ ??? keep seeing Prometheus, Grafana, metrics-server mentioned
but every post uses them differently, not clear which one is the
Kubernetes "standard" vs. a third-party add-on. later
```

"Later" — that's what you wrote three weeks ago. Now it's actually needed. A bit more digging, and it turns out `kubectl top` doesn't just work on its own — it needs something called `metrics-server` running in the cluster, not installed by default, not even on `kind`.

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

```
serviceaccount/metrics-server created
deployment.apps/metrics-server created
service/metrics-server created
...
```

Wait a bit, try again.

```bash
kubectl top nodes
```

```
error: Metrics API not available
```

Still nothing. Check its Pod.

```bash
kubectl get pods -n kube-system | grep metrics
```

```
metrics-server-6c47b8d9f5-x2vqp   0/1     Running   0          62s
```

`0/1` — running, but not ready. `logs` to see why.

```bash
kubectl logs -n kube-system deployment/metrics-server
```

```
E0817 09:12:44.118301       1 scraper.go:140] "Failed to scrape node"
err="... x509: cannot validate certificate for 172.18.0.2 because it
doesn't contain any IP SANs" node="ai-workspace-control-plane"
```

The kubelet's TLS certificate on `kind` is self-signed, without a real IP on its list of valid names — `metrics-server` doesn't trust a certificate like that by default, refuses the connection. A bit more searching, and it turns out this is a well-known thing on `kind`: needs the flag `--kubelet-insecure-tls` to skip that certificate check (fine on a local cluster, not something you'd bring to production).

```bash
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
```

```
deployment.apps/metrics-server patched
```

Wait for the Pod to restart, try once more.

```bash
kubectl top nodes
```

```
NAME                         CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
ai-workspace-control-plane   324m         4%     1051Mi          13%
```

`CPU(cores)` — `324m`, meaning 0.324 CPU cores currently in use, the same `m` (millicores) unit already familiar from writing `resources.requests` back in Chapter 14. `MEMORY(bytes)` — `1051Mi`, actual RAM in use. The two `%` columns next to them aren't pulled from nowhere — they're a percentage against the `Allocatable` values seen in `kubectl describe node` yesterday (`cpu: 6`, `memory: 7841234Ki`): `324m` out of `6` cores lands right around `4%`, `1051Mi` out of `~7.5Gi` lands right around `13%`. Not two unrelated numbers — the same division, just shown two different ways. Real numbers, not a guess anymore. You try your own namespace next.

```bash
kubectl top pods -n ai-workspace
```

```
NAME                          CPU(cores)   MEMORY(bytes)
chat-api-bc6659b9f-8j9fj      2m           35Mi
chat-api-bc6659b9f-jt4b8      2m           44Mi
chat-api-bc6659b9f-w687d      2m           30Mi
postgres-76bbc54bd4-ffwdj     5m           57Mi
```

`chat-api` uses about 30-44Mi per replica — the `128Mi` you guessed this morning turns out to be roomier than it needed to be, almost three times more than actually used. `postgres` sits at 57Mi, comfortably under the `256Mi` you asked for too.

But you also see the limit of what you just set up right away: `kubectl top` only gives numbers *right now*, nothing gets kept. Close the terminal and the numbers you just saw are gone — no graph, no history, no alert when something crosses a threshold. Exactly what those blog posts that night were vaguely gesturing at — `metrics-server` is only the first step; `Prometheus`/`Grafana` is a whole different thing, a full system for storing and rendering data over time. That's for later — today, actually knowing the real numbers is already a clear step forward.

You open the notes, cross off the last line in that nine-line list written that night.

```
Need observability ✓ (partial) — metrics-server gives real
CPU/memory numbers via `kubectl top`, but only a snapshot —
close the terminal and it's gone, no history kept, no alerts.
Prometheus/Grafana is the next step, not today.
```

Nine lines, all nine now have something marking them — the last one isn't a clean ✓ like the others, it's "partial," which is exactly what actually got done. You shut the laptop, not with the "all done" kind of relief — just a lot clearer than that first night, when all of this was still nine unfamiliar names.
