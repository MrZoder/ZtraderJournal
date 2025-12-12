// src/components/TradeSetupSection.jsx
import React from "react";
import { Target } from "lucide-react";  // 🎯 icon
import dayjs from "dayjs";

export default function TradeSetupSection({ trade }) {
  // Example props on trade.setup
  const { entryCriteria, confluences, timeOfDay } = trade.setup || {};

  return (
    <section className="mb-6">
      <div className="flex items-center mb-3">
        {/* Accent bar */}
        <span className="inline-block h-1 w-8 bg-blue-500 rounded-full mr-2" />
        {/* Icon + Heading */}
        <Target className="text-blue-400 mr-1" />
        <h3 className="text-lg font-semibold uppercase text-white tracking-wider">
          Trade Setup
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 text-sm text-zinc-200">
        <div>
          <p className="text-zinc-400 uppercase text-xs mb-1">Entry Criteria</p>
          <p>{entryCriteria || "–"}</p>
        </div>
        <div>
          <p className="text-zinc-400 uppercase text-xs mb-1">Confluences</p>
          <p>{confluences || "–"}</p>
        </div>
        <div>
          <p className="text-zinc-400 uppercase text-xs mb-1">Time of Day</p>
          <p>{timeOfDay ? dayjs(timeOfDay).format("h:mm A") : "–"}</p>
        </div>
      </div>
    </section>
  );
}
