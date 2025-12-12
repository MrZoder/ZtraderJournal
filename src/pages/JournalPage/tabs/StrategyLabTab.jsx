// src/pages/JournalPage/tabs/StrategyLabTab.jsx
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Plus, Sparkles, TrendingUp, Filter, Clock3, CalendarDays,
  X, CheckCircle2, LineChart, Target, Beaker, Gauge, BadgeCheck, ChevronDown
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Line
} from "recharts";

/* ===================== Demo Data (replace with Supabase later) ===================== */
const DEMO_STRATEGIES = [
  { id: "s1", name: "NYO Judas + OB Pullback", status: "A+", tags: ["NY", "1m", "OB"], winRate: 62, expectancy: 0.48 },
  { id: "s2", name: "IB Break + VWAP Reclaim", status: "B", tags: ["NY", "5m", "VWAP"], winRate: 55, expectancy: 0.22 },
  { id: "s3", name: "London Reversal @ HTF", status: "Observing", tags: ["LDN", "15m", "HTF"], winRate: 51, expectancy: 0.10 },
  { id: "s4", name: "Killzone Liquidity Sweep", status: "A+", tags: ["NY", "5m", "KZ"], winRate: 65, expectancy: 0.55 },
  { id: "s5", name: "PM Range Fade", status: "B", tags: ["PM", "3m"], winRate: 53, expectancy: 0.08 },
];

const DEMO_RUNS = [
  { id: "r1", strategyId: "s1", date: "2025-08-26", sample: 120, wr: 0.62, avgR: 1.15, exp: 0.48, session: "NY", note: "Strong confluence with HTF OB" },
  { id: "r2", strategyId: "s2", date: "2025-08-30", sample: 80,  wr: 0.55, avgR: 0.98, exp: 0.22, session: "NY", note: "VWAP reclaims weak on trend days" },
  { id: "r3", strategyId: "s3", date: "2025-08-20", sample: 60,  wr: 0.51, avgR: 0.87, exp: 0.10, session: "LDN", note: "Needs tighter invalidation" },
  { id: "r4", strategyId: "s4", date: "2025-09-04", sample: 95,  wr: 0.65, avgR: 1.22, exp: 0.55, session: "NY", note: "Best in first 45 min" },
  { id: "r5", strategyId: "s5", date: "2025-09-01", sample: 57,  wr: 0.53, avgR: 0.76, exp: 0.08, session: "PM", note: "Chop filter reduces losses" },
];

/* hour (0–23) -> baseline winrate for heatmap (demo) */
const BASE_HOURLY = Array.from({ length: 24 }, (_, h) => (
  [0.38,0.40,0.41,0.42,0.43,0.45,0.48,0.50,0.52,0.56,0.58,0.60,0.62,0.60,0.58,0.55,0.53,0.50,0.48,0.46,0.44,0.42,0.40,0.39][h]
));
const DEMO_HOURLY = BASE_HOURLY.map((wr, hour) => ({ hour, wr }));

const WEEKDAY_ORDER = ["Mon","Tue","Wed","Thu","Fri"];
const DEMO_WEEKDAY = WEEKDAY_ORDER.map((d, i) => ({ day: d, wr: [0.57, 0.58, 0.61, 0.59, 0.55][i] }));

/* 2D baseline matrix (weekday × hour) */
const WEEKDAY_BIAS = { Mon: 0.00, Tue: 0.01, Wed: 0.03, Thu: 0.015, Fri: -0.005 };
const BASE_MATRIX = WEEKDAY_ORDER.map((day) =>
  Array.from({ length: 24 }, (_, h) => {
    const base = BASE_HOURLY[h] + WEEKDAY_BIAS[day];
    const curve = 0.03 * Math.cos((Math.PI * (h - 11)) / 12); // shape variance
    const wr = Math.max(0, Math.min(1, base + curve));
    return { day, hour: h, wr };
  })
).flat();

