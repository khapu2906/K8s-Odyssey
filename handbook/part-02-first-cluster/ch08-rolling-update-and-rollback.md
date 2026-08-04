# Chapter 8 — Rolling Update & Rollback

**Part II — First Cluster**

**Tier:** Tier 2 — Standard

**Touches `project/` code:** Yes — tag `ch08`.

---

## 🎯 Mission

There's a real bug fix ready to ship for `chat-api`. With three replicas now running (Chapter 7), the naive move — delete everything, apply the new version — would take AI Workspace offline for however long that takes. There has to be a way to swap versions with users never noticing.

## 📖 Theory

By default, a Deployment updates using the **RollingUpdate** strategy: it brings up a few Pods on the new version, waits for them to be healthy, retires a few old ones, and repeats — never dropping below most of the desired capacity, and never having zero Pods available. Two fields control exactly how cautious this is:

- **`maxUnavailable`** — how many Pods below the desired count you're willing to tolerate during the rollout.
- **`maxSurge`** — how many *extra* Pods above the desired count you're willing to create temporarily to speed things up.

Every rollout also creates a new ReplicaSet (Chapter 7) rather than modifying the old one — which means the old ReplicaSet doesn't disappear, it just scales to zero and sits there, remembered. That's what makes rollback possible: undoing a bad deploy isn't reapplying an old YAML file from memory, it's just telling the Deployment to scale the *previous* ReplicaSet back up and the current one back down.

## 🛠 Hands-on

Redeploy Chapters 6–7's Deployment first, then ship the fix:

```bash
kubectl set image deployment/chat-api chat-api=ai-workspace/chat-api:ch08 -n ai-workspace
kubectl rollout status deployment/chat-api -n ai-workspace
```

Watch it happen in real time in a second terminal:

```bash
kubectl get pods -n ai-workspace -w
```

Now check the history, and see rollback in action:

```bash
kubectl rollout history deployment/chat-api -n ai-workspace
kubectl rollout undo deployment/chat-api -n ai-workspace
kubectl rollout status deployment/chat-api -n ai-workspace
```

Full guide: [`labs/ch08/`](../../labs/ch08/). Code: `git checkout ch08` in [`project/`](../../project/).

## 🔬 Under the Hood

```bash
kubectl get replicasets -n ai-workspace
```

You'll see two ReplicaSets for `chat-api`: one at `0` replicas (the previous version, kept around for rollback), one at `3` (the current version). `kubectl rollout undo` doesn't recreate anything — it just flips which ReplicaSet is scaled up and which is scaled down, which is why rollback is fast. This is also why deleting old ReplicaSets manually removes your ability to roll back to that revision.

## 🚀 Challenge

See [`challenges/ch08/`](../../challenges/ch08/) (easy → expert) — including deliberately shipping a version of `chat-api` that crashes on startup, watching the rollout stall instead of completing, and recovering with `rollout undo` — then trying the same scenario with `maxUnavailable: 0` and comparing what changes.
