import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  Search,
  Tag,
  Star,
  ChevronDown,
  X,
  MoveRight,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { listIdeas, upsertIdea, removeIdea } from "../utils/ideaService";

/* ========= GLASS TOKENS (keep original bg; frost the elements) ========= */
const shell =
  "rounded-[22px] border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,.35)]";
const colShell =
  "rounded-[22px] border border-white/10 bg-white/[0.05] backdrop-blur-lg";
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

/* ============================ UTILITIES ============================ */
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
            className={`${shell} absolute right-0 mt-2 min-w-[200px] p-2 z-30`}
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

function TagInput({ value = [], onChange }) {
  const [text, setText] = useState("");
  function commit(v) {
    const t = v.trim();
    if (!t) return;
    if (!value.includes(t)) onChange([...value, t]);
    setText("");
  }
  return (
    <div className={`${pill} min-h-[44px] flex-wrap`}>
      {value.map((t) => (
        <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-[12px] flex items-center gap-1">
          <Tag size={12} /> {t}
          <button
            className="ml-1 text-zinc-400 hover:text-white"
            onClick={() => onChange(value.filter((x) => x !== t))}
            aria-label={`Remove tag ${t}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit(text);
          } else if (e.key === "Backspace" && !text && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        placeholder={value.length ? "" : "Add tags…"}
        className="bg-transparent outline-none flex-1 min-w-[120px] placeholder:text-zinc-400"
      />
    </div>
  );
}

function PriorityStars({ value = 3, onChange }) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange?.(n)} className={iconBtn} title={`Priority ${n}`}>
          <Star size={16} className={n <= value ? "fill-yellow-400 text-yellow-400" : "text-zinc-500"} />
        </button>
      ))}
    </div>
  );
}

/* ====================== MOBILE BOTTOM SHEET: Move To… ====================== */
function MoveSheet({ open, onClose, onSelect }) {
  if (!open) return null;
  return (
    <div className="sm:hidden fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ y: 320 }}
        animate={{ y: 0 }}
        exit={{ y: 320 }}
        transition={{ type: "spring", stiffness: 420, damping: 35 }}
        className="absolute inset-x-0 bottom-0 p-3"
      >
        <div className={`${shell} rounded-t-[24px] p-3`}>
          <h4 className="text-[15px] font-semibold px-1 mb-2">Move to…</h4>
          {["Backlog", "Explore", "Ready"].map((s) => (
            <button key={s} onClick={() => onSelect(s)} className="w-full text-left px-3 py-3 rounded-[12px] hover:bg-white/10">
              {s}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ========================= CREATE / EDIT MODAL ========================= */
function IdeaModal({ open, initial, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [tags, setTags] = useState(initial?.tags || []);
  const [status, setStatus] = useState(initial?.status || "Backlog");
  const [priority, setPriority] = useState(initial?.priority || 3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setDescription(initial?.description || "");
      setTags(initial?.tags || []);
      setStatus(initial?.status || "Backlog");
      setPriority(initial?.priority || 3);
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-[radial-gradient(90%_120%_at_50%_-10%,rgba(20,24,32,.7),rgba(11,14,20,.65))] backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Desktop */}
      <div className="hidden sm:flex absolute inset-0 items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className={`${shell} w-full max-w-[860px] p-5 relative`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h3 className="text-[15px] font-semibold">{initial ? "Edit Idea" : "New Idea"}</h3>
            </div>
            <button className={iconBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Idea title"
              className="px-3 py-2 rounded-[12px] bg-white/5 border border-white/10"
            />
            <Dropdown label="Status" value={status} onChange={setStatus} items={["Backlog", "Explore", "Ready"]} />
            <div className="md:col-span-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description / hypothesis"
                className="w-full px-3 py-2 rounded-[12px] bg-white/5 border border-white/10 min-h-[120px]"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-300 opacity-80">Priority</span>
              <PriorityStars value={priority} onChange={setPriority} />
            </div>
            <TagInput value={tags} onChange={setTags} />
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button onClick={onClose} className={subtle}>Cancel</button>
            <button
              onClick={async () => {
                if (!title.trim()) return;
                setSaving(true);
                await onSave({ ...initial, title, description, tags, status, priority });
                setSaving(false);
                onClose();
              }}
              className={cta}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{initial ? "Save changes" : "Add Idea"}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile sheet */}
      <div className="sm:hidden absolute inset-x-0 bottom-0 p-3">
        <div className={`${shell} rounded-t-[24px] p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h3 className="text-[15px] font-semibold">{initial ? "Edit Idea" : "New Idea"}</h3>
            </div>
            <button className={iconBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Idea title"
              className="px-3 py-2 rounded-[12px] bg-white/5 border border-white/10"
            />
            <Dropdown label="Status" value={status} onChange={setStatus} items={["Backlog", "Explore", "Ready"]} />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description / hypothesis"
              className="w-full px-3 py-2 rounded-[12px] bg-white/5 border border-white/10 min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300 opacity-80">Priority</span>
              <PriorityStars value={priority} onChange={setPriority} />
            </div>
            <TagInput value={tags} onChange={setTags} />
            <div className="flex items-center justify-end gap-2">
              <button onClick={onClose} className={subtle}>Cancel</button>
              <button
                onClick={async () => {
                  if (!title.trim()) return;
                  setSaving(true);
                  await onSave({ ...initial, title, description, tags, status, priority });
                  setSaving(false);
                  onClose();
                }}
                className={cta}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>{initial ? "Save" : "Add"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== CARD ============================== */
function IdeaCard({ item, onEdit, onDelete, onBeginMoveMobile, draggingId }) {
  // HTML5 drag for desktop (we keep it for simple hit testing with columns)
  function handleDragStart(e) {
    e.dataTransfer.setData("text/idea-id", item.id);
    e.dataTransfer.effectAllowed = "move";
  }

  const isDragging = draggingId === item.id;

  return (
    <motion.div
      layout
      layoutId={`card-${item.id}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDragging ? 1.03 : 1,
        boxShadow: isDragging
          ? "0 12px 40px rgba(34,211,238,.35), 0 0 0 1px rgba(34,211,238,.25) inset"
          : "0 0 0 rgba(0,0,0,0)",
      }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={`${cardGlass} p-4 group cursor-grab active:cursor-grabbing`}
      draggable
      onDragStart={handleDragStart}
      title="Drag to move between stages"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide opacity-70">{item.status}</div>
          <h4 className="text-[15px] font-semibold truncate">{item.title}</h4>
        </div>
        <div className="flex items-center gap-1">
          {/* Mobile: open move sheet */}
          <button className={`${iconBtn} sm:hidden`} onClick={() => onBeginMoveMobile(item)}>
            <MoveRight className="w-4 h-4" />
          </button>
          <button className={iconBtn} onClick={() => onEdit(item)} title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button className={iconBtn} onClick={() => onDelete(item.id)} title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {item.tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <span key={t} className="px-2 py-0.5 text-[11px] rounded-full bg-white/10 flex items-center gap-1">
              <Tag size={12} /> {t}
            </span>
          ))}
        </div>
      ) : null}

      {item.description ? (
        <p className="mt-3 text-sm opacity-85 leading-relaxed">{item.description}</p>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={14}
              className={n <= (item.priority || 0) ? "fill-yellow-400 text-yellow-400" : "text-zinc-600"}
            />
          ))}
        </div>
        <span className="text-[11px] text-zinc-400">
          Updated {new Date(item.updated_at).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
}

/* ============================== COLUMN ============================== */
function KanbanColumn({
  title,
  stage,
  items,
  onEdit,
  onDelete,
  onDropIdea,
  onDragEnterColumn,
  onDragLeaveColumn,
  highlight,
  draggingId,
  setMoveSheetFor,
}) {
  function handleDragOver(e) {
    e.preventDefault();
  }
  function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/idea-id");
    if (id) onDropIdea(id, stage);
  }

  return (
    <motion.div
      layout
      className={`${colShell} p-3 sm:p-4 relative ${
        highlight ? "ring-2 ring-cyan-300/40 animate-pulse" : ""
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={() => onDragEnterColumn(stage)}
      onDragLeave={() => onDragLeaveColumn(stage)}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[11px] uppercase tracking-wide opacity-70">{title}</div>
          <div className="text-[12px] text-zinc-400">{items.length} item{items.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        <div className="space-y-3">
          {items.map((it) => (
            <IdeaCard
              key={it.id}
              item={it}
              onEdit={onEdit}
              onDelete={onDelete}
              onBeginMoveMobile={(item) => setMoveSheetFor(item)}
              draggingId={draggingId}
            />
          ))}
          {!items.length && (
            <motion.div
              layout
              className={`${cardGlass} py-8 text-center text-sm text-zinc-400`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No items
            </motion.div>
          )}
        </div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ================================ MAIN ================================ */
export default function IdeaInboxTab() {
  // filters
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState(0);

  // data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // modals
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [moveFor, setMoveFor] = useState(null);

  // drag/hover state for visual feedback
  const [draggingId, setDraggingId] = useState(null);
  const [hoverStage, setHoverStage] = useState("");

  async function refresh() {
    setLoading(true);
    const data = await listIdeas({ q, priority });
    setRows(data);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line
  }, [q, priority]);

  const grouped = useMemo(() => {
    const map = { Backlog: [], Explore: [], Ready: [] };
    for (const r of rows) (map[r.status] || map.Backlog).push(r);
    return map;
  }, [rows]);

  async function onDropIdea(id, nextStage) {
    const target = rows.find((r) => r.id === id);
    if (!target || target.status === nextStage) {
      setDraggingId(null);
      setHoverStage("");
      return;
    }
    await upsertIdea({ ...target, status: nextStage });
    await refresh();
    setDraggingId(null);
    setHoverStage("");
  }

  // intercept drag start at document level to know which card is active
  useEffect(() => {
    function onDragStart(e) {
      const id = e?.target?.closest?.("[draggable='true']")?.querySelector?.("[data-card-id]")?.dataset?.cardId;
      // fallback: read from dataTransfer (set in card)
      const fromDT = e?.dataTransfer?.getData?.("text/idea-id");
      const found = fromDT || id;
      if (found) setDraggingId(found);
    }
    function onDragEnd() {
      setDraggingId(null);
      setHoverStage("");
    }
    window.addEventListener("dragstart", onDragStart);
    window.addEventListener("dragend", onDragEnd);
    return () => {
      window.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("dragend", onDragEnd);
    };
  }, []);

  const toolbar = (
    <div className="flex flex-wrap gap-2 w-full">
      <div className={`${pill} w-full sm:w-[280px]`}>
        <Search size={16} className="opacity-70" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ideas, tags, notes…"
          className="bg-transparent outline-none flex-1"
        />
      </div>
      <Dropdown
        label="Priority"
        value={priority ? String(priority) : ""}
        onChange={(v) => setPriority(Number(v) || 0)}
        items={["Any", "1", "2", "3", "4", "5"]}
      />
      <button
        className={`${cta} ml-auto`}
        onClick={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        <Sparkles size={16} />
        Add Idea
      </button>
    </div>
  );

  return (
    <LayoutGroup>
      <div className="space-y-6">
        {/* WOW HERO */}
        <div className={`${shell} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Build, test, and{" "}
                <span className="mx-1 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300">
                  promote
                </span>
                killer setups
              </h2>
              <p className="text-sm text-zinc-300/90 mt-2">
                Capture → explore → promote. Drag cards on desktop, or use “Move to…” on mobile.
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
              New Idea
            </button>
          </div>
        </div>

        {/* STICKY TOOLBAR */}
        <div className={`${shell} p-4 sticky top-[72px] z-20`}>{toolbar}</div>

        {/* KANBAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KanbanColumn
            title="Backlog"
            stage="Backlog"
            items={grouped.Backlog}
            onEdit={(it) => { setEditing(it); setOpen(true); }}
            onDelete={async (id) => { await removeIdea(id); refresh(); }}
            onDropIdea={onDropIdea}
            onDragEnterColumn={(s) => setHoverStage(s)}
            onDragLeaveColumn={(s) => s === hoverStage && setHoverStage("")}
            highlight={hoverStage === "Backlog" && !!draggingId}
            draggingId={draggingId}
            setMoveSheetFor={setMoveFor}
          />
          <KanbanColumn
            title="Explore"
            stage="Explore"
            items={grouped.Explore}
            onEdit={(it) => { setEditing(it); setOpen(true); }}
            onDelete={async (id) => { await removeIdea(id); refresh(); }}
            onDropIdea={onDropIdea}
            onDragEnterColumn={(s) => setHoverStage(s)}
            onDragLeaveColumn={(s) => s === hoverStage && setHoverStage("")}
            highlight={hoverStage === "Explore" && !!draggingId}
            draggingId={draggingId}
            setMoveSheetFor={setMoveFor}
          />
          <KanbanColumn
            title="Ready"
            stage="Ready"
            items={grouped.Ready}
            onEdit={(it) => { setEditing(it); setOpen(true); }}
            onDelete={async (id) => { await removeIdea(id); refresh(); }}
            onDropIdea={onDropIdea}
            onDragEnterColumn={(s) => setHoverStage(s)}
            onDragLeaveColumn={(s) => s === hoverStage && setHoverStage("")}
            highlight={hoverStage === "Ready" && !!draggingId}
            draggingId={draggingId}
            setMoveSheetFor={setMoveFor}
          />
        </div>

        {/* MODALS */}
        <IdeaModal
          open={open}
          initial={editing}
          onClose={() => setOpen(false)}
          onSave={async (payload) => {
            await upsertIdea(payload);
            await refresh();
          }}
        />

        {/* MOBILE MOVE SHEET */}
        <AnimatePresence>
          {moveFor && (
            <MoveSheet
              open
              onClose={() => setMoveFor(null)}
              onSelect={async (stage) => {
                await upsertIdea({ ...moveFor, status: stage });
                setMoveFor(null);
                await refresh();
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
