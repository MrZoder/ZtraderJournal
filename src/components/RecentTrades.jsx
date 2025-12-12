// src/components/RecentTrades.jsx
import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  DollarSign,
  Smile,
  Trash2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import dayjs from "dayjs";
import { deleteTrade } from "../utils/tradeService";

// Session badge mapping
const sessionMap = {
  Asia:      { bg: "bg-cyan-200/80",   text: "text-cyan-900",   icon: "🌏" },
  London:    { bg: "bg-yellow-200/80", text: "text-yellow-900", icon: "💷" },
  "New York":{ bg: "bg-violet-200/80", text: "text-violet-900", icon: "🗽" },
};
function SessionBadge({ session }) {
  const s = sessionMap[session] || sessionMap.Asia;
  return (
    <span
      className={`${s.bg} ${s.text} inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold select-none whitespace-nowrap`}
    >
      <span className="mr-1">{s.icon}</span>
      {session}
    </span>
  );
}

export default function RecentTrades({ trades = [], refresh }) {
  const [expandedIdx, setExpandedIdx]   = useState(null);
  const [confirmIdx, setConfirmIdx]     = useState(null);
  const [deletingIdx, setDeletingIdx]   = useState(null);

  // Only today's trades
  const todayKey = dayjs().format("YYYY-MM-DD");
  const todayTrades = useMemo(
    () => trades.filter((t) => t.date === todayKey),
    [trades, todayKey]
  );

  // Scale for progress bars
  const maxAbs = useMemo(() => {
    if (!todayTrades.length) return 1;
    return Math.max(
      ...todayTrades.map((t) => Math.abs(parseFloat(t.pnl) || 0))
    );
  }, [todayTrades]);

  const startDelete   = useCallback((i) => setConfirmIdx(i), []);
  const cancelDelete  = useCallback(() => setConfirmIdx(null), []);
  const confirmDelete = useCallback(async () => {
    const i = confirmIdx;
    if (i == null) return;
    setDeletingIdx(i);
    try {
      await deleteTrade(todayTrades[i].id);
      await refresh();
    } finally {
      setDeletingIdx(null);
      setConfirmIdx(null);
      if (expandedIdx === i) setExpandedIdx(null);
    }
  }, [confirmIdx, todayTrades, refresh, expandedIdx]);

  return (
    <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl border border-zinc-800 shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center mb-3">
        <span className="bg-[rgba(0,255,163,0.9)] text-black text-xs font-bold px-3 py-1 rounded-full shadow">
          Today
        </span>
        <h2 className="ml-3 text-lg font-semibold text-white">Recent Trades</h2>
      </div>

      {/* Trades List */}
      <ul className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
        {todayTrades.length === 0 && (
          <li className="text-center text-zinc-400 py-8">No trades today.</li>
        )}

        <AnimatePresence initial={false}>
          {todayTrades.map((t, idx) => {
            const pnl = parseFloat(t.pnl) || 0;
            const profit = pnl >= 0;
            const barPct = Math.min((Math.abs(pnl) / maxAbs) * 100, 100);
            const timeLabel = t.time
              ? dayjs(`${t.date}T${t.time}`).format("h:mm A")
              : "--:--";

            // Session via UTC
            const utc = dayjs(`${t.date}T${t.time}`).utc();
            const mins = utc.hour() * 60 + utc.minute();
            const session =
              mins < 480 ? "Asia" :
              mins < 780 ? "London" :
              "New York";

            const isExpanded   = expandedIdx === idx;
            const isConfirming = confirmIdx   === idx;

            return (
              <React.Fragment key={t.id}>
                {/* Trade Row */}
                <motion.li
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{
                    layout: { duration: 0.25, ease: "easeInOut" },
                    default: { type: "spring", stiffness: 180, damping: 22 },
                  }}
                  className="relative group bg-zinc-800/60 rounded-2xl overflow-hidden"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl bg-[rgba(0,255,163,0.1)] opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-2xl overflow-hidden">
                    <div
                      className={`h-full ${
                        profit
                          ? "bg-gradient-to-r from-green-400 to-green-200"
                          : "bg-gradient-to-r from-red-400 to-red-600"
                      }`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>

                  {/* Main row: mobile-first, then horizontal on desktop */}
                  <div
                    className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 sm:px-4 sm:py-3 cursor-pointer"
                    onClick={() => {
                      if (!isConfirming) {
                        setExpandedIdx(isExpanded ? null : idx);
                        setConfirmIdx(null);
                      }
                    }}
                  >
                    {/* Left group */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-none">
                      <SessionBadge session={session} />
                      <Clock size={14} className="text-zinc-400" />
                      <span className="text-xs text-zinc-400">{timeLabel}</span>
                      <span className="text-white font-semibold truncate text-sm">
                        {t.symbol}
                      </span>
                    </div>

                    {/* Right group */}
                    <div className="flex items-center gap-3 mt-2 sm:mt-0">
                      <div className="inline-flex items-center gap-1">
                        <DollarSign
                          size={14}
                          className={profit ? "text-green-400" : "text-red-400"}
                        />
                        <span className={profit ? "text-green-400" : "text-red-400"}>
                          {profit ? `+${pnl.toFixed(2)}` : pnl.toFixed(2)}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1 text-zinc-400">
                        <Smile size={14} />
                        <span className="text-xs">{t.emotion || "–"}</span>
                      </div>

                      <span className="px-2 py-0.5 bg-zinc-700 rounded-full text-white text-xs font-medium">
                        {t.rating || "–"}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startDelete(idx);
                        }}
                        className="p-1 bg-zinc-700 rounded-full hover:bg-red-700 transition-colors"
                        aria-label="Delete trade"
                      >
                        <Trash2 size={14} className="text-red-400 hover:text-white" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedIdx(isExpanded ? null : idx);
                          setConfirmIdx(null);
                        }}
                        className="p-1"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronUp size={14} className="text-[#00FFA3]" />
                        ) : (
                          <ChevronDown size={14} className="text-[#00FFA3]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && !isConfirming && (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="relative z-10 px-3 pb-2 pt-1 text-xs text-zinc-300 flex flex-wrap gap-3 sm:gap-4"
                      >
                        <span>
                          <span className="font-semibold text-white">R/R:</span>{" "}
                          {t.rr ?? "–"}
                        </span>
                        <span>
                          <span className="font-semibold text-white">Contracts:</span>{" "}
                          {t.contracts ?? "–"}
                        </span>
                        {t.followedPlan != null && (
                          <CheckCircle
                            size={14}
                            className={
                              t.followedPlan ? "text-green-400" : "text-red-400"
                            }
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>

                {/* Inline delete confirmation */}
                <AnimatePresence initial={false}>
                  {confirmIdx === idx && (
                    <motion.li
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="bg-zinc-800/50 rounded-b-2xl px-3 py-2 flex items-center justify-end space-x-3 sm:space-x-4"
                    >
                      <span className="text-zinc-300 mr-auto">
                        Delete this trade?
                      </span>
                      <button
                        onClick={confirmDelete}
                        disabled={deletingIdx === idx}
                        className={`
                          px-3 py-1 rounded-full font-semibold
                          ${
                            deletingIdx === idx
                              ? "bg-gray-600 text-white cursor-wait"
                              : "bg-red-500 text-white hover:bg-red-600"
                          }
                        `}
                      >
                        {deletingIdx === idx ? "Deleting…" : "Yes"}
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="px-3 py-1 bg-zinc-700 text-white rounded-full font-semibold hover:bg-zinc-600"
                      >
                        No
                      </button>
                    </motion.li>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
