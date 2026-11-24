import { GatherlyClient } from "@gatherly/api-client";
import { apiBaseUrl } from "./env";
import { browserAccessToken } from "./supabase/browser";

export function browserApi() {
  return new GatherlyClient({ baseUrl: apiBaseUrl(), getToken: browserAccessToken });
}
