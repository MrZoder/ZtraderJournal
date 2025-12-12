// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  DollarSign,
  Trophy,
  Activity,
  Award,
  Copy as CopyIcon,
  Check as CheckIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";

import SubTabsBar from "../components/SubTabBar";
import WelcomeHero from "../components/WelcomeHero";

import DailyTargetProgress from "../components/DailyTargetProgress";
import SessionCountdown from "../components/SessionCountdown";
import Calendar from "../components/Calendar";
import DailyRules from "../components/DailyRules";
import RecentTrades from "../components/RecentTrades";
import MiniTraderStreak from "../components/MiniTraderStreak";
import MiniPLChart from "../components/MiniPLChart";
import SimpleTradeForm from "../components/SimpleTradeForm";
import DayTrades from "../components/DayTrades";
import QuickAddTradeButton from "../components/QuickAddTradeButton";
import Modal from "../components/Modal";
import PlanSummaryCard from "../components/PlanSummaryCard";
import ReviewPanel from "../components/DashReviewPanel";

import {
  fetchTrades,
  addTrade,
  updateTrade,
  deleteTrade,
} from "../utils/tradeService";
import { fetchJournals } from "../utils/journalService";
import { getDailyRules } from "../utils/ruleService";

import FinancialsTab from "./tabs/FinancialsTab";
import AccountScopeSelect from "../components/AccountScopeSelect";
import { useScope } from "../state/scopeStore";
import { createAccount, emitAccountsChanged } from "../utils/accountsService";
import ManageAccountsModal from "../components/ManageAccountModal";

const SUBTABS = [
  { name: "Performance", icon: LayoutDashboard },
  { name: "Calendar", icon: CalendarDays },
  { name: "Review", icon: BookOpen },
  { name: "Financials", icon: LayoutDashboard },
];

