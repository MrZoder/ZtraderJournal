// src/pages/JournalPage/index.jsx
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import {
  ClipboardList,
  Timer,
  List,
  LineChart,
  FlaskConical,
  StickyNote,
  Layers,
  Gauge,
  CalendarDays,
} from "lucide-react";

import { getJournal, upsertJournal } from "../../utils/journalService";
import { fetchTrades } from "../../utils/tradeService";
import useAutosave from "../../hooks/useAutosave";
import AccountScopeSelect from "../../components/AccountScopeSelect";

// New mobile navigation components
import SessionPicker from "./components/SessionPicker";
import MobileTabBar, { MOBILE_DOCK_H } from "./components/MobileTabBar";

/* =========================
   Tiny UI helpers
   ========================= */
function GlassCard({ className = "", as: Tag = "div", children }) {
  return (
    <Tag
      className={`rounded-[22px] border border-[rgba(255,255,255,.10)] bg-[rgba(255,255,255,.06)] backdrop-blur-[10px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)] ${className}`}
    >
      {children}
    </Tag>
  );
}

function PillTabs({ items, active, onChange }) {
  return (
    <div className="hidden md:inline-flex gap-1 p-1 rounded-[14px] border border-[rgba(255,255,255,.10)] bg-[rgba(255,255,255,.06)] overflow-x-auto no-scrollbar">
      {items.map(({ key, label, icon: Icon }) => {
        const is = key === active;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`relative h-9 px-3 rounded-[12px] text-sm font-medium flex items-center gap-2 transition ${
              is ? "text-black" : "text-zinc-300 hover:text-white"
            }`}
            style={{
              background: is
                ? "linear-gradient(135deg, rgba(16,185,129,.95), rgba(34,211,238,.95))"
                : "transparent",
            }}
          >
            {Icon && (
              <Icon size={16} className={is ? "opacity-90" : "opacity-70"} />
            )}
            {label}
            {is && (
              <motion.span
                layoutId="journal-pill-active"
                className="absolute inset-0 rounded-[12px] -z-10"
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function PlanSummaryRail({ plan }) {
  const checklist = plan?.checklist || {};
  const vals = Object.values(checklist);
  const readyPct = vals.length
    ? Math.round((vals.filter(Boolean).length / vals.length) * 100)
    : 0;

  return (
    <GlassCard className="p-4 sm:p-5 sticky top-[84px]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-zinc-100">Plan Summary</h3>
        <span className="text-[11px] text-zinc-400">{readyPct}% ready</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-emerald-400/80"
          style={{ width: `${readyPct}%`, transition: "width .35s ease" }}
        />
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Focus</span>
          <span className="text-zinc-100 truncate max-w-[60%] text-right">
            {plan?.focusGoal || "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Bias</span>
          <span className="text-zinc-100">{plan?.bias || "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Max Risk</span>
          <span className="text-zinc-100">${plan?.riskBox?.maxRisk ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Max Trades</span>
          <span className="text-zinc-100">
            {plan?.riskBox?.maxTrades ?? "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">News</span>
          <span className="text-zinc-100">{plan?.newsTime || "—"}</span>
        </div>
      </div>
    </GlassCard>
  );
}

/* =========================
   Tabs (your actual content)
   ========================= */
import PlanTab from "./tabs/PlanTab";
import DuringTab from "./tabs/DuringTab";
import ReviewTab from "./tabs/ReviewTab";
import TradesTab from "./tabs/TradesTab";
import StrategyLabTab from "./tabs/StrategyLabTab";
import IdeaInboxTab from "./tabs/IdeaInboxTab";
import TemplatesTab from "./tabs/TemplatesTab";
import InsightsTab from "./tabs/InsightsTab";

/* =========================
   Journal page
   ========================= */
const DEFAULT_SCOPE = { accountId: null };
const emptyDoc = {
  date: dayjs().format("YYYY-MM-DD"),
  status: "draft",
  plan: {
    focusGoal: "",
    bias: "",
    riskBox: {},
    keyLevels: [],
    checklist: {},
    newsTime: "",
  },
  during: { events: [] },
  review: { adherenceScore: 0, lessons: [], actions: [], grade: "" },
};

export default function JournalPage() {
  const [active, setActive] = useState("plan");
  const [scope, setScope] = useState(DEFAULT_SCOPE);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [doc, setDoc] = useState(emptyDoc);
  const [trades, setTrades] = useState([]);

  const prefersReduced = useReducedMotion();
  const pageVariants = prefersReduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.18 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : {
        initial: { opacity: 0, y: 12, filter: "blur(2px)" },
        animate: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { type: "spring", stiffness: 420, damping: 34, mass: 0.8 },
        },
        exit: {
          opacity: 0,
          y: -10,
          filter: "blur(2px)",
          transition: { duration: 0.18, ease: "easeInOut" },
        },
      };

  const isSessionScoped =
    active === "plan" || active === "during" || active === "review";

  useEffect(() => {
    (async () => {
      const j = (await getJournal(date, scope)) || { ...emptyDoc, date };
      setDoc(j);
      const t = await fetchTrades(scope);
      setTrades(Array.isArray(t) ? t : []);
    })();
  }, [date, scope]);

  const autosave = useAutosave({
    payload: doc,
    enabled: true,
    delay: 800,
    onSave: async (payload) => {
      const saved = await upsertJournal({
        ...payload,
        date,
        account_id: scope.accountId ?? null,
      });
      setDoc(saved);
    },
  });

  const tabs = useMemo(
    () => [
      { key: "plan", label: "Plan", icon: ClipboardList },
      { key: "during", label: "During", icon: Timer },
      { key: "review", label: "Review", icon: List },
      { key: "trades", label: "Trades", icon: LineChart },
      { key: "lab", label: "Strategy Lab", icon: FlaskConical },
      { key: "ideas", label: "Idea Inbox", icon: StickyNote },
      { key: "templates", label: "Templates", icon: Layers },
      { key: "insights", label: "Insights", icon: Gauge },
    ],
    []
  );

  const showRail = active === "plan" || active === "review";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0E1118] to-[#151821] text-white">
      <Toaster position="bottom-center" />

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          {isSessionScoped ? (
            <SessionPicker value={date} onChange={setDate} />
          ) : (
            <div className="text-sm text-zinc-400 inline-flex items-center gap-2">
              <CalendarDays size={16} className="opacity-70" />
              <span className="opacity-80">Global view</span>
            </div>
          )}
          <div className="min-w-[220px]">
            <AccountScopeSelect
              value={scope.accountId ?? ""}
              onChange={(nextId) => setScope({ accountId: nextId || null })}
            />
          </div>
          <div className="ml-auto text-xs">
            {autosave === "saving" && (
              <span className="text-emerald-300">Saving…</span>
            )}
            {autosave === "saved" && (
              <span className="text-zinc-300">All changes saved</span>
            )}
            {autosave === "error" && (
              <span className="text-rose-400">Save error</span>
            )}
          </div>
        </div>

        {/* Top tabs — hidden on mobile */}
        <div className="max-w-[1600px] mx-auto px-4 pb-1 hidden md:block">
          <PillTabs items={tabs} active={active} onChange={setActive} />
        </div>
      </header>

      {/* BODY */}
      <main
        className={`max-w-[1600px] mx-auto px-4 pt-3 pb-[calc(${MOBILE_DOCK_H}px+16px+env(safe-area-inset-bottom))] md:pb-4`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active + (isSessionScoped ? date : "")}
            initial={pageVariants.initial}
            animate={pageVariants.animate}
            exit={pageVariants.exit}
          >
            {showRail ? (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
                <div className="space-y-4">
                  {active === "plan" && (
                    <PlanTab value={doc} onChange={setDoc} />
                  )}
                  {active === "review" && (
                    <ReviewTab value={doc} onChange={setDoc} trades={trades} />
                  )}
                </div>
                <div className="hidden lg:block">
                  <PlanSummaryRail plan={doc.plan} />
                </div>
              </div>
            ) : (
              <>
                {active === "during" && (
                  <DuringTab value={doc} onChange={setDoc} />
                )}
                {active === "trades" && (
                  <TradesTab
                    date={date}
                    trades={trades}
                    journal={doc}
                    onChangeJournal={setDoc}
                  />
                )}
                {active === "lab" && <StrategyLabTab />}
                {active === "ideas" && <IdeaInboxTab />}
                {active === "templates" && <TemplatesTab />}
                {active === "insights" && (
                  <InsightsTab trades={trades} journal={doc} />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile dock only visible on small screens */}
      <div className="md:hidden">
        <MobileTabBar items={tabs} active={active} onChange={setActive} />
      </div>

      <style>{`.glass{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);backdrop-filter:blur(10px);}`}</style>
    </div>
  );
}
