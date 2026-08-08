# Chapter 5 — Before Dumping Everything On It

## Still that morning

Coffee done, you grab the laptop and head to the office — close the lid on your way out, open it back up, everything's exactly as it was, cluster still running.

You've barely set the laptop down when standup starts, and you're still groggy from four hours of sleep.

> "How's it going?" the founder asks, having watched you buried in a terminal all morning.

> "Got a cluster running on my laptop. Haven't put anything on it yet."

> "Cool, no rush." The founder turns to ask someone else, doesn't push further.

You're about to just write YAML for `chat-api` and `kubectl apply` it, dump everything onto the cluster and be done with it. But you stop — you don't actually know `kubectl` beyond `get nodes` and `get pods`. Throwing a pile of stuff at a cluster you don't understand the organization of doesn't feel right.

You try something first:

```bash
kubectl get namespaces
```

```
NAME                 STATUS   AGE
default              Active   18m
kube-node-lease      Active   18m
kube-public          Active   18m
kube-system          Active   18m
```

`kube-system` you recognize now — where all the control plane pods live. `default` — where everything lands if you don't say otherwise. You don't love the idea of dumping AI Workspace into the same place as whatever test junk comes later. A namespace of its own seems like the right call.

```bash
kubectl create namespace ai-workspace
```

```
namespace/ai-workspace created
```

A namespace, it turns out, is simpler than you expected: just a way to split one cluster into separate compartments. `ai-workspace` and `kube-system` still share the same control plane, the same nodes as a minute ago — names just don't collide across compartments. A Pod named `chat-api` in `ai-workspace` and a Pod named `chat-api` in some other namespace would be two completely separate things, no conflict. Not a separate cluster — just a separate drawer in the same cabinet.

Housekeeping done. Now the part you're actually curious about: what else does `kubectl` know how to do that you've never typed.

```bash
kubectl api-resources | head -20
```

A long list — `pods`, `deployments`, `services`, `configmaps`, `secrets`, dozens of other names you've never heard of. This is the full map of everything Kubernetes knows how to create. You don't read all of it, but you file it away: whatever you forget, check here first.

You try one more command, just curious what a `pod` actually consists of:

```bash
kubectl explain pod
```

```
KIND:     Pod
VERSION:  v1

DESCRIPTION:
    Pod is a collection of containers that can run on a host.
    ...

FIELDS:
  apiVersion	<string>
  kind	<string>
  metadata	<Object>
  spec	<Object>
  status	<Object>
```

The first line answers exactly the question you meant to ask last night and nobody actually spelled out: a Pod is *a group of containers*, running together on the same machine. Not a container — a group, even if that group usually has exactly one member, the way `chat-api`'s about to be.

Not third-party docs, not some blog post — this is the real schema, answered by the cluster itself, always matching whatever version is actually running. You go one level deeper.

```bash
kubectl explain pod.spec.containers
```

A list of fields shows up — `image`, `name`, `ports`, `env`, words you already know from reading `docker-compose.yml`. Not identical, but close enough that none of it feels foreign.

You notice something while typing these: everything so far has been `kubectl create namespace ...`, `kubectl get ...` — direct commands, one command, one action. But last night's README clearly said something different — *you write down what you want, then save it*. Those two things aren't the same.

You test it:

```bash
kubectl create namespace test-imperative
kubectl get namespace test-imperative -o yaml
```

Out comes a full YAML file, even though you never wrote a single line of YAML. Turns out `kubectl create` is generating exactly that kind of "description" behind the scenes too — it just writes it for you, and you have no saved copy to reapply if you accidentally delete it. The other way — write the YAML file first, `kubectl apply -f` second — you get a saved copy, editable, committable to git, reproducible on another machine.

```bash
kubectl delete namespace test-imperative
```

You delete the test namespace, keep `ai-workspace`. Clear now: from here on, you're writing files first.

You open a blank file, name it `chat-api-pod.yaml`. Haven't typed a word yet. But for the first time all week, you feel a lot more sure-handed.
