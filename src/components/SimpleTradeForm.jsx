// src/components/SimpleTradeForm.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import dayjs from "dayjs";
import {
  X, Upload, Loader2, Image as ImageIcon, Trash2,
  TrendingUp, Clock, Tag, Smile, ArrowUpRight, ArrowDownRight
} from "lucide-react";

import { useScope } from "../state/scopeStore";
import { uploadTradeImage } from "../utils/tradeService";

/** Tiny helper */
const cx = (...a) => a.filter(Boolean).join(" ");

const EMOTIONS = ["Calm", "Confident", "Focused", "Anxious", "Frustrated"];
const DIRECTIONS = ["Long", "Short"];

export default function SimpleTradeForm({
  existingTrade = null,
  initialDate,
  onSave,  // (payload) OR (id, payload)
  onClose,
}) {
  const isEditing = Boolean(existingTrade?.id);
  const { accountId } = useScope();

  const [form, setForm] = useState(() => ({
    date:        existingTrade?.date || initialDate || dayjs().format("YYYY-MM-DD"),
    time:        existingTrade?.time || dayjs().format("HH:mm"),
    symbol:      (existingTrade?.symbol || "").toString().toUpperCase(),
    direction:   existingTrade?.direction || "Long",
    pnl:         existingTrade?.pnl != null ? String(existingTrade.pnl) : "",
    rr:          existingTrade?.rr != null ? String(existingTrade.rr) : "",
    contracts:   existingTrade?.contracts != null ? String(existingTrade.contracts) : "",
    emotion:     existingTrade?.emotion || "",
    // legacy display only; kept as hidden carry for compatibility
    accountType: existingTrade?.accountType || "",
    image_url:   existingTrade?.image_url || "",
  }));

  const [previewUrl, setPreviewUrl] = useState(existingTrade?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  // Derived
  const isWin = useMemo(() => Number(form.pnl || 0) >= 0, [form.pnl]);

  /* ---------------- handlers ---------------- */
  const setF = (patch) => setForm((f) => ({ ...f, ...patch }));

  const onInput = (e) => {
    const { name, value } = e.target;
    if (name === "symbol") return setF({ [name]: value.toUpperCase() });
    setF({ [name]: value });
  };

  const startUpload = async (input) => {
    setError("");
    setUploading(true);
    try {
      const url = await uploadTradeImage(input, { previousUrl: form.image_url || null });
      if (url) {
        setF({ image_url: url });
        setPreviewUrl(url);
      }
    } catch (e) {
      setError(e?.message || "Image upload failed. Check bucket & policies.");
    } finally {
      setUploading(false);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (file && file.type?.startsWith("image/")) await startUpload(file);
    e.target.value = "";
  };

  const onPaste = useCallback(async (e) => {
    const item = Array.from(e.clipboardData?.items || []).find((i) => i.type && i.type.startsWith("image/"));
    if (item) {
      const file = item.getAsFile();
      if (file) {
        e.preventDefault();
        await startUpload(file);
        return;
      }
    }
    const text = e.clipboardData?.getData("text");
    if (text && (text.startsWith("data:image/") || /^https?:\/\//i.test(text))) {
      e.preventDefault();
      await startUpload(text.trim());
    }
  }, [form.image_url]);

  const onDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type?.startsWith("image/")) await startUpload(file);
  };

  const clearImage = () => {
    setF({ image_url: "" });
    setPreviewUrl("");
  };

  /* ---------------- submit ---------------- */
  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;

    // basic validation
    if (!form.date || !form.time || !form.symbol.trim() || form.pnl === "") {
      setError("Please fill Date, Time, Symbol and P&L.");
      return;
    }

    setSaving(true);
    const payload = {
      date: form.date,
      time: form.time,
      symbol: form.symbol.trim().toUpperCase(),
      direction: form.direction,
      pnl: form.pnl === "" ? null : parseFloat(form.pnl),
      rr: form.rr === "" ? null : parseFloat(form.rr),
      contracts: form.contracts === "" ? null : parseInt(form.contracts, 10),
      emotion: form.emotion || null,
      accountType: form.accountType || null, // legacy
      image_url: form.image_url || null,
      account_id: accountId || null,        // ← attach to current scope
    };

    try {
      if (isEditing) await onSave(existingTrade.id, payload);
      else await onSave(payload);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Failed to save trade.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <form
      onSubmit={submit}
      onPaste={onPaste}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="w-full max-w-xl mx-auto h-full max-h-[92vh] overflow-y-auto hide-scrollbar
                 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90
                 p-6 sm:p-8 text-white shadow-2xl"
    >
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Trade" : "Quick Log Trade"}
          </h3>
          {accountId ? (
            <p className="mt-1 text-[11px] text-emerald-300">
              Saving to your <span className="font-semibold">selected account</span>.
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-zinc-400">
              No account selected — trade will be visible in <span className="font-semibold">All Accounts</span>.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-zinc-300 hover:bg-white/5"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 text-rose-200 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          name="date"
          required
          value={form.date}
          onChange={onInput}
          leftIcon={<Clock className="h-4 w-4 text-zinc-500" />}
        />
        <Input
          label="Time"
          type="time"
          name="time"
          required
          value={form.time}
          onChange={onInput}
          leftIcon={<Clock className="h-4 w-4 text-zinc-500" />}
        />

        <Input
          label="Symbol"
          name="symbol"
          placeholder="e.g. NQ, MNQU"
          required
          value={form.symbol}
          onChange={onInput}
        />

        <Select
          label="Direction"
          name="direction"
          value={form.direction}
          onChange={(e) => setF({ direction: e.target.value })}
          options={DIRECTIONS}
          leftIcon={
            isWin ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> :
            <ArrowDownRight className="h-4 w-4 text-rose-400" />
          }
        />

        <Input
          label="P&L ($)"
          name="pnl"
          type="number"
          step="0.01"
          required
          value={form.pnl}
          onChange={onInput}
          leftIcon={<TrendingUp className="h-4 w-4 text-zinc-500" />}
        />
        <Input
          label="R / R (optional)"
          name="rr"
          type="number"
          step="0.01"
          value={form.rr}
          onChange={onInput}
          leftIcon={<Tag className="h-4 w-4 text-zinc-500" />}
        />

        <Input
          label="Contracts (optional)"
          name="contracts"
          type="number"
          value={form.contracts}
          onChange={onInput}
        />
        <Select
          label="Emotion (optional)"
          name="emotion"
          value={form.emotion}
          onChange={(e) => setF({ emotion: e.target.value })}
          options={EMOTIONS}
          placeholder="Select…"
          leftIcon={<Smile className="h-4 w-4 text-zinc-500" />}
        />
      </div>

      {/* screenshot rail */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-400">Screenshot</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cx(
                "inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs",
                "bg-white/5 hover:bg-white/10"
              )}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload size={14} />}
              {uploading ? "Uploading…" : (previewUrl ? "Replace" : "Upload")}
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={clearImage}
                className="inline-flex items-center gap-1 rounded-md bg-white/5 hover:bg-white/10 px-2 py-1.5 text-xs text-rose-300"
                title="Remove screenshot"
              >
                <Trash2 size={14} /> Remove
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              className="hidden"
            />
          </div>
        </div>

        <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2 grid place-items-center h-[260px]">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Trade screenshot"
              className="max-h-[236px] w-auto object-contain rounded-md"
            />
          ) : (
            <div className="text-center text-zinc-500 text-sm px-4">
              <div className="mx-auto mb-2 h-10 w-10 grid place-items-center rounded-full bg-white/5">
                <ImageIcon className="h-5 w-5" />
              </div>
              Drop / Paste / Upload an image
            </div>
          )}
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">
          Tip: Paste (Ctrl/Cmd+V), drag & drop, or upload. Replacing overwrites your old image.
        </p>
      </div>

      {/* actions */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-zinc-700 px-4 py-2 text-white hover:bg-zinc-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2 font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "+ Log Trade"}
        </button>
      </div>
    </form>
  );
}

/* ---------------- controls ---------------- */

function Input({ label, leftIcon, className = "", ...props }) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="relative mt-1">
        {leftIcon && (
          <span className="absolute left-2 inset-y-0 flex items-center pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          {...props}
          className={cx(
            "w-full rounded-lg border border-white/10 bg-zinc-800/90 text-sm text-white",
            "px-3 py-2",
            leftIcon && "pl-8",
            className
          )}
        />
      </div>
    </label>
  );
}

function Select({ label, options = [], placeholder, leftIcon, className = "", ...props }) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="relative mt-1">
        {leftIcon && (
          <span className="absolute left-2 inset-y-0 flex items-center pointer-events-none">
            {leftIcon}
          </span>
        )}
        <select
          {...props}
          className={cx(
            "w-full rounded-lg border border-white/10 bg-zinc-800/90 text-sm text-white",
            "px-3 py-2 appearance-none",
            leftIcon && "pl-8",
            className
          )}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 inset-y-0 flex items-center text-zinc-500">▾</span>
      </div>
    </label>
  );
}
