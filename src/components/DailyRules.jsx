// src/components/DailyRules.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  CheckCircle2,
  Circle,
  Plus,
  Edit3,
  Trash2,
  Pin,
  PinOff,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getDailyRules, saveDailyRules } from "../utils/ruleService";

const todayKey = dayjs().format("YYYY-MM-DD");

// Brand accents tuned for your grey background
const ACCENT = "#0ef4c8"; // neon-teal
const ACCENT_SOFT = "rgba(14, 244, 200, 0.15)";
const BORDER_SOFT = "rgba(255,255,255,0.06)";

const STARTER_TEMPLATES = [
  "No overtrading (max 3 trades today)",
  "No revenge trading after a loss",
  "Risk ≤ 1% per trade",
  "Only trade A+ setups",
  "Always set stop before entry",
];

/** sanitize + dedupe */
function cleanRules(raw) {
  const seenIds = new Set();
  const seenTexts = new Set();
  return (Array.isArray(raw) ? raw : [])
    .filter((r) => r && typeof r.text === "string" && r.text.trim() !== "")
    .map((r) => ({
      ...r,
      id: r.id || (globalThis.crypto?.randomUUID?.() ?? String(Math.random())),
      text: r.text.trim(),
      completed: !!r.completed,
      pinned: !!r.pinned,
      streak: Number.isFinite(r.streak) ? r.streak : 0,
    }))
    .filter((r) => {
      const lower = r.text.toLowerCase();
      if (seenIds.has(r.id) || seenTexts.has(lower)) return false;
      seenIds.add(r.id);
      seenTexts.add(lower);
      return true;
    });
}

const makeRule = (text) => ({
  id: globalThis.crypto?.randomUUID?.() ?? String(Math.random()),
  text: text.trim(),
  completed: false,
  pinned: false,
  streak: 0,
});

