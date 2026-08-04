# Chapter 11 — Liveness, Readiness & Startup Probes

**Part III — Making the Project Real**

**Tier:** Tier 1 — Core

**Touches `project/` code:** Yes — tag `ch11`.

---

## 🎯 Mission

Replay Chapter 8's rollout, but imagine the new version of `chat-api` starts successfully — the process runs, the container stays up — but it can't actually reach Postgres yet because of a slow connection pool warm-up. Kubernetes only knows "is the container process alive," so it happily routes users straight into a Pod that returns errors on every request. "Running" and "able to do its job" are different questions, exactly as Chapter 3 predicted, and Kubernetes needs to be told how to ask the second one.

## 📖 Theory

Three probe types, each answering a different question, all configured the same way (an HTTP GET, a TCP check, or a command to run inside the container):

- **Liveness probe** — "is this container stuck?" If it fails repeatedly, the kubelet **restarts the container**. Use it to recover from real deadlocks, not slow startups.
- **Readiness probe** — "can this container serve traffic right now?" If it fails, the Pod is **removed from the Service's EndpointSlice** (Chapter 9) — no restart, just temporarily taken out of rotation until it passes again.
- **Startup probe** — "has this container finished starting yet?" While it's failing, liveness and readiness probes are held off entirely. This exists specifically for slow-starting applications, so a legitimately long startup doesn't get mistaken for a deadlock and killed mid-boot.

The distinction that trips people up most: **liveness failing kills the container; readiness failing just stops sending it traffic.** A slow database connection should almost always be a readiness problem, not a liveness one — killing and restarting a Pod that just needs a few more seconds doesn't fix anything, it just restarts the clock.

## 🛠 Hands-on

Redeploy Chapters 7, 9, and 10's `chat-api` setup first, then add probes:

```yaml
        readinessProbe:
          httpGet:
            path: /healthz/ready
            port: 8080
          initialDelaySeconds: 2
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /healthz/live
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
          failureThreshold: 3
```

```bash
kubectl apply -f chat-api-deployment.yaml
kubectl get pods -n ai-workspace -w
kubectl describe pod <chat-api-pod> -n ai-workspace   # look at the Conditions section
```

Full guide: [`labs/ch11/`](../../labs/ch11/). Code: `git checkout ch11` in [`project/`](../../project/) — this tag also adds the `/healthz/live` and `/healthz/ready` endpoints to `chat-api` itself.

## 🔬 Under the Hood

Probes are run by the **kubelet** (Chapter 4) on the Node where the Pod lives — not the API Server, and not some central controller. That's why probe failures show up in `kubectl describe pod` events almost instantly: it's a local check, reported straight from the Node. A readiness failure updates the Pod's `Ready` condition, which the EndpointSlice controller (Chapter 9) is watching — that's the exact mechanism that pulls an unready Pod out of load-balancing rotation without touching the container at all.

## 🧰 Production Notes

A liveness probe that's too aggressive (too short a timeout, too few retries) is one of the most common self-inflicted outages in real Kubernetes clusters — the app is fine, just briefly slow (garbage collection, a slow query), and the liveness probe kills it mid-request, causing the exact instability it was meant to prevent. When in doubt, prefer a readiness probe and a generous `failureThreshold` on liveness.

## 🐞 Debug Lab

Set the liveness probe's `initialDelaySeconds` to `0` and `failureThreshold` to `1`, against an app that genuinely takes a few seconds to boot. Redeploy and watch what happens with `kubectl get pods -w` and `kubectl describe pod`. Work out exactly why, then compare with [`incidents/ch11/`](../../incidents/ch11/).

## 💬 Interview Questions

- What's the practical difference between a failed liveness probe and a failed readiness probe?
- Why does `startupProbe` exist when you already have `initialDelaySeconds` on the other probes?
- Which component actually executes probes, and how does a readiness failure end up removing a Pod from a Service?
- Give a real scenario where using liveness instead of readiness would make an outage worse, not better.

## 🚀 Challenge

See [`challenges/ch11/`](../../challenges/ch11/) (easy → expert) — including adding a `startupProbe` to a deliberately slow-booting version of `chat-api` and proving it prevents a premature liveness restart.
