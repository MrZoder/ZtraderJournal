// src/components/TradeForm.jsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import dayjs from "dayjs";
import { X, Upload, Loader2, Plus, Tag, Clock, DollarSign, Search, Check } from "lucide-react";
import { uploadTradeImage } from "../utils/tradeService";
import { fetchAccounts } from "../utils/accountsService";

const SESSIONS = ["Asia", "London", "NewYork"];
const ACCOUNT_TYPES = ["Demo", "Funded", "Evaluation", "Personal"]; // legacy write-through only

export default function TradeForm({
  existingTrade = null,
  initialDate,
  onSave,
  onClose,
}) {
  const isEditing = Boolean(existingTrade?.id);

  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(() => ({
    symbol: (existingTrade?.symbol || "").toString().toUpperCase(),
    date: existingTrade?.date || initialDate || dayjs().format("YYYY-MM-DD"),
    time: existingTrade?.time || dayjs().format("HH:mm"),
    direction: existingTrade?.direction || "Long",
    size: existingTrade?.size ?? "",
    entry_price: existingTrade?.entry_price ?? "",
    exit_price: existingTrade?.exit_price ?? "",
    pnl: existingTrade?.pnl ?? "",
    rr: existingTrade?.rr ?? "",
    duration: existingTrade?.duration || "",
    fees: existingTrade?.fees ?? "",
    accountType: existingTrade?.accountType || "", // legacy
    account_id: existingTrade?.account_id || null, // FK
    notes: existingTrade?.details?.notes || "",
    session: existingTrade?.details?.session || "",
    setup: existingTrade?.setup || { entryCriteria: "", confluences: "" },
    tags: Array.isArray(existingTrade?.tags)
      ? existingTrade.tags
      : (existingTrade?.tags || "")
          .toString()
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
    image_url:
      existingTrade?.image_url ||
      existingTrade?.screenshot_url ||
      existingTrade?.screenshotUrl ||
      existingTrade?.screenshot ||
      "",
  }));

  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef(null);

  // Load accounts + try auto-map legacy selection
  useEffect(() => {
    (async () => {
      try {
        const accs = await fetchAccounts();
        accs.sort((a, b) => Number(b.is_real) - Number(a.is_real) || String(a.name).localeCompare(String(b.name)));
        setAccounts(accs);

        if (!form.account_id && form.accountType) {
          const match = accs.find(
            (a) =>
              a.name === `${form.accountType} (legacy)` ||
              a.account_type === form.accountType
          );
          if (match) setForm((f) => ({ ...f, account_id: match.id }));
        }
      } catch {/* ignore */}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payload = useMemo(() => ({ ...form }), [form]);

  /* ---------------- tags ---------------- */
  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (form.tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setTagInput("");
      return;
    }
    setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };
  const removeTag = (i) =>
    setForm((f) => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }));

  /* ---------------- image upload / paste / URL ---------------- */
  const doUpload = async (input) => {
    setUploadError("");
    setUploading(true);
    try {
      const url = await uploadTradeImage(input, { previousUrl: form.image_url || null });
      if (url) setForm((f) => ({ ...f, image_url: url }));
    } catch (e) {
      console.error(e);
      setUploadError(e?.message || "Upload failed. Check bucket & policies.");
    } finally {
      setUploading(false);
    }
  };

  const onFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (file && file.type?.startsWith("image/")) await doUpload(file);
    e.target.value = "";
  };

  const onPaste = useCallback(async (e) => {
    const item = Array.from(e.clipboardData?.items || []).find((i) => i.type && i.type.startsWith("image/"));
    if (item) {
      const file = item.getAsFile();
      if (file) {
        e.preventDefault();
        await doUpload(file);
        return;
      }
    }
    const text = e.clipboardData?.getData("text");
    if (text && (text.startsWith("data:image/") || /^https?:\/\//i.test(text))) {
      e.preventDefault();
      await doUpload(text.trim());
    }
  }, [form.image_url]); // eslint-disable-line

  const onDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type?.startsWith("image/")) await doUpload(file);
  };

  /* ---------------- submit ---------------- */
  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!form.symbol || !form.date || !form.time) {
      alert("Please fill symbol, date and time.");
      return;
    }

    setSaving(true);

    // account_id → legacy label (Express normalizes to Funded)
    let legacyLabel = form.accountType || "";
    if (form.account_id && accounts.length) {
      const acc = accounts.find((a) => a.id === form.account_id);
      if (acc) {
        const normalized =
          acc.account_type === "Express" ? "Funded" : acc.account_type || "";
        legacyLabel = normalized || (acc.is_real ? "Funded" : legacyLabel) || "";
      }
    }

    const finalPayload = {
      ...payload,
      symbol: (form.symbol || "").toString().toUpperCase(),
      tags: Array.isArray(form.tags)
        ? form.tags
        : String(form.tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
      image_url: form.image_url || null,
      account_id: form.account_id || null,
      accountType: legacyLabel, // keep compatibility
      // persist session in details for uniform schema
      details: {
        ...(existingTrade?.details || {}),
        session: form.session || null,
        notes: form.notes || "",
      },
    };

    try {
      if (isEditing) await onSave(existingTrade.id, finalPayload);
      else await onSave(finalPayload);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === form.account_id) || null,
    [accounts, form.account_id]
  );

  return (
    <form
      onSubmit={submit}
      className="w-full rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-8 text-white"
      onPaste={onPaste}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl sm:text-2xl font-bold">
          {isEditing ? "Edit Trade" : "Add Trade"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-zinc-300 hover:bg-white/5"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* grid */}
      <div className="mt-6 grid grid-cols-12 gap-5">
        {/* left: fields */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Symbol"
            required
            value={form.symbol}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                symbol: (v || "").toString().toUpperCase(),
              }))
            }
          />

          {/* Direction segmented control */}
          <DirectionSegmented
            value={form.direction}
            onChange={(v) => setForm((f) => ({ ...f, direction: v }))}
          />

          <Input
            label="Date"
            type="date"
            required
            value={form.date}
            onChange={(v) => setForm((f) => ({ ...f, date: v }))}
          />
          <Input
            label="Time"
            type="time"
            required
            value={form.time}
            onChange={(v) => setForm((f) => ({ ...f, time: v }))}
            rightIcon={<Clock className="h-4 w-4 text-zinc-500" />}
          />

          <NumberInput
            label="Size"
            value={form.size}
            onChange={(v) => setForm((f) => ({ ...f, size: v }))}
          />
          <NumberInput
            label="Entry Price"
            step="0.01"
            value={form.entry_price}
            onChange={(v) => setForm((f) => ({ ...f, entry_price: v }))}
          />
          <NumberInput
            label="Exit Price"
            step="0.01"
            value={form.exit_price}
            onChange={(v) => setForm((f) => ({ ...f, exit_price: v }))}
          />
          <NumberInput
            label="P&L ($)"
            step="0.01"
            value={form.pnl}
            onChange={(v) => setForm((f) => ({ ...f, pnl: v }))}
          />

          <NumberInput
            label="R / R"
            step="0.01"
            value={form.rr}
            onChange={(v) => setForm((f) => ({ ...f, rr: v }))}
          />
          <Input
            label="Duration (HH:MM:SS or 15m)"
            value={form.duration}
            onChange={(v) => setForm((f) => ({ ...f, duration: v }))}
            rightIcon={<Clock className="h-4 w-4 text-zinc-500" />}
          />

          <NumberInput
            label="Fees ($)"
            step="0.01"
            value={form.fees}
            onChange={(v) => setForm((f) => ({ ...f, fees: v }))}
            rightIcon={<DollarSign className="h-4 w-4 text-zinc-500" />}
          />

          {/* Account selection */}
          <AccountSelect
            label="Account"
            accounts={accounts}
            value={form.account_id || ""}
            onChange={(id) => setForm((f) => ({ ...f, account_id: id || null }))}
          />

          {/* Session pills */}
          <SessionPills
            value={form.session}
            onChange={(v) => setForm((f) => ({ ...f, session: v }))}
          />

          {/* Hidden legacy accountType (kept for back-compat writes) */}
          <input type="hidden" value={form.accountType} readOnly aria-hidden="true" />
        </div>

        {/* right: screenshot rail */}
        <div
          className="col-span-12 lg:col-span-4 space-y-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
            <label className="text-xs text-zinc-400">Screenshot</label>
            <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2">
              <div className="h-[320px] w-full overflow-hidden rounded-md grid place-items-center">
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    alt="screenshot"
                    className="max-h-[300px] w-auto object-contain"
                  />
                ) : (
                  <p className="text-sm text-zinc-500 text-center px-2">
                    Drop / Paste / Upload an image
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onFileInput}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {uploading ? "Uploading…" : form.image_url ? "Replace" : "Upload"}
              </button>
              <input
                type="text"
                placeholder="…or paste an image URL / data:image"
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm"
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val) {
                      await doUpload(val);
                      e.currentTarget.value = "";
                    }
                  }
                }}
              />
            </div>
            {uploadError && (
              <p className="mt-2 text-xs text-rose-300">{uploadError}</p>
            )}
            <p className="mt-2 text-[11px] text-zinc-500">
              Paste (Ctrl/Cmd+V), drop, or upload. Replacing overwrites your old
              image (clean bucket).
            </p>
          </div>

          {/* Tags */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
            <label className="text-xs text-zinc-400">Strategy Tags</label>
            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-2 top-2.5 text-zinc-500" />
                <input
                  placeholder="Add a tag (Enter)"
                  className="w-full rounded-md border border-white/10 bg-zinc-800 pl-7 pr-2 py-2 text-sm"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                />
              </div>
              <button
                type="button"
                onClick={addTag}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {form.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.tags.map((t, i) => (
                  <span
                    key={`${t}-${i}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      className="opacity-60 group-hover:opacity-100"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* setup / notes */}
        <div className="col-span-12 lg:col-span-6">
          <Textarea
            label="Entry Criteria"
            rows={7}
            value={form.setup?.entryCriteria || ""}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                setup: { ...f.setup, entryCriteria: v },
              }))
            }
          />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <Textarea
            label="Confluences"
            rows={7}
            value={form.setup?.confluences || ""}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                setup: { ...f.setup, confluences: v },
              }))
            }
          />
        </div>

        <div className="col-span-12">
          <Textarea
            label="Notes"
            rows={7}
            value={form.notes || ""}
            onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
          />
        </div>
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
          className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-6 py-2 font-semibold text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save Trade"
          )}
        </button>
      </div>
    </form>
  );
}

/* ---------- controls ---------- */
function Input({ label, className = "", onChange, rightIcon, ...props }) {
  return (
    <label className="block min-w-0">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="relative mt-1">
        <input
          {...props}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm pr-8 ${className}`}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
    </label>
  );
}
function NumberInput({ label, className = "", onChange, step, rightIcon, ...props }) {
  return (
    <Input
      label={label}
      inputMode="decimal"
      step={step || "1"}
      onChange={onChange}
      className={className}
      rightIcon={rightIcon}
      {...props}
    />
  );
}

/** Direction segmented (Long / Short) */
function DirectionSegmented({ value = "Long", onChange }) {
  const isLong = value === "Long";
  return (
    <label className="block min-w-0">
      <span className="text-xs text-zinc-400">Direction</span>
      <div className="mt-1 relative rounded-full border border-white/10 bg-zinc-800/80 p-1 h-10 flex items-center">
        {/* active pill */}
        <div
          className="absolute top-1 bottom-1 rounded-full bg-zinc-900 transition-[left,right] duration-200"
          style={{
            left: isLong ? 4 : "calc(50% + 4px)",
            right: isLong ? "calc(50% + 4px)" : 4,
          }}
        />
        <button
          type="button"
          className={`relative z-10 flex-1 h-8 rounded-full text-sm ${isLong ? "text-white" : "text-zinc-400"}`}
          onClick={() => onChange?.("Long")}
          aria-pressed={isLong}
        >
          Long
        </button>
        <button
          type="button"
          className={`relative z-10 flex-1 h-8 rounded-full text-sm ${!isLong ? "text-white" : "text-zinc-400"}`}
          onClick={() => onChange?.("Short")}
          aria-pressed={!isLong}
        >
          Short
        </button>
      </div>
    </label>
  );
}

/** Compact session pill group */
function SessionPills({ value = "", onChange }) {
  return (
    <label className="block min-w-0">
      <span className="text-xs text-zinc-400">Session</span>
      <div className="mt-1 flex flex-wrap gap-2">
        {SESSIONS.map((s) => {
          const active = s === value;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange?.(active ? "" : s)}
              className={`px-3 py-1.5 rounded-full border text-sm transition
                ${active
                  ? "bg-emerald-500 text-black border-emerald-400"
                  : "bg-zinc-800 text-zinc-200 border-white/10 hover:bg-zinc-700"
                }`}
            >
              {s}
            </button>
          );
        })}
      </div>
    </label>
  );
}

