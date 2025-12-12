// src/components/MiniPLChart.jsx
import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

/**
 * Mini P&L + Trade-count snapshot chart.
 * @param {Array} trades – array of all trades.
 */
export default function MiniPLChart({ trades = [] }) {
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    // 1) get this week's Mon→today
    const start = dayjs().startOf("isoWeek");
    const end   = dayjs();

    // 2) init map for Mon→Fri
    const map = {};
    for (let i = 0; i < 5; i++) {
      const day = start.add(i, "day").format("ddd");
      map[day] = { day, pnl: 0, count: 0 };
    }

    // 3) aggregate
    trades.forEach(({ date, pnl }) => {
      const d = dayjs(date);
      if (d.isBetween(start, end, "day", "[]")) {
        const day = d.format("ddd");
        if (map[day]) {
          map[day].pnl   += parseFloat(pnl) || 0;
          map[day].count += 1;
        }
      }
    });

    // 4) build Mon→Fri array
    setWeeklyData(Object.values(map));
  }, [trades]);

  return (
    <motion.div
      layout
      className="
        overflow-visible
        w-full rounded-2xl
        bg-gradient-to-br from-green-800/40 via-green-700/20 to-zinc-900/70
        border border-green-400/20 shadow px-4 py-3 mt-2
        flex flex-col items-start
      "
      style={{ minHeight: 96 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="text-green-300" size={20} />
        <span className="font-semibold text-green-200 text-sm tracking-tight">
          Weekly P&L & Trade Count
        </span>
      </div>

      <ResponsiveContainer width="100%" height={80}>
        <ComposedChart
          data={weeklyData}
          margin={{ top: 24, right: 0, left: 0, bottom: 0 }}
          barCategoryGap="50%"
        >
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            stroke="#a7ffda"
            tick={{ fontSize: 11, fill: "#a7ffda" }}
            interval={0}
            padding={{ left: 0, right: 0 }}
          />

          {/* only one bar for trade counts, no labels */}
          <Bar
            dataKey="count"
            barSize={12}
            fill="rgba(74,222,128,0.3)"
          />

          <Line
            type="monotone"
            dataKey="pnl"
            stroke="#4ade80"
            strokeWidth={2.4}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />

          <Tooltip
            wrapperStyle={{
              background: "#1a1d23",
              borderRadius: "8px",
              border: "none",
              fontSize: 13,
              color: "#a7ffda",
              padding: "6px 10px",
            }}
            contentStyle={{
              background: "rgba(22,24,30,0.97)",
              border: "none",
            }}
            labelStyle={{ color: "#baffb9", fontSize: 12 }}
            cursor={{ stroke: "#6ee7b7", strokeDasharray: "3 3" }}
            formatter={(value, name) => {
              if (name === "pnl") {
                return [`$${value.toFixed(2)}`, "P&L"];
              }
              return [value, "# Trades"];
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
