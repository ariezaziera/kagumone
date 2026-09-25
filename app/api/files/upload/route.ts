import { NextRequest, NextResponse } from "next/server";
import { storeFile } from "@/lib/integrations/storage";
import { recordFileMeta } from "@/lib/actions/core";
import { getAuthContext } from "@/lib/auth/context";

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File required" }, { status: 400 });
  const stored = await storeFile(file);
  const meta = await recordFileMeta({
    filename: stored.filename,
    mimeType: stored.mimeType,
    storageKey: stored.storageKey,
    relatedType: String(form.get("relatedType") || ""),
    relatedId: String(form.get("relatedId") || ""),
    category: String(form.get("category") || ""),
  });
  return NextResponse.json(meta);
}
