# Chapter 29 — One Chart, Two Environments

## Start of the week

`project/infs/` now holds twelve files: `postgres.yaml`, `postgres-pvc.yaml`, `postgres-secret.yaml`, `chat-api-deployment.yaml`, `chat-api-service.yaml`, `chat-api-secret.yaml`, `redis.yaml`, `frontend-deployment.yaml`, `ingress.yaml`, `ai-workspace-alerts.yaml`, `argocd-application.yaml`, `kind-config.yaml`. The founder asks a new question: could an identical copy get set up for the QA team to test against, separate from the one running day to day?

Copy the whole folder, change a few things (`replicas`, `resources`, the namespace name) — doable, but from now on every time the real `chat-api-deployment.yaml` changes, the copy has to be remembered too, with nothing guaranteeing the two stay in sync after a few weeks. Exactly the problem Helm exists to solve — not just for installing charts someone else wrote, the way it's been used so far, but for **writing your own chart**.

### From static files to a template

A minimal chart needs exactly two things: a `Chart.yaml` (declaring name, version) and a `templates/` folder holding YAML files, differing from plain YAML only in being able to insert variables.

```yaml
# project/chart/Chart.yaml
apiVersion: v2
name: ai-workspace
version: 0.1.0
```

Take `chat-api-deployment.yaml`, replace the numbers that change between environments with variables.

```yaml
# project/chart/templates/chat-api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-api
  namespace: {{ .Values.namespace }}
spec:
  replicas: {{ .Values.chatApi.replicas }}
  selector:
    matchLabels:
      app: chat-api
  template:
    metadata:
      labels:
        app: chat-api
    spec:
      containers:
        - name: chat-api
          image: "{{ .Values.chatApi.image }}:{{ .Values.chatApi.tag }}"
          resources:
            requests:
              cpu: {{ .Values.chatApi.resources.requests.cpu }}
              memory: {{ .Values.chatApi.resources.requests.memory }}
            limits:
              cpu: {{ .Values.chatApi.resources.limits.cpu }}
              memory: {{ .Values.chatApi.resources.limits.memory }}
```

`{{ .Values.xxx }}` — Helm's own template syntax (built on Go templates), filling in real values from `values.yaml` at the exact spot when `helm install`/`helm template` runs. Once rendered, the YAML is still ordinary Kubernetes YAML, nothing mysterious about it — just generated from a mold instead of typed out by hand each time.

```yaml
# project/chart/values.yaml — the default, effectively "production"
namespace: ai-workspace
chatApi:
  image: ghcr.io/khapu2906/kubernetes-odyssey/chat-api
  tag: latest
  replicas: 3
  resources:
    requests: { cpu: 100m, memory: 128Mi }
    limits: { cpu: 250m, memory: 256Mi }
```

```yaml
# project/chart/values-staging.yaml — only what DIFFERS from the default
namespace: ai-workspace-staging
chatApi:
  replicas: 1
  resources:
    requests: { cpu: 50m, memory: 64Mi }
    limits: { cpu: 100m, memory: 128Mi }
```

`values-staging.yaml` doesn't repeat everything — only the parts that differ from the default `values.yaml`, Helm merges the two on its own (the later file overriding the earlier one).

### One command, two environments

```bash
helm install ai-workspace ./project/chart -n ai-workspace --create-namespace
helm install ai-workspace-staging ./project/chart \
  -f project/chart/values-staging.yaml \
  -n ai-workspace-staging --create-namespace
```

```
NAME: ai-workspace
STATUS: deployed
---
NAME: ai-workspace-staging
STATUS: deployed
```

```bash
kubectl get deployment chat-api -n ai-workspace-staging
```

```
NAME       READY   UP-TO-DATE   AVAILABLE
chat-api   1/1     1            1
```

Exactly `replicas: 1` as declared in `values-staging.yaml`, while the original `ai-workspace` still runs `3`. Same chart, same single source of truth, two copies running side by side without colliding — thanks to a different namespace and different values, not two separate sets of YAML files.

### ArgoCD now points at the chart, not a folder

```yaml
# project/infs/argocd-application.yaml
spec:
  source:
    repoURL: https://github.com/khapu2906/kubernetes-odyssey
    path: project/chart
    helm:
      valueFiles:
        - values.yaml
```

Only `path` changes, plus adding `helm.valueFiles` — ArgoCD supports a Helm chart as a source out of the box, no extra plugin needed. The `staging` copy could declare a second `Application`, same chart, different `valueFiles` and `destination.namespace`.

Open the notes again, add one line that doesn't belong to the old three anymore.

```
project/infs is now a real Helm chart (project/chart), not 12
loose files anymore. One default set of values, one diff for
staging — two environments from exactly one source. ArgoCD
points straight at the Helm chart now, not a static YAML folder.
```

Doesn't solve the last line still hanging from weeks ago — "running somewhere other than this laptop" — but now `ai-workspace-staging` sits right next to `ai-workspace`, on the same cluster. A first step toward thinking about having more than one cluster, before thinking about one of them living somewhere else entirely.
