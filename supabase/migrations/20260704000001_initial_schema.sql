-- ManCave — initial schema
-- Tables: profiles, categories, items, item_images, tags, item_tags
-- Every table is protected by RLS: users only ever see their own rows.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pg_trgm"; -- fuzzy search later (Sprint 3)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.item_status as enum ('owned', 'wishlist', 'sold', 'gifted');
create type public.item_condition as enum ('new', 'used', 'sealed', 'damaged');

-- ---------------------------------------------------------------------------
-- profiles — extends auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  icon text not null default 'package',
  color text not null default 'oklch(0.64 0.015 80)',
  field_template jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "Users can manage own categories"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- items
-- ---------------------------------------------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  brand text,
  series text,
  description text,
  quantity integer not null default 1 check (quantity >= 0),
  purchase_price numeric(12, 2) check (purchase_price >= 0),
  current_value numeric(12, 2) check (current_value >= 0),
  currency text not null default 'CHF',
  purchase_date date,
  status public.item_status not null default 'owned',
  condition public.item_condition,
  location text,
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_user_id_idx on public.items (user_id);
create index items_category_id_idx on public.items (category_id);
create index items_status_idx on public.items (user_id, status);
create index items_name_trgm_idx on public.items using gin (name gin_trgm_ops);

alter table public.items enable row level security;

create policy "Users can manage own items"
  on public.items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- keep updated_at fresh
create or replace function public.set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
before update on public.items
for each row
execute function public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- item_images
-- ---------------------------------------------------------------------------
create table public.item_images (
  id uuid primary key default gen_random_uuid (),
  item_id uuid not null references public.items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  thumb_path text,
  sort_order integer not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);

create index item_images_item_id_idx on public.item_images (item_id);

alter table public.item_images enable row level security;

create policy "Users can manage own item images"
  on public.item_images for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- tags + item_tags
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.tags enable row level security;

create policy "Users can manage own tags"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.item_tags (
  item_id uuid not null references public.items (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (item_id, tag_id)
);

create index item_tags_tag_id_idx on public.item_tags (tag_id);

alter table public.item_tags enable row level security;

create policy "Users can manage own item tags"
  on public.item_tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- New user bootstrap: create profile + seed default categories.
-- Keep the category list in sync with DEFAULT_CATEGORIES in packages/shared.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.categories (user_id, name, slug, icon, color, field_template, sort_order)
  values
    (new.id, 'LEGO Sets', 'lego', 'blocks', 'oklch(0.63 0.22 25)',
      '[{"key":"set_number","label":"Set Number","type":"text"},{"key":"pieces","label":"Pieces","type":"number"},{"key":"year","label":"Year","type":"number"}]'::jsonb, 0),
    (new.id, 'Funko Pops', 'funko', 'person-standing', 'oklch(0.65 0.17 300)',
      '[{"key":"pop_number","label":"Pop Number","type":"text"},{"key":"franchise","label":"Franchise","type":"text"}]'::jsonb, 1),
    (new.id, 'Books', 'books', 'book-open', 'oklch(0.7 0.12 195)',
      '[{"key":"author","label":"Author","type":"text"},{"key":"publisher","label":"Publisher","type":"text"},{"key":"isbn","label":"ISBN","type":"text"}]'::jsonb, 2),
    (new.id, 'Souvenirs', 'souvenirs', 'gift', 'oklch(0.68 0.15 45)',
      '[{"key":"country","label":"Country","type":"text"},{"key":"trip_year","label":"Trip Year","type":"number"},{"key":"city","label":"City","type":"text"}]'::jsonb, 3),
    (new.id, 'Keychains', 'keychains', 'key-round', 'oklch(0.78 0.14 75)',
      '[{"key":"country","label":"Country","type":"text"},{"key":"trip_year","label":"Trip Year","type":"number"},{"key":"city","label":"City","type":"text"}]'::jsonb, 4),
    (new.id, 'Perfumes', 'perfumes', 'spray-can', 'oklch(0.62 0.19 350)',
      '[{"key":"size_ml","label":"Size","type":"number","unit":"ml"},{"key":"concentration","label":"Concentration","type":"select","options":["EDT","EDP","Parfum","Extrait","Cologne"]}]'::jsonb, 5),
    (new.id, 'Card Games', 'card-games', 'spade', 'oklch(0.63 0.2 15)',
      '[]'::jsonb, 6),
    (new.id, 'Online Games', 'online-games', 'gamepad-2', 'oklch(0.66 0.16 260)',
      '[{"key":"platform","label":"Platform","type":"select","options":["Steam","Epic","PlayStation","Xbox","Nintendo","GOG","Other"]},{"key":"format","label":"Format","type":"select","options":["Digital","Physical"]}]'::jsonb, 7),
    (new.id, 'Electronics', 'electronics', 'cpu', 'oklch(0.7 0.11 230)',
      '[{"key":"model","label":"Model","type":"text"},{"key":"serial_number","label":"Serial Number","type":"text"},{"key":"warranty_until","label":"Warranty Until","type":"date"}]'::jsonb, 8);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user ();

-- ---------------------------------------------------------------------------
-- Storage: private bucket for item photos.
-- Path convention: {user_id}/{item_id}/{filename}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  false,
  5242880, -- 5MB hard cap; client compresses well below this
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
);

create policy "Users can view own images"
  on storage.objects for select
  using (bucket_id = 'item-images' and (storage.foldername (name))[1] = auth.uid()::text);

create policy "Users can upload own images"
  on storage.objects for insert
  with check (bucket_id = 'item-images' and (storage.foldername (name))[1] = auth.uid()::text);

create policy "Users can update own images"
  on storage.objects for update
  using (bucket_id = 'item-images' and (storage.foldername (name))[1] = auth.uid()::text);

create policy "Users can delete own images"
  on storage.objects for delete
  using (bucket_id = 'item-images' and (storage.foldername (name))[1] = auth.uid()::text);
