// src/components/LessonsPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Star, Image as ImageIcon, Trash2, AlertTriangle } from "lucide-react";

const SUGGESTED_TAGS = ["discipline","patience","risk","setup","FOMO","exits","entries","process","planning","mindset"];
const KEYWORD_TAG_MAP = [
  { re: /\brisk\b|\bstop\b|\bstops\b|\bmax\s*loss\b/i, tag: "risk" },
  { re: /\bpatient|patience|wait(ed)?\b/i, tag: "patience" },
  { re: /\bdiscipline|disciplined\b/i, tag: "discipline" },
  { re: /\bchase|fomo\b/i, tag: "FOMO" },
  { re: /\bentry|entries|execution\b/i, tag: "entries" },
  { re: /\bexit|exits|take\s*profit|tp\b/i, tag: "exits" },
  { re: /\bsetup(s)?\b/i, tag: "setup" },
  { re: /\bprocess|routine|checklist\b/i, tag: "process" },
  { re: /\bplan|planning\b/i, tag: "planning" },
  { re: /\bmindset|emotion|emotional\b/i, tag: "mindset" },
];

const get = (o, p, f) => p.split(".").reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), o) ?? f;
const setDeep = (obj, path, value) => {
  const parts = path.split(".");
  const clone = { ...(obj || {}) };
  let curr = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    curr[p] = { ...(curr[p] || {}) };
    curr = curr[p];
  }
  curr[parts[parts.length - 1]] = value;
  return clone;
};

