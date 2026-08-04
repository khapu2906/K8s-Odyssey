# Chapter 3 — Why Docker Compose Isn't Enough

**Part I — Foundation**
**Tier:** Foundation (pure theory, no hands-on — see design §2)
**Touches `project/` code:** No — pure theory, no hands-on (see [design §2](../../outline.md#2-chapter-structure-the-first-23-chapters-are-pure-theory-then-project-heavy)).

---

## Theory

### Traffic ×20

Three weeks in. AI Workspace got mentioned somewhere, and traffic is up 20x overnight. The good news: people want the product. The bad news: it's still one `docker compose up` on one machine, and that machine is starting to fall over.

Your first instinct is reasonable — just run more of it. `docker compose up --scale chat-api=5`. Now there are five `chat-api` containers instead of one. Problem solved?

Not quite. Here's where the cracks start showing, one at a time.

### Problem 1 — One machine is still one machine

Scaling to five containers only helps if the machine has the CPU and memory to run five containers. Compose scales *within* a host. When that host runs out of room, there's no built-in answer — you'd need to manually set up another machine, manually copy your compose file there, manually decide which containers go where. Compose has no concept of "a pool of machines to spread work across."

### Problem 2 — Nobody's watching

Kill one of those five `chat-api` containers right now — it just crashed, or the process hit an unhandled exception. Does anything notice? Does anything restart it? Not on its own. Compose starts what you tell it to start; it doesn't continuously check "is this still running, and should it be?" If a container dies at 3am, it stays dead until a human notices and runs `docker compose up` again.

### Problem 3 — Nothing load-balances between the five

Even with five `chat-api` containers running, something has to decide *which one* handles the next request, and route traffic away from ones that are unhealthy. Compose doesn't do this. You'd be building your own load balancer, and your own logic for "is this container actually healthy," from scratch.

### Problem 4 — Deploying a new version means downtime, or a very careful script

You just fixed a bug and want to ship it. With Compose, the straightforward path is `docker compose up --build`, which stops the old containers and starts new ones. Somewhere in that gap, AI Workspace is down. You could hand-write a script that starts new containers, waits, then kills old ones one at a time — but now you're writing your own rollout logic, your own rollback logic if the new version turns out broken, by hand, for every deploy.

### Problem 5 — Health is not the same as "the process is running"

A container can be running and still be useless — stuck waiting on a database connection that will never come, deadlocked, or serving errors on every request while the process itself stays alive. "Is the container running?" and "is the container able to actually do its job?" are different questions, and Compose only ever answers the first one.

### The pattern behind all five problems

Every one of these is really the same problem wearing a different costume: **something needs to continuously watch the actual state of the system, compare it to what the state is supposed to be, and correct the difference — without a human doing it by hand, every time.** Not "run this once." *Keep it this way, forever, and fix it when it drifts.*

That loop — observe, compare, correct, repeat — is not something you bolt onto Docker Compose. It's the reason Kubernetes exists at all. Every piece of vocabulary from Chapter 1's preview table (Pod, Deployment, Service...) is, underneath, a piece of machinery built to run that loop for one specific kind of problem: Deployment runs it for "how many copies should exist," Service runs it for "how do requests find a healthy copy," and so on.

### What's next

Part II starts by opening up what a Kubernetes cluster actually looks like on the inside — the machines, the processes, and the loop itself — before you deploy AI Workspace's very first Pod in Chapter 6.
