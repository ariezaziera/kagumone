import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { readStoredFile } from "@/lib/integrations/storage";
import { hideDemoWorkspace } from "@/lib/services/demo-scope";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ personId: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return new NextResponse(null, { status: 401 });
  const { personId } = await params;
  const [person] = await db.select().from(people).where(eq(people.id, personId));
  if (!person?.photoStorageKey) return new NextResponse(null, { status: 404 });
  if (person.isDemo && person.id !== ctx.person.id && (await hideDemoWorkspace())) {
    return new NextResponse(null, { status: 404 });
  }
  const stored = await readStoredFile(person.photoStorageKey);
  const contentType = person.photoMimeType || stored?.contentType || "";
  if (!stored || !contentType.startsWith("image/")) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(stored.bytes), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
