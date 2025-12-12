// src/pages/Library.jsx
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Upload,
  Grid as GridIcon,
  List as ListIcon,
  Download,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  Pencil,
} from "lucide-react";
import { toast } from "react-hot-toast";

import PageLoader from "../components/PageLoader";
import TradeCard from "../components/TradeCard";
import Modal from "../components/Modal";
import TradeDetail from "../components/TradeDetail";
import TradeForm from "../components/TradeForm";
import CSVImportModal from "../components/CSVImportModal";

import {
  fetchTrades,
  addTrade,
  updateTrade,
  deleteTrade,
  deleteAllTrades,
  displayUrlForImage
} from "../utils/tradeService";

/* ---------- helpers ---------- */

const humanDuration = (d) => {
  if (!d) return "—";
  if (/[hms]/i.test(d)) {
    return d
      .replace(/\s+/g, "")
      .replace(/h/gi, "h ")
      .replace(/m/gi, "m ")
      .replace(/s/gi, "s ")
      .trim();
  }
  const parts = String(d)
    .split(":")
    .map((n) => parseInt(n, 10) || 0);
  let h = 0,
    m = 0,
    s = 0;
  if (parts.length === 3) [h, m, s] = parts;
  else if (parts.length === 2) [m, s] = parts;
  else if (parts.length === 1) [s] = parts;
  const out = [];
  if (h) out.push(`${h}h`);
  if (m) out.push(`${m}m`);
  if (s && !h && !m) out.push(`${s}s`);
  return out.length ? out.join(" ") : "0s";
};

const parseDurationToMinutes = (raw) => {
  if (!raw) return 0;
  if (/[hms]/i.test(raw)) {
    const n = (re) => (raw.match(re) ? parseInt(raw.match(re)[1], 10) : 0);
    return Math.round(
      n(/(\d+)\s*h/i) * 60 + n(/(\d+)\s*m/i) + n(/(\d+)\s*s/i) / 60
    );
  }
  const p = String(raw)
    .split(":")
    .map((n) => parseInt(n, 10));
  if (p.length === 3) return Math.round(p[0] * 60 + p[1] + p[2] / 60);
  if (p.length === 2) return Math.round(p[0] + p[1] / 60);
  if (p.length === 1 && !Number.isNaN(p[0])) return p[0];
  return 0;
};

