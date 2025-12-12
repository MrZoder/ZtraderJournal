import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "./Modal"; // same modal used elsewhere in your app
import TradeDetail from "./TradeDetail"; // the inner detail view (no modal chrome)
import TradeLinkSearchDropdown from "./TradeLinkSearchDropDown";

export default function LinkedTradesPanel({
  linkedTrades = [],          // string[] | number[]
  allTrades = [],             // { id, symbol|ticker, pnl, date, time, rr, emotion, rating }[]
  isTradesReady = false,      // ✅ tell us when trades have finished loading
  onLink,                     // (id: string) => void
  onUnlink,                   // (id: string) => void
}) {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  // Normalize
  const linkedIds = useMemo(() => (linkedTrades || []).map(String), [linkedTrades]);

  const tradesById = useMemo(() => {
    const m = new Map();
    (allTrades || []).forEach((t) => {
      if (t?.id != null) m.set(String(t.id), { ...t, id: String(t.id) });
    });
    return m;
  }, [allTrades]);

  // ✅ Defer pruning until trades are loaded (prevents wiping links on first mount)
  const pruneTickRef = useRef(null);
  useEffect(() => {
    if (!isTradesReady || !onUnlink || linkedIds.length === 0) return;
    // compute missing AFTER trades are ready
    const missing = linkedIds.filter((id) => !tradesById.has(id));
    if (missing.length === 0) return;

    clearTimeout(pruneTickRef.current);
    pruneTickRef.current = setTimeout(() => {
      missing.forEach((id) => onUnlink(String(id)));
    }, 0);
    return () => clearTimeout(pruneTickRef.current);
  }, [isTradesReady, linkedIds, tradesById, onUnlink]);

  const handleLink = (id) => {
    const sid = String(id);
    if (!sid) return;
    if (linkedIds.includes(sid)) return; // already linked
    onLink?.(sid);
    setShowPicker(false);
  };

  return (
    <div className="w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-[#00ffa3] text-base">Linked Trades</div>
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg bg-teal-600/90 hover:bg-teal-600 text-gray-900 font-semibold"
          aria-expanded={showPicker}
          aria-controls="link-trade-picker"
        >
          {showPicker ? "Close" : "Link a trade"}
        </button>
      </div>

      {/* Linked list */}
      {linkedIds.length === 0 ? (
        <div className="text-zinc-500 text-sm italic text-center">
          No trades linked yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto hide-scrollbar">
          {linkedIds.map((tradeId) => {
            const trade = tradesById.get(tradeId);
            if (!trade) {
              return (
                <div
                  key={tradeId}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-400 italic"
                >
                  Trade not found (deleted)
                </div>
              );
            }
            const sym = trade.symbol || trade.ticker || "—";
            const pnlNum = Number(trade.pnl ?? 0);
            const pnlStr =
              pnlNum >= 0 ? `+$${pnlNum.toFixed(2)}` : `-$${Math.abs(pnlNum).toFixed(2)}`;

            return (
              <div
                key={tradeId}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 hover:shadow-[0_0_8px_rgba(0,255,163,0.2)] transition cursor-pointer"
                onClick={() => setSelectedTrade(trade)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{sym}</span>
                    <span className={`text-xs font-semibold ${pnlNum >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {pnlStr}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {(trade.date || "—")} {(trade.time || "")}
                    </span>
                  </div>
                  <button
                    className="ml-2 text-red-400 text-lg hover:bg-red-900/20 px-2 py-1 rounded"
                    onClick={(e) => { e.stopPropagation(); onUnlink?.(String(tradeId)); }}
                    title="Unlink"
                    aria-label={`Unlink trade ${sym}`}
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-zinc-400 mt-2">
                  R/R: {trade.rr ?? "–"} | Emotion: {trade.emotion ?? "–"} | Rating: {trade.rating ?? "–"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Picker */}
      {showPicker && (
        <div className="mt-4" id="link-trade-picker">
          <TradeLinkSearchDropdown
            trades={(allTrades || []).map((t) => ({ ...t, id: String(t.id) }))}
            linked={linkedIds}
            onLink={handleLink}
          />
        </div>
      )}

      {/* Modal overlay (same look/feel as Library) */}
      <Modal isOpen={!!selectedTrade} onClose={() => setSelectedTrade(null)}>
        {selectedTrade && (
          <TradeDetail
            trade={selectedTrade}
            onClose={() => setSelectedTrade(null)}
            onEdit={() => {}}
          />
        )}
      </Modal>
    </div>
  );
}
