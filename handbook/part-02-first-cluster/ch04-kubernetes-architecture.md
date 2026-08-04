# Chapter 4 — Kubernetes Architecture

**Part II — First Cluster**

**Tier:** Tier 2 — Standard

**Touches `project/` code:** No — this chapter only creates a local cluster; the first `project/` tag appears in Chapter 6.

---

## 🎯 Mission

The team has agreed: AI Workspace is moving to Kubernetes. Before running a single command against it, you need to know what you're actually talking to — what a "cluster" is made of, and who's doing what inside it.

## 📖 Theory

A Kubernetes cluster is a set of machines (**Nodes**) split into two roles:

- **Control plane** — the brain. It decides *what should be running*, but never runs your application containers itself.
- **Worker nodes** — the muscle. This is where your Pods actually run.

The control plane is made of a small number of processes, each with one job:

| Component | Job |
|---|---|
| **API Server** | The front door. Every interaction with the cluster — including your own `kubectl` commands — goes through it, and only it. |
| **etcd** | The cluster's memory: a key-value store holding the entire desired and actual state. Nothing else talks to etcd directly except the API Server. |
| **Scheduler** | Decides *which Node* a new Pod should run on, based on resource requests, constraints, and current load. |
| **Controller Manager** | Runs the reconcile loops from Chapter 3's "observe, compare, correct" pattern — one loop per resource type. |

Each worker Node runs:

| Component | Job |
|---|---|
| **kubelet** | The agent that actually starts and stops containers on this Node, and reports their status back to the API Server. |
| **kube-proxy** | Sets up the network rules so traffic reaches the right Pods on this Node (full deep dive in Chapter 58). |
| **Container runtime** | The engine that actually runs containers (containerd, in most modern clusters). |

Put together, this is Chapter 3's reconcile loop made concrete: you (or a controller) tell the **API Server** what you want, it's recorded in **etcd**, the **Scheduler** picks a Node, that Node's **kubelet** makes it real, and the loop keeps checking, forever, that reality still matches what was asked for.

## 🛠 Hands-on

Every cluster needs somewhere to run. For this book, that's a local, disposable cluster — no cloud account, no cost.

```bash
# using kind (Kubernetes in Docker)
kind create cluster --name ai-workspace

kubectl cluster-info
kubectl get nodes
```

You should see a single Node, `Ready`. That one Node is quietly playing both roles at once — control plane and worker — because `kind` runs everything as containers on your machine. Now look at the control plane components themselves:

```bash
kubectl get pods -n kube-system
```

The API Server, etcd, Scheduler, and Controller Manager from the table above are, themselves, running as Pods, inside a special namespace called `kube-system`. There's no `project/` tag for this chapter — it only creates the cluster. AI Workspace's first real Pod arrives in Chapter 6.

## 🔬 Under the Hood

```bash
kubectl get pods -n kube-system -o wide
kubectl logs -n kube-system <api-server-pod-name>
```

You're reading the API Server's own logs — the same process that answers every `kubectl` command in this book, including the one you just used to look at it. Chapter 51 goes much deeper into what happens inside that process on every request; for now, just notice it's a real, inspectable process, not magic.

## 🚀 Challenge

See [`challenges/ch04/`](../../challenges/ch04/) (easy → expert) — including deleting a control plane Pod in `kube-system` by hand and observing what happens next.
