# Chapter 1 — The Big Picture

**Part I — Foundation**
**Tier:** Foundation (pure theory, no hands-on — see design §2)
**Touches `project/` code:** No — pure theory, no hands-on (see [design §2](../../outline.md#2-chapter-structure-the-first-23-chapters-are-pure-theory-then-project-heavy)).

---

## Theory

### You just joined a startup

Picture this: you've just joined a small team building **AI Workspace** — a product where people chat with an AI and get answers grounded in their own documents. Right now, the whole thing is three things on one laptop: a frontend, an API, a database. It runs with a single command. It works.

It won't stay this simple. Not because anyone wants complexity for its own sake, but because the product will succeed, users will show up, traffic will spike, someone will ask "why is the site down," and a single laptop process will stop being enough. Every chapter from here on is a response to a problem like that actually happening. This chapter just sets the stage — no hands-on yet, just enough vocabulary to follow along.

### Why any of this exists: a chain of problems

None of the technology you're about to learn was invented because it sounded interesting. Each layer exists because the layer below it ran out of answers.

**"It works on my machine" → Containers.** Before containers, "deploying" software meant hoping the production server had the same OS version, the same libraries, the same everything as your laptop. It rarely did. A **container** packages an application with everything it needs to run, so it behaves identically everywhere.

**Packaging one container → Docker.** Containers as a Linux kernel concept existed before Docker, but they were hard to use. Docker made building, running, and sharing containers a single, simple command. That's why "Docker" and "container" get used almost interchangeably today, even though Docker is one implementation of the idea. You'll get a full, hands-on refresher of this in Chapter 2.

**One container → many containers, running reliably → Kubernetes.** `docker compose up` is great for one machine. But what happens when your API needs to run as five copies for reliability? When one crashes, who restarts it? When traffic doubles, who adds more copies? When you deploy a new version, who makes sure it rolls out without dropping a single request? Docker Compose has no answer to any of this across multiple machines. **Kubernetes** is software whose entire job is answering exactly these questions, continuously, without a human watching. You'll feel this gap firsthand in Chapter 3, before Kubernetes even enters the picture.

**Running Kubernetes well → Platform Engineering.** Once a team has Kubernetes, a new problem appears: not every engineer wants to learn YAML and cluster internals just to ship a feature. Platform Engineering is the practice of building internal tools and paved paths on top of Kubernetes so the rest of the company can move fast without needing to become Kubernetes experts. This is where the book ends, in Part IX — it's the natural conclusion of everything before it, not a separate topic.

```
Cloud Native
    │
Container
    │
Docker
    │
Kubernetes
    │
Platform Engineering
```

Keep this chain in mind. Nearly every chapter in this book is really just answering: "what problem, at what layer, are we solving right now?"

### A vocabulary preview

You'll meet the following words constantly starting in Part II. At this point you don't need to understand them — just recognize them by name, the way you'd recognize a new coworker's face before knowing their job title.

| Term | One-line meaning |
|---|---|
| **Node** | A machine (physical or virtual) that's part of the cluster and actually runs your containers. |
| **Pod** | The smallest deployable unit in Kubernetes — one or more containers that always run together on the same Node. |
| **Deployment** | A description of how many copies of a Pod should be running, and how to update them safely. |
| **Service** | A stable network address that lets other things find your Pods, even as individual Pods come and go. |
| **Ingress** | The entry point that routes outside traffic (like a browser request) into the right Service inside the cluster. |
| **Volume** | A way to give a container storage that survives even if the container restarts. |
| **Namespace** | A way to divide one cluster into separate, named areas — so different teams or environments don't collide. |

Every one of these gets its own real chapter, with AI Workspace as the example, starting in Part II. Don't try to memorize them now — just notice, later, when they show up for real.

### What's next

Chapter 2 is a fast, practical review of Docker itself — the tool you'll assume working knowledge of for the rest of the book. Chapter 3 puts AI Workspace on Docker Compose, watches it succeed, and then watches Docker Compose start to run out of answers — which is exactly where Kubernetes comes in.
