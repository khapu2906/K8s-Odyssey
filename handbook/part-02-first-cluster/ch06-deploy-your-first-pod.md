# Chapter 6 — Deploy Your First Pod

**Part II — First Cluster**
**Tier:** Tier 1 — Core
**Touches `project/` code:** Yes — first tag: `ch06`.

---

## 🎯 Mission

Time to stop practicing on the cluster itself and actually put AI Workspace on it. The smallest possible version of that: get `chat-api` — just that one container — running as a single unit on Kubernetes.

## 📖 Theory

A **Pod** is the smallest thing you can deploy in Kubernetes. Not a container — a Pod. Usually a Pod wraps exactly one container, but it *can* hold more than one, as long as they're meant to live and die together, sharing the same network namespace (so they can reach each other over `localhost`) and, optionally, storage. You'll see a real reason to use more than one container in a Pod later in the book; for now, one container, one Pod.

Why not just deploy a container directly? Because Kubernetes needed one atomic unit of scheduling — something the Scheduler places on exactly one Node, as a whole. A Pod is that unit. Everything else you'll learn — Deployments, Services, StatefulSets — exists to manage *groups* of Pods, never containers directly.

A Pod is also, deliberately, disposable and mortal. It doesn't restart itself if the Node it's on dies, and if you delete it, nothing brings it back. That's not a bug — it's the whole reason Chapter 7 exists.

## 🛠 Hands-on

```yaml
# chat-api-pod.yaml
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
      image: ai-workspace/chat-api:ch06
      ports:
        - containerPort: 8080
      env:
        - name: DATABASE_URL
          value: postgres://postgres:postgres@postgres:5432/aiworkspace
```

```bash
kubectl apply -f chat-api-pod.yaml
kubectl get pods -n ai-workspace
kubectl describe pod chat-api -n ai-workspace
kubectl logs chat-api -n ai-workspace
kubectl port-forward pod/chat-api 8080:8080 -n ai-workspace
```

Full step-by-step guide: [`labs/ch06/`](../../labs/ch06/). Runnable code: `git checkout ch06` in [`project/`](../../project/) — this is the first tag in the book; it adds `k8s/chat-api-pod.yaml` alongside the `docker-compose.yml` from Chapter 2.

## 🔬 Under the Hood

`kubectl apply` sent your YAML to the API Server, which wrote it into etcd as the *desired* state. From there:

```
You → API Server → etcd (desired: chat-api Pod exists)
                       │
                  Scheduler (picks a Node)
                       │
                  kubelet on that Node (pulls image, starts container)
                       │
                  kubelet reports status back → API Server → etcd (actual state)
```

`kubectl get pods` is just you asking the API Server "what does etcd currently say?" Chapters 54 and 56 go deep on the Scheduler and kubelet specifically; for now, notice that nothing here required Docker Compose's networking or `depends_on` — that concept doesn't exist yet at the Pod level, which is exactly why `chat-api` alone, without Postgres, is about to fail.

## 🧰 Production Notes

You will almost never write a bare Pod like this one in real work. It has no self-healing, no scaling, no rollout strategy — everything Chapter 3 said Docker Compose was missing. Bare Pods do show up in production for narrow cases (one-off debugging, certain Job patterns), but application workloads belong in a Deployment, which is exactly where Chapter 7 takes this one.

## 🐞 Debug Lab

Apply `chat-api-pod.yaml` exactly as shown above — notice that Postgres isn't running anywhere in the cluster yet. Watch what happens:

```bash
kubectl get pods -n ai-workspace -w
```

The Pod won't stay `Running`. Use `kubectl describe pod chat-api -n ai-workspace` and `kubectl logs chat-api -n ai-workspace` (add `--previous` if it already restarted) to figure out exactly what state it's stuck in and why, before reading the incident writeup in [`incidents/ch06/`](../../incidents/ch06/).

## 💬 Interview Questions

- What's the smallest deployable unit in Kubernetes, and why isn't it just "a container"?
- When would you legitimately put more than one container in a single Pod?
- If the Node running a Pod dies, does Kubernetes reschedule that exact Pod elsewhere? Why or why not?
- What's the difference between a container restarting and a Pod being recreated?

## 🚀 Challenge

See [`challenges/ch06/`](../../challenges/ch06/) (easy → expert) — including deploying Postgres as a second bare Pod and getting `chat-api` to reach it using its Pod IP directly (and noticing exactly why that's a bad idea, ahead of Chapter 9).
