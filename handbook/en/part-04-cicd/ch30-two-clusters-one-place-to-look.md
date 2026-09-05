# Chapter 30 — Two Clusters, One Place to Look

## That weekend

`ai-workspace-staging` has been sharing a cluster with `ai-workspace` for a few days now, only different by namespace. The founder asks a question that stops you cold: the QA team accidentally ran a heavy job that ate up the node's CPU, and both namespaces — including the real one actually running production traffic — slowed down together. A namespace separates names, separates labels, but not the physical node standing behind both. Real isolation needs a genuinely different cluster, not just a different namespace.

```bash
kind create cluster --name ai-workspace-staging --config kind-config.yaml
```

```
Creating cluster "ai-workspace-staging" ...
Set kubectl context to "kind-ai-workspace-staging"
```

Now there are two real clusters, not two namespaces anymore. But a different problem shows up immediately.

```bash
kubectl config get-contexts
```

```
CURRENT   NAME                          CLUSTER
          kind-ai-workspace             kind-ai-workspace
*         kind-ai-workspace-staging     kind-ai-workspace-staging
```

Typing `kubectl apply -f ...` by mistake while the context points at `staging` instead of the real `ai-workspace` — no error at all, just quietly applies to the wrong cluster. The `*` mark is the only clue, easy to miss while focused on something else entirely.

### Rancher — one place to manage multiple clusters, not `kubectl` contexts anymore

Install Rancher on the `ai-workspace` cluster itself (using it as the "management" cluster), via Helm — the same tool that's felt familiar for weeks now.

```bash
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
helm repo update
kubectl create namespace cattle-system
helm install rancher rancher-stable/rancher \
  --namespace cattle-system \
  --set hostname=rancher.localhost \
  --set bootstrapPassword=admin
```

```
NAME: rancher
STATUS: deployed
```

Open `https://rancher.localhost` (via `port-forward svc/rancher -n cattle-system 8443:443`), log in with the `bootstrapPassword` just declared. Go to "Cluster Management" → "Import Existing" — Rancher hands over a `kubectl apply` command to run against the `staging` cluster, installing a small agent (`cattle-cluster-agent`) that automatically reports status back to Rancher.

```bash
kubectl --context kind-ai-workspace-staging apply -f https://rancher.localhost/v3/import/<token>.yaml
```

A few minutes later, the `staging` cluster shows up in Rancher's list, right next to `ai-workspace` — both visible on one screen now, no need to remember which context name maps to which cluster anymore.

### No more guessing based on a `*` mark

Pick a cluster from Rancher's UI dropdown instead of typing `kubectl config use-context`, see Pods, Deployments, logs from both clusters right in one browser — nothing underneath actually changes, Rancher is just a UI layer calling `kubectl`/the API server on your behalf, with the exact cluster/namespace clearly chosen on screen, no longer relying on an easily-missed `*`.

Open the notes again, add a new line.

```
Two real clusters (ai-workspace, ai-workspace-staging), managed
through Rancher — no more risking a wrong-context mistake,
picking visually through the UI instead. Rancher runs on
ai-workspace itself, acting as the "management" cluster.
```

Something still nags, not confident enough yet to write it down as "done": both clusters — even the one acting as "management" — are still running on this exact same laptop, inside the same Docker daemon. Rancher solves the "multiple clusters, one place to look" problem, but hasn't touched the oldest still-open question at all: whether one of those clusters could actually live somewhere completely different from this desk. Leave it there, knowing clearly it's still a real open question, not something just answered.
