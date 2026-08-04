# Chapter 22 — Gateway API

**Part IV — Networking**

**Tier:** Tier 2 — Standard

**Touches `project/` code:** Yes — tag `ch22`.

---

## 🎯 Mission

Chapter 21's Ingress works, but two real limits are already visible: routing beyond simple host/path rules (say, sending 10% of traffic to a new `chat-api` version) meant reaching for nginx-specific annotations — magic strings that wouldn't mean anything to a different controller. And as AI Workspace grows toward more teams (Part IX foreshadowing), one flat Ingress object doesn't cleanly separate "the infra team manages the domain and TLS" from "the app team manages routing for their service."

## 📖 Theory

**Gateway API** is the newer, more expressive successor to Ingress, built from the start around a **role-oriented split** instead of one flat object:

- **GatewayClass** — defines what kind of proxy implementation is available (nginx, Envoy, cloud-managed) — usually managed by a platform/infra team.
- **Gateway** — a concrete listener: a domain, a port, TLS config. Also typically infra-owned.
- **HTTPRoute** — the actual routing rules ("path `/api` goes to `chat-api`") — owned by whichever team owns that service, and able to attach to a Gateway it doesn't otherwise control.

This split means an app team can ship routing changes for their own service without ever touching, or needing permission to touch, the shared Gateway — a real improvement over one Ingress object everyone has to coordinate around. Gateway API also standardizes things Ingress only ever supported through controller-specific annotations, like traffic splitting and header-based matching, as first-class, portable fields.

## 🛠 Hands-on

Redeploy Chapters 15, 16, and 21's setup first, then express the same routing from Chapter 21 using Gateway API instead:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: ai-workspace-gateway
  namespace: ai-workspace
spec:
  gatewayClassName: nginx
  listeners:
    - name: http
      port: 80
      protocol: HTTP
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: chat-api-route
  namespace: ai-workspace
spec:
  parentRefs:
    - name: ai-workspace-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: chat-api
          port: 8080
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: frontend
          port: 3000
```

```bash
kubectl apply -f gateway.yaml
kubectl apply -f chat-api-route.yaml
kubectl get gateway,httproute -n ai-workspace
curl http://ai-workspace.local/api/health
```

Full guide: [`labs/ch22/`](../../labs/ch22/). Code: `git checkout ch22` in [`project/`](../../project/).

## 🔬 Under the Hood

```bash
kubectl describe gateway ai-workspace-gateway -n ai-workspace
```

Notice `HTTPRoute` lives in the `ai-workspace` namespace and references the `Gateway` by name, rather than the `Gateway` needing to know about every route in advance — the same relationship, structurally, as a Deployment (Chapter 7) not needing to know how many Services point at it. This decoupling is deliberate: it's what makes it safe for an app team to own `HTTPRoute` objects without ever holding write access to the shared `Gateway`.

## 🚀 Challenge

See [`challenges/ch22/`](../../challenges/ch22/) (easy → expert) — including using `HTTPRoute`'s weighted `backendRefs` to split traffic 90/10 between two versions of `chat-api`, something Chapter 21's plain Ingress had no portable way to express.
