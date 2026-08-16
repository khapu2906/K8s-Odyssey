# Chapter 9 — One Question, One Answer

## That afternoon

Fed and back in the chair, you open the terminal exactly as you left it — three `chat-api` Pods, one `postgres` Pod, still all green. But staring at a table full of `Running` doesn't actually prove anything. The machine says it's up; whether the app can actually answer a question is still unknown.

You want to try it yourself. Ask a real question, see if a real answer comes back.

First problem: `chat-api` doesn't have a `Service` like `postgres` does. It doesn't need one — nothing inside the cluster calls `chat-api`, only `chat-api` calling out to `postgres`. But right now you're standing outside the cluster, on the laptop itself, wanting to call in. Curling the Pod's address directly won't work — that IP is only visible inside the cluster.

You run `kubectl --help` again, this time noticing a different section entirely, under `Troubleshooting and Debugging Commands`:

```
  port-forward    Forward one or more local ports to a pod
```

Exactly what's needed. Open one terminal window, leave it there.

```bash
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

```
Forwarding from 127.0.0.1:8080 -> 8080
Forwarding from [::1]:8080 -> 8080
```

No need to know which of the three Pods it picked — `kubectl` handles that part, you just get one port on your machine wired straight into a port inside the cluster. Open a second terminal, leave the first one running.

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello, anyone there"}'
```

```json
{"id":1,"message":"hello, anyone there","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-15T09:42:11.203Z"}
```

You laugh. Not the answer you were hoping for, but it *did* answer — just no document handed to it yet, so it's being honest about that instead. Matches exactly what you read in `answer.js` those first days: no `documentText`, no dice, politely declines.

What catches your eye isn't the reply — it's `id: 1`. A row just got created, actually stored somewhere, not just floating in the process's RAM before evaporating. You check.

```bash
curl -s http://localhost:8080/api/conversations
```

```json
[{"id":1,"message":"hello, anyone there","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-15T09:42:11.203Z"}]
```

Still there. You send another one, completely different, just to rule out coincidence.

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"can cats fly"}'
```

```json
{"id":2,"message":"can cats fly","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-15T09:44:57.881Z"}
```

`id: 2`. You hit `/api/conversations` again, both rows there now, right order, right content. An HTTP request from your laptop, through `port-forward`, into whichever of the three `chat-api` Pods happened to answer, that Pod calling out through the name `postgres` — the Service you created this morning — landing on the exact `postgres` Pod holding the data, writing it down, handing it back. One unbroken chain, running like a real system, even though it's still just a laptop.

You take a screenshot, text Martin.

```
You
> yo it actually works now
> chat-api talks, saves to postgres properly
> all inside k8s, not compose anymore
[image attached]
```

```
Martin
> nice
> keep going, don't get too excited yet though :))
```

You don't ask what he means by that last part. Leave it for tomorrow.

You close the `port-forward` terminal, run `kubectl get pods -n ai-workspace` one last time before shutting the laptop. Still four Pods, still green, `RESTARTS` hasn't ticked up once since earlier. You shut it down, something loosened in your chest — first time in three days everything actually *works*, not just looks like it's working.
