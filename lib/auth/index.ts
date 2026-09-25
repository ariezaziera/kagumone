import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendEmail } from "@/lib/integrations/email";
import { authBaseURL, authTrustedOrigins } from "@/lib/auth/origins";

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
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your KAGUM ONE password",
        text: `Reset your password: ${url}`,
      });
    },
  },
  plugins: [nextCookies()],
});
