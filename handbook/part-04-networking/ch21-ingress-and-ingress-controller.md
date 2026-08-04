# Chapter 21 — Ingress & Ingress Controller

**Part IV — Networking**
**Tier:** Tier 1 — Core
**Touches `project/` code:** Yes — tag `ch21`.

---

## 🎯 Mission

`frontend` and `chat-api` both have stable Services now (Chapter 20), but both are `ClusterIP` — reachable only from inside the cluster. The `NodePort` experiment from that same chapter technically worked, but it left you with a five-digit port nobody will remember, and a nagging feeling it won't hold up once a third service — Auth, eventually — joins and needs its own port too. Real users need to open a browser, go to a real domain, and land on AI Workspace over HTTPS. One `NodePort` per service was never going to get you there.

You go looking for how other teams solve this, and the same two words keep showing up together in every guide you find: **Ingress**, and **Ingress Controller**. Half the blog posts use them like synonyms. They aren't.

## 📖 Theory

Turns out **Ingress** is the easy half: a plain Kubernetes object, nothing but routing rules — "requests to `ai-workspace.dev/` go to `frontend`, requests to `/api` go to `chat-api`." No process, no proxy, just declared intent. The same shape, really, as a Deployment declaring "three replicas should exist" without doing the work of running them itself (Chapter 7).

The **Ingress Controller** is the other half, and it's the one nobody explains clearly enough up front: actual running software — commonly nginx, though Traefik and others exist — that watches Ingress objects and configures a real reverse proxy to match. Skip installing one, and here's the trap that catches almost everyone exactly once: `kubectl apply` on a perfectly valid Ingress succeeds, `kubectl get ingress` shows your rules looking healthy, and **zero traffic gets routed** — because nothing is reading those rules and turning them into real proxy config. An Ingress resource is a request addressed to nobody in particular; the Controller is who actually answers it. You need both, always, and the object alone tells you nothing about whether the controller exists.

Weighed against another round of `NodePort`, the trade is straightforward: one Controller, installed once, becomes the single front door for every service AI Workspace ever adds, instead of a new memorized port number each time. It also gives you exactly one place to terminate TLS, instead of wiring a certificate into every service individually. The cost is the thing you just got burned by — a second moving part (the controller) that has to actually be running for any of it to work, and a routing language (annotations for anything beyond basic host/path rules) that's specific to whichever controller you picked, not portable if you switch later.

That last point is worth sitting with for a moment, not glossing over: everything Ingress can express beyond "this host and path go to that Service" — rewrites, redirects, rate limiting — is bolted on through free-text **annotations**, keys and values a given controller chooses to understand and nothing enforces the meaning of. Two clusters running two different controllers can have Ingress YAML that looks identical and behaves completely differently. For AI Workspace right now — one domain, two simple path rules, no exotic routing yet — that's an acceptable trade. Chapter 22 covers the newer alternative built specifically to fix this, once you've felt the annotation problem firsthand rather than just been told about it.

Decision made: install nginx as the Ingress Controller once, then describe `frontend` and `chat-api`'s routing as an Ingress object — rules as data, no proxy config touched by hand.

## 🛠 Hands-on

Redeploy Chapters 13, 15, and 16's setup first. The controller has to exist *before* any Ingress rules will do anything, so install it first and confirm it's actually running:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl get pods -n ingress-nginx -w
```

Wait until that Pod shows `Running`, `1/1` — not before. Now the rules:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-workspace
  namespace: ai-workspace
spec:
  ingressClassName: nginx   # tells the controller "this Ingress is mine"
  rules:
    - host: ai-workspace.local
      http:
        paths:
          - path: /api          # anything under /api...
            pathType: Prefix
            backend:
              service:
                name: chat-api  # ...goes to chat-api's Service (Chapter 9)
                port:
                  number: 8080
          - path: /              # everything else...
            pathType: Prefix
            backend:
              service:
                name: frontend  # ...goes to frontend's Service
                port:
                  number: 3000
```

`ingressClassName: nginx` matters more than it looks — on a cluster running more than one Ingress Controller, it's the only thing telling *this* controller the Ingress belongs to it. Apply it, point a hostname at the cluster, and check both routes:

```bash
kubectl apply -f ingress.yaml
kubectl get ingress -n ai-workspace   # ADDRESS should populate once the controller notices it

echo "127.0.0.1 ai-workspace.local" | sudo tee -a /etc/hosts
curl http://ai-workspace.local/api/health
curl http://ai-workspace.local/
```

Full guide: [`labs/ch21/`](../../labs/ch21/). Code: `git checkout ch21` in [`project/`](../../project/).

## 🔬 Under the Hood

```bash
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller | tail -20
```

Every time the Ingress object changed, the controller noticed — through the same watch mechanism from Chapter 4, just another controller loop, running outside `kube-system` this time — regenerated its internal nginx config, and reloaded, without you touching the proxy directly. Path-based routing (`/api` vs `/`) is resolved entirely inside the controller; by the time a request reaches `chat-api`'s Service, it's an ordinary ClusterIP request exactly like Chapter 9, with no memory of ever having been an Ingress rule.

## 🧰 Production Notes

TLS termination almost always belongs at the Ingress layer — one certificate configuration point instead of N services each handling their own. And now that you've felt the annotation trap directly: before copying Ingress YAML with heavy annotations from a tutorial, check which controller it assumes. It may simply do nothing on yours.

## 🐞 Debug Lab

With the Ingress from Hands-on working, delete the Ingress Controller's Deployment entirely:

```bash
kubectl delete deployment ingress-nginx-controller -n ingress-nginx
```

Everything reaching AI Workspace through `ai-workspace.local` breaks — but `kubectl get ingress` still shows your rules, unchanged, looking perfectly healthy. Use `kubectl get pods -n ingress-nginx`, `curl -v`, and what you now know about the Ingress/Controller split to explain exactly why, before checking [`incidents/ch21/`](../../incidents/ch21/).

## 💬 Interview Questions

- What's the difference between an Ingress resource and an Ingress Controller, concretely?
- Why can applying a valid Ingress YAML still result in zero traffic being routed?
- How does host-based routing differ from path-based routing, and can you combine them?
- Why are Ingress annotations not portable between controllers, and what real problem does that cause?

## 🚀 Challenge

See [`challenges/ch21/`](../../challenges/ch21/) (easy → expert) — including adding a self-signed TLS certificate to the Ingress and confirming HTTPS termination happens at the controller, not at `chat-api` or `frontend`.
