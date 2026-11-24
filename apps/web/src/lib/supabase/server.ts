import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "../env";

export async function createServerSupabase() {
  const env = supabaseEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the session.
        }
      },
    },
  });
}

export async function serverUser() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const meta = data.user.user_metadata ?? {};
  const name =
    typeof meta.display_name === "string"
      ? meta.display_name
      : typeof meta.full_name === "string"
        ? meta.full_name
        : null;
  return { id: data.user.id, email: data.user.email ?? null, name };
}

export async function serverAccessToken() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
