// src/components/ReflectionPanel.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ReflectionPanel({ data = {}, onChange }) {
  const [wentWell, setWentWell] = useState(data.wentWell || '');
  const [toImprove, setToImprove] = useState(data.toImprove || '');

  useEffect(() => {
    onChange({ wentWell, toImprove });
  }, [wentWell, toImprove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-6 h-full"
    >
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Reflection</h2>
      <textarea
        value={wentWell}
        onChange={e => setWentWell(e.target.value)}
        placeholder="What went well today?"
        className="w-full h-24 bg-[rgba(20,20,30,0.4)] text-gray-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none mb-4"
      />
      <textarea
        value={toImprove}
        onChange={e => setToImprove(e.target.value)}
        placeholder="What can I improve tomorrow?"
        className="w-full h-24 bg-[rgba(20,20,30,0.4)] text-gray-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
      />
    </motion.div>
  );
}