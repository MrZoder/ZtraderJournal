// src/components/MiniTraderStreak.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";
import dayjs from "dayjs";

/**
 * Winning Streak rules
 * - Count consecutive days with net PnL > 0.
 * - Off-days (no trades or net === 0) are NEUTRAL: skip them, do not break or count.
 * - A streak only breaks on a CLOSED red day (net < 0).
 * - "Closed" means strictly before the anchor day, or equal to anchor day when treatAnchorAsFinalized = true.
 *
 * Props:
 *  - trades: [{ date: string|Date, pnl: number }]
 *  - anchorDate?: string|Date   // default: today; lets you compute "streak as of" any date (e.g., calendar selection)
 *  - treatAnchorAsFinalized?: boolean // default: false (so “today” doesn’t break until the next calendar day)
 */
export default function MiniTraderStreak({
  trades = [],
  anchorDate,
  treatAnchorAsFinalized = false,
}) {
  const [streak, setStreak] = useState(0);
  const [showBrokenToast, setShowBrokenToast] = useState(false);
  const prevStreakRef = useRef(0);

  // Sum daily net
  const dailyNet = useMemo(() => {
    const map = {};
    for (const t of trades) {
      const key = dayjs(t.date).format("YYYY-MM-DD");
      map[key] = (map[key] || 0) + Number(t.pnl || 0);
    }
    return map;
  }, [trades]);

  // Compute earliest date we have trades for (to bound the loop)
  const earliestKey = useMemo(() => {
    const keys = Object.keys(dailyNet).sort();
    return keys.length ? keys[0] : dayjs().format("YYYY-MM-DD");
  }, [dailyNet]);

  const computedStreak = useMemo(() => {
    const todayKey = dayjs().format("YYYY-MM-DD");
    const anchorKey = anchorDate
      ? dayjs(anchorDate).format("YYYY-MM-DD")
      : todayKey;

    let count = 0;
    let cursor = dayjs(anchorKey);

    // Walk back until we hit the earliest trade day (plus a tiny buffer)
    for (let guard = 0; guard < 3650; guard++) {
      const key = cursor.format("YYYY-MM-DD");
      const net = dailyNet[key];

      const isAnchor = key === anchorKey;
      const isClosed = !isAnchor || treatAnchorAsFinalized;

      if (net == null || net === 0) {
        // Off-day / zero day — neutral: skip and continue backward.
      } else if (net > 0) {
        // Winning day: counts, continue backward.
        count += 1;
      } else if (net < 0) {
        // Losing day: break only if CLOSED; if not closed (e.g., today mid-session), treat as neutral and continue.
        if (isClosed) break;
      }

      // Move back one day
      const next = cursor.subtract(1, "day");
      // Stop if we’ve gone past the earliest date we know about
      if (next.isBefore(dayjs(earliestKey), "day")) break;
      cursor = next;
    }

    return count;
  }, [dailyNet, anchorDate, treatAnchorAsFinalized, earliestKey]);

  // Update + broken-streak toast
  useEffect(() => {
    const next = computedStreak;
    if (prevStreakRef.current > 0 && next === 0) {
      setShowBrokenToast(true);
    }
    prevStreakRef.current = next;
    setStreak(next);
  }, [computedStreak]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!showBrokenToast) return;
    const tid = setTimeout(() => setShowBrokenToast(false), 3000);
    return () => clearTimeout(tid);
  }, [showBrokenToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        relative w-full rounded-2xl
        bg-gradient-to-r from-orange-600/70 via-yellow-500/60 to-orange-600/70
        shadow-lg px-4 py-3 flex items-center gap-3 border border-orange-400/30
      "
      style={{ minHeight: 56 }}
    >
      <Flame className="text-yellow-300 drop-shadow-lg animate-pulse" size={26} />
      <div>
        <span className="block font-semibold text-lg text-white leading-tight">
          {streak} Day{streak === 1 ? "" : "s"} Streak
        </span>
        <span className="block text-xs text-yellow-200/90">
          Consecutive winning days (off-days ignored)
        </span>
      </div>

      {showBrokenToast && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-sm px-3 py-1 rounded shadow-md">
          You broke your streak!
        </div>
      )}
    </motion.div>
  );
}
