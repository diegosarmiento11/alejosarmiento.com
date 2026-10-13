import { Redis } from "@upstash/redis";
import { env, hasRedis } from "./env";

// The small slice of Redis the site needs. Values are strings; callers parse.
export interface Store {
  incr(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  expire(key: string, seconds: number): Promise<void>;
  hget(key: string, field: string): Promise<string | null>;
  hset(key: string, field: string, value: string): Promise<void>;
  hdel(key: string, field: string): Promise<void>;
  hincrby(key: string, field: string, by: number): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;
}

export class MemoryStore implements Store {
  private values = new Map<string, string>();
  private hashes = new Map<string, Map<string, string>>();

  private hash(key: string): Map<string, string> {
    let hash = this.hashes.get(key);
    if (!hash) {
      hash = new Map();
      this.hashes.set(key, hash);
    }
    return hash;
  }

  async incr(key: string) {
    const next = Number(this.values.get(key) ?? 0) + 1;
    this.values.set(key, String(next));
    return next;
  }
  async get(key: string) {
    return this.values.get(key) ?? null;
  }
  async expire() {
    // Memory is only used in development and tests; keys live for the process.
  }
  async hget(key: string, field: string) {
    return this.hash(key).get(field) ?? null;
  }
  async hset(key: string, field: string, value: string) {
    this.hash(key).set(field, value);
  }
  async hdel(key: string, field: string) {
    this.hash(key).delete(field);
  }
  async hincrby(key: string, field: string, by: number) {
    const next = Number(this.hash(key).get(field) ?? 0) + by;
    this.hash(key).set(field, String(next));
    return next;
  }
  async hgetall(key: string) {
    return Object.fromEntries(this.hash(key));
  }
}

// Upstash deserializes JSON on read, so a stored '{"a":1}' comes back as an object
// and "3" as a number. Normalize everything back to strings.
function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
}

class RedisStore implements Store {
  constructor(private redis: Redis) {}

  incr(key: string) {
    return this.redis.incr(key);
  }
  async get(key: string) {
    return asString(await this.redis.get(key));
  }
  async expire(key: string, seconds: number) {
    await this.redis.expire(key, seconds);
  }
  async hget(key: string, field: string) {
    return asString(await this.redis.hget(key, field));
  }
  async hset(key: string, field: string, value: string) {
    await this.redis.hset(key, { [field]: value });
  }
  async hdel(key: string, field: string) {
    await this.redis.hdel(key, field);
  }
  hincrby(key: string, field: string, by: number) {
    return this.redis.hincrby(key, field, by);
  }
  async hgetall(key: string) {
    const all = (await this.redis.hgetall(key)) ?? {};
    const out: Record<string, string> = {};
    for (const [field, value] of Object.entries(all)) {
      const text = asString(value);
      if (text !== null) out[field] = text;
    }
    return out;
  }
}

// Kept on globalThis so every route handler shares one MemoryStore in development.
const globalStore = globalThis as { __blogStore?: Store };

export function getStore(): Store {
  let instance = globalStore.__blogStore;
  if (!instance) {
    instance = hasRedis
      ? new RedisStore(new Redis({ url: env.redisUrl!, token: env.redisToken! }))
      : new MemoryStore();
    if (!hasRedis && env.isProduction) {
      console.warn(
        "[store] UPSTASH_REDIS_REST_URL/TOKEN no están definidas: los contadores viven en memoria y se pierden.",
      );
    }
    globalStore.__blogStore = instance;
  }
  return instance;
}
