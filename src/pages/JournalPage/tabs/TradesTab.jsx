// src/pages/JournalPage/tabs/TradesTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  LineChart,
  Search,
  Filter,
  ChevronDown,
  ArrowUpDown,
  Download,
  Send,
  CheckSquare,
  Square,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTrades as fetchTradesFromService } from "../../../utils/tradeService";

/* ======================= Glass tokens (vibe++) ======================= */
const shell =
  "rounded-[22px] border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,.35)]";
const card =
  "rounded-[18px] border border-white/10 bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]";
const pill =
  "h-10 px-3 rounded-[12px] bg-white/7 border border-white/10 text-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-300/40";
const cta =
  "h-10 px-3 rounded-[12px] bg-gradient-to-br from-emerald-400 to-cyan-400 text-black font-semibold inline-flex items-center justify-center gap-2 shadow-[0_10px_35px_rgba(34,211,238,.35)] hover:from-emerald-300 hover:to-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/60";
const subtle =
  "h-10 px-3 rounded-[12px] border border-white/12 bg-white/6 hover:bg-white/10 inline-flex items-center justify-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300/40";

/* ======================= Helpers ======================= */
const S = (v) => (v == null ? "" : typeof v === "object" ? "" : String(v));
function fmtMoney(n = 0) {
  const v = Number(n || 0);
  return v.toFixed(2);
}
function pnlClass(n = 0) {
  return n > 0 ? "text-emerald-300" : n < 0 ? "text-rose-300" : "text-zinc-200";
}
function chipClass(n = 0) {
  return n > 0
    ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
    : n < 0
    ? "bg-rose-500/10 border-rose-400/20 text-rose-200"
    : "bg-white/10 border-white/15 text-zinc-200";
}
function timeLabel(ts) {
  try {
    const d = new Date(ts);
    return isNaN(d) ? "—" : d.toLocaleTimeString();
  } catch {
    return "—";
  }
}
function tradeId(t) {
  return S(t.id ?? t.trade_id ?? `${S(t.symbol)}-${S(t.entry_time)}`);
}

/* ======================= Equity Sparkline (with glow + streak) ======================= */
function Sparkline({ points = [], width = 280, height = 64 }) {
  if (!points.length) return <div className="text-xs text-zinc-400">No trades</div>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1e-6, max - min);

  const coords = points.map((y, i) => {
    const x = (i / Math.max(1, points.length - 1)) * (width - 8) + 4;
    const py = height - ((y - min) / span) * (height - 12) - 6;
    return [x, py];
  });

  const path = coords.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const area =
    `M${coords[0][0]},${height - 6} ` +
    coords.map(([x, y]) => `L${x},${y}`).join(" ") +
    ` L${coords[coords.length - 1][0]},${height - 6} Z`;

  return (
    <svg width={width} height={height} className="block">
      <defs>
        <linearGradient id="eqGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.95)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0.9)" />
        </linearGradient>
        <linearGradient id="fillGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.25)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0.05)" />
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={area} fill="url(#fillGrad)" />
      <path d={path} stroke="url(#eqGrad)" strokeWidth="2.5" fill="none" filter="url(#softGlow)" />
      {/* traveling streak */}
      <motion.circle
        r="3.5"
        fill="url(#eqGrad)"
        initial={{ cx: coords[0][0], cy: coords[0][1] }}
        animate={{ cx: coords[coords.length - 1][0], cy: coords[coords.length - 1][1] }}
        transition={{ repeat: Infinity, repeatType: "mirror", duration: 5, ease: "easeInOut" }}
      />
    </svg>
  );
}

