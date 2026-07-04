import imageCompression from "browser-image-compression";
import { supabase } from "./supabase";

const BUCKET = "item-images";

/** Compress to web-friendly size (~350KB, max 1600px) before upload. */
async function compress(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxSizeMB: 0.35,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: "image/webp",
    });
  } catch {
    // Fall back to the original if compression fails (e.g. exotic format)
    return file;
  }
}

/** Upload one image; returns its storage path ({userId}/{itemId}/{uuid}.webp). */
export async function uploadItemImage(
  userId: string,
  itemId: string,
  file: File,
): Promise<string> {
  const compressed = await compress(file);
  const extension = compressed.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg");
  const path = `${userId}/${itemId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { contentType: compressed.type });
  if (error) throw error;

  return path;
}

/** Batch-sign storage paths for display. Returns path -> signed URL. */
export async function getSignedUrls(
  paths: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 3600);
  if (error) throw error;

  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) map.set(entry.path, entry.signedUrl);
  }
  return map;
}

export async function deleteStorageFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}
