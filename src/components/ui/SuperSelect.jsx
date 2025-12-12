// src/components/ui/SuperSelect.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Search } from "lucide-react";

const glass =
  "rounded-xl border border-white/10 bg-white/6 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,.35)]";

export default function SuperSelect({
  items = [],               // [{value,label,icon?:React,desc?:string,section?:string}]
  value,
  onChange,
  placeholder = "Select…",
  className = "",
  renderLabel,              // (item|undefined) => ReactNode
  searchable = true,
  emptyText = "No results",
  widthMatch = true,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(
    () => items.find((i) => i.value === value),
    [items, value]
  );

  // Filter
  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter(
      (i) =>
        String(i.label).toLowerCase().includes(s) ||
        String(i.desc || "").toLowerCase().includes(s)
    );
  }, [q, items]);

  // Group by section
  const grouped = useMemo(() => {
    const map = new Map();
    for (const it of filtered) {
      const key = it.section || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return Array.from(map.entries()); // [section, arr[]]
  }, [filtered]);

  // Positioning
  const [pos, setPos] = useState({ top: 0, left: 0, width: 240 });
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const left = Math.min(r.left, vw - Math.max(r.width, 260) - 12);
    setPos({ top: r.bottom + 8 + window.scrollY, left, width: widthMatch ? r.width : Math.max(r.width, 260) });
  }, [open, widthMatch]);

  // Close on outside click / esc
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!listRef.current || !btnRef.current) return;
      if (listRef.current.contains(e.target) || btnRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // Keyboard nav
  const [activeIndex, setActiveIndex] = useState(-1);
  const flat = useMemo(() => grouped.flatMap(([, arr]) => arr), [grouped]);
  useEffect(() => { if (!open) setActiveIndex(-1); }, [open, q]);

  const move = (dir) => {
    if (!open) setOpen(true);
    if (!flat.length) return;
    setActiveIndex((i) => {
      const n = (i + dir + flat.length) % flat.length;
      const el = document.getElementById(`ss-opt-${n}`);
      el?.scrollIntoView({ block: "nearest" });
      return n;
    });
  };
  const commitActive = () => {
    if (activeIndex < 0 || !flat[activeIndex]) return;
    onChange?.(flat[activeIndex].value, flat[activeIndex]);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((s) => !s)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); move(+1); }
          if (e.key === "ArrowUp")   { e.preventDefault(); move(-1); }
          if (e.key === "Enter")     { e.preventDefault(); commitActive(); }
        }}
        className={`group inline-flex items-center justify-between gap-2 px-3 py-2 ${glass} ${className}`}
      >
        <div className="min-w-[80px] text-sm truncate">
          {renderLabel ? renderLabel(selected) : (selected?.label || <span className="text-zinc-400">{placeholder}</span>)}
        </div>
        <ChevronDown size={16} className="text-zinc-400 group-hover:text-zinc-200 transition" />
      </button>

      {open &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={listRef}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className={`${glass} fixed z-[9999]`}
              style={{ top: pos.top, left: pos.left, width: pos.width, maxWidth: 360 }}
            >
              {searchable && (
                <div className="p-2 border-b border-white/10">
                  <div className="relative">
                    <input
                      className="w-full rounded-lg border border-white/10 bg-white/6 pl-8 pr-2 py-1.5 text-sm"
                      placeholder="Search…"
                      autoFocus
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e)=> {
                        if (e.key === "ArrowDown") { e.preventDefault(); move(+1); }
                        if (e.key === "ArrowUp")   { e.preventDefault(); move(-1); }
                        if (e.key === "Enter")     { e.preventDefault(); commitActive(); }
                      }}
                    />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-400" />
                  </div>
                </div>
              )}

              <div className="max-h-[56vh] overflow-auto scroll-smooth relative">
                {/* top gradient */}
                <div className="pointer-events-none sticky top-0 h-4 bg-gradient-to-b from-black/40 to-transparent" />
                {grouped.length === 0 && (
                  <div className="px-3 py-3 text-sm text-zinc-500">{emptyText}</div>
                )}
                {grouped.map(([section, arr], gi) => (
                  <div key={gi}>
                    {section && (
                      <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-widest text-zinc-400">
                        {section}
                      </div>
                    )}
                    <ul className="px-1 py-1">
                      {arr.map((it, i) => {
                        const idx = flat.indexOf(it);
                        const isActive = idx === activeIndex;
                        const isSelected = it.value === value;
                        return (
                          <li key={it.value}>
                            <button
                              id={`ss-opt-${idx}`}
                              onMouseEnter={() => setActiveIndex(idx)}
                              onClick={() => { onChange?.(it.value, it); setOpen(false); }}
                              className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 ${
                                isActive ? "bg-white/10" : "hover:bg-white/6"
                              }`}
                            >
                              {it.icon && <it.icon size={16} className="text-emerald-300" />}
                              <div className="min-w-0">
                                <div className="text-sm text-zinc-100 truncate">{it.label}</div>
                                {it.desc && (
                                  <div className="text-[11px] text-zinc-400 truncate">{it.desc}</div>
                                )}
                              </div>
                              {isSelected && (
                                <Check size={14} className="ml-auto text-emerald-300" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {/* bottom gradient */}
                <div className="pointer-events-none sticky bottom-0 h-4 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
