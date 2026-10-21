// The only file that reads process.env. Everything else imports `env`.
// Every variable here is optional: the site builds and runs without credentials.

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readPositiveInt(name: string): number | undefined {
  const value = Number(read(name));
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  // Upstash Redis. The Vercel Marketplace integration exposes the KV_* names.
  redisUrl: read("UPSTASH_REDIS_REST_URL") ?? read("KV_REST_API_URL"),
  redisToken: read("UPSTASH_REDIS_REST_TOKEN") ?? read("KV_REST_API_TOKEN"),
  brevoApiKey: read("BREVO_API_KEY"),
  // Numeric id of the Brevo list that holds the newsletter subscribers.
  brevoListId: readPositiveInt("BREVO_LIST_ID"),
  // "Alejandro Sarmiento <hola@alejosarmiento.com>", on a domain authenticated in Brevo.
  emailFrom: read("EMAIL_FROM"),
  // Where new-comment notifications go.
  ownerEmail: read("OWNER_EMAIL"),
  // Signs newsletter confirmation and comment moderation links.
  signingSecret: read("SIGNING_SECRET"),
  // Opens /escribir, the screen that publishes posts, and authorizes posts:push.
  adminPassword: read("ADMIN_PASSWORD"),
} as const;

export const hasRedis = Boolean(env.redisUrl && env.redisToken);
export const hasEmail = Boolean(env.brevoApiKey && env.emailFrom);
