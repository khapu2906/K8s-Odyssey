# Chapter 6 — Ran For 12 Seconds

## Still that morning

The `chat-api-pod.yaml` file is still empty. You open `docker-compose.yml` next to it to compare, then start typing.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: chat-api
  namespace: ai-workspace
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

Not that different from `docker-compose.yml` — same image, same port, same environment variable. Easier than you'd imagined.

```bash
kubectl apply -f chat-api-pod.yaml
```

```
pod/chat-api created
```

```bash
kubectl get pods -n ai-workspace
```

```
NAME       READY   STATUS         RESTARTS   AGE
chat-api   0/1     ErrImagePull   0          8s
```

Not what you expected. You `describe` it.

```bash
kubectl describe pod chat-api -n ai-workspace
```

```
Events:
  Type     Reason   Age               From     Message
  ----     ------   ----              ----     -------
  Normal   Pulling  6s (x2 over 8s)   kubelet  Pulling image "ai-workspace/chat-api:dev"
  Warning  Failed   4s (x2 over 6s)   kubelet  Failed to pull image "ai-workspace/chat-api:dev": failed to resolve reference: docker.io/ai-workspace/chat-api:dev: not found
  Warning  Failed   4s (x2 over 6s)   kubelet  Error: ErrImagePull
```

`docker.io` — kubelet is trying to pull this image from Docker Hub, as if it were some public image somebody published. But you built this image on your own machine, never pushed it anywhere. You check whether it actually exists on the machine, under that exact name.

```bash
docker images | grep chat-api
```

```
project-chat-api   latest   83d2fa3ec246   2 days ago   208MB
```

Not `ai-workspace/chat-api:dev` like the YAML says. It's `project-chat-api:latest`. You remember now — this image was built back on day one, via `docker compose up --build`, and Compose auto-names images following the formula `<project-folder-name>-<service-name>`. The project folder is called `project`, the service is `chat-api`, so you get `project-chat-api`. Nothing to do with the name you typed in the Pod YAML — you just typed something that sounded reasonable, without checking what the image was actually called.

That auto-generated name also depends on the folder name — someone else cloning the repo into a differently-named folder gets a different name entirely. Not something you can rely on for a YAML file meant to be shared. The right move is to name it explicitly at build time.

```bash
docker build -t ai-workspace/chat-api:dev ./chat-api
```

```
[+] Building 4.2s (10/10) FINISHED
 => => naming to docker.io/ai-workspace/chat-api:dev
```

Correct name now. Still one problem left: `kind` doesn't share a container runtime with Docker/OrbStack on the host machine — it has its own image store, inside the containers simulating nodes. Docker Compose can see this image because it talks straight to the machine's Docker daemon; `kind` doesn't, unless you explicitly hand the image over.

```bash
kind load docker-image ai-workspace/chat-api:dev --name ai-workspace
```

```
Image: "ai-workspace/chat-api:dev" with ID "sha256:a3f8c9e2b1d4..." not yet
present on node "ai-workspace-control-plane", loading...
```

Not an error — `kind` is just saying plainly what it's doing: the node doesn't have this image yet, so it's copying it in. Done a few seconds later.

```bash
kubectl get pods -n ai-workspace -w
```

```
NAME       READY   STATUS    RESTARTS   AGE
chat-api   1/1     Running   0          1m42s
```

`Running`. AGE is still counting from the original `apply` — same Pod, nothing got deleted and recreated, it just finally managed to pull the right image. You grin, leave the `-w` window running — literally, `-w` is watch after all.

Twelve seconds later, the line changes.

```
NAME       READY   STATUS             RESTARTS   AGE
chat-api   0/1     CrashLoopBackOff   1          12s
```

The grin disappears. You leave that window running, open another terminal.

```bash
kubectl describe pod chat-api -n ai-workspace
```

Scroll down to `Events` at the bottom — a habit picked up from last night's pile of blog posts, every single one repeating the same line: `describe` first when something's wrong, don't guess.

```
Events:
  Type     Reason     Age                From     Message
  ----     ------     ----               ----     -------
  Normal   Scheduled  114s               default-scheduler  Successfully assigned ai-workspace/chat-api to ai-workspace-control-plane
  Normal   Pulled     19s                kubelet            Container image "ai-workspace/chat-api:dev" already present on machine
  Normal   Created    19s                kubelet            Created container chat-api
  Normal   Started    19s                kubelet            Started container chat-api
  Warning  BackOff    5s (x2 over 13s)   kubelet            Back-off restarting failed container
```

Doesn't say specifically what's wrong — just that the container started, then died on its own, and is now in "back off" before trying again. To know why it died, you need the container's own logs.

```bash
kubectl logs chat-api -n ai-workspace
```

```
chat-api listening on port 8080
Postgres not ready yet (attempt 1/10), retrying in 1000ms...
Postgres not ready yet (attempt 2/10), retrying in 1000ms...
...
Postgres not ready yet (attempt 10/10), retrying in 1000ms...
Error: getaddrinfo ENOTFOUND postgres
```

Ah. Not a bug in `chat-api`. `ENOTFOUND` — not "connection refused," but DNS never even found the name `postgres` in the first place. Which makes sense, because you never created `postgres` anywhere in this cluster — it's just `chat-api`, alone, looking for a database that doesn't exist, not even a name to resolve. Ten retries, then it gives up, exits, kubelet sees the container die and restarts it, and the exact same thing happens again.

You type one more thing, just to be sure.

```bash
kubectl get pods -n ai-workspace -w
```

```
chat-api   0/1   CrashLoopBackOff   3   47s
chat-api   1/1   Running            4   61s
chat-api   0/1   CrashLoopBackOff   4   73s
```

Over and over. Run — die — wait — run again. Exactly what Martin said the night before: container dies, a new one takes its place automatically, no one has to type a command. You're watching it happen, a hundred percent for real.

But there's a question you haven't answered yet: what's actually self-healing here — the *container*, or the *Pod*? They sound the same, but they're not. You try deleting the whole Pod — not killing the container inside it this time, but the unit that contains it.

```bash
kubectl delete pod chat-api -n ai-workspace
kubectl get pods -n ai-workspace
```

```
No resources found in ai-workspace namespace.
```

Empty. Nothing recreates it.

Oh. So this whole time, what was self-healing was **kubelet** — running right on this machine, doing exactly one job: look at the Pods assigned to it, and if a container inside one dies, restart that exact container, inside that exact Pod. Just the one job. It never creates a new Pod on its own. Only restarts what already exists.

What last night's README described is a different thing entirely: something standing outside the Pod, counting whether enough of them exist, creating a new one from scratch if the count comes up short. The `chat-api` Pod you just deleted had nothing like that watching from outside — no ReplicaSet, no Deployment, nothing but one lone Pod. Delete it, and nobody notices anything's missing — because nobody was counting.

You open the notes, right below the old line:

```
chat-api needs postgres first.
Pod dies = gone for good, doesn't respawn on its own —
need something sitting above Pod to handle that (probably
ReplicaSet and Deployment, from that earlier note?)
```
