# Chapter 14 — CronJob, Job, Worker & Queue

**Part III — Making the Project Real**
**Tier:** Tier 2 — Standard
**Touches `project/` code:** Yes — tag `ch14`.

---

## 🎯 Mission

Two new requests land at once. First: old, abandoned conversations should be purged from Postgres every night to keep storage in check. Second: a one-off task — backfill a `created_at` column for every existing conversation, once, right now. Neither of these is "always running" like `chat-api` — they're "run this, finish, stop," which nothing you've built so far actually supports.

## 📖 Theory

Everything up to this chapter — Pods, Deployments, ReplicaSets — assumes a workload that runs *forever*. Two more primitives exist specifically for workloads that are supposed to **finish**:

- **Job** — runs one or more Pods until a task completes successfully, then stops. If a Pod fails, the Job (up to `backoffLimit`) retries it. This is the one-off backfill.
- **CronJob** — creates a new Job on a schedule, using standard cron syntax. This is the nightly cleanup.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: purge-old-conversations
  namespace: ai-workspace
spec:
  schedule: "0 3 * * *"   # 03:00 every day
  concurrencyPolicy: Forbid   # don't start a new run if the previous one is still going
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: purge
              image: ai-workspace/chat-api:ch14
              command: ["./purge-old-conversations"]
```

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: backfill-created-at
  namespace: ai-workspace
spec:
  backoffLimit: 1
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: backfill
          image: ai-workspace/chat-api:ch14
          command: ["./backfill-created-at"]
```

There's a third shape worth naming here even though it's not a new API object: a **Worker** is just a regular Deployment (Chapter 7) that, instead of serving HTTP requests like `chat-api`, continuously pulls tasks off a **queue** and processes them — always running, unlike a Job, but doing background work instead of answering requests. AI Workspace doesn't have a real queue yet (that's a genuine architectural addition, arriving once there's a queue technology to pair it with, in Part VI) — but it's worth recognizing the shape now: Job is for "run once," CronJob is "run on a schedule," Worker is "run forever, pulling from a queue instead of a Service."

## 🛠 Hands-on

Redeploy Chapters 11–13's `chat-api` setup first, then:

```bash
kubectl apply -f purge-cronjob.yaml
kubectl apply -f backfill-job.yaml

kubectl get cronjobs,jobs,pods -n ai-workspace
kubectl logs job/backfill-created-at -n ai-workspace

# trigger the CronJob manually instead of waiting for 3am
kubectl create job --from=cronjob/purge-old-conversations manual-purge-test -n ai-workspace
```

Full guide: [`labs/ch14/`](../../labs/ch14/). Code: `git checkout ch14` in [`project/`](../../project/).

## 🔬 Under the Hood

```bash
kubectl get jobs -n ai-workspace -o wide
```

A CronJob doesn't run anything itself — on schedule, the CronJob controller (another loop in the Controller Manager, Chapter 4) simply creates a **Job** object, and from there the Job controller takes over exactly like the manually-created `backfill-created-at` Job: it creates Pods, watches them run to completion, and retries on failure up to `backoffLimit`. Scheduling and execution are two separate, composable controllers, not one piece of special-cased logic.

## 🚀 Challenge

See [`challenges/ch14/`](../../challenges/ch14/) (easy → expert) — including setting `concurrencyPolicy: Allow` and deliberately making the purge job slow enough to overlap with itself, then observing (and fixing) what that causes.
