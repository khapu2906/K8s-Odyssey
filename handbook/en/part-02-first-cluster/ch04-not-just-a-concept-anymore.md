# Chapter 4 — Not Just a Concept Anymore

## The next morning

You wake up earlier than usual. The terminal from last night is still open, the cursor still blinking after the `$`, waiting for the exact command you saved for this morning.

```bash
kind create cluster --name ai-workspace
```

```
Creating cluster "ai-workspace" ...
 ✓ Ensuring node image (kindest/node:v1.31.0) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-ai-workspace"
```

Under a minute. Nothing exploded, no blue screen. You type the first command you learned last night.

```bash
kubectl get nodes
```

```
NAME                         STATUS   ROLES           AGE   VERSION
ai-workspace-control-plane   Ready    control-plane   52s   v1.31.0
```

One line. You look at the `ROLES` column: `control-plane`. Just one machine — not "control plane" and "the node that runs containers" as two separate things, the way last night's README described it. Same machine, playing both roles at once, because this is just `kind` simulating a cluster on your laptop. Still true to the description — just the smallest scale possible.

Curious, you type a command that's in no guide at all — just to see what the "thing that watches everything" that Martin and the README kept mentioning actually looks like.

```bash
kubectl get pods -n kube-system
```

```
NAME                                                 READY   STATUS    RESTARTS   AGE
coredns-7db6d8ff4d-8x2kp                             1/1     Running   0          58s
coredns-7db6d8ff4d-vqz4n                             1/1     Running   0          58s
etcd-ai-workspace-control-plane                      1/1     Running   0          70s
kindnet-w4jbl                                        1/1     Running   0          58s
kube-apiserver-ai-workspace-control-plane            1/1     Running   0          70s
kube-controller-manager-ai-workspace-control-plane   1/1     Running   0          70s
kube-proxy-2f9kd                                     1/1     Running   0          58s
kube-scheduler-ai-workspace-control-plane            1/1     Running   0          70s
```

You sit up straight. This isn't a list of abstract concepts anymore — these names are actually running, right here on your laptop.

- `etcd` — the README last night vaguely called it "the real system." Turns out this is exactly it. Where the "desired state" you read about actually lives.
- `kube-apiserver` — the one door every `kubectl` command you type goes through.
- `kube-scheduler` — the thing that decides which machine a new container runs on, even though there's only one machine to pick from here.
- `kube-controller-manager` — where that loop Martin described last night actually runs: "runs forever, constantly checking, fixes it if not."

You try one more thing — poke at the API server itself to see what it says back.

```bash
kubectl get pods -n kube-system -o wide
kubectl logs -n kube-system kube-apiserver-ai-workspace-control-plane --tail 5
```

A few lines of log show up, dry, technical, nothing remarkable to read. But that's exactly the point — the same process that just answered your `kubectl get nodes` is logging, right in front of you, live.

Last night, all these names were just words in a blog post. This morning, they're real processes, with real PIDs, running on the very machine your fingers are on.

You open last night's notes, add one more line at the end:

```
Note to self: "control plane" isn't a fuzzy concept.
It's 4-5 specific pods, running in the kube-system
namespace. Just saw them with my own eyes.
```

The cluster exists now, running for real, no longer just something you had to imagine. The coffee still isn't made. You get up to make it, leaving the terminal open exactly as it is — eight pods still running, waiting for you to come back.
