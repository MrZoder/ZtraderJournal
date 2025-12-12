// src/pages/Statistics.jsx
import React, { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isoWeek from "dayjs/plugin/isoWeek";
import isBetween from "dayjs/plugin/isBetween";
import PageLoader from "../components/PageLoader";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  CartesianGrid, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, LabelList,
  ScatterChart, Scatter, ReferenceLine
} from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { fetchTrades } from "../utils/tradeService";
import {
  computeExpectancy,
  computeStreaks,
  computePLBySession
} from "../utils/storage";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);
dayjs.extend(isBetween);

/* ─── Info tooltip component ─── */
function Info({ tip }) {
  return (
    <span className="ml-1 relative group inline-block">
      <svg viewBox="0 0 24 24" className="inline w-4 h-4 fill-gray-400 group-hover:fill-emerald-400 transition">
        <circle cx="12" cy="12" r="10" opacity=".15" />
        <path d="M12 17v-4m0-4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition
                      bg-zinc-900 text-xs text-gray-200 p-2 rounded-xl w-44 z-10">
        {tip}
      </div>
    </span>
  );
}

/* ─── constants ─── */
const SESSION_COLORS = { Asia: "#00FFAB", London: "#FFD166", "New York": "#FF5757" };
const WEEKDAY_COLORS = { Mon: "#46BFFF", Tue: "#FF5757", Wed: "#A68EFF", Thu: "#32CD32", Fri: "#FFD166" };
const EDGE_MAX       = { win: 100, rr: 5, exp: 300, pf: 3 };

/* ─── compute session helper ─── */
const getSessionFromTime = (date, time) => {
  if (!date || !time) return "-";
  const utcTime = dayjs(`${date}T${time}`).utc();
  const totalMinutes = utcTime.hour() * 60 + utcTime.minute();
  if (totalMinutes < 480) return "Asia";
  if (totalMinutes < 780) return "London";
  return "New York";
};

/* ─── animations ─── */
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12 } } };
const section   = { hidden: { opacity: 0, y: 34 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 46, damping: 18 } } };
const card      = { hidden: { opacity: 0, y: 24, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 50, damping: 20 } } };

/* ─── custom tooltips & labels ─── */
function SimpleTooltip({ active, payload, label, unit = "$" }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold">
        {unit === "%" ? `${v}${unit}` : `${v >= 0 ? "+" : ""}${unit}${unit === "$" ? v.toFixed(2) : v}`}
      </p>
    </div>
  );
}
function BarLabel({ x, y, width, height, value }) {
  const cx = x + width / 2;
  const cy = value >= 0 ? y - 10 : y + height + 14;

  const v = Number(value) || 0;
  const formatted = Math.abs(v).toFixed(2);

  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      fill="#fff"
      fontSize={12}
      fontWeight={600}
    >
      {v >= 0 ? `+$${formatted}` : `-$${formatted}`}
    </text>
  );
}


/* ─── KPI & ChartCard with tooltips ─── */
function KPI({ label, value, accent, tip }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <p className="text-xs text-gray-400 flex items-center gap-1">
        {label}{tip && <Info tip={tip}/>}
      </p>
      <p className={`mt-1 text-lg font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
function ChartCard({ title, tip, className = "", children }) {
  return (
    <motion.div variants={card} className={`bg-white/5 backdrop-blur rounded-3xl p-6 md:p-8 shadow-xl ${className}`}>
      <p className="text-lg font-semibold mb-4 flex items-center gap-1">
        {title}{tip && <Info tip={tip}/>}
      </p>
      {children}
    </motion.div>
  );
}

/* ─── TradeCard unchanged ─── */
function TradeCard({ title, trade, positive }) {
  const border = positive ? "border-emerald-400" : "border-rose-400";
  return (
    <motion.div variants={card} className={`bg-white/5 backdrop-blur rounded-2xl p-6 shadow-lg border-l-2 ${border} max-w-xs`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-md font-semibold">{title}</p>
        {trade?.rr != null && <p className="text-xs text-gray-300">R/R {trade.rr.toFixed(2)}</p>}
      </div>
      {trade ? (
        <>
          <p className={`text-2xl font-bold mb-2 ${trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {trade.pnl >= 0 ? `+${trade.pnl.toFixed(2)}` : `-${Math.abs(trade.pnl).toFixed(2)}`}
          </p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>Date: {dayjs(trade.date || trade.datetime).format("DD MMM YYYY")}</li>
            <li>Session: {trade.session}</li>
            <li>Symbol: {trade.symbol}</li>
            {trade.contracts && <li>Contracts: {trade.contracts}</li>}
            {trade.emotion && <li>Emotion: {trade.emotion}</li>}
          </ul>
        </>
      ) : (
        <p className="italic text-gray-400">No trades in this period.</p>
      )}
    </motion.div>
  );
}

