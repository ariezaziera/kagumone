import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { newId } from "@/lib/utils";

export async function storeFile(file: File) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const key = `${newId()}-${file.name.replaceAll(/[^\w.\-]+/g, "_")}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  if (token) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, bytes, { access: "private", token });
    return { storageKey: blob.url, filename: file.name, mimeType: file.type };
  }
  const dir = path.join(process.cwd(), ".uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, key), bytes);
  return { storageKey: `local:${key}`, filename: file.name, mimeType: file.type };
}

export async function readStoredFile(storageKey: string): Promise<{ bytes: Uint8Array; contentType: string | null } | null> {
  if (storageKey.startsWith("local:")) {
    const name = storageKey.slice("local:".length);
    if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) return null;
    try {
      const bytes = await readFile(path.join(process.cwd(), ".uploads", name));
      return { bytes, contentType: null };
    } catch {
      return null;
    }
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !storageKey.startsWith("http")) return null;
  const { get } = await import("@vercel/blob");
  const result = await get(storageKey, { access: "private", token });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return {
    bytes: new Uint8Array(await new Response(result.stream).arrayBuffer()),
    contentType: result.blob.contentType,
  };
}
