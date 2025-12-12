// src/components/MobileWrapper.jsx
import React from "react";

export default function MobileWrapper({ onClose, children }) {
  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/75
        flex flex-col
        overflow-y-auto
      "
      // Prevent clicks from closing when clicking inside
      onClick={onClose}
    >
      {/* 
        The “content” area occupies entire screen.
        Clicking the dark backdrop (outside children) will close. 
      */}
      <div
        className="
          relative
          w-full h-full
          bg-zinc-900
          rounded-t-2xl
          shadow-2xl
          overflow-y-auto
        "
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
