# Chapter 17 — Linux Networking Fundamentals

**Part IV — Networking**

**Tier:** Tier 2 — Standard

**Touches `project/` code:** No — standalone lab, no AI Workspace manifests. See [design §4](../../outline.md#4-which-chapters-touch-code-which-dont).

---

## 🎯 Mission

Chapter 9's Service just worked — a name resolved, traffic found a Pod, nothing about it looked like networking at all. Before trusting that abstraction for the rest of the book, it's worth seeing, once, what's actually running underneath a single Pod's network connection — using plain Linux, with nothing Kubernetes-specific involved.

## 📖 Theory

Three primitives, all older than Kubernetes and all still doing the real work underneath it:

- **Network namespace** — an isolated network stack: its own interfaces, routing table, IP addresses, completely separate from the host's. Every Pod runs inside one. This is *why* a Pod can have its own IP and its own `localhost`, distinct from the Node it's running on.
- **veth pair** — two virtual network interfaces that act like a virtual Ethernet cable: whatever goes in one end comes out the other. One end lives inside the Pod's network namespace; the other end lives on the Node, connecting the Pod to everything else.
- **Bridge** — a virtual switch. The Node-side ends of every Pod's veth pair plug into the same bridge, which is what lets Pods on the same Node reach each other directly, and reach the Node itself.

That's the entire mechanism behind "every Pod gets its own IP": a network namespace, wired to a bridge, via a veth pair. Chapter 18 shows who actually builds this for every Pod, automatically. This chapter builds it by hand, once, so it stops being a black box.

## 🛠 Hands-on

No cluster needed for this one — just a Linux machine or VM with root access (if you're on macOS, run this inside `kind`'s Docker-based Node, or any Linux VM).

```bash
# create two isolated network namespaces
sudo ip netns add ns1
sudo ip netns add ns2

# create a veth pair, one end for each namespace
sudo ip link add veth1 type veth peer name veth2
sudo ip link set veth1 netns ns1
sudo ip link set veth2 netns ns2

# give each end an IP, bring them up
sudo ip netns exec ns1 ip addr add 10.0.0.1/24 dev veth1
sudo ip netns exec ns1 ip link set veth1 up
sudo ip netns exec ns1 ip link set lo up

sudo ip netns exec ns2 ip addr add 10.0.0.2/24 dev veth2
sudo ip netns exec ns2 ip link set veth2 up
sudo ip netns exec ns2 ip link set lo up

# they can now reach each other directly, with nothing else involved
sudo ip netns exec ns1 ping -c 3 10.0.0.2
```

That single successful ping is, in miniature, exactly what lets two containers in the same Pod (or two Pods on the same bridge) reach each other. Full guide with a third namespace and a bridge added in: [`labs/ch17/`](../../labs/ch17/).

## 🔬 Under the Hood

Now go find the real thing. On a Node running an actual Pod:

```bash
# find the Pod's container PID, then look at its network namespace
crictl inspect <container-id> | grep -i pid
sudo nsenter -t <pid> -n ip addr
sudo ip link show   # look for a veth interface on the host side
```

The interface you find is not conceptually different from `veth1`/`veth2` above — same primitive, just created and wired up automatically the moment the Pod was scheduled. Chapter 18 covers exactly what creates it.

## 🚀 Challenge

See [`challenges/ch17/`](../../challenges/ch17/) (easy → expert) — including building a three-namespace setup, bridging all three together, and getting every namespace to ping every other one.
