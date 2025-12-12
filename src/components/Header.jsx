// src/components/Header.jsx
import React from "react";
import { Tabs } from "./Tabs";
import { LogTradeButton } from "./LogTradeButton";
import { useSession } from "../hooks/useSession";

export default function Header({ activeTab, setActiveTab, onLogTrade }) {
  const { running, elapsed, toggle } = useSession();

  // format elapsed seconds as "Mm Ss"
  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-zinc-900 border-b border-zinc-800">
      {/* App title */}
      <h1 className="text-2xl font-semibold">📈 Trade Journal</h1>

      {/* Tabs + Session + Log Trade */}
      <div className="flex items-center space-x-4">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <button
          onClick={toggle}
          className={`px-4 py-2 rounded-lg font-semibold transition 
            ${running
              ? "bg-red-600 text-white hover:bg-red-500"
              : "bg-green-500 text-black hover:bg-green-400"}`}
        >
          {running ? `● ${mins}m ${secs}s` : "Start Session"}
        </button>

        <LogTradeButton onClick={onLogTrade} />
      </div>
    </header>
);
}
