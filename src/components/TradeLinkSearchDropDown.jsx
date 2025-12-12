// Enhanced TradeLinkSearchDropdown.jsx
import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";

export default function TradeLinkSearchDropdown({ trades = [], linked = [], onLink }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return trades.filter((t) =>
      !linked.includes(t.id) && (
        t.symbol.toLowerCase().includes(s) ||
        t.date.includes(s) ||
        t.emotion?.toLowerCase().includes(s)
      )
    );
  }, [search, trades, linked]);

  return (
    <div className="relative w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 text-sm text-[#00FFA3] font-semibold hover:bg-zinc-800 transition"
      >
        + Link Trade
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl p-2">
          <div className="flex items-center bg-zinc-800 rounded-md px-2 py-1 mb-2">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trades by symbol, date, notes..."
              className="flex-1 ml-2 bg-transparent outline-none text-sm text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="max-h-[45vh] overflow-y-auto hide-scrollbar flex flex-col gap-1">
            {filtered.length === 0 ? (
              <div className="text-xs text-zinc-400 px-2 py-2 text-center">
                No matching trades.
              </div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onLink(t.id);
                    setSearch("");
                    setOpen(false);
                  }}
                  className="w-full text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg p-3 transition-all"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-white uppercase">{t.symbol}</span>
                    <span className={`text-sm font-semibold ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {t.date} {t.time} | R/R: {t.rr || "–"} | Emotion: {t.emotion || "–"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