export default function DailyRules() {
  const [rules, setRules] = useState([]);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false); // inline composer
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);

  // micro-pulse when progress changes
  const [pulse, setPulse] = useState(false);
  const prevCompletedRef = useRef(0);
  const prevTotalRef = useRef(0);

  // Fetch & self-heal
  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getDailyRules(todayKey);
        if (!ok) return;
        const cleaned = cleanRules(res?.rules || []);
        setRules(cleaned);
        setLoading(false);
        if ((res?.rules || []).length !== cleaned.length) {
          await saveDailyRules(todayKey, null, { rules: cleaned });
        }
      } catch {
        if (!ok) return;
        setLoading(false);
      }
    })();
    return () => (ok = false);
  }, []);

  const persist = async (nextRaw) => {
    const next = cleanRules(nextRaw);
    setRules(next);
    await saveDailyRules(todayKey, null, { rules: next });
  };

  const pinnedRule = useMemo(() => rules.find((r) => r.pinned), [rules]);
  const restRules = useMemo(() => rules.filter((r) => !r.pinned), [rules]);
  const completedCount = useMemo(
    () => rules.filter((r) => r.completed).length,
    [rules]
  );
  const progress = rules.length
    ? Math.round((completedCount / Math.max(rules.length, 1)) * 100)
    : 0;

  // Trigger pulse on progress change
  useEffect(() => {
    const prevCompleted = prevCompletedRef.current;
    const prevTotal = prevTotalRef.current;
    if (prevCompleted !== completedCount || prevTotal !== rules.length) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 420);
      prevCompletedRef.current = completedCount;
      prevTotalRef.current = rules.length;
      return () => clearTimeout(t);
    }
  }, [completedCount, rules.length]);

  // CRUD
  const addRule = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await persist([...rules, makeRule(text)]);
    setAdding(false);
  };

  const addTemplate = async (text) => {
    if (rules.some((r) => r.text.toLowerCase() === text.toLowerCase())) return;
    await persist([...rules, makeRule(text)]);
  };

  const addAllTemplates = async () => {
    const fresh = STARTER_TEMPLATES
      .filter((t) => !rules.some((r) => r.text.toLowerCase() === t.toLowerCase()))
      .map(makeRule);
    if (fresh.length) await persist([...rules, ...fresh]);
  };

  const toggleRule = async (id) =>
    persist(rules.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)));

  const startEdit = (id) => {
    const r = rules.find((x) => x.id === id);
    if (!r) return;
    setEditingId(id);
    setInput(r.text);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const text = input.trim();
    const id = editingId;
    setEditingId(null);
    setInput("");
    if (!text) return persist(rules.filter((r) => r.id !== id)); // delete if blank
    await persist(rules.map((r) => (r.id === id ? { ...r, text } : r)));
  };

  const deleteRule = async (id) => persist(rules.filter((r) => r.id !== id));

  const togglePin = async (id) =>
    persist(rules.map((r) => ({ ...r, pinned: r.id === id ? !r.pinned : false })));

  /* ---------------- UI ---------------- */

  return (
    <motion.div
      layout
      className="relative w-full rounded-2xl border shadow-xl px-4 sm:px-5 py-4 sm:py-5 flex flex-col gap-4"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(8px)",
        borderColor: BORDER_SOFT,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full"
            style={{
              background: ACCENT_SOFT,
              boxShadow: "0 0 0 2px rgba(14,244,200,0.12) inset",
            }}
          >
            <CheckCircle2 size={18} style={{ color: ACCENT }} />
          </span>
          <h3 className="text-lg sm:text-xl font-semibold tracking-wide text-zinc-100">
            Daily Rules
          </h3>
        </div>

        {/* Desktop Add (lighter + hover lift) */}
        <button
          onClick={() => {
            setAdding((s) => !s);
            setEditingId(null);
            setShowTemplates(false);
            if (!adding) setTimeout(() => document.getElementById("rule-input")?.focus(), 30);
          }}
          className="hidden sm:inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold
                     transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 hover:brightness-110"
          style={{
            borderColor: "rgba(14,244,200,0.45)",
            background:
              "linear-gradient(135deg, rgba(14,244,200,0.28) 0%, rgba(14,244,200,0.16) 100%)",
            boxShadow:
              "0 6px 22px rgba(14,244,200,0.30), inset 0 1px 0 rgba(255,255,255,0.08)",
            color: "#091412",
          }}
        >
          <Plus size={18} />
          {adding ? "Close" : "Add Rule"}
        </button>
      </div>

      {/* Progress with micro pulse */}
      <div className="flex items-center gap-3 relative">
        <div className="flex-1 h-2 rounded-full overflow-hidden bg-zinc-800/60 relative">
          <motion.div
            key={`bar-${rules.length}-${completedCount}`} // guarantees smooth initial anim
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="h-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(14,244,200,0.9) 0%, rgba(14,244,200,0.55) 100%)",
              boxShadow: "0 0 18px rgba(14,244,200,0.35) inset",
            }}
          />
          {/* micro pulse overlay */}
          <AnimatePresence>
            {pulse && (
              <motion.div
                key="pulse"
                initial={{ opacity: 0, scaleY: 0.6 }}
                animate={{ opacity: 0.85, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.6 }}
                transition={{ duration: 0.42, ease: "easeOut" }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(80% 120% at 10% 50%, rgba(14,244,200,0.35) 0%, rgba(14,244,200,0.18) 35%, rgba(14,244,200,0.00) 70%)",
                  filter: "blur(2px)",
                }}
              />
            )}
          </AnimatePresence>
        </div>
        <span className="text-xs tabular-nums text-zinc-300">{progress}%</span>
        <span className="text-xs text-zinc-400">
          <span className="text-zinc-100 font-semibold">{completedCount}</span>/
          {rules.length || 0}
        </span>
      </div>

      {/* Inline composer */}
      <AnimatePresence initial={false}>
        {adding && (
          <motion.div
            key="composer"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-xl border p-2 sm:p-3"
            style={{ borderColor: BORDER_SOFT, background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex gap-2">
              <input
                id="rule-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRule()}
                className="flex-1 rounded-lg bg-zinc-900/60 border border-zinc-700 px-3 py-2 text-zinc-100 outline-none"
                placeholder="Type a new rule…"
                autoFocus
              />
              <button
                onClick={addRule}
                className="rounded-lg px-4 py-2 text-sm font-semibold active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(14,244,200,0.9) 0%, rgba(14,244,200,0.65) 100%)",
                  color: "#0b0c10",
                  boxShadow: "0 2px 12px rgba(14,244,200,0.28)",
                }}
              >
                Add
              </button>
            </div>

            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => setShowTemplates((s) => !s)}
                className="inline-flex items-center gap-2 text-xs text-zinc-300 hover:text-zinc-100"
              >
                <Sparkles size={14} style={{ color: ACCENT }} />
                {showTemplates ? "Hide quick templates" : "Show quick templates"}
              </button>

              {/* quick Cancel to collapse */}
              <button
                onClick={() => {
                  setAdding(false);
                  setInput("");
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>

            <AnimatePresence initial={false}>
              {showTemplates && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 flex flex-wrap gap-2"
                >
                  {STARTER_TEMPLATES.map((t) => (
                    <button
                      key={t}
                      onClick={() => addTemplate(t)}
                      className="text-xs px-3 py-1.5 rounded-full border transition hover:translate-y-[-1px]"
                      style={{
                        borderColor: "rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                        color: "#e6e6e6",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                  <button
                    onClick={addAllTemplates}
                    className="text-xs px-3 py-1.5 rounded-full border font-semibold"
                    style={{
                      borderColor: "rgba(14,244,200,0.35)",
                      background: ACCENT_SOFT,
                      color: "#cffff6",
                    }}
                  >
                    + Add all
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loading && rules.length === 0 && (
        <div
          className="rounded-xl border p-4 text-sm text-zinc-300"
          style={{ borderColor: BORDER_SOFT, background: "rgba(255,255,255,0.02)" }}
        >
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={16} style={{ color: ACCENT }} />
            Quick start templates
          </div>
          <div className="flex flex-wrap gap-2">
            {STARTER_TEMPLATES.map((t) => (
              <button
                key={t}
                onClick={() => addTemplate(t)}
                className="px-3 py-1.5 rounded-full border text-xs transition"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                {t}
              </button>
            ))}
            <button
              onClick={addAllTemplates}
              className="px-3 py-1.5 rounded-full border text-xs font-semibold"
              style={{
                borderColor: "rgba(14,244,200,0.35)",
                background: ACCENT_SOFT,
                color: "#cffff6",
              }}
            >
              <span className="inline-flex items-center gap-1">
                <Sparkles size={14} /> Add all
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="flex flex-col gap-2 max-h-[48vh] sm:max-h-64 overflow-y-auto pr-0 sm:pr-1 custom-scrollbar">
        {loading ? (
          <div className="text-zinc-400 py-8 text-center">Loading…</div>
        ) : (
          <>
            {pinnedRule && (
              <RuleRow
                key={pinnedRule.id}
                rule={pinnedRule}
                pinned
                isEditing={editingId === pinnedRule.id}
                input={input}
                setInput={setInput}
                onToggle={() => toggleRule(pinnedRule.id)}
                onStartEdit={() => startEdit(pinnedRule.id)}
                onSaveEdit={saveEdit}
                onCancelEdit={() => {
                  setEditingId(null);
                  setInput("");
                }}
                onDelete={() => deleteRule(pinnedRule.id)}
                onTogglePin={() => togglePin(pinnedRule.id)}
              />
            )}
            {restRules.length === 0 && !pinnedRule ? (
              <div className="text-zinc-500 italic py-8 text-center">
                Create your first rule to lock in discipline.
              </div>
            ) : (
              restRules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  isEditing={editingId === rule.id}
                  input={input}
                  setInput={setInput}
                  onToggle={() => toggleRule(rule.id)}
                  onStartEdit={() => startEdit(rule.id)}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => {
                    setEditingId(null);
                    setInput("");
                  }}
                  onDelete={() => deleteRule(rule.id)}
                  onTogglePin={() => togglePin(rule.id)}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Mobile add — tap again to collapse */}
      <div className="sm:hidden mt-1">
        <button
          onClick={() => {
            setEditingId(null);
            if (adding && !input.trim()) {
              setAdding(false); // collapse if already open and no text
              return;
            }
            setAdding(true);
            setTimeout(() => document.getElementById("rule-input")?.focus(), 30);
          }}
          className="w-full rounded-xl py-3 font-semibold transition-transform duration-150 active:scale-98 hover:brightness-110"
          style={{
            background:
              "linear-gradient(135deg, rgba(14,244,200,0.9) 0%, rgba(14,244,200,0.65) 100%)",
            color: "#0b0c10",
            boxShadow: "0 6px 20px rgba(14,244,200,0.30)",
          }}
        >
          <span className="inline-flex items-center gap-2 justify-center">
            <Plus size={18} /> {adding && !input.trim() ? "Close" : "Add Rule"}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

/* ---------- Subcomponent ---------- */

function RuleRow({
  rule,
  pinned = false,
  isEditing,
  input,
  setInput,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onTogglePin,
}) {
  return (
    <motion.div
      layout
      className="group flex items-start gap-3 rounded-xl px-3 py-3 border transition"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background: rule.completed
          ? "linear-gradient(90deg, rgba(18,88,70,0.16) 0%, rgba(12,18,20,0.12) 100%)"
          : "rgba(255,255,255,0.02)",
        boxShadow: pinned
          ? "inset 0 0 0 1px rgba(255,223,128,0.22)"
          : "inset 0 0 0 0 rgba(0,0,0,0)",
      }}
    >
      {/* Checkbox */}
      <button
        role="checkbox"
        aria-checked={rule.completed}
        onClick={onToggle}
        className="mt-0.5 flex-shrink-0 w-9 h-9 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center active:scale-95"
        style={{
          borderColor: rule.completed ? "rgba(14,244,200,0.7)" : "rgba(255,255,255,0.18)",
          background: rule.completed ? "rgba(14,244,200,0.22)" : "rgba(12,12,12,0.5)",
        }}
        aria-label={rule.completed ? "Mark incomplete" : "Mark complete"}
      >
        {rule.completed ? (
          <CheckCircle2 size={18} style={{ color: "#a7ffea" }} />
        ) : (
          <Circle size={18} className="text-zinc-500" />
        )}
      </button>

      {/* Text / editor */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            className="w-full rounded-lg bg-zinc-900/70 border border-zinc-700 px-2 py-2 text-zinc-100 outline-none font-medium"
            autoFocus
          />
        ) : (
          <p
            className={[
              "text-[15px] sm:text-base font-medium text-zinc-100",
              rule.completed ? "line-through text-emerald-200/80" : "",
            ].join(" ")}
            style={{ wordBreak: "break-word", lineHeight: 1.28 }}
            onDoubleClick={onStartEdit}
            title="Double tap to edit"
          >
            {rule.text}
          </p>
        )}

        {/* Meta */}
        <div className="mt-1 flex items-center gap-2">
          {pinned && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border text-yellow-100"
              style={{
                borderColor: "rgba(255,223,128,0.35)",
                background: "rgba(255,223,128,0.10)",
              }}
            >
              Pinned
            </span>
          )}
          {Number(rule.streak) > 0 && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border text-emerald-200"
              style={{
                borderColor: "rgba(14,244,200,0.32)",
                background: "rgba(14,244,200,0.12)",
              }}
            >
              Streak {rule.streak}d
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-1 sm:opacity-0 sm:group-hover:opacity-100 transition">
        <button
          onClick={onTogglePin}
          className="p-1.5 rounded hover:bg-yellow-400/10"
          aria-label={rule.pinned ? "Unpin" : "Pin"}
          title={rule.pinned ? "Unpin" : "Pin"}
        >
          {rule.pinned ? (
            <PinOff size={16} className="text-yellow-300" />
          ) : (
            <Pin size={16} className="text-yellow-300" />
          )}
        </button>
        <button
          onClick={onStartEdit}
          className="p-1.5 rounded hover:bg-blue-400/10"
          aria-label="Edit"
          title="Edit"
        >
          <Edit3 size={16} className="text-blue-400" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-400/10"
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 size={16} className="text-red-400" />
        </button>
      </div>
    </motion.div>
  );
}
