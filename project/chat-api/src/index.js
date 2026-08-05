import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { asc } from "drizzle-orm";
import { db, initSchema } from "./db.js";
import { conversations } from "./schema.js";
import { answer } from "./answer.js";

const app = new Hono();
app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

app.post("/api/chat", async (c) => {
  const { message, documentText } = await c.req.json();

  if (!message || typeof message !== "string") {
    return c.json({ error: "message is required" }, 400);
  }

  const reply = answer(message, documentText);

  const [conversation] = await db
    .insert(conversations)
    .values({ message, reply })
    .returning();

  return c.json(conversation);
});

app.get("/api/conversations", async (c) => {
  const rows = await db
    .select()
    .from(conversations)
    .orderBy(asc(conversations.createdAt));

  return c.json(rows);
});

const PORT = process.env.PORT || 8080;

initSchema()
  .then(() => {
    serve({ fetch: app.fetch, port: PORT }, () => {
      console.log(`chat-api listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database schema", err);
    process.exit(1);
  });