const downloadAsCSV = (rows, filename = "trades_export.csv") => {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const csv =
    [headers.join(",")]
      .concat(
        rows.map((r) =>
          headers
            .map((h) => {
              const v = r[h] ?? "";
              return /[",\n]/.test(String(v))
                ? `"${String(v).replaceAll('"', '""')}"`
                : v;
            })
            .join(",")
        )
      )
      .join("\n") + "\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ---------- page ---------- */

export default function Library() {
  const [allTrades, setAllTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState(
    localStorage.getItem("lib.sort") || "dateDesc"
  );
  const [view, setView] = useState(
    localStorage.getItem("lib.view") || "grid"
  );

  const [selectedTrade, setSelectedTrade] = useState(null);
  const [mode, setMode] = useState(null); // 'detail' | 'form' | null

  const [showImport, setShowImport] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const refresh = async (showToast = false) => {
    setLoading(true);
    try {
      const data = await fetchTrades();
      setAllTrades(data || []);
      if (showToast) toast.success("Trades refreshed");
    } catch (e) {
      console.error(e);
      toast.error("Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => localStorage.setItem("lib.view", view), [view]);
  useEffect(() => localStorage.setItem("lib.sort", sortBy), [sortBy]);

  /* ---------- stats ---------- */
  const stats = useMemo(() => {
    const total = allTrades.length;
    if (!total)
      return {
        total: 0,
        wins: 0,
        winRate: 0,
        netPnl: 0,
        avgDuration: 0,
        best: 0,
        worst: 0,
      };

    const wins = allTrades.filter((t) => Number(t.pnl) > 0).length;
    const netPnl = allTrades.reduce(
      (s, t) => s + (parseFloat(t.pnl) || 0),
      0
    );
    const avgDuration =
      allTrades.reduce((s, t) => s + parseDurationToMinutes(t.duration), 0) /
      total;
    const best = Math.max(...allTrades.map((t) => parseFloat(t.pnl) || 0));
    const worst = Math.min(...allTrades.map((t) => parseFloat(t.pnl) || 0));

    return {
      total,
      wins,
      winRate: Math.round((wins / total) * 100),
      netPnl,
      avgDuration: Math.round(avgDuration),
      best,
      worst,
    };
  }, [allTrades]);

  /* ---------- filters ---------- */
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const byText = (t) =>
      !q ||
      [
        t.symbol,
        t.details?.notes ?? t.notes,
        t.accountType,
        t.direction,
        t.setup?.entryCriteria,
        t.setup?.confluences,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);

    const byDate = (t) => {
      if (!dateFrom && !dateTo) return true;
      const d = dayjs(t.date);
      if (dateFrom && d.isBefore(dayjs(dateFrom), "day")) return false;
      if (dateTo && d.isAfter(dayjs(dateTo), "day")) return false;
      return true;
    };

    return allTrades.filter((t) => byText(t) && byDate(t));
  }, [allTrades, searchTerm, dateFrom, dateTo]);

  const filteredSorted = useMemo(() => {
    const arr = [...filtered];
    const dcmp = (a, b) =>
      new Date(`${a.date} ${a.time || "00:00"}`) -
      new Date(`${b.date} ${b.time || "00:00"}`);

    switch (sortBy) {
      case "dateAsc":
        arr.sort(dcmp);
        break;
      case "dateDesc":
        arr.sort((a, b) => dcmp(b, a));
        break;
      case "pnlHigh":
        arr.sort(
          (a, b) => (parseFloat(b.pnl) || 0) - (parseFloat(a.pnl) || 0)
        );
        break;
      case "pnlLow":
        arr.sort(
          (a, b) => (parseFloat(a.pnl) || 0) - (parseFloat(b.pnl) || 0)
        );
        break;
      case "rrHigh":
        arr.sort((a, b) => (b.rr || 0) - (a.rr || 0));
        break;
      case "rrLow":
        arr.sort((a, b) => (a.rr || 0) - (b.rr || 0));
        break;
      default:
    }
    return arr;
  }, [filtered, sortBy]);

  /* ---------- actions ---------- */
  const openForm = (t = null) => {
    setSelectedTrade(t);
    setMode("form");
  };
  const openDetail = (t) => {
    setSelectedTrade(t);
    setMode("detail");
  };
  const closeModal = () => {
    setSelectedTrade(null);
    setMode(null);
  };

  const onSaveTrade = async (payloadOrId, data) => {
    if (selectedTrade?.id) {
      await updateTrade(selectedTrade.id, data);
      toast.success("Trade updated");
    } else {
      await addTrade(payloadOrId);
      toast.success("Trade added");
    }
    await refresh();
    closeModal();
  };

  const onDeleteTrade = async (id) => {
    await deleteTrade(id);
    toast.success("Trade deleted");
    await refresh();
  };

  /* ---------- small components ---------- */

  const Stat = ({ label, value, accent }) => (
    <motion.div
      layout
      className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-white/10 bg-gradient-to-br from-zinc-900/70 to-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <p className="text-[11px] sm:text-xs text-zinc-400">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold mt-1 ${accent || ""}`}>
        {value}
      </p>
      <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
    </motion.div>
  );

  // Centered, mobile-first segmented control
  const Segmented = ({ value, onChange }) => {
    const isGrid = value === "grid";
    return (
      <div className="w-full sm:w-auto">
        <div className="relative mx-auto w-full max-w-[220px] rounded-full border border-white/10 bg-zinc-900/70 p-1">
          <div className="relative grid grid-cols-2 h-10">
            <motion.div
              className="absolute top-1 bottom-1 rounded-full bg-zinc-800"
              initial={false}
              animate={{ left: isGrid ? 4 : "calc(50% + 4px)", right: isGrid ? "calc(50% + 4px)" : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
            />
            <button
              onClick={() => onChange("grid")}
              className={`relative z-10 inline-flex items-center justify-center gap-2 text-sm transition-colors ${
                isGrid ? "text-white" : "text-zinc-400"
              }`}
              aria-pressed={isGrid}
              title="Grid"
            >
              <GridIcon size={16} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => onChange("list")}
              className={`relative z-10 inline-flex items-center justify-center gap-2 text-sm transition-colors ${
                !isGrid ? "text-white" : "text-zinc-400"
              }`}
              aria-pressed={!isGrid}
              title="List"
            >
              <ListIcon size={16} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const IconButton = ({ onClick, children, title, danger }) => (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition w-full sm:w-auto
        ${
          danger
            ? "bg-rose-600/90 hover:bg-rose-500 border-rose-400/20"
            : "bg-zinc-800/80 hover:bg-zinc-700/80 border-white/10"
        }
      `}
    >
      {children}
    </button>
  );

  /* ---------- UI ---------- */

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 text-white space-y-6 md:space-y-8 overflow-x-hidden">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 sm:p-6 md:p-8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative grid gap-4 md:gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Trade Library
            </h1>
            <p className="mt-1 text-zinc-400 text-sm sm:text-base">
              Every trade. Cleanly organized. Import, filter, review — fast.
            </p>
          </div>

          {/* Actions row — perfectly centered on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 items-center">
            <IconButton onClick={() => setShowImport(true)} title="Import CSV">
              <Upload size={16} />
              <span className="hidden sm:inline">Import</span>
              <span className="sm:hidden">Import CSV</span>
            </IconButton>

            <div className="order-last sm:order-none">
              <Segmented value={view} onChange={setView} />
            </div>

            <button
              onClick={() => openForm()}
              className="group w-full sm:w-auto justify-center flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 font-semibold text-black shadow-lg hover:bg-emerald-400 transition"
            >
              <Plus size={18} />
              Add Trade
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
        <Stat label="Total Trades" value={stats.total} />
        <Stat label="Win Rate" value={`${stats.winRate}%`} />
        <Stat
          label="Net P&L"
          value={`${stats.netPnl >= 0 ? "+" : "-"}$${Math.abs(
            stats.netPnl || 0
          ).toFixed(2)}`}
          accent={stats.netPnl >= 0 ? "text-emerald-400" : "text-rose-400"}
        />
        <Stat label="Avg Duration" value={`${stats.avgDuration}m`} />
        <Stat
          label="Best Trade"
          value={`$${stats.best.toFixed(2)}`}
          accent="text-emerald-400"
        />
        <Stat
          label="Worst Trade"
          value={`$${stats.worst.toFixed(2)}`}
          accent="text-rose-400"
        />
      </div>

      {/* Controls */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+16px)] z-10">
        <motion.div
          layout
          className="rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur px-4 py-3"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 flex items-center gap-2">
              <Filter size={16} className="text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Search symbol, notes, account, confluences…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:max-w-md bg-zinc-800/80 px-3 py-2 rounded-lg text-sm text-white placeholder:text-zinc-500 border border-white/10"
              />
              <div className="hidden md:flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-zinc-800/80 text-sm rounded-lg p-2 border border-white/10"
                />
                <span className="text-zinc-500 text-sm">→</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-zinc-800/80 text-sm rounded-lg p-2 border border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center justify-center md:justify-end gap-2 sm:gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-zinc-800/80 text-white text-sm rounded-lg p-2 border border-white/10 col-span-2 sm:col-span-1"
              >
                <option value="dateDesc">Date (Newest)</option>
                <option value="dateAsc">Date (Oldest)</option>
                <option value="pnlHigh">P&L (High→Low)</option>
                <option value="pnlLow">P&L (Low→High)</option>
                <option value="rrHigh">R/R (High→Low)</option>
                <option value="rrLow">R/R (Low→High)</option>
              </select>

              <IconButton
                onClick={() => {
                  downloadAsCSV(filteredSorted, "library_export.csv");
                  toast.success("Exported filtered trades");
                }}
                title="Export filtered as CSV"
              >
                <Download size={16} />
                Export
              </IconButton>

              <IconButton onClick={() => refresh(true)} title="Refresh">
                <RefreshCw size={16} className="animate-spin-slow" />
                Refresh
              </IconButton>

              <span className="hidden md:inline-flex">
                <IconButton
                  onClick={() => setConfirmDeleteAll(true)}
                  danger
                  title="Delete all trades"
                >
                  <Trash2 size={16} />
                  Delete All
                </IconButton>
              </span>
            </div>
          </div>

          {/* mobile date range */}
          <div className="mt-3 md:hidden grid grid-cols-2 gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-zinc-800/80 text-sm rounded-lg p-2 border border-white/10"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-zinc-800/80 text-sm rounded-lg p-2 border border-white/10"
            />
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="min-h-[320px]">
        {loading ? (
          <PageLoader />
        ) : filteredSorted.length ? (
          <AnimatePresence mode="wait">
            {view === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              >
                {filteredSorted.map((t) => (
                  <TradeCard
                    key={t.id}
                    trade={t}
                    onView={() => openDetail(t)}
                    onEdit={() => openForm(t)}
                    onDelete={() => onDeleteTrade(t.id)}
                  />
                ))}
              </motion.div>
            ) : (
              <>
    {/* Mobile list: dense rows with dividers (real list, not cards) */}
    <motion.ul
      key="list-mobile"
      className="sm:hidden rounded-2xl border border-white/10 overflow-hidden bg-zinc-900/40"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
    >
      {filteredSorted.map((t, i) => {
        const win = parseFloat(t.pnl) >= 0;
        return (
          <li
            key={t.id}
            className={`px-3 py-3 ${i !== 0 ? "border-t border-white/10" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">
                    {(t.symbol || "").toString().toUpperCase()}
                  </span>
                  <span className="text-[11px] text-zinc-400 truncate">
                    {dayjs(t.date).format("DD MMM")} · {t.time || "—"}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-400 truncate">
                  R/R {t.rr ?? "–"} · {humanDuration(t.duration)}
                </div>
              </div>

              <div
                className={`text-sm font-semibold shrink-0 ${
                  win ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                ${Math.abs(parseFloat(t.pnl || 0)).toFixed(2)}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => openDetail(t)}
                className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10 inline-flex items-center gap-1"
                title="View"
              >
                <Eye size={14} /> View
              </button>
              <button
                onClick={() => openForm(t)}
                className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-yellow-200 hover:bg-white/10 inline-flex items-center gap-1"
                title="Edit"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => onDeleteTrade(t.id)}
                className="ml-auto rounded-md bg-white/5 px-3 py-1.5 text-xs text-rose-300 hover:bg-white/10 inline-flex items-center gap-1"
                title="Delete"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </li>
        );
      })}
    </motion.ul>

    {/* Desktop/tablet list: table (unchanged) */}
    <motion.div
      key="list-desktop"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="hidden sm:block overflow-x-auto -mx-4 md:mx-0"
    >
                  <div className="min-w-[720px] rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full bg-zinc-900/50">
                      <thead className="bg-zinc-800/60">
                        <tr>
                          {["Symbol", "Date", "P&L", "R/R", "Duration", "Actions"].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-4 py-3 text-left text-sm text-zinc-400"
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSorted.map((t) => {
                          const win = parseFloat(t.pnl) >= 0;
                          return (
                            <tr
                              key={t.id}
                              className="border-t border-white/5 hover:bg-white/5"
                            >
                              <td className="px-4 py-3">
                                {(t.symbol || "").toString().toUpperCase()}
                              </td>
                              <td className="px-4 py-3">
                                {dayjs(t.date).format("DD MMM YYYY")} ·{" "}
                                {t.time || "—"}
                              </td>
                              <td
                                className={`px-4 py-3 font-semibold ${
                                  win ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                ${Math.abs(parseFloat(t.pnl || 0)).toFixed(2)}
                              </td>
                              <td className="px-4 py-3">{t.rr ?? "–"}</td>
                              <td className="px-4 py-3">
                                {humanDuration(t.duration)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openDetail(t)}
                                    className="rounded-md bg-white/5 px-2 py-1 text-xs text-zinc-200 hover:bg-white/10 inline-flex items-center gap-1"
                                    title="View"
                                  >
                                    <Eye size={14} /> View
                                  </button>
                                  <button
                                    onClick={() => openForm(t)}
                                    className="rounded-md bg-white/5 px-2 py-1 text-xs text-yellow-200 hover:bg-white/10 inline-flex items-center gap-1"
                                    title="Edit"
                                  >
                                    <Pencil size={14} /> Edit
                                  </button>
                                  <button
                                    onClick={() => onDeleteTrade(t.id)}
                                    className="rounded-md bg-white/5 px-2 py-1 text-xs text-rose-300 hover:bg-white/10 inline-flex items-center gap-1"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        ) : (
          <div className="text-center text-zinc-500 py-16 space-y-4">
            <p className="text-lg">No trades match your filters.</p>
            <div className="grid grid-cols-1 sm:inline-flex items-center justify-center gap-2 sm:gap-3">
              <IconButton onClick={() => setShowImport(true)} title="Import CSV">
                <Upload size={16} />
                Import
              </IconButton>
              <button
                onClick={() => openForm()}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Trade
              </button>
              {(dateFrom || dateTo || searchTerm) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile floating add */}
      <button
        onClick={() => openForm()}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 md:hidden z-40 rounded-full bg-emerald-500 p-4 text-black shadow-lg hover:bg-emerald-400"
        aria-label="Add Trade"
        title="Add Trade"
      >
        <Plus size={22} />
      </button>

      {/* Modals */}
      <Modal isOpen={mode !== null} onClose={closeModal}>
        <AnimatePresence mode="wait">
          {mode === "detail" && selectedTrade && (
            <TradeDetail
              trade={selectedTrade}
              onClose={closeModal}
              onEdit={() => openForm(selectedTrade)}
            />
          )}
          {mode === "form" && (
            <TradeForm
              existingTrade={selectedTrade}
              initialDate={
                selectedTrade?.date || dayjs().format("YYYY-MM-DD")
              }
              onSave={onSaveTrade}
              onClose={closeModal}
            />
          )}
        </AnimatePresence>
      </Modal>

      <Modal isOpen={showImport} onClose={() => setShowImport(false)}>
        <CSVImportModal
          isOpen
          onClose={() => setShowImport(false)}
          refresh={() => refresh()}
        />
      </Modal>

      <Modal
        isOpen={confirmDeleteAll}
        onClose={() => setConfirmDeleteAll(false)}
      >
        <div className="p-6 bg-zinc-900 rounded-2xl max-w-sm mx-auto">
          <h2 className="text-xl font-bold">Delete all trades?</h2>
          <p className="text-sm text-zinc-400 mt-2">This cannot be undone.</p>
          <div className="mt-4 flex justify-end gap-3">
            <button
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md"
              onClick={() => setConfirmDeleteAll(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-md"
              onClick={async () => {
                await deleteAllTrades();
                toast.success("All trades deleted");
                await refresh();
                setConfirmDeleteAll(false);
              }}
            >
              Delete All
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
