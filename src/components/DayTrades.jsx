// src/components/DayTrades.jsx
import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, DollarSign, Smile, Trash2 } from "lucide-react";
import dayjs from "dayjs";

export default function DayTrades({
  date,
  trades = [],
  onAddTrade,
  onClose,
  onDeleteTrade,
}) {
  const [confirmId, setConfirmId]   = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ── Summary stats ──
  const { total, winRate, avgRR, best } = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter((t) => parseFloat(t.pnl) > 0).length;
    const winRate = total ? ((wins / total) * 100).toFixed(1) : "0";
    const rrList = trades.filter((t) => t.rr != null);
    const avgRR = rrList.length
      ? (rrList.reduce((sum, t) => sum + parseFloat(t.rr), 0) / rrList.length).toFixed(2)
      : "0";
    const best = total ? Math.max(...trades.map((t) => parseFloat(t.pnl))) : 0;
    return { total, winRate, avgRR, best };
  }, [trades]);

  const handleAdd = useCallback(() => onAddTrade(date), [onAddTrade, date]);

  const startDelete  = useCallback((id) => setConfirmId(id), []);
  const cancelDelete = useCallback(() => setConfirmId(null), []);

  const confirmDelete = useCallback(async () => {
    const id = confirmId;
    if (!id) return;
    setDeletingId(id);
    try {
      await onDeleteTrade(id);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }, [confirmId, onDeleteTrade]);

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="
        w-full max-w-md mx-auto
        bg-zinc-900/80 backdrop-blur-lg
        rounded-2xl shadow-2xl
        p-4 space-y-4
        max-h-[90vh] overflow-y-auto hide-scrollbar
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {dayjs(date).format("MMM D, YYYY")}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-1 rounded hover:bg-zinc-800 transition"
        >
          <X size={20} className="text-zinc-400 hover:text-white" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          ["Trades", total, "text-white"],
          ["Win%", `${winRate}%`, "text-blue-400"],
          ["Avg R/R", avgRR, "text-yellow-400"],
          ["Best", `+${best}`, "text-green-400"],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="bg-zinc-800 rounded-lg p-2 flex flex-col items-center"
          >
            <span className="text-xs text-zinc-400 uppercase">{label}</span>
            <span className={`text-lg font-bold mt-1 ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Add Trade */}
      <button
        onClick={handleAdd}
        className="
          w-full py-2 text-sm font-semibold
          bg-[rgba(0,255,163,0.9)] hover:bg-[rgba(0,255,163,0.8)]
          rounded-full text-black shadow-[0_4px_15px_rgba(0,255,163,0.3)]
          transition-transform duration-200 hover:scale-105
        "
      >
        + Add Trade
      </button>

      {/* Trades List */}
      <AnimatePresence>
        {trades.length > 0 ? (
          <motion.ul layout className="divide-y divide-zinc-800">
            {trades.map((t) => {
              const profit = parseFloat(t.pnl) >= 0;
              const isConfirming = confirmId === t.id;

              return (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="relative grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-x-2 p-3 rounded-lg hover:bg-zinc-800/50 transition"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-[rgba(0,255,163,0.1)] opacity-0 hover:opacity-20 rounded-lg transition-opacity" />

                  {/* Time */}
                  <div className="flex items-center space-x-1 z-10">
                    <Clock size={14} className="text-zinc-400" />
                    <span className="text-xs text-zinc-300">
                      {dayjs(`${t.date}T${t.time}`).format("h:mm A")}
                    </span>
                  </div>

                  {/* Symbol */}
                  <span className="z-10 uppercase font-medium text-white">{t.symbol}</span>

                  {/* P&L */}
                  <div className="flex items-center space-x-1 justify-end z-10">
                    <DollarSign size={14} className={profit ? "text-green-400" : "text-red-400"} />
                    <span className={`text-sm font-medium ${profit ? "text-green-400" : "text-red-400"}`}>
                      {profit ? `+${t.pnl}` : t.pnl}
                    </span>
                  </div>

                  {/* Emotion */}
                  <div className="flex items-center space-x-1 justify-end z-10">
                    <Smile size={14} className="text-zinc-400" />
                    <span className="text-xs text-zinc-300">{t.emotion || "–"}</span>
                  </div>

                  {/* Rating */}
                  <span className="z-10 px-2 py-0.5 bg-zinc-800 rounded-full text-xs font-semibold text-white text-center">
                    {t.rating || "–"}
                  </span>

                  {/* Delete Button */}
                  <button
                    onClick={() => startDelete(t.id)}
                    aria-label="Delete trade"
                    className="z-10 p-1 rounded hover:bg-red-800 transition"
                  >
                    <Trash2 size={16} className="text-red-400 hover:text-white" />
                  </button>

                  {/* Confirmation Overlay */}
                  <AnimatePresence>
                    {isConfirming && (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        className="
                          absolute inset-0 bg-black/70 rounded-lg
                          flex flex-col items-center justify-center p-4
                        "
                      >
                        <p className="text-white font-semibold mb-3">Delete this trade?</p>
                        <div className="flex space-x-4">
                          <button
                            onClick={confirmDelete}
                            disabled={deletingId === t.id}
                            className={`
                              px-4 py-1 rounded-lg font-semibold
                              ${
                                deletingId === t.id
                                  ? "bg-gray-600 text-white cursor-wait"
                                  : "bg-red-500 text-white hover:bg-red-600"
                              }
                            `}
                          >
                            {deletingId === t.id ? "Deleting…" : "Yes"}
                          </button>
                          <button
                            onClick={cancelDelete}
                            className="px-4 py-1 bg-zinc-700 text-white rounded-lg font-semibold hover:bg-zinc-600"
                          >
                            No
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </motion.ul>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-zinc-400 py-8"
          >
            No trades for this day.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
