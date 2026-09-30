import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import { readStoredFile } from "@/lib/integrations/storage";
import { readableFile } from "@/lib/queries";

export const runtime = "nodejs";

function safeName(filename: string) {
  const cleaned = filename.replaceAll(/["\r\n]/g, "").trim();
  return cleaned || "file";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const file = await readableFile(id);
  if (!file) return new NextResponse(null, { status: 404 });
  const stored = await readStoredFile(file.storageKey);
  if (!stored) return new NextResponse(null, { status: 404 });
  const type = file.mimeType || stored.contentType || "application/octet-stream";
  const inline = type.startsWith("image/") || type === "application/pdf" || type.startsWith("text/");
  return new NextResponse(Buffer.from(stored.bytes), {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName(file.filename)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
