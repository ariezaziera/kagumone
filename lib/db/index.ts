import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

function databaseUrl() {
  return process.env.TURSO_DATABASE_URL ?? "file:./data/kagum.db";
}

export function createDb() {
  const url = databaseUrl();
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const client = createClient({
    url,
    authToken: authToken || undefined,
  });
  return drizzle(client, { schema });
}

export const db = createDb();
export type Database = ReturnType<typeof createDb>;
