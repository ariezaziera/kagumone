import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { authBaseURL, authTrustedOrigins } from "@/lib/auth/origins";

/** Invite activation and demo seed only. Production login still uses disableSignUp. */
export function createSignupAuth() {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-change-me-kagum-one-secret",
    baseURL: authBaseURL(),
    trustedOrigins: authTrustedOrigins(),
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: { enabled: true, disableSignUp: false },
  });
}
