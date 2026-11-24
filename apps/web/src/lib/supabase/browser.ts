"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "../env";

export function createBrowserSupabase() {
  const env = supabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.key);
}

export async function browserAccessToken() {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
