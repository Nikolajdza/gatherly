"use client";

import { Check, Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { localeCookie, localeNames, locales, type Locale } from "@/i18n/config";

export function LanguageMenu({
  locale,
  label,
  tone = "light",
  direction = "down",
}: {
  locale: Locale;
  label: string;
  tone?: "light" | "dark";
  direction?: "down" | "up";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function hrefFor(target: Locale) {
    const parts = (pathname || "/").split("/");
    parts[1] = target;
    return parts.join("/") || `/${target}`;
  }

  return (
    <div className="lang" ref={ref}>
      <button
        type="button"
        className={`lang-trigger ${tone === "dark" ? "on-dark" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={18} strokeWidth={1.8} />
        <span>{locale.toUpperCase()}</span>
      </button>
      {open ? (
        <div className={`lang-menu ${direction === "up" ? "up" : ""}`} role="menu">
          {locales.map((item) => (
            <a
              key={item}
              role="menuitem"
              href={hrefFor(item)}
              hrefLang={item}
              aria-current={item === locale ? "true" : undefined}
              onClick={() => {
                document.cookie = `${localeCookie}=${item}; path=/; max-age=31536000; samesite=lax`;
              }}
            >
              <span>{localeNames[item]}</span>
              {item === locale ? <Check size={16} /> : <span className="lang-code">{item.toUpperCase()}</span>}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
