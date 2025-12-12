// src/components/EnhancedRulesModal.jsx
import React, { useState } from "react";
import { Star, PlusCircle, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { saveDailyRules } from "../utils/ruleService";

export default function EnhancedRulesModal({ dateKey, currentRules = [], onSave, onClose }) {
  const [rules, setRules] = useState([...currentRules]);
  const [starredIndex, setStarredIndex] = useState(0);
  const [newRule, setNewRule] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setRules((prev) => [...prev, newRule.trim()]);
    setNewRule("");
  };

  const handleRemoveRule = (index) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
    if (index === starredIndex) setStarredIndex(0);
  };

  const handleSave = async () => {
    if (!rules.length) return;
    setSaving(true);
    try {
      const ordered = [
        rules[starredIndex],
        ...rules.filter((_, i) => i !== starredIndex),
      ];
      const checkedMap = {};
      await saveDailyRules(dateKey, ordered, checkedMap);
      onSave?.(ordered);
      onClose();
    } catch (err) {
      alert("❌ Failed to save rules.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[rgba(25,25,25,0.92)] backdrop-blur-xl rounded-3xl p-6 border border-zinc-800 shadow-2xl text-white z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4">📝 Set Rules for Today</h2>

        {rules[starredIndex] && (
          <div className="mb-4 text-sm text-zinc-400 italic border-l-4 pl-3 border-[#00FFA3] bg-zinc-800/60 py-2 rounded-lg">
            ⭐ <span className="text-white font-medium">Primary Focus:</span> {rules[starredIndex]}
          </div>
        )}

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 hide-scrollbar">
          {rules.map((rule, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-2 transition hover:shadow-md"
            >
              <input
                type="text"
                value={rule}
                onChange={(e) =>
                  setRules((prev) => prev.map((r, i) => (i === index ? e.target.value : r)))
                }
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-500 transition focus:scale-[1.01]"
                placeholder="Rule text..."
              />
              <button
                onClick={() => setStarredIndex(index)}
                className={`transition ${
                  starredIndex === index
                    ? "text-green-400"
                    : "text-zinc-500 hover:text-green-400"
                }`}
                title="Pin this rule"
              >
                <Star
                  size={18}
                  strokeWidth={2}
                  fill={starredIndex === index ? "#00FFA3" : "transparent"}
                />
              </button>
              <button
                onClick={() => handleRemoveRule(index)}
                className="text-zinc-500 hover:text-red-400 transition"
                title="Delete rule"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-6">
          <input
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 outline-none placeholder:text-zinc-500 text-sm transition focus:ring-2 focus:ring-[#00FFA3]"
            placeholder="Add a new rule..."
          />
          <button
            onClick={handleAddRule}
            className="text-[#00FFA3] hover:scale-110 transition-all duration-150"
          >
            <PlusCircle size={22} />
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || rules.length === 0}
            className="bg-gradient-to-r from-[#00FFA3] to-[#00FFD5] text-black font-semibold px-6 py-2 rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Rules"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
