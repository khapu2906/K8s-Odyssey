# Chapter 15 — PVC, PV & StorageClass

**Part III — Making the Project Real**
**Tier:** Tier 1 — Core
**Touches `project/` code:** Yes — tag `ch15`.

---

## 🎯 Mission

Postgres has been running in the cluster since the Chapter 6 challenge, but without anything backing its data directory. Delete that Pod — or let it get rescheduled to another Node during a routine update — and every conversation AI Workspace has ever stored disappears with it. The entire premise from Chapter 1 ("ask the AI, save the conversation history") quietly breaks the first time Postgres restarts.

## 📖 Theory

Chapter 2 already used the word "volume" — Docker Compose's `pgdata` volume kept data alive across container restarts, on one machine. Kubernetes needs to solve a harder version of the same problem: data that survives not just a restart, but the Pod landing on a completely different Node next time. Three objects work together to do this:

- **PersistentVolume (PV)** — a piece of real storage in the cluster (a cloud disk, an NFS share, a local disk), represented as a Kubernetes object. Cluster operators usually don't create these by hand.
- **PersistentVolumeClaim (PVC)** — a request for storage from your Pod's perspective: "give me 10Gi, read-write by one Pod at a time." It doesn't know or care what's actually backing it.
- **StorageClass** — a template that lets a PVC's storage be created **on demand** rather than requiring a PV to already exist. This is how most real clusters work: you create a PVC, and a PV matching it is provisioned automatically, moments later.

The separation matters: your `chat-api` YAML asks for a PVC, never a specific PV — the same manifest works whether the underlying disk is a local-path volume on your laptop's `kind` cluster or a real cloud disk in production, because the StorageClass is what changes, not your Pod spec.

## 🛠 Hands-on

Redeploy Chapters 11–13's `chat-api` setup first, then give Postgres real storage:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: ai-workspace
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard   # kind's default local-path provisioner
```

```yaml
# postgres-pod.yaml (relevant excerpt)
      containers:
        - name: postgres
          image: postgres:16
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: postgres-data
```

```bash
kubectl apply -f postgres-pvc.yaml
kubectl get pvc -n ai-workspace
kubectl get pv   # note: PVs are cluster-scoped, no namespace
kubectl apply -f postgres-pod.yaml

# prove data survives a Pod restart
kubectl exec -it postgres -n ai-workspace -- psql -U postgres -c "INSERT INTO conversations ..."
kubectl delete pod postgres -n ai-workspace
kubectl apply -f postgres-pod.yaml
kubectl exec -it postgres -n ai-workspace -- psql -U postgres -c "SELECT * FROM conversations;"
```

Full guide: [`labs/ch15/`](../../labs/ch15/). Code: `git checkout ch15` in [`project/`](../../project/).

## 🔬 Under the Hood

```bash
kubectl describe pvc postgres-data -n ai-workspace
kubectl describe pv <the-pv-name-that-was-bound>
```

The moment you created the PVC, the StorageClass's provisioner noticed an unfulfilled claim, created a matching PV, and **bound** the two together — a one-to-one relationship for as long as the PVC exists. When the Postgres Pod was deleted and recreated, nothing about storage changed at all: the new Pod referenced the same PVC name, which was still bound to the same PV, which still had the same data on disk. The Pod is disposable, exactly as Chapter 6 said; the storage underneath it, deliberately, is not.

## 🧰 Production Notes

`ReadWriteOnce` (one Node reading and writing at a time) is what a single Postgres instance needs and is what most cloud disks support. `ReadWriteMany` (multiple Nodes at once) requires a different, often more expensive backend (NFS-like storage) and is only needed for workloads that genuinely share one volume across many Pods simultaneously — don't default to it. Also: deleting a PVC's default `reclaimPolicy` behavior varies by StorageClass — know whether deleting a PVC actually deletes the underlying data before you rely on it in production.

## 🐞 Debug Lab

Create a PVC that requests a `storageClassName` which doesn't exist on the cluster (a typo, or a class that's only available in a different environment), then apply the Postgres Pod referencing it. Use `kubectl describe pvc` to find exactly where it's stuck and why, before checking [`incidents/ch15/`](../../incidents/ch15/).

## 💬 Interview Questions

- What's the actual division of responsibility between a PV, a PVC, and a StorageClass?
- Why does a Pod spec reference a PVC and never a PV directly?
- What's the practical difference between `ReadWriteOnce` and `ReadWriteMany`, and when would you actually need the latter?
- If you delete a Pod that's using a PVC, what happens to the data — and does the answer change if you delete the PVC itself?

## 🚀 Challenge

See [`challenges/ch15/`](../../challenges/ch15/) (easy → expert) — including resizing an existing PVC and observing which StorageClasses actually support that without recreating the volume.
