// src/pages/JournalPage/tabs/PlanTab.jsx
import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import {
  Target, Activity, ShieldCheck, ListChecks, Plus, Trash2, Clock3, MapPin,
  Check, Copy, Save, Sparkles, Wand2, ChevronRight, ListTodo
} from "lucide-react";

/* ========= UI Primitives ========= */
const Glass = ({ className = "", children }) => (
  <div className={`rounded-[22px] border border-white/10 bg-white/6 backdrop-blur-xl ${className}`}>
    {children}
  </div>
);
const Section = ({ title, icon: Icon, action, id, children }) => (
  <Glass className="p-4 sm:p-5" id={id}>
    <div className="flex items-center justify-between mb-3">
      <div className="inline-flex items-center gap-2">
        {Icon ? <Icon size={16} className="text-emerald-300" /> : null}
        <h3 className="text-[15px] font-semibold text-zinc-100">{title}</h3>
      </div>
      {action || null}
    </div>
    {children}
  </Glass>
);

/* ========= Content ========= */
const biasOptions = ["Long", "Short", "Neutral"];
const chipBase =
  "px-3 py-1.5 rounded-xl text-sm font-semibold transition border inline-flex items-center gap-2";

/** curated, opinionated checklist suggestions */
const SUGGESTIONS = [
  "Risk ≤ 1R per idea",
  "Only A+ setups",
  "No revenge trades",
  "Stop goes first",
  "Follow cool-down if loss",
  "No trades in chop",
  "Respect session boundary",
  "Size halves after loss",
  "News minute: observe only",
  "Take profits at HTF level",
];

/** one-tap preset bundles */
const PRESETS = {
  "Process discipline": [
    "Risk ≤ 1R per idea",
    "Only A+ setups",
    "Stop goes first",
    "No revenge trades",
    "Follow cool-down if loss",
  ],
  "News day": [
    "News minute: observe only",
    "Size halves after loss",
    "Respect session boundary",
  ],
  "A+ only": ["Only A+ setups", "No trades in chop", "Take profits at HTF level"],
};

