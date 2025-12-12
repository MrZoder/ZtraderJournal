// src/components/QuickAddTradeButton.jsx
import React from "react";
import { PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function QuickAddTradeButton({ onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, boxShadow: "0 0 18px #5eead4" }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="
        flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr
        from-teal-400/80 via-teal-500/90 to-emerald-500/90
        shadow-lg border border-teal-200/40 text-zinc-900 font-semibold
        hover:brightness-110 transition
        focus:outline-none active:scale-95
        text-base
      "
      style={{
        minHeight: 44,
      }}
      aria-label="Quick Add Trade"
    >
      <PlusCircle className="text-white" size={22} />
      <span className="hidden sm:inline">Quick Add Trade</span>
    </motion.button>
  );
}