/* ─── main Statistics component ─── */
export default function Statistics() {
  const [trades, setTrades]       = useState([]);
  const [range, setRange]         = useState("This Week");
  const [startDate, setStartDate] = useState(dayjs().startOf("isoWeek").toDate());
  const [endDate, setEndDate]     = useState(dayjs().endOf("day").toDate());
  const [view, setView]           = useState("Overview");
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchTrades()
      .then(raw => {
        const withSession = raw.map(t => ({
          ...t,
          session: getSessionFromTime(
            t.date,
            t.time || (t.datetime ? dayjs(t.datetime).format("HH:mm") : null)
          ),
        }));
        setTrades(withSession);
      })
      .finally(() => setLoading(false));
  }, []);

  const { start, end } = useMemo(() => {
    const today = dayjs().endOf("day");
    switch (range) {
      case "All Time":    return { start: dayjs("1970-01-01"), end: today };
      case "Last Week":   { const p = dayjs().subtract(1, "week");   return { start: p.startOf("isoWeek"), end: p.endOf("isoWeek") }; }
      case "Last Month":  { const p = dayjs().subtract(1, "month");  return { start: p.startOf("month"),   end: p.endOf("month")   }; }
      case "This Month":  return { start: dayjs().startOf("month"),   end: today };
      case "Custom":      return { start: dayjs(startDate),         end: dayjs(endDate)   };
      default:            return { start: dayjs().startOf("isoWeek"), end: today };
    }
  }, [range, startDate, endDate]);

  const data = useMemo(() =>
    trades.filter(t => {
      const ts = dayjs.utc(t.datetime || `${t.date}T${t.time || "00:00"}`);
      return ts.isBetween(start, end, "day","[]");
    }),
  [trades, start, end]);

  /* KPIs */
  const netPnl       = data.reduce((s,t)=>s+t.pnl,0);
  const wins         = data.filter(t=>t.pnl>0);
  const losses       = data.filter(t=>t.pnl<0);
  const winRate      = data.length ? ((wins.length/data.length)*100).toFixed(1) : "0.0";
  const avgRR        = (() => {
    const arr = data.filter(t=>t.rr!=null).map(t=>t.rr);
    return arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : "0.00";
  })();
  const expectVal    = useMemo(()=>computeExpectancy(data), [data]);
  const { currentWin } = useMemo(()=>computeStreaks(data), [data]);
  const profitFactor = losses.length
    ? (wins.reduce((s,t)=>s+t.pnl,0)/Math.abs(losses.reduce((s,t)=>s+t.pnl,0))).toFixed(2)
    : "∞";

  /* transforms */
  const cumul   = useMemo(()=>{
    const m={}; data.forEach(t=>{ const d=dayjs(t.datetime||t.date).format("YYYY-MM-DD"); m[d]=(m[d]||0)+t.pnl; });
    let sum=0; return Object.entries(m).sort().map(([d,v])=>({ date:d, total:(sum+=v) }));
  },[data]);
  const session = useMemo(()=>computePLBySession(data), [data]);
  const wkdays  = useMemo(()=>{
    const days=["Mon","Tue","Wed","Thu","Fri"], cnt=Object.fromEntries(days.map(d=>[d,0]));
    data.forEach(t=>{ const d=dayjs(t.datetime||t.date).format("ddd"); if(cnt[d]!=null) cnt[d]++; });
    return days.map(d=>({ day:d, count:cnt[d] }));
  },[data]);
  const dist    = useMemo(()=>{
    const buckets=[-2000,-1000,-500,-100,-10,10,100,500,1000,2000];
    const freq=Array(buckets.length-1).fill(0);
    data.forEach(t=>{ for(let i=0;i<buckets.length-1;i++){
      if(t.pnl>=buckets[i]&&t.pnl<buckets[i+1]){ freq[i]++; break; }
    }});
    return freq.map((c,i)=>({ bucket:`${buckets[i]}–${buckets[i+1]}`, count:c }));
  },[data]);
  const radarData = [
    { label:"Win %",         value:+(winRate/EDGE_MAX.win).toFixed(3) },
    { label:"Avg R/R",       value:+(Math.min(avgRR/EDGE_MAX.rr,1)).toFixed(3) },
    { label:"Expectancy",    value:+(Math.min(Math.abs(expectVal)/EDGE_MAX.exp,1)).toFixed(3) },
    { label:"Profit Factor", value:+(profitFactor==="∞"?1:Math.min(profitFactor/EDGE_MAX.pf,1)).toFixed(3) },
  ];
  const best  = data.reduce((b,t)=>t.pnl>0&&(!b||t.pnl>b.pnl)?t:b,null);
  const worst = data.reduce((w,t)=>t.pnl<0&&(!w||t.pnl<w.pnl)?t:w,null);

  const avgTrade = data.length ? (data.reduce((s,t)=>s+t.pnl,0)/data.length) : 0;
  const bestDay  = cumul.reduce((b,c)=>(!b||c.total>b.total?c:b), null);
  const worstDay = cumul.reduce((w,c)=>(!w||c.total<w.total?c:w), null);
  const insights = [
    { title:"Total Trades",  value:data.length },
    { title:"Avg P&L/Trade", value:`$${avgTrade.toFixed(2)}` },
    { title:"Largest Win",   value:best?`+$${best.pnl.toFixed(2)}`:"–" },
    { title:"Largest Loss",  value:worst?`-$${Math.abs(worst.pnl).toFixed(2)}`:"–" },
    { title:"Best Day",      value:bestDay?`${dayjs(bestDay.date).format("DD MMM")}: $${bestDay.total.toFixed(2)}`:"–" },
    { title:"Worst Day",     value:worstDay?`${dayjs(worstDay.date).format("DD MMM")}: $${worstDay.total.toFixed(2)}`:"–" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 text-white">

      {!loading && (
        <motion.div variants={container} initial="hidden" animate="show">
          {/* header */}
          <motion.div variants={section} className="flex flex-wrap items-center justify-between mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold">📊 Statistics</h1>
            <div className="space-x-2">
              {["Overview","History"].map(v=>(
                <button key={v} onClick={()=>setView(v)}
                  className={`px-4 py-2 rounded-lg ${
                    view===v ? "bg-emerald-400 text-black":"bg-white/10 hover:bg-white/15"
                  }`}>
                  {v}
                </button>
              ))}
            </div>
          </motion.div>

          {/* range selector */}
          <motion.div variants={section} className="flex flex-wrap gap-4 mb-6">
            {["This Week","Last Week","This Month","Last Month","All Time","Custom"].map(r=>(
              <button key={r} onClick={()=>setRange(r)}
                className={`px-4 py-2 rounded-lg ${
                  r===range ? "bg-emerald-400 text-black":"bg-white/10 hover:bg-white/15"
                }`}>
                {r}
              </button>
            ))}
          </motion.div>

          {/* custom pickers stack on mobile */}
          {range==="Custom" && (
            <motion.div variants={section} className="flex flex-col sm:flex-row items-center gap-3 mb-8">
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                className="w-full sm:w-auto px-3 py-2 rounded-lg bg-white/10 text-white"
              />
              <span className="text-gray-400">to</span>
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                className="w-full sm:w-auto px-3 py-2 rounded-lg bg-white/10 text-white"
              />
            </motion.div>
          )}

          {/* OVERVIEW */}
          {view==="Overview" && <>
            {/* KPIs */}
            <motion.div variants={section} className="mb-10">
              <motion.div variants={card} className="bg-white/5 backdrop-blur rounded-3xl p-8 shadow-xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
                  <KPI
                    label="Net P&L"
                    value={`$${netPnl.toFixed(2)}`}
                    accent={netPnl >= 0 ? "text-emerald-400" : "text-rose-400"}
                    tip="Sum of all profits and losses across your trades"
                  />
                  <KPI
                    label="Win Rate"
                    value={`${winRate}%`}
                    accent="text-sky-400"
                    tip="Percentage of trades that were profitable"
                  />
                  <KPI
                    label="Avg R/R"
                    value={avgRR}
                    accent="text-yellow-300"
                    tip="Average risk-to-reward ratio per trade"
                  />
                  <KPI
                    label="Win Streak"
                    value={currentWin}
                    accent="text-sky-400"
                    tip="Current number of consecutive winning trades"
                  />
                  <KPI
                    label="Expectancy"
                    value={`$${expectVal.toFixed(2)}`}
                    accent={expectVal >= 0 ? "text-emerald-400" : "text-rose-400"}
                    tip="Average dollar expected per trade"
                  />
                  <KPI
                    label="Profit Factor"
                    value={profitFactor}
                    accent="text-emerald-400"
                    tip="Gross profits divided by gross losses"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Cumulative P&L */}
            <motion.div variants={section} className="mb-12">
              <ChartCard
                title="Cumulative P&L"
                tip="Trend of your running profit and loss over time"
              >
                <div className="w-full h-64 sm:h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumul} margin={{ top:0, right:20, left:0, bottom:0 }}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00FFAB" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#00FFAB" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeOpacity={0.1} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:"#888"}} tickFormatter={d=>dayjs(d).format("MMM D")}/>
                      <YAxis tick={{fill:"#888"}}/>
                      <ReTooltip content={<SimpleTooltip/>} cursor={{fill:"transparent"}}/>
                      <Area type="monotone" dataKey="total" stroke="#00FFAB" fill="url(#grad)" strokeWidth={2}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </motion.div>

            {/* Session & Weekday */}
            <motion.div variants={section} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <ChartCard
                title="P&L by Session"
                tip="Profit & Loss grouped by trading sessions: Asia, London, New York"
              >
                <div className="w-full h-64 sm:h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={session} margin={{ top:32,left:20,right:20 }}>
                      <CartesianGrid strokeOpacity={0.1} vertical={false}/>
                      <XAxis dataKey="session" tick={{fill:"#888",fontSize:12}}/>
                      <YAxis tick={{fill:"#888"}}/>
                      <ReTooltip content={<SimpleTooltip/>} cursor={{fill:"transparent"}}/>
                      <Bar dataKey="total" barSize={40} radius={[6,6,0,0]}>
                        {session.map(s=>(
                          <Cell key={s.session} fill={SESSION_COLORS[s.session] ?? "#FF5757"}/>
                        ))}
                        <LabelList content={BarLabel}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard
                title="Trades by Weekday"
                tip="Number of trades executed on each weekday"
              >
                <div className="w-full h-64 sm:h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wkdays} margin={{ top:32,left:20,right:20 }}>
                      <CartesianGrid strokeOpacity={0.1} vertical={false}/>
                      <XAxis dataKey="day" tick={{fill:"#888",fontSize:12}}/>
                      <YAxis tick={{fill:"#888"}} allowDecimals={false}/>
                      <ReTooltip content={<SimpleTooltip unit=""/>} cursor={{fill:"transparent"}}/>
                      <Bar dataKey="count" barSize={28} radius={[6,6,0,0]}>
                        {wkdays.map(d=><Cell key={d.day} fill={WEEKDAY_COLORS[d.day]}/>)}
                        <LabelList dataKey="count" position="insideTop" offset={-14} fill="#fff"/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </motion.div>

            {/* Distribution & Edge Radar */}
            <motion.div variants={section} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <ChartCard
                title="Profit Distribution"
                tip="Count of trades in each profit/loss bucket"
              >
                <div className="w-full h-64 sm:h-80 md:h-96 px-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={dist} margin={{ left:20, right:20 }} barCategoryGap="15%">
                      <CartesianGrid strokeOpacity={0.1} horizontal={false}/>
                      <XAxis type="number" tick={{fill:"#888",fontSize:12}} allowDecimals={false}/>
                      <YAxis dataKey="bucket" type="category" tick={{fill:"#888",fontSize:12}} width={70}/>
                      <ReTooltip content={<SimpleTooltip unit=""/>} cursor={{fill:"transparent"}}/>
                      <Bar dataKey="count" barSize={18}>
                        {dist.map((d,i)=>(
                          <Cell key={i} fill={d.bucket.startsWith("-")? "#FF5757":"#00FFAB"} radius={[0,8,8,0]}/>
                        ))}
                        <LabelList dataKey="count" position="right" offset={8} fill="#fff" fontSize={12}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard
                title="Edge Radar"
                tip="Radar of normalized Win %, Avg R/R, Expectancy & Profit Factor"
              >
                <div className="w-full h-64 sm:h-80 md:h-96 px-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={radarData}
                      outerRadius="80%"
                      margin={{ top:20, right:20, bottom:20, left:20 }}
                    >
                      <PolarGrid strokeOpacity={0.15}/>
                      <PolarAngleAxis dataKey="label" tick={{fill:"#aaa",fontSize:12}}/>
                      <Radar dataKey="value" stroke="#00FFAB" fill="#00FFAB" fillOpacity={0.5} strokeWidth={2} dot/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </motion.div>

            {/* Risk–Reward vs P&L */}
            <motion.div variants={section} className="mb-12">
              <ChartCard
                title="Risk–Reward vs P&L"
                tip="Each dot is a trade’s risk–reward ratio vs its P&L"
              >
                <div className="w-full h-64 sm:h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top:24,left:20,right:20 }}>
                      <CartesianGrid strokeOpacity={0.1}/>
                      <ReferenceLine x={1} stroke="#888" strokeDasharray="3 3"/>
                      <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3"/>
                      <XAxis dataKey="rr" name="R/R" tick={{fill:"#888"}} domain={[0,"dataMax"]}/>
                      <YAxis dataKey="pnl" name="P/L" tick={{fill:"#888"}}/>
                      <ReTooltip content={({active,payload})=>{
                        if(!active||!payload?.length) return null;
                        const {rr,pnl}=payload[0].payload;
                        return (
                          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm">
                            <div>R/R: {rr.toFixed(2)}</div>
                            <div>P&L: {pnl>=0?`+$${pnl.toFixed(2)}`:`-$${Math.abs(pnl).toFixed(2)}`}</div>
                          </div>
                        );
                      }} cursor={{stroke:"#444"}}/>
                      <Scatter data={data.map(t=>({rr:t.rr,pnl:t.pnl}))} fill="#A68EFF"/>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </motion.div>
          </>}

          {/* HISTORY */}
          {view==="History" && (
            <motion.div variants={section} className="mt-6">
              <h2 className="text-2xl font-semibold mb-4">Trade History</h2>
              <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2 touch-pan-y custom-scrollbar">
                {data.map((t,i)=>(
                  <motion.div key={i} variants={card}
                    className="bg-white/5 backdrop-blur rounded-3xl p-4 shadow-sm hover:shadow-md transition
                               flex flex-col items-start sm:grid sm:grid-cols-3 sm:items-center">
                    <div className="flex-1">
                      <p className="font-medium">{dayjs(t.datetime||t.date).format("DD MMM YYYY")}</p>
                      <p className="text-gray-400 text-xs sm:hidden">{t.session}</p>
                    </div>
                    <p className={`mt-2 sm:mt-0 text-lg font-bold text-center ${t.pnl>=0?"text-emerald-400":"text-rose-400"}`}>
                      {t.pnl>=0?`+${t.pnl.toFixed(2)}`:`-${Math.abs(t.pnl).toFixed(2)}`}
                    </p>
                    <p className="mt-1 sm:mt-0 text-gray-300 text-xs text-center">
                      <span className="sm:hidden">R/R </span>{t.rr!=null? t.rr.toFixed(2):"–"}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* BOTTOM CARDS */}
          <motion.div variants={container} className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <TradeCard title="🏆 Top Trade"   trade={best}  positive/>
            <TradeCard title="🔻 Worst Trade" trade={worst}/>
            <motion.div variants={card} className="bg-white/5 backdrop-blur rounded-3xl p-6 shadow-xl">
              <p className="text-lg font-semibold mb-6">Insights</p>
              <div className="grid grid-cols-2 gap-6 text-sm">
                {insights.map(i=>(
                  <div key={i.title} className="bg-white/10 backdrop-blur rounded-xl p-4 flex flex-col items-center">
                    <span className="text-gray-400">{i.title}</span>
                    <span className="font-semibold mt-1">{i.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
