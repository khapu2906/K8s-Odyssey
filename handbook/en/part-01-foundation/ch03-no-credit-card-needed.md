# Chapter 3 — No Credit Card Needed

## Still that night

```
how to actually try kubernetes on my laptop
```

The first result is a relief: no cloud account, no credit card, no server to buy. Kubernetes runs right on a laptop, the same way Docker's been running on yours this whole time.

But you freeze again at "install what, exactly." Not one option. Five.

```
minikube
kind
k3s
k3d
OrbStack → Enable Kubernetes
```

Every single one has its own guide, and every guide insists it's the "right" one. You go through each, trying to note what's actually different, not just the marketing.

```
minikube
→ runs Kubernetes inside its own VM. oldest, most docs, but
  needs a virtualization layer installed and boots slower

kind
→ "Kubernetes in Docker" — runs the whole cluster as regular
  Docker containers, no separate VM. light, boots fast, this is
  what CI/CD people use for testing

k3s
→ Rancher's stripped-down Kubernetes, mostly meant for real
  production on weak hardware (edge, IoT), not really for
  learning on a laptop

k3d
→ runs k3s inside Docker — same idea as kind, but the k3s
  distribution instead of upstream Kubernetes

OrbStack
→ what you're actually running instead of Docker Desktop,
  noticeably lighter, and it has its own toggle to enable
  Kubernetes too — but still one fixed cluster, not as easy to
  spin up and tear down quickly from the CLI as kind
```

You text Martin, not expecting much since you know he's busy.

```
You
> between minikube/kind/k3d which one do you actually use for testing
```

The reply comes ten minutes later.

```
Martin
> kind, done with it just delete, recreate in 5s
> don't overthink it, any of them work, the concept is the point
```

Exactly what you needed to hear — not which one's "correct," just which one's light enough to create and throw away without waiting around. You go with kind.

You're on a Mac, so Homebrew is the fastest way in. OrbStack's already been sitting on this machine for a while now — it's what ran all of AI Workspace on day one — and kind just needs a Docker daemon running, doesn't care whether that's OrbStack or Docker Desktop, so there's nothing else to install.

```bash
brew install kind
brew install kubectl
```

Both finish downloading in under a minute. The cursor blinks after the `$`, waiting for the next command — the one that's actually going to create your first cluster.

You don't type it yet. Tonight's been long enough already.
