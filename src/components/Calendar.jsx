// src/components/Calendar.jsx
import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BRAND_CYAN = "#00FFA3";
const BRAND_VIOLET = "#926BFF";

export default function Calendar({
  trades = [],
  onDateSelect,
  onDayClick,
  selectedDate,
}) {
  const [month, setMonth] = useState(dayjs());

  // Memoize stats for speed
  const stats = useMemo(() => {
    const validTrades = trades.filter((t) => t && t.date);
    return validTrades.reduce((acc, t) => {
      const key = dayjs(t.date).format("YYYY-MM-DD");
      if (!acc[key]) acc[key] = { pnl: 0, count: 0 };
      acc[key].pnl += parseFloat(t.pnl || 0);
      acc[key].count += 1;
      return acc;
    }, {});
  }, [trades]);

  const startOfMonth = month.startOf("month");
  const firstDow = startOfMonth.day();
  const daysInMonth = month.daysInMonth();
  const todayKey = dayjs().format("YYYY-MM-DD");

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = month.date(d);
    const key = dateObj.format("YYYY-MM-DD");
    const { pnl = 0, count = 0 } = stats[key] || {};
    cells.push({ day: d, key, pnl, count });
  }

  // Animated pulse for today (radial, subtle)
  const animatedPulse = (
    <span
      className="absolute inset-0 pointer-events-none"
      style={{
        borderRadius: 16,
        background:
          "radial-gradient(circle at 50% 60%, rgba(0,255,163,0.09) 0%, rgba(0,255,163,0.03) 75%, transparent 100%)",
        filter: "blur(1.5px)",
        opacity: 0.48,
        animation: "calendar-pulse 2.2s infinite cubic-bezier(.4,0,6,1)",
      }}
    />
  );

  // Helper to invoke the right callback
  const handleClick = (key) => {
    if (onDayClick) onDayClick(key);
    else if (onDateSelect) onDateSelect(key);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      {/* --- Month navigation --- */}
      <div className="flex justify-between items-center mb-3 px-1">
        <button
          aria-label="Previous Month"
          onClick={() => setMonth((m) => m.subtract(1, "month"))}
          className="p-1 text-zinc-300 hover:text-white hover:bg-[#00FFA325]/15 rounded-full transition"
          tabIndex={0}
        >
          <ChevronLeft size={22} color={BRAND_CYAN} />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-white drop-shadow tracking-tight">
          {month.format("MMMM YYYY")}
        </h2>
        <button
          aria-label="Next Month"
          onClick={() => setMonth((m) => m.add(1, "month"))}
          className="p-1 text-zinc-300 hover:text-white hover:bg-[#00FFA325]/15 rounded-full transition"
          tabIndex={0}
        >
          <ChevronRight size={22} color={BRAND_CYAN} />
        </button>
      </div>

      {/* --- Weekday headers --- */}
      <div className="grid grid-cols-7 gap-1 text-[0.78rem] sm:text-[0.75rem] text-zinc-400 uppercase mb-2 font-bold px-[2px] tracking-wide">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
          <div key={w} className="text-center">{w}</div>
        ))}
      </div>

      {/* --- Date cells grid --- */}
      <div className="flex-1 overflow-x-auto pb-1">
        <div className="grid grid-cols-7 min-w-[350px] gap-[3px] sm:gap-2 px-[2px]">
          {cells.map((c, idx) => {
            if (!c) return <div key={idx} className="h-14 sm:h-12 lg:h-16" />;
            const { day, key, pnl, count } = c;
            const isFuture = dayjs(key).isAfter(dayjs(), "day");
            const isToday = key === todayKey;
            const isSel = key === selectedDate;

            // Dynamic styles
            let bg = "bg-white/5";
            let textColor = "text-white";
            let z = "";
            let shadow = "";
            let extraPulse = null;

            if (isToday && !isSel) {
              bg = "bg-white/10";
              textColor = "text-[#00FFA3] font-extrabold";
              z = "z-10";
              extraPulse = animatedPulse;
            } else if (isSel) {
              bg = "bg-gradient-to-br from-[#926BFF14] to-[#00FFA311]/70";
              textColor = "text-[#926BFF] font-extrabold";
              z = "z-20";
            }

            // P&L badge
            let badge;
            if (pnl > 0) {
              badge = (
                <span className="mt-0.5 px-1.5 py-0.5 rounded-full text-[0.74rem] font-semibold text-green-300 border border-green-300/25 bg-gradient-to-r from-green-400/5 to-green-300/10 shadow-[0_1px_6px_0_rgba(0,255,163,0.04)]">
                  +{pnl.toFixed(0)}
                </span>
              );
            } else if (pnl < 0) {
              badge = (
                <span className="mt-0.5 px-1.5 py-0.5 rounded-full text-[0.74rem] font-semibold text-red-400 border border-red-400/25 bg-gradient-to-r from-red-500/5 to-red-600/10 shadow-[0_1px_6px_0_rgba(255,60,80,0.04)]">
                  {pnl.toFixed(0)}
                </span>
              );
            } else if (count > 0) {
              badge = (
                <span className="mt-0.5 px-1.5 py-0.5 bg-zinc-700/60 rounded-full text-[0.70rem] font-semibold text-zinc-400 border border-white/5">
                  {count} trade{count > 1 ? "s" : ""}
                </span>
              );
            } else {
              badge = <span className="mt-1 text-[0.7rem] text-zinc-700 font-semibold">–</span>;
            }

            return (
              <button
                key={key}
                type="button"
                className={[
                  "relative h-14 sm:h-12 lg:h-16 flex flex-col items-center justify-center group rounded-2xl transition-all duration-150",
                  isFuture
                    ? "opacity-50 pointer-events-none"
                    : "cursor-pointer hover:scale-[1.06] active:scale-95 hover:bg-[#131c18]/25",
                  bg,
                  textColor,
                  z,
                  shadow,
                  "outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                ].join(" ")}
                onClick={() => !isFuture && handleClick(key)}
                title={`P&L: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}\nTrades: ${count}\n${key}`}
                tabIndex={isFuture ? -1 : 0}
                style={{ position: "relative" }}
              >
                {isToday && extraPulse}
                {isSel && (
                  <span className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-br from-[#926BFF14] to-[#00FFA311] blur-[1.5px] opacity-70" />
                )}
                <span className={["text-[1.04rem] sm:text-base transition font-black relative z-10", isToday && !isSel ? "drop-shadow-lg" : ""].join(" ")}>
                  {day}
                </span>
                {badge}
                {(isToday || isSel) && (
                  <span
                    className="absolute left-2/4 -translate-x-2/4 bottom-0 w-4/5 h-[8px] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(0,255,163,0.12)_0%,_transparent_80%)] blur-[3.5px] pointer-events-none"
                    style={{ zIndex: 1 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated pulse keyframes */}
      <style>{`
        @keyframes calendar-pulse {
          0%, 100% { opacity: 0.48; }
          40% { opacity: 0.91; }
          70% { opacity: 0.48; }
        }
      `}</style>
    </div>
  );
}
