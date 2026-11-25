"use client";

import type { NotificationRecord } from "@gatherly/shared";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { browserApi } from "@/lib/api";

export function NotificationBell({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((item) => !item.readAt).length;

  useEffect(() => {
    let cancelled = false;
    browserApi()
      .notifications.list()
      .then((result) => {
        if (!cancelled) setItems(result.items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function mark(id: string) {
    try {
      const updated = await browserApi().notifications.read(id);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch {
      // ignore
    }
  }

  function label(item: NotificationRecord) {
    if (item.type === "reservation_created") return t.notifications.reservation;
    if (item.type === "draw_completed") return t.notifications.draw;
    if (item.type === "invitation_accepted") return t.notifications.inviteAccepted;
    return t.notifications.generic;
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn btn-secondary btn-icon"
        type="button"
        aria-label={t.notifications.title}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={17} />
        {unread ? (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--wine, #7a3040)",
            }}
          />
        ) : null}
      </button>
      {open ? (
        <div
          className="card"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 320,
            maxHeight: 360,
            overflow: "auto",
            zIndex: 40,
            boxShadow: "0 18px 40px rgba(20,40,30,.16)",
          }}
        >
          <div className="card-pad" style={{ borderBottom: "1px solid var(--line)" }}>
            <strong>{t.notifications.title}</strong>
          </div>
          {items.length === 0 ? (
            <p className="muted small card-pad" style={{ margin: 0 }}>{t.notifications.empty}</p>
          ) : (
            <div className="list">
              {items.slice(0, 12).map((item) => {
                const experienceId =
                  typeof item.payload.experienceId === "string" ? item.payload.experienceId : null;
                return (
                  <div key={item.id} className="list-row" style={{ opacity: item.readAt ? 0.65 : 1 }}>
                    <div className="grow">
                      <div className="title" style={{ fontSize: 14 }}>{label(item)}</div>
                      {experienceId ? (
                        <Link
                          className="small"
                          href={`/${locale}/dashboard/experiences/${experienceId}`}
                          onClick={() => {
                            void mark(item.id);
                            setOpen(false);
                          }}
                        >
                          {t.notifications.open}
                        </Link>
                      ) : null}
                    </div>
                    {!item.readAt ? (
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => mark(item.id)}>
                        {t.notifications.markRead}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
