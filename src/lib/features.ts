import { env, hasEmail, hasRedis } from "./env";

// Comments need durable storage plus a way to notify and moderate.
export const canModerateByEmail = Boolean(hasEmail && env.signingSecret && env.ownerEmail);

// In production comments stay closed until moderation works end to end.
// In development they are open and auto-approved so the UI can be exercised.
export const commentsEnabled = env.isProduction ? hasRedis && canModerateByEmail : true;
export const commentsAutoApprove = !env.isProduction && !canModerateByEmail;

export const newsletterReady = Boolean(hasEmail && env.signingSecret);

// Signs links sent by email. Development falls back to a fixed secret so the
// flows can be exercised without credentials; production never does.
export const linkSecret =
  env.signingSecret ?? (env.isProduction ? undefined : "dev-only-signing-secret");
