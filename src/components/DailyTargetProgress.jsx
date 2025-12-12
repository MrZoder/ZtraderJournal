// src/components/DailyTargetProgress.jsx
import React, { useState, useEffect } from "react";
import { getTargetForDate, updateTargetForDate } from "../utils/targetService";
import { motion } from "framer-motion";
import dayjs from "dayjs";

export default function DailyTargetProgress({ trades = [], selectedDate }) {
  const [target, setTarget] = useState(500); // Default fallback
  const [editMode, setEditMode] = useState(false);
  const [inputValue, setInputValue] = useState("500");
  const [loading, setLoading] = useState(false);

  const dateKey = dayjs(selectedDate).format("YYYY-MM-DD");

  // Compute total P&L for the selected day
  const dailyPnL = trades
    .filter((t) => dayjs(t.date).isSame(selectedDate, "day"))
    .reduce((sum, t) => sum + (t.pnl || 0), 0);

  useEffect(() => {
    async function loadTarget() {
      try {
        const t = await getTargetForDate(dateKey);
        // getTargetForDate returns { user_id, date, target }
        const amount = t?.target ?? 500; 
        setTarget(amount);
        setInputValue(amount.toString());
      } catch (err) {
        console.error("Failed to load daily target:", err);
      }
    }
    loadTarget();
  }, [dateKey]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const amount = parseFloat(inputValue);
      if (!isNaN(amount)) {
        await updateTargetForDate(dateKey, amount);
        setTarget(amount);
        setEditMode(false);
      }
    } catch (err) {
      console.error("Failed to save target:", err);
    }
    setLoading(false);
  };

  const progressPercent = target > 0
    ? Math.min((dailyPnL / target) * 100, 100)
    : 0;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-sm font-semibold text-white">Daily Target</span>
        {editMode ? (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="flex items-center gap-2"
          >
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-24 text-sm bg-zinc-900 border border-zinc-700 rounded-md px-3 py-[6px] text-right text-white focus:ring-1 focus:ring-green-400 focus:outline-none transition"
              min={0}
              step="10"
            />
            <button
              onClick={handleSave}
              disabled={loading || !inputValue || parseFloat(inputValue) <= 0}
              className="text-green-400 text-xs font-medium hover:text-green-300 transition disabled:opacity-40"
              title="Save target"
            >
              Save
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="text-zinc-400 text-xs font-medium hover:text-red-400 transition"
              title="Cancel edit"
            >
              Cancel
            </button>
          </motion.div>
        ) : (
          <div className="text-xs text-green-400 font-semibold flex gap-3 items-center">
            <span>${dailyPnL.toFixed(2)} / ${target}</span>
            <button
              onClick={() => setEditMode(true)}
              className="text-zinc-400 hover:text-white text-[11px] underline underline-offset-2 transition"
              title="Edit daily target"
            >
              Edit
            </button>
          </div>
        )}
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}
