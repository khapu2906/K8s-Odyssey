# Chapter 1 — The Big Picture

**Part I — Foundation**

**Tier:** Foundation (pure theory, no hands-on — see design §2)

**Touches `project/` code:** No — pure theory, no hands-on (see [design §2](../../outline.md#2-chapter-structure-the-first-23-chapters-are-pure-theory-then-project-heavy)).

---

## Theory

### Day one

You just joined a small startup as an engineer. The product is **AI Workspace** — people chat with an AI and get answers grounded in their own documents. It's early: a handful of users, one small team, no dedicated ops person. Your onboarding doc has exactly one useful line:

> Clone the repo, run `docker compose up`, you're good to go.

You do. Three containers start: `frontend`, `chat-api`, `postgres`. You open the browser, type a message, get an answer back. It works. Before writing any code yourself, you open `docker-compose.yml` to see what you're actually looking at.

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
  chat-api:
    build: ./chat-api
    ports: ["8080:8080"]
  postgres:
    image: postgres:16
```

Three blocks, three running things. `frontend` and `chat-api` get *built* from a folder in the repo; `postgres` just gets pulled — `image: postgres:16` — from somewhere else entirely, no build step at all. That difference is your first real question: what is an "image," and why does the team's own code need "building" into one, while Postgres apparently already comes as one, ready-made?

Pulling on that thread leads to the answer this whole book is going to keep circling back to: a **container** packages an application together with everything it needs to run — its dependencies, its runtime, its configuration — into one portable unit, so it behaves identically whether it's running on your laptop, a teammate's laptop, or a server neither of you has touched. `docker compose up` didn't install Node.js or Postgres on your machine at all; it downloaded or built self-contained images and ran each one in isolation. That's the entire reason the onboarding doc could be one line — nobody had to tell you which Postgres version to install, or resolve a dependency conflict with something else already on your laptop. The image already decided all of that, once, for everyone.

**Docker** is the tool that made this practical. The underlying idea — isolated processes, namespaced from the rest of the machine — existed in Linux before Docker did, but it was genuinely hard to use directly. Docker turned it into `docker build`, `docker run`, and a file called `docker-compose.yml` describing several containers as one system. That's why "Docker" and "container" get used almost interchangeably today, even though Docker is one implementation of the idea, not the idea itself. Chapter 2 goes hands-on with exactly this.

### Three weeks later

The product gets traction. Traffic goes up. Someone on the team tries the obvious fix — more copies of `chat-api` — and runs into a wall: Docker Compose runs everything on one machine, doesn't restart a container that silently died, and has no idea how to update a running service without taking it down first. Chapter 3 lives inside that exact moment. For now, just notice the shape of the problem: single-machine tooling meeting multi-machine, always-on demands.

That gap is what **Kubernetes** exists to close — software whose entire job is running many containers, across many machines, continuously checking that what's actually running matches what's supposed to be running, and fixing the difference without a human watching. And once a team is running Kubernetes for real, a further problem shows up: not everyone wants to learn cluster internals just to ship a feature. **Platform Engineering** — building internal tools on top of Kubernetes so the rest of the company doesn't have to become Kubernetes experts — is where this book ends, in Part IX, as the natural conclusion of everything before it.

```mermaid
flowchart TD
    A[Cloud Native] --> B[Container]
    B --> C[Docker]
    C --> D[Kubernetes]
    D --> E[Platform Engineering]
```

Every layer in that chain exists because the one below it ran out of answers to a question the team actually had — which is exactly how you just arrived at it yourself, by reading one `docker-compose.yml` file.

### Notes from the investigation

A few words you'll see constantly starting in Part II, once AI Workspace moves onto a real cluster. You don't need to understand them yet — just recognize them by name, the way you'd recognize a new coworker's face before knowing their job title:

| Term | One-line meaning |
|---|---|
| **Node** | A machine (physical or virtual) that's part of the cluster and actually runs your containers. |
| **Pod** | The smallest deployable unit in Kubernetes — one or more containers that always run together on the same Node. |
| **Deployment** | A description of how many copies of a Pod should be running, and how to update them safely. |
| **Service** | A stable network address that lets other things find your Pods, even as individual Pods come and go. |
| **Ingress** | The entry point that routes outside traffic (like a browser request) into the right Service inside the cluster. |
| **Volume** | A way to give a container storage that survives even if the container restarts. |
| **Namespace** | A way to divide one cluster into separate, named areas — so different teams or environments don't collide. |

Every one of these gets its own real chapter, with AI Workspace as the example, starting in Part II.

### What's next

Chapter 2 goes back to that `docker-compose.yml` file and actually works with it — a fast, practical Docker refresher assuming you can already run `docker compose up`, just making sure "image," "container," and "volume" mean the same thing to you that they're about to mean to the rest of this book. Chapter 3 is the traffic spike, in full — the moment Compose runs out of answers, and Kubernetes stops being an abstract next step.
