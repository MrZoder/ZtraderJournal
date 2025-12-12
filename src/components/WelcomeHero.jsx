// src/components/WelcomeHero.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Sparkles, Lock, Unlock, Shuffle, Copy } from "lucide-react";

/**
 * Compact Welcome Hero (single quote, P&L-reactive)
 *
 * - Shows ONE quote at a time (no scrolling).
 * - "Red day" => serious look: heartbeat underline, red vignette, subtle alarm pulse.
 * - "Green day" => softer glow + tiny confetti burst on higher intensity.
 * - Neutral => cool blue aurora.
 *
 * Props:
 * - name?: string
 * - quotes?: Array<string | { text: string, author?: string }>
 * - mood?: "win" | "loss" | "neutral"
 * - intensity?: number      // 0..1 motion/energy scalar
 * - focusText?: string
 * - daily?: boolean         // daily-stable index
 * - autoRotateMs?: number   // 0 disables
 */
export default function WelcomeHero({
  name = "Trader",
  quotes,
  mood = "neutral",
  intensity = 0.5,
  focusText,
  daily = false,
  autoRotateMs = 9000,
}) {
  const ACCENT = "#0ef4c8";

  // palettes per mood
  const PAL = {
    win:     { glow: "#22c55e", glow2: "#10b981", ring: "#34d399", text: "#e9fff9", vignette: "rgba(34,197,94,0.14)" },
    loss:    { glow: "#f43f5e", glow2: "#fb7185", ring: "#fb7185", text: "#ffeef0", vignette: "rgba(244,63,94,0.18)" },
    neutral: { glow: "#38bdf8", glow2: "#818cf8", ring: "#67e8f9", text: "#e6eef4", vignette: "rgba(56,189,248,0.14)" },
  };
  const scheme = PAL[mood] || PAL.neutral;

  // quote pool
  const DEFAULTS = [
    { text: "Process > P&L. Control the controllables." },
    { text: "Stay focused on execution, not outcome." },
    { text: "Only trade A+ setups." },
    { text: "Discipline compounds. Show up." },
    { text: "Plan the trade, trade the plan." },
    { text: "Risk small. Survive long." },
  ];
  const LOSS_SET = [
    { text: "Revenge is not a setup. Breathe, reset, refocus." },
    { text: "Protect the account. Opportunities are infinite." },
    { text: "Cut the loss. Keep the edge." },
  ];
  const WIN_SET = [
    { text: "Green is rented—discipline pays the mortgage." },
    { text: "Bank the edge, not the hype." },
  ];

  const base = useMemo(() => {
    const raw = Array.isArray(quotes) && quotes.length ? quotes : DEFAULTS;
    const normalized = raw.map((q) => (typeof q === "string" ? { text: q } : q));
    const overlay = mood === "loss" ? LOSS_SET : mood === "win" ? WIN_SET : [];
    return [...overlay, ...normalized];
  }, [quotes, mood]);

  const clampIndex = (i) => (base.length ? ((i % base.length) + base.length) % base.length : 0);

  // daily-stable index
  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyIndex = useMemo(() => {
    if (!daily) return 0;
    let sum = 0;
    for (let c of todayKey) sum += c.charCodeAt(0);
    return clampIndex(sum);
  }, [daily, todayKey, base.length]);

  const [index, setIndex] = useState(dailyIndex);
  useEffect(() => setIndex(dailyIndex), [dailyIndex]);

  const [locked, setLocked] = useState(false);
  const toggleLock = () => setLocked((v) => !v);

  // auto rotate (fade between quotes)
  useEffect(() => {
    if (daily || !autoRotateMs || locked) return;
    const id = setInterval(() => setIndex((i) => clampIndex(i + 1)), autoRotateMs);
    return () => clearInterval(id);
  }, [autoRotateMs, daily, locked, base.length]);

  const q = base[clampIndex(index)] || { text: "" };

  const copyQuote = async () => {
    try {
      await navigator.clipboard.writeText(q.author ? `“${q.text}” — ${q.author}` : `“${q.text}”`);
    } catch {}
  };

  // energy scalars
  const auroraAlpha = 0.05 + intensity * 0.18;          // 0.05..0.23
  const ringBreath = 2.8 - intensity * 1.3;             // faster when intense
  const showWinBurst = mood === "win" && intensity > 0.7;
  const seriousMode = mood === "loss" && intensity >= 0.25; // amp up the "serious" vibe

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="relative w-full rounded-2xl border overflow-hidden"
      style={{
        borderColor: "rgba(255,255,255,0.07)",
        background:
          "radial-gradient(1000px 300px at 15% 0%, rgba(14,244,200,0.08) 0%, rgba(14,244,200,0.02) 40%, rgba(0,0,0,0) 70%), rgba(10,12,14,0.62)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Aurora layers */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            `radial-gradient(900px 240px at -10% -10%, ${hexA(scheme.glow, auroraAlpha)}, transparent),
             radial-gradient(900px 240px at 110% 0%, ${hexA(scheme.glow2, auroraAlpha * 0.9)}, transparent)`,
          mixBlendMode: "screen",
          filter: "blur(16px)",
        }}
        animate={{ backgroundPosition: ["0% 0%, 100% 0%", "12% 10%, 88% -6%", "0% 0%, 100% 0%"] }}
        transition={{ duration: 10 - intensity * 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Serious vignette (loss) */}
      <AnimatePresence>
        {seriousMode && (
          <motion.div
            key="vignette"
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background:
                `radial-gradient(120% 80% at 50% -10%, transparent 0%, transparent 60%, ${scheme.vignette} 100%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 py-4">
        {/* Greeting + compact control group */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h1
              className="text-xl sm:text-2xl font-extrabold tracking-wide truncate"
              style={{ color: scheme.text, textShadow: "0 0 18px rgba(14,244,200,0.22)" }}
            >
              Welcome, <span style={{ color: ACCENT }}>{name}</span>.
            </h1>
            <motion.span
              initial={{ opacity: 0.4, scale: 0.9 }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.06, 0.9] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="h-2 w-2 rounded-full"
              style={{ background: ACCENT, boxShadow: "0 0 12px rgba(14,244,200,0.6)" }}
            />
          </div>

          <div
            className="flex items-center rounded-xl border overflow-hidden"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
          >
            <IconBtn
              title={locked ? "Unlock rotation" : "Lock rotation"}
              onClick={toggleLock}
              active={locked}
              icon={locked ? Lock : Unlock}
              activeColor={scheme.ring}
            />
            {!daily && base.length > 1 && (
              <IconBtn
                title={locked ? "Unlock to shuffle" : "Shuffle"}
                onClick={() => !locked && setIndex((i) => clampIndex(i + 1))}
                disabled={locked}
                icon={Shuffle}
              />
            )}
            <IconBtn title="Copy quote" onClick={copyQuote} icon={Copy} />
          </div>
        </div>

        {/* Focus tag */}
        <div className="mt-2 flex items-center gap-2 text-xs">
          <Sparkles className="w-4 h-4" style={{ color: scheme.ring }} />
          {focusText ? (
            <span
              className="truncate max-w-[65vw] px-2 py-1 rounded-full border"
              style={{
                borderColor: hexA(scheme.ring, 0.33),
                color: scheme.text,
                background: hexA(scheme.glow, 0.08),
              }}
              title={focusText}
            >
              Focus: {focusText}
            </span>
          ) : (
            <span className="text-zinc-300/80">Daily Motivation</span>
          )}
        </div>

        {/* Single quote (fade, with subtle serious shake on loss) */}
        <div className="mt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={q.text}
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: 1,
                y: 0,
                rotate: seriousMode ? [0, -0.15, 0.15, 0] : 0, // micro urgency on loss
              }}
              exit={{ opacity: 0, y: -6 }}
              transition={{
                duration: 0.3,
                rotate: { duration: 0.9 - intensity * 0.4, repeat: seriousMode ? Infinity : 0, ease: "easeInOut" },
              }}
              className="flex items-start justify-center gap-2 px-1"
            >
              <Quote className="w-4 h-4 mt-[2px] text-zinc-500 shrink-0" />
              <p
                className="text-[1.02rem] sm:text-base font-medium leading-snug text-center max-w-[92%]"
                style={{
                  color: scheme.text,
                  textShadow: "0 1px 0 rgba(0,0,0,0.45)",
                }}
                title={q.text}
              >
                “{q.text}”
                {q.author ? <span className="text-zinc-400"> — {q.author}</span> : null}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Underline */}
          <div className="relative mx-auto mt-3 h-[3px] w-[64%] rounded-full overflow-hidden">
            {mood === "loss" ? (
              <HeartbeatUnderline color={scheme.ring} intensity={intensity} />
            ) : (
              <RunnerUnderline glow={scheme.glow} ring={scheme.ring} intensity={intensity} />
            )}
          </div>
        </div>
      </div>

      {/* Breathing border glow */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-2xl"
        style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 20px ${hexA(scheme.ring, 0.16)}` }}
        animate={{
          boxShadow: [
            `inset 0 0 0 1px rgba(255,255,255,0.035), 0 0 14px ${hexA(scheme.ring, 0.10)}`,
            `inset 0 0 0 1px rgba(255,255,255,0.035), 0 0 26px ${hexA(scheme.ring, 0.22)}`,
            `inset 0 0 0 1px rgba(255,255,255,0.035), 0 0 14px ${hexA(scheme.ring, 0.10)}`,
          ],
        }}
        transition={{ duration: ringBreath, repeat: Infinity }}
      />

      {/* Win confetti burst (subtle, only on strong green) */}
      <AnimatePresence>
        {showWinBurst && (
          <motion.div
            key="burst"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {[...Array(10)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute w-[4px] h-[4px] rounded-full"
                style={{ background: scheme.ring, left: "50%", top: "50%" }}
                initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
                animate={{
                  x: (Math.cos((i / 10) * Math.PI * 2) * 80) * (0.7 + intensity),
                  y: (Math.sin((i / 10) * Math.PI * 2) * 60) * (0.7 + intensity),
                  scale: 1.2,
                  opacity: [1, 0.9, 0],
                }}
                transition={{ duration: 0.9 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- underline variants ---------- */

function RunnerUnderline({ glow, ring, intensity }) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${hexA(glow, 0.7)}, transparent)`,
          filter: "blur(0.3px)",
          opacity: 0.9,
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${ring} 10%, ${ring} 30%, transparent 40%)`,
          backgroundSize: "200% 100%",
          maskImage:
            "radial-gradient(10px 6px at 0% 50%, transparent 0, black 70%), linear-gradient(black, black), radial-gradient(10px 6px at 100% 50%, transparent 0, black 70%)",
          WebkitMaskComposite: "destination-in",
          maskComposite: "intersect",
        }}
        animate={{ backgroundPositionX: ["0%", "200%"] }}
        transition={{ duration: Math.max(2.4, 4 - intensity * 2), repeat: Infinity, ease: "linear" }}
      />
    </>
  );
}

function HeartbeatUnderline({ color, intensity }) {
  const bpm = 66 + Math.round(intensity * 39);
  const beatDuration = 60 / bpm;
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" style={{ background: hexA(color, 0.35), filter: "blur(0.2px)" }} />
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-[3px] rounded-full"
        style={{ background: color, width: "18%", boxShadow: `0 0 10px ${hexA(color, 0.35)}` }}
        animate={{ scaleX: [1, 2.2 + intensity * 0.8, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: beatDuration, repeat: Infinity, ease: [0.26, 0.01, 0.25, 1] }}
      />
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-[3px] rounded-full"
        style={{ background: hexA(color, 0.6), width: "10%", filter: "blur(0.2px)" }}
        animate={{ scaleX: [1, 2.8 + intensity, 1], opacity: [0.5, 0.0, 0.5] }}
        transition={{ duration: beatDuration * 1.2, repeat: Infinity, ease: "easeOut", delay: beatDuration * 0.15 }}
      />
    </div>
  );
}

/* ---------- tiny helpers ---------- */

function IconBtn({ title, onClick, icon: Icon, active, activeColor, disabled }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        "px-2.5 py-2 grid place-items-center transition-colors",
        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-white/10",
      ].join(" ")}
      style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      <Icon size={16} className="text-zinc-300" style={active ? { color: activeColor } : undefined} />
    </button>
  );
}

function hexA(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
