"use client";

import type { AiTone } from "@gatherly/shared";
import { Check, Copy, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { BackendError } from "@/lib/studio/backend";
import type { StudioContext } from "./studio";

export function aiErrorText(t: Dictionary, error: unknown) {
  const a = t.studio.ai;
  if (error instanceof BackendError) {
    if (error.code === "AI_LIMIT") return a.limit;
    if (error.code === "NO_ASSIGNMENT") return a.noAssignment;
    if (error.code === "FETCH_FAILED") return a.fetchFailed;
    if (error.code === "AI_UNAVAILABLE" || error.code === "UNAVAILABLE" || error.code === "NOT_CONFIGURED") return a.unavailable;
  }
  return t.common.error;
}

/** Runs an AI request with a busy flag and shows a readable error toast on failure. */
export function useAi(ctx: StudioContext) {
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <T,>(work: () => Promise<T>): Promise<T | null> => {
      setBusy(true);
      try {
        return await work();
      } catch (error) {
        ctx.notify(aiErrorText(ctx.t, error), "error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [ctx],
  );
  return { busy, run };
}

export function AiChip({ t }: { t: Dictionary }) {
  return <span className="ai-chip"><Sparkles size={11} /> {t.studio.ai.badge}</span>;
}

export function AiDemoNote({ ctx }: { ctx: StudioContext }) {
  if (ctx.backend.mode !== "demo") return null;
  return <p className="small faint" style={{ margin: 0 }}>{ctx.t.studio.ai.demoNote}</p>;
}

export function ToneSelect({ t, value, onChange }: { t: Dictionary; value: AiTone; onChange: (value: AiTone) => void }) {
  const st = t.studio.settings;
  return (
    <select
      className="input"
      value={value}
      onChange={(event) => onChange(event.target.value as AiTone)}
      style={{ minHeight: 36, width: "auto", padding: "0 12px", fontSize: 13 }}
      aria-label={st.tone}
    >
      {(["warm", "formal", "playful"] as const).map((tone) => <option key={tone} value={tone}>{st.tones[tone]}</option>)}
    </select>
  );
}

export function CopyButton({ ctx, text, label, small = true }: { ctx: StudioContext; text: string; label?: string; small?: boolean }) {
  const [done, setDone] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setDone(true);
    ctx.notify(ctx.t.studio.ai.copied);
    setTimeout(() => setDone(false), 1600);
  }
  return (
    <button className={`btn btn-secondary ${small ? "btn-sm" : ""}`} type="button" onClick={copy}>
      {done ? <Check size={14} /> : <Copy size={14} />} {label ?? ctx.t.studio.ai.copy}
    </button>
  );
}
