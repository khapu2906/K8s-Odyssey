import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import { serve } from "@hono/node-server";
import { asc, eq, and } from "drizzle-orm";
import { db, initSchema } from "./db.js";
import { conversations, documents } from "./schema.js";
import { answer } from "./answer.js";
import { signup, login } from "./auth.js";
import { connectRedis, checkRateLimit } from "./redis.js";

const app = new Hono();
app.use("*", cors());

const JWT_SECRET = process.env.JWT_SECRET;

app.get("/health", (c) => c.json({ status: "ok" }));

app.post("/api/auth/signup", async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: "email and password are required" }, 400);
  }

  try {
    const user = await signup(email, password);
    return c.json({ id: user.id, email: user.email });
  } catch (err) {
    return c.json({ error: "email already registered" }, 409);
  }
});

app.post("/api/auth/login", async (c) => {
  const ip = c.req.header("x-forwarded-for") ?? "unknown";
  const allowed = await checkRateLimit(`ratelimit:login:${ip}`, 5, 60);
  if (!allowed) {
    return c.json({ error: "too many login attempts, try again in a minute" }, 429);
  }

  const { email, password } = await c.req.json();

  const token = await login(email, password);
  if (!token) {
    return c.json({ error: "invalid email or password" }, 401);
  }

  return c.json({ token });
});

app.use("/api/chat", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/conversations", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/documents", jwt({ secret: JWT_SECRET, alg: "HS256" }));

app.post("/api/documents", async (c) => {
  const { filename, content } = await c.req.json();
  const { sub: userId } = c.get("jwtPayload");

  if (!filename || !content) {
    return c.json({ error: "filename and content are required" }, 400);
  }

  const [doc] = await db
    .insert(documents)
    .values({ userId, filename, content })
    .returning({
      id: documents.id,
      filename: documents.filename,
      createdAt: documents.createdAt,
    });

  return c.json(doc);
});

app.get("/api/documents", async (c) => {
  const { sub: userId } = c.get("jwtPayload");

  const rows = await db
    .select({
      id: documents.id,
      filename: documents.filename,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(asc(documents.createdAt));

  return c.json(rows);
});

app.post("/api/chat", async (c) => {
  const { message, documentText, documentId } = await c.req.json();
  const { sub: userId } = c.get("jwtPayload");

  if (!message || typeof message !== "string") {
    return c.json({ error: "message is required" }, 400);
  }

  let text = documentText;
  if (documentId) {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
    text = doc?.content;
  }

  const reply = answer(message, text);

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

const PORT = process.env.PORT || 8080;

Promise.all([initSchema(), connectRedis()])
  .then(() => {
    serve({ fetch: app.fetch, port: PORT }, () => {
      console.log(`chat-api listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database schema or Redis", err);
    process.exit(1);
  });
