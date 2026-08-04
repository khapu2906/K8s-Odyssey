# Chapter 1 — The Big Picture

**Part I — Foundation**

**Tier:** Foundation (pure theory, no hands-on — see design §2)

**Touches `project/` code:** No — pure theory, no hands-on (see [design §2](../../outline.md#2-chapter-structure-the-first-23-chapters-are-pure-theory-then-project-heavy)).

---

## Theory

### Day one

You just joined a small startup as an engineer. The product is **AI Workspace** — people chat with an AI and get answers grounded in their own documents. It's early: a handful of users, one small team, no dedicated ops person. Your onboarding doc has exactly one useful line:

> Clone the repo, run `docker compose up`, you're good to go.

You do. Three containers start. You open the browser, type a message, get an answer back. It works. Before writing a line of code, you open `docker-compose.yml` anyway — not because the onboarding doc left you confused, but because you'd rather see what's actually running than take a one-liner's word for it.

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - chat-api

  chat-api:
    build: ./chat-api
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/aiworkspace
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

You read it the way you'd read anyone's compose file — top to bottom, matching each block against things you already know. `frontend` and `chat-api` both have a `build:` line, so Docker's turning source code in those folders into an image before running it. `postgres` skips that entirely — `image: postgres:16`, pulled ready-made, no Dockerfile of your team's involved. `chat-api` has an `environment:` block pointing a `DATABASE_URL` at `postgres` by name, which is how it finds the database without either container knowing an IP address. And `postgres` has a named `volumes:` mount, so whatever gets written to the database survives a restart instead of vanishing with the container.

None of that took real effort to work out — you've read files shaped like this one plenty of times before this job. An **image** is a frozen, ready-to-run snapshot of an app and everything it needs; a **container** is what you get when that image is actually running; **Docker** is the tool that builds and runs both; **Compose** is what lets several containers be described, and started together, as one file. That part of the job, you already know cold.

**Kubernetes**, on the other hand, you don't. You've heard the word — in interviews, in conference talk titles, in job postings for companies bigger than this one. You've never had a reason to open a cluster, and nothing in this `docker-compose.yml` even hints at why you'd need to. Three containers, one laptop, one command. It's enough, right now, for what this team needs. That sentence is doing more work than it looks like — the whole book is what happens after it stops being true.

You don't know it yet, but every chapter in this book starts because something in this one file eventually stops being enough:

```mermaid
flowchart TD
    A[docker-compose.yml] --> B[Need restart]
    B --> C[Need scaling]
    C --> D[Need networking]
    D --> E[Need storage]
    E --> F[Need security]
    F --> G[Need observability]
    G --> H[Need CI/CD]
    H --> I[Need multi-cluster]
```

This whole book is that chain, one link — one Part — at a time.

### Three weeks later

The product gets traction. Traffic goes up. In standup, you make the obvious suggestion: "Why don't we just start three more `chat-api` containers?" Everyone nods — sounds right, more copies should mean more capacity. You try it.

```bash
docker compose up --scale chat-api=3
```

Three `chat-api` containers, running. You did it. Except — which one actually answers the next request that hits port `8080`? Compose can't publish the same host port from three containers at once, so this doesn't even start cleanly, and even patched around, a deeper question is sitting right underneath it, one `--scale` never answers:

**Who sends traffic to these three containers?**

Nobody. There's no piece of software watching all three, deciding which one is free, routing a request to it. You'd have to build that yourself. And once you start pulling on *that* thread, more of the same shape show up, one after another:

- You need **another machine**, because three containers plus everything else won't fit on one forever.
- You need something to **restart** a container that dies silently at 3am, because right now, nothing does.
- You need a way to **roll out a new version** without stopping all three at once.
- You need **service discovery** — some way for `frontend` to find "a healthy `chat-api`" without hardcoding which of the three.
- You need something to decide **which machine** a new container should even run on, as the fleet grows.

```mermaid
flowchart TD
    A[docker compose up --scale chat-api=3] --> B[Need another machine]
    B --> C[Need restart]
    C --> D[Need rollout]
    D --> E[Need service discovery]
    E --> F[Need scheduling]
    F --> G[Kubernetes]
```

Chapter 3 lives inside this exact moment and works through each one in full. For now, just notice the shape: every single item on that list is Docker Compose being asked a question it was never designed to answer, because it was built for one machine, not a fleet.

This is where that word from your onboarding week — the one you'd only ever seen in job postings — stops being abstract: **Kubernetes** is software whose entire job is running many containers, across many machines, continuously checking that what's actually running matches what's supposed to be running, and fixing the difference without a human watching. Not a bigger, fancier Compose. It exists because the list above is real, and somebody has to run it, permanently, for you.

### Years later

Skip ahead. AI Workspace is a real product now, running across dozens of services, on Kubernetes, with a real platform team — and you're on it. One day, a new engineer joins. Onboarding used to be a page of setup instructions; now you hand them one URL. They click a button. A few minutes later, their own environment — namespace, database, ingress, monitoring, all of it — is simply *there*, ready. They never had to learn what a Pod is to ship their first feature.

At that point, without necessarily noticing it happen, you've become a **Platform Engineer** — building internal tools on top of Kubernetes so the rest of the company doesn't have to become Kubernetes experts, the same way `docker compose up` once let *you* start on day one without needing to relearn Docker from scratch. This book ends there, in Part IX, and it's worth remembering this paragraph when you arrive: the story closes exactly where it opened, just from the other side of the command.

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

Chapter 2 is a fast pass over the same `docker-compose.yml` file, this time making sure "image," "container," and "volume" carry exactly the meaning the rest of this book needs from them — a calibration, not a first introduction. Chapter 3 is the traffic spike, in full — every item on the "Need..." list above, worked through one at a time, until Kubernetes stops being an abstract next step.
