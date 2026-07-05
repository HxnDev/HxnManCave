# HxnManCave

**ManCave** — everything you own, finally in one place. A personal collection
vault for LEGO sets, Funko Pops, books, perfumes, games and more.

Live at [vault.hxndev.com](https://vault.hxndev.com) · part of the
[hxndev.com](https://hxndev.com) ecosystem.

## Structure

| Path              | What                                                |
| ----------------- | --------------------------------------------------- |
| `apps/web`        | Vite + React + Tailwind v4 + shadcn/ui website      |
| `apps/mobile`     | Expo + React Native Android app (ManCave 1.0.0)    |
| `packages/shared` | Domain types, default categories (shared by both)   |
| `supabase/`       | Database migrations (schema, RLS, storage policies) |

## Features

Both apps talk to the same Supabase project — changes sync instantly in both
directions.

**Web** — landing page, dashboard with charts, bookcase-style collection
shelves, category management with custom field templates, item CRUD with
multi-photo upload, tags, global search and filters, CSV export.

**Mobile** — emerald "lounge" theme matching the web app, shelves with
poster-style showcase cards, status filters and search, full item add/edit
(including per-category custom fields) with camera capture and gallery upload,
category management (create/edit/delete with icon and color pickers), dashboard
with donut and monthly charts, profile with avatar upload and vault net value,
email + Google sign-in via deep link.

## Stack

- **Web:** Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Motion, TanStack Query
- **Mobile:** Expo SDK 56, React Native, Expo Router, Reanimated, TanStack Query, EAS Build
- **Backend:** Supabase (Postgres, Auth, Storage) — no server to maintain
- **Hosting:** Vercel (web), Google Play (Android)

## Development

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local     # fill in Supabase keys
cp apps/mobile/.env.example apps/mobile/.env     # same keys for mobile
pnpm dev        # website (Vite)
pnpm mobile     # Metro dev server for the mobile app
```

The mobile app uses an [Expo development build](https://docs.expo.dev/develop/development-builds/introduction/)
rather than Expo Go (it includes native modules such as `react-native-svg` and
`expo-linear-gradient`). Install the development APK once, then connect it to
the Metro server — JS changes hot-reload instantly. Rebuild only when native
modules or app config change:

```bash
cd apps/mobile
pnpm exec eas build --profile development --platform android
```

## Android release builds

```bash
cd apps/mobile
pnpm exec eas build --profile preview --platform android      # installable .apk
pnpm exec eas build --profile production --platform android   # .aab for Play Store
```

EAS CLI is a dev dependency of `apps/mobile` — no global install needed.

## Database

Migrations live in `supabase/migrations`. Apply them with the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Every table uses Row Level Security — users only ever see their own inventory.
