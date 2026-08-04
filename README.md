# Kubernetes Odyssey
### *From Docker Compose to Production Platform*

> Kubernetes is the main character. The project is just the vehicle.

Kubernetes Odyssey is a story-driven Kubernetes book. Instead of a reference manual, it follows a single startup's journey — a project called **AI Workspace** — as it evolves from a `docker compose up` monolith into a production-grade platform, chapter by chapter, incident by incident.

**Status: 🚧 scaffolding stage.** The repository structure and all 63 chapter files exist as a skeleton (headers, sections, `_TODO_` placeholders) — the actual writing hasn't started yet. Full design rationale lives in [`outline.md`](./outline.md).

---

## How to read this book

1. Start at [`handbook/00-preface/`](./handbook/00-preface/README.md).
2. Follow [`handbook/SUMMARY.md`](./handbook/SUMMARY.md) in order — Part I through Part X, Chapter 1 through 63. That's the book.
3. Every chapter is self-contained: it tells you when to switch to your terminal, quotes the exact code you need inline, and points you to `labs/`, `incidents/`, or `challenges/` if you want to go deeper.
4. Nothing outside `handbook/` needs to be read on its own — those folders only exist to be referenced by a chapter.

## The project: AI Workspace

The book teaches Kubernetes through one project that grows in complexity exactly as fast as the reader's knowledge does:

- **Stage 1 (monolith):** `Frontend → Chat API → PostgreSQL`
- **Stage 2 (modular monolith):** adds Auth, Redis, and a Document module — still one deployable.
- **Stage 3 (microservices):** splits into Auth, Workspace, AI, and Document services behind a gateway, with a queue, a vector DB, and object storage — only once there's a real reason to split.

Full details and reasoning are in [`outline.md`](./outline.md#3-the-throughline-project-ai-workspace).

## Repository layout

```
handbook/       the book itself — read this, in order (63 chapters, 10 parts)
project/        the single source of truth for code, tagged per chapter (ch04, ch09, ...)
labs/           step-by-step guides referenced by chapters
incidents/      real production-style incidents to debug
challenges/     optional exercises, easy → expert
solutions/      answers to challenges
mini-kubernetes/  a small Kubernetes clone in Go, built in Part X
diagrams/  cheatsheets/  scripts/
```

Every folder has its own `README.md` explaining what belongs there.

See [`outline.md`](./outline.md) for the complete design doc, including the chapter framework, the "one source of truth for code" rule, and the incident/"break it" philosophy.

## License

MIT — see [`LICENSE`](./LICENSE).
