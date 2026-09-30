import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { authBaseURL, authTrustedOrigins } from "@/lib/auth/origins";
import { REMEMBER_IDLE_SECONDS, SESSION_UPDATE_AGE_SECONDS } from "@/lib/auth/session-policy";

export const auth = betterAuth({
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
  session: {
    expiresIn: REMEMBER_IDLE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    sendResetPassword: async () => {
      throw new Error("Password resets are issued by an administrator.");
    },
  },
  plugins: [username({ displayUsername: false }), nextCookies()],
});
