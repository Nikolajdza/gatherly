"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export type SessionUser = { id: string; email: string | null; name: string | null };

const AuthContext = createContext<SessionUser | null | undefined>(undefined);

function fromAuthUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
} | null): SessionUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const name =
    typeof meta.display_name === "string"
      ? meta.display_name
      : typeof meta.full_name === "string"
        ? meta.full_name
        : null;
  return { id: user.id, email: user.email ?? null, name };
}

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: SessionUser | null;
}) {
  const [user, setUser] = useState<SessionUser | null | undefined>(initialUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setUser(null);
      return;
    }

    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (alive) setUser(fromAuthUser(data.user));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(fromAuthUser(session?.user ?? null));
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => user, [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** `undefined` while hydrating without a server seed; otherwise user or null. */
export function useSessionUser() {
  return useContext(AuthContext);
}
