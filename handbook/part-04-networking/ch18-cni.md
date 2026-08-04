# Chapter 18 — CNI

**Part IV — Networking**

**Tier:** Tier 2 — Standard

**Touches `project/` code:** No — standalone lab, no AI Workspace manifests.

---

## 🎯 Mission

Chapter 17 built one Pod's worth of networking by hand — a namespace, a veth pair, a bridge — and it took a dozen commands. A real cluster does this correctly, in milliseconds, for every single Pod, on every Node, all day, without Kubernetes' core code containing a single line about veth pairs or bridges. Something else is doing that work. Time to meet it.

## 📖 Theory

**CNI (Container Network Interface)** is a specification, not a product — a simple contract between the **kubelet** and a **plugin binary**. When a Pod is scheduled to a Node, the kubelet (via the container runtime) invokes the installed CNI plugin with an `ADD` command and a bit of JSON config; the plugin's job is to do exactly what Chapter 17 did by hand — create the namespace, wire up networking, assign an IP — and report back the result. On Pod deletion, the kubelet calls the same plugin with `DEL`, and it tears everything down.

This is a deliberate design choice: **Kubernetes itself has no networking implementation**. It delegates entirely to whichever CNI plugin is installed, which is exactly why "which CNI should I use" is a real, consequential decision (Chapter 19) rather than a fixed default — swapping the plugin changes how every Pod actually gets connected, without changing a single line of Kubernetes core.

## 🛠 Hands-on

```bash
# see which plugin is actually installed on a kind Node
docker exec -it ai-workspace-control-plane cat /etc/cni/net.d/*.conflist

# watch it get invoked, live — create a Pod in one terminal,
# watch container runtime logs in another
kubectl run test-pod --image=nginx -n ai-workspace
crictl --runtime-endpoint unix:///run/containerd/containerd.sock ps -a | grep test-pod
journalctl -u containerd -f   # or: docker logs, depending on your kind setup
```

The IP the new Pod ends up with, and the veth interface that appears on the Node afterward (`ip link show`), are the CNI plugin's output — the same primitives from Chapter 17, just built automatically. Full guide: [`labs/ch18/`](../../labs/ch18/).

## 🔬 Under the Hood

```
kubelet
   │  "a Pod needs networking"
   ▼
container runtime (containerd)
   │  invokes the CNI plugin binary with ADD + config JSON
   ▼
CNI plugin
   │  creates netns, veth pair, bridge attachment, assigns IP
   │  (exactly Chapter 17's manual steps)
   ▼
returns IP + interface info → kubelet records Pod IP
```

Every Pod IP you've seen in every `kubectl get pods -o wide` since Chapter 6 came from this exact flow. The CNI plugin is also who decides *how* Pods on different Nodes reach each other — via an overlay network, direct routing, or something else entirely — which is the whole subject of Chapter 19.

## 🚀 Challenge

See [`challenges/ch18/`](../../challenges/ch18/) (easy → expert) — including deleting a Pod and confirming, via `ip link show` on its Node, that the CNI plugin actually tore down the veth interface it created.
