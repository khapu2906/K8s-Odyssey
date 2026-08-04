# Chapter 5 — kubectl

**Part II — First Cluster**

**Tier:** Tier 2 — Standard

**Touches `project/` code:** No — still cluster tooling, no AI Workspace manifests yet.

---

## 🎯 Mission

The cluster from Chapter 4 exists, but so far you've only glanced at it. Every real interaction from here on — deploying AI Workspace, checking why something broke, scaling it up — goes through one tool. Time to actually learn it, instead of copy-pasting commands.

## 📖 Theory

`kubectl` is not smart. It's a thin HTTP client that turns your command into a request to the **API Server** (Chapter 4) and prints back whatever the API Server replies. All the intelligence lives on the server side — `kubectl` just knows how to ask.

Two habits worth building immediately:

- **`kubectl` is declarative-first.** You'll mostly write a YAML file describing the state you want, then run `kubectl apply -f file.yaml`. Kubernetes figures out the difference between what exists and what you asked for, and reconciles it — the same loop from Chapter 4. This is different from imperative commands like `kubectl run`, which are fine for quick experiments but don't leave behind a record of what you did.
- **The verb tells you the shape of the answer.** `get` for a quick list, `describe` for a human-readable dump including recent events, `logs` for what a container printed, `exec` to run a command inside a running container.

| Command | What it's for |
|---|---|
| `kubectl get <resource>` | List resources, briefly. |
| `kubectl describe <resource> <name>` | Full detail on one resource, including recent events — your first stop when something's wrong. |
| `kubectl apply -f <file>` | Declaratively create or update whatever the file describes. |
| `kubectl logs <pod>` | Standard output/error from a container. |
| `kubectl exec -it <pod> -- <command>` | Run a command inside a running container, interactively. |
| `kubectl delete <resource> <name>` | Remove it. |

## 🛠 Hands-on

```bash
# where does kubectl think it's talking to?
kubectl config current-context
kubectl config get-contexts

# create a namespace for the project, instead of using `default`
kubectl create namespace ai-workspace
kubectl get namespaces

# explore what kinds of resources even exist
kubectl api-resources | head -20
kubectl explain pod
kubectl explain pod.spec.containers
```

`kubectl explain` is worth lingering on — it reads the same schema Kubernetes itself validates your YAML against, so it's always accurate, unlike a Google search from three Kubernetes versions ago.

There's still no AI Workspace-specific YAML to apply yet — that's Chapter 6. This chapter is about being fluent with the tool before pointing it at something real.

## 🔬 Under the Hood

```bash
kubectl get pods -n ai-workspace -v=6
```

The `-v=6` flag makes `kubectl` print the actual HTTP request it sends — you'll see a `GET` to a URL under `/api/v1/namespaces/ai-workspace/pods`. That's the entire trick behind every `kubectl` command: turn your intent into a REST call, send it to the API Server, print the JSON that comes back in a readable table. Chapter 51 walks through this exact flow end to end.

## 🚀 Challenge

See [`challenges/ch05/`](../../challenges/ch05/) (easy → expert) — including finding every namespace currently on the cluster and explaining what each one is for.
