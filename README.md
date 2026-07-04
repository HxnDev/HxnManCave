# HxnManCave

**ManCave** — everything you own, finally in one place. A personal collection
vault for LEGO sets, Funko Pops, books, perfumes, games and more.

Live at [vault.hxndev.com](https://vault.hxndev.com) · part of the
[hxndev.com](https://hxndev.com) ecosystem.

## Structure

| Path              | What                                                |
| ----------------- | --------------------------------------------------- |
| `apps/web`        | Vite + React + Tailwind v4 + shadcn/ui website      |
| `apps/mobile`     | Expo + React Native Android app (Play Store)        |
| `packages/shared` | Domain types, default categories (shared by both)   |
| `supabase/`       | Database migrations (schema, RLS, storage policies) |

## Stack

- **Web:** Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Motion, TanStack Query
- **Mobile:** Expo SDK 57, React Native, Expo Router, EAS Build
- **Backend:** Supabase (Postgres, Auth, Storage) — no server to maintain
- **Hosting:** Vercel (web), Google Play (Android)

## Development

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local     # fill in Supabase keys
cp apps/mobile/.env.example apps/mobile/.env     # same keys for mobile
pnpm dev        # website
pnpm mobile     # Expo dev server — scan the QR with Expo Go
```

## Android builds

```bash
cd apps/mobile
eas build --profile preview --platform android      # installable .apk
eas build --profile production --platform android   # .aab for Play Store
```

## Database

Migrations live in `supabase/migrations`. Apply them with the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Every table uses Row Level Security — users only ever see their own inventory.