/** Pretty, searchable account dropdown (inline) */
function AccountSelect({ label, accounts, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  const selected = useMemo(
    () => accounts.find((a) => a.id === value) || null,
    [accounts, value]
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const base = accounts || [];
    const list = qq
      ? base.filter((a) =>
          [a.name, a.firm, a.account_type]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(qq)
        )
      : base;
    return [
      { title: "Real Accounts", items: list.filter((a) => a.is_real) },
      { title: "Sim / Evaluation", items: list.filter((a) => !a.is_real) },
    ];
  }, [accounts, q]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="min-w-0" ref={ref}>
      <span className="text-xs text-zinc-400">{label}</span>
      <div
        className={`mt-1 rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white cursor-pointer flex items-center justify-between ${open ? "ring-1 ring-emerald-400/30" : ""}`}
        onClick={() => setOpen((v) => !v)}
        role="button"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          {selected ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate">{selected.name}</span>
              {selected.account_type && (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                  {selected.account_type === "Express" ? "Funded" : selected.account_type}
                </span>
              )}
              {selected.firm && (
                <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-200">
                  {selected.firm}
                </span>
              )}
              {selected.is_real && (
                <span className="shrink-0 rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[11px] text-blue-200">
                  Real
                </span>
              )}
            </div>
          ) : (
            <span className="text-zinc-500">Select an account…</span>
          )}
        </div>
        <svg
          className="ml-2 h-4 w-4 text-zinc-400 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </div>

      {open && (
        <div className="relative">
          <div className="absolute z-20 mt-2 w-full rounded-md border border-white/10 bg-zinc-900 shadow-xl overflow-hidden">
            {/* search */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search accounts…"
                className="bg-transparent text-sm text-white placeholder:text-zinc-500 w-full outline-none"
              />
            </div>

            {/* results */}
            <div className="max-h-64 overflow-auto py-1">
              {filtered.map((group) =>
                group.items.length ? (
                  <div key={group.title} className="py-1">
                    <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-zinc-500">
                      {group.title}
                    </p>
                    {group.items.map((a) => {
                      const isSelected = a.id === value;
                      return (
                        <button
                          key={a.id}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between ${
                            isSelected ? "bg-emerald-500/10" : ""
                          }`}
                          onClick={() => {
                            onChange?.(a.id);
                            setOpen(false);
                          }}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{a.name}</span>
                              {a.account_type && (
                                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                                  {a.account_type === "Express" ? "Funded" : a.account_type}
                                </span>
                              )}
                              {a.firm && (
                                <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-200">
                                  {a.firm}
                                </span>
                              )}
                              {a.is_real && (
                                <span className="shrink-0 rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[11px] text-blue-200">
                                  Real
                                </span>
                              )}
                            </div>
                            {a.currency && (
                              <p className="text-[11px] text-zinc-500 mt-0.5">
                                {a.currency}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null
              )}

              {!filtered.some((g) => g.items.length) && (
                <div className="px-3 py-6 text-sm text-zinc-500 text-center">
                  No accounts match “{q}”.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Textarea({ label, rows = 4, value, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="text-xs text-zinc-400">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-1 w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm"
      />
    </label>
  );
}
