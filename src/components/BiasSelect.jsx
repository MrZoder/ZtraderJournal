// src/components/BiasSelect.jsx
import React from "react";
import SuperSelect from "./ui/SuperSelect";

const BIASES = [
  { value: "strong-bull", label: "Strong Bull", emoji: "🚀", hue: "emerald" },
  { value: "bull",        label: "Bull",        emoji: "📈", hue: "emerald" },
  { value: "neutral",     label: "Neutral",     emoji: "⚖️", hue: "zinc"    },
  { value: "bear",        label: "Bear",        emoji: "📉", hue: "rose"    },
  { value: "strong-bear", label: "Strong Bear", emoji: "🧨", hue: "rose"    },
];

function chip(bg) {
  return `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
          border border-white/10 ${bg}`;
}

export default function BiasSelect({ value, onChange, className = "" }) {
  const items = BIASES.map(b => ({
    value: b.value,
    label: b.label,
    desc: `${b.emoji} ${b.label}`,
    hue: b.hue,
  }));

  return (
    <SuperSelect
      items={items}
      value={value || ""}
      onChange={(v) => onChange?.(v)}
      placeholder="Bias…"
      className={`min-w-[180px] ${className}`}
      renderLabel={(it) => {
        if (!it) return <span className="text-zinc-400">Bias…</span>;
        const hue = it.hue === "rose" ? "bg-rose-500/15 text-rose-300" :
                    it.hue === "emerald" ? "bg-emerald-500/15 text-emerald-300" :
                    "bg-white/5 text-zinc-200";
        return <span className={chip(hue)}>{it.desc}</span>;
      }}
    />
  );
}
