// src/components/LogTradeButton.jsx
import React from "react";

export function LogTradeButton({ onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`
        text-black font-semibold 
        bg-gradient-to-r from-[#00FFA3] to-[#0fffe5] 
        shadow-[0_4px_15px_rgba(0,255,163,0.3)] 
        transition-transform hover:scale-105

        /* On mobile (<640px), use smaller, rounded-lg button */
        px-3 py-1.5 rounded-lg text-sm

        /* On desktop (≥640px), expand into a larger circular pill */
        sm:px-5 sm:py-2 sm:rounded-full sm:text-base

        ${className}
      `}
    >
      +
    </button>
  );
}