/* ======================= Dropdown ======================= */
function Dropdown({ label, value, onChange, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className={`${pill} hover:bg-white/10`} onClick={() => setOpen((v) => !v)}>
        <span className="opacity-80">{label}:</span>
        <span className="font-medium">{value || "Any"}</span>
        <ChevronDown size={14} className="opacity-70" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={`${shell} absolute right-0 mt-2 min-w-[200px] p-2 z-30`}
          >
            {items.map((it) => {
              const v = it === "Any" ? "" : it;
              const active = (!value && it === "Any") || value === v;
              return (
                <button
                  key={it}
                  onClick={() => {
                    onChange(v);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-[12px] text-sm hover:bg-white/10 ${
                    active ? "bg-white/10" : ""
                  }`}
                >
                  {it}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ======================= Trade row (mobile card) ======================= */
function TradeCard({ t, selected, onToggle }) {
  const pnl = Number(t.pnl ?? 0);
  const id = tradeId(t);
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={`${card} p-4`}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
    >
      <div className="flex items-center justify-between">
        <button onClick={() => onToggle(id)} className="inline-flex items-center gap-2 text-sm">
          {selected ? <CheckSquare size={16} /> : <Square size={16} />}
          Select
        </button>
        <span className={`px-2 py-0.5 text-[11px] rounded-full border ${chipClass(pnl)}`}>
          ${fmtMoney(pnl)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <div className="text-[15px] font-semibold">{S(t.symbol) || "—"}</div>
        <div className="text-xs text-zinc-400">{S(t.account) || "—"}</div>
      </div>
      <div className="mt-1 text-sm text-zinc-300">
        {S(t.setup) ? S(t.setup) : <span className="opacity-60">No setup</span>}
      </div>
      <div className="mt-1 text-xs text-zinc-400">{timeLabel(t.entry_time)}</div>
      <div className="mt-2 text-xs text-zinc-400">
        Outcome: {t.outcome || (pnl > 0 ? "win" : pnl < 0 ? "loss" : "be")}
      </div>
    </motion.div>
  );
}

/* ======================= Group Card (collapsible) ======================= */
function GroupCard({ symbol, trades, open, onToggle }) {
  const pnl = trades.reduce((a, b) => a + Number(b.pnl || 0), 0);
  const equity = [];
  let run = 0;
  [...trades]
    .sort((a, b) => new Date(a.entry_time || 0) - new Date(b.entry_time || 0))
    .forEach((t) => {
      run += Number(t.pnl || 0);
      equity.push(run);
    });

  return (
    <div className={`${shell} p-3`}>
      <button className="w-full flex items-center justify-between" onClick={onToggle} aria-expanded={open}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-[15px] font-semibold truncate">{symbol}</div>
          <div className="text-xs opacity-70">({trades.length} trade{trades.length !== 1 ? "s" : ""})</div>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`text-sm font-semibold ${pnlClass(pnl)} ${
              pnl > 0 ? "glow-pos" : pnl < 0 ? "glow-neg" : ""
            }`}
          >
            ${fmtMoney(pnl)}
          </div>
          <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-zinc-300">Equity (group)</div>
              <Sparkline points={equity} />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left opacity-70">
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Setup</th>
                    <th className="py-2 pr-4">Outcome</th>
                    <th className="py-2 pr-4">P/L</th>
                    <th className="py-2 pr-4">Account</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => {
                    const id = tradeId(t);
                    const pnl = Number(t.pnl ?? 0);
                    const derivedOutcome = pnl > 0 ? "win" : pnl < 0 ? "loss" : "be";
                    return (
                      <tr
                        key={id}
                        className="border-t border-white/10 hover:bg-white/5 transition-colors"
                        title={`Duration: ${S(t.duration) || "—"} • R:R: ${S(t.rr) || "—"}`}
                      >
                        <td className="py-2 pr-4">{timeLabel(t.entry_time)}</td>
                        <td className="py-2 pr-4">{S(t.setup) || "—"}</td>
                        <td className="py-2 pr-4">{t.outcome || derivedOutcome}</td>
                        <td className="py-2 pr-4 relative">
                          {/* faint pnl backdrop for impact */}
                          <div
                            className={`absolute inset-y-1 right-2 left-[60%] rounded-md blur-sm opacity-20 ${
                              pnl > 0 ? "bg-emerald-400" : pnl < 0 ? "bg-rose-400" : "bg-white/0"
                            }`}
                          />
                          <span className={`relative z-10 font-semibold ${pnlClass(pnl)}`}>${fmtMoney(pnl)}</span>
                        </td>
                        <td className="py-2 pr-4">{S(t.account) || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ======================= Main ======================= */
export default function TradesTab({
  date,
  trades: tradesProp = [],
  journal,
  onChangeJournal,
  scope, // optional, for tradeService
}) {
  // local data (optional fetch if prop empty)
  const [trades, setTrades] = useState(tradesProp);
  useEffect(() => setTrades(tradesProp), [tradesProp]);
  useEffect(() => {
    (async () => {
      if (tradesProp?.length) return;
      try {
        const fetched = await fetchTradesFromService(scope || {});
        if (Array.isArray(fetched) && fetched.length) setTrades(fetched);
      } catch {
        /* local-only ok */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filters
  const [q, setQ] = useState("");
  const [symbol, setSymbol] = useState("");
  const [outcome, setOutcome] = useState("");
  const [account, setAccount] = useState("");
  const [sort, setSort] = useState({ key: "time", dir: "desc" }); // time | pnl | symbol

  // selection
  const [selected, setSelected] = useState(new Set());

  // group open state
  const [openGroups, setOpenGroups] = useState(() => new Set()); // symbols open

  /* ---------- derive options ---------- */
  const symbols = useMemo(
    () =>
      Array.from(
        new Set(trades.map((t) => S(t.symbol).toUpperCase()).filter(Boolean))
      ).sort(),
    [trades]
  );
  const accounts = useMemo(
    () =>
      Array.from(new Set(trades.map((t) => S(t.account)).filter(Boolean))).sort(),
    [trades]
  );

  /* ---------- filtered ---------- */
  const filtered = useMemo(() => {
    const lower = S(q).toLowerCase();
    let arr = (trades || []).filter((t) => {
      const sym = S(t.symbol).toLowerCase();
      const setup = S(t.setup).toLowerCase();
      const okQ = lower ? sym.includes(lower) || setup.includes(lower) : true;
      const okSym = symbol ? S(t.symbol).toUpperCase() === symbol : true;
      const pnl = Number(t.pnl ?? 0);
      const derivedOutcome = pnl > 0 ? "win" : pnl < 0 ? "loss" : "be";
      const okOutcome = outcome ? (t.outcome || derivedOutcome) === outcome : true;
      const okAcc = account ? S(t.account) === account : true;
      return okQ && okSym && okOutcome && okAcc;
    });

    // sorting
    arr.sort((a, b) => {
      if (sort.key === "pnl") {
        const da = Number(a.pnl ?? 0),
          db = Number(b.pnl ?? 0);
        return sort.dir === "asc" ? da - db : db - da;
      }
      if (sort.key === "symbol") {
        const da = S(a.symbol).localeCompare(S(b.symbol));
        return sort.dir === "asc" ? da : -da;
      }
      // time default
      const ta = new Date(a.entry_time || a.exit_time || 0).getTime();
      const tb = new Date(b.entry_time || b.exit_time || 0).getTime();
      return sort.dir === "asc" ? ta - tb : tb - ta;
    });

    return arr;
  }, [trades, q, symbol, outcome, account, sort]);

  /* ---------- stats ---------- */
  const stats = useMemo(() => {
    const count = filtered.length;
    const pnl = filtered.reduce((a, b) => a + Number(b.pnl || 0), 0);
    const wins = filtered.filter((x) => Number(x.pnl || 0) > 0).length;
    const wr = count ? Math.round((wins / count) * 100) : 0;
    const avg = count ? pnl / count : 0;

    const byTime = [...filtered].sort(
      (a, b) => new Date(a.entry_time || 0) - new Date(b.entry_time || 0)
    );
    const equity = [];
    let run = 0;
    byTime.forEach((t) => {
      run += Number(t.pnl || 0);
      equity.push(run);
    });

    return { count, pnl, wr, avg, equity };
  }, [filtered]);

  function toggleSort(key) {
    setSort((s) => {
      if (s.key === key) return { key, dir: s.dir === "asc" ? "desc" : "asc" };
      return { key, dir: key === "symbol" ? "asc" : "desc" };
    });
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function clearSelection() {
    setSelected(new Set());
  }

  /* ---------- grouping ---------- */
  const bySymbol = useMemo(() => {
    const map = new Map();
    for (const t of filtered) {
      const key = S(t.symbol).toUpperCase() || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return map;
  }, [filtered]);

  /* ---------- actions ---------- */
  function downloadCSV(rows) {
    const header = [
      "id",
      "symbol",
      "entry_time",
      "exit_time",
      "pnl",
      "setup",
      "outcome",
      "account",
    ];
    const csv =
      header.join(",") +
      "\n" +
      rows
        .map((t) =>
          [
            `"${tradeId(t)}"`,
            `"${S(t.symbol)}"`,
            `"${S(t.entry_time)}"`,
            `"${S(t.exit_time)}"`,
            `${Number(t.pnl ?? 0)}`,
            `"${S(t.setup).replace(/"/g, '""')}"`,
            `"${S(t.outcome)}"`,
            `"${S(t.account)}"`,
          ].join(",")
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ztrader_trades_${date || "export"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function sendSelectionToReview() {
    if (!onChangeJournal) return;
    const rows = filtered.filter((t) => selected.has(tradeId(t)));
    if (!rows.length) return;
    const payload = {
      ...journal,
      review: {
        ...(journal?.review || {}),
        actions: [
          ...(journal?.review?.actions || []),
          {
            title: `Analyze ${rows.length} trade${rows.length !== 1 ? "s" : ""} – ${new Date().toLocaleString()}`,
            detail:
              "Auto-added from Trades tab selection. Review setups, adherence, and outcomes.",
            linked_trade_ids: rows.map((t) => tradeId(t)),
          },
        ],
      },
    };
    onChangeJournal(payload);
    clearSelection();
  }

  const selectionArray = filtered.filter((t) => selected.has(tradeId(t)));
  const hasSelection = selectionArray.length > 0;

  return (
    <div className="space-y-6 relative">
      {/* subtle grain layer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-[.06] [background:radial-gradient(500px_140px_at_100%_-20%,rgba(34,211,238,.18),transparent),radial-gradient(500px_140px_at_-10%_110%,rgba(16,185,129,.16),transparent)]"
      />

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className={`${card} p-4 text-center`}>
          <div className="text-sm opacity-70">Trades</div>
          <div className="text-2xl font-semibold drop-shadow-[0_1px_0_rgba(0,0,0,.35)]"> {stats.count} </div>
        </div>
        <div className={`${card} p-4 text-center`}>
          <div className="text-sm opacity-70">Net P/L</div>
          <div
            className={`text-2xl font-semibold ${pnlClass(stats.pnl)} ${
              stats.pnl > 0 ? "glow-pos" : stats.pnl < 0 ? "glow-neg" : ""
            }`}
          >
            ${fmtMoney(stats.pnl)}
          </div>
        </div>
        <div className={`${card} p-4 text-center`}>
          <div className="text-sm opacity-70">Win rate</div>
          <div className="text-2xl font-semibold">{stats.wr}%</div>
        </div>
      </div>

      {/* Equity sparkline */}
      <div className={`${shell} p-4 flex items-center justify-between gap-4 ring-1 ring-white/5`}>
        <div className="flex items-center gap-2">
          <LineChart size={18} />
          <div>
            <div className="text-[13px] text-zinc-300">Equity (filtered)</div>
            <div className={`text-sm ${pnlClass(stats.pnl)}`}>
              Net ${fmtMoney(stats.pnl)} • Avg ${fmtMoney(stats.avg)}
            </div>
          </div>
        </div>
        <Sparkline points={stats.equity} />
      </div>

      {/* Toolbar */}
      <div className={`${shell} p-4 sticky top-[72px] z-20`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className={`${pill} w-full sm:w-[260px]`}>
            <Search size={16} className="opacity-70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search symbol/setup…"
              className="bg-transparent outline-none flex-1"
            />
          </div>
          <Dropdown label="Symbol" value={symbol} onChange={setSymbol} items={["Any", ...symbols]} />
          <Dropdown label="Outcome" value={outcome} onChange={setOutcome} items={["Any", "win", "loss", "be"]} />
          <Dropdown label="Account" value={account} onChange={setAccount} items={["Any", ...accounts]} />
          <span className="hidden sm:inline-flex items-center gap-2 text-sm text-zinc-300 ml-auto">
            <Filter size={16} className="opacity-70" /> {filtered.length} shown
          </span>
        </div>

        {/* Bulk actions */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="text-sm opacity-80">
            Selected: <span className="font-semibold">{selectionArray.length}</span>
          </div>
          <button
            className={subtle}
            onClick={() => downloadCSV(hasSelection ? selectionArray : filtered)}
            title="Export CSV (selection or filtered)"
          >
            <Download size={16} /> Export CSV
          </button>
          <button className={`${cta} ${hasSelection ? "shadow-[0_0_25px_rgba(34,211,238,.35)]" : ""}`} onClick={sendSelectionToReview} disabled={!hasSelection}>
            <Send size={16} /> Send selection to Review
          </button>
        </div>
      </div>

      {/* Table (desktop) */}
      <div className={`hidden md:block ${shell} p-4`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left opacity-70">
                <th className="py-2 pr-4">
                  <button className="inline-flex items-center gap-1 hover:text-white" onClick={() => toggleSort("time")}>
                    Time <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="py-2 pr-4">
                  <button className="inline-flex items-center gap-1 hover:text-white" onClick={() => toggleSort("symbol")}>
                    Symbol <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="py-2 pr-4">Setup</th>
                <th className="py-2 pr-4">Outcome</th>
                <th className="py-2 pr-4">
                  <button className="inline-flex items-center gap-1 hover:text-white" onClick={() => toggleSort("pnl")}>
                    P/L <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="py-2 pr-4">Account</th>
                <th className="py-2 pr-4">Select</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const pnl = Number(t.pnl ?? 0);
                const derivedOutcome = pnl > 0 ? "win" : pnl < 0 ? "loss" : "be";
                const id = tradeId(t);
                return (
                  <motion.tr
                    key={id}
                    className="border-t border-white/10 hover:bg-white/[.06] hover:shadow-[0_6px_22px_rgba(34,211,238,.08)]"
                    initial={false}
                    whileHover={{ y: -1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    title={`Duration: ${S(t.duration) || "—"} • R:R: ${S(t.rr) || "—"}`}
                  >
                    <td className="py-2 pr-4">{timeLabel(t.entry_time)}</td>
                    <td className="py-2 pr-4 font-medium">{S(t.symbol) || "—"}</td>
                    <td className="py-2 pr-4">{S(t.setup) || "—"}</td>
                    <td className="py-2 pr-4">{t.outcome || derivedOutcome}</td>
                    <td className="py-2 pr-4 relative">
                      <div
                        className={`absolute inset-y-1 right-3 left-[60%] rounded-lg blur-[6px] opacity-20 ${
                          pnl > 0 ? "bg-emerald-400" : pnl < 0 ? "bg-rose-400" : "bg-transparent"
                        }`}
                      />
                      <span className={`relative z-10 font-semibold ${pnlClass(pnl)}`}>${fmtMoney(pnl)}</span>
                    </td>
                    <td className="py-2 pr-4">{S(t.account) || "—"}</td>
                    <td className="py-2 pr-4">
                      <button onClick={() => toggleSelect(id)} className="inline-flex items-center gap-2">
                        {selected.has(id) ? <CheckSquare size={16} /> : <Square size={16} />}
                        <span className="text-xs">Select</span>
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center opacity-60">No trades found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards (mobile) */}
      <div className="grid md:hidden grid-cols-1 gap-3">
        {filtered.map((t) => (
          <TradeCard key={tradeId(t)} t={t} selected={selected.has(tradeId(t))} onToggle={toggleSelect} />
        ))}
        {!filtered.length && (
          <div className={`${card} p-6 text-center text-sm text-zinc-400`}>No trades found.</div>
        )}
      </div>

      {/* Per-symbol collapsible groups */}
      <div className="space-y-3">
        {[...bySymbol.entries()].map(([sym, rows]) => (
          <GroupCard
            key={sym}
            symbol={sym}
            trades={rows}
            open={openGroups.has(sym)}
            onToggle={() =>
              setOpenGroups((prev) => {
                const next = new Set(prev);
                if (next.has(sym)) next.delete(sym);
                else next.add(sym);
                return next;
              })
            }
          />
        ))}
      </div>

      {/* Footer tip */}
      <div className={`${shell} p-4 flex items-center gap-2`}>
        <CalendarDays size={16} className="opacity-80" />
        <p className="text-sm opacity-80">
          Date: <span className="text-zinc-200">{date}</span>. Use Insights to capture lessons, then filter here to verify the impact.
        </p>
      </div>

      {/* Mobile bottom action bar */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="md:hidden fixed bottom-3 inset-x-3 z-30"
          >
            <div className={`${shell} p-2 flex items-center gap-2`}>
              <div className="text-sm flex-1">Selected: <span className="font-semibold">{selectionArray.length}</span></div>
              <button className={subtle} onClick={() => downloadCSV(selectionArray)}>
                <Download size={16} /> CSV
              </button>
              <button className={cta} onClick={sendSelectionToReview}>
                <Send size={16} /> Review
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vibe styles */}
      <style>{`
        .glow-pos { text-shadow: 0 0 18px rgba(16,185,129,.45); }
        .glow-neg { text-shadow: 0 0 18px rgba(244,63,94,.45); }
      `}</style>
    </div>
  );
}
