# Chapter 12 — Not Much of a Secret

## A few days later

The cluster's been quiet for days, no new CrashLoopBackOff. This morning the founder stops by someone's desk, talking about an enterprise customer raising security concerns before signing a contract — asking outright whether passwords are actually stored safely, who could read them. Not said to you directly, but it lands anyway, sits there the rest of the morning.

About to `git add project/infs/` to commit the last few days' worth of YAML, you stop halfway through. You open `postgres.yaml` again, look straight at the line you typed back in Chapter 8 and never thought about again:

```yaml
env:
  - name: POSTGRES_PASSWORD
    value: postgres
```

Plaintext. Sitting right in a file about to be committed, about to go up to GitHub, readable by anyone who ever looks at the repo's history. Three weeks ago there's already a line written for exactly this:

```
Need secrets
→ there's a dedicated object called "Secret" for passwords/API
keys, and "ConfigMap" for non-sensitive config — not committed
straight into code or a compose file like it is now
```

```bash
kubectl explain secret
```

```
KIND:     Secret
VERSION:  v1

DESCRIPTION:
    Secret holds secret data of a certain type. The total bytes of
    the values in the Data field must be less than MaxSecretSize
    bytes.
```

Says nothing about encryption at all, just "holds secret data." You try creating one directly first, but remember the "write the file first" lesson from Chapter 5, adding `--dry-run=client -o yaml` to get a YAML file out of it instead of creating it directly.

```bash
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD=postgres \
  -n ai-workspace \
  --dry-run=client -o yaml > postgres-secret.yaml
```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: ai-workspace
data:
  POSTGRES_PASSWORD: cG9zdGdyZXM=
type: Opaque
```

`cG9zdGdyZXM=`. Looks like it's been hidden somewhere. Curious, you try decoding it, see how "safe" it actually is.

```bash
echo "cG9zdGdyZXM=" | base64 -d
```

```
postgres
```

Instantly, no key, no special permission needed. Ah. `Secret` doesn't encrypt anything at all — it's just base64, an *encoding* to fit arbitrary data into text-based YAML, not *encryption*. Anyone with `kubectl get secret -o yaml` access on this cluster can read it exactly the way you just did, one command away. What's actually safer than writing `value: postgres` directly lives elsewhere: it's not sitting in plain sight in an ordinary YAML file, access can be scoped through RBAC (even though you haven't configured any RBAC at all) — not that it's locked away.

```bash
kubectl apply -f postgres-secret.yaml
```

```
secret/postgres-secret created
```

You edit `postgres.yaml`, swap the `value: postgres` line for a reference to the Secret you just created.

```yaml
env:
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgres-secret
        key: POSTGRES_PASSWORD
  - name: POSTGRES_DB
    value: aiworkspace
```

Done with `postgres`, you turn to `chat-api-deployment.yaml`, meaning to do the exact same thing — then stop. `chat-api`'s `DATABASE_URL` is one single string, the password sitting buried in the middle of it:

```
postgres://postgres:postgres@postgres:5432/aiworkspace
```

`secretKeyRef` replaces an entire environment variable's value, not a fragment in the middle of a string. There's no way to pull just that second `postgres` out of it with plain YAML. To use a Secret the way it's meant to be used, `DATABASE_URL` needs to be split into separate pieces, with `chat-api` assembling them itself at runtime.

You open `chat-api/src/db.js`, change how the `Pool` gets built:

```js
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});
```

Instead of one long `connectionString`, now five separate variables — four of them not sensitive, left as plain `value`, and exactly one — the password — pointed at `secretKeyRef`, reusing the same Secret already created for `postgres`.

```yaml
env:
  - name: POSTGRES_HOST
    value: postgres
  - name: POSTGRES_PORT
    value: "5432"
  - name: POSTGRES_USER
    value: postgres
  - name: POSTGRES_DB
    value: aiworkspace
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgres-secret
        key: POSTGRES_PASSWORD
```

Changing code means rebuilding the image, same routine from Chapter 6.

```bash
docker build -t ai-workspace/chat-api:dev ./chat-api
kind load docker-image ai-workspace/chat-api:dev --name ai-workspace
kubectl apply -f postgres-secret.yaml -f postgres.yaml -f chat-api-deployment.yaml
kubectl delete pod -n ai-workspace -l app=chat-api
```

```
secret/postgres-secret unchanged
deployment.apps/postgres configured
deployment.apps/chat-api configured
```

You wait for the new Pods to come up, `port-forward` again to check, same as always.

```bash
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

```bash
curl -s http://localhost:8080/api/conversations
```

```json
[{"id":1,"message":"does it remember this time","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-16T08:12:03.447Z"}]
```

The old data is still there, `chat-api` still connects to `postgres` fine — just neither YAML file has a real password sitting in it anymore.

You open the notes from the night you read that README, cross off one more line from that nine-line list, three weeks old now:

```
Need secrets ✓ Secret — just base64, NOT encryption, anyone
with read access to secrets in this cluster still sees the
real password, it's only separated from sitting in plain
sight in an ordinary YAML file. DATABASE_URL can't mix a
Secret into the middle of a string, had to split it into
separate variables — chat-api/src/db.js changed too.
```

Nine lines three weeks ago, six of them checked off now — scheduling, health checks, and the `???` — "Need observability" — still left, untouched exactly as they were the night that list got written. You `git add` `project/` again, feeling a lot steadier about it than you did an hour ago.
