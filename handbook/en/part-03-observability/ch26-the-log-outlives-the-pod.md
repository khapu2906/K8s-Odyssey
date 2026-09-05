# Chapter 26 — The Log Outlives the Pod

## That weekend

A `chat-api` Pod restarted at 3am, self-healed before anyone noticed — exactly what a ReplicaSet always does. The next morning, curious what got logged at that moment, you type the familiar command.

```bash
kubectl logs chat-api-7784dd7b79-9fx74 -n ai-workspace --previous
```

```
Error from server (NotFound): previous terminated container "chat-api" in pod "chat-api-7784dd7b79-9fx74" not found
```

`--previous` only keeps the log from exactly one run before the current one — this Pod has restarted several times since last night, and the 3am log has already been overwritten by every restart after it. Nothing kept around except the Pod's own temporary memory, the exact same lesson learned back when Postgres lost its data — logs only live as long as the Pod (or that exact container instance) does.

### Not a new solution — just one never used before

Logs need somewhere to live **outside** the Pod, the same reason Postgres needed a PVC. But a log isn't a file sitting on one Pod's own disk — it's text printed to `stdout` by every Pod, all the time, needing something to actually **collect** it before there's even a question of where to store it.

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm install loki grafana/loki-stack -n monitoring \
  --set grafana.enabled=false
```

`loki-stack` installs two things at once: `Loki` (where logs are stored, like Prometheus but for logs instead of metrics) and `Promtail` (the thing that goes and collects them). The `grafana.enabled` flag is off because Grafana already exists from last week, no need to install a second copy.

```bash
kubectl get pods -n monitoring -l app=promtail
```

```
NAME             READY   STATUS    RESTARTS   AGE
loki-promtail-4x8kp   1/1   Running   0   40s
loki-promtail-9m2wq   1/1   Running   0   40s
```

Exactly two Pods — no `replicas` configured anywhere, and it's not a Deployment either. `kubectl get daemonset -n monitoring` confirms it: `DaemonSet`, not a ReplicaSet counting toward some fixed number. A `DaemonSet` guarantees exactly **one** Pod on **every** node, automatically, with no count to declare — add a node, a new `promtail` Pod shows up on its own; remove a node, one disappears the same way. `kube-proxy`, seen way back when the cluster was first set up, and `node-exporter`, seen last week, were both `DaemonSet`s too — just never called out by name until now.

`Promtail` reads log files that the container runtime writes directly on that same node (not through `kubectl logs`, not through the API server) — this is exactly why it has to run on EVERY node, unlike Loki or Prometheus which only need one copy.

### Finding a log that seemed gone for good

Open Grafana, the "Explore" section, look for the `Loki` datasource in the list — nowhere to be found, just `Prometheus` from last week. Turning off `grafana.enabled` also turned off the auto-datasource mechanism along with it — that mechanism only wires into the `loki-stack` chart's own Grafana sub-chart (the one just disabled), with no idea a separate Grafana already exists. Two independent Helm releases, no wire connecting them at all.

Add it by hand: Configuration → Data sources → Add data source → pick `Loki`, URL set to the exact internal Service name just installed — `http://loki:3100` — the same way of calling a Service by name learned a long time ago, just a different caller this time.

```
Type: Loki
URL: http://loki:3100
```

Click "Save & Test" — a red line shows up: `Unable to connect with Loki. Please check the server logs for more details.` Check Grafana's own logs (`kubectl logs deployment/kube-prometheus-stack-grafana -c grafana -n monitoring`), and the real error isn't "can't connect" like the red banner claims — it's `parse error at line 1, col 1: syntax error: unexpected IDENTIFIER`. Grafana reached Loki just fine; it's the internal query it sends to self-test (`checkHealth`) that Loki is rejecting over a syntax mismatch — the Loki version bundled in the `loki-stack` chart is fairly old, not quite matching the query a newer Grafana sends.

Check Loki directly, skip the "Test" button: `curl http://localhost:3100/loki/api/v1/labels` (after a quick `port-forward svc/loki`) — comes back with a real label list (`app`, `namespace`, `pod`...). Loki is completely healthy, only Grafana's own self-check query is broken. Click "Save" anyway, ignore the red warning. Pick `Loki` in Explore again, it's there now. Type a LogQL query, syntax similar to the PromQL already familiar from a few days ago, but filtering on labels instead of numbers.

```
{namespace="ai-workspace", pod=~"chat-api.*"} |= "error"
```

Scroll back to exactly the 3am window — the line thought lost for good shows up intact, with the exact old Pod name `chat-api-7784dd7b79-9fx74`, even though that Pod has restarted several more times since, its current logs carrying no trace of 3am at all anymore. Loki kept that exact line, completely detached from the lifecycle of the Pod that produced it.

Try one more query — merge the logs of all three `chat-api` replicas at once, without caring which Pod any given line came from.

```
{namespace="ai-workspace", app="chat-api"}
```

The thing `kubectl logs` alone could never do — looping through each Pod by hand, stitching the results together yourself — is now just one query line.

Open the notes again, add one new line, not one of the original three from last week anymore — a different area of observability, just now visible precisely because there's finally a tool to see what's missing from it.

```
Logs now live outside the Pod, can pull up logs from a Pod
deleted long ago. One question not asked yet: how long does
Loki keep logs before deleting them? Retention not configured,
running on defaults — revisit later.
```

Not an ending, just a new question, a lot clearer than the vague one this morning when the 3am log looked gone for good.
