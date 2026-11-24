"use client";

import type { SecretSantaView, TaskRecord } from "@gatherly/shared";
import { ArrowRight, CalendarDays, Check, Circle, Gift, ListChecks, Lock, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate, formatPrice } from "@/i18n/config";
import type { StudioContext } from "./studio";

function daysUntil(date: string | null) {
  if (!date) return null;
  const target = new Date(`${date}T12:00:00`).getTime();
  return Math.ceil((target - Date.now()) / 86_400_000);
}

function Stat({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="card stat">
      <div className="stat-top">{label}<span className="icon-chip" style={{ width: 34, height: 34, borderRadius: 11 }}>{icon}</span></div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}

export function OverviewTab({ ctx }: { ctx: StudioContext }) {
  const { t, experience, locale, backend } = ctx;
  const o = t.studio.overview;
  const [santa, setSanta] = useState<SecretSantaView | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);

  useEffect(() => {
    if (experience.type === "secret_santa") backend.getSanta().then(setSanta).catch(() => undefined);
    if (experience.type === "task_list") backend.listTasks().then(setTasks).catch(() => undefined);
  }, [backend, experience.type]);

  const days = daysUntil(experience.eventDate);
  const dateStat = (
    <Stat
      label={o.eventIn}
      icon={<CalendarDays size={16} />}
      value={days === null ? "—" : days < 0 ? "✓" : days}
      sub={days === null ? o.noDate : days < 0 ? o.eventPassed : `${o.days} · ${formatDate(locale, experience.eventDate)}`}
    />
  );

  const items = experience.items;
  const reserved = items.filter((item) => item.reserved).length;
  const value = items.reduce((sum, item) => sum + (item.priceCents ?? 0), 0);
  const percent = items.length ? Math.round((reserved / items.length) * 100) : 0;
  const hasCover = Boolean(experience.coverImageUrl) || (experience.themeConfig as { preset?: string }).preset === "custom";

  const steps =
    experience.type === "gift_registry"
      ? [
          { done: items.length >= 5, label: o.stepGifts, tab: "gifts" as const },
          { done: hasCover, label: o.stepDesign, tab: "design" as const },
          { done: experience.status === "active", label: o.stepPublish, tab: "settings" as const },
          { done: reserved > 0, label: o.stepShare, tab: "share" as const },
        ]
      : [
          { done: hasCover, label: o.stepDesign, tab: "design" as const },
          { done: experience.status === "active", label: o.stepPublish, tab: "settings" as const },
          { done: experience.memberCount > 1, label: o.stepShare, tab: "share" as const },
        ];

  const doneTasks = tasks.filter((task) => task.status === "done").length;

  return (
    <div className="stack-lg">
      <div className="stat-grid">
        {experience.type === "gift_registry" ? (
          <>
            <Stat label={o.items} icon={<Gift size={16} />} value={items.length} sub={`${items.length - reserved} ${o.available.toLowerCase()}`} />
            <Stat label={o.reserved} icon={<Check size={16} />} value={reserved} sub={`${percent}%`} />
            <Stat label={o.value} icon={<Wallet size={16} />} value={<span style={{ fontSize: 34 }}>{formatPrice(locale, value, items[0]?.currency ?? "EUR") || "—"}</span>} />
            {dateStat}
          </>
        ) : experience.type === "secret_santa" ? (
          <>
            <Stat label={o.participants} icon={<Users size={16} />} value={santa?.participants.length ?? "—"} />
            <Stat label={o.drawStatus} icon={<Lock size={16} />} value={<span style={{ fontSize: 30 }}>{santa ? t.studio.santa.status[santa.status] : "—"}</span>} />
            <Stat label={t.studio.santa.budget} icon={<Wallet size={16} />} value={<span style={{ fontSize: 34 }}>{santa?.budgetCents ? formatPrice(locale, santa.budgetCents, santa.currency) : "—"}</span>} />
            {dateStat}
          </>
        ) : (
          <>
            <Stat label={o.tasksOpen} icon={<Circle size={16} />} value={tasks.length - doneTasks} />
            <Stat label={o.tasksDone} icon={<Check size={16} />} value={doneTasks} sub={tasks.length ? `${Math.round((doneTasks / tasks.length) * 100)}%` : undefined} />
            <Stat label={o.members} icon={<Users size={16} />} value={experience.memberCount} />
            {dateStat}
          </>
        )}
      </div>

      <div className="studio-grid">
        <div className="stack">
          {experience.type === "gift_registry" ? (
            <div className="card card-pad">
              <div className="card-title"><h3 className="h4">{o.progress}</h3><span className="badge badge-wine">{reserved}/{items.length}</span></div>
              <div className="progress" style={{ height: 12 }}><span style={{ width: `${percent}%` }} /></div>
              <div className="divider" />
              <div className="card-title" style={{ marginBottom: 8 }}><h3 className="h4">{o.recent}</h3>
                <button className="link small" type="button" onClick={() => ctx.goTo("gifts")}>{t.studio.tabs.gifts} <ArrowRight size={14} /></button>
              </div>
              <div className="list">
                {[...items].sort((a, b) => (a.priority === "high" ? -1 : 0) - (b.priority === "high" ? -1 : 0)).slice(0, 4).map((item) => (
                  <div className="list-row" key={item.id} style={{ paddingInline: 0 }}>
                    <div className="thumb" style={{ width: 44, height: 44 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <Gift size={18} />}
                    </div>
                    <div className="grow">
                      <div className="title">{item.title}</div>
                      <div className="sub">{formatPrice(locale, item.priceCents, item.currency)}{item.category ? <span>{item.category}</span> : null}</div>
                    </div>
                    <span className={`badge ${item.reserved ? "badge-sage" : ""}`}>{item.reserved ? t.studio.gifts.reservedBadge : t.studio.gifts.availableBadge}</span>
                  </div>
                ))}
                {items.length === 0 ? <p className="muted">{t.studio.gifts.emptyText}</p> : null}
              </div>
            </div>
          ) : null}
          {experience.type === "task_list" ? (
            <div className="card card-pad">
              <div className="card-title"><h3 className="h4">{t.studio.tasks.progress}</h3><span className="badge badge-sage">{doneTasks}/{tasks.length}</span></div>
              <div className="progress sage" style={{ height: 12 }}><span style={{ width: `${tasks.length ? (doneTasks / tasks.length) * 100 : 0}%` }} /></div>
              <div className="list" style={{ marginTop: 14 }}>
                {tasks.filter((task) => task.status === "open").slice(0, 5).map((task) => (
                  <div className="task" key={task.id} style={{ paddingInline: 0 }}>
                    <span className={`prio ${task.priority}`} style={{ marginTop: 8 }} />
                    <div style={{ flex: 1 }}><div className="task-title">{task.title}</div>{task.dueDate ? <span className="small faint">{t.studio.tasks.due} {formatDate(locale, task.dueDate, "short")}</span> : null}</div>
                    {task.category ? <span className="badge">{task.category}</span> : null}
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} type="button" onClick={() => ctx.goTo("tasks")}><ListChecks size={16} /> {t.studio.tabs.tasks}</button>
            </div>
          ) : null}
          {experience.type === "secret_santa" && santa ? (
            <div className="card card-pad">
              <div className="card-title"><h3 className="h4">{o.participants}</h3><span className="badge">{santa.participants.length}</span></div>
              <div className="row-start" style={{ flexWrap: "wrap", gap: 8 }}>
                {santa.participants.map((participant) => (
                  <span className="badge badge-outline" key={participant.id} style={{ padding: "8px 12px" }}>
                    <span className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>{participant.displayName.slice(0, 1)}</span>
                    {participant.displayName}
                  </span>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 18 }} type="button" onClick={() => ctx.goTo("santa")}>{t.studio.tabs.santa} <ArrowRight size={14} /></button>
            </div>
          ) : null}
        </div>

        {ctx.canManage ? (
          <div className="card card-pad">
            <div className="card-title"><h3 className="h4">{o.nextSteps}</h3><span className="small faint">{steps.filter((step) => step.done).length}/{steps.length}</span></div>
            <div className="stack-sm">
              {steps.map((step) => (
                <button
                  key={step.label}
                  type="button"
                  className="list-row"
                  onClick={() => ctx.goTo(step.tab)}
                  style={{ border: "1px solid var(--line)", borderRadius: 14, background: step.done ? "var(--sage-soft)" : "#fff", textAlign: "left", width: "100%" }}
                >
                  <span className="icon-chip" style={{ width: 28, height: 28, borderRadius: 9, background: step.done ? "var(--sage)" : undefined, color: step.done ? "#fff" : undefined }}>
                    {step.done ? <Check size={14} /> : <Circle size={12} />}
                  </span>
                  <span className="grow" style={{ fontWeight: 650, textDecoration: step.done ? "line-through" : undefined, color: step.done ? "var(--faint)" : undefined }}>{step.label}</span>
                  <ArrowRight size={15} className="faint" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
