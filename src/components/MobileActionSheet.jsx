// src/components/MobileActionSheet.jsx
import React from "react";

export default function MobileActionSheet({ open, onClose, actions = [] }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-end"
      onClick={onClose}
      style={{ touchAction: "manipulation" }}
    >
      <div
        className="w-full bg-zinc-900 rounded-t-2xl pb-8 pt-4 px-5 shadow-2xl"
        style={{
          animation: "slideUpSheet 0.28s cubic-bezier(.25,.1,.25,1)",
          maxWidth: 480,
          margin: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {actions.map(a => (
          <button
            key={a.label}
            className={`
              w-full py-4 text-lg rounded-xl mb-3
              ${a.danger ? "bg-red-500 text-white" : "bg-zinc-800 text-white"}
              font-bold active:scale-95 transition
            `}
            onClick={() => {
              a.onClick();
              onClose();
            }}
          >
            {a.icon && <span className="inline-block mr-2 align-middle">{a.icon}</span>}
            {a.label}
          </button>
        ))}
        <button
          className="w-full py-3 text-base bg-zinc-800 text-zinc-400 rounded-xl mt-2"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateY(100%);}
          to { transform: translateY(0);}
        }
      `}</style>
    </div>
  );
}
