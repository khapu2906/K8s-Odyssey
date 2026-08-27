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
