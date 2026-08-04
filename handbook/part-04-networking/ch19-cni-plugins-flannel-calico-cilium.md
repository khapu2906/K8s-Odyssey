# Chapter 19 — CNI Plugins: Flannel, Calico, Cilium

**Part IV — Networking**

**Tier:** Tier 2 — Standard

**Touches `project/` code:** No — cluster-level comparison, no AI Workspace manifests.

---

## 🎯 Mission

Chapter 18 established that Kubernetes delegates all networking to a CNI plugin. `kind` picked one for you by default, silently. Before AI Workspace goes anywhere near production, that silent choice needs to become a deliberate one — because the three most common plugins don't just differ in speed, they differ in what they can enforce and see.

## 📖 Theory

| Plugin | Approach | Notable trait |
|---|---|---|
| **Flannel** | Simple overlay network (typically VXLAN) between Nodes | Easiest to run, minimal features — no built-in NetworkPolicy enforcement |
| **Calico** | Can run as an overlay or as direct BGP routing between Nodes | Adds a real NetworkPolicy engine — the thing Chapter 36 depends on |
| **Cilium** | eBPF-based — programs the Linux kernel directly instead of relying on iptables | Deep observability, NetworkPolicy, and can replace `kube-proxy` entirely (Chapter 58) |

The gotcha worth internalizing now, ahead of Chapter 36: **not every CNI plugin enforces `NetworkPolicy` objects.** You can `kubectl apply` a NetworkPolicy that looks perfectly correct on a Flannel-only cluster, and it will be silently accepted and silently do nothing — because Flannel alone has no policy engine to act on it. That's a dangerous kind of failure: no error, no event, just a false sense of security. Calico and Cilium both enforce policy; plain Flannel does not.

## 🛠 Hands-on

```bash
# check what CNI your cluster is actually running
kubectl get pods -n kube-system -o wide | grep -Ei 'flannel|calico|cilium'

# if using Cilium, its own CLI gives a direct health view
cilium status
```

There's no AI Workspace code change here — this is a cluster-configuration decision, not an application one. The lab walks through standing up a scratch `kind` cluster with each of the three plugins in turn, applying the exact same NetworkPolicy against each, and observing which ones actually enforce it. Full guide: [`labs/ch19/`](../../labs/ch19/).

## 🔬 Under the Hood

Cilium's defining difference is *how* it does what Flannel and Calico do largely with iptables rules: it compiles policy and routing logic directly into the kernel via **eBPF**, bypassing a lot of the iptables chain-matching overhead entirely. That's a preview, not the full story — Chapter 58 covers eBPF and the kube-proxy replacement question in depth, once you've seen kube-proxy's default behavior to compare it against.

## 🚀 Challenge

See [`challenges/ch19/`](../../challenges/ch19/) (easy → expert) — including applying an identical `deny-all` NetworkPolicy on a Flannel-only cluster and a Calico cluster, and documenting the difference in actual enforced behavior.
