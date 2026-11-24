"use client";

import type { ChecklistSuggestion, TaskRecord, TaskTidyResult } from "@gatherly/shared";
import { CalendarDays, ListChecks, Loader2, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { formatDate } from "@/i18n/config";
import { AiChip, AiDemoNote, useAi } from "./ai-kit";
import type { StudioContext } from "./studio";

export function TasksTab({ ctx }: { ctx: StudioContext }) {
  const { t, backend, locale } = ctx;
  const k = t.studio.tasks;
  const [tasks, setTasks] = useState<TaskRecord[] | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<TaskRecord["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    backend.listTasks().then(setTasks).catch(ctx.fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend]);

  const categories = useMemo(() => [...new Set((tasks ?? []).map((task) => task.category).filter((value): value is string => Boolean(value)))], [tasks]);

  if (!tasks) return <div className="skeleton" style={{ height: 320 }} />;

  const shown = tasks.filter((task) => (filter === "all" || task.status === filter) && (!categoryFilter || task.category === categoryFilter));
  const done = tasks.filter((task) => task.status === "done").length;

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const created = await backend.createTask({ title: title.trim(), category: category.trim() || null, priority, dueDate: dueDate || null });
      setTasks((current) => [...(current ?? []), created]);
      setTitle("");
      setDueDate("");
    } catch (error) {
      ctx.fail(error);
    }
  }

  async function patch(task: TaskRecord, body: Partial<TaskRecord>) {
    setTasks((current) => (current ?? []).map((entry) => (entry.id === task.id ? { ...entry, ...body } : entry)));
    try {
      await backend.updateTask(task.id, {
        status: body.status,
        priority: body.priority,
      });
    } catch (error) {
      ctx.fail(error);
      setTasks(await backend.listTasks());
    }
  }

  async function remove(task: TaskRecord) {
    setTasks((current) => (current ?? []).filter((entry) => entry.id !== task.id));
    await backend.removeTask(task.id).catch(ctx.fail);
  }

  async function clearDone() {
    const completed = tasks?.filter((task) => task.status === "done") ?? [];
    setTasks((current) => (current ?? []).filter((task) => task.status !== "done"));
    await Promise.all(completed.map((task) => backend.removeTask(task.id))).catch(ctx.fail);
  }

  return (
    <div className="studio-grid">
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-pad stack" style={{ paddingBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            <div>
              <h2 className="serif h3">{k.title}</h2>
              <p className="muted small" style={{ margin: "4px 0 0" }}>{k.lede}</p>
            </div>
            <span className="badge badge-sage">{done}/{tasks.length}</span>
          </div>
          {ctx.canManage ? (
            <form className="stack-sm" onSubmit={add}>
              <div className="input-group">
                <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={k.placeholder} />
                <button className="btn btn-primary" type="submit" disabled={!title.trim()}><Plus size={16} /> {k.add}</button>
              </div>
              <div className="input-group" style={{ flexWrap: "wrap" }}>
                <input className="input" list="task-categories" value={category} onChange={(event) => setCategory(event.target.value)} placeholder={k.category} style={{ flex: 1, minWidth: 140 }} />
                <datalist id="task-categories">{categories.map((value) => <option key={value} value={value} />)}</datalist>
                <select className="input" value={priority} onChange={(event) => setPriority(event.target.value as TaskRecord["priority"])} style={{ flex: "0 1 170px" }}>
                  {(["high", "medium", "low"] as const).map((value) => <option key={value} value={value}>{k.priority[value]}</option>)}
                </select>
                <input className="input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} style={{ flex: "0 1 170px" }} aria-label={k.due} />
              </div>
            </form>
          ) : null}
          <div className="row" style={{ flexWrap: "wrap" }}>
            <div className="segmented" role="group">
              {(["all", "open", "done"] as const).map((value) => (
                <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
                  {value === "all" ? k.filterAll : value === "open" ? k.filterOpen : k.filterDone}
                </button>
              ))}
            </div>
            {done > 0 && ctx.canManage ? <button className="btn btn-ghost btn-sm" type="button" onClick={clearDone}>{k.clearDone}</button> : null}
          </div>
        </div>
        <div className="list" style={{ borderTop: "1px solid var(--line)" }}>
          {shown.map((task) => (
            <div className={`task ${task.status === "done" ? "done" : ""}`} key={task.id}>
              <input
                className="task-check"
                type="checkbox"
                checked={task.status === "done"}
                onChange={() => patch(task, { status: task.status === "done" ? "open" : "done" })}
                aria-label={task.title}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="task-title">{task.title}</div>
                <div className="row-start small faint" style={{ gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                  <span><i className={`prio ${task.priority}`} /> {k.priority[task.priority]}</span>
                  {task.dueDate ? <span><CalendarDays size={12} /> {formatDate(locale, task.dueDate, "short")}</span> : null}
                </div>
              </div>
              {task.category ? <span className="badge hide-sm">{task.category}</span> : null}
              {ctx.canManage ? <button className="icon-btn danger" type="button" onClick={() => remove(task)} aria-label={t.common.delete}><Trash2 size={15} /></button> : null}
            </div>
          ))}
          {shown.length === 0 ? (
            <div className="empty"><span className="icon-chip sage"><ListChecks size={26} /></span><p>{k.empty}</p></div>
          ) : null}
        </div>
      </div>

      <div className="stack">
        {ctx.canManage ? <TaskAi ctx={ctx} tasks={tasks} setTasks={setTasks} /> : null}
        <div className="card card-pad">
          <h3 className="h4" style={{ margin: "0 0 12px" }}>{k.progress}</h3>
          <div className="stat-value">{tasks.length ? Math.round((done / tasks.length) * 100) : 0}%</div>
          <div className="progress sage" style={{ marginTop: 14, height: 10 }}><span style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} /></div>
        </div>
        {categories.length ? (
          <div className="card card-pad stack-sm">
            <h3 className="h4" style={{ margin: "0 0 6px" }}>{k.category}</h3>
            <button type="button" className={`side-link`} style={{ color: !categoryFilter ? "var(--ink)" : "var(--soft)", background: !categoryFilter ? "var(--paper)" : undefined }} onClick={() => setCategoryFilter(null)}>{k.filterAll} <span className="faint" style={{ marginLeft: "auto" }}>{tasks.length}</span></button>
            {categories.map((value) => {
              const list = tasks.filter((task) => task.category === value);
              const finished = list.filter((task) => task.status === "done").length;
              return (
                <button key={value} type="button" className="side-link" style={{ color: categoryFilter === value ? "var(--ink)" : "var(--soft)", background: categoryFilter === value ? "var(--paper)" : undefined }} onClick={() => setCategoryFilter(value)}>
                  {value}<span className="faint" style={{ marginLeft: "auto" }}>{finished}/{list.length}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TaskAi({ ctx, tasks, setTasks }: { ctx: StudioContext; tasks: TaskRecord[]; setTasks: (tasks: TaskRecord[]) => void }) {
  const { t, backend, locale } = ctx;
  const a = t.studio.ai;
  const k = t.studio.tasks;
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<ChecklistSuggestion[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [tidy, setTidy] = useState<TaskTidyResult | null>(null);
  const [applying, setApplying] = useState(false);
  const plan = useAi(ctx);
  const tidyAi = useAi(ctx);
  const byId = new Map(tasks.map((task) => [task.id, task]));

  async function makePlan(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) return;
    const result = await plan.run(() => backend.checklist(prompt.trim(), locale));
    if (!result) return;
    setSuggestions(result);
    setPicked(new Set(result.map((_, index) => index)));
  }

  async function addPlan() {
    if (!suggestions) return;
    setApplying(true);
    try {
      for (const [index, item] of suggestions.entries()) {
        if (!picked.has(index)) continue;
        await backend.createTask({ title: item.title, category: item.category, priority: item.priority, dueDate: item.dueDate });
      }
      setTasks(await backend.listTasks());
      setSuggestions(null);
      setPrompt("");
      ctx.notify(a.added);
    } catch (error) {
      ctx.fail(error);
    } finally {
      setApplying(false);
    }
  }

  async function runTidy() {
    const result = await tidyAi.run(() => backend.tidyTasks(locale));
    if (!result) return;
    if (!result.categories.length && !result.duplicateIds.length) {
      ctx.notify(a.tidyNothing);
      return;
    }
    setTidy(result);
  }

  async function applyTidy() {
    if (!tidy) return;
    setApplying(true);
    try {
      for (const entry of tidy.categories) await backend.updateTask(entry.taskId, { category: entry.category });
      for (const id of tidy.duplicateIds) await backend.removeTask(id);
      setTasks(await backend.listTasks());
      setTidy(null);
      ctx.notify(a.applied);
    } catch (error) {
      ctx.fail(error);
    } finally {
      setApplying(false);
    }
  }

  function toggle(index: number) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <>
      <form className="card card-pad stack ai-card" onSubmit={makePlan}>
        <div className="card-title">
          <span className="icon-chip sage"><Wand2 size={20} /></span>
          <AiChip t={t} />
        </div>
        <div>
          <h3 className="h4" style={{ margin: 0 }}>{a.planTitle}</h3>
          <p className="muted small" style={{ margin: "6px 0 0", lineHeight: 1.55 }}>{a.planLede}</p>
        </div>
        <label className="field">
          <span className="sr-only">{a.planTitle}</span>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={a.planPlaceholder} style={{ minHeight: 80 }} maxLength={400} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={plan.busy || !prompt.trim()}>
          {plan.busy ? <><Loader2 size={16} className="spin" /> {a.working}</> : <><Sparkles size={16} /> {a.planButton}</>}
        </button>
        {tasks.length > 1 ? (
          <button className="btn btn-secondary" type="button" onClick={runTidy} disabled={tidyAi.busy}>
            {tidyAi.busy ? <><Loader2 size={16} className="spin" /> {a.working}</> : <><Wand2 size={16} /> {a.tidyButton}</>}
          </button>
        ) : null}
        <AiDemoNote ctx={ctx} />
      </form>

      <Sheet
        open={suggestions !== null}
        title={a.planSheet}
        onClose={() => setSuggestions(null)}
        closeLabel={t.common.close}
        footer={
          <>
            <button className="btn btn-secondary" type="button" onClick={() => setSuggestions(null)}>{t.common.cancel}</button>
            <button className="btn btn-primary" type="button" disabled={applying || picked.size === 0} onClick={addPlan}>
              {applying ? t.common.loading : <><Plus size={16} /> {a.addSelected} ({picked.size})</>}
            </button>
          </>
        }
      >
        {suggestions?.length === 0 ? <p className="muted">{a.none}</p> : null}
        <div className="ai-pick-list">
          {suggestions?.map((item, index) => (
            <label className="ai-pick" key={`${item.title}-${index}`}>
              <input type="checkbox" checked={picked.has(index)} onChange={() => toggle(index)} />
              <span className="ai-pick-body">
                <span className="ai-pick-title">{item.title}</span>
                <span className="ai-pick-meta">
                  {item.category ? <span className="badge">{item.category}</span> : null}
                  <span className="badge badge-outline"><i className={`prio ${item.priority}`} /> {k.priority[item.priority]}</span>
                  {item.dueDate ? <span className="badge badge-outline"><CalendarDays size={12} /> {formatDate(locale, item.dueDate, "short")}</span> : null}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Sheet>

      <Sheet
        open={tidy !== null}
        title={a.tidyTitle}
        onClose={() => setTidy(null)}
        closeLabel={t.common.close}
        footer={
          <>
            <button className="btn btn-secondary" type="button" onClick={() => setTidy(null)}>{t.common.cancel}</button>
            <button className="btn btn-primary" type="button" disabled={applying} onClick={applyTidy}>{applying ? t.common.loading : a.tidyApply}</button>
          </>
        }
      >
        {tidy?.categories.length ? (
          <div className="stack-sm">
            <strong>{a.tidyCategories}</strong>
            {tidy.categories.map((entry) => (
              <div className="row" key={entry.taskId} style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 12, background: "#fff" }}>
                <span className="small">{byId.get(entry.taskId)?.title}</span>
                <span className="badge">{entry.category}</span>
              </div>
            ))}
          </div>
        ) : null}
        {tidy?.duplicateIds.length ? (
          <div className="stack-sm">
            <strong>{a.tidyDuplicates}</strong>
            {tidy.duplicateIds.map((id) => (
              <div className="row-start small" key={id} style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 12, background: "#fff" }}>
                <Trash2 size={14} style={{ color: "var(--danger)" }} /> <s>{byId.get(id)?.title}</s>
              </div>
            ))}
          </div>
        ) : null}
      </Sheet>
    </>
  );
}
