// src/components/ReviewWorkspace.jsx
import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Save, Target as TargetIcon, Trash2, Plus } from "lucide-react";

/* ReviewWorkspace — mobile-first, graceful on wide screens
   - Modes: split | think | notes
   - Sticky header on small screens
*/

export default function ReviewWorkspace({
  date,
  session,
  notes,
  setNotes,
  entries,
  setEntries,
}) {
  const [view, setView] = useState("split");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = (q || "").toLowerCase();
    if (!qq) return entries || [];
    return (entries || []).filter((e) => {
      const t = (e.text || "").toLowerCase();
      const tags = (e.tags || []).join(" ").toLowerCase();
      return (
        t.includes(qq) ||
        tags.includes(qq) ||
        String(e.category || "").toLowerCase().includes(qq)
      );
    });
  }, [entries, q]);

  const onAddEntry = (payload) =>
    setEntries((p) => [{ id: uid(), ts: Date.now(), ...payload }, ...(p || [])]);
  const onEditEntry = (id, next) =>
    setEntries((p) => (p || []).map((e) => (e.id === id ? { ...e, ...next } : e)));
  const onDeleteEntry = (id) =>
    setEntries((p) => (p || []).filter((e) => e.id !== id));
  const sendToNotes = (e) => {
    const line =
      "- " +
      dayjs(e.ts).format("HH:mm") +
      " [" +
      (e.category || "Note") +
      "] " +
      e.text;
    setNotes((n) => (n ? n + "\n" + line : line));
  };

  return (
    <div className="flex h-full flex-col">
      {/* sticky toolbar (mobile-friendly) */}
      <div className="sticky top-2 z-10 mb-3 rounded-xl border border-white/10 bg-zinc-900/70 backdrop-blur p-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* segmented control */}
          <div className="flex w-full overflow-x-auto rounded-lg border border-white/10 bg-black/20 p-1 sm:w-auto">
            {["split", "think", "notes"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={
                  "min-w-[88px] rounded-md px-3 py-1.5 text-sm font-medium transition " +
                  (view === v
                    ? "bg-emerald-500 text-black"
                    : "text-zinc-300 hover:bg-white/5")
                }
              >
                {v === "split" ? "Split" : v === "think" ? "Think" : "Notes"}
              </button>
            ))}
          </div>

          {/* search */}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search entries or #tags"
            className="w-full rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none sm:max-w-xs"
          />
        </div>
      </div>

      {/* content */}
      {view === "split" && (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          <ThinkPanel
            entries={filtered}
            onAddEntry={onAddEntry}
            onEditEntry={onEditEntry}
            onDeleteEntry={onDeleteEntry}
            onSendToNotes={sendToNotes}
          />
          <NotesPanelPro
            value={notes}
            onChange={setNotes}
            session={session}
            date={date}
          />
        </div>
      )}

      {view === "think" && (
        <ThinkPanel
          entries={filtered}
          onAddEntry={onAddEntry}
          onEditEntry={onEditEntry}
          onDeleteEntry={onDeleteEntry}
          onSendToNotes={sendToNotes}
        />
      )}

      {view === "notes" && (
        <NotesPanelPro
          value={notes}
          onChange={setNotes}
          session={session}
          date={date}
        />
      )}
    </div>
  );
}

