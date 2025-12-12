// src/components/SubTabsBar.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Calendar, BarChart3, ClipboardList, Layers, Banknote, Star } from "lucide-react";

const ACCENT = "#0ef4c8";

const tabIcon = {
  Performance: BarChart3,
  Calendar: Calendar,
  Review: ClipboardList,
  Financials: Banknote,
  Manage: Layers,
  Featured: Star,
};

export default function SubTabsBar({
  tabs = ["Performance", "Calendar", "Review", "Financials"],
  active = "Performance",
  onChange,
  className = "",
}) {
  const ref = useRef(null);

  // Keyboard navigation
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e) => {
      const items = Array.from(el.querySelectorAll("[data-tab]"));
      if (!items.length) return;
      const idx = items.findIndex((n) => n.getAttribute("data-tab") === active);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = items[(idx + 1) % items.length].getAttribute("data-tab");
        onChange?.(next);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev =
          items[(idx - 1 + items.length) % items.length].getAttribute("data-tab");
        onChange?.(prev);
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [active, onChange]);

  return (
    <div
      ref={ref}
      tabIndex={0}
      className={[
        "relative w-full rounded-2xl border shadow-lg px-2 py-2 flex flex-wrap gap-2",
        "focus:outline-none",
        className,
      ].join(" ")}
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(8px)",
      }}
      aria-label="Dashboard subtabs"
    >
      {/* Glow strip */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(14,244,200,0.08)",
        }}
      />

      <div className="relative flex flex-wrap gap-2 w-full">
        {tabs.map((t) => {
          const Icon = tabIcon[t] || Star;
          const isActive = t === active;
          return (
            <button
              key={t}
              data-tab={t}
              onClick={() => onChange?.(t)}
              className={[
                "relative overflow-hidden group",
                "rounded-full border px-3.5 sm:px-4 py-2 sm:py-2.5",
                "text-[13px] sm:text-sm font-semibold transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40",
                isActive
                  ? "text-[#0b1211]"
                  : "text-zinc-300 hover:text-zinc-100 hover:border-white/15",
              ].join(" ")}
              style={{
                borderColor: isActive ? "rgba(14,244,200,0.55)" : "rgba(255,255,255,0.08)",
                background: isActive
                  ? "linear-gradient(135deg, rgba(14,244,200,0.95) 0%, rgba(14,244,200,0.65) 100%)"
                  : "rgba(255,255,255,0.03)",
                boxShadow: isActive
                  ? "0 10px 28px rgba(14,244,200,0.28)"
                  : "0 2px 10px rgba(0,0,0,0.25)",
              }}
            >
              {/* Soft hover sheen */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0))" }} />
              <span className="relative inline-flex items-center gap-2">
                <Icon size={16} className={isActive ? "opacity-90" : "opacity-70"} />
                {t}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active underline (floating) */}
      <motion.div
        layout
        className="absolute left-2 right-2 bottom-0 h-[2px] rounded-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(14,244,200,0) 0%, rgba(14,244,200,0.6) 50%, rgba(14,244,200,0) 100%)",
        }}
      />
    </div>
  );
}
