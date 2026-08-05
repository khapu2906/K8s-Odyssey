# Kubernetes Odyssey
### *From Docker Compose to Production Platform*

> Kubernetes is the main character. The project is just the vehicle.

Kubernetes Odyssey is a story-driven Kubernetes book. Instead of a reference manual, it follows a single engineer's journey at a startup — a project called **AI Workspace** — from a `docker compose up` monolith to a production-grade platform on Kubernetes. No separate theory sections, no reference-manual structure: every chapter is one continuous scene, written in second person, where you hit a real problem, investigate it, and solve it.

**Status: 🚧 early writing.** Chapter 1 is written, in both English and Vietnamese. The rest of the book is being written one chapter at a time, in order — not pre-scaffolded. Full design rationale lives in [`outline.md`](./outline.md).

The book is maintained in two languages, in parallel: [`handbook/`](./handbook/) (English) and [`handbook-vi/`](./handbook-vi/) (Vietnamese) — both complete editions, not one translated from the other.

---

## How to read this book

1. Start at [`handbook/00-preface/`](./handbook/00-preface/README.md) — or [`handbook-vi/00-preface/`](./handbook-vi/00-preface/README.md) for the Vietnamese edition.
2. Follow that edition's `SUMMARY.md` in order.
3. Every chapter is fully self-contained — code and commands are quoted right there in the story. Nothing outside the handbook needs to be read to follow along.

## The project: AI Workspace

The book teaches Kubernetes through one project that grows in complexity exactly as fast as the reader's knowledge does:

- **Stage 1 (monolith):** `Frontend → Chat API → PostgreSQL`
- **Stage 2 (modular monolith):** adds Auth, Redis, and a Document module — still one deployable.
- **Stage 3 (microservices):** splits into Auth, Workspace, AI, and Document services behind a gateway, with a queue, a vector DB, and object storage — only once there's a real reason to split.

Full details and reasoning are in [`outline.md`](./outline.md#2-the-throughline-project-ai-workspace).

## Repository layout

```
handbook/       the book — English edition
handbook-vi/    the book — Vietnamese edition, same structure
project/        the single source of truth for code, tagged per chapter (ch04, ch09, ...)
challenges/     optional exercises, added per chapter as it's written
cheatsheets/    quick-reference: kubectl commands, YAML snippets
diagrams/       source files for diagrams too complex to inline as Mermaid
```

See [`outline.md`](./outline.md) for the complete design doc — the writing philosophy, the project's evolution, and the "one source of truth for code" rule.

## License

MIT — see [`LICENSE`](./LICENSE).
