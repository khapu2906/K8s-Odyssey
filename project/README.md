# project/

The single source of truth for **AI Workspace**'s code — the throughline project used across the whole book (see [`outline.md` §3](../outline.md#3-the-throughline-project-ai-workspace)).

The code evolves commit by commit, and each chapter's milestone is marked with a git tag: `ch04`, `ch09`, `ch19`, ... To see the project exactly as it stood at a given chapter:

```
git checkout ch09
```

Code quoted inside a handbook chapter is copied verbatim from this repo at the relevant tag — it is never a separate file that needs to be kept in sync (see [`outline.md` §7](../outline.md#7-one-source-of-truth-for-code)).

**Status:** not started. The first tag (`ch04`) will introduce the Stage 1 monolith: `Frontend → Chat API → PostgreSQL`.
