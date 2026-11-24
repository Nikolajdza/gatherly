"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().email(),
  password: z.string().optional(),
});

type Values = z.infer<typeof schema>;

function safeNext(value: string | null, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function AuthForm({
  mode,
  locale,
  dictionary,
}: {
  mode: "login" | "register" | "forgot";
  locale: Locale;
  dictionary: Dictionary;
}) {
  const t = dictionary.auth;
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema) });
  const supabase = createBrowserSupabase();

  async function onSubmit(values: Values) {
    setError(null);
    setMessage(null);
    if (!supabase) {
      setError(t.missingSupabase);
      return;
    }
    if (mode !== "forgot" && (values.password?.length ?? 0) < 8) {
      setError(t.passwordShort);
      return;
    }
    if (mode === "register" && !values.name?.trim()) {
      setError(t.nameRequired);
      return;
    }
    if (mode === "forgot") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/dashboard/settings`,
      });
      if (resetError) setError(resetError.message);
      else setMessage(t.checkEmail);
      return;
    }
    const password = values.password ?? "";
    if (mode === "register") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password,
        options: {
          data: { full_name: values.name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/${locale}/dashboard`,
        },
      });
      if (signUpError) setError(signUpError.message);
      else setMessage(t.checkEmail);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: values.email, password });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push(safeNext(search.get("next"), `/${locale}/dashboard`));
    router.refresh();
  }

  const title = mode === "login" ? t.loginTitle : mode === "register" ? t.registerTitle : t.forgotTitle;
  const lede = mode === "login" ? t.loginLede : mode === "register" ? t.registerLede : t.forgotLede;
  return (
    <form className="auth-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="stack-sm">
        <h1 className="serif">{title}</h1>
        <p className="muted" style={{ margin: 0, fontSize: 17 }}>{lede}</p>
      </div>
      {!supabase ? (
        <div className="notice wine">
          {t.missingSupabase}{" "}
          <Link className="link" href={`/${locale}/demo`} style={{ whiteSpace: "nowrap" }}>{t.tryDemo} <ArrowRight size={14} /></Link>
        </div>
      ) : null}
      {mode === "register" ? (
        <label className="field">{t.name}<input autoComplete="name" {...form.register("name")} /></label>
      ) : null}
      <label className="field">
        {t.email}
        <input type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email ? <span className="form-error">{dictionary.common.required}</span> : null}
      </label>
      {mode !== "forgot" ? (
        <label className="field">
          <span className="row">
            {t.password}
            {mode === "login" ? <Link className="link small" href={`/${locale}/forgot-password`}>{t.forgot}</Link> : null}
          </span>
          <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...form.register("password")} />
          {mode === "register" ? <span className="field-hint">{t.passwordShort}</span> : null}
        </label>
      ) : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {message ? <p className="notice sage">{message}</p> : null}
      <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={form.formState.isSubmitting}>
        {mode === "login" ? t.submitLogin : mode === "register" ? t.submitRegister : t.submitForgot}
      </button>
      <p className="muted small" style={{ margin: 0, textAlign: "center" }}>
        {mode === "login" ? (
          <>{t.noAccount} <Link className="link" href={`/${locale}/register`}>{dictionary.nav.signup}</Link></>
        ) : (
          <>{t.hasAccount} <Link className="link" href={`/${locale}/login`}>{dictionary.nav.login}</Link></>
        )}
      </p>
      <div className="divider" />
      <Link className="btn btn-secondary btn-block" href={`/${locale}/demo`}><Sparkles size={16} /> {t.tryDemo}</Link>
    </form>
  );
}
