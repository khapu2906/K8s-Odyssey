# Chapter 8 — A Name That Doesn't Change

## Near noon

Your stomach starts complaining, but you don't want to stop yet. You open the notes again, read the last line you wrote: `postgres` still doesn't exist in the cluster.

`docker-compose.yml` is still open next to it. You look at the `postgres` section in there — image `postgres:16`, two environment variables, `POSTGRES_PASSWORD` and `POSTGRES_DB`, port `5432`. Nothing unfamiliar, same formula you already used for `chat-api`: write a Deployment, same image, same env, same port.

But there's one question you have to answer before typing anything: how many `replicas`? `chat-api` got `3` because every copy is identical, none of them holds onto anything. Postgres is different — three postgres copies running side by side would each write to its own separate disk, three different sources of truth, none of them in sync with each other. You don't yet know how to make three copies share one storage location. Leave it at `1` for now, add a line to the notes: "postgres at 1 replica is temporary, haven't figured out shared storage yet, later."

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: ai-workspace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_PASSWORD
              value: postgres
            - name: POSTGRES_DB
              value: aiworkspace
```

About to save the file, you stop. `chat-api` calls the database at `postgres:5432` — that name has to point somewhere. A Deployment by itself has no name anyone else can call — the Pods inside are all named something like `postgres-6d8f...-x7k2p`, changing every time one gets deleted and recreated, exactly like `chat-api` this morning. Something else is needed.

Old habit kicks in — not sure what a name actually is, `explain` it first instead of guessing.

```bash
kubectl explain service
```

```
KIND:     Service
VERSION:  v1

DESCRIPTION:
    Service is a named abstraction of software service (for example, mysql)
    consisting of local port (for example 3306) that the proxy listens on,
    and the selector that determines which pods will answer requests sent
    through the proxy.
```

"Named abstraction" — plain terms, a name standing in for a whole group of Pods. "Selector" — decides which Pod answers when a request comes in for that name. Exactly what's missing: a layer in between, holding the name `postgres` fixed, while whichever actual Pod sits behind that name is something it handles on its own — `chat-api` never needs to know.

You remember, from one of last night's cluster-setup blog posts, a few sample files bundling multiple resources into a single file with a `---` separator instead of splitting them apart. Worth trying now — keep writing right below, no new file.

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: ai-workspace
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

`port` and `targetPort` look redundant since they match, but they don't have to. `port` is what the Service itself listens on — what `chat-api` will actually call through the name `postgres:5432`. `targetPort` is the real port the `postgres` container has open inside the Pod. The two numbers could easily differ, with the Service translating between them — they only happen to match here because Postgres listens on `5432` anyway, so it's written the same for simplicity.

Save it as `postgres.yaml` — one file, two resources.

```bash
kubectl apply -f postgres.yaml
```

```
deployment.apps/postgres created
service/postgres created
```

Two lines, exactly the two things you just wrote. You check that both actually landed, using the comma syntax you learned yesterday.

```bash
kubectl get deployments,pods,svc -n ai-workspace
```

```
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/chat-api    0/3     3            0           4h
deployment.apps/postgres    1/1     1            1           22s

NAME                              READY   STATUS             RESTARTS   AGE
pod/chat-api-7d8f9c6b4d-8mznw     0/1     CrashLoopBackOff   47         4h
pod/chat-api-7d8f9c6b4d-r4jkl     0/1     CrashLoopBackOff   47         4h
pod/chat-api-7d8f9c6b4d-x9wtp     0/1     CrashLoopBackOff   46         4h
pod/postgres-5f8b9d7c6-vn2kt      1/1     Running            0          22s

NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
postgres     ClusterIP   10.96.142.88    <none>        5432/TCP   22s
```

`postgres` comes up `Running` right away. `svc/postgres` is there too, with its own internal IP address, `10.96.142.88` — something you've never seen anyone mention before. Curious, you look closer.

```bash
kubectl describe svc postgres -n ai-workspace
```

```
Name:              postgres
Namespace:         ai-workspace
Selector:          app=postgres
Type:              ClusterIP
IP:                10.96.142.88
Port:               5432/TCP
TargetPort:         5432/TCP
Endpoints:          10.244.0.23:5432
```

`Selector: app=postgres` — the same `matchLabels` mechanism already seen on the Deployment and the ReplicaSet, just used differently this time: instead of counting, it goes and finds whichever Pod currently carries that label, then writes that Pod's real address into `Endpoints`. `10.244.0.23` is the actual IP of the Pod `postgres-5f8b9d7c6-vn2kt` above. `10.96.142.88` is the stable one — the address `chat-api` will actually call, not the Pod's real address.

One thing you almost got wrong: this Service has no idea the Deployment `postgres` even exists. It just scans the whole namespace for any Pod carrying the label `app: postgres`, and writes it into `Endpoints` — it doesn't care whether that Pod came from a Deployment, a StatefulSet, or a bare Pod you `apply`'d by hand. The match between the Service and the `postgres` Deployment this morning only exists because you set the same label, `app: postgres`, in both places yourself — `template.metadata.labels` on the Deployment, `selector` on the Service. Kubernetes doesn't infer this connection for you; change the label on one side and forget the other, and `Endpoints` goes empty instantly, even while the Deployment keeps showing `1/1` like nothing happened.

So that's how it works — nowhere in Kubernetes do components point straight at each other by name or ID. They map through labels. A ReplicaSet finds its Pods through labels. A Service finds its Pods through labels, the exact same way. Nothing calls another object's name directly — matching labels connect automatically, and wrong or missing labels leave two things sitting right next to each other knowing nothing about one another.

You realize now where the whole morning's problem was. `chat-api` wasn't typing the wrong address. Nobody was ever standing behind the name `postgres` at all — with no Service, the internal DNS had nothing to look up, no matter how correctly you spelled it, it was always going to come back `ENOTFOUND`. Now the name has an owner — even if the `postgres` Pod behind it dies and comes back with a new IP a dozen times, the name `postgres` will always point to the right place, `Endpoints` updating on its own each time.

`chat-api` is still `CrashLoopBackOff`, RESTARTS already at 47 — these Pods keep dying and waiting, the gap between retries stretched out fairly long by now. You could just wait for the next retry window, but you remember the lesson from earlier: the ReplicaSet doesn't care which Pod is named what, only that the count is right. So why wait — delete the three hanging ones now, let the ReplicaSet spin up fresh copies immediately, now that `postgres` is actually ready.

```bash
kubectl delete pod -n ai-workspace -l app=chat-api
```

```
pod "chat-api-7d8f9c6b4d-8mznw" deleted
pod "chat-api-7d8f9c6b4d-r4jkl" deleted
pod "chat-api-7d8f9c6b4d-x9wtp" deleted
```

`-l app=chat-api` — select by label instead of typing each Pod name one by one, the exact label you just saw in `describe svc` a minute ago, turns out it's useful somewhere else too. The three old Pods vanish, three new ones come up in their place immediately.

```bash
kubectl get pods -n ai-workspace -w
```

```
chat-api-7d8f9c6b4d-2q8fn     0/1     ContainerCreating   0          2s
chat-api-7d8f9c6b4d-2q8fn     0/1     Running              0          4s
chat-api-7d8f9c6b4d-2q8fn     1/1     Running              0          6s
```

`1/1 Running`. No crash. You wait another ten seconds, no state change, breathe out, check the log just to be sure.

```bash
kubectl logs chat-api-7d8f9c6b4d-2q8fn -n ai-workspace
```

```
Postgres not ready yet (attempt 1/10), retrying in 1000ms...
chat-api listening on port 8080
```

Exactly one retry — `chat-api` came up right as `postgres` was still a millisecond away from accepting connections, one retry and it's through, not ten in a row followed by giving up like this morning. You check the other two, same shape of log, same `1/1 Running`.

You open the notes again, cross off another line.

```
Need networking / service discovery ✓ Service — hands out
a fixed internal name + IP, always pointing at whichever
Pod currently carries the matching label via Endpoints,
Pod dying/changing doesn't touch the name. postgres running
at 1 replica, no shared storage yet — different problem,
later.
```

Stomach still complaining. This time you actually get up, go find something to eat, leave the terminal exactly as it is — three `chat-api` Pods, one `postgres` Pod, all green.
