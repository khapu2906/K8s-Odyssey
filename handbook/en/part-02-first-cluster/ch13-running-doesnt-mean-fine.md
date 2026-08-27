# Chapter 13 — Running Doesn't Mean Fine

## Later that afternoon

One worry lighter after this morning's Secret detour, you flip back through the notes, figuring you'd pick off another easy one from what's left:

```
Need health checks
→ two kinds of checks, "liveness probe" (still alive or not,
restart if dead) and "readiness probe" (ready to take requests
yet or not, pause routing traffic if not, no restart needed)
```

Three weeks ago that only landed as a concept. Now you actually look up how the two get written in YAML.

```bash
kubectl explain deployment.spec.template.spec.containers.livenessProbe
```

```
KIND:     Deployment
VERSION:  apps/v1

FIELD:    livenessProbe <Object>

DESCRIPTION:
    Periodic probe of container liveness. Container will be restarted
    if the probe fails.

    FIELDS:
      httpGet	<Object>
      exec	<Object>
      tcpSocket	<Object>
      initialDelaySeconds	<integer>
      periodSeconds	<integer>
```

`httpGet` — calls into an existing HTTP route, literally. `chat-api` has had a `/health` route since you first read through `index.js` those early days, never used for anything. Now there's finally a reason for it.

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```

No image rebuild needed — the route's been there all along, just never called. You add both to `chat-api-deployment.yaml`, apply again.

```bash
kubectl apply -f chat-api-deployment.yaml
```

```
deployment.apps/chat-api configured
```

```bash
kubectl describe pod chat-api-7d8f9c6b4d-2q8fn -n ai-workspace | grep -A1 "Liveness\|Readiness"
```

```
Liveness:   http-get http://:8080/health delay=5s timeout=1s period=10s #success=1 #failure=3
Readiness:  http-get http://:8080/health delay=5s timeout=1s period=10s #success=1 #failure=3
```

Matches what you declared. `#failure=3` — has to miss three times in a row before it's actually considered broken, not counted dead over one random lag spike.

Remembering the habit from the past few days — whenever something's uncertain, just go break it yourself and see — you want to watch these two probes react to something real. Delete `postgres` again, same move as Chapter 10, except this time you're not worried about losing data (the PVC's there now), just curious how `chat-api` handles it.

```bash
kubectl delete pod -n ai-workspace -l app=postgres
```

```bash
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

```bash
curl -s http://localhost:8080/health
```

```json
{"status":"ok"}
```

`ok`. Even while `postgres` is mid-restart. You try one more:

```bash
curl -s http://localhost:8080/api/conversations
```

```
Internal Server Error
```

The route that actually touches the database fails, but `/health` stays green — because `/health` in the code just returns `{"status": "ok"}` directly, never touching Postgres at all. You see it now: the two probes you just added only check "is the process alive, is it listening on HTTP," not "can it actually do its job." If `postgres` stayed down for days, `chat-api` would keep reporting `Running`, `READY 1/1`, nobody would bother restarting anything, even while every real request kept failing.

You consider changing `/health` to actually query Postgres, but stop yourself in time — recalling, from one of those blog posts the night you read that README, a warning about exactly this: a health check that reaches into the database risks a cascade — Postgres gets slow for one moment, and every Pod gets marked down at once, right when the system needs to hold together the most. You don't touch it, just write the limitation down as a known one.

```bash
kubectl get pods -n ai-workspace
```

```
NAME                          READY   STATUS    RESTARTS   AGE
chat-api-7d8f9c6b4d-2q8fn     1/1     Running   0          6d
chat-api-7d8f9c6b4d-9tqlr     1/1     Running   0          6d
chat-api-7d8f9c6b4d-kd82x     1/1     Running   0          6d
postgres-6b7d4f8c9-p3wln      1/1     Running   0          14s
```

All three `chat-api` Pods still `1/1`, none of them marked down — exactly as just seen, because `/health` has no idea `postgres` just died and came back.

You open the notes, cross off one more easy line from the list.

```
Need health checks ✓ liveness + readiness, both pointed at
/health — only knows "process is alive," NOT "still able to
do its job." Postgres died, chat-api stayed green 1/1, every
real request kept failing anyway. Making /health check the DB
itself risks a cascade when the DB gets slow — leaving it as
is, knowing the limitation is enough for now.
```

Nine lines three weeks ago, seven of them checked off now. Exactly two left: scheduling, and the `???` nobody's touched yet — observability.