// helpers
function pickLatestJournal(journals) {
  if (!Array.isArray(journals) || journals.length === 0) return null;
  return [...journals].sort((a, b) => {
    const ta = new Date(a.updated_at || a.created_at || 0).getTime();
    const tb = new Date(b.updated_at || b.created_at || 0).getTime();
    return tb - ta;
  })[0];
}
function parseContent(jsonStr) {
  try {
    return JSON.parse(jsonStr || "{}");
  } catch {
    return {};
  }
}
function checklistProgress(checklist) {
  const vals = Object.values(checklist || {});
  return vals.length ? vals.filter(Boolean).length / vals.length : 0;
}
function useMidnightRerender() {
  const [todayKey, setTodayKey] = useState(dayjs().format("YYYY-MM-DD"));
  useEffect(() => {
    const id = setInterval(() => {
      const nowKey = dayjs().format("YYYY-MM-DD");
      if (nowKey !== todayKey) setTodayKey(nowKey);
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [todayKey]);
  return todayKey;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Performance");
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTrade, setEditTrade] = useState(null);
  const [formInitialDate, setFormInitialDate] = useState(null);

  const [dayModal, setDayModal] = useState({ open: false, date: null });
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  const [planPlanning, setPlanPlanning] = useState(null);
  const [planPrep, setPlanPrep] = useState(null);
  const [planDateLabel, setPlanDateLabel] = useState("Today");
  const [planProgress, setPlanProgress] = useState(0);

  const { accountId, setAccountId } = useScope();
  const scope = useMemo(() => ({ accountId }), [accountId]);

  const [createAcctOpen, setCreateAcctOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [creatingAcct, setCreatingAcct] = useState(false);
  const [acctForm, setAcctForm] = useState({
    name: "",
    firm: "",
    account_type: "",
    currency: "USD",
  });

  const todayKey = useMidnightRerender();

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchTrades(scope);
    setTrades(data || []);
    setLoading(false);
  }, [scope]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => {
      try {
        const js = await fetchJournals();
        const latest = pickLatestJournal(js || []);
        if (!latest) {
          setPlanPlanning(null);
          setPlanPrep(null);
          setPlanProgress(0);
          return;
        }
        const content = parseContent(latest.content);
        const sess = content?.preMarket || content?.endOfDay || {};
        const planning = sess?.planning || {};
        const prep = sess?.prep || {};
        setPlanPlanning(planning);
        setPlanPrep(prep);
        setPlanProgress(checklistProgress(planning.checklist));
        const label =
          latest.name && /\d{4}-\d{2}-\d{2}/.test(latest.name)
            ? latest.name
            : "Today";
        setPlanDateLabel(label);
      } catch {
        setPlanPlanning(null);
        setPlanPrep(null);
        setPlanProgress(0);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const net = trades.reduce((s, t) => s + parseFloat(t.pnl || 0), 0);
    const wins = trades.filter((t) => parseFloat(t.pnl) > 0).length;
    const winRate = trades.length
      ? ((wins / trades.length) * 100).toFixed(1)
      : "0.0";
    const rrList = trades.filter((t) => t.rr != null);
    const avgRR = rrList.length
      ? (
          rrList.reduce((s, t) => s + parseFloat(t.rr), 0) / rrList.length
        ).toFixed(2)
      : "0.00";
    const best = trades.length
      ? Math.max(...trades.map((t) => parseFloat(t.pnl || 0)))
      : 0;
    return { net, winRate, avgRR, best };
  }, [trades]);

  const handleSaveTrade = useCallback(
    async (idOrObj, maybeObj) => {
      if (maybeObj === undefined) await addTrade(idOrObj);
      else await updateTrade(idOrObj, maybeObj);
      await refresh();
      setModalOpen(false);
      setEditTrade(null);
      setDayModal({ open: false, date: null });
    },
    [refresh]
  );

  const handleDeleteTrade = useCallback(
    async (id) => {
      await deleteTrade(id);
      await refresh();
    },
    [refresh]
  );

  const handleCalendarDayClick = useCallback((date) => {
    setSelectedDate(date);
    setDayModal({ open: true, date });
  }, []);

  const tradesOnDate = useCallback(
    (date) => trades.filter((t) => t.date === date),
    [trades]
  );

  const streakTrades = useMemo(
    () => trades.map((t) => ({ date: t.date, pnl: Number(t.pnl || 0) })),
    [trades, todayKey]
  );
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
  const DEFAULT_TARGET = 500;

  const dailyPnl = useMemo(() => {
    const today = trades.filter(
      (t) => t.date === dayjs().format("YYYY-MM-DD")
    );
    return today.reduce((s, t) => s + Number(t.pnl || 0), 0);
  }, [trades, todayKey]);

  const mood = useMemo(
    () => (dailyPnl > 0 ? "win" : dailyPnl < 0 ? "loss" : "neutral"),
    [dailyPnl]
  );

  const [dailyTarget, setDailyTarget] = useState(DEFAULT_TARGET);
  useEffect(() => {
    (async () => {
      try {
        const mod = await import("../utils/targetService");
        const getDailyTarget = mod?.getDailyTarget;
        const todayStr = dayjs().format("YYYY-MM-DD");
        const t = getDailyTarget ? await getDailyTarget(todayStr) : null;
        setDailyTarget(typeof t === "number" && t > 0 ? t : DEFAULT_TARGET);
      } catch {
        setDailyTarget(DEFAULT_TARGET);
      }
    })();
  }, [todayKey]);

  const intensity = useMemo(() => {
    const DEAD_ZONE = 20;
    const effective = Math.max(0, Math.abs(dailyPnl) - DEAD_ZONE);
    const ratio = clamp(effective / (dailyTarget || DEFAULT_TARGET));
    return easeOutQuad(ratio);
  }, [dailyPnl, dailyTarget]);

  const [pinnedRuleText, setPinnedRuleText] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await getDailyRules(dayjs().format("YYYY-MM-DD"));
        const pinned = (res?.rules || []).find((r) => r.pinned);
        setPinnedRuleText(pinned?.text || null);
      } catch {
        setPinnedRuleText(null);
      }
    })();
  }, [todayKey]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#0F0F0F] via-[#18181B] to-[#232931] flex flex-col">
      <section className="w-full max-w-[1700px] mx-auto pt-6 pb-4 px-4 sm:px-6 md:px-10 flex flex-col gap-6">
        {/* Header + Subtabs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="order-2 lg:order-1 w-full">
              <SubTabsBar
                tabs={SUBTABS.map((t) => t.name)}
                active={activeTab}
                onChange={setActiveTab}
                className="w-full"
              />
            </div>

            {/* Right controls */}
            <div className="order-1 lg:order-2 flex flex-wrap items-center gap-2 gap-y-3 ml-auto">
              <div
                className="flex items-stretch rounded-xl border overflow-hidden"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <button
                  className="px-3 py-2 text-sm text-white border-r border-white/10 hover:bg-white/10 transition"
                  onClick={() => setCreateAcctOpen(true)}
                  title="Create Account"
                >
                  + New
                </button>
                <button
                  className="px-3 py-2 text-sm text-white hover:bg-white/10 transition"
                  onClick={() => setManageOpen(true)}
                  title="Manage Accounts"
                >
                  Manage
                </button>
              </div>

              <div className="shrink-0 min-w-[132px]">
                <QuickAddTradeButton
                  onClick={() => {
                    setEditTrade(null);
                    setFormInitialDate(null);
                    setModalOpen(true);
                  }}
                />
              </div>

              <div className="relative z-10 w-full sm:w-auto">
                <AccountScopeSelect />
              </div>
            </div>
          </div>
        </div>

        {/* Compact Welcome */}
        <WelcomeHero
          name="Trader"
          mood={mood}
          intensity={intensity}
          focusText={pinnedRuleText}
          daily={false}
          autoRotateMs={9000}
        />

        {activeTab === "Performance" && (
          <motion.section
            key="performance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full"
          >
            {/* col 1 */}
            <div className="flex flex-col gap-6">
              <DailyTargetProgress trades={trades} selectedDate={selectedDate} />
              <MiniTraderStreak
                trades={streakTrades}
                treatAnchorAsFinalized={false}
              />
              <DailyRules />
              <MiniPLChart trades={trades} />
            </div>

            {/* col 2 */}
            <div className="flex flex-col gap-6">
              <StatsDeck
                items={[
                  {
                    label: "Net P&L",
                    raw: stats.net,
                    icon: DollarSign,
                    intent: stats.net >= 0 ? "positive" : "negative",
                    money: true,
                  },
                  {
                    label: "Win Rate",
                    raw: Number(stats.winRate),
                    suffix: "%",
                    icon: Trophy,
                    intent: "info",
                  },
                  {
                    label: "Avg R/R",
                    raw: Number(stats.avgRR),
                    icon: Activity,
                    intent: "warning",
                  },
                  {
                    label: "Best Trade",
                    raw: stats.best,
                    icon: Award,
                    intent: stats.best >= 0 ? "positive" : "negative",
                    money: true,
                  },
                ]}
              />

              <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-6 shadow-lg">
                <Calendar
                  trades={trades}
                  onDayClick={handleCalendarDayClick}
                  selectedDate={selectedDate}
                />
              </div>
            </div>

            {/* col 3 */}
            <div className="flex flex-col gap-6">
              <SessionCountdown />
              <RecentTrades trades={trades} refresh={refresh} />
              <PlanSummaryCard
                dateLabel={planDateLabel}
                planning={planPlanning || undefined}
                prep={planPrep || undefined}
                checklistProgress={planProgress}
              />
            </div>
          </motion.section>
        )}

        {activeTab === "Calendar" && (
          <motion.section
            key="calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-6 shadow-lg mt-4"
          >
            <Calendar
              trades={trades}
              onDayClick={handleCalendarDayClick}
              selectedDate={selectedDate}
            />
          </motion.section>
        )}

        {activeTab === "Review" && (
          <motion.section
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full bg-transparent mt-4"
          >
            <ReviewPanel date={selectedDate} trades={trades} />
          </motion.section>
        )}

        {activeTab === "Financials" && (
          <motion.section
            key="financials"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full bg-transparent mt-4"
          >
            <FinancialsTab />
          </motion.section>
        )}
      </section>

      {/* Add/Edit Trade */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <SimpleTradeForm
          existingTrade={editTrade}
          initialDate={formInitialDate}
          onSave={handleSaveTrade}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      {/* DayTrades */}
      <Modal
        isOpen={dayModal.open}
        onClose={() => setDayModal({ open: false, date: null })}
      >
        {dayModal.date && (
          <DayTrades
            date={dayModal.date}
            trades={tradesOnDate(dayModal.date)}
            onAddTrade={() => {
              setEditTrade(null);
              setFormInitialDate(dayModal.date);
              setModalOpen(true);
              setDayModal({ open: false, date: null });
            }}
            onClose={() => setDayModal({ open: false, date: null })}
            onDeleteTrade={handleDeleteTrade}
          />
        )}
      </Modal>

      {/* Create Account */}
      <Modal isOpen={createAcctOpen} onClose={() => setCreateAcctOpen(false)}>
        <div className="w-full max-w-md mx-auto bg-zinc-900/90 border border-white/10 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold text-center">Create Account</h3>
          <p className="mt-1 text-xs text-zinc-400 text-center">
            Type determines whether it’s treated as real (Funded/Personal) or
            practice (Demo/Evaluation).
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <Field label="Name">
              <input
                className="input"
                value={acctForm.name}
                onChange={(e) =>
                  setAcctForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="FTMO 100k #1"
              />
            </Field>
            <Field label="Firm (optional)">
              <input
                className="input"
                value={acctForm.firm}
                onChange={(e) =>
                  setAcctForm((f) => ({ ...f, firm: e.target.value }))
                }
                placeholder="FTMO / Topstep / Broker"
              />
            </Field>
            <Field label="Account Type">
              <select
                className="input"
                value={acctForm.account_type}
                onChange={(e) =>
                  setAcctForm((f) => ({ ...f, account_type: e.target.value }))
                }
              >
                <option value="">Select</option>
                <option value="Demo">Demo</option>
                <option value="Evaluation">Evaluation</option>
                <option value="Funded">Funded</option>
                <option value="Personal">Personal</option>
              </select>
            </Field>
            <Field label="Currency">
              <input
                className="input"
                value={acctForm.currency}
                onChange={(e) =>
                  setAcctForm((f) => ({ ...f, currency: e.target.value }))
                }
                placeholder="USD"
              />
            </Field>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600"
                onClick={() => setCreateAcctOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                disabled={creatingAcct || !acctForm.name || !acctForm.account_type}
                onClick={async () => {
                  if (!acctForm.name || !acctForm.account_type) return;
                  setCreatingAcct(true);
                  try {
                    const created = await createAccount(acctForm);
                    emitAccountsChanged();
                    setAccountId(created.id);
                    toast.success("Account created");
                    setCreateAcctOpen(false);
                    setAcctForm({
                      name: "",
                      firm: "",
                      account_type: "",
                      currency: "USD",
                    });
                  } catch (e) {
                    toast.error(e?.message || "Failed to create account");
                  } finally {
                    setCreatingAcct(false);
                  }
                }}
              >
                {creatingAcct ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
          <style>{`
            .input {
              width: 100%;
              padding: 0.5rem 0.75rem;
              border-radius: 0.5rem;
              border: 1px solid rgba(255,255,255,0.1);
              background: rgba(24,24,27,0.9);
              color: white;
            }
          `}</style>
        </div>
      </Modal>

      {/* Manage Accounts */}
      <Modal isOpen={manageOpen} onClose={() => setManageOpen(false)}>
        <ManageAccountsModal onClose={() => setManageOpen(false)} />
      </Modal>
    </div>
  );
}

/* ---------- Share-ready Stats Deck (auto-fit, compact money) ---------- */

function StatsDeck({ items }) {
  return (
    <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-4 shadow-lg">
      <div
        className="grid gap-4"
        style={{
          // Auto-fit columns, each tile keeps enough width so numbers stay big
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        }}
      >
        {items.map((it, i) => (
          <StatTile key={i} {...it} />
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, raw, icon: Icon, intent = "info", money = false, suffix = "" }) {
  const palette = getIntentPalette(intent, raw);
  const ring = palette.ring;
  const valueColor = palette.value;

  // Full precision string for hover / copy
  const exact = money ? formatCurrencyFull(raw) : `${formatNumberFull(raw)}${suffix}`;
  // Display string (compact)
  const display = money ? compactMoney(raw) : compactGeneric(raw, suffix);

  const [copied, setCopied] = React.useState(false);

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="relative rounded-2xl bg-zinc-950/70 border overflow-hidden shadow-md min-h-[118px] p-4 flex flex-col justify-between"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        boxShadow: `0 10px 38px -24px ${hexA(ring, 0.25)}`,
      }}
      title={exact}
    >
      {/* Rim gradient */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${hexA(ring, 0.18)} 0%, transparent 35%, transparent 65%, ${hexA(
            ring,
            0.12
          )} 100%)`,
          mask: "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
          WebkitMaskComposite: "xor",
          padding: 1,
          borderRadius: 16,
        }}
      />

      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-zinc-400">
          {label}
        </span>
        <div
          className="h-7 w-7 rounded-xl grid place-items-center"
          style={{ background: hexA(ring, 0.12), border: `1px solid ${hexA(ring, 0.35)}` }}
        >
          <Icon size={14} style={{ color: ring }} />
        </div>
      </div>

      {/* Big value (constant headline size; will compact instead of clip) */}
      <div className="pt-1 min-w-0">
        <BigStatValue text={display} color={valueColor} />
        <div className="hidden xl:flex items-center gap-2 mt-1">
          <span className="text-[11px] text-zinc-400 truncate">{exact}</span>
          <button
            className="p-1 rounded-md bg-zinc-800/60 hover:bg-zinc-700/70 border border-zinc-700/60"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(exact);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              } catch {}
            }}
            aria-label="Copy exact value"
            title="Copy exact value"
          >
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          </button>
        </div>
      </div>

      {/* Soft bottom aura */}
      <div
        aria-hidden
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[75%] h-16 rounded-full blur-2xl"
        style={{ background: hexA(ring, 0.16) }}
      />
    </motion.div>
  );
}

/** Display headline with a stable, luxurious scale that never clips. */
function BigStatValue({ text, color = "#e5e7eb" }) {
  return (
    <span
      className="block font-extrabold tabular-nums tracking-tight leading-none"
      style={{
        // Generous default, scales a bit on larger screens
        fontSize: "clamp(22px, 3.2vw, 34px)",
        color,
        letterSpacing: "-0.015em",
      }}
    >
      {text}
    </span>
  );
}

/* ---------- Formatting helpers ---------- */

function compactMoney(n) {
  const sign = n < 0 ? "-" : "+";
  const abs = Math.abs(n || 0);
  // Show $x.xx for < 1k to keep cents; otherwise compact with 1 decimal
  if (abs < 1000) {
    return `${sign}$${abs.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  const compact = new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(abs);
  return `${sign}$${compact}`;
}
function formatCurrencyFull(n) {
  const sign = n < 0 ? "-" : "+";
  const abs = Math.abs(n || 0);
  return `${sign}$${abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function compactGeneric(n, suffix = "") {
  const abs = Math.abs(Number(n) || 0);
  if (abs < 1000) {
    // keep up to 2 decimals for small values
    return `${Number(n).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}${suffix}`;
  }
  const compact = new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(abs);
  const sign = Number(n) < 0 ? "-" : "";
  return `${sign}${compact}${suffix}`;
}
function formatNumberFull(n) {
  return Number(n).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function getIntentPalette(intent, raw) {
  const isNegative = Number(raw) < 0;

  if (intent === "negative" || isNegative) {
    return { ring: "#f43f5e", value: "#fda4af" }; // rose
  }
  if (intent === "positive") {
    return { ring: "#22c55e", value: "#34d399" }; // emerald
  }
  switch (intent) {
    case "warning":
      return { ring: "#f59e0b", value: "#fcd34d" };
    default:
      return { ring: "#60a5fa", value: "#e5e7eb" }; // info/neutral
  }
}

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-xs text-zinc-400 mb-1">{label}</span>
    {children}
  </label>
);

/* small util */
function hexA(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
