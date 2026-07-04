import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * False until the Supabase project exists and .env.local is filled in.
 * The UI degrades gracefully so the shell can be developed without a backend.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key",
);