/* ---------- Think Panel ---------- */
function ThinkPanel({
  entries,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onSendToNotes,
}) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState("Idea"); // Idea | Plan | Entry | Exit | Mgmt
  const [tagText, setTagText] = useState("");

  const add = () => {
    const v = text.trim();
    if (!v) return;
    const tags = (tagText || "")
      .split(" ")
      .map((s) => s.replace("#", "").trim())
      .filter(Boolean);
    onAddEntry({ text: v, category: cat, tags, pinned: false });
    setText("");
    setTagText("");
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-zinc-900/60 p-3">
      {/* composer */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-zinc-200 sm:w-36"
        >
          {["Idea", "Plan", "Entry", "Exit", "Mgmt"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey ? (e.preventDefault(), add()) : null
          }
          placeholder="Type a thought… 'Wait for NY retest at ONH'"
          className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none"
        />

        <input
          value={tagText}
          onChange={(e) => setTagText(e.target.value)}
          placeholder="tags: ny pullback dxy"
          className="rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none sm:w-52"
        />

        <button
          onClick={add}
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-500/90 px-3 py-2 font-semibold text-zinc-900 hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* list */}
      <div className="custom-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto">
        {(!entries || entries.length === 0) && (
          <div className="text-xs text-zinc-500">No entries yet.</div>
        )}

        <ul className="space-y-2">
          {(entries || []).map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-white/10 bg-zinc-900/70 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      "rounded-md border px-2 py-0.5 text-xs " +
                      badgeClass(e.category)
                    }
                  >
                    {e.category || "Note"}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {dayjs(e.ts).format("HH:mm:ss")}
                  </span>
                  {e.pinned ? (
                    <span className="text-[11px] text-emerald-400">Pinned</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="icon-btn"
                    title="Send to Notes"
                    onClick={() => onSendToNotes(e)}
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    className="icon-btn"
                    title="Pin"
                    onClick={() => onEditEntry(e.id, { pinned: !e.pinned })}
                  >
                    <TargetIcon className="h-4 w-4" />
                  </button>
                  <button
                    className="icon-btn"
                    title="Delete"
                    onClick={() => onDeleteEntry(e.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                {e.text}
              </p>

              {!!(e.tags && e.tags.length) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.tags.map((t, i) => (
                    <span
                      key={String(i)}
                      className="rounded-md border border-zinc-700 bg-zinc-800/70 px-2 py-0.5 text-[11px] text-zinc-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function badgeClass(cat) {
  if (cat === "Plan")
    return "bg-blue-500/15 text-blue-300 border-blue-400/30";
  if (cat === "Entry")
    return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
  if (cat === "Exit")
    return "bg-rose-500/15 text-rose-300 border-rose-400/30";
  if (cat === "Mgmt")
    return "bg-amber-500/15 text-amber-300 border-amber-400/30";
  return "bg-violet-500/15 text-violet-300 border-violet-400/30";
}

/* ---------- Notes Panel Pro ---------- */
function NotesPanelPro({ value, onChange, session, date }) {
  const [showPreview, setShowPreview] = useState(true);

  const insert = (snippet) => {
    const v = value || "";
    const next = v ? v + "\n" + snippet : snippet;
    onChange(next);
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-zinc-900/60 p-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-lg border border-white/10 bg-zinc-900/70 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          onClick={() => insert("**bold**")}
        >
          Bold
        </button>
        <button
          className="rounded-lg border border-white/10 bg-zinc-900/70 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          onClick={() => insert("_italics_")}
        >
          Italics
        </button>
        <button
          className="rounded-lg border border-white/10 bg-zinc-900/70 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          onClick={() => insert("- bullet")}
        >
          Bullet
        </button>
        <div className="h-5 w-px bg-white/10" />
        <button
          className={
            "rounded-lg border px-2.5 py-1.5 text-xs " +
            (showPreview
              ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
              : "border-white/10 bg-zinc-900/70 text-zinc-300 hover:bg-white/5")
          }
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      {/* editor + preview
          - single column on mobile
          - side-by-side from md+  */}
      <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            "Plan for " +
            session +
            " — " +
            dayjs(date).format("ddd") +
            ". Use markdown: **bold**, _italics_, - bullets"
          }
          className="custom-scrollbar h-full min-h-[200px] w-full rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-zinc-200 placeholder-zinc-500 focus:outline-none"
        />
        {showPreview ? (
          <div className="custom-scrollbar h-full min-h-[200px] overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/50 p-3">
            <div dangerouslySetInnerHTML={{ __html: mdLite(value || "") }} />
          </div>
        ) : (
          <div className="h-full min-h-[200px] rounded-xl border border-transparent" />
        )}
      </div>

      <div className="mt-2 text-[11px] text-zinc-500">
        Autosaved locally. Export from the dashboard toolbar when ready.
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function mdLite(src) {
  try {
    let s = String(src);
    s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/_(.+?)_/g, "<em>$1</em>");
    const lines = s.split("\n");
    const out = [];
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      if (L.trim().indexOf("- ") === 0) {
        if (!inList) {
          inList = true;
          out.push("<ul>");
        }
        out.push("<li>" + L.trim().slice(2) + "</li>");
      } else {
        if (inList) {
          out.push("</ul>");
          inList = false;
        }
        if (L.trim().length) out.push("<p>" + L + "</p>");
        else out.push("<br/>");
      }
    }
    if (inList) out.push("</ul>");
    return out.join("");
  } catch {
    return "<p>" + (src || "") + "</p>";
  }
}
