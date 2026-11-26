import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The one Supabase client, or null when the project has not been configured.
 *
 * The env vars are inlined at build time (they must be written out in full for
 * Next to do that). Without them the site builds and runs exactly as the
 * static, read-only guide it was — every community feature checks
 * `communityEnabled` and hides itself.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const communityEnabled = Boolean(URL && ANON_KEY);

export const PHOTO_BUCKET = "lounge-photos";

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!communityEnabled || typeof window === "undefined") return null;
  client ??= createClient(URL!, ANON_KEY!, {
    auth: {
      // PKCE keeps the token out of the URL fragment; the `?code=` it returns
      // to is exchanged on load by detectSessionInUrl.
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}

/** Public CDN URL for a file in the photo bucket. */
export function photoUrl(path: string): string {
  return `${URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}
