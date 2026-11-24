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
  const claims = await supabase.auth.getClaims();
  const sub = claims.data?.claims.sub;
  if (claims.error || !sub) return null;
  const email = typeof claims.data?.claims.email === "string" ? claims.data.claims.email : null;
  return { id: sub, email };
}

export async function serverAccessToken() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const claims = await supabase.auth.getClaims();
  if (claims.error || !claims.data) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
