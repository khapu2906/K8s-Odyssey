# Chapter 20 — Service Deep Dive

**Part IV — Networking**

**Tier:** Tier 2 — Standard

**Touches `project/` code:** Yes — tag `ch20`.

---

## 🎯 Mission

Every Service so far has been a `ClusterIP` — internal-only, which was correct for `chat-api` and `postgres` talking to each other. But the frontend needs to be reachable from an actual browser, outside the cluster, and Chapter 9's production notes only hinted at why `NodePort` isn't really the answer. Time to see all four Service types side by side and understand exactly what each one is for.

## 📖 Theory

| Type | Reachable from | What it actually does |
|---|---|---|
| **ClusterIP** (default) | Inside the cluster only | A stable virtual IP, load-balanced across matching Pods. What `chat-api` and `postgres` use. |
| **NodePort** | Anywhere that can reach any Node's IP | Opens the same port on *every* Node, forwarding to the ClusterIP behind it. Works, but ties you to Node IPs and an ugly high port number. |
| **LoadBalancer** | The public internet (in a cloud) | Asks the cloud provider to provision a real external load balancer in front of a NodePort. Does nothing useful on a bare-metal or local cluster without extra tooling. |
| **ExternalName** | N/A — it's a DNS alias | Maps a Service name to an external DNS name (e.g. a managed database outside the cluster), so in-cluster code can use the same `Service` pattern for things that aren't even in Kubernetes. |

Two more knobs worth knowing exist, both configured on any Service: **session affinity** (`sessionAffinity: ClientIP`, for the rare case where a client needs to keep hitting the same backing Pod), and **`externalTrafficPolicy`** (whether traffic arriving at a Node gets forwarded to Pods on *any* Node, or only Pods local to the Node that received it — trading even load distribution for preserving the client's real source IP).

## 🛠 Hands-on

Redeploy Chapters 13, 15, and 16's setup first, then compare NodePort against what a LoadBalancer would look like in a real cloud:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-nodeport
  namespace: ai-workspace
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
    - port: 3000
      targetPort: 3000
      nodePort: 30080
```

```bash
kubectl apply -f frontend-nodeport.yaml
curl http://localhost:30080   # via kind's port mapping
kubectl get svc frontend-nodeport -n ai-workspace
```

Full guide: [`labs/ch20/`](../../labs/ch20/). Code: `git checkout ch20` in [`project/`](../../project/) — this tag adds `frontend-nodeport.yaml` purely for comparison; it's not what AI Workspace ships with, which is exactly the point Chapter 21 makes next.

## 🔬 Under the Hood

```bash
kubectl get endpointslices -n ai-workspace
iptables -t nat -L -n | grep <service-cluster-ip>   # on the Node itself
```

Every Service type in the table above, no matter how traffic gets to the cluster, ends at the same place: `kube-proxy` programming rules (iptables by default) that ultimately point at Pod IPs from an EndpointSlice — the exact mechanism from Chapter 9. `NodePort` and `LoadBalancer` are just different *front doors* onto that same underlying ClusterIP machinery, not a different routing mechanism. Chapter 58 opens up exactly what those iptables rules look like and why some clusters replace them with eBPF instead.

## 🚀 Challenge

See [`challenges/ch20/`](../../challenges/ch20/) (easy → expert) — including creating an `ExternalName` Service pointing at a managed database hostname and using it from a Pod exactly like an in-cluster Service.
