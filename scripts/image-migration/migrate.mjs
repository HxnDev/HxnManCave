/**
 * ManCave image migration — regenerates every item photo as:
 *   display: max 1400px WebP q76  (detail screens)
 *   thumb:   max 480px  WebP q70  (lists / grids)
 *
 * Phases (run in this order):
 *   node --env-file=.env migrate.mjs plan      read-only summary
 *   node --env-file=.env migrate.mjs run       convert + upload + update rows
 *   node --env-file=.env migrate.mjs verify    confirm every new file exists
 *   node --env-file=.env migrate.mjs cleanup   delete the old originals
 *
 * Old files are never deleted during `run`; their paths are recorded in
 * migration-log.json and only removed by `cleanup` after `verify` passes.
 */
import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import sharp from "sharp";

const BUCKET = "item-images";
const LOG_FILE = new URL("./migration-log.json", import.meta.url);
const CONCURRENCY = 4;
const CACHE_CONTROL = "31536000";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function fetchAllImages() {
  const { data, error } = await supabase
    .from("item_images")
    .select("id, item_id, user_id, storage_path, thumb_path")
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

async function readLog() {
  try {
    return JSON.parse(await readFile(LOG_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeLog(entries) {
  await writeFile(LOG_FILE, JSON.stringify(entries, null, 2));
}

async function fileExists(path) {
  // createSignedUrl fails for missing objects — cheap existence check.
  const { error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  return !error;
}

async function migrateOne(image, log) {
  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(image.storage_path);
  if (downloadError || !blob) {
    throw new Error(downloadError?.message ?? "download failed");
  }
  const input = Buffer.from(await blob.arrayBuffer());

  const display = await sharp(input)
    .rotate() // bake in EXIF orientation
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 76 })
    .toBuffer();
  const thumb = await sharp(input)
    .rotate()
    .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();

  const base = `${image.user_id}/${image.item_id}/${Date.now()}-m${image.id.slice(0, 8)}`;
  const displayPath = `${base}-display.webp`;
  const thumbPath = `${base}-thumb.webp`;

  const [displayUpload, thumbUpload] = await Promise.all([
    supabase.storage.from(BUCKET).upload(displayPath, display, {
      contentType: "image/webp",
      cacheControl: CACHE_CONTROL,
    }),
    supabase.storage.from(BUCKET).upload(thumbPath, thumb, {
      contentType: "image/webp",
      cacheControl: CACHE_CONTROL,
    }),
  ]);
  if (displayUpload.error || thumbUpload.error) {
    await supabase.storage.from(BUCKET).remove([displayPath, thumbPath]);
    throw new Error(
      displayUpload.error?.message ?? thumbUpload.error?.message ?? "upload failed",
    );
  }

  const { error: updateError } = await supabase
    .from("item_images")
    .update({ storage_path: displayPath, thumb_path: thumbPath })
    .eq("id", image.id);
  if (updateError) {
    await supabase.storage.from(BUCKET).remove([displayPath, thumbPath]);
    throw updateError;
  }

  log.push({
    imageId: image.id,
    oldPath: image.storage_path,
    oldSizeBytes: input.length,
    displayPath,
    displaySizeBytes: display.length,
    thumbPath,
    thumbSizeBytes: thumb.length,
    migratedAt: new Date().toISOString(),
  });
}

async function phasePlan() {
  const images = await fetchAllImages();
  const pending = images.filter((img) => !img.thumb_path);
  console.log(`Total image rows:     ${images.length}`);
  console.log(`Already migrated:     ${images.length - pending.length}`);
  console.log(`Pending migration:    ${pending.length}`);
  for (const img of pending.slice(0, 10)) console.log(`  - ${img.storage_path}`);
  if (pending.length > 10) console.log(`  … and ${pending.length - 10} more`);
}

async function phaseRun() {
  const images = await fetchAllImages();
  const pending = images.filter((img) => !img.thumb_path);
  console.log(`Migrating ${pending.length} images (concurrency ${CONCURRENCY})…`);

  const log = await readLog();
  const limit = pLimit(CONCURRENCY);
  let done = 0;
  const failures = [];

  await Promise.all(
    pending.map((image) =>
      limit(async () => {
        try {
          await migrateOne(image, log);
          done += 1;
          console.log(`ok   (${done}/${pending.length}) ${image.storage_path}`);
        } catch (error) {
          failures.push({ path: image.storage_path, error: String(error) });
          console.error(`FAIL ${image.storage_path}: ${error}`);
        } finally {
          await writeLog(log);
        }
      }),
    ),
  );

  const oldMB = log.reduce((s, e) => s + e.oldSizeBytes, 0) / 1e6;
  const newMB =
    log.reduce((s, e) => s + e.displaySizeBytes + e.thumbSizeBytes, 0) / 1e6;
  console.log(`\nMigrated ${done}, failed ${failures.length}.`);
  console.log(`Old total: ${oldMB.toFixed(1)} MB -> new total: ${newMB.toFixed(1)} MB`);
  if (failures.length > 0) {
    console.log("Failures (rerun `run` to retry them):");
    for (const f of failures) console.log(`  - ${f.path}`);
  }
}

async function phaseVerify() {
  const images = await fetchAllImages();
  let ok = 0;
  const problems = [];
  const limit = pLimit(8);

  await Promise.all(
    images.map((img) =>
      limit(async () => {
        if (!img.thumb_path) {
          problems.push(`${img.id}: thumb_path still null (${img.storage_path})`);
          return;
        }
        const [displayOk, thumbOk] = await Promise.all([
          fileExists(img.storage_path),
          fileExists(img.thumb_path),
        ]);
        if (!displayOk) problems.push(`${img.id}: missing display ${img.storage_path}`);
        else if (!thumbOk) problems.push(`${img.id}: missing thumb ${img.thumb_path}`);
        else ok += 1;
      }),
    ),
  );

  console.log(`Verified ${ok}/${images.length} image rows.`);
  if (problems.length > 0) {
    console.log("Problems — fix these before running cleanup:");
    for (const p of problems) console.log(`  - ${p}`);
    process.exit(1);
  }
  console.log("All good. Safe to run cleanup.");
}

async function phaseCleanup() {
  const log = await readLog();
  const oldPaths = [...new Set(log.map((e) => e.oldPath))];
  if (oldPaths.length === 0) {
    console.log("Nothing to clean up (migration-log.json is empty).");
    return;
  }
  console.log(`Deleting ${oldPaths.length} old files…`);
  // Storage remove() accepts batches; chunk to stay well under limits.
  for (let i = 0; i < oldPaths.length; i += 50) {
    const chunk = oldPaths.slice(i, i + 50);
    const { error } = await supabase.storage.from(BUCKET).remove(chunk);
    if (error) throw error;
    console.log(`  deleted ${Math.min(i + 50, oldPaths.length)}/${oldPaths.length}`);
  }
  console.log("Done. Old originals removed.");
}

const phase = process.argv[2];
const phases = { plan: phasePlan, run: phaseRun, verify: phaseVerify, cleanup: phaseCleanup };
if (!phases[phase]) {
  console.error("Usage: node --env-file=.env migrate.mjs <plan|run|verify|cleanup>");
  process.exit(1);
}
await phases[phase]();
