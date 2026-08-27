# Chapter 17 — No Pod Remembers Anyone

## Early the following week

You open `notes-next.md` again, the first line sitting exactly where you left it Friday:

```
Need separate accounts per person — no more sharing one
session. Login/logout, know who's actually who.
```

The first question isn't "how," it's "where does login state even live." The familiar approach — a session held in the process's own memory, the server just remembers whoever logged in. You start typing, then stop halfway, remembering something you saw with your own eyes a few weeks back: `chat-api` runs three replicas, none of them knows what's sitting in another one's RAM. Someone logs in, the request happens to land on Pod A; their next request lands on Pod B, and Pod B has never heard of this person — as far as it's concerned, nobody's logged in at all. Three Pods, three separate memories, nothing syncing between them on its own.

The other approach — don't hold any state on any server at all, pack the user's identity straight into a string, sign it with a secret key, hand it to the client to hold onto. Whichever server gets the next request can verify the signature itself, no need to ask "which Pod remembers this person" — because no Pod needs to remember anything. The word that keeps showing up in the blog posts for exactly this is JWT.

### A users table, and a new column on an old one

You open `schema.js`, add a `users` table, and a `userId` column on the existing `conversations` table.

```js
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  reply: text("reply").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

About to just edit the `CREATE TABLE conversations` in `db.js` to match, you stop. That table already exists for real on Postgres — remember, same as the PVC that got mounted in a while back, the data has survived every Pod dying and coming back since. `CREATE TABLE IF NOT EXISTS` won't touch a table that already exists, even if the definition in code has changed. Needs a separate `ALTER`.

```js
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    reply TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);
await pool.query(`
  ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
`);
```

The old data staying put is exactly the proof that it really does outlive the Pod — only now you're seeing the actual consequence of that, and it isn't always convenient, sometimes it means one extra `ALTER` line just because the data doesn't vanish every time a Pod dies anymore, the way it used to.

### Signup, login

New file, `auth.js` — hash passwords with `bcryptjs`, sign JWTs with the module already bundled inside `hono`, nothing extra to install for the token part.

```js
import bcrypt from "bcryptjs";
import { sign } from "hono/jwt";
import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { users } from "./schema.js";

const JWT_SECRET = process.env.JWT_SECRET;

export async function signup(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning();
  return user;
}

export async function login(email, password) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return sign({ sub: user.id, email: user.email }, JWT_SECRET);
}
```

`index.js` gets two new routes, then `/api/chat` and `/api/conversations` get locked behind the `jwt()` middleware — any request without a valid token gets stopped right there, never reaching the real handler.

```js
app.use("/api/chat", jwt({ secret: JWT_SECRET }));
app.use("/api/conversations", jwt({ secret: JWT_SECRET }));

app.post("/api/chat", async (c) => {
  const { message, documentText } = await c.req.json();
  const { sub: userId } = c.get("jwtPayload");
  ...
  const [conversation] = await db
    .insert(conversations)
    .values({ userId, message, reply })
    .returning();
  return c.json(conversation);
});

app.get("/api/conversations", async (c) => {
  const { sub: userId } = c.get("jwtPayload");
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(asc(conversations.createdAt));
  return c.json(rows);
});
```

### One more Secret

`JWT_SECRET` needs a real value, not something typed off the top of your head like `postgres` was before — this one signs every token; leak it, and anyone can forge a valid token themselves. Generate a proper random string.

```bash
openssl rand -hex 32
```

```
3f9a1c8e2b7d4f6a0e5c9b2d8f1a4e7c6b3d9f2a5e8c1b4d7f0a3e6c9b2d5f8a
```

Same routine as before, just a different Secret name and key.

```bash
kubectl create secret generic chat-api-secret \
  --from-literal=JWT_SECRET=3f9a1c8e2b7d4f6a0e5c9b2d8f1a4e7c6b3d9f2a5e8c1b4d7f0a3e6c9b2d5f8a \
  -n ai-workspace \
  --dry-run=client -o yaml > chat-api-secret.yaml

kubectl apply -f chat-api-secret.yaml
```

```
secret/chat-api-secret created
```

Add it to `chat-api-deployment.yaml`, right next to the `POSTGRES_*` variables you're used to by now.

```yaml
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: chat-api-secret
      key: JWT_SECRET
```

### Rebuild, try it for real

```bash
docker build -t ai-workspace/chat-api:dev ./chat-api
kind load docker-image ai-workspace/chat-api:dev --name ai-workspace
kubectl apply -f chat-api-deployment.yaml
kubectl delete pod -n ai-workspace -l app=chat-api
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

`port-forward` won't connect. Check the Pod.

```bash
kubectl get pods -n ai-workspace
```

```
NAME                        READY   STATUS             RESTARTS   AGE
chat-api-586cbb45d8-fghkt   0/1     CrashLoopBackOff   5          3m
```

```bash
kubectl logs chat-api-586cbb45d8-fghkt -n ai-workspace
```

```
Error: JWT auth middleware requires options for "alg"
    at jwt (file:///app/node_modules/hono/dist/middleware/jwt/jwt.js:12:11)
    at file:///app/src/index.js:44:22
```

The installed `hono/jwt` doesn't infer a default signing algorithm the way you assumed — `alg` has to be declared explicitly. Fix the two lines just written.

```js
app.use("/api/chat", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/conversations", jwt({ secret: JWT_SECRET, alg: "HS256" }));
```

`HS256` — the same algorithm `sign()` in `auth.js` already uses by default, just spelled out now so the middleware knows too. Rebuild, apply again.

```bash
docker build -t ai-workspace/chat-api:dev ./chat-api
kind load docker-image ai-workspace/chat-api:dev --name ai-workspace
kubectl delete pod -n ai-workspace -l app=chat-api
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

This time it comes up `1/1 Running` for real. Try it with no account first.

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hi"}'
```

```json
{"message":"Unauthorized"}
```

Exactly what just got wired up — no token, no entry. Sign up.

```bash
curl -s -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@ai-workspace.dev","password":"correct-horse"}'
```

```json
{"id":1,"email":"you@ai-workspace.dev"}
```

Log in, get a token.

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@ai-workspace.dev","password":"correct-horse"}'
```

```json
{"token":"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsImVtYWlsIjoieW91QGFpLXdvcmtzcGFjZS5kZXYifQ.k3f8..."}
```

Attach the token as a header, retry the exact request that just got blocked.

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsImVtYWlsIjoieW91QGFpLXdvcmtzcGFjZS5kZXYifQ.k3f8..." \
  -d '{"message":"hi"}'
```

```json
{"id":15,"userId":1,"message":"hi","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-24T09:03:11.204Z"}
```

Through. `userId: 1`, the person who just logged in. This request could have landed on any of the three `chat-api` replicas, doesn't matter which — as long as they all read the same `JWT_SECRET` from the same Secret, verifying the signature is enough, no Pod needs to have "remembered" you from before.

You open `notes-next.md`, cross off the first line.

```
Need separate accounts per person ✓ JWT — no session stored
on the server, the token carries identity itself, signed and
verified with JWT_SECRET shared through a Secret. Any Pod can
answer, none of them need to "remember" who logged in where.

Multiple people using it at once — need rate limiting, some
kind of cache? Not sure yet, writing it down to look into.

Need somewhere to store documents users upload, instead of
pasting them into the chat box by hand every time like now.
```

Two lines left. Leave it there for tonight, pick it up again tomorrow.
