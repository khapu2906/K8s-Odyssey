# Chapter 11 — Attached From the Outside

## Still that morning

You flip back to the notes from the night you first read that README, the night Martin told you about Kubernetes. Right, it's already there, a line you never touched until now:

```
Need storage
→ there's a concept called "Volume" separate from the container,
and the one that keeps data alive past a container dying/moving
machines is called "PersistentVolume" (PV) and
"PersistentVolumeClaim" (PVC)
```

Three weeks ago that line was just a name you skimmed past. Now it's exactly what you need, right now. Your eyes drift up a few lines and stop — `Need scaling`, `Need restart`, `Need deployment` — three lines never crossed off, even though `ReplicaSet`/`Deployment` already settled them back when `chat-api-deployment.yaml` got written. You'd just been too busy at the time to come back and check them against this actual list. While you're at it, you cross off all three.

```
Need scaling ✓ replicas on the Deployment
Need restart ✓ ReplicaSet recreates the Pod on its own
Need deployment ✓ Deployment (wraps ReplicaSet + rolling update)
```

```bash
kubectl explain persistentvolumeclaim
```

```
KIND:     PersistentVolumeClaim
VERSION:  v1

DESCRIPTION:
    PersistentVolumeClaim is a user's request for and claim to a
    persistent volume
```

"Request for and claim to" — not the disk itself, a *request* for one to be granted. Granted by whom? You run one more command, curious whether the cluster already has something set up.

```bash
kubectl get storageclass
```

```
NAME                 PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      AGE
standard (default)   rancher.io/local-path   Delete          WaitForFirstConsumer   3d
```

`3d` — been there since the day you first ran `kind create cluster`. You remember that log line from back then: `✓ Installing StorageClass 💾`, skimmed right past it at the time, no idea what it was for. Turns out it's been sitting here waiting the whole three days, just nobody ever asked it for a disk.

You write `postgres-pvc.yaml`, ask for a 1Gi disk, simplest possible for now.

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
      storage: 1Gi
```

```bash
kubectl apply -f postgres-pvc.yaml
```

```
persistentvolumeclaim/postgres-data created
```

```bash
kubectl get pvc -n ai-workspace
```

```
NAME            STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
postgres-data   Pending                                      standard       4s
```

`Pending`. You think you got something wrong, but looking back at that `VOLUMEBINDINGMODE` column from a minute ago: `WaitForFirstConsumer`. Reading it slowly, it's actually pretty literal — no disk gets provisioned until something *actually uses* it first. This PVC isn't attached to any Pod yet, so it's just waiting, nothing urgent about it.

You open `postgres.yaml`, add a `volumes` section at the Pod level and a `volumeMounts` entry inside the container, pointing at a path you already know by heart from reading `docker-compose.yml` on day one: `/var/lib/postgresql/data`.

```yaml
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
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: postgres-data
```

The same name, `postgres-data`, shows up twice — once in `persistentVolumeClaim.claimName`, saying "pull data from this PVC," once in `volumeMounts.name`, saying "mount it at this path inside the container." The two names have to match, the same kind of label-matching you got used to yesterday, just volume names instead of `matchLabels`.

```bash
kubectl apply -f postgres.yaml
```

```
deployment.apps/postgres configured
service/postgres unchanged
```

```bash
kubectl get pods -n ai-workspace -w
```

```
postgres-6b7d4f8c9-h3nkq   0/1   ContainerCreating   0   3s
postgres-6b7d4f8c9-h3nkq   1/1   Running              0   6s
```

The old `postgres` Pod gets replaced with a new one, this time with a disk attached. Check the PVC again:

```bash
kubectl get pvc -n ai-workspace
```

```
NAME            STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
postgres-data   Bound    pvc-a1e6c9f2-8b3d-4f11-9e2a-7c5d3f8b91a0   1Gi        RWO            standard       41s
```

`Bound` — right as soon as the new Pod actually needed it. That `VOLUME` column is the name of a real `PersistentVolume` (PV) that just got created behind this PVC — you asked (the Claim), the cluster provisioned (the Volume), two separate objects, now wired together.

The `conversations` table is gone again too, since this Postgres has never had any `chat-api` touch it. You delete the three old `chat-api` Pods, forcing them to restart and recreate the table, same trick you learned yesterday.

```bash
kubectl delete pod -n ai-workspace -l app=chat-api
```

```bash
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"does it remember this time"}'
```

```json
{"id":1,"message":"does it remember this time","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-16T08:12:03.447Z"}
```

`id: 1`. Now for the part that actually matters — repeat yesterday's exact test, see if anything's different this time.

```bash
kubectl delete pod postgres-6b7d4f8c9-h3nkq -n ai-workspace
```

```
pod "postgres-6b7d4f8c9-h3nkq" deleted
```

```bash
kubectl get pods -n ai-workspace -w
```

```
postgres-6b7d4f8c9-r9zwm   0/1   ContainerCreating   0   2s
postgres-6b7d4f8c9-r9zwm   1/1   Running              0   9s
```

Name's different again, same as every time. You take a breath, run the exact command that gave you `Internal Server Error` yesterday.

```bash
curl -s http://localhost:8080/api/conversations
```

```json
[{"id":1,"message":"does it remember this time","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-16T08:12:03.447Z"}]
```

Still there. The old Pod is gone, the new one has a completely different name, but the data survived — because this time the data was never really *inside* the Pod at all, it lives on the PV, standing outside any single Pod's lifetime. The Pod is just something temporarily attached to it, unplugged when it's done, the disk staying behind waiting for whichever Pod comes next.

You open the notes from the night you read that README, find the line from three weeks ago, cross off one more.

```
Need storage ✓ PersistentVolumeClaim asks for a disk, the
cluster provisions a PersistentVolume behind it — attached
to a Pod through volumeMounts, Pod dies and gets replaced,
the disk stays intact because it never belonged to any one
Pod in the first place.
```

Five out of nine lines now have a real ✓, not just a theoretical one — scheduling, secrets, health checks, and observability still left. You shut the laptop, this time feeling steadier than yesterday afternoon's thin relief.
