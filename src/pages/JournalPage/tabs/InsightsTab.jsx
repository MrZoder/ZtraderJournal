import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Search,
  Tag,
  Star,
  ChevronDown,
  X,
  Link2,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { listInsights, upsertInsight, removeInsight } from "../utils/insightService";
// --- P/L color helpers (subtle + readable on glass) ---
function pnlTextClass(pnl = 0) {
  return pnl > 0 ? "text-emerald-300" : pnl < 0 ? "text-rose-300" : "text-zinc-300";
}
function pnlChipClass(pnl = 0) {
  return pnl > 0
    ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
    : pnl < 0
    ? "bg-rose-500/10 border-rose-400/20 text-rose-200"
    : "bg-white/10 border-white/15 text-zinc-200";
}

/* ========= GLASS TOKENS (match Journal vibe; frosted over your bg) ========= */
const shell =
  "rounded-[22px] border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,.35)]";
const cardGlass =
  "rounded-[18px] border border-white/10 bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]";
const pill =
  "h-10 px-3 rounded-[12px] bg-white/7 border border-white/10 text-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-300/40";
const cta =
  "h-11 px-4 rounded-[14px] inline-flex items-center justify-center gap-2 text-[14px] font-semibold bg-gradient-to-br from-emerald-400 to-cyan-400 text-black shadow-[0_10px_35px_rgba(34,211,238,.35)] hover:from-emerald-300 hover:to-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/60";
const subtle =
  "h-11 px-4 rounded-[14px] inline-flex items-center justify-center gap-2 text-[14px] border border-white/12 bg-white/6 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/40";
const iconBtn =
  "p-2 rounded-[10px] border border-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/40";

/* ============================ small utilities ============================ */
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const fn = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, handler]);
}

