// src/components/SlidePanel.jsx
import React from "react";

export default function SlidePanel({ isOpen, onClose, title, children }) {
  return (
    <>
      {/*
        1) Frosted overlay: covers entire viewport, fading in/out
        2) Clicking outside (on this overlay) will close the panel
      */}
      <div
        className={`
          fixed inset-0 
          z-30 
          bg-black/20 backdrop-blur-sm 
          transition-opacity duration-200 
          ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
        onClick={onClose}
      />

      {/*
        Sliding panel wrapper:
        - Sticks to top‐16 (just under a header of h-16) down to bottom‐0
        - Has fixed width sm:w-96 on desktop, w-full on mobile
        - Slides in/out horizontally via translate-x
        - overflow-hidden on the parent ensures the container itself never scrolls
      */}
      <div
        className={`
          fixed 
          top-16 bottom-0 right-0 
          z-40 
          bg-zinc-900 
          w-full sm:w-96 
          transform transition-transform duration-200 
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        onClick={(e) => e.stopPropagation()}
        style={{ overflow: "hidden" }}
      >
        {/*
          Panel Content:
          - A header bar that stays fixed at the top of this panel
          - The main body below it is flex-1 and scrollable
            * On desktop, we wrap with .hide-scrollbar so the scrollbar is invisible.
            * On mobile (<640px), the scrollbar is visible so users can still scroll if needed.
        */}
        {/* HEADER BAR */}
        <div className="flex items-center justify-between bg-zinc-800 px-4 py-3 border-b border-zinc-700">
          <h3 className="text-lg font-semibold text-white truncate">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-zinc-700 transition"
            aria-label="Close"
          >
            {/* Simple X icon using inline SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-zinc-400 hover:text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 
          BODY:
          - flex-1 ensures it takes all remaining vertical space
          - overflow-y-auto to allow internal scrolling
          - on desktop (sm+), .hide-scrollbar hides the native scrollbar
          - on mobile, no extra class so the scrollbar is visible
        */}
        <div className="flex-1 overflow-y-auto sm:overflow-y-auto hide-scrollbar p-4">
          {children}
        </div>
      </div>
    </>
  );
}