export default function LessonsPanel({
  data = {},
  onChange,
  pnl,
  onUploadImages, // (FileList) => Promise<[{id,name,url,type}]>
}) {
  // Local mirrors (no per-keystroke saving)
  const [whatWentWellLocal, setWhatWentWellLocal] = useState(get(data, "whatWentWell", ""));
  const [toImproveLocal,    setToImproveLocal]    = useState(get(data, "toImprove", ""));
  const [notesLocal,        setNotesLocal]        = useState(get(data, "notes", ""));
  const [takeawayLocal,     setTakeawayLocal]     = useState(get(data, "takeaway", ""));
  const [tagsLocal,         setTagsLocal]         = useState(get(data, "tags", []));
  const [isHighlightLocal,  setIsHighlightLocal]  = useState(!!get(data, "isHighlight", false));

  const attachments = get(data, "attachments", []);

  useEffect(() => {
    setWhatWentWellLocal(get(data, "whatWentWell", ""));
    setToImproveLocal(get(data, "toImprove", ""));
    setNotesLocal(get(data, "notes", ""));
    setTakeawayLocal(get(data, "takeaway", ""));
    setTagsLocal(get(data, "tags", []));
    setIsHighlightLocal(!!get(data, "isHighlight", false));
  }, [data]);

  const pushField = (path, value) => onChange?.(setDeep(data, path, value));

  // Auto-suggest (based on local text)
  const combinedText = `${whatWentWellLocal}\n${toImproveLocal}\n${notesLocal}\n${takeawayLocal}`.toLowerCase();
  const suggestedTags = useMemo(() => {
    const found = new Set();
    KEYWORD_TAG_MAP.forEach(({ re, tag }) => re.test(combinedText) && found.add(tag));
    return Array.from(found).filter(t => !(tagsLocal || []).includes(t));
  }, [combinedText, tagsLocal]);

  // Tags
  const addTag = (t) => {
    const set = new Set(tagsLocal || []);
    set.add(t);
    const next = Array.from(set);
    setTagsLocal(next);
    pushField("tags", next);
  };
  const toggleTag = (t) => {
    const set = new Set(tagsLocal || []);
    set.has(t) ? set.delete(t) : set.add(t);
    const next = Array.from(set);
    setTagsLocal(next);
    pushField("tags", next);
  };
  const clearTag = (t) => {
    const next = (tagsLocal || []).filter(x => x !== t);
    setTagsLocal(next);
    pushField("tags", next);
  };

  // Uploads
  const fileInputRef = useRef(null);
  const onPickFiles = () => fileInputRef.current?.click();
  const handleUpload = async (files) => {
    if (!files?.length || !onUploadImages) return;
    const uploaded = await onUploadImages(files);
    if (uploaded?.length) {
      const next = [...(attachments || []), ...uploaded];
      onChange?.(setDeep(data, "attachments", next));
    }
  };
  const removeAttachment = (id) => {
    onChange?.(setDeep(data, "attachments", (attachments || []).filter(a => a.id !== id)));
  };

  const showNudge = typeof pnl === "number" && pnl < 0 &&
    !(tagsLocal || []).some(t => t === "risk" || t === "discipline");

  return (
    <div className="space-y-6">
      {/* Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-teal-300 mb-1">What went well?</h3>
          <textarea
            rows={5}
            value={whatWentWellLocal}
            onChange={(e) => setWhatWentWellLocal(e.target.value)}
            onBlur={(e) => pushField("whatWentWell", e.target.value)}
            placeholder="E.g., waited for retests, sized properly, honored stops…"
            className="w-full rounded-lg bg-[#12161d] border border-zinc-700 focus:border-teal-400 outline-none px-3 py-2 text-sm text-gray-100"
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-teal-300 mb-1">What to improve?</h3>
          <textarea
            rows={5}
            value={toImproveLocal}
            onChange={(e) => setToImproveLocal(e.target.value)}
            onBlur={(e) => pushField("toImprove", e.target.value)}
            placeholder="E.g., avoid chasing, be stricter with A+ setups, reduce size after 2 losses…"
            className="w-full rounded-lg bg-[#12161d] border border-zinc-700 focus:border-teal-400 outline-none px-3 py-2 text-sm text-gray-100"
          />
        </div>
      </div>

      {showNudge && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
          <div className="text-xs text-yellow-100">
            Red day detected. Consider adding <span className="font-semibold">risk</span> or <span className="font-semibold">discipline</span> tags and reflecting on risk management and decision quality.
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <h3 className="text-sm font-semibold text-teal-300 mb-1">Tags</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {SUGGESTED_TAGS.map((t) => {
            const active = (tagsLocal || []).includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                  active ? "bg-teal-500 text-gray-900" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        {suggestedTags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs text-gray-400">Suggested:</span>
            {suggestedTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addTag(t)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
              >
                + {t}
              </button>
            ))}
          </div>
        )}
        {(tagsLocal || []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {(tagsLocal || []).map(t => (
              <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-teal-600 text-gray-900">
                {t}
                <button type="button" onClick={() => clearTag(t)} className="opacity-80 hover:opacity-100" title="Remove">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Takeaway */}
      <div>
        <h3 className="text-sm font-semibold text-teal-300 mb-1">Actionable takeaway for tomorrow</h3>
        <input
          value={takeawayLocal}
          onChange={(e) => setTakeawayLocal(e.target.value)}
          onBlur={(e) => pushField("takeaway", e.target.value)}
          placeholder="E.g., “Trade only first pullbacks; no anticipations.”"
          className="w-full rounded-lg bg-[#12161d] border border-zinc-700 focus:border-teal-400 outline-none px-3 py-2 text-sm text-gray-100"
        />
      </div>

      {/* Evidence: Screenshots */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-teal-300">Screenshots / Evidence</h3>
          <button
            type="button"
            onClick={onPickFiles}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600 text-sm text-gray-900 font-semibold hover:bg-teal-500"
          >
            <ImageIcon className="w-4 h-4" />
            Add Images
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        {attachments.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No images attached.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {attachments.map(att => (
              <div key={att.id} className="relative group rounded-lg overflow-hidden border border-teal-700/40 bg-[#0e1319]">
                <img src={att.url} alt={att.name} className="w-full h-28 object-cover" />
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <a href={att.url} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-gray-900/80 text-[10px]">View</a>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="p-1 rounded bg-red-600/80 hover:bg-red-500"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <div className="px-2 py-1 text-[10px] text-gray-400 truncate">{att.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Highlight toggle */}
      <div className="flex items-center justify-between rounded-lg border border-teal-500/30 bg-[#0f1620] px-3 py-2">
        <div className="flex items-center gap-2">
          <Star className={`w-4 h-4 ${isHighlightLocal ? "text-yellow-400" : "text-gray-400"}`} />
          <span className="text-sm text-gray-200">Mark this session as a Highlight</span>
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !isHighlightLocal;
            setIsHighlightLocal(next);
            pushField("isHighlight", next);
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
            isHighlightLocal ? "bg-yellow-400 text-gray-900" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {isHighlightLocal ? "Highlighted" : "Mark Highlight"}
        </button>
      </div>

      {/* Additional notes */}
      <div>
        <h3 className="text-sm font-semibold text-teal-300 mb-1">Additional Notes</h3>
        <textarea
          rows={5}
          value={notesLocal}
          onChange={(e) => setNotesLocal(e.target.value)}
          onBlur={(e) => pushField("notes", e.target.value)}
          placeholder="Any observations, patterns, or context worth remembering…"
          className="w-full rounded-lg bg-[#12161d] border border-zinc-700 focus:border-teal-400 outline-none px-3 py-2 text-sm text-gray-100"
        />
      </div>
    </div>
  );
}
