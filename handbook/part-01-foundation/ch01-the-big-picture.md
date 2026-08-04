# Chapter 1 — The Big Picture

**Part I — Foundation**

**Tier:** Foundation (pure theory, no hands-on — see design §2)

**Touches `project/` code:** No — pure theory, no hands-on (see [design §2](../../outline.md#2-chapter-structure-the-first-23-chapters-are-pure-theory-then-project-heavy)).

---

## Theory

### Day one

You just joined a small startup as an engineer. The product is **AI Workspace** — people chat with an AI and get answers grounded in their own documents. It's early: a handful of users, one small team, no dedicated ops person. Your onboarding doc has exactly one useful line:

> Clone the repo, run `docker compose up`, you're good to go.

You do it. Three containers start. You open the browser, type a message, and get an answer back. It works. Before writing any code, you open `docker-compose.yml` to see what's actually running.

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

You read through it block by block. `frontend` and `chat-api` both have a `build:` line — Docker builds an image from the source code in that folder, then runs it. `postgres` skips that step: it just uses `image: postgres:16`, a ready-made image nobody on your team built. `chat-api` has an environment variable, `DATABASE_URL`, pointing at `postgres` by name — that's how it finds the database without needing to know its IP address. And `postgres` writes its data to a named volume, so a restart doesn't wipe the database.

None of this is new to you. You already know what these words mean. An **image** is a snapshot of an app and everything it needs, ready to run. A **container** is that image, actually running. **Docker** is the tool that builds and runs both. **Compose** is the file format that describes several containers as one system, and starts them together.

Right now, that's all this product needs. Three containers, one laptop, one command. Nothing in this file hints that it won't stay that way.

It won't. Not today — but everything that happens from here starts with this exact file no longer being enough:

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

The first link shows up sooner than you'd think.

### Three weeks later

The product gets traction. Traffic goes up. In standup, you make the obvious suggestion: "Why don't we just start three more `chat-api` containers?" Everyone nods — sounds right, more copies should mean more capacity. You try it.

```bash
docker compose up --scale chat-api=3
```

Three `chat-api` containers, running. You did it. But which one actually answers the next request that hits port `8080`? Compose can't even publish the same host port from three containers at once, so this doesn't start cleanly. And underneath that error is a bigger question `--scale` never answers:

**Who sends traffic to these three containers?**

Nobody. No piece of software is watching all three, deciding which one is free, and routing a request to it. You'd have to build that yourself. Once you start pulling on that thread, more problems show up, one after another, all the same shape:

- You need **another machine**, because three containers plus everything else won't fit on one forever.
- You need something to **restart** a container that dies silently at 3am, because right now, nothing does.
- You need a way to **roll out a new version** without stopping all three containers at once.
- You need **service discovery** — some way for `frontend` to find "a healthy `chat-api`" without hardcoding which of the three.
- You need something to decide **which machine** a new container should even run on, as the fleet grows.

```mermaid
flowchart TD
    A[docker compose up --scale chat-api=3] --> B[Need another machine]
    B --> C[Need restart]
    C --> D[Need rollout]
    D --> E[Need service discovery]
    E --> F[Need scheduling]
    F --> G["?"]
```

You don't have a name for whatever solves all of this. Nobody on this two-person team has ever needed one before today. Every item on that list is Docker Compose being asked a question it was never designed to answer, because it was built for one machine, not a fleet of them.

For now, you close the laptop, still without an answer. Whatever it's called, you're going to need it soon.
