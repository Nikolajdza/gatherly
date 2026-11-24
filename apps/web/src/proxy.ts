import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, localeCookie, locales } from "./i18n/config";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/auth") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return (await refresh(request)).response;
  }

  const segment = pathname.split("/")[1] ?? "";
  if (!isLocale(segment)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const session = await refresh(request);
  const isApp = pathname.includes("/dashboard");
  if (isApp && !session.userId && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const url = request.nextUrl.clone();
    url.pathname = `/${segment}/login`;
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    session.response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  const isAuthPage = pathname === `/${segment}/login` || pathname === `/${segment}/register`;
  if (isAuthPage && session.userId) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next");
    url.pathname = next && next.startsWith(`/${segment}/`) ? next : `/${segment}/dashboard`;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    session.response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return session.response;
}

async function refresh(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { response, userId: null as string | null };

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Prefer getUser() so the JWT is validated and cookies stay in sync on Vercel.
  const { data } = await supabase.auth.getUser();
  return { response, userId: data.user?.id ?? null };
}

function preferredLocale(request: NextRequest) {
  const saved = request.cookies.get(localeCookie)?.value;
  if (saved && isLocale(saved)) return saved;
  const tags = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag = "", q] = part.trim().split(";q=");
      return { primary: tag.split("-")[0]?.toLowerCase() ?? "", weight: q ? Number(q) : 1 };
    })
    .filter((entry) => entry.primary && !Number.isNaN(entry.weight))
    .sort((a, b) => b.weight - a.weight);
  const match = tags.find((entry) => (locales as readonly string[]).includes(entry.primary));
  return match && isLocale(match.primary) ? match.primary : defaultLocale;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
