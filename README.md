# HxnManCave

**ManCave** — everything you own, finally in one place. A personal collection
vault for LEGO sets, Funko Pops, books, perfumes, games and more.

Live at [vault.hxndev.com](https://vault.hxndev.com) · part of the
[hxndev.com](https://hxndev.com) ecosystem.

## Structure

| Path              | What                                                     |
| ----------------- | -------------------------------------------------------- |
| `apps/web`        | Vite + React + Tailwind v4 + shadcn/ui website           |
| `packages/shared` | Domain types, default categories (reused by Phase 2 app) |
| `supabase/`       | Database migrations (schema, RLS, storage policies)      |

## Stack

- **Frontend:** Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Motion, TanStack Query
- **Backend:** Supabase (Postgres, Auth, Storage) — no server to maintain
- **Hosting:** Vercel
- **Phase 2:** Expo + React Native Android app (Play Store)

## Development

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # fill in Supabase keys
pnpm dev
```

## Database

Migrations live in `supabase/migrations`. Apply them with the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Every table uses Row Level Security — users only ever see their own inventory.
