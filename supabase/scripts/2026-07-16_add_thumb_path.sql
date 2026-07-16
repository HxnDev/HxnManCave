-- ---------------------------------------------------------------------------
-- Image optimisation: per-image thumbnail path.
-- Run once in the Supabase SQL editor BEFORE deploying the new app code.
--
-- New uploads write two files per photo:
--   storage_path -> display image (~1400px WebP, used on detail screens)
--   thumb_path   -> thumbnail    (~480px WebP, used in lists/grids)
-- Legacy rows keep thumb_path NULL until the migration script fills them.
-- ---------------------------------------------------------------------------

alter table public.item_images
  add column if not exists thumb_path text;
