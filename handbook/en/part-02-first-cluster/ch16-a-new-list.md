# Chapter 16 — A New List

## That Friday

End-of-week standup, the founder stands in front of the whole team, smiling wider than usual.

> "Good news this week — three companies signed at once. Most we've ever closed in one week."

A few people clap, the easy Friday mood settling in.

The founder keeps going, still upbeat but starting to shift gears.

> "Which brings up the next thing — those aren't single-user accounts, each company's bringing ten-plus people. Each one needs their own account, not sharing one session the way we've been testing it. And someone already asked if they can upload company documents instead of pasting a chunk of text into the chat box every time."

> "When's this needed by?" someone asks.

> "Next month. Not urgent, but not next year either."

The meeting breaks up, you sit back down at your desk, open `answer.js` again and look at it differently — the function takes `documentText` as a parameter, never stores it anywhere, has to be pasted fresh every single chat. Three weeks of typing commands, and all of it's been about keeping exactly three things — `frontend`, `chat-api`, `postgres` — alive and talking to each other. There's never been a concept of a "user" in this system at all, just one single conversation, everyone who logs in sees the same shared list.

You open `docker-compose.yml` again, look at the same three familiar services from day one. Simple, understandable in five minutes, exactly like it was your first week. But "dozens of users, each with their own account" and "store company documents" isn't something a few lines of YAML fixes — no Deployment solves two people logging in without stepping on each other, no Service spontaneously creates somewhere to hold a file someone just uploaded.

This isn't "how do I get this running on Kubernetes" anymore. It's a completely different problem: the system needs real new pieces, real code, before there's anything to actually put on the cluster.

You open a blank file, name it `notes-next.md`, same style as that night three weeks ago lining up the "Need..." list. This time there's nothing to match against what you've already learned — just writing down what you just heard, still raw.

```
Need separate accounts per person — no more sharing one
session. Login/logout, know who's actually who.

Multiple people using it at once — need rate limiting, some
kind of cache? Not sure yet, writing it down to look into.

Need somewhere to store documents users upload, instead of
pasting them into the chat box by hand every time like now.
```

Three lines, no arrows pointing to a name for any of them — nothing like that nine-line list from before, where at least "Kubernetes" was already a word worth looking up. This time you don't even know what to call it yet. You close the laptop, no rush — next month, not today — but something in the back of your mind has already started turning it over.
