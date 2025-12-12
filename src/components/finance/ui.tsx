// src/components/finance/ui.tsx
import React from "react";
import clsx from "clsx";

export function Money({
  value,
  prefix = "",
  className = "",
  size = "lg",
}: {
  value: number | string;
  prefix?: string; // e.g. "$"
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const n = Number(value);
  const sign = Number.isFinite(n) ? (n > 0 ? 1 : n < 0 ? -1 : 0) : 0;
  const amount = Number.isFinite(n) ? Math.abs(n).toFixed(2) : String(value);

  const tone =
    sign > 0
      ? "text-emerald-300"
      : sign < 0
      ? "text-rose-300"
      : "text-zinc-300";

  const sizes: Record<string, string> = {
    sm: "text-base font-semibold",
    md: "text-xl font-bold",
    lg: "text-2xl font-extrabold",
    xl: "text-3xl font-extrabold",
  };

  return (
    <span className={clsx("tabular-nums tracking-tight", sizes[size], tone, className)}>
      {sign < 0 ? "-" : sign > 0 ? "+" : ""}
      {prefix}
      {amount}
    </span>
  );
}

export function KPI({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-white/10 bg-zinc-900/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]",
        className
      )}
    >
      <p className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function Pill({
  children,
  intent = "neutral",
}: {
  children: React.ReactNode;
  intent?: "good" | "bad" | "neutral";
}) {
  const map = {
    good: "bg-emerald-500/15 text-emerald-200",
    bad: "bg-rose-500/15 text-rose-200",
    neutral: "bg-zinc-500/15 text-zinc-200",
  } as const;
  return (
    <span className={clsx("px-2 py-1 rounded-full text-xs font-semibold", map[intent])}>
      {children}
    </span>
  );
}
