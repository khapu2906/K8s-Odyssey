# Chapter 14 — Not Enough Room

## The next day

Only two lines left untouched in that nine-line list from three weeks ago: scheduling, and observability. Observability stays put for now — every source you've read describes it differently, not confident enough yet to dive in. Scheduling is different — it takes you right back to that first morning with the cluster, a line you wrote by hand:

```
Note to self: "control plane" isn't a fuzzy concept.
It's 4-5 specific pods, running in the kube-system
namespace. Just saw them with my own eyes.
```

`kube-scheduler` was in that list, but you've never actually seen it *decide* anything — the cluster has exactly one node, so wherever a Pod lands, there was only ever one place to choose from. Nothing to actually "choose" between. Curious, you look up what that decision is even based on.

```bash
kubectl explain deployment.spec.template.spec.containers.resources
```

```
KIND:     Deployment
VERSION:  apps/v1

FIELD:    resources <Object>

DESCRIPTION:
    Compute Resources required by this container.

    FIELDS:
      limits	<map[string]string>
      requests	<map[string]string>
```

`requests` — the number the Scheduler looks at to decide whether a node has room. `limits` — the ceiling a container can't cross once it's actually running. Two different things, one affecting *placement*, one affecting the Pod *while it's running*.

You add a reasonable pair of numbers to both Deployments, roughly sized for a small Node.js app.

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "250m"
    memory: "256Mi"
```

```bash
kubectl apply -f chat-api-deployment.yaml -f postgres.yaml
kubectl get pods -n ai-workspace
```

```
NAME                          READY   STATUS    RESTARTS   AGE
chat-api-8f6c9d7b5-4nvxr      1/1     Running   0          9s
chat-api-8f6c9d7b5-h2qkm      1/1     Running   0          9s
chat-api-8f6c9d7b5-wz8lt      1/1     Running   0          9s
postgres-6b7d4f8c9-p3wln      1/1     Running   0          6d
```

Still all `Running`, nothing visibly different. The numbers you wrote are too small next to the node to make any real difference. You want to actually see the Scheduler *say no* once, see what that even looks like. First, check how much this node actually has to give.

```bash
kubectl describe node ai-workspace-control-plane | grep -A6 "Allocatable:"
```

```
Allocatable:
  cpu:                6
  ephemeral-storage:  253725Mi
  memory:             7841234Ki
  pods:               110
```

`7841234Ki`, roughly 7.5Gi. You temporarily edit `chat-api-deployment.yaml`, ask for `requests.memory: "64Gi"` — a dozen times more than the node even has, just to see what happens. `limits.memory` stays at `256Mi`, not thought about yet.

```bash
kubectl apply -f chat-api-deployment.yaml
```

```
The Deployment "chat-api" is invalid: spec.template.spec.containers[0].resources.requests:
Invalid value: "64Gi": must be less than or equal to memory limit of 256Mi
```

Doesn't even get as far as the Scheduler — blocked right at the door. `requests` isn't allowed to exceed that same resource's own `limits`, and the API server checks this the moment it receives the YAML, before it's even saved to etcd. Asking for more than the node has is one thing; asking for more than the ceiling you set for the container yourself is a different thing entirely — two separate layers of validation. You bump `limits.memory` up to `64Gi` too, so the two numbers stop contradicting each other.

```bash
kubectl apply -f chat-api-deployment.yaml
kubectl get pods -n ai-workspace
```

```
NAME                          READY   STATUS    RESTARTS   AGE
chat-api-7c9f6d8b4-2mwxz      0/1     Pending   0          8s
chat-api-8f6c9d7b5-h2qkm      1/1     Running   0          4m
chat-api-8f6c9d7b5-wz8lt      1/1     Running   0          4m
postgres-6b7d4f8c9-p3wln      1/1     Running   0          6d
```

`Pending`. Not `ContainerCreating`, not `ErrImagePull` — just sitting there, never assigned to any node at all. `describe` to see why.

```bash
kubectl describe pod chat-api-7c9f6d8b4-2mwxz -n ai-workspace | grep -A3 "Events:"
```

```
Events:
  Type     Reason            Age   From               Message
  ----     ------            ----  ----                -------
  Warning  FailedScheduling  10s   default-scheduler   0/1 nodes are
  available: 1 Insufficient memory. preemption: 0/1 nodes are
  available: 1 No preemption victims found for incoming pod.
```

`default-scheduler` — the exact Pod name you first saw sitting in `kube-system` that first morning, finally actually speaking up. `0/1 nodes are available` — not a wrong image, not postgres down, just plainly no node with enough room for the number you just asked for. The three old Pods are still `Running` fine, because they got created back when `requests` was still reasonable, and the node had already given them room — only the new one, born asking for too much, got blocked right at the very first round of review.

You set both `requests.memory` and `limits.memory` back to `128Mi`/`256Mi`, apply again.

```bash
kubectl apply -f chat-api-deployment.yaml
kubectl get pods -n ai-workspace
```

```
NAME                          READY   STATUS    RESTARTS   AGE
chat-api-8f6c9d7b5-4nvxr      1/1     Running   0          6m
chat-api-8f6c9d7b5-h2qkm      1/1     Running   0          6m
chat-api-8f6c9d7b5-wz8lt      1/1     Running   0          6m
postgres-6b7d4f8c9-p3wln      1/1     Running   0          6d
```

The `Pending` Pod is gone, replaced by an ordinary `Running` one — the count still three, the ReplicaSet doing exactly its job, just this time the Scheduler was willing to say yes.

You open the notes, cross off one more line.

```
Need scheduling ✓ the Scheduler uses "requests" to decide
whether a node has room — ask for too much and a Pod just
sits "Pending" forever, no error, no crash, simply nobody
ever claimed it. On a single-node cluster like this one,
there's nothing to actually "choose between multiple nodes"
yet — that part only really matters once there's more than
one node to compare.
```

Nine lines three weeks ago, eight of them checked off now. Exactly one left — the `???`, observability — untouched, exactly as it was the first night you read that README.
