# Preface

Most Kubernetes books start by teaching you commands.

This one starts with a startup.

On your first day, you'll join a small team building **AI Workspace** — an application where users chat with AI and receive answers grounded in their own documents. At first, everything fits on a single laptop. One repository. Three containers. One command:

```bash
docker compose up
```

It works.

Until it doesn't.

A few weeks later, traffic grows. Containers crash. Deployments go wrong. Someone accidentally deletes a Pod. A Node becomes `NotReady` in the middle of the day. Customers start reporting errors before anyone on the team knows something is broken.

Nobody stops the story to explain Kubernetes.

Instead, every production problem forces you to learn one new concept, just enough to solve what's in front of you. By the time you finish the book, you won't just know Kubernetes—you'll understand *why* every piece exists, because you'll have needed each one before you learned its name.

This book follows the same journey thousands of engineering teams have taken: from a single `docker compose up` to running a production platform across multiple machines, with networking, storage, service discovery, autoscaling, observability, security, and CI/CD.

Kubernetes isn't the destination.

It's simply what you discover after solving enough real problems.

---

# Who this book is for

This book is written for software engineers who already know the basics of containers. If you've built an application with Docker or run `docker compose up` before, you're ready to begin.

No Kubernetes experience is expected.

If you've ever tried reading the official documentation or a Kubernetes reference book and found yourself remembering commands but forgetting *why* they matter, this book was written for you.

The goal isn't to memorize APIs.

The goal is to build intuition.

---

# How this book is organized

The story unfolds in the same order a real product evolves.

* **Part I — Foundation** introduces the ideas behind containers, orchestration, and Kubernetes. These chapters are theory only—no terminal, no cluster, no YAML to write. The goal is to understand *why* Kubernetes exists before using it.

* **From Part II onward**, every chapter begins with a problem inside AI Workspace. A production incident, a feature request, or a scaling challenge pushes the system forward. You'll learn only the concepts required to solve that specific problem, then apply them immediately.

* There are no separate "Theory" or "Hands-on" sections to jump between. A chapter is one continuous scene — a problem shows up, you investigate, you find out what it's called, you fix it, sometimes you break it on purpose first. The commands and YAML appear exactly where you'd actually reach for them, mid-story.

* **Under the Hood** takes a different approach. Instead of operating Kubernetes, you'll build a miniature version yourself in Go—one component at a time—to understand what happens behind every `kubectl apply`.

By the end of the book, you'll have watched AI Workspace evolve from a simple Docker Compose application into a production-ready platform running on Kubernetes.

