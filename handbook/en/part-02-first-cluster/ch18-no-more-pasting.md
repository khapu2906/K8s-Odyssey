# Chapter 18 — No More Pasting

## The next day

Open `notes-next.md` again, two lines left:

```
Multiple people using it at once — need rate limiting, some
kind of cache? Not sure yet, writing it down to look into.

Need somewhere to store documents users upload, instead of
pasting them into the chat box by hand every time like now.
```

The first line is still "not sure yet" — nothing concrete to actually start on. The second one is different, knows exactly what's needed: somewhere to store documents, tied to whichever user uploaded them.

Open `schema.js`, add a `documents` table — attach `userId` the exact same way `conversations` did back in Chapter 17.

```js
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

A completely new table, no old data to worry about preserving — this time just a plain `CREATE TABLE IF NOT EXISTS` in `db.js` is enough, no `ALTER` needed like last time's lesson.

```js
await pool.query(`
  CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);
```

Add two routes to `index.js`, locked behind `jwt()` same as `/api/chat`. Then update `/api/chat` — instead of forcing the full `documentText` pasted in every time, it now also accepts a `documentId`, looking up the document's content from the database itself.

```js
app.use("/api/documents", jwt({ secret: JWT_SECRET, alg: "HS256" }));

app.post("/api/documents", async (c) => {
  const { filename, content } = await c.req.json();
  const { sub: userId } = c.get("jwtPayload");
  const [doc] = await db
    .insert(documents)
    .values({ userId, filename, content })
    .returning({ id: documents.id, filename: documents.filename, createdAt: documents.createdAt });
  return c.json(doc);
});
```

```js
app.post("/api/chat", async (c) => {
  const { message, documentText, documentId } = await c.req.json();
  const { sub: userId } = c.get("jwtPayload");

  let text = documentText;
  if (documentId) {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
    text = doc?.content;
  }

  const reply = answer(message, text);
  ...
});
```

The condition `and(eq(documents.id, documentId), eq(documents.userId, userId))` — not just matching the right `id`, but also requiring the right `userId` for whoever's calling. Drop that second condition, and anyone logged in could guess an ID and read someone else's document — exactly the kind of hole already avoided by filtering `/api/conversations` on `userId` back in Chapter 17, applied here again for the new endpoint.

Rebuild, deploy.

```bash
docker build -t ai-workspace/chat-api:dev ./chat-api
kind load docker-image ai-workspace/chat-api:dev --name ai-workspace
kubectl delete pod -n ai-workspace -l app=chat-api
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

Log back in with the account created yesterday, grab a fresh token.

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@ai-workspace.dev","password":"correct-horse"}'
```

```json
{"token":"eyJhbGciOiJIUzI1NiJ9..."}
```

Upload a short document.

```bash
curl -s -X POST http://localhost:8080/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -d '{"filename":"notes.txt","content":"Kubernetes automatically restarts containers that fail. ReplicaSet ensures the right number of Pods always exists."}'
```

```json
{"id":1,"filename":"notes.txt","createdAt":"2026-08-25T08:41:02.117Z"}
```

Send a question, pointing straight at `documentId: 1` instead of pasting the whole text again.

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -d '{"message":"what does ReplicaSet ensure","documentId":1}'
```

```json
{"id":16,"userId":1,"message":"what does ReplicaSet ensure","reply":"ReplicaSet ensures the right number of Pods always exists.","createdAt":"2026-08-25T08:42:15.903Z"}
```

First time the answer isn't the usual polite refusal — the actual sentence from the uploaded document, found by matching keywords against the question. No more pasting `documentText` into the body by hand, just remembering the right `documentId`.

Before shutting down, curious how much real disk space that saved document actually takes on the volume attached back in Chapter 11.

```bash
kubectl exec -it postgres-6b7d4f8c9-p3wln -n ai-workspace -- df -h /var/lib/postgresql/data
```

```
Filesystem                Size  Used Avail Use%
/dev/vda1                 1.0G   45M  980M   5%
```

`1.0G` — the exact number asked for in `postgres-pvc.yaml` back then, seen again now with different eyes: not an abstract number anymore, a real limit, currently with 980M to spare. A few short test documents barely make a dent, but with a bigger company, each user uploading dozens of real files (not a few test lines), that 5% climbs faster than it looks. Write a line down, don't rush to fix it — a different problem, for later.

Open `notes-next.md`, cross off the one just finished.

```
Need somewhere to store documents users upload ✓ a documents
table, filtered by userId exactly like conversations. The PVC
still has 1Gi from Chapter 11 — plenty of room right now, but
that's a real limit, not infinite. Worth watching as data grows.

Multiple people using it at once — need rate limiting, some
kind of cache? Not sure yet, later.
```

One line, not two. Exactly one question left with no answer yet — but no rush this time, that line said "not sure yet" from the start, not something left half-finished.
