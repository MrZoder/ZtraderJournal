// src/components/IdeaBoardPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Pin, PinOff, Image as ImageIcon, Link2, Tag, StickyNote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function NoteCard({ note, onChange, onDelete, allTrades = [] }) {
  const set = (patch) => onChange({ ...note, ...patch });
  const fileRef = useRef(null);

  const ring = {
    mint:  "from-[rgba(0,255,163,0.18)] to-[rgba(0,255,163,0.06)] ring-[rgba(0,255,163,0.35)]",
    blue:  "from-sky-500/20 to-sky-400/10 ring-sky-400/40",
    purple:"from-fuchsia-500/20 to-purple-500/10 ring-fuchsia-400/40",
    orange:"from-amber-500/25 to-orange-500/10 ring-amber-400/40",
    gray:  "from-zinc-700/60 to-zinc-800/40 ring-zinc-600/40",
  }[note.color || "mint"];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`rounded-2xl ring-1 p-3 sm:p-4 bg-gradient-to-b ${ring} backdrop-blur-lg shadow-lg`}
    >
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="w-4 h-4 text-[rgba(0,255,163,0.9)]" />
        <input
          value={note.title || ""}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Idea title…"
          className="flex-1 bg-transparent outline-none font-semibold text-teal-100 placeholder:text-teal-300/40"
        />
        <button
          onClick={() => set({ pinned: !note.pinned })}
          className={`px-2 py-1 rounded-lg transition ${note.pinned ? "bg-[rgba(0,255,163,0.2)] text-teal-100 ring-1 ring-[rgba(0,255,163,0.35)]" : "text-gray-300 hover:text-teal-200 hover:bg-white/5"}`}
          title={note.pinned ? "Unpin" : "Pin"}
        >
          {note.pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
        </button>
        <button onClick={() => onDelete(note.id)} className="text-red-300/90 hover:text-red-200 hover:bg-white/5 px-2 py-1 rounded-lg transition" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <textarea
        value={note.body || ""}
        onChange={(e) => set({ body: e.target.value })}
        placeholder="Notes, pattern logic, if/then plan, entry triggers…"
        rows={4}
        className="w-full bg-black/10 border border-white/5 focus:border-[rgba(0,255,163,0.35)] outline-none rounded-xl p-3 text-sm text-gray-100 placeholder:text-gray-400 resize-y"
      />

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-teal-300" />
          <input
            value={(note.tags || []).join(", ")}
            onChange={(e) => set({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
            placeholder="Tags (liquidity grab, OB, NYO)"
            className="flex-1 bg-black/10 border border-white/5 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[rgba(0,255,163,0.35)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-teal-300" />
          <select
            value={note.linkedTradeId || ""}
            onChange={(e) => set({ linkedTradeId: e.target.value || null })}
            className="flex-1 bg-black/10 border border-white/5 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[rgba(0,255,163,0.35)]"
          >
            <option value="">Link a trade (optional)</option>
            {(allTrades || []).map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.symbol || "—"} • {t.date || ""} • ${t.pnl}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10">
          <ImageIcon className="w-4 h-4" /> Add screenshot
        </button>
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = URL.createObjectURL(f);
            set({ attachments: [...(note.attachments || []), { name: f.name, url }] });
            e.target.value = "";
          }}
        />

        <div className="ml-auto flex items-center gap-1.5">
          {["mint","blue","purple","orange","gray"].map((c) => (
            <button
              key={c}
              onClick={() => set({ color: c })}
              className={`w-5 h-5 rounded-full ring-2 ${c==="mint"&&"bg-[rgba(0,255,163,0.6)] ring-[rgba(0,255,163,0.7)]"} ${c==="blue"&&"bg-sky-400/60 ring-sky-400/70"} ${c==="purple"&&"bg-fuchsia-400/60 ring-fuchsia-400/70"} ${c==="orange"&&"bg-amber-400/70 ring-amber-400/80"} ${c==="gray"&&"bg-zinc-500/60 ring-zinc-400/70"}`}
              title={`Color: ${c}`}
            />
          ))}
        </div>
      </div>

      {note.attachments?.length ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {note.attachments.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden ring-1 ring-white/10" title={a.name}>
              <img src={a.url} alt="" className="w-full h-20 object-cover" />
            </a>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}

export default function IdeaBoardPanel({ data = [], settings = { scratchpad: true }, onChange, onChangeSettings, allTrades = [] }) {
  const [notes, setNotes] = useState(data);
  const [scratchpad, setScratchpad] = useState(!!settings?.scratchpad);

  useEffect(() => setNotes(data || []), [data]);
  useEffect(() => setScratchpad(!!settings?.scratchpad), [settings]);

  // auto-clear non-pinned at new day
  useEffect(() => {
    const key = "ztrader_ideaBoard_lastDay";
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem(key);
    if (scratchpad && last && last !== today) {
      const kept = (notes || []).filter((n) => n.pinned);
      setNotes(kept);
      onChange?.(kept);
    }
    localStorage.setItem(key, today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scratchpad]);

  const createNote = () => {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    const next = [{ id, title: "", body: "", color: "mint", tags: [], pinned: false, attachments: [], linkedTradeId: null, createdAt: new Date().toISOString() }, ...notes];
    setNotes(next);
    onChange?.(next);
  };
  const updateNote = (patch) => {
    const next = notes.map((n) => (n.id === patch.id ? patch : n));
    setNotes(next);
    onChange?.(next);
  };
  const deleteNote = (id) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    onChange?.(next);
  };

  const sorted = useMemo(() => {
    return [...(notes || [])].sort((a, b) => (a.pinned === b.pinned ? (b.createdAt || "").localeCompare(a.createdAt || "") : a.pinned ? -1 : 1));
  }, [notes]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="text-[rgba(0,255,163,0.95)] font-semibold">Idea Board</div>
        <div className="text-xs text-gray-400">Scratchpad for setups & patterns</div>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs flex items-center gap-2 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={scratchpad}
              onChange={(e) => { setScratchpad(e.target.checked); onChangeSettings?.({ scratchpad: e.target.checked }); }}
              className="accent-teal-400"
            />
            <span className="text-gray-300">Scratchpad mode</span>
          </label>
          <button onClick={createNote} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(0,255,163,0.18)] text-[rgba(0,255,163,0.95)] border border-[rgba(0,255,163,0.35)] hover:bg-[rgba(0,255,163,0.24)]">
            <Plus className="w-4 h-4" /> New note
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {sorted.map((n) => (
            <NoteCard key={n.id} note={n} onChange={updateNote} onDelete={deleteNote} allTrades={allTrades} />
          ))}
        </motion.div>
      </AnimatePresence>

      {!sorted.length && (
        <div className="rounded-2xl border border-dashed border-[rgba(0,255,163,0.35)] p-8 text-center text-sm text-gray-400">
          No ideas yet. Click <span className="text-teal-300 font-semibold">New note</span> to start capturing setups, screenshots, and tags. Pinned notes survive Scratchpad clears.
        </div>
      )}
    </div>
  );
}
