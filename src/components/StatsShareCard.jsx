// src/components/StatsShareCard.jsx
import React, { useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, Trophy, Activity, Award, Star, Zap } from "lucide-react";

/**
 * StatsShareCard — STFX-style neon export card (story/square).
 * Use in hidden export targets with html-to-image.
 *
 * Props:
 * - variant: "story" | "square"
 * - user?: { name: string, role?: string, avatarUrl?: string }
 * - tags?: Array<{ label: string, tone?: "emerald"|"blue"|"yellow"|"slate" }>
 * - pnl?: { value: number, pct?: number }
 * - stats?: { winRate?: number|string, avgRR?: number|string, best?: number }   // safe defaults below
 * - extra?: { entry?: string|number, exit?: string|number, fee?: string|number }
 * - qr?: { image?: string, caption?: string }  // dataURL or http(s) image; optional
 */
export default function StatsShareCard({
  variant = "story",
  user = { name: "Trader", role: "Manager", avatarUrl: "" },
  tags = [
    { label: "LONG", tone: "emerald" },
    { label: "NQ", tone: "blue" },
    { label: "10x", tone: "yellow" },
  ],
  pnl = { value: 0, pct: undefined },
  stats = { winRate: 0, avgRR: 0, best: 0 }, // <-- prevents "stats is not defined"
  extra = { entry: "—", exit: "—", fee: "$0.00" },
  qr = { image: "", caption: "" },
}) {
  const W = variant === "story" ? 1080 : 1200;
  const H = variant === "story" ? 1920 : 1200;

  const positive = Number(pnl?.value || 0) >= 0;
  const accent = positive ? "#22c55e" : "#f43f5e";
  const safeWin = typeof stats.winRate === "string" ? stats.winRate : `${Number(stats.winRate || 0).toFixed(1)}%`;
  const safeRR = String(stats.avgRR ?? 0);
  const safeBest = formatMoneyFull(Number(stats.best || 0));

  const valueStr = useMemo(
    () => formatMoneyFull(Number(pnl?.value || 0)),
    [pnl?.value]
  );

  return (
    <div
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        borderRadius: 44,
        background: "#0a0d12",
        fontFamily:
          "Inter, ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      }}
    >
      {/* BACKDROP — brand gradient + vignette + noise */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(1400px 520px at 10% -10%, rgba(16,185,129,0.18), transparent 60%),
            radial-gradient(1200px 520px at 110% -10%, rgba(34,211,238,0.16), transparent 60%),
            #0a0d12
          `,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 120% at 50% 40%, transparent 60%, rgba(0,0,0,0.55))",
          mixBlendMode: "multiply",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><filter id=%22n%22 x=%220%22 y=%220%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.35%22/></svg>')",
        }}
      />

      {/* HERO MOTIF — angular neon “pipeline” arrows */}
      <NeonMotif colorA="#10b981" colorB="#06b6d4" />

      {/* CARD FRAME (glassy) */}
      <div
        style={{
          position: "absolute",
          left: variant === "story" ? 64 : 72,
          right: variant === "story" ? 64 : 72,
          top: variant === "story" ? 120 : 80,
          bottom: variant === "story" ? 120 : 80,
          borderRadius: 28,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 50px 120px -50px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* TOP ROW — brand, user, tags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "28px 28px 14px 28px",
          }}
        >
          <div
            style={{
              height: 34,
              width: 34,
              borderRadius: 10,
              background:
                "linear-gradient(135deg, #00ffa3 0%, #06b6d4 100%)",
              boxShadow: "0 6px 16px rgba(6,182,212,0.35)",
            }}
            title="ZTrader"
          />
          <span
            style={{
              color: "#e9fbf5",
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: 0.4,
            }}
          >
            ZTRADER
          </span>

          <div style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar src={user?.avatarUrl} />
            <span style={{ color: "#e5f2ef", fontWeight: 700 }}>{user?.name}</span>
            {user?.role ? <Pill tone="yellow">{user.role}</Pill> : null}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {tags?.map((t, i) => (
              <Pill key={i} tone={t.tone || "slate"}>
                {t.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* PNL STRIP */}
        <div
          style={{
            margin: "12px 24px 0 24px",
            borderRadius: 18,
            background: "rgba(10,13,18,0.8)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: `0 28px 100px -50px ${hexA(accent, 0.45)}`,
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                height: 34,
                width: 34,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                background: hexA(accent, 0.14),
                border: `1px solid ${hexA(accent, 0.35)}`,
                color: accent,
              }}
              title="Net P&L"
            >
              {positive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            </span>

            <span
              style={{
                color: "#97ffe0",
                opacity: 0.9,
                fontSize: 14,
                letterSpacing: 1,
              }}
            >
              My Vault PnL
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              marginTop: 8,
            }}
          >
            <span
              style={{
                color: positive ? "#caffea" : "#ffe5ea",
                fontSize: variant === "story" ? 88 : 74,
                fontWeight: 900,
                letterSpacing: -0.8,
                textShadow: "0 2px 0 rgba(0,0,0,0.35)",
              }}
            >
              {valueStr}
            </span>
            {typeof pnl?.pct === "number" && (
              <span
                style={{
                  color: positive ? "#7bf6c7" : "#ff98a8",
                  fontWeight: 800,
                  fontSize: 28,
                }}
              >
                {positive ? "+" : ""}
                {pnl.pct.toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* LOWER GRID — 3 compact stats + QR block */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              variant === "story" ? "1.1fr 1.1fr 1.1fr 0.9fr" : "1fr 1fr 1fr 1fr",
            gap: 18,
            padding: "20px 24px 24px 24px",
            alignItems: "stretch",
          }}
        >
          <SmallStat label="Win Rate" value={safeWin} icon={Trophy} ring="#60a5fa" />
          <SmallStat label="Avg R/R" value={safeRR} icon={Activity} ring="#f59e0b" />
          <SmallStat label="Best Trade" value={safeBest} icon={Award} ring="#c084fc" />

          <QRBlock qr={qr} />
        </div>

        {/* FOOT ROW — entry/exit/fee */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            padding: "0 24px 22px 24px",
          }}
        >
          <KeyVal label="Entry Price" value={extra?.entry ?? "—"} />
          <KeyVal label="Exit Price" value={extra?.exit ?? "—"} />
          <KeyVal label="Manager Fee" value={extra?.fee ?? "—"} emphasis />
        </div>
      </div>

      {/* Rim */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 0 1px rgba(6,182,212,0.06)",
        }}
      />
    </div>
  );
}

/* ---------- Visual bits ---------- */

function NeonMotif({ colorA, colorB }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* main arrow streak */}
      <div
        style={{
          position: "absolute",
          right: "-12%",
          top: "6%",
          width: "68%",
          height: "68%",
          transform: "skewX(-8deg) rotate(6deg)",
          background:
            `linear-gradient(135deg, ${hexA(colorA, 0.22)} 0%, ${hexA(
              colorB,
              0.20
            )} 45%, transparent 70%)`,
          filter: "blur(8px)",
          borderRadius: 32,
        }}
      />
      {/* arrow chevrons */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            right: `${8 + i * 7}%`,
            top: `${18 + i * 8}%`,
            width: "22%",
            height: "8%",
            borderRadius: 12,
            transform: "skewX(-8deg) rotate(6deg)",
            boxShadow: `0 0 0 2px ${hexA(colorA, 0.25)} inset, 0 10px 30px ${hexA(
              colorA,
              0.25
            )}`,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
          }}
        />
      ))}
      {/* small particles */}
      {[...Array(18)].map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${(i * 37) % 100}%`,
            top: `${(i * 19) % 100}%`,
            width: 3,
            height: 3,
            borderRadius: 999,
            background: i % 2 ? hexA(colorA, 0.9) : hexA(colorB, 0.9),
            opacity: 0.4,
            filter: "blur(0.2px)",
          }}
        />
      ))}
    </div>
  );
}

