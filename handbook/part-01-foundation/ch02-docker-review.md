# Chapter 2 — Docker Review

**Part I — Foundation**
**Tier:** Foundation (pure theory, no hands-on — see design §2)
**Touches `project/` code:** No — pure theory, no hands-on (see [design §2](../../outline.md#2-chapter-structure-the-first-23-chapters-are-pure-theory-then-project-heavy)).

---

## Theory

This book assumes you've run `docker compose up` before. This chapter isn't teaching Docker from zero — it's making sure we're using the same words before Kubernetes starts using different ones for similar ideas.

### Image vs. container

An **image** is a frozen, read-only snapshot: your application plus every dependency it needs, packaged as a set of layered files. It doesn't run — it just *is*, sitting in a registry or on disk.

A **container** is what you get when you actually run an image. It's a live process, isolated from the host and from other containers, but built from that same frozen snapshot. You can start ten containers from one image, and they'll all behave identically, because they all started from the exact same files.

This distinction matters more than it seems. Almost every confusing Kubernetes concept later in this book — Pods, ReplicaSets, rolling updates — is really just "more disciplined ways of turning images into containers, and back." If image vs. container is fuzzy, come back to this paragraph.

### The Dockerfile: build once

A `Dockerfile` is a recipe for producing an image: start from a base, copy in your code, install dependencies, declare what command to run. `docker build` reads it and produces an image. The point of this recipe isn't convenience — it's that the same recipe produces the same image regardless of whose machine runs it. That's the entire answer to "it works on my machine."

### docker-compose: describing a *system*, not just one container

A single container is rarely the whole story. AI Workspace, even in its simplest form, is a frontend, an API, and a database — three containers that need to know about each other. `docker-compose.yml` describes all of them, and their relationships, as one file:

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

This is, deliberately, almost the entire AI Workspace product at this point in the story: a frontend, a `chat-api` that talks to it, and Postgres to remember conversation history. One command, `docker compose up`, and all three are running and can reach each other by name — `chat-api` can talk to `postgres` just by using that hostname, because Compose sets up networking between the services automatically.

Notice what Compose is quietly doing for you here: it starts containers in a sensible order (`depends_on`), gives them a shared private network, and keeps data in `pgdata` even if the `postgres` container restarts. All useful. All about to run out of runway in the next chapter.

### The vocabulary that carries forward

A few Docker ideas reappear, almost unchanged in meaning, once we move to Kubernetes in Part II:

- **Image** — identical meaning. Kubernetes still runs containers built from images; it just decides *where* and *how many*.
- **Environment variables** — identical meaning, and you'll configure them the same way conceptually, just through a different mechanism (Chapter 10).
- **Volume** — the *name* survives, but Kubernetes' version has to solve a harder problem: a volume that survives not just a container restart, but the container moving to an entirely different machine.
- **Networking by service name** (`chat-api` reaching `postgres` by hostname) — this exact idea, "find the other thing by name, not by IP," is reborn as Kubernetes' **Service**, and it's important enough to get its own chapter (Chapter 9).

Keep this `docker-compose.yml` in mind. Chapter 3 runs it in front of real users — and watches it start to break.
