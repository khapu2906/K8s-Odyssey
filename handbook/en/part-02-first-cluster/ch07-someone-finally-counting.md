# Chapter 7 — Someone's Finally Counting

## Still that morning

The note from last night/this morning is still open:

```
need something sitting above Pod to handle that (probably
ReplicaSet and Deployment, from that earlier note?)
```

You flip back to the notes file from the night you read the README — the part where you matched each "Need..." line against its real name. Right, it's there: `ReplicaSet` is the thing that counts containers. `Deployment` wraps around `ReplicaSet`, handles the update part on top. No need to write `ReplicaSet` by hand — just write `Deployment`, and it creates the `ReplicaSet` underneath.

You leave `chat-api-pod.yaml` alone, create a new file: `chat-api-deployment.yaml`.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-api
  namespace: ai-workspace
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat-api
  template:
    metadata:
      labels:
        app: chat-api
    spec:
      containers:
        - name: chat-api
          image: ai-workspace/chat-api:dev
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              value: postgres://postgres:postgres@postgres:5432/aiworkspace
```

The `spec.template` part is identical to the old Pod, just nested one level deeper. `replicas: 3` is the one genuinely new line that matters. You delete the old bare Pod first, to avoid a name clash.

```bash
kubectl delete pod chat-api -n ai-workspace
kubectl apply -f chat-api-deployment.yaml
```

```
deployment.apps/chat-api created
```

Wanting to see all the layers at once, you remember `kubectl --help` showed an example of listing several resource types separated by commas. Worth trying.

```bash
kubectl get deployments,replicasets,pods -n ai-workspace
```

```
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/chat-api   0/3     3            0           6s

NAME                                  DESIRED   CURRENT   READY   AGE
replicaset.apps/chat-api-7d8f9c6b4d   3         3         0       6s

NAME                              READY   STATUS             RESTARTS   AGE
pod/chat-api-7d8f9c6b4d-2xvqk     0/1     CrashLoopBackOff   1          6s
pod/chat-api-7d8f9c6b4d-8mznw     0/1     CrashLoopBackOff   1          6s
pod/chat-api-7d8f9c6b4d-r4jkl     0/1     CrashLoopBackOff   1          6s
```

Three lines, not one. You wrote one YAML file, ran one `apply`, and now there are three Pods, one ReplicaSet, one Deployment — three layers, automatically generated top-down.

Still `CrashLoopBackOff` on all three — of course, `postgres` still doesn't exist, that's a separate problem for later. But there's something you want to try right now, before worrying about Postgres.

```bash
kubectl get pods -n ai-workspace
```

```
NAME                          READY   STATUS             RESTARTS   AGE
chat-api-7d8f9c6b4d-2xvqk     0/1     CrashLoopBackOff   3          58s
chat-api-7d8f9c6b4d-8mznw     0/1     CrashLoopBackOff   3          58s
chat-api-7d8f9c6b4d-r4jkl     0/1     CrashLoopBackOff   3          58s
```

You pick one at random, delete it outright — same thing you did earlier this morning, just with a Deployment standing behind it this time.

```bash
kubectl delete pod chat-api-7d8f9c6b4d-2xvqk -n ai-workspace
kubectl get pods -n ai-workspace -w
```

```
chat-api-7d8f9c6b4d-2xvqk     0/1     Terminating        3          71s
chat-api-7d8f9c6b4d-8mznw     0/1     CrashLoopBackOff   3          71s
chat-api-7d8f9c6b4d-r4jkl     0/1     CrashLoopBackOff   3          71s
chat-api-7d8f9c6b4d-x9wtp     0/1     Pending            0          0s
chat-api-7d8f9c6b4d-x9wtp     0/1     ContainerCreating  0          1s
```

Less than a second after the old one vanished, a brand new name shows up — `x9wtp`, not `2xvqk` brought back to life, but a completely different Pod, fresh, built from the exact same `spec.template`. This is exactly what was missing earlier: delete the whole Pod, and something else grows in its place — because this time, something is actually *counting*.

You check the `ReplicaSet` to be sure.

```bash
kubectl describe replicaset -n ai-workspace | grep -A2 "Pods Status"
```

```
Pods Status:  0 Running / 3 Waiting / 0 Succeeded / 0 Failed
```

It doesn't care which Pod is named what. It cares about exactly one number: `3`. Short, it creates. Over, it deletes. Names don't matter — as long as the total always matches whatever `replicas` says.

You open the notes again, cross out the old line, write a new one:

```
need something sitting above Pod to handle that ✓ ReplicaSet
(inside a Deployment) — doesn't track "which specific Pod,"
tracks exactly ONE number. Postgres still isn't done, that's
next.
```