/* =============== Deterministic per-strategy offsets (so heatmaps change when filtered) =============== */
const tinyHash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h / 2 ** 32; };
const jitter = (seed, k) => { const t = Math.sin((seed * 1e6 + k) * 12.9898) * 43758.5453; return (t - Math.floor(t)) * 2 - 1; };

function hourlyForStrategy(strategyId) {
  if (!strategyId || strategyId === "ALL") return DEMO_HOURLY;
  const seed = tinyHash(strategyId);
  return BASE_HOURLY.map((wr, hour) => {
    const delta = 0.025 * jitter(seed, hour);
    const shaped = wr + delta + 0.015 * Math.sin((hour + seed * 24) / 3);
    return { hour, wr: Math.max(0, Math.min(1, shaped)) };
  });
}
function matrixForStrategy(strategyId) {
  if (!strategyId || strategyId === "ALL") return BASE_MATRIX;
  const seed = tinyHash(strategyId);
  return BASE_MATRIX.map((cell) => {
    const k = cell.hour + (cell.day.charCodeAt(0) << 5);
    const delta = 0.02 * jitter(seed, k);
    return { ...cell, wr: Math.max(0, Math.min(1, cell.wr + delta)) };
  });
}

/* ========= Insight helpers (expectancy, labels, actions) ========= */
// Simple expectancy: ExpR ≈ wr*avgWin - (1-wr)*avgLoss   (defaults 1R/1R)
const expR = (wr, avgWin = 1, avgLoss = 1) => +(wr * avgWin - (1 - wr) * avgLoss).toFixed(2);
// Confidence buckets by sample size (N)
const confBucket = (n) => (n >= 200 ? "High" : n >= 80 ? "Med" : "Low");
// Human label (press/hold/reduce) from wr/exp/N thresholds
const recommend = ({ wr, exp, n }) => {
  if (n >= 50 && wr >= 0.58 && exp >= 0.15) return { tag: "Press", color: "emerald" };
  if (n >= 30 && exp >= 0.00)              return { tag: "Hold",  color: "cyan"    };
  return { tag: "Reduce", color: "zinc" };
};
const pct = (v) => `${Math.round(v * 100)}%`;
// Demo: create a plausible N for hour/cell (until wired to real counts)
const demoN = (wr) => Math.max(20, Math.round(40 + wr * 140)); // 20–180

/* ===================== Shared color palettes (perceptual) ===================== */
const PALETTES = {
  viridis: [
    [0.00, 68, 1, 84], [0.17, 59, 82, 139], [0.33, 33, 145, 140],
    [0.50, 94, 201, 98], [0.67, 170, 220, 50], [0.83, 253, 231, 37],
    [1.00, 253, 231, 37],
  ],
  inferno: [
    [0.00, 0, 0, 4], [0.17, 74, 12, 97], [0.33, 183, 55, 121],
    [0.50, 249, 105, 7], [0.67, 252, 170, 49], [0.83, 252, 226, 164],
    [1.00, 252, 226, 164],
  ],
  emerald: [
    [0.00, 5, 46, 42], [0.25, 16, 94, 84], [0.50, 24, 149, 120],
    [0.75, 52, 199, 150], [1.00, 187, 247, 208],
  ],
};
const lerp = (a, b, t) => a + (b - a) * t;
const toRGB = (r, g, b) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
const makeInterp = (stops) => (t) => {
  const x = Math.max(0, Math.min(1, t));
  let i = 0; while (i < stops.length - 1 && x > stops[i + 1][0]) i++;
  const [t0, r0, g0, b0] = stops[i];
  const [t1, r1, g1, b1] = stops[i + 1] || stops[i];
  const u = (x - t0) / Math.max(1e-6, (t1 - t0));
  return toRGB(lerp(r0, r1, u), lerp(g0, g1, u), lerp(b0, b1, u));
};
const makeLegendGradient = (stops) =>
  `linear-gradient(90deg, ${stops.map((s) => `${toRGB(s[1], s[2], s[3])} ${Math.round(s[0] * 100)}%`).join(", ")})`;

