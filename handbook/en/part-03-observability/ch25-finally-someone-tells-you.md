# Chapter 25 — Finally, Someone Tells You

## Still that week

One line still uncrossed: Alertmanager came bundled with the Prometheus stack, but there's no rule configured yet — meaning even if something real breaks, nobody gets told, unless someone happens to have Grafana open at the right moment. You want at least one real alert: any Pod in `ai-workspace` falling into `CrashLoopBackOff`.

`Prometheus Operator` (installed as part of `kube-prometheus-stack`) doesn't read rules from a static config file — it reads them from a dedicated CRD: `PrometheusRule`. Try writing one.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ai-workspace-alerts
  namespace: monitoring
spec:
  groups:
    - name: ai-workspace
      rules:
        - alert: PodCrashLooping
          expr: increase(kube_pod_container_status_restarts_total{namespace="ai-workspace"}[10m]) > 3
          for: 1m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.pod }} is crash looping"
```

`expr` is a PromQL query — counts how much the restart count has increased in the last 10 minutes across every container in the `ai-workspace` namespace, past 3 counts as abnormal.

```bash
kubectl apply -f ai-workspace-alerts.yaml
```

```
prometheusrule.monitoring.coreos.com/ai-workspace-alerts created
```

Open the Prometheus UI (`kubectl port-forward svc/kube-prometheus-stack-prometheus 9090:9090 -n monitoring`), the "Rules" section — the rule just written isn't there at all. The object really exists on the cluster (`kubectl get prometheusrules -n monitoring` still lists it), but Prometheus never read it.

### Creating a CRD doesn't mean Prometheus automatically reads it

More digging, and it turns out the Prometheus Operator doesn't scan every `PrometheusRule` in the cluster — it only reads the ones matching the `ruleSelector` declared in Prometheus's own config, which by default (per `kube-prometheus-stack`) only accepts rules carrying the label `release: kube-prometheus-stack`. Missing that label, the rule is effectively invisible, no matter how correct the namespace, syntax, or anything else about it is.

```yaml
metadata:
  name: ai-workspace-alerts
  namespace: monitoring
  labels:
    release: kube-prometheus-stack
```

Add exactly that one label, apply again.

```bash
kubectl apply -f ai-workspace-alerts.yaml
```

Back in the Prometheus UI, "Rules" section — `PodCrashLooping` shows up, status `inactive` (rule loaded, condition just hasn't happened yet).

### Forcing it to actually fire

Recalling how to trigger a `CrashLoopBackOff` from way back when — temporarily point `chat-api`'s `livenessProbe` at a path that doesn't exist, `apply`, wait for restarts to climb.

```bash
kubectl get pods -n ai-workspace -w
```

```
chat-api-...   0/1   CrashLoopBackOff   4   3m12s
```

Back to the Prometheus UI a few minutes later — `PodCrashLooping` flips from `inactive` to `pending`, then `firing`. Open Alertmanager too (`kubectl port-forward svc/kube-prometheus-stack-alertmanager 9093:9093 -n monitoring`), and there's the exact alert sitting active, with `pod`, `namespace` labels auto-filled from `{{ $labels.pod }}`.

The alert actually "went off" — but went off to where? Alertmanager's default only has one receiver called `null`, sends nowhere, just records it. Wiring it to a real Slack/email needs a real webhook URL or SMTP credentials — nothing safe to write into a book, saved for whenever there's a real channel to connect it to. Revert `livenessProbe` back to `/health`, the Pod stabilizes again, and the alert flips back to `resolved` on its own.

You open the notes from last week, cross off the last line under system observability.

```
still open: full observability over time ✓✓ Prometheus +
Grafana (history), PrometheusRule + Alertmanager (automatic
alerts, tested for real with a deliberate CrashLoopBackOff).
Routing alerts to a real Slack/email — needs a real webhook,
whenever there's an official channel for it.

still open: automated deploys, running somewhere other than
this laptop.
```

The "system observability" line — from a `???` written that first night reading the README, through "partial" at `kubectl top`, finally closed for real now. Not because it's perfect — the receiver is still `null`, nothing actually gets sent anywhere real yet — but because every piece has shown up and been watched working correctly with your own eyes, nothing as vague as it was three weeks ago.
