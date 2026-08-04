# Chapter 21 — Ingress & Ingress Controller

**Part IV — Networking**
**Tier:** Tier 1 — Core
**Touches `project/` code:** Yes — tag `ch21`.

---

## 🎯 Mission

AI Workspace now has a frontend and `chat-api`, both needing to be reachable over HTTP from outside the cluster, on real domain names, ideally with TLS, and without giving every service its own `NodePort` (Chapter 20 already showed why that doesn't scale past one service). There needs to be a single, sane front door.

## 📖 Theory

Two objects, easy to conflate, doing very different jobs:

- **Ingress** — a set of routing rules: "requests to `ai-workspace.dev/` go to `frontend`, requests to `ai-workspace.dev/api` go to `chat-api`." It's declarative data, nothing more.
- **Ingress Controller** — the actual running software (commonly nginx, though others exist) that watches Ingress objects and configures a real reverse proxy to match.

The gotcha that catches almost everyone once: **an Ingress object with no Ingress Controller installed does absolutely nothing.** `kubectl apply` will succeed, `kubectl get ingress` will show your rules, and zero traffic will be routed, silently — because nothing is reading those rules and turning them into actual proxy config. The Ingress resource is a request; the controller is what fulfills it. You need both, always.

## 🛠 Hands-on

Redeploy Chapters 13, 15, and 16's setup first, then install a controller before writing any rules:

```bash
# nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl get pods -n ingress-nginx -w
```

Once the controller Pod is `Running`, the rules:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-workspace
  namespace: ai-workspace
spec:
  ingressClassName: nginx
  rules:
    - host: ai-workspace.local
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: chat-api
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
```

```bash
kubectl apply -f ingress.yaml
echo "127.0.0.1 ai-workspace.local" | sudo tee -a /etc/hosts
curl http://ai-workspace.local/api/health
curl http://ai-workspace.local/
```

Full guide: [`labs/ch21/`](../../labs/ch21/). Code: `git checkout ch21` in [`project/`](../../project/).

## 🔬 Under the Hood

```bash
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller | tail -20
```

Every time your Ingress object changed, the controller noticed (via the same watch mechanism from Chapter 4 — it's just another controller loop, running outside `kube-system` this time), regenerated its internal nginx config, and reloaded — all without you touching the proxy directly. Path-based routing here (`/api` vs `/`) is resolved entirely inside the controller; by the time traffic reaches `chat-api`'s Service, it's an ordinary ClusterIP request exactly like Chapter 9.

## 🧰 Production Notes

TLS termination almost always belongs at the Ingress layer, not in each individual service — one certificate configuration point instead of N. Also worth knowing before Chapter 30: most Ingress controllers extend behavior through **annotations**, which are controller-specific and not portable between nginx, Traefik, and others — a real limitation that Chapter 22's Gateway API was designed to fix.

## 🐞 Debug Lab

With the Ingress from Hands-on working, delete the Ingress Controller's Deployment entirely:

```bash
kubectl delete deployment ingress-nginx-controller -n ingress-nginx
```

Everything that was reaching AI Workspace through `ai-workspace.local` breaks — but `kubectl get ingress` still shows your rules, unchanged, looking perfectly healthy. Use `kubectl get pods -n ingress-nginx`, `curl -v`, and what you now know about the Ingress/Controller split to explain exactly why, before checking [`incidents/ch21/`](../../incidents/ch21/).

## 💬 Interview Questions

- What's the difference between an Ingress resource and an Ingress Controller, concretely?
- Why does applying a valid Ingress YAML sometimes result in zero traffic being routed?
- How does host-based routing differ from path-based routing, and can you combine them?
- Where does TLS termination typically happen in an Ingress setup, and why there?

## 🚀 Challenge

See [`challenges/ch21/`](../../challenges/ch21/) (easy → expert) — including adding a self-signed TLS certificate to the Ingress and confirming HTTPS termination happens at the controller, not at `chat-api` or `frontend`.
