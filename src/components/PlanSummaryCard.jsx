// src/components/PlanSummaryCard.jsx
import React, { useMemo, useState } from "react";
import {
  Target,
  Activity,
  Clock,
  MapPin,
  FileText,
  Copy,
  Check,
} from "lucide-react";

/**
 * Inputs:
 *  - dateLabel
 *  - focusGoal, bias, risk, newsTime, keyLevels, checklistProgress
 *  - planning, prep
 *
 * Notes:
 *  - Prefers Planning values; falls back to Prep; lastly explicit props
 *  - Displays top levels with "Show more" if > 4
 */

function to12h(timeStr) {
  if (!timeStr) return "";
  const s = String(timeStr).trim();
  if (/am|pm/i.test(s)) {
    const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (!m) return s;
    const hh = parseInt(m[1], 10);
    const mm = m[2] || "00";
    const ap = m[3].toUpperCase();
    return `${hh}:${mm} ${ap}`;
  }
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return s;
  let hh = parseInt(m[1], 10);
  const mm = m[2] || "00";
  const ap = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${hh}:${mm} ${ap}`;
}

function checklistProgress(checklist) {
  const vals = Object.values(checklist || {});
  return vals.length ? vals.filter(Boolean).length / vals.length : 0;
}

function formatMoney(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function PlanSummaryCard({
  dateLabel = "Today",
  // optional overrides
  focusGoal,
  bias,
  risk,
  newsTime,
  keyLevels,
  checklistProgress: checklistProgressProp,
  // journal objects (preferred)
  planning,
  prep,
  className = "",
}) {
  const derived = useMemo(() => {
    const pPlan = planning || {};
    const pPrep = prep || {};

    const _focus = focusGoal ?? pPrep.goal ?? pPlan.focusGoal ?? "";
    const _bias = bias ?? pPrep.bias ?? "";

    // Risk box is usually an object; keep loose parsing for safety
    const rawRisk = risk ?? pPlan.riskBox ?? {};
    const _risk = {
      maxRisk: rawRisk.maxRisk ?? rawRisk.risk ?? null,
      maxTrades: rawRisk.maxTrades ?? rawRisk.trades ?? null,
      maxLoss: rawRisk.maxLoss ?? rawRisk.loss ?? null,
    };

    // Key Levels priority: planning -> explicit -> prep
    let levels =
      (Array.isArray(pPlan.keyLevels) && pPlan.keyLevels) ||
      (Array.isArray(keyLevels) && keyLevels) ||
      (Array.isArray(pPrep.keyLevels) && pPrep.keyLevels) ||
      [];

    const normLevels = levels
      .map((lvl) => {
        if (!lvl) return null;
        if (typeof lvl === "object") {
          const label = lvl.label ?? lvl.name ?? "";
          const value = lvl.value ?? lvl.price ?? lvl.level ?? "";
          if (!label && !value) return null;
          return { label: String(label).trim(), value: String(value).trim() };
        }
        const s = String(lvl);
        const m = s.match(/^\s*([^:@\-]+?)\s*[:@\-]?\s*(.+)\s*$/);
        return m
          ? { label: m[1].trim(), value: m[2].trim() }
          : { label: s.trim(), value: "" };
      })
      .filter(Boolean);

    const _news = newsTime ?? pPrep.newsTime ?? "";

    let _progress = checklistProgressProp;
    if (_progress == null) _progress = checklistProgress(pPlan.checklist);

    let _prepNotes = pPrep.notes || "";
    if (
      !_prepNotes &&
      Array.isArray(pPlan.keyLevels) &&
      typeof pPrep.keyLevels === "string"
    ) {
      _prepNotes = pPrep.keyLevels;
    }

    return {
      focusGoal: _focus,
      bias: _bias,
      risk: _risk,
      keyLevels: normLevels,
      newsTime: _news,
      checklistProgress: Math.max(0, Math.min(1, _progress || 0)),
      prepNotes: _prepNotes,
    };
  }, [
    focusGoal,
    bias,
    risk,
    newsTime,
    keyLevels,
    checklistProgressProp,
    planning,
    prep,
  ]);

  const pct = Math.round(derived.checklistProgress * 100);
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const visibleLevels = showAll
    ? derived.keyLevels
    : (derived.keyLevels || []).slice(0, 4);

  const copyLevels = async () => {
    try {
      const text =
        (derived.keyLevels || [])
          .map((l) => `${l.label}: ${l.value}`)
          .join("\n") || "No levels";
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // swallow — clipboard may be restricted
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 p-5 backdrop-blur ${className}`}
      aria-label="Plan summary card"
    >
      {/* Soft background aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-28 -top-28 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -bottom-24 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl"
      />

      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
          {dateLabel} — Plan Summary
        </span>
        <span className="ml-auto text-[11px] text-zinc-400">{pct}% ready</span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-2 w-full rounded-full border border-white/10 bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            transition: "width 320ms ease",
            background:
              "linear-gradient(90deg, rgba(16,185,129,0.95), rgba(34,211,238,0.9))",
          }}
        />
      </div>

      {/* Focus & Bias */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Chip
          icon={Target}
          label="Focus"
          value={derived.focusGoal || "—"}
        />
        <Chip icon={Activity} label="Bias" value={derived.bias || "—"} />
      </div>

      {/* Risk + News */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <MetaPill
            label="Max Risk"
            value={formatMoney(derived.risk?.maxRisk)}
          />
          <MetaPill
            label="Max Trades"
            value={
              derived.risk?.maxTrades != null
                ? `${derived.risk.maxTrades}`
                : "—"
            }
          />
          <MetaPill label="Max Loss" value={formatMoney(derived.risk?.maxLoss)} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-emerald-300" />
          <span className="text-zinc-200">
            <span className="text-zinc-400">News:</span>{" "}
            {derived.newsTime ? to12h(derived.newsTime) : "—"}
          </span>
        </div>
      </div>

      {/* Key Levels */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-emerald-300" />
            <span className="text-zinc-400">Key Levels</span>
          </div>
          <div className="flex items-center gap-2">
            {derived.keyLevels?.length ? (
              <>
                <button
                  onClick={copyLevels}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10"
                  aria-label="Copy key levels"
                >
                  {copied ? (
                    <>
                      <Check size={14} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
                {derived.keyLevels.length > 4 && (
                  <button
                    onClick={() => setShowAll((s) => !s)}
                    className="text-xs text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                    aria-expanded={showAll}
                  >
                    {showAll
                      ? "Show less"
                      : `Show all (${derived.keyLevels.length})`}
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>

        {visibleLevels?.length ? (
          <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visibleLevels.map((lvl, i) => (
              <li
                key={`${lvl.label}-${i}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <span className="text-zinc-400">{lvl.label || "—"}</span>
                <span className="font-semibold text-zinc-100">
                  {lvl.value || "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-500">
            No levels set yet.
          </div>
        )}
      </div>

      {/* Prep Notes */}
      {derived.prepNotes ? (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm mb-1">
            <FileText className="h-4 w-4 text-emerald-300" />
            <span className="text-zinc-400">Market Notes</span>
          </div>
          <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-zinc-200">
            {derived.prepNotes}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------ Small UI pieces ------------------ */

function Chip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <Icon className="h-4 w-4 text-emerald-300" />
      <div className="text-sm">
        <span className="text-zinc-400">{label}:</span>{" "}
        <span className="text-zinc-200">{value}</span>
      </div>
    </div>
  );
}

function MetaPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-200">
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
