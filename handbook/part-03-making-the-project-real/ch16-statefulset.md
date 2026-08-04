# Chapter 16 — StatefulSet

**Part III — Making the Project Real**
**Tier:** Tier 1 — Core
**Touches `project/` code:** Yes — tag `ch16`.

---

## 🎯 Mission

Postgres now keeps its data (Chapter 15), but it's still a bare Pod — the exact thing Chapter 6 warned against. It has no self-healing, and worse: if you ever needed a second Postgres replica for a read-heavy workload, a Deployment (Chapter 7) would give both replicas *random, interchangeable* names and no way to guarantee "replica A always gets disk A." For a database, identity matters in a way it never did for `chat-api`.

## 📖 Theory

A Deployment's Pods are interchangeable by design — any one of `chat-api`'s three replicas can vanish and be replaced by an identical stranger, and nothing cares which. A **StatefulSet** exists for the opposite case: workloads where each replica has a **stable, unique identity** that survives restarts.

Three guarantees a StatefulSet adds that a Deployment doesn't:

- **Stable, predictable names** — `postgres-0`, `postgres-1`, not random suffixes. Recreated Pods get their *same* name back.
- **Stable, per-replica storage** — via `volumeClaimTemplates`, each replica gets its **own** PVC (Chapter 15), created once and reattached to that same-named Pod every time it's recreated. `postgres-1` always comes back with `postgres-1`'s disk, never `postgres-0`'s.
- **Ordered, sequential rollout** — Pods are created, updated, and deleted one at a time, in order (`postgres-0` before `postgres-1`), instead of all at once.

This also requires a **headless Service** (`clusterIP: None`) instead of the kind from Chapter 9 — one that gives each individual Pod its own stable DNS name (`postgres-0.postgres.ai-workspace.svc.cluster.local`) rather than load-balancing across all of them as one address. That distinction matters the moment you have more than one replica and need to talk to a *specific* one — the primary, say, for writes.

## 🛠 Hands-on

Redeploy Chapters 12, 13, and 15's setup first, then replace the bare Postgres Pod with a StatefulSet:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: ai-workspace
spec:
  clusterIP: None   # headless
  selector:
    app: postgres
  ports:
    - port: 5432
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: ai-workspace
spec:
  serviceName: postgres
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
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 5Gi
```

```bash
kubectl delete pod postgres -n ai-workspace   # remove the ch15 bare Pod
kubectl apply -f postgres-statefulset.yaml
kubectl get statefulsets,pods,pvc -n ai-workspace
kubectl delete pod postgres-0 -n ai-workspace
kubectl get pods -n ai-workspace -w   # notice: comes back as postgres-0, not a new random name
```

Full guide: [`labs/ch16/`](../../labs/ch16/). Code: `git checkout ch16` in [`project/`](../../project/).

## 🔬 Under the Hood

```bash
kubectl get pvc -n ai-workspace
```

You'll see a PVC named `data-postgres-0` — generated automatically from the `volumeClaimTemplates` block, tied permanently to `postgres-0`'s identity. Compare this to what happened in Chapter 7 when a `chat-api` Pod was deleted: a ReplicaSet created a *new* Pod with a *new* name and no assumptions about identity. Here, the StatefulSet controller specifically recreates a Pod named `postgres-0` and reattaches `data-postgres-0` — same name, same disk, every time.

## 🧰 Production Notes

StatefulSet solves *identity and ordering* — it does not, by itself, solve database replication, leader election, or failover. Running a real multi-replica Postgres cluster on Kubernetes typically means pairing a StatefulSet with a Postgres-specific Operator (Chapter 48) that understands primary/replica roles; scaling `replicas: 3` on a bare StatefulSet just gives you three independent Postgres instances with no data between them, not a replicated cluster.

## 🐞 Debug Lab

Delete `postgres-0` and immediately check `kubectl get pods -n ai-workspace` in a tight loop. Compare what you see to deleting a `chat-api` Pod back in Chapter 7 — specifically, note what the Pod is named the moment it reappears, and whether `kubectl get pvc` changed at all. Then check [`incidents/ch16/`](../../incidents/ch16/).

## 💬 Interview Questions

- Why is a Deployment the wrong tool for running a database, even a single-replica one?
- What does `volumeClaimTemplates` actually generate, and how is that different from a single shared PVC?
- What's a headless Service for, and why does StatefulSet require one?
- If you scale a StatefulSet from 1 to 3 replicas, do the new replicas share data with `postgres-0` automatically?

## 🚀 Challenge

See [`challenges/ch16/`](../../challenges/ch16/) (easy → expert) — including scaling the StatefulSet to 2 replicas and confirming, by inspecting `kubectl get pvc`, that each one really did get its own independent disk.
