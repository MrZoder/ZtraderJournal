// src/components/TradeCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Pencil, Trash2, Eye } from "lucide-react";
import dayjs from "dayjs";
import { ensureSignedImageUrl, storagePathFromUrl } from "../utils/tradeService";

/* -------- utils -------- */
function humanDuration(d) {
  if (!d) return "—";
  if (/[hms]/i.test(d)) {
    return d.replace(/\s+/g, "").replace(/h/gi, "h ").replace(/m/gi, "m ").replace(/s/gi, "s ").trim();
  }
  const parts = String(d).split(":").map((n) => parseInt(n, 10) || 0);
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) [h, m, s] = parts;
  else if (parts.length === 2) [m, s] = parts;
  else if (parts.length === 1) [s] = parts;
  const out = [];
  if (h) out.push(`${h}h`);
  if (m) out.push(`${m}m`);
  if (s && !h && !m) out.push(`${s}s`);
  return out.length ? out.join(" ") : "0s";
}

/* -------- component -------- */
export default function TradeCard({ trade, onView, onEdit, onDelete }) {
  const [bgUrl, setBgUrl] = React.useState(null);
  const [triedRefresh, setTriedRefresh] = React.useState(false);

  const pnlNum = parseFloat(trade?.pnl ?? 0);
  const isWin = pnlNum >= 0;

  const symbol = (trade?.symbol || "").toString().toUpperCase();
  const notes = trade?.details?.notes ?? trade?.notes ?? "";
  const rr = trade?.rr ?? "—";
  const size = trade?.size ?? "—";
  const duration = humanDuration(trade?.duration);

  const screenshotPath =
    trade?.image_url ||
    trade?.screenshot_url ||
    trade?.screenshotUrl ||
    trade?.screenshot ||
    null;

  // Sign the screenshot when present; if it's a normal URL, ensureSignedImageUrl returns it as-is
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!screenshotPath) { setBgUrl(null); return; }
        const fresh = await ensureSignedImageUrl(screenshotPath);
        if (alive) { setBgUrl(fresh); setTriedRefresh(false); }
      } catch {
        if (alive) setBgUrl(null);
      }
    })();
    return () => { alive = false; };
  }, [screenshotPath]);

  // If the background image errors (likely an expired signed URL), re-sign once
  const handleImgError = async () => {
    if (triedRefresh || !screenshotPath) return;
    setTriedRefresh(true);
    try {
      // try to extract a storage path; if not a supabase URL, no-op
      const maybePath =
        storagePathFromUrl(screenshotPath) ||
        (typeof screenshotPath === "string" && screenshotPath.startsWith("/") ? screenshotPath.slice(1) : null);
      if (!maybePath) return;
      const fresh = await ensureSignedImageUrl(maybePath);
      if (fresh) setBgUrl(fresh);
    } catch {
      // keep as-is; avoids infinite loops
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/70 to-zinc-950 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
    >
      {/* Subtle screenshot background (auto-refreshes if expired) */}
      {bgUrl && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
          <img
            src={bgUrl}
            alt=""
            onError={handleImgError}
            className="h-full w-full object-cover opacity-20 blur-[1px] transition-opacity duration-200 group-hover:opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
        </div>
      )}

      {/* hover glow */}
      <div
        className={`pointer-events-none absolute -inset-1 rounded-2xl opacity-0 transition group-hover:opacity-100 blur-2xl ${
          isWin ? "bg-emerald-500/10" : "bg-rose-500/10"
        }`}
      />

      {/* Foreground content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg sm:text-xl font-bold tracking-tight break-words">{symbol}</p>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                  isWin ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
                }`}
              >
                {isWin ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                ${Math.abs(pnlNum).toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {trade?.date ? dayjs(trade.date).format("DD MMM YYYY") : "—"} · {trade?.time || "—"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
            <button
              onClick={onView}
              className="rounded-lg bg-white/5 p-1.5 text-zinc-200 hover:bg-white/10"
              title="View"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={onEdit}
              className="rounded-lg bg-white/5 p-1.5 text-yellow-200 hover:bg-white/10"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg bg-white/5 p-1.5 text-rose-300 hover:bg-white/10"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          {[
            { label: "R / R", value: rr },
            { label: "Duration", value: duration },
            { label: "Size", value: size },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-900/70 backdrop-blur-[1px] p-3 text-center"
            >
              <p className="text-[11px] uppercase tracking-wide text-zinc-300">{item.label}</p>
              <p className="mt-1 font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Notes */}
        {!!notes && <p className="mt-3 line-clamp-2 text-xs text-zinc-200/90">{notes}</p>}
      </div>
    </motion.div>
  );
}
