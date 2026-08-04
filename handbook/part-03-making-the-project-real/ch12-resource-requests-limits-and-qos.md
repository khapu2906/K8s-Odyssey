# Chapter 12 — Resource Requests, Limits & QoS

**Part III — Making the Project Real**
**Tier:** Tier 1 — Core
**Touches `project/` code:** Yes — tag `ch12`.

---

## 🎯 Mission

None of `chat-api`'s three Pods declare how much CPU or memory they need. So far that's been harmless on a quiet local cluster — but on a shared cluster with other workloads, the Scheduler (Chapter 4) has no idea how much room `chat-api` actually needs, and nothing stops one misbehaving Pod from consuming memory until the whole Node struggles.

## 📖 Theory

Two numbers, two very different jobs:

- **Requests** — what a Pod is guaranteed to get, and what the **Scheduler** uses to decide which Node has room for it. A Node won't be chosen for a Pod unless it has enough unreserved capacity to satisfy that Pod's requests.
- **Limits** — the hard ceiling. What happens when a Pod hits its limit is different for each resource: hit the **CPU** limit and the container is **throttled** — slowed down, not killed. Hit the **memory** limit and the container is **killed outright** (`OOMKilled`) — memory can't be throttled the way CPU can, because you can't partially deny a memory allocation.

Every Pod gets a **QoS class**, derived automatically from how requests and limits compare:

| Class | When it applies | Eviction priority under Node pressure |
|---|---|---|
| **Guaranteed** | requests == limits, for every container | Evicted last |
| **Burstable** | requests set, but less than limits (or limits missing) | Evicted before Guaranteed |
| **BestEffort** | no requests or limits set at all | Evicted first |

This is also why setting neither is a real risk, not just a formality: an unbounded `chat-api` is `BestEffort`, the first thing sacrificed the moment a Node runs low on resources.

## 🛠 Hands-on

Redeploy Chapters 9, 10, and 11's `chat-api` setup first, then add:

```yaml
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
```

```bash
kubectl apply -f chat-api-deployment.yaml
kubectl top pods -n ai-workspace   # requires metrics-server
kubectl describe pod <chat-api-pod> -n ai-workspace | grep -A2 QoS
```

Now reproduce a real OOMKill deliberately — drop the memory limit far below what `chat-api` actually needs (e.g. `16Mi`) and redeploy. Full guide: [`labs/ch12/`](../../labs/ch12/). Code: `git checkout ch12` in [`project/`](../../project/).

## 🔬 Under the Hood

```bash
kubectl get pod <chat-api-pod> -n ai-workspace -o jsonpath='{.status.containerStatuses[0].lastState}'
```

Look for `reason: OOMKilled` and `exitCode: 137` — `137` is `128 + 9`, meaning the container was terminated by signal `9` (`SIGKILL`), which is exactly what the kernel's out-of-memory killer sends. This isn't a Kubernetes-invented number; Kubernetes is just surfacing what the Linux kernel itself decided.

## 🧰 Production Notes

Setting limits far higher than actual usage "to be safe" defeats the purpose — it wastes cluster capacity, since the Scheduler reserves based on requests, and no other Pod can use resources reserved-but-unused by one that overestimated. The healthy pattern: measure real usage with `kubectl top` (or a real load test) before setting these numbers, not guess.

## 🐞 Debug Lab

With the deliberately-too-low memory limit from Hands-on still applied, use `kubectl describe pod` and `kubectl get events -n ai-workspace --sort-by=.lastTimestamp` to trace the full sequence — from the container's memory usage climbing to the exact moment it's killed and replaced — before checking [`incidents/ch12/`](../../incidents/ch12/).

## 💬 Interview Questions

- What's the practical difference between a CPU limit being hit and a memory limit being hit?
- What determines a Pod's QoS class, and why does it matter during a Node under resource pressure?
- Why does the Scheduler care about requests but largely ignore limits when placing a Pod?
- What does exit code 137 mean, and where does that number actually come from?

## 🚀 Challenge

See [`challenges/ch12/`](../../challenges/ch12/) (easy → expert) — including deliberately building a `Guaranteed`-class Pod, then a `BestEffort` one, and simulating Node memory pressure to see which one Kubernetes evicts first.
