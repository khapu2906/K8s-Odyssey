# Chapter 7 — Deployment & ReplicaSet

**Part II — First Cluster**

**Tier:** Tier 1 — Core

**Touches `project/` code:** Yes — tag `ch07`.

---

## 🎯 Mission

In the Chapter 6 debug lab, `chat-api` crashed and stayed crashed until you fixed it by hand. In real life, that Pod could die at 3am and nobody would restart it. And the traffic spike from Chapter 3 needs more than one copy of `chat-api` running anyway. Both problems have the same fix.

## 📖 Theory

A **ReplicaSet**'s only job is to guarantee that a specified number of identical Pods exist, at all times. It doesn't care about updates or history — just count. If you delete one of its Pods, it notices (through the same watch mechanism from Chapter 4) and creates a replacement within moments.

A **Deployment** manages ReplicaSets, and adds the piece ReplicaSet doesn't have: safe updates. When you change a Deployment's Pod template (say, a new image tag), it doesn't edit Pods in place — it creates a *new* ReplicaSet with the new template, and gradually shifts replicas from the old ReplicaSet to the new one. That mechanic is the subject of Chapter 8; this chapter is about the simpler guarantee underneath it: **N copies, always.**

You'll interact with Deployments constantly and ReplicaSets almost never directly — but it's worth knowing the ReplicaSet is there, because "why do I have two ReplicaSets for one Deployment" is a question you *will* eventually ask yourself while debugging.

## 🛠 Hands-on

Redeploy Chapter 6's `chat-api` Pod definition first — then replace it with a Deployment instead of a bare Pod:

```yaml
# chat-api-deployment.yaml
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
          image: ai-workspace/chat-api:ch07
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              value: postgres://postgres:postgres@postgres:5432/aiworkspace
```

```bash
kubectl delete pod chat-api -n ai-workspace   # remove the ch06 bare Pod
kubectl apply -f chat-api-deployment.yaml
kubectl get deployments,replicasets,pods -n ai-workspace
```

Now do the thing that failed to self-heal in Chapter 6:

```bash
kubectl delete pod <one-of-the-three-chat-api-pods> -n ai-workspace
kubectl get pods -n ai-workspace -w
```

Watch a replacement appear within seconds. Full guide: [`labs/ch07/`](../../labs/ch07/). Code: `git checkout ch07` in [`project/`](../../project/).

## 🔬 Under the Hood

```bash
kubectl get replicasets -n ai-workspace
kubectl describe replicaset <name> -n ai-workspace
```

The Deployment you created actually created a ReplicaSet, and the ReplicaSet created the three Pods — you never touched a ReplicaSet directly, but it's sitting there, one layer down, doing the counting. This is the Controller Manager from Chapter 4 running two loops at once: a Deployment controller watching Deployments and managing ReplicaSets, and a ReplicaSet controller watching ReplicaSets and managing Pods.

## 🧰 Production Notes

Never edit a ReplicaSet's `replicas` field directly if it's owned by a Deployment — edit the Deployment. The Deployment controller will notice the mismatch and fight you over it, since as far as it's concerned, *it* owns the desired replica count. Also worth knowing: a Pod's `selector` (`matchLabels`) is immutable after creation — if you need to change it, you're creating a new Deployment, not editing the old one.

## 🐞 Debug Lab

Delete a `chat-api` Pod by hand, as above, but this time watch closely with `kubectl get events -n ai-workspace --sort-by=.lastTimestamp` running in a second terminal at the same moment. Identify exactly which component logged the deletion, and which one logged the creation of the replacement — then check [`incidents/ch07/`](../../incidents/ch07/) against what you found.

## 💬 Interview Questions

- What's the actual division of labor between a Deployment and a ReplicaSet?
- If you `kubectl edit` a ReplicaSet owned by a Deployment and change `replicas`, what happens next, and why?
- Why is a Pod's label selector immutable once the Deployment is created?
- How does the ReplicaSet controller know a Pod it's responsible for was deleted?

## 🚀 Challenge

See [`challenges/ch07/`](../../challenges/ch07/) (easy → expert) — including scaling `chat-api` to 0 and back, and predicting what happens to the ReplicaSet's name when you do.