function Dropdown({ label, value, onChange, items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));
  const display = value || "Any";

  return (
    <div className="relative" ref={ref}>
      <button
        className={`${pill} hover:bg-white/10`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="opacity-80">{label}:</span>
        <span className="font-medium">{display}</span>
        <ChevronDown size={14} className="opacity-70" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={`${shell} absolute right-0 mt-2 min-w-[220px] p-2 z-30`}
            role="listbox"
          >
            {items.map((it) => {
              const v = it === "Any" ? "" : it;
              const active = (!value && it === "Any") || value === v;
              return (
                <button
                  key={it}
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(v);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-[12px] text-sm hover:bg-white/10 ${
                    active ? "bg-white/10" : ""
                  }`}
                >
                  {it}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TagChips({ tags }) {
  if (!tags?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.map((t) => (
        <span key={t} className="px-2 py-0.5 text-[11px] rounded-full bg-white/10 flex items-center gap-1">
          <Tag size={12} /> {t}
        </span>
      ))}
    </div>
  );
}

function ImpactStars({ value = 3, onChange }) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange?.(n)}
          className={iconBtn}
          title={`Impact ${n}`}
        >
          <Star size={16} className={n <= value ? "fill-yellow-400 text-yellow-400" : "text-zinc-500"} />
        </button>
      ))}
    </div>
  );
}

/* ============================ Trade Multiselect ============================ */
function TradeMultiSelect({ trades = [], selected = [], onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));

  const summary =
    selected.length === 0
      ? "None"
      : selected.length === 1
      ? selected[0]
      : `${selected.length} trades`;

  return (
    <div className="relative" ref={ref}>
      <button className={`${pill} hover:bg-white/10`} onClick={() => setOpen((v) => !v)}>
        <Link2 size={14} />
        <span className="font-medium">Link trades:</span>
        <span>{summary}</span>
        <ChevronDown size={14} className="opacity-70" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={`${shell} absolute right-0 mt-2 min-w-[280px] p-2 z-30`}
          >
            <div className="max-h-[260px] overflow-auto pr-1">
              {trades.length ? (
                trades.map((t) => {
                  const id = String(t.id ?? t.trade_id ?? `${t.symbol}-${t.entry_time}`);
                 const pnl = Number(t.pnl ?? 0);
                 const label = `${t.symbol ?? "—"} • ${pnl.toFixed(2)} • ${
                t.entry_time ? new Date(t.entry_time).toLocaleTimeString() : ""
                }`;
                  const checked = selected.includes(id);
                  return (
                    <label
                      key={id}
                      className="flex items-center gap-2 px-2 py-2 rounded-[10px] hover:bg-white/10 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="accent-cyan-400"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) onChange([...selected, id]);
                          else onChange(selected.filter((x) => x !== id));
                        }}
                      />
                      <span className={`text-sm ${pnlTextClass(pnl)}`}>{label}</span>
                    </label>
                  );
                })
              ) : (
                <div className="py-4 text-sm text-zinc-400">No trades available.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================ Create/Edit Modal ============================ */
function InsightModal({ open, initial, onClose, onSave, trades }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [tags, setTags] = useState(initial?.tags || []);
  const [type, setType] = useState(initial?.type || "Lesson");
  const [impact, setImpact] = useState(initial?.impact || 3);
  const [linked, setLinked] = useState(initial?.linked_trade_ids || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setContent(initial?.content || "");
      setTags(initial?.tags || []);
      setType(initial?.type || "Lesson");
      setImpact(initial?.impact || 3);
      setLinked(initial?.linked_trade_ids || []);
    }
  }, [open, initial]);

  const [tagInput, setTagInput] = useState("");
  function addTag(v) {
    const t = v.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-[radial-gradient(90%_120%_at_50%_-10%,rgba(20,24,32,.7),rgba(11,14,20,.65))] backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="hidden sm:flex absolute inset-0 items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className={`${shell} w-full max-w-[900px] p-5 relative`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold">{initial ? "Edit Insight" : "New Insight"}</h3>
            <button className={iconBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short, punchy title"
              className="px-3 py-2 rounded-[12px] bg-white/5 border border-white/10"
            />
            <Dropdown
              label="Type"
              value={type}
              onChange={setType}
              items={["Lesson", "Principle", "Action"]}
            />
            <div className="md:col-span-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What did you learn? What rule will you apply next session?"
                className="w-full px-3 py-2 rounded-[12px] bg-white/5 border border-white/10 min-h-[140px]"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-300 opacity-80">Impact</span>
              <ImpactStars value={impact} onChange={setImpact} />
            </div>

            <TradeMultiSelect trades={trades} selected={linked} onChange={setLinked} />

            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <div className={`${pill} flex-1`}>
                  <Tag size={14} className="opacity-70" />
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Add tag… (press Enter)"
                    className="bg-transparent outline-none flex-1"
                  />
                </div>
                <button className={subtle} onClick={() => addTag(tagInput)}>Add</button>
              </div>
              <TagChips tags={tags} />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button onClick={onClose} className={subtle}>Cancel</button>
            <button
              onClick={async () => {
                if (!title.trim()) return;
                setSaving(true);
                await onSave({
                  ...initial,
                  title,
                  content,
                  tags,
                  type,
                  impact,
                  linked_trade_ids: linked,
                });
                setSaving(false);
                onClose();
              }}
              className={cta}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{initial ? "Save changes" : "Save Insight"}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile bottom sheet */}
      <div className="sm:hidden absolute inset-x-0 bottom-0 p-3">
        <div className={`${shell} rounded-t-[24px] p-4`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[15px] font-semibold">{initial ? "Edit Insight" : "New Insight"}</h3>
            <button className={iconBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short, punchy title"
              className="px-3 py-2 rounded-[12px] bg-white/5 border border-white/10"
            />
            <Dropdown label="Type" value={type} onChange={setType} items={["Lesson", "Principle", "Action"]} />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you learn?"
              className="w-full px-3 py-2 rounded-[12px] bg-white/5 border border-white/10 min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300 opacity-80">Impact</span>
              <ImpactStars value={impact} onChange={setImpact} />
            </div>
            <TradeMultiSelect trades={trades} selected={linked} onChange={setLinked} />
            <div className="flex items-center gap-2">
              <div className={`${pill} flex-1`}>
                <Tag size={14} className="opacity-70" />
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Add tag… (press Enter)"
                  className="bg-transparent outline-none flex-1"
                />
              </div>
              <button className={subtle} onClick={() => addTag(tagInput)}>Add</button>
            </div>
            <TagChips tags={tags} />
            <div className="flex items-center justify-end gap-2">
              <button onClick={onClose} className={subtle}>Cancel</button>
              <button
                onClick={async () => {
                  if (!title.trim()) return;
                  setSaving(true);
                  await onSave({
                    ...initial,
                    title,
                    content,
                    tags,
                    type,
                    impact,
                    linked_trade_ids: linked,
                  });
                  setSaving(false);
                  onClose();
                }}
                className={cta}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ Card ============================ */
function InsightCard({ item, onEdit, onDelete, tradesById }) {
  const links = (item.linked_trade_ids || []).map((id) => tradesById[id]).filter(Boolean);

  return (
    <motion.div
      layout
      layoutId={`insight-${item.id}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={`${cardGlass} p-4 group`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide opacity-70">{item.type}</div>
          <h4 className="text-[15px] font-semibold truncate">{item.title}</h4>
        </div>
        <div className="flex items-center gap-1">
          <button className={iconBtn} onClick={() => onEdit(item)} title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button className={iconBtn} onClick={() => onDelete(item.id)} title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <TagChips tags={item.tags} />

      {item.content ? (
        <p className="mt-3 text-sm opacity-85 leading-relaxed whitespace-pre-wrap">{item.content}</p>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={14}
              className={n <= (item.impact || 0) ? "fill-yellow-400 text-yellow-400" : "text-zinc-600"}
            />
          ))}
        </div>
        <span className="text-[11px] text-zinc-400">
          Updated {new Date(item.updated_at).toLocaleDateString()}
        </span>
      </div>

      {links.length ? (
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wide opacity-70 mb-1">Linked trades</div>
          <div className="flex flex-wrap gap-1">
            {links.map((t) => {
  const pnl = Number(t.pnl ?? 0);
  return (
    <span
      key={t.__id}
      className={`px-2 py-0.5 text-[11px] rounded-full border ${pnlChipClass(pnl)}`}
    >
      {t.symbol ?? "—"} • {pnl.toFixed(2)}
    </span>
  );
})}

          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

/* ============================ Main ============================ */
export default function InsightsTab({ trades = [], journal }) {
  // filters
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [tag, setTag] = useState("");

  // data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function refresh() {
    setLoading(true);
    const data = await listInsights({ q, type, tag });
    setRows(data);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line
  }, [q, type, tag]);

  const allTags = useMemo(
    () => Array.from(new Set(rows.flatMap((r) => r.tags || []))).slice(0, 30),
    [rows]
  );

  // trade map for chip rendering
  const tradesById = useMemo(() => {
    const map = {};
    trades.forEach((t) => {
      const id = String(t.id ?? t.trade_id ?? `${t.symbol}-${t.entry_time}`);
      map[id] = { ...t, __id: id };
    });
    return map;
  }, [trades]);

  const toolbar = (
    <div className="flex flex-wrap gap-2 w-full">
      <div className={`${pill} w-full sm:w-[280px]`}>
        <Search size={16} className="opacity-70" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search insights, tags, text…"
          className="bg-transparent outline-none flex-1"
        />
      </div>
      <Dropdown label="Type" value={type} onChange={setType} items={["Any", "Lesson", "Principle", "Action"]} />
      <Dropdown label="Tag" value={tag} onChange={setTag} items={["Any", ...allTags]} />
      <button
        className={`${cta} ml-auto`}
        onClick={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        <Plus size={16} />
        New Insight
      </button>
    </div>
  );

  return (
    <LayoutGroup>
      <div className="space-y-6">
        {/* HERO */}
        <div className={`${shell} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Turn sessions into{" "}
                <span className="mx-1 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300">
                  repeatable edge
                </span>
              </h2>
              <p className="text-sm text-zinc-300/90 mt-2">
                Write the lesson, tag it, and link the trades it came from. Promote big ones into rules.
              </p>
            </div>
            <button
              className={`${cta} hidden sm:inline-flex`}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus size={16} />
              New Insight
            </button>
          </div>
        </div>

        {/* STICKY TOOLBAR */}
        <div className={`${shell} p-4 sticky top-[72px] z-20`}>{toolbar}</div>

        {/* LIST */}
        <div className={`${shell} p-4`}>
          {loading ? (
            <div className="py-12 text-center opacity-70">
              <Loader2 className="w-5 h-5 inline animate-spin" /> Loading…
            </div>
          ) : rows.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence initial={false}>
                {rows.map((x) => (
                  <InsightCard
                    key={x.id}
                    item={x}
                    onEdit={(it) => { setEditing(it); setOpen(true); }}
                    onDelete={async (id) => { await removeInsight(id); refresh(); }}
                    tradesById={tradesById}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-12 text-center opacity-60">No insights yet. Add one above.</div>
          )}
        </div>

        <InsightModal
          open={open}
          initial={editing}
          onClose={() => setOpen(false)}
          onSave={async (payload) => {
            await upsertInsight(payload);
            await refresh();
          }}
          trades={trades}
        />
      </div>
    </LayoutGroup>
  );
}