export default function PlanTab({ value, onChange }) {
  const plan = value?.plan || {};
  const [levelsDraft, setLevelsDraft] = useState({ label: "", value: "" });
  const [newItem, setNewItem] = useState("");

  // stable, sorted checklist view
  const checklist = plan.checklist || {};
  const checklistArr = useMemo(
    () => Object.entries(checklist).sort(([a], [b]) => a.localeCompare(b)),
    [checklist]
  );

  const setPlan = useCallback(
    (patch) => onChange({ ...value, plan: { ...(value.plan || {}), ...patch } }),
    [onChange, value]
  );

  const setRisk = (k, v) => {
    const num = v === "" ? "" : Number(v);
    setPlan({ riskBox: { ...(plan.riskBox || {}), [k]: Number.isFinite(num) ? num : "" } });
  };

  /* ---------- Key Levels ---------- */
  const addLevel = () => {
    const clean = {
      label: (levelsDraft.label || "").trim(),
      value: (levelsDraft.value || "").trim(),
    };
    if (!clean.label || !clean.value) return;
    const exists = (plan.keyLevels || []).some(
      (l) => l.label.toLowerCase() === clean.label.toLowerCase() && String(l.value) === String(clean.value)
    );
    if (exists) return;
    setPlan({ keyLevels: [...(plan.keyLevels || []), clean] });
    setLevelsDraft({ label: "", value: "" });
  };
  const handleLevelKey = (e) => e.key === "Enter" && addLevel();
  const removeLevel = (idx) => {
    const next = [...(plan.keyLevels || [])];
    next.splice(idx, 1);
    setPlan({ keyLevels: next });
  };
  const copyAllLevels = async () => {
    try {
      const txt = (plan.keyLevels || []).map((l) => `${l.label}: ${l.value}`).join("\n");
      await navigator.clipboard.writeText(txt);
    } catch {}
  };

  /* ---------- Checklist ---------- */
  const toggleChecklist = (key) => setPlan({ checklist: { ...checklist, [key]: !checklist[key] } });

  const addChecklistItem = (labelRaw) => {
    const clean = (labelRaw ?? newItem).trim();
    if (!clean) return;
    setPlan({ checklist: { ...checklist, [clean]: false } });
    setNewItem("");
  };
  const removeChecklistItem = (label) => {
    const { [label]: _, ...rest } = checklist;
    setPlan({ checklist: rest });
  };
  const addPreset = (name) => {
    const items = PRESETS[name] || [];
    const next = { ...checklist };
    items.forEach((i) => (next[i] = next[i] ?? false));
    setPlan({ checklist: next });
  };

  /* ---------- Readiness & Actions ---------- */
  const readyPct = useMemo(() => {
    const vals = Object.values(checklist);
    return vals.length ? Math.round((vals.filter(Boolean).length / vals.length) * 100) : 0;
  }, [checklist]);

  const status = value?.status || "draft";
  const markReady = () => onChange({ ...value, status: "ready" });
  const readyDisabled = status === "ready" || status === "reviewed";

  const exportMarkdown = () => {
    const md = [
      `# Plan – ${dayjs(value?.date || new Date()).format("DD MMM YYYY")}`,
      ``,
      `**Focus:** ${plan.focusGoal || "—"}`,
      `**Bias:** ${plan.bias || "—"}`,
      ``,
      `## Risk`,
      `- Max Risk: ${plan?.riskBox?.maxRisk ?? "—"}`,
      `- Max Trades: ${plan?.riskBox?.maxTrades ?? "—"}`,
      `- Max Loss: ${plan?.riskBox?.maxLoss ?? "—"}`,
      ``,
      `## Key Levels`,
      ...(plan.keyLevels?.length ? plan.keyLevels.map((l) => `- ${l.label}: ${l.value}`) : ["- (none)"]),
      ``,
      `## Checklist (${readyPct}% ready)`,
      ...(checklistArr.length ? checklistArr.map(([k, v]) => `- [${v ? "x" : " "}] ${k}`) : ["- (none)"]),
      ``,
      `## News`,
      `- ${plan.newsTime || "—"}`,
      ``,
      `Status: ${status}`,
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Plan-${value?.date || "today"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ---------- Radial for Summary ---------- */
  const circumference = 126; // ~ 2πr for r≈20 within our viewBox
  const dash = (readyPct / 100) * circumference;

  return (
    <div className="space-y-5">
      {/* HERO HEADER — richer gradient, subtle motion */}
      <Glass className="relative overflow-hidden p-5 sm:p-6">
        <motion.div
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-500/25 to-cyan-500/25 blur-3xl"
          animate={{ x: [0, 6, 0], y: [0, -4, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-500/25 to-emerald-500/25 blur-3xl"
          animate={{ x: [0, -6, 0], y: [0, 4, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-[12px] tracking-widest text-zinc-400 uppercase">ZTrader Journal OS</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">Pre-Market Plan</h2>
            <p className="text-sm text-zinc-400">Intentional inputs, repeatable edge. Keep it crisp.</p>
          </div>

          {/* IMPACTFUL SUMMARY WIDGET */}
          <div className="flex items-center gap-4">
            <Glass className="px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Animated radial */}
                <svg width="64" height="64" viewBox="0 0 48 48" className="-rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,.12)" strokeWidth="6" fill="none" />
                  <motion.circle
                    cx="24" cy="24" r="20" stroke="rgba(16,185,129,.95)" strokeWidth="6" fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
                    transition={{ type: "spring", stiffness: 140, damping: 22 }}
                  />
                </svg>
                <div>
                  <div className="text-xs text-zinc-400">Readiness</div>
                  <div className="text-lg font-extrabold">{readyPct}%</div>
                </div>
              </div>
            </Glass>

            <div className="flex flex-col gap-2">
              <button
                onClick={markReady}
                disabled={readyDisabled}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-black font-semibold
                ${readyDisabled ? "bg-emerald-500/40 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400"}`}
                title={readyDisabled ? "Already marked ready or reviewed" : "Lock in the plan for this session"}
              >
                <ShieldCheck size={16} /> {readyDisabled ? "Ready" : "Mark Ready"}
              </button>
              <button
                onClick={exportMarkdown}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                <Save size={16} /> Export (MD)
              </button>
            </div>
          </div>
        </div>
      </Glass>

      {/* TOP ROW: Focus/Bias • Risk • News */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Focus & Bias" icon={Target} id="focus-bias-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Focus">
              <input
                className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm"
                placeholder="e.g., Only A+ setups"
                value={plan.focusGoal || ""}
                onChange={(e) => setPlan({ focusGoal: e.target.value })}
              />
            </Field>

            <Field label="Bias">
              <div className="flex flex-wrap gap-2">
                {biasOptions.map((b) => {
                  const is = plan.bias === b;
                  return (
                    <button
                      key={b}
                      onClick={() => setPlan({ bias: b })}
                      className={`${chipBase} ${
                        is
                          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                          : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <Activity size={14} /> {b}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Risk Box" icon={ShieldCheck}>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Max Risk ($)">
              <input
                type="number" min="0" step="1" inputMode="decimal"
                className="input"
                value={plan?.riskBox?.maxRisk ?? ""}
                onChange={(e) => setRisk("maxRisk", e.target.value)}
              />
            </Field>
            <Field label="Max Trades">
              <input
                type="number" min="0" step="1" inputMode="numeric"
                className="input"
                value={plan?.riskBox?.maxTrades ?? ""}
                onChange={(e) => setRisk("maxTrades", e.target.value)}
              />
            </Field>
            <Field label="Max Loss ($)">
              <input
                type="number" min="0" step="1" inputMode="decimal"
                className="input"
                value={plan?.riskBox?.maxLoss ?? ""}
                onChange={(e) => setRisk("maxLoss", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section
          title="News / Sessions"
          icon={Clock3}
          action={<span className="text-[11px] text-zinc-400">Local time: {dayjs().format("h:mm A")}</span>}
        >
          <Field label="Key time (optional)">
            <input
              placeholder="e.g., 8:30 AM CPI"
              className="input"
              value={plan.newsTime || ""}
              onChange={(e) => setPlan({ newsTime: e.target.value })}
            />
          </Field>
          <p className="mt-2 text-xs text-zinc-400">Tip: add multiple times in your notes or levels if needed.</p>
        </Section>
      </div>

      {/* MIDDLE: Key Levels */}
      <Section
        title="Key Levels"
        icon={MapPin}
        action={
          <button
            onClick={copyAllLevels}
            className="inline-flex items-center gap-2 text-xs rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 hover:bg-white/10"
          >
            <Copy size={14} /> Copy all
          </button>
        }
      >
        <div className="grid grid-cols-12 gap-2">
          <input
            className="col-span-5 input"
            placeholder="Label (e.g., ONH/ONL, PreM High)"
            value={levelsDraft.label}
            onChange={(e) => setLevelsDraft((d) => ({ ...d, label: e.target.value }))}
            onKeyDown={handleLevelKey}
          />
          <input
            className="col-span-5 input"
            placeholder="Price (e.g., 5287.50)"
            value={levelsDraft.value}
            onChange={(e) => setLevelsDraft((d) => ({ ...d, value: e.target.value }))}
            onKeyDown={handleLevelKey}
          />
          <button
            onClick={addLevel}
            className="col-span-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm"
          >
            <Plus size={16} className="inline mr-1" />
            Add
          </button>
        </div>

        <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 overflow-hidden">
          <AnimatePresence initial={false}>
            {(plan.keyLevels || []).length === 0 ? (
              <li className="px-3 py-3 text-sm text-zinc-500">No levels yet.</li>
            ) : (
              (plan.keyLevels || []).map((l, i) => (
                <motion.li
                  key={`${l.label}-${l.value}-${i}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="px-3 py-2 text-sm flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <span className="text-zinc-400">{l.label}:</span>{" "}
                    <span className="text-zinc-100">{l.value}</span>
                  </div>
                  <button
                    onClick={() => removeLevel(i)}
                    className="rounded-md bg-white/5 hover:bg-white/10 px-2 py-1 text-xs text-rose-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.li>
              ))
            )}
          </AnimatePresence>
        </ul>
      </Section>

      {/* BOTTOM: Checklist — Upgraded UX */}
      <Section
        title="Checklist"
        icon={ListChecks}
        action={
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">{readyPct}% ready</span>
          </div>
        }
      >
        {/* Inline Add Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Add checklist item… (e.g., Stop goes first)"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
            />
            <button
              onClick={() => addChecklistItem()}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm px-3"
              title="Add item"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Smart suggestions (hide when item typed contains text) */}
          {!newItem && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => addChecklistItem(s)}
                  className="text-xs rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 hover:bg-white/10 inline-flex items-center gap-1"
                >
                  <Sparkles size={12} className="text-emerald-300" /> {s}
                </button>
              ))}
            </div>
          )}

          {/* One-tap Presets */}
          <div className="mt-1 flex flex-wrap gap-2">
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                onClick={() => addPreset(name)}
                className="text-[11px] rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 hover:bg-white/10 inline-flex items-center gap-1"
                title={`Add ${PRESETS[name].length} items`}
              >
                <Wand2 size={12} className="text-cyan-300" />
                {name}
                <span className="opacity-60">({PRESETS[name].length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 overflow-hidden">
          {checklistArr.length === 0 ? (
            <li className="px-3 py-3 text-sm text-zinc-500">No items yet — add from suggestions or type your own.</li>
          ) : (
            checklistArr.map(([label, done]) => (
              <li key={label} className="px-3 py-2 text-sm flex items-center justify-between">
                <button
                  onClick={() => toggleChecklist(label)}
                  className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 border transition
                    ${done
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                    }`}
                >
                  <Check size={14} />
                  <span className="truncate">{label}</span>
                </button>
                <button
                  onClick={() => removeChecklistItem(label)}
                  className="rounded-md bg-white/5 hover:bg-white/10 px-2 py-1 text-xs text-rose-300"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))
          )}
        </ul>
      </Section>

      <style>{`
        .input{
          width:100%;
          border-radius:0.875rem;
          border:1px solid rgba(255,255,255,0.14);
          background:rgba(255,255,255,0.06);
          color:white; padding:.6rem .8rem; font-size:.875rem;
        }
      `}</style>
    </div>
  );
}

/* Simple field wrapper */
function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs text-zinc-400 mb-1">{label}</div>
      {children}
    </label>
  );
}
