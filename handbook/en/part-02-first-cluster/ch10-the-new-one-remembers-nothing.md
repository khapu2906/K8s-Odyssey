# Chapter 10 — The New One Remembers Nothing

## The next morning

You get in earlier than usual, still riding yesterday's win. The terminal's still open exactly as left, four Pods still green, AGE now counted in hours instead of seconds like that first day.

```bash
kubectl get pods -n ai-workspace
```

```
NAME                              READY   STATUS    RESTARTS   AGE
chat-api-7d8f9c6b4d-2q8fn         1/1     Running   0          18h
chat-api-7d8f9c6b4d-9tqlr         1/1     Running   0          18h
chat-api-7d8f9c6b4d-kd82x         1/1     Running   0          18h
postgres-5f8b9d7c6-vn2kt          1/1     Running   0          22h
```

There's a question left over from yesterday: `chat-api` dies, comes back on its own — you've seen that with your own eyes twice now. `postgres` — you've only ever seen it come up `Running` the first time, never actually tested whether deleting it does the same thing. Might as well be sure.

```bash
kubectl delete pod postgres-5f8b9d7c6-vn2kt -n ai-workspace
```

```
pod "postgres-5f8b9d7c6-vn2kt" deleted
```

```bash
kubectl get pods -n ai-workspace -w
```

```
postgres-5f8b9d7c6-qz8mn   0/1   ContainerCreating   0   2s
postgres-5f8b9d7c6-qz8mn   0/1   Running              0   4s
postgres-5f8b9d7c6-qz8mn   1/1   Running              0   7s
```

Seven seconds. Faster than you expected. Exactly what the ReplicaSet promised — one short, one created, different name, count always right. You smile, treat it as the last box left to check, open another terminal to confirm `chat-api` can still talk to this new `postgres`, same way as yesterday afternoon.

```bash
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

```bash
curl -s http://localhost:8080/api/conversations
```

```
Internal Server Error
```

Not the two-item array you expected. Not an empty array either. One short line, no further explanation. You `logs` the `chat-api` Pod sitting behind the `port-forward` to see what actually happened.

```bash
kubectl logs chat-api-7d8f9c6b4d-2q8fn -n ai-workspace --tail 20
```

```
error: relation "conversations" does not exist
```

Your stomach drops. The `conversations` table — the one holding both questions from yesterday afternoon — doesn't exist anymore. Not a connection error, not a wrong name, the table simply isn't there, as if it had never been created at all. You go straight into the new `postgres` Pod, reaching for the same `exec` habit left over from Docker days, typed the same way now through `kubectl`.

```bash
kubectl exec -it postgres-5f8b9d7c6-qz8mn -n ai-workspace -- psql -U postgres -d aiworkspace -c "\dt"
```

```
Did not find any relations.
```

Empty. Not a single table. As if you'd just connected to a brand new Postgres that no `chat-api` had ever touched, that had never been asked "hello, anyone there" or "can cats fly." Because that's exactly what it is.

You sit still a moment, piecing it together. The old `postgres` Pod wasn't deleted the way `chat-api`'s container died and restarted itself last week — that was a container inside a Pod dying and coming back. This time the whole Pod got deleted outright. The ReplicaSet saw one missing, created one to replace it, exactly as promised. But that new Pod is a completely fresh Postgres container, started from the same `postgres:16` image, and inside that image, the data directory starts out empty — everything Postgres ever writes while running lives in that one container's own writable layer. The old container is gone, that layer went with it, nothing about it was ever separate from the container's own lifespan.

You see what you got wrong yesterday. The ReplicaSet keeps *a* Pod named `postgres` running in `ai-workspace`, keeps port `5432` open, keeps the Service pointed at the right place — all of that held up exactly as promised, not a word of it broke. It just never promised to keep the *contents* inside. `chat-api` came back without losing anything because it never held anything to lose — all the state it needs lives in Postgres. `postgres` is the one actually holding that state, and nothing was standing behind it to hold onto its own.

You open the notes, don't cross anything off, just add a new line, blunter than the ones before it:

```
deleting the postgres Pod wipes everything, even the table
itself is gone — the data lives inside the container, nothing
separates it out. ReplicaSet only guarantees the COUNT, not
the CONTENTS. need something that outlives the Pod, attached
from outside instead of living inside it.
```

You sit back, none of yesterday's ease left in you. But this time, at least, you know exactly what question needs answering next.
