// src/components/MotivationalQuoteCard.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Quote, Copy, Shuffle, Lock, Unlock } from "lucide-react";

/**
 * MotivationalQuoteCard — P&L-aware aurora card with lock + heartbeat underline
 *
 * Props:
 * - quotes?: Array<string | { text: string, author?: string }>
 * - mood?: "win" | "loss" | "neutral"
 * - intensity?: number          // 0..1 scales animation energy
 * - focusText?: string
 * - variant?: "slim" | "card"
 * - autoRotateMs?: number       // default 10s (0 disables)
 * - daily?: boolean             // daily-stable index (disables auto-rotate)
 * - accent?: string             // fallback accent
 */
export default function MotivationalQuoteCard({
  quotes,
  mood = "neutral",
  intensity = 0.6,
  focusText,
  variant = "slim",
  autoRotateMs = 10000,
  daily = false,
  accent = "#00FFA3",
}) {
  // palettes per mood
  const PALETTE = {
    win:     { glow: "#22c55e", glow2: "#10b981", ring: "#34d399", text: "#d1fae5" },
    loss:    { glow: "#f43f5e", glow2: "#fb7185", ring: "#fb7185", text: "#ffe4e6" },
    neutral: { glow: "#38bdf8", glow2: "#818cf8", ring: "#67e8f9", text: "#e2e8f0" },
  };
  const scheme = PALETTE[mood] || { glow: accent, glow2: accent, ring: accent, text: "#e5e7eb" };

  // Base quotes + mood overlays
  const DEFAULTS = [
    { text: "Process > P&L. Control the controllables." },
    { text: "Stay focused on execution, not outcome." },
    { text: "Only trade A+ setups." },
    { text: "Discipline compounds. Show up." },
    { text: "Risk small. Survive long." },
    { text: "Plan the trade, trade the plan." },
  ];
  const LOSS_SET = [
    { text: "Losses are tuition—keep the size small, lessons big." },
    { text: "Revenge is not a setup. Breathe, reset, refocus." },
    { text: "Protect the account. Opportunities are infinite." },
  ];
  const WIN_SET = [
    { text: "Green is rented—discipline pays the mortgage." },
    { text: "Bank the edge, not the hype." },
  ];

  const base = useMemo(() => {
    const raw = Array.isArray(quotes) && quotes.length ? quotes : DEFAULTS;
    const normalized = raw.map((q) => (typeof q === "string" ? { text: q } : q));
    const add = mood === "loss" ? LOSS_SET : mood === "win" ? WIN_SET : [];
    return [...add, ...normalized];
  }, [quotes, mood]);

  const clampIndex = (i) => (base.length ? ((i % base.length) + base.length) % base.length : 0);

  // stable daily index
  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyIndex = useMemo(() => {
    if (!daily) return 0;
    let sum = 0;
    for (let c of todayKey) sum += c.charCodeAt(0);
    return clampIndex(sum);
  }, [daily, todayKey]);

  const [index, setIndex] = useState(dailyIndex);
  useEffect(() => setIndex(dailyIndex), [dailyIndex]);

  // lock logic — tap quote to lock/unlock (mobile friendly).
  const [locked, setLocked] = useState(false);
  const toggleLock = () => setLocked((v) => !v);

  // auto rotate — pauses when locked or daily mode
  useEffect(() => {
    if (daily || !autoRotateMs || locked) return;
    const id = setInterval(() => setIndex((i) => clampIndex(i + 1)), autoRotateMs);
    return () => clearInterval(id);
  }, [autoRotateMs, daily, locked, base.length]);

  const q = base[clampIndex(index)] || { text: "" };

  const copyQuote = async () => {
    try {
      await navigator.clipboard.writeText(
        q.author ? `“${q.text}” — ${q.author}` : `“${q.text}”`
      );
    } catch {}
  };

  const isSlim = variant === "slim";

  // subtle motion scalars
  const breathe = 0.8 + intensity * 0.4; // 0.8..1.2
  const floatAmp = 6 + intensity * 10;   // px

  const showBurst = mood === "win" && intensity > 0.7;

  // tap/press accessibility (mobile-friendly): make quote area a large button
  const quoteBtnRef = useRef(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={[
        "relative w-full overflow-hidden rounded-2xl",
        "border bg-[rgba(14,15,20,0.9)] backdrop-blur",
        "shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)]",
        isSlim ? "px-4 py-3" : "px-6 py-5",
      ].join(" ")}
      style={{
        borderColor: "rgba(63,63,70,0.7)",
      }}
    >
      {/* AURORA / GLOW LAYERS */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            `radial-gradient(1200px 300px at -10% -20%, ${hexWithAlpha(scheme.glow, 0.12)}, transparent),
             radial-gradient(900px 260px at 110% 0%, ${hexWithAlpha(scheme.glow2, 0.10)}, transparent)`,
          mixBlendMode: "screen",
          filter: "blur(22px)",
        }}
        animate={{
          backgroundPosition: [
            "0% 0%, 100% 0%",
            "20% 10%, 80% -10%",
            "0% 0%, 100% 0%",
          ],
        }}
        transition={{ duration: 12 * breathe, repeat: Infinity }}
      />
      {/* Breathing neon ring */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-2xl"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 22px ${hexWithAlpha(scheme.ring, 0.15)}`,
        }}
        animate={{
          boxShadow: [
            `inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 16px ${hexWithAlpha(scheme.ring, 0.10)}`,
            `inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 28px ${hexWithAlpha(scheme.ring, 0.22)}`,
            `inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 16px ${hexWithAlpha(scheme.ring, 0.10)}`,
          ],
        }}
        transition={{ duration: 3.2 * breathe, repeat: Infinity }}
      />

      {/* HEADER ROW: focus + actions + lock status */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4" style={{ color: scheme.ring }} />
          {focusText ? (
            <span
              title={focusText}
              className="truncate max-w-[60%] text-[11px] px-2 py-1 rounded-full border"
              style={{
                borderColor: hexWithAlpha(scheme.ring, 0.33),
                color: scheme.text,
                background: hexWithAlpha(scheme.glow, 0.08),
              }}
            >
              Focus: {focusText}
            </span>
          ) : (
            <span
              className="text-[11px] font-semibold tracking-wide"
              style={{ color: scheme.text }}
            >
              Daily Motivation
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* lock badge small + accessible */}
          <button
            onClick={toggleLock}
            className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800 transition-colors"
            aria-label={locked ? "Unlock quote" : "Lock quote"}
            title={locked ? "Unlock" : "Lock"}
          >
            {locked ? (
              <Lock className="w-4 h-4" style={{ color: scheme.ring }} />
            ) : (
              <Unlock className="w-4 h-4 text-zinc-300" />
            )}
          </button>

          {!daily && base.length > 1 && (
            <button
              onClick={() => !locked && setIndex((i) => clampIndex(i + 1))}
              className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800 transition-colors disabled:opacity-40"
              title={locked ? "Unlock to shuffle" : "Next"}
              aria-label="Next quote"
              disabled={locked}
            >
              <Shuffle className="w-4 h-4 text-zinc-300" />
            </button>
          )}
          <button
            onClick={copyQuote}
            className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800 transition-colors"
            title="Copy"
            aria-label="Copy quote"
          >
            <Copy className="w-4 h-4 text-zinc-300" />
          </button>
        </div>
      </div>

      {/* QUOTE (tap area locks/unlocks) */}
      <div className="relative z-10 mt-2">
        <button
          ref={quoteBtnRef}
          onClick={toggleLock}
          className="w-full focus:outline-none"
          title={locked ? "Tap to unlock" : "Tap to lock"}
          aria-label={locked ? "Unlock quote" : "Lock quote"}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <div className="flex items-start justify-center gap-2 px-1">
            <Quote className="w-4 h-4 mt-[2px] text-zinc-500 shrink-0" />
            <AnimatePresence mode="wait">
              <motion.p
                key={q.text}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28 }}
                className={[
                  isSlim ? "text-[0.96rem]" : "text-[1.02rem]",
                  "font-medium leading-snug text-center max-w-[92%]",
                ].join(" ")}
                style={{
                  color: scheme.text,
                  display: "-webkit-box",
                  WebkitLineClamp: isSlim ? 2 : 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textShadow: "0 1px 0 rgba(0,0,0,0.45)",
                }}
                title={q.text}
              >
                “{q.text}”
                {q.author ? (
                  <span className="text-zinc-400"> — {q.author}</span>
                ) : null}
              </motion.p>
            </AnimatePresence>
          </div>
        </button>

        {/* UNDERLINE area */}
        <div className="relative mx-auto mt-3 h-[3px] w-[64%] rounded-full overflow-hidden">
          {mood === "loss" ? (
            // HEARTBEAT UNDERLINE (loss days): pulse beats scale with intensity
            <HeartbeatUnderline color={scheme.ring} intensity={intensity} />
          ) : (
            // RUNNER UNDERLINE (win/neutral): silky seamless loop
            <RunnerUnderline glow={scheme.glow} ring={scheme.ring} intensity={intensity} />
          )}
        </div>
      </div>

      {/* FLOATING PARTICLES (subtle) */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-[3px] h-[3px] rounded-full"
            style={{
              background: scheme.ring,
              top: `${10 + (i * 11) % 80}%`,
              left: `${(i * 17) % 90}%`,
              opacity: 0.35,
              filter: "blur(0.2px)",
            }}
            animate={{
              y: [0, -floatAmp, 0],
              x: [0, (i % 2 === 0 ? 1 : -1) * (floatAmp * 0.4), 0],
            }}
            transition={{
              duration: 5 + (i % 5),
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* WIN BURST */}
      <AnimatePresence>
        {showBurst && (
          <motion.div
            key="burst"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
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

/* ---------------- Underline Variants ---------------- */

function RunnerUnderline({ glow, ring, intensity }) {
  return (
    <>
      {/* base glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${hexWithAlpha(glow, 0.7)}, transparent)`,
          filter: "blur(0.3px)",
          opacity: 0.9,
        }}
      />
      {/* animated runner (seamless linear loop) */}
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
  // Heartbeat tempo ~ 66–105 bpm depending on intensity
  const bpm = 66 + Math.round(intensity * 39);
  const beatDuration = 60 / bpm; // seconds per beat

  return (
    <div className="absolute inset-0">
      {/* baseline */}
      <div
        className="absolute inset-0"
        style={{
          background: hexWithAlpha(color, 0.35),
          filter: "blur(0.2px)",
        }}
      />
      {/* heart pulse blob that scales up and fades — seamless repeat */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-[3px] rounded-full"
        style={{
          background: color,
          width: "18%",
          boxShadow: `0 0 10px ${hexWithAlpha(color, 0.35)}`,
        }}
        animate={{
          scaleX: [1, 2.2 + intensity * 0.8, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: beatDuration,
          repeat: Infinity,
          ease: [0.26, 0.01, 0.25, 1], // snappy-in, smooth-out
        }}
      />
      {/* subtle aftershock ripple */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-[3px] rounded-full"
        style={{
          background: hexWithAlpha(color, 0.6),
          width: "10%",
          filter: "blur(0.2px)",
        }}
        animate={{
          scaleX: [1, 2.8 + intensity, 1],
          opacity: [0.5, 0.0, 0.5],
        }}
        transition={{
          duration: beatDuration * 1.2,
          repeat: Infinity,
          ease: "easeOut",
          delay: beatDuration * 0.15,
        }}
      />
    </div>
  );
}

/** util: hex + alpha → rgba */
function hexWithAlpha(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
