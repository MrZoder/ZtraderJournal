import React, { useMemo } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import {
  Star, Lightbulb, CheckCircle2, TriangleAlert, ClipboardList, Download,
} from "lucide-react";

const Glass = ({ className = "", children }) => (
  <div className={`rounded-[22px] border border-white/10 bg-white/6 backdrop-blur-xl ${className}`}>
    {children}
  </div>
);

const Prompt = ({ title, icon: Icon, value, onChange, placeholder }) => (
  <Glass className="p-4 sm:p-5">
    <div className="flex items-center gap-2 mb-2">
      {Icon ? <Icon size={16} className="text-emerald-300" /> : null}
      <h3 className="text-[15px] font-semibold text-zinc-100">{title}</h3>
    </div>
    <textarea
      className="w-full min-h-[96px] rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </Glass>
);

function ScoreBadge({ score }) {
  const color =
    score >= 80 ? "text-emerald-300"
    : score >= 60 ? "text-amber-300"
    : score > 0  ? "text-rose-300"
    : "text-zinc-300";
  return <span className={`text-xl font-extrabold ${color}`}>{score}%</span>;
}

export default function ReviewTab({ value, onChange, trades = [] }) {
  const review = value?.review || {};

  const setReview = (patch) =>
    onChange({ ...value, review: { ...(value.review || {}), ...patch } });

  // simple adherence score proxy: if plan.checklist mostly completed + maxTrades not exceeded
  const computedScore = useMemo(() => {
    const chk = value?.plan?.checklist || {};
    const vals = Object.values(chk);
    const pct = vals.length ? (vals.filter(Boolean).length / vals.length) : 0;
    let score = Math.round(pct * 70); // checklist weight
    const mt = value?.plan?.riskBox?.maxTrades;
    if (Number.isFinite(mt)) {
      const count = trades.length;
      score += count <= mt ? 30 : Math.max(0, 30 - (count - mt) * 10);
    }
    return Math.max(0, Math.min(100, score));
  }, [value, trades]);

  const exportPNG = async () => {
    // lightweight export: render a temporary node -> to canvas via html2canvas if you use it
    // Here we fallback to Markdown text export (keeps it dependency-free)
    const md = [
      `# Review – ${dayjs(value?.date || new Date()).format("DD MMM YYYY")}`,
      `Adherence Score: ${computedScore}%`,
      ``,
      `## What went well`,
      review.good || "—",
      ``,
      `## What to improve`,
      review.bad || "—",
      ``,
      `## Actions`,
      review.actions || "—",
      ``,
      `Grade: ${review.grade || "—"}`,
    ].join("\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Review-${value?.date || "today"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Glass className="p-4 sm:p-5 flex items-center justify-between">
        <div>
          <div className="text-[13px] tracking-widest text-zinc-400">ZTrader Journal OS</div>
          <h2 className="text-xl sm:text-2xl font-extrabold">End-of-Day Review</h2>
          <p className="text-sm text-zinc-400">Reflect deliberately. Reward adherence, not outcome.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-400">Adherence</div>
          <ScoreBadge score={computedScore} />
        </div>
      </Glass>

      {/* Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Prompt
          title="What went well"
          icon={CheckCircle2}
          value={review.good || ""}
          onChange={(v) => setReview({ good: v })}
          placeholder="Setups that worked? Conditions you read well? Discipline moments to repeat…"
        />
        <Prompt
          title="What to improve"
          icon={TriangleAlert}
          value={review.bad || ""}
          onChange={(v) => setReview({ bad: v })}
          placeholder="Where did you deviate from plan? Emotional triggers? Late entries? Size issues…"
        />
      </div>

      <Prompt
        title="Actions for tomorrow"
        icon={ClipboardList}
        value={review.actions || ""}
        onChange={(v) => setReview({ actions: v })}
        placeholder="3 concrete actions you will take. Keep it specific, observable, and binary."
      />

      {/* Grade + export */}
      <Glass className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <Lightbulb size={16} className="text-emerald-300" />
          <span className="text-sm text-zinc-300">Give the day a grade:</span>
          <select
            className="rounded-xl border border-white/10 bg-white/6 px-3 py-1.5 text-sm"
            value={review.grade || ""}
            onChange={(e) => setReview({ grade: e.target.value })}
          >
            <option value="">—</option>
            <option>A+</option><option>A</option><option>B</option>
            <option>C</option><option>D</option>
          </select>
        </div>
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => onChange({ ...value, status: "reviewed" })}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2"
          >
            Mark Reviewed
          </button>
          <button
            onClick={exportPNG}
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm inline-flex items-center gap-2"
          >
            <Download size={16} /> Export (MD)
          </button>
        </div>
      </Glass>
    </div>
  );
}