/* ===================== UI Primitives ===================== */
const Glass = ({ className = "", children }) => (
  <div className={`rounded-[22px] border border-white/10 bg-white/6 backdrop-blur-xl ${className}`}>{children}</div>
);
const Tile = ({ icon: Icon, label, value, hint }) => (
  <Glass className="p-4">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,.15)]">
        {Icon ? <Icon size={18} className="text-emerald-300" /> : null}
      </div>
      <div>
        <div className="text-[12px] text-zinc-400">{label}</div>
        <div className="text-xl font-extrabold leading-tight">{value}</div>
        {hint ? <div className="text-[11px] text-zinc-500">{hint}</div> : null}
      </div>
    </div>
  </Glass>
);
const StatusPill = ({ s }) => {
  const map = {
    "A+": "text-emerald-200 border-emerald-400/40 bg-emerald-500/10",
    "B": "text-cyan-200 border-cyan-400/40 bg-cyan-500/10",
    "Observing": "text-zinc-200 border-white/20 bg-white/5",
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-md border ${map[s] || "border-white/10 bg-white/5 text-zinc-300"}`}>{s}</span>;
};
const Tag = ({ children }) => (
  <span className="text-[11px] px-2 py-0.5 rounded-md border border-white/10 bg-white/5 text-zinc-300">{children}</span>
);

/* ========= Shared rich tooltip ========= */
function InsightTooltip({ tip }) {
  if (!tip) return null;
  const { x, y, title, wr, exp, n, conf, rec } = tip;

  const color = rec?.color === "emerald" ? "text-emerald-300"
              : rec?.color === "cyan"    ? "text-cyan-300"
              : "text-zinc-300";

  return (
    <div
      className="pointer-events-none fixed z-[70] min-w-[220px] rounded-xl border border-white/10 bg-[#0F1218]/95 px-3 py-2 text-[12px] text-zinc-200 shadow-[0_10px_30px_rgba(0,0,0,.4)]"
      style={{ left: x + 12, top: y + 12 }}
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-1 grid grid-cols-3 gap-2">
        <div><div className="text-zinc-400">Win Rate</div><div className="font-semibold">{pct(wr)}</div></div>
        <div><div className="text-zinc-400">Expectancy</div><div className={`font-semibold ${exp>=0 ? "text-emerald-300" : "text-rose-300"}`}>{exp.toFixed(2)}R</div></div>
        <div><div className="text-zinc-400">Sample</div><div className="font-semibold">{n} <span className="text-zinc-400">({conf})</span></div></div>
      </div>
      <div className="mt-2 text-[11px]">
        <span className={`inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-[2px] ${color}`}>
          {rec?.tag === "Press" && "🚀"}{rec?.tag === "Hold" && "🎯"}{rec?.tag === "Reduce" && "⛔"} {rec?.tag || "—"}
        </span>
        <span className="ml-2 text-zinc-400">
          {rec?.tag === "Press" && "Use full size in this window."}
          {rec?.tag === "Hold"  && "Trade normal risk; watch quality."}
          {rec?.tag === "Reduce"&& "Cut risk or avoid unless A+."}
        </span>
      </div>
    </div>
  );
}

/* ===================== Main Component ===================== */
export default function StrategyLabTab({ strategies = DEMO_STRATEGIES, runs = DEMO_RUNS }) {
  const [showNew, setShowNew] = useState(false);
  const [q, setQ] = useState("");
  const [session, setSession] = useState("ALL");
  const [timeframe, setTimeframe] = useState("ALL");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [activeStrategy, setActiveStrategy] = useState("ALL");
  const [palette, setPalette] = useState("viridis");

  const stops = PALETTES[palette] || PALETTES.viridis;
  const interp = makeInterp(stops);
  const legendGradient = makeLegendGradient(stops);

  const filteredStrategies = useMemo(() => {
    const query = q.toLowerCase();
    return strategies.filter(s =>
      (activeStrategy === "ALL" || s.id === activeStrategy) &&
      (query ? (s.name.toLowerCase().includes(query) || s.tags.join(" ").toLowerCase().includes(query)) : true)
    );
  }, [strategies, q, activeStrategy]);

  const filteredRuns = useMemo(() => {
    let data = runs.filter(r => (activeStrategy === "ALL" ? true : r.strategyId === activeStrategy));
    if (session !== "ALL") data = data.filter(r => r.session === session);
    if (timeframe !== "ALL") {
      data = data.filter(r => {
        const s = strategies.find(s => s.id === r.strategyId);
        return s ? s.tags?.includes(timeframe) : true;
      });
    }
    if (q) {
      const query = q.toLowerCase();
      data = data.filter(r => {
        const s = strategies.find(s => s.id === r.strategyId);
        return (s?.name || "").toLowerCase().includes(query) || (r.note || "").toLowerCase().includes(query);
      });
    }
    data.sort((a,b) => {
      const sign = sortDir === "asc" ? 1 : -1;
      if (["wr","avgR","exp"].includes(sortKey)) return (a[sortKey] - b[sortKey]) * sign;
      if (sortKey === "sample") return (a.sample - b.sample) * sign;
      return (a.date > b.date ? 1 : -1) * sign;
    });
    return data;
  }, [runs, strategies, activeStrategy, session, timeframe, q, sortKey, sortDir]);

  const kpis = useMemo(() => {
    if (filteredRuns.length === 0) return { wr: 0, avgR: 0, exp: 0, n: 0 };
    const n = filteredRuns.reduce((s, r) => s + r.sample, 0);
    const wr = (filteredRuns.reduce((s, r) => s + r.wr * r.sample, 0) / n) || 0;
    const avgR = (filteredRuns.reduce((s, r) => s + r.avgR * r.sample, 0) / n) || 0;
    const exp = (filteredRuns.reduce((s, r) => s + r.exp * r.sample, 0) / n) || 0;
    return { wr, avgR, exp, n };
  }, [filteredRuns]);

  // Strategy-specific inputs for heatmaps
  const hourlyData = useMemo(() => hourlyForStrategy(activeStrategy), [activeStrategy]);
  const matrixData = useMemo(() => matrixForStrategy(activeStrategy), [activeStrategy]);
  const topHours = useMemo(() => [...hourlyData].sort((a,b)=>b.wr-a.wr).slice(0,3).map(d=>d.hour), [hourlyData]);

  // Weekday chart + expectancy line (derived from WR assuming 1R avg win / 1R loss)
  const weekdayChartData = useMemo(() => {
    return DEMO_WEEKDAY.map(d => ({
      ...d,
      wrPct: Math.round(d.wr * 100),
      expR: +(2 * d.wr - 1).toFixed(2), // -1..+1
      wr: d.wr
    }));
  }, []);

  return (
    <div className="space-y-5">
      {/* HERO */}
      <Glass className="relative overflow-hidden p-5 sm:p-6">
        <motion.div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-500/25 to-cyan-500/25 blur-3xl"
          animate={{ x: [0, 8, 0], y: [0, -6, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-500/25 to-emerald-500/25 blur-3xl"
          animate={{ x: [0, -8, 0], y: [0, 6, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="text-[12px] tracking-widest text-zinc-400 uppercase">ZTrader Strategy Lab</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">Build, test, and scale your edge</h2>
            <p className="text-sm text-zinc-400">Playbooks with data. Backtests you can trust. Heatmaps that reveal when to press and when to chill.</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2" onClick={() => setShowNew(true)}>
              <Plus size={16}/> New Strategy
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 font-medium px-4 py-2">
              <Sparkles size={16}/> Quick Tour
            </button>
          </div>
        </div>
      </Glass>

      {/* FILTER BAR */}
      <Glass className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-emerald-300"/>
            <input className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm" placeholder="Search strategies or notes…" value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <LineChart size={16} className="text-emerald-300"/>
            <select className="rounded-xl border border-white/10 bg-white/6 px-2 py-2 text-sm" value={activeStrategy} onChange={(e)=>setActiveStrategy(e.target.value)}>
              <option value="ALL">All strategies</option>
              {strategies.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Clock3 size={16} className="text-emerald-300"/>
            <select className="rounded-xl border border-white/10 bg-white/6 px-2 py-2 text-sm" value={session} onChange={(e)=>setSession(e.target.value)}>
              {["ALL","NY","LDN","PM"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <BadgeCheck size={16} className="text-emerald-300"/>
            <select className="rounded-xl border border-white/10 bg-white/6 px-2 py-2 text-sm" value={timeframe} onChange={(e)=>setTimeframe(e.target.value)}>
              {["ALL","1m","3m","5m","15m"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Palette toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Palette</span>
            <select className="rounded-xl border border-white/10 bg-white/6 px-2 py-2 text-sm" value={palette} onChange={(e)=>setPalette(e.target.value)}>
              <option value="viridis">Viridis</option>
              <option value="inferno">Inferno</option>
              <option value="emerald">Emerald</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-emerald-300"/>
            <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10">Last 90 days</button>
          </div>
        </div>
      </Glass>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile icon={Gauge} label="Win Rate" value={`${Math.round(kpis.wr*100)}%`} hint="Weighted by sample size"/>
        <Tile icon={Target} label="Avg R" value={`${kpis.avgR.toFixed(2)}R`} hint="Avg reward / trade"/>
        <Tile icon={TrendingUp} label="Expectancy" value={`${kpis.exp.toFixed(2)}R`} hint="Per trade expectation"/>
        <Tile icon={Beaker} label="Sample Size" value={kpis.n} hint="Total observations"/>
      </div>

      {/* STRATEGY VAULT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <StrategyColumn title="A+ Setups" items={filteredStrategies.filter(s=>s.status==="A+")}/>
        <StrategyColumn title="B Setups" items={filteredStrategies.filter(s=>s.status==="B")}/>
        <StrategyColumn title="Observing" items={filteredStrategies.filter(s=>s.status==="Observing")}/>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Weekday bars + expectancy line */}
        <Glass className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-2">
              <LineChart size={16} className="text-emerald-300"/><h3 className="font-semibold">Win Rate by Weekday</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">WR bars + Expectancy line</span>
              <CoachHint items={[
                "WR shows probability; Expectancy shows magnitude (R).",
                "🚀 Press when WR≥58% and Exp≥0.15R with decent sample.",
                "Use hot days to set Plan windows; avoid cold days."
              ]}/>
            </div>
          </div>

          <div className="h-[220px] sm:h-[240px] md:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayChartData} margin={{ top: 10, right: 18, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false}/>
                <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 12 }}/>
                <YAxis yAxisId="left" domain={[0, 1]} tickFormatter={(v)=>`${Math.round(v*100)}%`} tick={{ fill: "#a1a1aa", fontSize: 12 }}/>
                <YAxis yAxisId="right" orientation="right" domain={[-0.6, 0.8]} tickFormatter={(v)=>`${v.toFixed(2)}R`} tick={{ fill: "#a1a1aa", fontSize: 12 }}/>
                <ReferenceLine y={0.5} yAxisId="left" stroke="rgba(255,255,255,0.20)" strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{ background: "rgba(15,15,18,.95)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }}
                  formatter={(value, name) => {
                    if (name === "wr") return [`${Math.round(value*100)}%`, "Win Rate"];
                    if (name === "expR") return [`${Number(value).toFixed(2)}R`, "Expectancy"];
                    return value;
                  }}
                  labelFormatter={(label, payload) => {
                    const p = payload?.[0]?.payload;
                    return `${label} • WR ${p?.wrPct || 0}% • Exp ${p?.expR?.toFixed?.(2)}R`;
                  }}
                  labelStyle={{ color: "#e5e7eb" }}
                />
                <Bar yAxisId="left" dataKey="wr" radius={[10,10,0,0]} fill="rgb(16,185,129)" barSize={30}
                     style={{ filter: "drop-shadow(0 0 6px rgba(16,185,129,.25))" }}/>
                <Line yAxisId="right" type="monotone" dataKey="expR" stroke="rgb(34,211,238)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Glass>

        {/* Hour heatmap (per-strategy) */}
        <Glass className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-2">
              <FlaskConical size={16} className="text-emerald-300"/><h3 className="font-semibold">Win Rate by Hour</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">Local time • Filters respect strategy</span>
              <CoachHint items={[
                "🚀 Press in hot hours (WR≥58%, Exp≥0.15R, N≥50).",
                "🎯 Hold when Exp≥0; be selective.",
                "⛔ Reduce in cold hours; avoid unless A+.",
                "Mirror these windows into Plan’s time rules."
              ]}/>
            </div>
          </div>
          <HourHeatmap data={hourlyData} topHours={topHours} interp={interp} legendGradient={legendGradient}/>
        </Glass>
      </div>

      {/* 2D HEATMAP: Weekday × Hour (per-strategy) */}
      <Glass className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-2">
            <FlaskConical size={16} className="text-emerald-300" />
            <h3 className="font-semibold">Alpha Map — Weekday × Hour</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">Scroll horizontally on mobile</span>
            <CoachHint items={[
              "Protect hot day–hour cells (no meetings).",
              "Gate strategies to their best cells via Templates.",
              "Add a ‘No new positions’ rule for cold cells (e.g., Fri PM)."
            ]}/>
          </div>
        </div>
        <WeekdayHourHeatmap2D data={matrixData} interp={interp} legendGradient={legendGradient}/>
      </Glass>

      {/* BACKTEST RUNS TABLE */}
      <Glass className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-2">
            <Beaker size={16} className="text-emerald-300"/><h3 className="font-semibold">Backtest Runs</h3>
          </div>
        <div className="text-[11px] text-zinc-500">Click headers to sort</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-white/10">
                {[
                  ["date","Date"],["strategyId","Strategy"],["session","Session"],
                  ["sample","N"],["wr","Win %"],["avgR","Avg R"],["exp","Exp R"],["note","Notes"]
                ].map(([key,label])=>(
                  <th key={key} className="py-2 pr-3 cursor-pointer select-none" onClick={()=>{
                    setSortKey(key); setSortDir(d=> (sortKey!==key? "desc" : (d==="desc"?"asc":"desc")));
                  }}>
                    <div className="inline-flex items-center gap-1">{label}{sortKey===key?<ChevronDown size={14} className={`transition ${sortDir==="asc"?"rotate-180":""}`}/>:null}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRuns.map(r=>{
                const s = strategies.find(s=>s.id===r.strategyId);
                return (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 pr-3 text-zinc-300">{r.date}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-100">{s?.name || r.strategyId}</span>
                        <StatusPill s={s?.status || "B"}/>
                      </div>
                    </td>
                    <td className="py-2 pr-3"><Tag>{r.session}</Tag></td>
                    <td className="py-2 pr-3">{r.sample}</td>
                    <td className="py-2 pr-3">{Math.round(r.wr*100)}%</td>
                    <td className="py-2 pr-3" title={`${r.avgR.toFixed(2)}R`}>
                      <span className={`${r.avgR>=1 ? "text-emerald-300":"text-zinc-300"}`}>{r.avgR.toFixed(2)}R</span>
                    </td>
                    <td className="py-2 pr-3" title={`${r.exp.toFixed(2)}R`}>
                      <span className={`${r.exp>=0 ? "text-emerald-300":"text-rose-300"}`}>{r.exp.toFixed(2)}R</span>
                    </td>
                    <td className="py-2 pr-3 text-zinc-300">{r.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Glass>

      {/* NEW STRATEGY MODAL */}
      <NewStrategyModal show={showNew} onClose={()=>setShowNew(false)} />

      {/* styles */}
      <style>{`
        .input{
          width:100%;
          border-radius:0.875rem;
          border:1px solid rgba(255,255,255,0.14);
          background:rgba(255,255,255,0.06);
          color:white; padding:.6rem .8rem; font-size:.875rem;
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 2px rgba(16,185,129,.45), 0 0 0 0 rgba(16,185,129,.18); }
          70%  { box-shadow: 0 0 0 2px rgba(16,185,129,.2), 0 0 0 10px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 2px rgba(16,185,129,.2), 0 0 0 12px rgba(16,185,129,0); }
        }
      `}</style>
    </div>
  );
}

/* ===================== Subcomponents ===================== */

function StrategyColumn({ title, items }) {
  return (
    <Glass className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex items-center gap-2">
          <BadgeCheck size={16} className="text-emerald-300"/><h3 className="font-semibold">{title}</h3>
        </div>
        <span className="text-[11px] text-zinc-500">{items.length} {items.length===1?"strategy":"strategies"}</span>
      </div>
      <div className="grid gap-2">
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <div className="text-sm text-zinc-500">None yet.</div>
          ) : items.map(s => (
            <motion.div key={s.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 hover:shadow-[0_0_0_1px_rgba(255,255,255,.08),0_10px_30px_rgba(16,185,129,.08)] transition"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{s.name}</div>
                <StatusPill s={s.status}/>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {s.tags?.map(t => <Tag key={t}>{t}</Tag>)}
              </div>
              <div className="mt-2 text-[12px] text-zinc-400">
                WR <span className="text-zinc-200 font-semibold">{s.winRate}%</span> · EXP <span className="text-zinc-200 font-semibold">{s.expectancy.toFixed(2)}R</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Glass>
  );
}

/* 1D Hour heatmap (pills) with coaching tooltip */
function HourHeatmap({ data, topHours = [], interp, legendGradient }) {
  const [tip, setTip] = React.useState(null);

  return (
    <div className="relative">
      <div className="grid grid-cols-12 gap-2 sm:gap-3">
        {[0, 12].map((row) => (
          <React.Fragment key={row}>
            {data.slice(row, row + 12).map(({ hour, wr }) => {
              const n   = demoN(wr);
              const exp = expR(wr);
              const rec = recommend({ wr, exp, n });
              const hit = topHours.includes(hour);
              const color = interp(wr);

              const makeTip = (x, y) => setTip({
                x, y,
                title: `${String(hour).padStart(2,"0")}:00`,
                wr, exp, n, conf: confBucket(n), rec
              });

              return (
                <div key={hour} className="relative">
                  <div
                    className="h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full border border-white/10 flex items-center justify-center text-[11px] transition transform hover:-translate-y-[2px]"
                    style={{
                      background: color,
                      boxShadow: [
                        "inset 0 1px 0 rgba(255,255,255,.18)",
                        hit ? "0 0 0 2px rgba(16,185,129,.45), 0 8px 22px rgba(16,185,129,.25)" : "0 6px 14px rgba(0,0,0,.28)"
                      ].join(", "),
                      color: "rgba(255,255,255,.92)",
                      touchAction: "none",
                    }}
                    onMouseEnter={(e)=>makeTip(e.clientX, e.clientY)}
                    onMouseMove={(e)=>makeTip(e.clientX, e.clientY)}
                    onMouseLeave={()=>setTip(null)}
                    onTouchStart={(e)=>{ const t=e.touches[0]; makeTip(t.clientX, t.clientY); }}
                    onTouchMove={(e)=>{ const t=e.touches[0]; makeTip(t.clientX, t.clientY); }}
                    onTouchEnd={()=>setTip(null)}
                    title=""
                  >
                    <span className="drop-shadow-[0_1px_0_rgba(0,0,0,.5)]">{hour}</span>
                  </div>
                  {hit && <span className="absolute inset-0 -m-1 rounded-full pointer-events-none" style={{ animation: "pulseRing 2.2s ease-out infinite" }}/>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[11px] text-zinc-400">Colder</span>
        <div className="h-2 flex-1 rounded-full overflow-hidden border border-white/10">
          <div className="h-full w-full" style={{ background: legendGradient }} />
        </div>
        <span className="text-[11px] text-zinc-400">Hotter</span>
      </div>

      <InsightTooltip tip={tip}/>
    </div>
  );
}

/* 2D Weekday × Hour heatmap (scrollable on mobile) with coaching tooltip */
function WeekdayHourHeatmap2D({ data, interp, legendGradient }) {
  const rows = WEEKDAY_ORDER;
  const [tip, setTip] = React.useState(null);

  return (
    <div className="relative overflow-x-auto">
      <div className="min-w-[720px]">
        {/* header hours */}
        <div className="grid" style={{ gridTemplateColumns: `64px repeat(24, minmax(18px, 1fr))` }}>
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-[10px] text-center text-zinc-400">{h}</div>
          ))}
        </div>

        {/* body */}
        <div className="mt-1 grid gap-1">
          {rows.map((day) => (
            <div key={day} className="grid items-center" style={{ gridTemplateColumns: `64px repeat(24, minmax(18px, 1fr))`, gap: "4px" }}>
              <div className="text-[12px] text-zinc-300">{day}</div>
              {Array.from({ length: 24 }, (_, h) => {
                const cell = data.find((d) => d.day === day && d.hour === h);
                const wr = cell?.wr ?? 0;
                const n   = demoN(wr);
                const exp = expR(wr);
                const rec = recommend({ wr, exp, n });

                const makeTip = (x, y) => setTip({
                  x, y,
                  title: `${day} · ${String(h).padStart(2,"0")}:00`,
                  wr, exp, n, conf: confBucket(n), rec
                });

                return (
                  <div
                    key={`${day}-${h}`}
                    className="h-4 sm:h-5 rounded-[6px] border border-white/10"
                    style={{ background: interp(wr), boxShadow: "inset 0 1px 0 rgba(255,255,255,.15)", touchAction: "none" }}
                    onMouseEnter={(e)=>makeTip(e.clientX, e.clientY)}
                    onMouseMove={(e)=>makeTip(e.clientX, e.clientY)}
                    onMouseLeave={()=>setTip(null)}
                    onTouchStart={(e)=>{ const t=e.touches[0]; makeTip(t.clientX, t.clientY); }}
                    onTouchMove={(e)=>{ const t=e.touches[0]; makeTip(t.clientX, t.clientY); }}
                    onTouchEnd={()=>setTip(null)}
                    title=""
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Colder</span>
          <div className="h-2 flex-1 rounded-full overflow-hidden border border-white/10">
            <div className="h-full w-full" style={{ background: legendGradient }} />
          </div>
          <span className="text-[11px] text-zinc-400">Hotter</span>
        </div>
      </div>

      <InsightTooltip tip={tip}/>
    </div>
  );
}

function NewStrategyModal({ show, onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y:0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0E1118] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2">
                <FlaskConical size={18} className="text-emerald-300"/><h3 className="font-semibold">New Strategy</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10"><X size={16}/></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Name"><input className="input" placeholder="e.g., NYO Judas + OB Pullback"/></Field>
              <Field label="Status">
                <select className="input">{["A+","B","Observing"].map(s=><option key={s}>{s}</option>)}</select>
              </Field>
              <Field label="Hypothesis"><textarea className="input min-h-[80px]" placeholder="What edge are you exploiting?"/></Field>
              <Field label="Entry Rules"><textarea className="input min-h-[80px]" placeholder="Entry triggers, confirmation…"/></Field>
              <Field label="Exit Rules"><textarea className="input min-h-[80px]" placeholder="Targets, invalidation…"/></Field>
              <Field label="Tags"><input className="input" placeholder="e.g., NY, 5m, OB"/></Field>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
              <button onClick={onClose} className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm inline-flex items-center gap-2">
                <CheckCircle2 size={16}/> Save Strategy
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs text-zinc-400 mb-1">{label}</div>
      {children}
    </label>
  );
}

/* Tiny coach button for “How to use” bullets */
function CoachHint({ items = [] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)} className="text-[11px] px-2 py-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10">
        How to use
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[280px] rounded-xl border border-white/10 bg-[#0E1118] p-3 text-[12px] text-zinc-300 shadow-xl">
          <ul className="space-y-2 leading-snug">
            {items.map((t,i)=><li key={i}>• {t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
