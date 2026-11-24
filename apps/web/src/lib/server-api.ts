import { GatherlyClient } from "@gatherly/api-client";
import type { ExperienceSummary, Profile } from "@gatherly/shared";
import { cache } from "react";
import { apiBaseUrl, supabaseEnv } from "./env";
import { serverAccessToken } from "./supabase/server";

export function serverApi() {
  return new GatherlyClient({ baseUrl: apiBaseUrl(), getToken: serverAccessToken });
}

export type Workspace =
  | { state: "not-configured" }
  | { state: "unavailable" }
  | { state: "ready"; profile: Profile | null; experiences: ExperienceSummary[] };

/** Loads everything the dashboard shell needs once per request. */
export const loadWorkspace = cache(async (): Promise<Workspace> => {
  if (!supabaseEnv()) return { state: "not-configured" };
  const client = serverApi();
  try {
    const [profile, experiences] = await Promise.all([
      client.profile.me().catch(() => null),
      client.experiences.list(),
    ]);
    return { state: "ready", profile, experiences: experiences.items };
  } catch {
    return { state: "unavailable" };
  }
});
