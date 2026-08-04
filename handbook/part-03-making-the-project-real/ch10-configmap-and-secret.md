# Chapter 10 — ConfigMap & Secret

**Part III — Making the Project Real**
**Tier:** Tier 1 — Core
**Touches `project/` code:** Yes — tag `ch10`.

---

## 🎯 Mission

Look back at the `chat-api` Deployment from Chapter 7: the Postgres password has been sitting in plain text, inline, in a YAML file — the same file that's about to go into Git. And every environment (your laptop, staging, production) would need its own copy of that file just to change one connection string. Neither is acceptable now that this is a real, growing product.

## 📖 Theory

Kubernetes splits configuration into two objects with the same shape but different intent:

- **ConfigMap** — for configuration that isn't sensitive: a database hostname, a feature flag, a log level.
- **Secret** — for configuration that is: passwords, API keys, tokens.

Structurally, a Secret is barely different from a ConfigMap — its values are stored **base64-encoded**, not encrypted. Base64 is an encoding, not a cipher; anyone with read access to the Secret can decode it in one command. Kubernetes treats Secrets a little more carefully at the API and tooling level (they're excluded from some default output, for instance), but "encoded" is not "protected." Real protection requires encrypting etcd at rest and controlling *who* can read Secrets via RBAC (Chapter 35) — this chapter gives you the mechanism; Chapter 38 gives you the production-grade version.

Both can be consumed by a Pod two ways: as **environment variables**, or **mounted as files** in a volume. They behave differently when updated, which the Under the Hood section below demonstrates directly.

## 🛠 Hands-on

Redeploy Chapters 6, 7, and 9's `chat-api` Deployment and Service first, then extract its configuration:

```yaml
# chat-api-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: chat-api-config
  namespace: ai-workspace
data:
  DATABASE_HOST: postgres
  DATABASE_PORT: "5432"
  DATABASE_NAME: aiworkspace
---
apiVersion: v1
kind: Secret
metadata:
  name: chat-api-secret
  namespace: ai-workspace
type: Opaque
stringData:
  DATABASE_PASSWORD: postgres   # stringData lets you write plain text; Kubernetes base64-encodes it for you
```

```yaml
# chat-api-deployment.yaml (relevant excerpt)
        envFrom:
          - configMapRef:
              name: chat-api-config
        env:
          - name: DATABASE_PASSWORD
            valueFrom:
              secretKeyRef:
                name: chat-api-secret
                key: DATABASE_PASSWORD
```

```bash
kubectl apply -f chat-api-config.yaml
kubectl apply -f chat-api-deployment.yaml
kubectl get secret chat-api-secret -n ai-workspace -o jsonpath='{.data.DATABASE_PASSWORD}' | base64 -d
```

That last command is the entire point of the earlier warning — decoding a Secret takes one line. Full guide: [`labs/ch10/`](../../labs/ch10/). Code: `git checkout ch10` in [`project/`](../../project/).

## 🔬 Under the Hood

```bash
kubectl edit configmap chat-api-config -n ai-workspace
```

If `DATABASE_HOST` were mounted as a **file** (a volume), the running container would see the new value within roughly a minute, without a restart — the kubelet periodically re-syncs mounted ConfigMap/Secret volumes. But because this chapter wired it in as an **environment variable**, nothing happens: environment variables are set once, at container start, and Kubernetes has no mechanism to reach into a running process and change its environment. This is a common source of "I updated the ConfigMap but nothing changed" confusion — the fix is always a rollout (Chapter 8), not waiting.

## 🧰 Production Notes

Never commit a real Secret's YAML to Git, `stringData` or not — base64 is not protection, and Git history is forever. In real deployments, Secrets are usually generated at deploy time from a proper secret manager rather than checked in at all (Chapter 38 covers Vault and External Secrets). Also worth remembering: anyone who can `kubectl get secret -o yaml` in a namespace can read every Secret in it — Secrets are only as safe as your RBAC (Chapter 35).

## 🐞 Debug Lab

Introduce a one-character typo in the Secret's key name (`DATABASE_PASSWROD`) but reference the correct name in the Deployment, or vice versa, then redeploy. Use `kubectl describe pod` and `kubectl logs` to work out why `chat-api` won't start, before checking [`incidents/ch10/`](../../incidents/ch10/).

## 💬 Interview Questions

- Is a Kubernetes Secret actually encrypted? What would make it encrypted?
- When would you choose a ConfigMap over a Secret, and vice versa?
- If you update a ConfigMap that's mounted as a volume, does a running Pod see the change? What if it's injected as an environment variable instead?
- Who can read a Secret's value, and what actually controls that?

## 🚀 Challenge

See [`challenges/ch10/`](../../challenges/ch10/) (easy → expert) — including switching `DATABASE_HOST` from an env var to a mounted volume and proving, experimentally, that it now updates live without a rollout.
