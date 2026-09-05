# Chapter 27 — The Cloud Can't Reach This Laptop

## The following week

Counting it up, it turns out: since way back when, the exact same four commands get typed over and over every single time code changes — `docker build`, `kind load docker-image`, `kubectl apply`, `kubectl delete pod -l app=...`. Last night, one line changed in `answer.js`, the `kind load` step got skipped by accident, and ten minutes went by wondering why the new Pod was still running the old code. The exact line noted a few weeks back: "automate deploys" — nobody's touched it yet.

The repo's been on GitHub from the start (one tag, one Release per chapter — the same habit kept up since day one). GitHub has `Actions` built in — runs a workflow on every push, no extra service to install.

### CI — the easy part, no surprises

```yaml
# .github/workflows/chat-api.yml
name: chat-api CI/CD

on:
  push:
    branches: [main]
    paths: ["project/chat-api/**"]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Log in to GHCR
        run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
      - name: Build and push
        run: |
          docker build -t ghcr.io/${{ github.repository }}/chat-api:${{ github.sha }} project/chat-api
          docker push ghcr.io/${{ github.repository }}/chat-api:${{ github.sha }}
```

Push a small fix to `answer.js`, check the Actions tab — the job runs, goes green, a new image sits in GHCR, tagged with the exact git SHA of the commit just pushed. No more hand-typed `docker build`. One thing worth noticing along the way: now that a real registry exists, an image no longer "only lives on the host machine" the way it did back when this all started — meaning the `kind load docker-image` step (typed dozens of times over the past few weeks) is about to become unnecessary, since `kind` can pull an image straight from GHCR over the network, exactly like a real cluster would.

### CD — the part that looked easy, turns out to hit a wall immediately

Add a second job, deploying right after the build finishes.

```yaml
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Set image
        run: kubectl set image deployment/chat-api chat-api=ghcr.io/${{ github.repository }}/chat-api:${{ github.sha }} -n ai-workspace
```

Try it — fails right away: `kubectl` on the runner has no `~/.kube/config` pointing at anything, and even with the right config file copied in, the `kind` cluster is running on your own laptop, with no public IP address for some VM sitting somewhere on GitHub's infrastructure to reach at all. Not a permissions problem — there's simply no network path between the two places at all, the exact same problem hit a while back, just flipped around: back then it was "outsiders can't reach into the cluster," this time it's "GitHub can't reach into the cluster," the same underlying reason both times — the cluster only exists on one single laptop.

### A self-hosted runner — running Actions right where the cluster already lives

GitHub Actions doesn't have to run on one of GitHub's own VMs — a "runner" can be installed on your own machine instead, so the job executes locally, with `kubectl`/`kind` already configured and ready.

```bash
# downloaded from Settings > Actions > Runners > New self-hosted runner
./config.sh --url https://github.com/<you>/kubernetes-odyssey --token <token>
./run.sh
```

```
√ Connected to GitHub
Listening for Jobs
```

Change the `deploy` job's `runs-on` to `self-hosted`.

```yaml
  deploy:
    needs: build-and-push
    runs-on: self-hosted
    steps:
      - name: Set image
        run: kubectl set image deployment/chat-api chat-api=ghcr.io/${{ github.repository }}/chat-api:${{ github.sha }} -n ai-workspace
```

Push the exact same fix again. The terminal running `./run.sh` jumps to life immediately — the `deploy` job runs straight on your own machine, using the exact `kubectl` already logged in, the exact cluster already running right there.

```bash
kubectl get pods -n ai-workspace -w
```

```
chat-api-...   1/1   Running   0   8s
```

A new Pod comes up, running the freshly built image, not one command typed by hand — from `git push` to the new Pod running, no gap left for a human to stand in the middle of anymore.

Open the notes from a few weeks back, cross off the second-to-last line.

```
automate deploys ✓ GitHub Actions builds + pushes to GHCR,
deploys via a self-hosted runner (since the kind cluster only
exists on this machine, a GitHub-hosted runner has no network
path to it at all). kind load docker-image no longer needed,
images pull straight from GHCR.

running somewhere other than this laptop — still open.
```

Exactly the one line left. The self-hosted runner is still running on this exact same laptop — a lot more convenient, but "more convenient" and "no longer depending on one single machine" are two different things, and you know that clearly, not claiming it's finished when it isn't.
