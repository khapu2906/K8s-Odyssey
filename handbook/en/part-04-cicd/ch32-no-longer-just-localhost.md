# Chapter 32 — No Longer Just Localhost

## End of the month

The founder announces in a meeting: the biggest customer about to sign is asking for a specific clause — the system needs an SLA, needs a real address, can't say "runs on the engineer's laptop" anywhere in the technical documentation sent to them. Martin's joke from a month ago suddenly isn't a joke anymore.

Everything needed for this has actually existed for a while — just never assembled together: a complete Helm chart (knows how to rebuild the whole system in a few commands), a CI/CD pipeline that builds/deploys on its own, an ArgoCD that auto-syncs to Git, a Rancher that manages multiple clusters at once. The one thing never tried: a cluster that doesn't live on this laptop.

### Choosing where the real cluster lives

No need to overcomplicate it right away — pick DigitalOcean Kubernetes (DOKS), a managed Kubernetes service: the control plane is the provider's problem, no need to stand up `etcd`/`kube-apiserver` by hand the way `kind` was read about that very first week.

```bash
doctl kubernetes cluster create ai-workspace-prod \
  --region sgp1 \
  --node-pool "name=default;size=s-2vcpu-4gb;count=3"
```

```
Notice: Cluster is provisioning, waited for cluster to be running
Notice: Cluster created, fetching credentials
Notice: Adding cluster credentials to kubeconfig file found in "/Users/you/.kube/config"
Notice: Setting current-context to do-sgp1-ai-workspace-prod
```

```bash
kubectl config get-contexts
```

```
CURRENT   NAME
          kind-ai-workspace
          kind-ai-workspace-staging
*         do-sgp1-ai-workspace-prod
```

Three contexts now, not two — the first two are still containers on this exact machine, the third one is three real virtual machines, running in a real data center in Singapore, nothing to do with the laptop typing these commands at all.

### The exact same chart, nothing changed

```bash
helm install ai-workspace ./project/chart -n ai-workspace --create-namespace
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

One word different from installing it on `kind` — `provider/cloud` instead of `provider/kind`, since there's no manual port-mapping simulation needed anymore.

```bash
kubectl get svc -n ingress-nginx
```

```
NAME                       TYPE           EXTERNAL-IP      PORT(S)
ingress-nginx-controller   LoadBalancer   146.190.42.107   80:31234/TCP,443:31456/TCP
```

`EXTERNAL-IP` isn't `<pending>` or `localhost` anymore — a real IP address, DigitalOcean itself automatically provisioning a real Load Balancer standing in front of the cluster, the moment it saw a `LoadBalancer`-type Service needing one. This is exactly what `kind` could never do, no matter how much `extraPortMappings` got configured — `kind` has no real network infrastructure behind it to provision a public IP from.

### Asking someone else to try it — not testing it yourself

Text Martin one line, no explanation attached.

```
You
> try this: http://146.190.42.107
```

```
Martin
> wait it actually works
> don't even need a vpn or anything
```

Doesn't need one. Martin's sitting in a different city, on a different network, a different machine — typing exactly one address, getting exactly the login screen, exactly what's been showing up on `http://localhost/` all this time. First time anyone other than you has ever touched this system without `kubectl`, without knowing what `kind` even is, without being on the same network at all.

### Rancher and ArgoCD pick up the third cluster too

Open Rancher, "Import Existing" one more time for `do-sgp1-ai-workspace-prod` — now three clusters show up on one screen: `ai-workspace` (dev), `ai-workspace-staging`, `ai-workspace-prod`. Edit `argocd-application.yaml`, add `destination.server` pointing at the new cluster's API address — ArgoCD syncs Git into that exact cluster, the same mechanism already working with the local clusters for a while now, just a different destination this time.

Open the notes again, finally able to cross off the very last line.

```
running somewhere other than this laptop ✓ DigitalOcean
Kubernetes, a real LoadBalancer handing out a real public IP,
Martin tested it remotely with no vpn/tunnel needed at all.
Same chart, same CI/CD pipeline, same ArgoCD/Rancher already
built before — just one more destination cluster, nothing
rewritten.
```

Not a single line left. The first nine from the night that README got read, three more from the day Auth/Documents/Redis got finished, three final ones from the day the system stopped looking as simple as it used to — every single one has an answer now, not because everything is perfect, but because every answer came from a real incident, a real evening, not memorized from somewhere else. You close the laptop, first time in months with no new note left to write.