function Pill({ children, tone = "slate" }) {
  const map = {
    emerald: { bg: "rgba(16,185,129,0.14)", br: "rgba(16,185,129,0.4)", fg: "#22c55e" },
    blue: { bg: "rgba(59,130,246,0.14)", br: "rgba(59,130,246,0.4)", fg: "#60a5fa" },
    yellow: { bg: "rgba(245,158,11,0.16)", br: "rgba(245,158,11,0.45)", fg: "#f59e0b" },
    slate: { bg: "rgba(148,163,184,0.14)", br: "rgba(148,163,184,0.35)", fg: "#cbd5e1" },
  }[tone];
  return (
    <span
      style={{
        fontSize: 12,
        padding: "6px 10px",
        borderRadius: 10,
        color: map.fg,
        background: map.bg,
        border: `1px solid ${map.br}`,
        fontWeight: 700,
        letterSpacing: 0.2,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {tone === "yellow" ? <Star size={12} /> : tone === "emerald" ? <Zap size={12} /> : null}
      {children}
    </span>
  );
}

function Avatar({ src }) {
  return (
    <div
      style={{
        height: 28,
        width: 28,
        borderRadius: 999,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "linear-gradient(180deg,#0b0f15,#111827)",
      }}
    >
      {src ? (
        <img src={src} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : null}
    </div>
  );
}

function SmallStat({ label, value, icon: Icon, ring }) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: "rgba(10,13,18,0.78)",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 18px",
        boxShadow: `0 22px 70px -40px ${hexA(ring, 0.35)}`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "rgba(226,232,240,0.82)", fontSize: 12, letterSpacing: 1 }}>
          {label.toUpperCase()}
        </span>
        <div
          style={{
            height: 28,
            width: 28,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            background: hexA(ring, 0.14),
            border: `1px solid ${hexA(ring, 0.35)}`,
            color: ring,
          }}
        >
          <Icon size={14} />
        </div>
      </div>
      <div
        style={{
          color: "#f2f6fb",
          fontSize: 42,
          fontWeight: 900,
          letterSpacing: -0.4,
          lineHeight: 1.08,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function QRBlock({ qr }) {
  const has = !!qr?.image;
  return (
    <div
      style={{
        borderRadius: 16,
        background: "rgba(10,13,18,0.78)",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {has ? (
        <img
          src={qr.image}
          alt="qr"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: 12,
            background: "#fff",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 12,
            background: "#fff",
            display: "grid",
            placeItems: "center",
            color: "#111",
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          QR
        </div>
      )}
      {qr?.caption ? (
        <span
          style={{
            position: "absolute",
            bottom: -26,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "rgba(226,232,240,0.72)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {qr.caption}
        </span>
      ) : null}
    </div>
  );
}

function KeyVal({ label, value, emphasis = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span style={{ color: "rgba(226,232,240,0.7)", fontSize: 12, letterSpacing: 0.6 }}>
        {label}
      </span>
      <span
        style={{
          color: emphasis ? "#7bf6c7" : "#e9eef7",
          fontWeight: 800,
          letterSpacing: 0.2,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ---------- utils ---------- */
function hexA(hex, alpha = 1) {
  const h = (hex || "").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function signed(n) { return n < 0 ? "-" : "+"; }
function absNum(n) { return Math.abs(Number(n) || 0); }
function formatMoneyFull(n = 0) {
  return `${signed(n)}$${absNum(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
