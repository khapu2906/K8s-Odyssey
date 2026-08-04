# Preface

Most Kubernetes books teach you `kubectl` commands. This one tells you a story, and Kubernetes happens to be how it gets solved.

You'll follow **AI Workspace**, a startup's product, from a single `docker compose up` on a laptop to a production platform running across multiple services, a queue, a vector database, and a CI/CD pipeline. You won't see the whole architecture on day one — you'll build it the way real teams do: one problem at a time, driven by whatever the "CEO" (the book) throws at you next. Traffic spikes. A Pod gets deleted by accident. A Node goes `NotReady` at the worst possible time. You'll be the one who has to figure out why.

## Who this is for

Readers who already know what a container is and have run `docker compose up` at least once. No prior Kubernetes experience is assumed. If you've read a Kubernetes reference manual before and it didn't stick, this book is for you — the goal here is retention through repetition and real problems, not coverage.

## How the book is organized

- **Chapters 1–3** are pure theory — just enough vocabulary to start. No hands-on yet.
- **From Chapter 4 on**, every chapter opens with a real problem in AI Workspace, gives you just enough theory to solve it, then has you solve it yourself.
- Chapters marked **Tier 1 — Core** go further: a Production Notes section on real-world pitfalls, a Debug Lab where something is broken and you have to find out why, and interview-style questions to check what stuck.
- **Part X — Under the Hood** is a different kind of chapter: instead of operating AI Workspace, you build a miniature Kubernetes yourself, in Go, to see exactly how the real thing works underneath.

## How to read it

Start here, then follow [`SUMMARY.md`](../SUMMARY.md) in order — it's the book's table of contents. Every chapter is self-contained: when it's time to open a terminal, it tells you so, and the code you need is quoted right there on the page. Folders outside `handbook/` (`project/`, `labs/`, `incidents/`, `challenges/`) exist only to be referenced by a chapter — you never need to browse them on their own.

The full design philosophy behind this structure — why the project evolves the way it does, why code lives in exactly one place, why incidents are built in — is documented in [`outline.md`](../outline.md), at the repository root, if you're curious about the reasoning.

Let's build a cluster.
