import { mkdir, writeFile } from "node:fs/promises";
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
