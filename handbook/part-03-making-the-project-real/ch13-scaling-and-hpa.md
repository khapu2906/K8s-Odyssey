# Chapter 13 — Scaling & HPA

**Part III — Making the Project Real**
**Tier:** Tier 1 — Core
**Touches `project/` code:** Yes — tag `ch13`.

---

## 🎯 Mission

The Chapter 3 traffic spike is back, and this time it's real: AI Workspace got featured somewhere, and `chat-api`'s three replicas (Chapter 7) are pegged at high CPU. `kubectl scale deployment chat-api --replicas=10` fixes it for now — but that means someone has to be watching a dashboard and typing that command at 2am, then scaling back down manually once traffic drops. That's not automation, that's a human pretending to be one.

## 📖 Theory

A **HorizontalPodAutoscaler (HPA)** watches a metric — most commonly CPU utilization — and adjusts a Deployment's replica count to keep that metric near a target you set, entirely on its own. It doesn't replace the Deployment/ReplicaSet machinery from Chapter 7; it just drives it, the same way you'd drive it by hand with `kubectl scale`.

Crucially, HPA's CPU-percentage target is *relative to the Pod's CPU **request*** from Chapter 12 — not some absolute number. "Scale up when average CPU exceeds 70%" means 70% of the `100m` you requested per Pod, not 70% of the Node. This is precisely why HPA has a hard dependency on Chapter 12: without a CPU request set, there's no baseline to measure a percentage against, and HPA can't compute anything.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: chat-api
  namespace: ai-workspace
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: chat-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## 🛠 Hands-on

Redeploy Chapters 10–12's `chat-api` setup first (the resource requests from Chapter 12 are required here), then:

```bash
# metrics-server is what HPA reads actual usage from — install it if the cluster doesn't have it
kubectl apply -f hpa-chat-api.yaml
kubectl get hpa -n ai-workspace -w

# generate load to trigger a scale-up
kubectl run -it --rm load-test --image=busybox -n ai-workspace -- \
  /bin/sh -c "while true; do wget -q -O- http://chat-api:8080/; done"
```

Watch `kubectl get hpa -n ai-workspace` and `kubectl get pods -n ai-workspace -w` in separate terminals as replicas climb, then drop the load and watch it scale back down. Full guide: [`labs/ch13/`](../../labs/ch13/). Code: `git checkout ch13` in [`project/`](../../project/).

## 🔬 Under the Hood

```bash
kubectl describe hpa chat-api -n ai-workspace
```

Every 15 seconds by default, the HPA controller (another loop inside the Controller Manager from Chapter 4) asks `metrics-server` for current CPU usage across `chat-api`'s Pods, compares it to the target, computes a new desired replica count, and — this is the important part — just updates the Deployment's `replicas` field. From there, it's Chapter 7's ReplicaSet controller doing the actual work, exactly as if you'd typed `kubectl scale` yourself. HPA is a loop that drives the loop you already know.

## 🧰 Production Notes

HPA intentionally scales gradually and avoids reacting to brief spikes (there's built-in stabilization to prevent "flapping" — rapidly scaling up and down). Setting `minReplicas` too low trades cost savings for slower response to sudden load; setting it too high defeats the purpose of autoscaling at all. This chapter only covers CPU-based scaling — Chapter 27 covers scaling on custom/external metrics (like queue depth) and VPA/KEDA for cases CPU alone can't capture.

## 🐞 Debug Lab

Deploy the HPA against a version of `chat-api` that has **no resource requests set** (i.e., skip Chapter 12's addition). Generate load and watch `kubectl describe hpa` closely — it won't scale, and the reason is stated plainly in the HPA's own status conditions. Confirm what you find against [`incidents/ch13/`](../../incidents/ch13/).

## 💬 Interview Questions

- HPA says "scale at 70% CPU" — 70% of what, exactly?
- Why won't HPA work on a Deployment whose Pods have no CPU request set?
- What component does HPA actually get its metrics from, and what does HPA itself modify?
- Why does HPA avoid scaling instantly on every small spike?

## 🚀 Challenge

See [`challenges/ch13/`](../../challenges/ch13/) (easy → expert) — including setting `minReplicas` and `maxReplicas` to nearly the same value and observing scaling thrashing, then fixing it, and separately trying an HPA that scales on memory instead of CPU.
