// src/pages/tabs/FinancialsTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import {
  Plus, Trash2, Edit, Image as ImageIcon, Save, X,
  ChevronDown, Wallet, PiggyBank, Download, Filter, Info as InfoIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ExpensesTab from "./ExpensesTab";

import { useScope } from "../../state/scopeStore";
import { fetchTrades } from "../../utils/tradeService";
import {
  fetchPayouts, addPayout, deletePayout,
  kpisFromPayouts
} from "../../utils/financeService";
import {
  fetchExpenses, addExpense, updateExpense, deleteExpense,
  fetchExpenseTemplates, addExpenseTemplate, deleteExpenseTemplate,
  uploadReceiptImage, signedReceiptUrl, kpisFromExpenses
} from "../../utils/expensesService";
import {
  fetchAccounts,
  // NEW: add these two; implement against your backend
  getAccountSettings,
  updateAccountSettings,
} from "../../utils/accountsService";

/* ------------------------------------------------------------------ */
/* Visual & Data Utilities                                             */
/* ------------------------------------------------------------------ */
const fmt = (n) =>
  (Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const formatCurrency = (n, symbol = "$") => `${symbol}${fmt(n)}`;
const colorForPnL = (v) =>
  v > 0 ? "text-emerald-400" : v < 0 ? "text-rose-400" : "text-zinc-300";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * i, duration: 0.35, ease: "easeOut" },
  }),
};

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export default function FinancialsTab() {
  const { accountId } = useScope();
  const [active, setActive] = useState("Payouts");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-[1200px] px-4 text-white space-y-8"
    >
      <HeroStripe />
      <HeaderTabs active={active} onChange={setActive} />

      <AnimatePresence mode="wait">
        {active === "Payouts" ? (
          <motion.div key="payouts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PayoutsPanel accountId={accountId} />
          </motion.div>
        ) : (
          <motion.div key="expenses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExpensesTab embedded />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Marketing-grade Header                                              */
/* ------------------------------------------------------------------ */
function HeroStripe() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-widest text-zinc-400">ZTrader Financials</p>
          <h2 className="text-2xl font-extrabold">Cashflow & Cost Control</h2>
          <p className="text-sm text-zinc-400">
            A fast, focused workspace to track payouts and expenses like a pro.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BadgeDot label="Live" color="emerald" />
          <BadgeDot label="Secure" color="cyan" />
        </div>
      </div>
    </div>
  );
}
function BadgeDot({ label, color = "emerald" }) {
  const c = color === "emerald" ? "bg-emerald-400" : "bg-cyan-400";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">
      <span className={`h-2 w-2 rounded-full ${c} animate-pulse`} />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */
function HeaderTabs({ active, onChange }) {
  const tabs = [
    { key: "Payouts", icon: PiggyBank, label: "Payouts" },
    { key: "Expenses", icon: Wallet, label: "Expenses" },
  ];
  return (
    <div className="flex gap-3">
      {tabs.map(({ key, icon: Icon, label }) => {
        const is = active === key;
        return (
          <motion.button
            whileTap={{ scale: 0.98 }}
            key={key}
            onClick={() => onChange(key)}
            className={`group inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold ring-1 transition ${
              is
                ? "bg-gradient-to-br from-emerald-400/15 via-cyan-400/10 to-transparent ring-emerald-400/30 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]"
                : "bg-zinc-900/60 ring-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <Icon size={16} className="opacity-80" />
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/* PAYOUTS PANEL                                                       */
/* ================================================================== */
function PayoutsPanel({ accountId }) {
  const scope = { accountId };
  const [trades, setTrades] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    amount: "",
    source: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  /* -------- Settings: mode ('cycle' | 'rolling') from DB -------- */
  const [mode, setMode] = useState("cycle");                // default
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
  let live = true;
  (async () => {
    try {
      setSettingsLoading(true);
      if (!accountId) {
        // No account selected yet; keep default and end loading cleanly
        return;
      }
      const s = await getAccountSettings(accountId);
      if (live && s?.payout_eligibility_mode) {
        setMode(s.payout_eligibility_mode === "rolling" ? "rolling" : "cycle");
      }
    } catch (e) {
      console.error("settings load failed", e);
    } finally {
      if (live) setSettingsLoading(false); // <— always clear loading
    }
  })();
  return () => { live = false; };
}, [accountId]);


  const changeMode = async (next) => {
    setMode(next); // optimistic
    try {
      if (!accountId) return;
      await updateAccountSettings(accountId, { payout_eligibility_mode: next });
      toast.success(next === "cycle" ? "Cycle mode enabled" : "Rolling 14d enabled");
    } catch (e) {
      // revert on failure
      setMode((m) => (next === "cycle" ? "rolling" : "cycle"));
      toast.error("Could not save setting");
    }
  };

  /* ---------------------------- Data ---------------------------- */
  const refresh = async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([fetchTrades(scope), fetchPayouts(scope)]);
      setTrades(t || []);
      setPayouts(p || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [accountId]);

  // KPIs
  const grossPnl = useMemo(
    () => trades.reduce((s, t) => s + (Number(t.pnl) || 0), 0),
    [trades]
  );
  const base = useMemo(() => kpisFromPayouts(payouts), [payouts]);
  const kpis = { ...base, net: grossPnl - base.total };

  // last payout date (ISO)
  const lastPayoutDate = useMemo(() => {
    if (!payouts?.length) return null;
    const latest = payouts.reduce((m, p) => (dayjs(p.date).isAfter(m.date) ? p : m), payouts[0]);
    return dayjs(latest.date).format("YYYY-MM-DD");
  }, [payouts]);

  // Eligibility (DB-mode aware)
  const elig = useMemo(
    () =>
      computeEligibility({
        trades,
        lastPayoutDate,
        mode,
        windowDays: 14,
        requiredWinningDays: 5,
        today: dayjs().format("YYYY-MM-DD"),
      }),
    [trades, lastPayoutDate, mode]
  );

  /* ---------------------------- CRUD ---------------------------- */
  const onAdd = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.date || !form.amount) return toast.error("Enter date and amount");
    setSaving(true);
    try {
      await addPayout({ ...form, amount: Number(form.amount) }, scope);
      toast.success(mode === "cycle"
        ? "Payout logged — eligibility reset. New cycle started."
        : "Payout logged.");
      setForm({ date: dayjs().format("YYYY-MM-DD"), amount: "", source: "", notes: "" });
      await refresh();
    } catch (e) {
      toast.error(e?.message || "Failed to add payout");
    } finally {
      setSaving(false);
    }
  };
  const onDelete = async (id) => {
    if (!confirm("Delete this payout?")) return;
    try {
      await deletePayout(id);
      toast.success("Deleted");
      await refresh();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const cards = [
    { label: "Balance After Payouts", val: kpis.net, accent: "emerald" },
    { label: "Total Payouts", val: kpis.total, accent: "rose" },
    { label: "YTD Payouts", val: kpis.ytd, accent: "cyan" },
    { label: "Last 30d Payouts", val: kpis.last30, accent: "cyan" },
  ];

  return (
    <section className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {cards.map((c, i) => (
          <motion.div key={c.label} variants={cardVariants} custom={i} initial="hidden" animate="show">
            <MetricCard
              label={c.label}
              value={<span className={`font-bold text-3xl ${colorForPnL(c.val)}`}>{formatCurrency(c.val)}</span>}
              accent={c.accent}
              spark={payouts.map((p) => Number(p.amount || 0))}
            />
          </motion.div>
        ))}
      </div>

      {/* Eligibility + Mode + Tooltip */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 px-5 py-4 flex flex-col gap-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm flex items-center gap-2">
          {mode === "cycle" ? (
            <span className="text-zinc-400">
              Eligibility (Cycle since <b>{elig.start}</b>):
            </span>
          ) : (
            <span className="text-zinc-400">
              Eligibility (Last {elig.windowDays}d):
            </span>
          )}
          <b className={colorForPnL(elig.winningDays)}>{elig.winningDays}</b> / {elig.requiredWinningDays} winning days
          <Tooltip text="Winning day = calendar day with net P&L > 0. Cycle mode resets count when you log a payout. Rolling mode uses the last 14 days and does not reset.">
            <InfoIcon size={14} className="text-zinc-400 hover:text-zinc-200" />
          </Tooltip>
        </div>

        <div className="flex items-center gap-3">
          <ModeSwitch
            mode={mode}
            onChange={(m) => !settingsLoading && changeMode(m)}
            tooltipCycle="Reset on payout (start a new cycle)"
            tooltipRolling="Do not reset (rolling 14 days)"
            loading={settingsLoading}
          />
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${elig.eligible ? "bg-emerald-500 text-black ring-emerald-400/40" : "bg-white/5 text-zinc-200 ring-white/10"}`}>
            {elig.eligible ? "Eligible ✅" : "Keep going"}
          </div>
        </div>
      </div>

      {/* Add Form */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur">
        <form onSubmit={onAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <Field label="Date">
            <input type="date" className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </Field>
          <Field label="Amount ($)">
            <input type="number" step="0.01" className="input" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
          </Field>
          <Field label="Source">
            <input type="text" className="input" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} />
          </Field>
          <Field label="Notes">
            <input type="text" className="input" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <div className="flex items-end">
            <button type="submit" className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2">
              {saving ? "Adding…" : "Add Payout"}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Payouts — Desktop */}
      <div className="hidden sm:block">
        <DataTable
          title="Recent Payouts"
          loading={loading}
          rows={payouts}
          cols={["Date", "Amount", "Source", "Notes"]}
          align={["left", "right", "left", "left"]}
          renderRow={(p) => [
            dayjs(p.date).format("DD MMM YYYY"),
            <span className={`font-semibold ${colorForPnL(Number(p.amount))}`}>{formatCurrency(p.amount)}</span>,
            p.source || "—",
            p.notes || "—",
          ]}
          onExport={() => exportCSV(payouts, ["date", "amount", "source", "notes"], "payouts.csv")}
          onDelete={onDelete}
        />
      </div>

      {/* Recent Payouts — Mobile */}
      <div className="sm:hidden rounded-3xl border border-white/10 bg-zinc-900/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10"><h4 className="font-semibold">Recent Payouts</h4></div>
        {loading ? (
          <div className="p-4 text-center text-zinc-400">Loading…</div>
        ) : payouts.length === 0 ? (
          <div className="p-4 text-center text-zinc-500">No entries yet.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {payouts.map((p) => (
              <li key={p.id} className="p-4">
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Date</span><span>{dayjs(p.date).format("DD MMM YYYY")}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Amount</span><span className={`font-semibold ${colorForPnL(Number(p.amount))}`}>{formatCurrency(p.amount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Source</span><span>{p.source || "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Notes</span><span className="truncate max-w-[55%] text-right">{p.notes || "—"}</span></div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => onDelete(p.id)} className="text-xs text-rose-400 rounded-md bg-white/5 hover:bg-white/10 px-2 py-1">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ================================================================== */
/* EXPENSES PANEL                                                      */
/* ================================================================== */
function ExpensesPanel({ accountId }) {
  const scope = { accountId };
  const [expenses, setExpenses] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("this_month");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [acc, tmpls] = await Promise.all([
        fetchAccounts(),
        fetchExpenseTemplates(),
      ]);
      setAccounts(acc);
      setTemplates(tmpls);
      const { from, to } = rangeToDates(range);
      const exps = await fetchExpenses(scope, { from, to, search });
      setExpenses(exps);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh(); // eslint-disable-next-line
  }, [accountId, range, search]);

  const kpis = useMemo(() => kpisFromExpenses(expenses), [expenses]);

  const onCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const onEdit = (e) => {
    setEditing(e);
    setModalOpen(true);
  };
  const onDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteExpense(id);
      toast.success("Deleted");
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  const cards = [
    { label: "Total Expenses", val: kpis.total, accent: "rose" },
    { label: "YTD", val: kpis.ytd, accent: "cyan" },
    { label: "Last 30d", val: kpis.last30, accent: "cyan" },
    { label: "Top Category", val: topCategory(kpis.byCategory) || "—", accent: "cyan", isText: true },
  ];

  return (
    <section className="space-y-6">
      {/* Controls */}
      <div className="sticky top-2 z-10 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Dropdown
            value={range}
            onChange={setRange}
            items={[
              ["this_month", "This Month"],
              ["last_30", "Last 30d"],
              ["ytd", "YTD"],
              ["all", "All Time"],
            ]}
          />
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, notes, category…"
              className="min-w-[280px] rounded-xl border border-white/10 bg-zinc-900/60 pl-9 pr-3 py-2.5 text-sm"
            />
            <Filter size={14} className="absolute left-3 top-3 text-zinc-500" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportCSV(
                expenses,
                ["date", "name", "account_id", "category", "amount"],
                "expenses.csv"
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-black font-semibold hover:bg-emerald-400"
          >
            <Plus size={16} /> Add New Entry
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            variants={cardVariants}
            custom={i}
            initial="hidden"
            animate="show"
          >
            <MetricCard
              label={c.label}
              value={
                c.isText ? (
                  <span className="text-lg font-medium text-zinc-200">{c.val}</span>
                ) : (
                  <span className={`font-bold text-3xl ${colorForPnL(-Math.abs(c.val))}`}>
                    {formatCurrency(c.val)}
                  </span>
                )
              }
              accent={c.accent}
              spark={expenses.map((e) => -Number(e.amount || 0))}
            />
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <DataTable
        title="Expenses"
        loading={loading}
        rows={expenses}
        cols={["Date", "Name", "Account", "Category", "Amount"]}
        align={["left", "left", "left", "left", "right"]}
        renderRow={(e) => [
          dayjs(e.date).format("DD MMM YYYY"),
          <div className="flex items-center gap-2">
            {e.receipt_url ? (
              <ReceiptThumb path={e.receipt_url} />
            ) : (
              <ImageIcon size={12} className="opacity-40" />
            )}
            <span className="font-medium">{e.name}</span>
          </div>,
          labelForAccount(accounts, e.account_id),
          e.category || "—",
          <span className={`font-semibold ${colorForPnL(-Number(e.amount))}`}>
            {formatCurrency(e.amount)}
          </span>,
        ]}
        onExport={() =>
          exportCSV(
            expenses,
            ["date", "name", "account_id", "category", "amount", "notes"],
            "expenses.csv"
          )
        }
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Templates */}
      <TemplatesPanel
        templates={templates}
        accounts={accounts}
        onAdd={async (payload) => {
          await addExpenseTemplate(payload);
          toast.success("Template saved");
          setTemplates(await fetchExpenseTemplates());
        }}
        onDelete={async (id) => {
          await deleteExpenseTemplate(id);
          toast.success("Template removed");
          setTemplates(await fetchExpenseTemplates());
        }}
        onUse={(t) => {
          setEditing({
            name: t.name,
            amount: t.default_amount || "",
            currency: t.currency || "USD",
            category: t.category || "",
            date: dayjs().format("YYYY-MM-DD"),
            account_id: t.default_account || accountId || null,
            notes: t.notes || "",
            receipt_url: "",
          });
          setModalOpen(true);
        }}
      />

      {modalOpen && (
        <ExpenseModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          accounts={accounts}
          initial={editing}
          onSave={async (payload) => {
            if (editing?.id) await updateExpense(editing.id, payload);
            else await addExpense(payload);
            toast.success("Saved");
            setModalOpen(false);
            await refresh();
          }}
        />
      )}
    </section>
  );
}

/* ================================================================== */
/* Shared UI                                                           */
/* ================================================================== */
function MetricCard({ label, value, accent = "cyan", spark = [] }) {
  const ring =
    accent === "rose"
      ? "from-rose-500/15 via-pink-500/5 ring-rose-400/25"
      : accent === "emerald"
      ? "from-emerald-400/15 via-cyan-500/5 ring-emerald-400/30"
      : "from-cyan-400/15 via-emerald-500/5 ring-cyan-400/25";
  return (
    <div className={`relative overflow-hidden rounded-3xl p-[1px] ring-1 ${ring} bg-gradient-to-br`}>
      <div className="rounded-[calc(1.5rem-1px)] h-full w-full bg-zinc-900/60 p-5 backdrop-blur">
        <div className="absolute -left-20 -top-24 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <p className="text-[12px] text-zinc-400">{label}</p>
        <div className="mt-1">{value}</div>
        {spark.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 opacity-40 pointer-events-none">
            <Sparkline data={spark} />
          </div>
        )}
      </div>
    </div>
  );
}
function Sparkline({ data = [] }) {
  const w = 220,
    h = 36;
  if (!data.length) return null;
  const max = Math.max(...data.map((v) => Math.abs(Number(v) || 0)), 1);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (Math.abs(Number(v) || 0) / max) * h}`)
    .join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline fill="none" stroke="url(#g)" strokeWidth="2" points={pts} />
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-zinc-400 mb-1">{label}</span>
      {children}
    </label>
  );
}
function Dropdown({ value, onChange, items }) {
  const [open, setOpen] = useState(false);
  const label = items.find(([v]) => v === value)?.[1] || value;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm"
      >
        <span>{label}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 min-w-[180px] rounded-xl border border-white/10 bg-zinc-900/90 shadow-xl overflow-hidden">
          {items.map(([v, l]) => (
            <button
              key={v}
              onClick={() => {
                onChange(v);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-white/5"
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function ReceiptThumb({ path }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const u = await signedReceiptUrl(path);
        if (live) setUrl(u);
      } catch {}
    })();
    return () => {
      live = false;
    };
  }, [path]);
  if (!url)
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white/5">
        <ImageIcon size={12} />
      </span>
    );
  return <img src={url} alt="" className="h-5 w-5 rounded object-cover ring-1 ring-white/10" />;
}
function DataTable({
  title,
  loading,
  rows,
  cols,
  align = [],
  renderRow,
  onDelete,
  onEdit,
  onExport,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <h4 className="font-semibold">{title}</h4>
        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <thead className="bg-zinc-900/70 sticky top-0 z-0">
            <tr>
              {cols.concat("").map((h, i) => (
                <th
                  key={h + String(i)}
                  className={`px-5 py-3 text-left text-sm text-zinc-400 whitespace-nowrap ${
                    i < align.length && align[i] === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={cols.length + 1} className="px-5 py-8 text-center text-zinc-400">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={cols.length + 1} className="px-5 py-8 text-center text-zinc-500">
                  No entries yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <motion.tr
                  key={r.id}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                  className="border-t border-white/5"
                >
                  {renderRow(r).map((cell, i) => (
                    <td
                      key={i}
                      className={`px-5 py-4 ${
                        i < align.length && align[i] === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(r)}
                          className="rounded-md bg-white/5 hover:bg-white/10 px-2 py-1 text-xs text-zinc-300"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(r.id)}
                          className="rounded-md bg-white/5 hover:bg-white/10 px-2 py-1 text-xs text-rose-400"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Expense Modal & Templates                                           */
/* ================================================================== */
function ExpenseModal({ open, onClose, onSave, accounts, initial }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(
    () =>
      initial || {
        name: "",
        category: "",
        amount: "",
        currency: "USD",
        date: dayjs().format("YYYY-MM-DD"),
        account_id: null,
        notes: "",
        receipt_url: "",
      }
  );
  const fileRef = React.useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const doUpload = async (input) => {
    setUploading(true);
    try {
      const path = await uploadReceiptImage(input, {
        previousUrl: form.receipt_url || null,
      });
      setForm((f) => ({ ...f, receipt_url: path }));
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name || !form.amount || !form.date)
      return toast.error("Name, amount, and date are required");
    setSaving(true);
    try {
      const { id, ...rest } = form;
      await onSave({
        ...rest,
        amount: Number(rest.amount),
        account_id:
          rest.account_id === "" || rest.account_id === null
            ? null
            : typeof rest.account_id === "string"
            ? Number(rest.account_id)
            : rest.account_id,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-900/80 backdrop-blur p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{initial?.id ? "Edit Entry" : "Log New Entry"}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5">
            <X />
          </button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type">
            <div className="px-3 py-2 text-sm rounded-xl border border-white/10 bg-zinc-900/60">
              Expense
            </div>
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="input"
            >
              <option value="">Select…</option>
              <option>Evaluation</option>
              <option>Activation</option>
              <option>Subscription</option>
              <option>Data</option>
              <option>Misc</option>
            </select>
          </Field>

          <Field label="Name">
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., 50K Combine – Apex"
            />
          </Field>
          <Field label="Amount">
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </Field>
          <Field label="Currency">
            <select
              className="input"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </Field>
          <Field label="Account">
            <select
              className="input"
              value={form.account_id ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  account_id: e.target.value ? Number(e.target.value) : null,
                }))
              }
            >
              <option value="">— None —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.account_type ? `• ${a.account_type}` : ""} {a.is_real ? "• Real" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <input
              className="input"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes…"
            />
          </Field>

          <div className="sm:col-span-2">
            <label className="block text-xs text-zinc-400 mb-1">Receipt</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && doUpload(e.target.files[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
              {form.receipt_url && <ReceiptThumb path={form.receipt_url} />}
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="rounded-xl bg-zinc-800 px-4 py-2 hover:bg-zinc-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-black font-semibold hover:bg-emerald-400 disabled:opacity-60"
            >
              <Save size={16} /> {saving ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function TemplatesPanel({ templates, accounts, onAdd, onDelete, onUse }) {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState({
    name: "",
    default_amount: "",
    currency: "USD",
    category: "Evaluation",
    default_account: "",
    notes: "",
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur mt-6">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h4 className="font-semibold">Saved Templates</h4>
        <button onClick={() => setOpen((o) => !o)} className="text-sm text-zinc-400 hover:text-white">
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          <div className="divide-y divide-white/5 rounded-xl border border-white/10 overflow-hidden">
            {templates.length === 0 ? (
              <div className="px-3 py-4 text-sm text-zinc-500">No templates yet.</div>
            ) : (
              templates.map((t) => (
                <div key={t.id} className="px-3 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-zinc-400">
                      ${t.default_amount?.toFixed?.(2) ?? t.default_amount} • {t.category || "—"} •{" "}
                      {labelForAccount(accounts, t.default_account)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUse(t)}
                      className="rounded-md bg-emerald-500/90 hover:bg-emerald-400 px-3 py-1 text-xs font-semibold text-black"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="rounded-md bg-white/5 hover:bg-white/10 px-3 py-1 text-xs text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
            <input
              className="input sm:col-span-2"
              placeholder="Name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Amount"
              value={draft.default_amount}
              onChange={(e) => setDraft((d) => ({ ...d, default_amount: e.target.value }))}
            />
            <select
              className="input"
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            >
              <option>Evaluation</option>
              <option>Activation</option>
              <option>Subscription</option>
              <option>Data</option>
              <option>Misc</option>
            </select>
            <select
              className="input"
              value={draft.default_account}
              onChange={(e) => setDraft((d) => ({ ...d, default_account: e.target.value }))}
            >
              <option value="">— Account —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button
              onClick={async () => {
                if (!draft.name) return toast.error("Template needs a name");
                await onAdd({
                  ...draft,
                  default_amount: draft.default_amount ? Number(draft.default_amount) : null,
                });
                setDraft({
                  name: "",
                  default_amount: "",
                  currency: "USD",
                  category: "Evaluation",
                  default_account: "",
                  notes: "",
                });
              }}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function rangeToDates(r) {
  const today = dayjs();
  if (r === "this_month")
    return {
      from: today.startOf("month").format("YYYY-MM-DD"),
      to: today.endOf("month").format("YYYY-MM-DD"),
    };
  if (r === "last_30")
    return {
      from: today.subtract(30, "day").format("YYYY-MM-DD"),
      to: today.format("YYYY-MM-DD"),
    };
  if (r === "ytd")
    return {
      from: today.startOf("year").format("YYYY-MM-DD"),
      to: today.format("YYYY-MM-DD"),
    };
  return {};
}
function labelForAccount(accounts, id) {
  const a = accounts.find((x) => x.id === id);
  if (!a) return "—";
  return [a.name, a.account_type, a.is_real ? "Real" : null].filter(Boolean).join(" • ");
}
function topCategory(map) {
  const entries = Object.entries(map || {});
  if (!entries.length) return null;
  const [k] = entries.sort((a, b) => b[1] - a[1])[0];
  return k;
}
function exportCSV(rows, keys, filename) {
  try {
    const esc = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const header = keys.join(",");
    const body = rows.map((r) => keys.map((k) => esc(r[k])).join(",")).join("\n");
    const csv = header + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    toast.error("Export failed");
  }
}
/* -------------------- Eligibility Logic (fast, no day-enumeration) -------------------- */
function computeEligibility({
  trades,
  lastPayoutDate,         // ISO or null
  mode = "cycle",
  windowDays = 14,
  requiredWinningDays = 5,
  today = new Date().toISOString().slice(0,10),
}) {
  // Build daily net only for days we actually have trades
  const dailyPnl = new Map(); // 'YYYY-MM-DD' -> sum
  for (const t of trades || []) {
    const d = t?.date;
    if (!d) continue;
    const v = Number(t.pnl || 0);
    if (!Number.isFinite(v)) continue;
    dailyPnl.set(d, (dailyPnl.get(d) || 0) + v);
  }

  // Determine time window start
  const start =
    mode === "cycle" && lastPayoutDate
      ? addDaysSafe(lastPayoutDate, 1)
      : addDaysSafe(today, -windowDays + 1);

  // Count only the existing trade days within [start, today]
  let winningDays = 0;
  for (const [d, sum] of dailyPnl.entries()) {
    if (d >= start && d <= today && sum > 0) winningDays += 1;
  }

  return {
    mode,
    eligible: winningDays >= requiredWinningDays,
    winningDays,
    requiredWinningDays,
    windowDays,
    start,
    today,
    remaining: Math.max(0, requiredWinningDays - winningDays),
  };
}

function addDaysSafe(isoDate, delta) {
  const dt = new Date(`${isoDate}T00:00:00`);
  if (isNaN(dt.getTime())) return isoDate;
  dt.setDate(dt.getDate() + delta);
  return dt.toISOString().slice(0, 10);
}


/* -------------------- Mode Switch + Tooltip -------------------- */
function ModeSwitch({ mode, onChange, tooltipCycle, tooltipRolling, loading }) {
  const isCycle = mode === "cycle";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400 hidden sm:inline">Mode:</span>
      <div className="flex rounded-full bg-white/5 p-1 ring-1 ring-white/10">
        <button
          className={`px-3 py-1 text-xs rounded-full ${isCycle ? "bg-emerald-500 text-black font-semibold" : "text-zinc-300 hover:text-white"} ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          onClick={() => !loading && onChange("cycle")}
          title={tooltipCycle}
          type="button"
        >
          Cycle (reset)
        </button>
        <button
          className={`px-3 py-1 text-xs rounded-full ${!isCycle ? "bg-emerald-500 text-black font-semibold" : "text-zinc-300 hover:text-white"} ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          onClick={() => !loading && onChange("rolling")}
          title={tooltipRolling}
          type="button"
        >
          Rolling 14d
        </button>
      </div>
    </div>
  );
}

function Tooltip({ text, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex cursor-help"
      >
        {children}
      </span>
      {open && (
        <div className="absolute z-20 -top-2 left-5 translate-y-[-100%] w-64 rounded-md border border-white/10 bg-zinc-900/90 p-2 text-[11px] text-zinc-200 shadow-lg">
          {text}
        </div>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Inline Input Styles                                                 */
/* ------------------------------------------------------------------ */
if (typeof document !== "undefined" && !document.getElementById("financials-inline-style")) {
  const style = document.createElement("style");
  style.id = "financials-inline-style";
  style.innerHTML = `.input{
    width:100%;
    border-radius:0.875rem;
    border:1px solid rgba(255,255,255,0.14);
    background:rgba(255,255,255,0.06);
    color:white;
    padding:0.65rem 0.9rem;
    font-size:0.875rem
  }`;
  document.head.appendChild(style);
}
