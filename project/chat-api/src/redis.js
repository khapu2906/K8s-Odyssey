import { createClient } from "redis";

export const redis = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`,
});

redis.on("error", (err) => console.error("Redis client error", err));

export async function connectRedis(retries = 10, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await redis.connect();
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(
        `Redis not ready yet (attempt ${attempt}/${retries}), retrying in ${delayMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// Fixed-window counter: INCR creates the key at 1 and returns it; EXPIRE is
// only set on that first hit so the window doesn't keep sliding forward on
// every subsequent request.
export async function checkRateLimit(key, limit, windowSeconds) {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count <= limit;
}
