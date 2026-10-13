// The only file that reads process.env. Everything else imports `env`.
// Every variable here is optional: the site builds and runs without credentials.

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  // Upstash Redis. The Vercel Marketplace integration exposes the KV_* names.
  redisUrl: read("UPSTASH_REDIS_REST_URL") ?? read("KV_REST_API_URL"),
  redisToken: read("UPSTASH_REDIS_REST_TOKEN") ?? read("KV_REST_API_TOKEN"),
  resendApiKey: read("RESEND_API_KEY"),
  resendSegmentId: read("RESEND_SEGMENT_ID"),
  // "Alejandro Sarmiento <hola@alejosarmiento.com>", on a domain verified in Resend.
  emailFrom: read("EMAIL_FROM"),
  // Where new-comment notifications go.
  ownerEmail: read("OWNER_EMAIL"),
  // Signs newsletter confirmation and comment moderation links.
  signingSecret: read("SIGNING_SECRET"),
} as const;

export const hasRedis = Boolean(env.redisUrl && env.redisToken);
export const hasEmail = Boolean(env.resendApiKey && env.emailFrom);
