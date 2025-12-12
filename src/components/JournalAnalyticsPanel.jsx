// src/components/JournalAnalyticsPanel.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function JournalAnalyticsPanel({ journalId, session }) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // TODO: Fetch analytics data for the given journalId & session,
    // then call setMetrics({ winRate, avgPnL, streak, ... })
  }, [journalId, session]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-6 h-full overflow-auto"
    >
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Analytics</h2>
      {!metrics ? (
        <div className="text-gray-400">Loading analytics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Example metric card */}
          <div className="p-4 bg-[rgba(20,20,30,0.4)] rounded-lg">
            <p className="text-sm text-gray-400">Win Rate</p>
            <p className="text-2xl font-bold text-teal-400">{metrics.winRate}%</p>
          </div>
          {/* Add more metric cards: Avg P&L, Max Drawdown, Streak Length, etc. */}
        </div>
      )}
    </motion.div>
  );
}
