// src/components/TradeDetail.jsx
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { X, Maximize2, Download } from "lucide-react";
import { ensureSignedImageUrl, storagePathFromUrl } from "../utils/tradeService";

/* Humanize duration */
function humanDuration(d) {
  if (!d) return "—";
  if (/[hms]/i.test(d)) return d.replace(/\s+/g, "").replace(/h/gi,"h ").replace(/m/gi,"m ").replace(/s/gi,"s ").trim();
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

/* ---------- Self-healing screenshot ---------- */
const TradeScreenshot = ({ path, alt, full }) => {
  const [url, setUrl] = useState("");
  const [triedRefresh, setTriedRefresh] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!path) { if (alive) setUrl(""); return; }
        const fresh = await ensureSignedImageUrl(path);
        if (alive) { setUrl(fresh); setTriedRefresh(false); }
      } catch {
        if (alive) setUrl("");
      }
    })();
    return () => { alive = false; };
  }, [path]);

  const onError = async () => {
    if (triedRefresh || !path) return;
    setTriedRefresh(true);
    try {
      // If it's a Supabase signed URL, convert to storage path for a clean re-sign.
      const maybePath =
        storagePathFromUrl(path) ||
        (typeof path === "string" && path.startsWith("/") ? path.slice(1) : null);
      const fresh = await ensureSignedImageUrl(maybePath || path);
      if (fresh) setUrl(fresh);
    } catch {
      // keep as-is; avoid loops
    }
  };

  if (!path) return <p className="text-zinc-500 text-sm">No screenshot attached</p>;
  if (!url) return <div className="h-[480px] w-full bg-white/5 animate-pulse rounded-lg" />;

  return (
    <img
      src={url}
      alt={alt}
      onError={onError}
      className={full ? "max-w-full max-h-[90vh] rounded-xl" : "max-h-[460px] w-auto object-contain"}
    />
  );
};

export default function TradeDetail({ trade, onClose, onEdit }) {
  const [lightbox, setLightbox] = useState(false);

  const isWin = Number(trade?.pnl || 0) >= 0;
  const tags = Array.isArray(trade?.tags)
    ? trade.tags
    : typeof trade?.tags === "string"
    ? trade.tags.split(",").map((t) => t.trim())
    : [];

  const screenshotPath =
    trade?.image_url ||
    trade?.screenshot_url ||
    trade?.screenshotUrl ||
    trade?.screenshot ||
    "";

  const Chip = ({ label, value, accent }) => (
    <div className="min-w-[140px] rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`text-lg font-semibold truncate ${accent || ""}`}>{value}</p>
    </div>
  );

  return (
    <>
      <div className="w-full rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-8 text-white">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{trade?.symbol}</h3>
            <p className="text-sm text-zinc-400 mt-1">
              {trade?.date ? dayjs(trade.date).format("DD MMM YYYY") : "—"} · {trade?.time || "—"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                onClick={onEdit}
                className="rounded-full bg-yellow-400/90 px-4 py-1.5 text-sm font-semibold text-black hover:bg-yellow-300"
              >
                Edit
              </button>
            )}
            <button onClick={onClose} className="rounded-full p-2 text-zinc-300 hover:bg-white/5" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* chips */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Chip
            label="Net P&L"
            value={`${isWin ? "+" : "-"}$${Math.abs(Number(trade?.pnl || 0)).toFixed(2)}`}
            accent={isWin ? "text-emerald-400" : "text-rose-400"}
          />
          <Chip label="R/R" value={trade?.rr ?? "—"} />
          <Chip label="Duration" value={humanDuration(trade?.duration)} />
          <Chip label="Size" value={trade?.size ?? "—"} />
          <Chip label="Account" value={trade?.accountType || "—"} />
          <Chip label="Session" value={trade?.details?.session || "—"} />
        </div>

        {/* body */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          {/* image */}
          <div className="col-span-12 lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs text-zinc-400">Trade Screenshot</p>
                {screenshotPath && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLightbox(true)}
                      className="rounded-md bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Maximize2 size={14} /> View
                      </span>
                    </button>
                    <button
                      onClick={async () => {
                        if (!screenshotPath) return;
                        try {
                          // Always fetch a fresh signed URL before download
                          const fresh = await ensureSignedImageUrl(screenshotPath);
                          const a = document.createElement("a");
                          a.href = fresh;
                          a.download = `${trade?.symbol || "trade"}-screenshot.png`;
                          a.click();
                        } catch (err) {
                          console.error("Download failed:", err);
                        }
                      }}
                      className="rounded-md bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Download size={14} /> Download
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                <div className="h-[480px] w-full overflow-hidden rounded-lg grid place-items-center">
                  <TradeScreenshot path={screenshotPath} alt="Trade screenshot" />
                </div>
              </div>
            </div>
          </div>

          {/* right */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {/* tags */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <p className="text-xs text-zinc-400 mb-2">Strategy Tags</p>
              {tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t, i) => (
                    <span
                      key={`${t}-${i}`}
                      className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No tags</p>
              )}
            </div>

            {/* direction & fees */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <p className="text-xs text-zinc-400 mb-2">Direction & Fees</p>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <dt className="text-zinc-400">Direction</dt>
                  <dd className="font-semibold truncate">{trade?.direction || "—"}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-zinc-400">Fees</dt>
                  <dd className="font-semibold truncate">{trade?.fees != null ? `$${trade.fees}` : "—"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* notes / setup */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel title="Notes">
            {trade?.details?.notes ? (
              <p className="whitespace-pre-wrap leading-relaxed text-sm text-zinc-200">
                {trade.details.notes}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">No notes</p>
            )}
          </Panel>

          <Panel title="Setup">
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <p className="text-xs text-zinc-400 mb-2">Entry Criteria</p>
                <p className="text-zinc-200 whitespace-pre-wrap">{trade?.setup?.entryCriteria || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-2">Confluences</p>
                <p className="text-zinc-200 whitespace-pre-wrap">{trade?.setup?.confluences || "—"}</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* lightbox */}
      {lightbox && screenshotPath && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 grid place-items-center p-4"
          onClick={() => setLightbox(false)}
        >
          <TradeScreenshot path={screenshotPath} alt="Trade screenshot large" full />
          <button
            className="absolute top-6 right-6 rounded-full p-2 bg-white/10 hover:bg-white/20"
            onClick={() => setLightbox(false)}
            aria-label="Close"
          >
            <X />
          </button>
        </div>
      )}
    </>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      <p className="text-xs text-zinc-400 mb-2">{title}</p>
      <div>{children}</div>
    </div>
  );
}
