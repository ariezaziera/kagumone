function originFromUrl(value?: string | null) {
  if (!value) return null;
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
}

export function authTrustedOrigins() {
  const origins = new Set<string>(["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]);
  const fromEnv = originFromUrl(process.env.BETTER_AUTH_URL);
  if (fromEnv) origins.add(fromEnv);
  const vercel = originFromUrl(process.env.VERCEL_URL);
  if (vercel) origins.add(vercel);
  return [...origins];
}

export function authBaseURL() {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}
