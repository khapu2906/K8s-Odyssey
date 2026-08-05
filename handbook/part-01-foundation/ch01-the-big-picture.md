# Chapter 1 — Start From the Simplest Thing

## First day

```
Monday. 9:07 AM.
```

You stand outside the office door for a moment before walking in. After years of freelancing — a different team every few months, never the same desk twice — this is the first time you're actually walking into an office with real coworkers. Your first day at a small startup. The first real company, in the literal sense of the word.

Their product is called **AI Workspace**. Users upload documents, ask questions in plain language, and the AI answers based on exactly what's in those documents.

The team is small enough to count on one hand: a founder, three engineers counting you, and a designer. No DevOps. No SRE. No platform team. Just a handful of people shipping features before launch.

Your first task is simple: get familiar with the project, read the docs. You walk over to the founder's desk and ask where to start. He nods, types a few lines, and sends over a link.

You open it, read it, then read it again — not because it's confusing, but because you can't quite believe it's this short. An entire project, an entire system days away from launch, and the onboarding doc is a handful of lines:

```
The code is the most accurate documentation.
Clone the repository.
Run `docker compose up`.
You're ready.
```

That's it. No VPN. No cloud account. No fifty-page setup doc. One command.

```bash
docker compose up
```

A few seconds later, three containers appear.

```
✔ frontend
✔ chat-api
✔ postgres
```

You open the browser, upload a PDF, ask a question. The AI answers correctly. Everything works.

Before writing a single line of code, might as well read the source. You open `docker-compose.yml` to see how this thing actually runs.

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
      - POSTGRES_DB=aiworkspace
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

You read it block by block.

`frontend` and `chat-api` both have a `build:` line — Docker builds an image from the source code in that folder, then runs it. `postgres` skips that step: it just uses `image: postgres:16`, a ready-made image nobody on the team ever built.

`chat-api` has one environment variable, `DATABASE_URL`, pointing at `postgres` by name — that's how it finds the database without knowing its IP address. Docker's internal network lets containers find each other by service name alone.

And `postgres` writes its data to a named volume, so restarting the container doesn't wipe the database.

None of this is unfamiliar. At a few past jobs — a Node API here, an internal dashboard nobody bothered naming properly there — you've sat and read files shaped exactly like this one, enough times that the concepts behind it don't take any real thought anymore.

An **image** is a package: code, libraries, config, everything the app needs to run, bundled into one static, immutable thing. You don't edit an image — you build a new one.

A **container** is that image, actually running. The same image can spin up many containers, each with its own lifecycle, gone the moment it stops unless data was written out somewhere else — like the named volume `postgres` is using.

**Docker** is the tool sitting between the two — building images, running containers, handling their networking and storage.

**Compose** is the thin layer on top of Docker: one YAML file describing how several containers should run together — what depends on what, which ports open, which environment variables — collapsed into a single `up` command.

Nothing in this file makes you stop and think twice. Three containers, one laptop, one command.

Looking back today, it's hard to imagine this file will ever become a problem. But almost every massive product out there started from something that looked exactly like this.

---

## Three weeks later

Three weeks go by. The product launched about a week ago, a trickle of users drifting in and out like tourists who visit once, during the off-season, and never come back. As for you, you've settled into the rhythm of the place — every day looking like the last. Morning standup: what you did yesterday, what's next today, any blockers — usually none. Then sit down, code, fix a bug, code some more. In the afternoon, a quick sync with the designer about whether a button belongs on the left or the right. Close the laptop at night, go home, repeat tomorrow.

Nothing memorable. Nothing worth worrying about. Calm, to the point of dull — the kind of calm that, looking back later, you'll realize was unsettling all along.

Then one Monday morning, everything changes.

The dashboard doesn't look impressive.

```
Friday:
47 active users

Monday:
312 active users
```

Still tiny. Nobody's calling this "internet scale." But the Slack channel starts filling up with messages.

```
Customer
The AI keeps timing out.
```

A minute later.

```
Customer
Sometimes it works.
Sometimes it doesn't.
```

Another one comes in.

```
Customer
Did you deploy something?
```

You didn't deploy anything. Nothing changed. Just more people showed up.

### Standup

At that morning's standup, everyone looks a little thrown off. The founder breaks the silence.

> "Good news."

He smiles.

> "People are actually using the product."

Everyone smiles back. Then he pulls up another chart.

```
CPU. 100%.
```

Memory, nearly full.

The smile fades.

> "Production went down twice yesterday."

Nobody's smiling anymore.

Someone asks the obvious question:

> "Can't we just run more API containers?"

Every eye in the room turns to you — fair enough, you carry the Founding Engineer title, so by default this kind of problem is yours to show up for. It sounds reasonable enough — three copies of the app should handle three times the traffic. At least, that's how most of us picture scaling the first time we think about it.

You nod. "Sure. Let's try."

### The experiment

Back at your desk, you type:

```bash
docker compose up --scale chat-api=3
```

Compose starts spinning up containers.

```
chat-api-1
chat-api-2
chat-api-3
```

For a second, it feels like a win. Three servers. Problem solved.

Then reality catches up. The command doesn't even start cleanly — three containers can't all expose port `8080` on the same machine. But underneath that error sits a bigger question `--scale` never answers:

> **Who sends traffic to these three containers?**

Nobody. No piece of software is watching all three, deciding which one is free, and routing a request to it. You'd have to build that yourself.

The problem was never creating more containers. The problem is everything **around** those containers.

### The list keeps growing

The more you think about it, the longer the list gets. Once you start pulling on that thread, more problems show up, one after another, all the same shape:

- You need **another machine**, because three containers plus everything else won't fit on one forever.
- You need something to **restart** a container that dies silently at 3am, because right now, nothing does.
- You need a way to **roll out a new version** without stopping all three containers at once.
- You need **service discovery** — some way for `frontend` to find "a healthy `chat-api`" without hardcoding which of the three.
- You need something to decide **which machine** a new container should even run on, as the fleet grows.

You grab a notebook and start writing:

```
Need scaling.
Need restart.
Need deployment.
Need networking.
Need service discovery.
Need scheduling.
Need storage.
Need secrets.
Need health checks.
Need observability.
```

You stop. Read the list again. None of these is actually hard — on its own, each one's an ordinary question. But they didn't come from each other. They came from the same place, all at once. And once ten small problems land on your desk in the same afternoon, they stop looking like ten small problems. They start looking like an entirely different system, demanding to be built.

```mermaid
flowchart TD
    A[docker compose up --scale chat-api=3] --> M[Port conflict on one machine]
    M --> X[Forced to spread across machines]
    X --> Y[Lose the ability to watch it by hand]
    Y --> C[Need restart]
    Y --> D[Need rollout]
    Y --> E[Need service discovery]
    Y --> F[Need scheduling]
    Y --> G[Need storage]
    Y --> H[Need observability]
    C --> I["?"]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
```

### End of a long day

The office is nearly empty. The lights have switched to night mode. Your laptop is still open.

Docker Compose did exactly what it was built to do: run containers on one machine. Nothing more.

The mistake was never using Docker Compose. The mistake was asking it to solve problems it was never built to solve.

You look at the list one last time. You don't have a name for whatever can solve all of this. But there must be a reason almost every growing engineering team, sooner or later, ends up writing down nearly the exact same list.

Surely — someone's already solved this. You'll find out soon enough.
