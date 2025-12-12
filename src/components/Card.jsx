// src/components/Card.jsx
import React from "react";

export default function Card({ className = "", children }) {
  return (
    <div
      className={`
        relative 
        bg-zinc-900           /* solid dark panel */
        border border-zinc-800 /* slightly lighter border */
        rounded-2xl
        shadow-lg             /* soft drop shadow */
        ${className}
      `}
    >
      {children}
    </div>
  );
}
