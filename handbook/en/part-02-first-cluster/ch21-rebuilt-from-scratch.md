# Chapter 21 — Rebuilt From Scratch

## That weekend

Last night's note is still sitting there: need a way for someone outside the cluster to reach in, without needing `kubectl`. You find the right name for it: `Ingress`.

```bash
kubectl explain ingress
```

```
KIND:     Ingress
VERSION:  networking.k8s.io/v1

DESCRIPTION:
    Ingress is a collection of rules that allow inbound connections to
    reach the endpoints defined by a backend.
```

A bit more reading, and it clicks — `Ingress` is just **rules**. It doesn't run anything on its own; it needs an `Ingress Controller` (usually a dedicated Nginx build for exactly this) actually sitting there, listening on port 80/443, reading the rules, and routing requests to the right Service.

### A trap that only shows up on `kind`

Looking up how to install `ingress-nginx` for `kind`, a warning shows up right away in the official docs: a normal `kind` cluster does **not** open port 80/443 to the host machine — for the Ingress Controller to actually be reachable from outside the node container, the cluster has to be created with special config, declaring `extraPortMappings` right from the `kind create cluster` command itself.

The current cluster was created back that first morning, with exactly one line:

```bash
kind create cluster --name ai-workspace
```

No `extraPortMappings` at all. There's no `kind` command to "add" port mappings to a cluster that already exists — that config is only ever read once, at cluster creation. To get it, this cluster has to be deleted and recreated from scratch.

Something tightens in your chest. This cluster has been alive for 3 weeks, holding real Postgres data now — not the empty test data from back at the start.

### Back it up before doing anything reckless

```bash
kubectl exec -it postgres-6b7d4f8c9-p3wln -n ai-workspace -- \
  pg_dump -U postgres aiworkspace > backup.sql
```

A plain text `.sql` file, containing every `users`, `documents`, `conversations` row that currently exists. Open the first few lines, familiar `INSERT` statements right there.

### Delete the cluster, recreate it with the right config

```bash
kind delete cluster --name ai-workspace
```

```
Deleting cluster "ai-workspace" ...
```

No going back now — the cluster's gone, along with every Pod, every Service, everything typed by hand over the past 3 weeks. Write a new config file, `kind-config.yaml`:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      - containerPort: 443
        hostPort: 443
        protocol: TCP
```

```bash
kind create cluster --name ai-workspace --config kind-config.yaml
```

A brand new cluster, completely empty — no `ai-workspace` namespace, no Deployment, nothing at all, exactly like that first morning setting up this cluster.

### Rebuilding everything — and finding out it's easier than expected

```bash
kubectl create namespace ai-workspace
kubectl apply -f postgres-secret.yaml -f chat-api-secret.yaml
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres.yaml
kubectl apply -f redis.yaml
kubectl apply -f chat-api-deployment.yaml
kubectl apply -f frontend-deployment.yaml
```

No need to remember what was configured — it's all still sitting in the `.yaml` files written over the past 3 weeks, one file per object, one `apply` per line. Exactly what got learned back when writing YAML files first started: write the file first, `apply` second — only now does the real value of that show up. The cluster can be wiped clean, but the **description** of that cluster never lived inside it — it lived in Git, surviving what just happened completely unscathed.

The one thing NOT living in any YAML file: the actual data inside Postgres. Restore it from the backup.

```bash
kubectl exec -i postgres-<new-pod> -n ai-workspace -- \
  psql -U postgres aiworkspace < backup.sql
```

```bash
kubectl exec -it postgres-<new-pod> -n ai-workspace -- \
  psql -U postgres -d aiworkspace -c "SELECT count(*) FROM conversations;"
```

```
 count
-------
    17
```

Same row count as before the deletion. Configuration rebuilds itself automatically from YAML; data has to be backed up/restored by hand — two completely different things, neither one a substitute for the other.

### Installing `ingress-nginx`, writing the routing rules

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

The exact build made for `kind` — uses `hostPort` instead of `LoadBalancer` (something only meaningful on a real cloud), matching the `extraPortMappings` just declared.

Start writing the routing rules, get to the line pointing at a `chat-api` Service, and stop — there's no Service by that name at all. Ever since a few chapters back, `chat-api` never needed one, only ever reached through `port-forward` straight into the Deployment, because nothing inside the cluster ever called it. Now there's finally a first caller: `ingress-nginx` itself. Write one more Service, as simple as the one made for `postgres` back then.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: chat-api
  namespace: ai-workspace
spec:
  selector:
    app: chat-api
  ports:
    - port: 8080
      targetPort: 8080
```

```bash
kubectl apply -f chat-api-service.yaml
```

```
service/chat-api created
```

Now write the `Ingress`, pointing at the Service just created.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-workspace
  namespace: ai-workspace
spec:
  ingressClassName: nginx
  rules:
    - http:
        paths:
          - path: /health
            pathType: Exact
            backend:
              service:
                name: chat-api
                port:
                  number: 8080
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: chat-api
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
```

`/health` gets its own line, `pathType: Exact` — the `/health` route in `chat-api` was never prefixed with `/api` (written back in Chapter 13, before Ingress existed), so it has to be declared with its real path, can't just be folded into the `/api` rule. `/api` declared before `/` — a request to `/api/chat` matches both rules, but `ingress-nginx` automatically prefers the longer/more specific path match, even though the order written in the file isn't strictly what decides that.

```bash
kubectl apply -f ingress.yaml
```

### The first call in that doesn't need `kubectl` at all

```bash
curl http://localhost/health
```

```json
{"status":"ok"}
```

No `port-forward`, no `-n` flag, no need to know the cluster's name. A perfectly ordinary curl request, going through a real port 80 on the machine — a port that `kind` now maps straight into the node container, the node container routing it through `ingress-nginx`, `ingress-nginx` reading the rules just written, forwarding it to the right Service.

One last fix to `API_URL` in `frontend/src/App.jsx` — no more hardcoded `http://localhost:8080`, left empty instead, calling relative to whatever domain the page itself was loaded from.

```js
const API_URL = "";
```

Rebuild, load into the new cluster, reapply `frontend-deployment.yaml`. Open a browser to `http://localhost/` — no port-forward open, nothing running in the background except `kind` itself — the UI shows up.

Type a question, `chat-api` returns `401` — the exact problem noted yesterday is still there: `frontend` still has no login screen, nowhere to store a token. Not today's problem to solve. But the networking piece — the one that required deleting the entire cluster to get right — is done.

### What's still limited, said plainly

`http://localhost/` only ever means something on your own machine — a customer far away typing that exact address on their machine sees nothing, because their "localhost" isn't your "localhost." The `kind` cluster is a real cluster, but it's still just running on one laptop — no public IP address for the whole world to call into. Genuinely exposing this to the internet needs a cluster running on infrastructure with a real public address (the cloud) and a real `LoadBalancer` Service — a different chapter's story, not today's.

One last line, written down:

```
Ingress works correctly on kind, but http://localhost is still
only visible on this one machine. Real internet exposure needs
a cloud cluster + a real LoadBalancer — not yet. Frontend still
401s with no login UI, noted yesterday, still open.
```

Close the laptop. The cluster is completely different from this morning's — same name, `ai-workspace`, but an entirely new cluster, rebuilt from files that never had to change at all.
