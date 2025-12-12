// src/pages/JournalPage/components/SessionPicker.jsx
import React, { useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import dayjs from "dayjs";

const triggerBtn =
  "h-9 px-3 rounded-[12px] bg-white/7 border border-white/12 text-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-300/40";

function useOnClickOutside(ref, handler) {
  React.useEffect(() => {
    const fn = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler?.();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, handler]);
}

export default function SessionPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));

  const d = dayjs(value);
  const today = dayjs().format("YYYY-MM-DD");
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

  const [cursor, setCursor] = useState(dayjs(value || today).startOf("month"));

  const weeks = useMemo(() => {
    const start = cursor.startOf("week");
    const end = cursor.endOf("month").endOf("week");
    const days = [];
    let cur = start;
    while (cur.isBefore(end) || cur.isSame(end, "day")) {
      days.push(cur);
      cur = cur.add(1, "day");
    }
    return Array.from({ length: Math.ceil(days.length / 7) }, (_, i) =>
      days.slice(i * 7, i * 7 + 7)
    );
  }, [cursor]);

  const human = d.format("ddd, MMM D");

  return (
    <div className="relative">
      <button className={triggerBtn} onClick={() => setOpen((v) => !v)}>
        <CalendarDays size={16} className="opacity-85" />
        <span className="hidden sm:inline">{human}</span>
        <span className="sm:hidden">{d.format("MM/DD")}</span>
        <ChevronDown size={14} className="opacity-80" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Scrim: darken background for better contrast; click to close */}
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="popover"
              ref={ref}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              // Higher-contrast glass: dark base with gentle translucency
              className="absolute z-50 mt-2 w-[300px] sm:w-[360px] rounded-[16px] border border-white/14 bg-[rgba(17,23,31,0.92)] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,.55)] ring-1 ring-white/10 p-3"
            >
              {/* Quick row */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  className="h-8 px-3 rounded-[10px] bg-white/8 border border-white/12 text-xs hover:bg-white/12"
                  onClick={() => {
                    onChange(today);
                    setCursor(dayjs(today).startOf("month"));
                    setOpen(false);
                  }}
                >
                  Today
                </button>
                <button
                  className="h-8 px-3 rounded-[10px] bg-white/8 border border-white/12 text-xs hover:bg-white/12"
                  onClick={() => {
                    onChange(yesterday);
                    setCursor(dayjs(yesterday).startOf("month"));
                    setOpen(false);
                  }}
                >
                  Yesterday
                </button>
                <div className="ml-auto text-[11px] text-zinc-400 flex items-center gap-1">
                  <Clock size={12} /> Session date
                </div>
              </div>

              {/* Calendar header */}
              <div className="flex items-center justify-between mb-2">
                <button
                  className="p-2 rounded-[10px] hover:bg-white/10"
                  onClick={() => setCursor(cursor.subtract(1, "month"))}
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-sm font-semibold">{cursor.format("MMMM YYYY")}</div>
                <button
                  className="p-2 rounded-[10px] hover:bg-white/10"
                  onClick={() => setCursor(cursor.add(1, "month"))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Week labels */}
              <div className="grid grid-cols-7 gap-1 text-[11px] text-center text-zinc-400 mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {weeks.flat().map((day) => {
                  const isCurMonth = day.month() === cursor.month();
                  const sel = day.format("YYYY-MM-DD") === value;
                  return (
                    <button
                      key={day.format("YYYY-MM-DD")}
                      onClick={() => {
                        onChange(day.format("YYYY-MM-DD"));
                        setOpen(false);
                      }}
                      className={
                        "h-8 rounded-[10px] text-sm transition " +
                        (sel
                          ? "text-black bg-gradient-to-br from-emerald-400 to-cyan-400"
                          : isCurMonth
                          ? "text-zinc-100 hover:bg-white/10"
                          : "text-zinc-500")
                      }
                    >
                      {day.date()}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
