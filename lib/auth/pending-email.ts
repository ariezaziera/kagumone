import { newId } from "@/lib/utils";

const PENDING_EMAIL_DOMAIN = "@pending.kagum.local";

export function pendingSignInEmail() {
  return `${newId()}${PENDING_EMAIL_DOMAIN}`;
}

export function isPendingSignInEmail(email: string | null | undefined) {
  return !email || email.toLowerCase().endsWith(PENDING_EMAIL_DOMAIN);
}

export function visibleSignInEmail(email: string | null | undefined): string | null {
  if (!email || isPendingSignInEmail(email)) return null;
  return email;
}
