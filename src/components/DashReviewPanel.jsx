// src/components/DashReviewPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, NotebookPen, Plus, Target, Trash2, Edit3,
  Wand2, Save, Copy, ListChecks, CalendarDays, Sparkles,
  GripVertical, Clock3, Settings2, RotateCcw
} from "lucide-react";

/*
  DashReviewPanel.jsx — Design V2 (mobile-first fix)
  - Mobile: auto height cards (no forced heights)
  - xl+: fixed heights keep columns visually even
  - All JSX attributes use plain strings
*/

const LS_KEY = (date) => "ztrader.review:" + date;

export default function DashReviewPanel({
  date = dayjs().format("YYYY-MM-DD"),
  trades = [],
}) {
  // per-day state (localStorage)
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState([]); // { id, ts, text }
  const [items, setItems] = useState([]);     // { id, text, done }
  const [levels, setLevels] = useState([]);   // [ "ONH 18950", ... ]
  const [session, setSession] = useState("New York");

  // hydrate
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY(date));
    if (!raw) {
      setNotes(""); setEntries([]); setItems(defaultChecklist());
      setLevels([]); setSession("New York"); return;
    }
    try {
      const parsed = JSON.parse(raw);
      setNotes(parsed.notes || "");
      setEntries(parsed.entries || []);
      setItems(parsed.items || defaultChecklist());
      setLevels(parsed.levels || []);
      setSession(parsed.session || "New York");
    } catch {
      setNotes(""); setEntries([]); setItems(defaultChecklist());
      setLevels([]); setSession("New York");
    }
  }, [date]);

  // autosave
  useEffect(() => {
    localStorage.setItem(
      LS_KEY(date),
      JSON.stringify({ notes, entries, items, levels, session })
    );
  }, [date, notes, entries, items, levels, session]);

  // derived
  const numbers = useMemo(() => buildNumbers(date, trades), [date, trades]);

  // Heights: auto on mobile; fixed only at xl+
  const H = {
    target:   "xl:h-[240px] 2xl:h-[260px]",
    yesterday:"xl:h-[200px] 2xl:h-[220px]",
    levels:   "xl:h-[230px] 2xl:h-[250px]",
    think:    "xl:h-[400px] 2xl:h-[460px]",
    notes:    "xl:h-[300px] 2xl:h-[340px]",
    checklist:"xl:h-[520px] 2xl:h-[580px]",
    templates:"xl:h-[220px] 2xl:h-[250px]",
  };

  const clearDay = () => {
    localStorage.removeItem(LS_KEY(date));
    setNotes(""); setEntries([]); setItems(defaultChecklist()); setLevels([]);
  };

  return (
    <div className="w-full grid grid-cols-12 gap-4 sm:gap-5 xl:gap-6 2xl:gap-7">
      {/* Toolbar */}
      <div className="col-span-12">
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200">
                <Clock3 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm text-zinc-400">
                  {dayjs(date).format("dddd, MMM D")}
                </div>
                <div className="text-lg font-semibold text-zinc-100">
                  {session} Session
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {["Asia", "London", "New York"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSession(s)}
                  className={[
                    "px-3 py-1.5 rounded-lg text-sm border transition",
                    session === s
                      ? "bg-emerald-500 text-zinc-900 border-emerald-400"
                      : "bg-zinc-800/70 text-zinc-300 border-zinc-700 hover:bg-zinc-800",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
              <div className="w-px h-6 bg-zinc-800 mx-1" />
              <GhostButton
                onClick={() =>
                  copyToClipboard(
                    renderJournalExport({ date, notes, entries, items, levels, session })
                  )
                }
              >
                <Copy className="w-4 h-4 mr-1" /> Export Day
              </GhostButton>
              <GhostButton onClick={clearDay}>
                <RotateCcw className="w-4 h-4 mr-1" /> Reset Day
              </GhostButton>
            </div>
          </div>
        </Card>
      </div>

      {/* LEFT */}
      <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 xl:gap-6">
        <Card className={"p-5 " + H.target}>
          <Header
            icon={<Target className="w-4 h-4" />}
            title="Daily Target"
            subtitle={dayjs(date).format("dddd, MMM D")}
          />
          {/* Mobile = auto; xl+ fills card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:h-[calc(100%-2.5rem)]">
            <div className="md:col-span-2 flex flex-col justify-center">
              <TargetProgress target={numbers.target} achieved={numbers.todayPnl} />
              <div className="grid grid-cols-3 gap-3 mt-4">
                <MiniStat
                  label="Today P&L"
                  value={fmtMoney(numbers.todayPnl)}
                  accent={numbers.todayPnl >= 0 ? "text-green-400" : "text-red-400"}
                />
                <MiniStat label="Trades" value={String(numbers.todayTrades)} />
                <MiniStat
                  label="Hit?"
                  value={numbers.todayPnl >= numbers.target ? "Yes" : "No"}
                  accent={numbers.todayPnl >= numbers.target ? "text-green-400" : "text-zinc-300"}
                />
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <RadialGauge
                value={Math.max(0, Math.min(100,
                  Math.round((numbers.todayPnl / (numbers.target || 1)) * 100)
                ))}
              />
            </div>
          </div>
        </Card>

        <Card className={"p-5 " + H.yesterday}>
          <Header
            icon={<CalendarDays className="w-4 h-4" />}
            title="Yesterday Snapshot"
            subtitle={dayjs(date).subtract(1, "day").format("dddd, MMM D")}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat
              label="P&L"
              value={fmtMoney(numbers.yesterday.pnl)}
              accent={numbers.yesterday.pnl >= 0 ? "text-green-400" : "text-red-400"}
            />
            <MiniStat label="Win %" value={String(numbers.yesterday.winRate) + "%"} />
            <MiniStat label="Best" value={fmtMoney(numbers.yesterday.best)} />
            <MiniStat label="#" value={String(numbers.yesterday.count)} />
          </div>
        </Card>

        <Card className={"p-5 " + H.levels}>
          <Header
            icon={<Settings2 className="w-4 h-4" />}
            title="Key Levels"
            subtitle="ONH / ONL / IB / HTF Zones"
          />
          <KeyLevels levels={levels} setLevels={setLevels} />
        </Card>
      </div>

      {/* MIDDLE */}
      <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 xl:gap-6">
        <Card className={"p-5 " + H.think}>
          <div className="flex flex-col h-full">
            <Header
              icon={<NotebookPen className="w-4 h-4" />}
              title="Think Out Loud"
              subtitle="Timestamped quick notes while you trade"
            />
            <QuickComposer
              onAdd={(text) => setEntries((p) => [{ id: uid(), ts: Date.now(), text }, ...p])}
            />
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
              <EntryList
                entries={entries}
                onEdit={(id, text) =>
                  setEntries((p) => p.map((e) => (e.id === id ? { ...e, text } : e)))
                }
                onDelete={(id) => setEntries((p) => p.filter((e) => e.id !== id))}
              />
            </div>
            <div className="pt-3 mt-3 border-t border-zinc-800 flex flex-wrap gap-2">
              <GhostButton
                onClick={() =>
                  copyToClipboard(
                    renderJournalExport({ date, notes, entries, items, levels, session })
                  )
                }
              >
                <Copy className="w-4 h-4 mr-1" /> Copy Export
              </GhostButton>
              <GhostButton
                onClick={() => setNotes((n) => n + (n ? "\n\n" : "") + smartTemplate(date, session))}
              >
                <Wand2 className="w-4 h-4 mr-1" /> Insert Killzone Plan
              </GhostButton>
            </div>
          </div>
        </Card>

        <Card className={"p-5 " + H.notes}>
          <div className="flex flex-col h-full">
            <Header
              icon={<NotebookPen className="w-4 h-4" />}
              title="Daily Notes"
              subtitle="Markdown friendly"
            />
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <NotesEditor value={notes} onChange={setNotes} />
            </div>
          </div>
        </Card>
      </div>

      {/* RIGHT */}
      <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 xl:gap-6">
        <Card className={"p-5 " + H.checklist}>
          <div className="flex flex-col h-full">
            <Header
              icon={<ListChecks className="w-4 h-4" />}
              title="Execution Checklist"
              subtitle="Tap to toggle. Drag to reorder."
            />
            <ChecklistHeader items={items} />
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
              <ChecklistList items={items} setItems={setItems} />
            </div>
            <ChecklistComposer items={items} setItems={setItems} />
          </div>
        </Card>

        <Card className={"p-5 " + H.templates}>
          <div className="flex flex-col h-full">
            <Header
              icon={<Sparkles className="w-4 h-4" />}
              title="Templates"
              subtitle="One-tap planning snippets"
            />
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
              <Templates onPick={(t) => setNotes((n) => (n ? n + "\n\n" + t : t))} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================
   UI Primitives
============================ */
function Card({ className, children }) {
  return (
    <div className={
      "bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.35)] " +
      (className || "")
    }>
      {children}
    </div>
  );
}

function Header({ icon, title, subtitle }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200">
          {icon}
        </div>
        <div>
          <h3 className="text-white font-semibold leading-tight">{title}</h3>
          {subtitle ? <p className="text-xs text-zinc-400">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="p-3 rounded-xl bg-zinc-800/70 border border-zinc-700/70">
      <div className="text-[11px] text-zinc-400 mb-1">{label}</div>
      <div className={"text-lg font-bold tabular-nums " + (accent || "text-zinc-200")}>
        {value}
      </div>
    </div>
  );
}

function GhostButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-3 py-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm transition shadow-inner"
    >
      {children}
    </button>
  );
}

/* ============================
   Target Progress + Gauge
============================ */
function TargetProgress({ target = 500, achieved = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round((achieved / (target || 1)) * 100)));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Target: <span className="text-zinc-300 font-medium">{fmtMoney(target)}</span></span>
        <span>Progress: <span className="text-zinc-300 font-medium">{pct}%</span></span>
      </div>
      <div className="mt-2 h-3 w-full rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: String(pct) + "%" }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="h-full bg-gradient-to-r from-emerald-400/80 via-emerald-300/80 to-teal-300/80"
          style={{ boxShadow: "inset 0 0 20px rgba(16,185,129,0.45)" }}
        />
      </div>
      <div className="mt-1 text-xs text-zinc-400">
        Achieved:{" "}
        <span className={"font-semibold " + (achieved >= 0 ? "text-green-300" : "text-red-300")}>
          {fmtMoney(achieved)}
        </span>
      </div>
    </div>
  );
}

function RadialGauge({ value = 0, size = 120, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const c = Math.PI * 2 * r;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * c;
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} className="block">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#27272a" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="#34d399" strokeWidth={stroke} strokeLinecap="round" fill="none"
        strokeDasharray={[dash, c - dash].join(" ")}
        transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-zinc-300 text-xs">
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

/* ============================
   Quick Composer + Entries
============================ */
function QuickComposer({ onAdd }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  const submit = () => {
    const v = text.trim();
    if (!v) return;
    onAdd(v); setText("");
    if (inputRef.current && inputRef.current.focus) inputRef.current.focus();
  };
  return (
    <div className="flex gap-2 mb-3">
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => (e.key === "Enter" && !e.shiftKey ? (e.preventDefault(), submit()) : null)}
        placeholder="e.g., Price near ONH - wait for NY killzone retest"
        className="flex-1 px-3 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      />
      <button
        onClick={submit}
        className="px-3 py-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-zinc-900 font-semibold inline-flex items-center gap-1"
      >
        <Plus className="w-4 h-4" /> Add
      </button>
    </div>
  );
}

function EntryList({ entries, onEdit, onDelete }) {
  if (!entries || entries.length === 0) {
    return <div className="text-xs text-zinc-500">No entries yet - log your thought process as the session unfolds.</div>;
  }
  return (
    <ul className="divide-y divide-zinc-800/80 border border-zinc-800/60 rounded-xl overflow-hidden">
      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <motion.li key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="bg-zinc-900/50 backdrop-blur-sm">
            <EntryRow entry={e} onEdit={onEdit} onDelete={onDelete} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function EntryRow({ entry, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.text);
  const save = () => { onEdit(entry.id, text.trim()); setEditing(false); };
  return (
    <div className="p-3 flex items-start gap-3">
      <div className="mt-0.5 text-[11px] text-zinc-500 min-w-[88px]">{dayjs(entry.ts).format("HH:mm:ss")}</div>
      <div className="flex-1">
        {!editing ? (
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{entry.text}</p>
        ) : (
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full text-sm bg-zinc-800/60 border border-zinc-700 rounded-lg p-2 text-zinc-200 focus:outline-none" rows={2} />
        )}
      </div>
      <div className="flex gap-2">
        {!editing ? (
          <button className="icon-btn" onClick={() => setEditing(true)} title="Edit"><Edit3 className="w-4 h-4" /></button>
        ) : (
          <button className="icon-btn" onClick={save} title="Save"><Save className="w-4 h-4" /></button>
        )}
        <button className="icon-btn" onClick={() => onDelete(entry.id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

/* ============================
   Notes Editor
============================ */
function NotesEditor({ value, onChange }) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Plan, reviews, key levels... Use markdown like **bold**, _italics_, - bullets"
        className="w-full min-h-[160px] bg-zinc-800/60 border border-zinc-700 rounded-xl p-3 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      />
      <div className="mt-2 text-[11px] text-zinc-500">Autosaved locally • Export to journal when ready</div>
    </div>
  );
}

/* ============================
   Key Levels
============================ */
function KeyLevels({ levels, setLevels }) {
  const [val, setVal] = useState("");

  const add = () => {
    const v = val.trim();
    if (!v) return;
    setLevels((p) => Array.from(new Set([...(p || []), v])));
    setVal("");
  };

  const remove = (idx) =>
    setLevels((p) => (p || []).filter((_, i) => i !== idx));

  return (
    // NOTE: no fixed height on mobile; only fill+scroll at xl+
    <div className="flex flex-col xl:h-full">
      {/* enable scrolling only on xl+ to avoid mobile clipping */}
      <div className="xl:flex-1 xl:min-h-0 xl:overflow-y-auto custom-scrollbar pr-1 pb-2">
        {!levels || levels.length === 0 ? (
          <div className="text-xs text-zinc-500">
            Add ONH/ONL, IBH/IBL, weekly highs/lows, or HTF zones.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {levels.map((lvl, i) => (
              <span
                key={String(lvl) + "-" + String(i)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700 text-zinc-200 text-xs"
              >
                {lvl}
                <button
                  className="icon-btn w-6 h-6"
                  onClick={() => remove(i)}
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* input row */}
      <div className="pt-3 mt-3 border-t border-zinc-800 flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" ? (e.preventDefault(), add()) : null
          }
          placeholder="Add level, e.g., ONH 18950"
          className="flex-1 px-3 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none"
        />
        <button
          onClick={add}
          className="px-3 py-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-zinc-900 font-semibold inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
    </div>
  );
}

/* ============================
   Checklist
============================ */
function ChecklistHeader({ items }) {
  const done = (items || []).filter((i) => i.done).length;
  const pct = Math.round((done / ((items || []).length || 1)) * 100);
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-zinc-400">Progress</div>
        <div className="text-xs text-zinc-300 font-semibold">
          {done}/{(items || []).length} ({pct}%)
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden mb-3">
        <motion.div initial={{ width: 0 }} animate={{ width: String(pct) + "%" }} className="h-full bg-emerald-400/80" />
      </div>
    </>
  );
}

function ChecklistList({ items, setItems }) {
  const toggle = (id) => setItems((p) => (p || []).map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  const remove = (id) => setItems((p) => (p || []).filter((it) => it.id !== id));
  const move = (id, dir) => {
    setItems((p) => {
      const arr = p || [];
      const idx = arr.findIndex((x) => x.id === id);
      if (idx < 0) return arr;
      const n = arr.slice();
      const ni = dir === "up" ? Math.max(0, idx - 1) : Math.min(arr.length - 1, idx + 1);
      const row = n.splice(idx, 1)[0];
      n.splice(ni, 0, row);
      return n;
    });
  };

  return (
    <ul className="space-y-2">
      {(items || []).map((it) => (
        <li key={it.id} className="group flex items-center gap-3 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
          <button onClick={() => toggle(it.id)} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-emerald-400">
            {it.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 text-zinc-500" />}
          </button>
          <span className={"flex-1 text-sm " + (it.done ? "line-through text-zinc-500" : "text-zinc-200")}>
            {it.text}
          </span>
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button className="icon-btn" title="Move up" onClick={() => move(it.id, "up")}><GripVertical className="w-4 h-4 rotate-90" /></button>
            <button className="icon-btn" title="Move down" onClick={() => move(it.id, "down")}><GripVertical className="w-4 h-4 -rotate-90" /></button>
            <button className="icon-btn" title="Remove" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4" /></button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChecklistComposer({ items, setItems }) {
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    if (!v) return;
    setItems((p) => (p || []).concat([{ id: uid(), text: v, done: false }]));
    setText("");
  };
  return (
    <>
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? (e.preventDefault(), add()) : null)}
          placeholder="Add checklist item"
          className="flex-1 px-3 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none"
        />
        <button onClick={add} className="px-3 py-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-zinc-900 font-semibold inline-flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="mt-3">
        <div className="text-[11px] text-zinc-500 mb-2">Presets</div>
        <div className="flex flex-wrap gap-2">
          {presetChecklist().map((t) => (
            <button
              key={t}
              onClick={() => setItems((p) => (p || []).concat([{ id: uid(), text: t, done: false }]))}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800"
            >
              {"+ " + t}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ============================
   Templates
============================ */
function Templates({ onPick }) {
  const templates = [
    "NY Killzone plan: If price consolidates under ONH into 13:30-15:00 UTC, look for liquidity sweep + break in structure, enter on retrace, SL below swing, partial at 1R, runner to IB high.",
    "Risk control: Max 2 trades until target hit. If -$200 unrealized drawdown, step away for 15 minutes.",
    "Context: NQ at HTF supply. Expect reaction on first touch; favor shorts unless strong delta divergence at lows.",
    "Management: Move stop to BE at +0.8R if structure remains intact. No adding unless original premise strengthens.",
  ];
  return (
    <div className="flex flex-col gap-2">
      {templates.map((t, i) => (
        <button
          key={String(i)}
          className="px-3 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700 text-left text-xs text-zinc-200 hover:bg-zinc-800"
          onClick={() => onPick(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ============================
   Helpers
============================ */
function buildNumbers(date, trades) {
  const target = 500;
  const d = dayjs(date).format("YYYY-MM-DD");
  const y = dayjs(date).subtract(1, "day").format("YYYY-MM-DD");
  const dayTrades = (trades || []).filter((t) => t.date === d);
  const yTrades = (trades || []).filter((t) => t.date === y);
  const todayPnl = sum(dayTrades.map((t) => +t.pnl || 0));
  const todayTrades = dayTrades.length;
  const yPnl = sum(yTrades.map((t) => +t.pnl || 0));
  const yWins = yTrades.filter((t) => +t.pnl > 0).length;
  const yBest = yTrades.length ? Math.max.apply(null, yTrades.map((t) => +t.pnl || 0)) : 0;
  const yRate = yTrades.length ? Math.round((yWins / yTrades.length) * 100) : 0;
  return { target, todayPnl, todayTrades, yesterday: { pnl: yPnl, winRate: yRate, best: yBest, count: yTrades.length } };
}

function sum(a) { return (a || []).reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0); }
function fmtMoney(n) { const sign = n < 0 ? "-" : "+"; const abs = Math.abs(n); return sign + "$" + abs.toLocaleString(undefined, { maximumFractionDigits: 2 }); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function defaultChecklist() {
  return [
    { id: uid(), text: "News checked (no red flags)", done: false },
    { id: uid(), text: "Bias defined (bull/bear/range)", done: false },
    { id: uid(), text: "Key levels marked (ONH/ONL/IB)", done: false },
    { id: uid(), text: "Risk per trade confirmed", done: false },
  ];
}
function presetChecklist() {
  return ["Wait for killzone before entry", "No revenge trades", "Follow partials plan", "Journal after each trade", "Stop after target hit"];
}
function smartTemplate(date, session) {
  const dow = dayjs(date).format("ddd");
  return [
    "Session Plan (" + session + " - " + dow + ")",
    "- Context: ...",
    "- Key levels: ONH __ / ONL __ / IB __",
    "- Bias: Long | Short | Neutral",
    "- Killzone: wait for liquidity sweep + BOS before entry",
    "- Execution: 1-2 trades max until target hit",
  ].join("\n");
}
function renderJournalExport({ date, notes, entries, items, levels, session }) {
  const lines = [];
  lines.push("# Daily Review - " + dayjs(date).format("YYYY-MM-DD"));
  lines.push(""); lines.push("## Session: " + session); lines.push("");
  lines.push("## Plan & Notes"); lines.push(notes || "(empty)"); lines.push("");
  lines.push("## Key Levels");
  lines.push(levels && levels.length ? levels.map((x) => "- " + x).join("\n") : "(none)");
  lines.push(""); lines.push("## Checklist");
  (items || []).forEach((i) => lines.push("- [" + (i.done ? "x" : " ") + "] " + i.text));
  lines.push(""); lines.push("## Timeline");
  (entries || []).slice().reverse().forEach((e) => lines.push("- " + dayjs(e.ts).format("HH:mm") + " - " + e.text));
  return lines.join("\n");
}
async function copyToClipboard(text) { try { await navigator.clipboard.writeText(text); } catch (e) { console.error(e); } }

// tiny style helper for icon buttons
if (typeof document !== "undefined") {
  const existing = document.getElementById("reviewpanel-icons");
  if (!existing) {
    const style = document.createElement("style");
    style.id = "reviewpanel-icons";
    style.innerHTML =
      ".icon-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:rgba(39,39,42,.5);border:1px solid #3f3f46;color:#d4d4d8}.icon-btn:hover{background:#3f3f46}";
    document.head.appendChild(style);
  }
}
