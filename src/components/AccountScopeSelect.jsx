// src/components/AccountScopeSelect.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ChevronDown,
  Check,
  XCircle,
  Search,
  Building2,
  BadgeDollarSign,
  Sparkles,
} from "lucide-react";
import { fetchAccounts, ACCOUNTS_CHANGED_EVENT } from "../utils/accountsService";
import { useScope } from "../state/scopeStore";

// small util
const nicename = (s = "") => s.replace(/\s*\(legacy\)\s*$/i, "");

// lightweight fuzzy-ish includes (case-insensitive)
function matchAny(str = "", q = "") {
  if (!q) return true;
  const s = String(str).toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((w) => (w ? s.includes(w) : true));
}

export default function AccountScopeSelect() {
  const { accountId, setAccountId, clearAccount } = useScope();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [hoverIdx, setHoverIdx] = useState(-1);

  const btnRef = useRef(null);
  const popRef = useRef(null);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchAccounts();
      setAccounts(rows || []);
    } finally {
      setLoading(false);
    }
  }, []);

  // initial + live refresh
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const h = () => load();
    window.addEventListener(ACCOUNTS_CHANGED_EVENT, h);
    return () => window.removeEventListener(ACCOUNTS_CHANGED_EVENT, h);
  }, [load]);

  // click-away
  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // reset state on open
  useEffect(() => {
    if (open) {
      setQ("");
      setHoverIdx(-1);
      // focus the search input ASAP
      setTimeout(() => {
        const el = popRef.current?.querySelector("input[data-acc-scope-search]");
        el?.focus();
      }, 0);
    }
  }, [open]);

  const current = accounts.find((a) => a.id === accountId);
  const label = current
    ? `${nicename(current.name)}${current.is_real ? " • Real" : ""}`
    : "All Accounts";

  const filtered = useMemo(() => {
    if (!q) return accounts;
    return accounts.filter((a) => {
      const base = [a.name, a.firm, a.account_type, a.currency, a.is_real ? "real" : "demo"].join(
        " "
      );
      return matchAny(base, q);
    });
  }, [accounts, q]);

  // keyboard nav
  const flatItems = useMemo(() => {
    // 0th = All accounts pseudo row
    return [{ __all: true }].concat(filtered);
  }, [filtered]);

  const moveHover = (dir) => {
    setHoverIdx((idx) => {
      const next = Math.max(0, Math.min(flatItems.length - 1, idx + dir));
      // scroll into view
      requestAnimationFrame(() => {
        const row = listRef.current?.querySelector(`[data-row="${next}"]`);
        row?.scrollIntoView({ block: "nearest" });
      });
      return next;
    });
  };

  const chooseHover = () => {
    if (hoverIdx < 0) return;
    const item = flatItems[hoverIdx];
    if (!item) return;
    if (item.__all) {
      clearAccount();
      setOpen(false);
      return;
    }
    setAccountId(item.id);
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-white shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* Left pill */}
        <span className="inline-flex items-center gap-2 truncate max-w-[200px]">
          <span
            className={`h-6 w-6 grid place-items-center rounded-lg border border-white/10 ${
              current
                ? current.is_real
                  ? "bg-emerald-500/15"
                  : "bg-cyan-500/15"
                : "bg-white/5"
            }`}
            title={current ? (current.is_real ? "Real" : "Sim") : "All"}
          >
            {current ? (
              current.is_real ? (
                <BadgeDollarSign size={14} className="text-emerald-300" />
              ) : (
                <Sparkles size={14} className="text-cyan-300" />
              )
            ) : (
              <Building2 size={14} className="text-zinc-300" />
            )}
          </span>
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown size={16} />
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popRef}
          className="absolute right-0 mt-2 w-[320px] rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl overflow-hidden z-40 backdrop-blur-md"
          role="listbox"
          aria-activedescendant={hoverIdx >= 0 ? `acc-opt-${hoverIdx}` : undefined}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              moveHover(1);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              moveHover(-1);
            }
            if (e.key === "Enter") {
              e.preventDefault();
              chooseHover();
            }
          }}
          tabIndex={-1}
        >
          {/* header */}
          <div className="px-3 pt-3 pb-2 border-b border-white/10">
            <div className="text-[11px] text-zinc-400 mb-2">Choose account scope</div>
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                data-acc-scope-search
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setHoverIdx(-1);
                }}
                placeholder="Search name, firm, type…"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none"
              />
            </div>
          </div>

          {/* Options list */}
          <div
            ref={listRef}
            className="max-h-72 overflow-y-auto"
            onMouseLeave={() => setHoverIdx(-1)}
          >
            {/* All */}
            <RowButton
              idx={0}
              hoverIdx={hoverIdx}
              idBase="acc-opt"
              selected={!accountId}
              title="All Accounts"
              subtitle="Show combined view"
              icon={<Building2 size={14} className="text-zinc-300" />}
              onClick={() => {
                clearAccount();
                setOpen(false);
              }}
              onMouseEnter={() => setHoverIdx(0)}
            />

            {/* Divider */}
            <div className="h-px bg-white/10 my-1" />

            {loading ? (
              <div className="px-3 py-3 text-zinc-400 text-sm">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-3 text-zinc-500 text-sm">No matches</div>
            ) : (
              filtered.map((a, i) => {
                const idx = i + 1; // +1 because "All" is 0
                const selected = a.id === accountId;
                const isLegacy = /\(legacy\)$/i.test(a.name || "");
                const type = a.account_type || "—";
                const chip =
                  a.is_real ? (
                    <span className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-400/20">
                      Real
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-400/20">
                      Sim
                    </span>
                  );

                return (
                  <RowButton
                    key={a.id}
                    idx={idx}
                    hoverIdx={hoverIdx}
                    idBase="acc-opt"
                    selected={selected}
                    title={nicename(a.name) || "(unnamed)"}
                    subtitle={
                      isLegacy
                        ? "Legacy"
                        : [type, a.firm || null, a.currency || null].filter(Boolean).join(" • ")
                    }
                    icon={
                      a.is_real ? (
                        <BadgeDollarSign size={14} className="text-emerald-300" />
                      ) : (
                        <Sparkles size={14} className="text-cyan-300" />
                      )
                    }
                    endChip={chip}
                    onClick={() => {
                      setAccountId(a.id);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setHoverIdx(idx)}
                  />
                );
              })
            )}
          </div>

          {/* Clear */}
          {accountId && (
            <div className="border-t border-white/10">
              <button
                className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-white/5 text-zinc-300"
                onClick={() => {
                  clearAccount();
                  setOpen(false);
                }}
                title="Clear scope and show all accounts"
              >
                <XCircle size={16} /> Clear scope
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Row button (list item) */
function RowButton({
  idx,
  hoverIdx,
  idBase,
  selected,
  title,
  subtitle,
  icon,
  endChip,
  onClick,
  onMouseEnter,
}) {
  const hover = idx === hoverIdx;
  return (
    <button
      id={`${idBase}-${idx}`}
      data-row={idx}
      role="option"
      aria-selected={selected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full text-left px-3 py-2 flex items-center justify-between transition ${
        hover ? "bg-white/5" : "hover:bg-white/5"
      } ${selected ? "bg-white/5" : ""}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="h-7 w-7 grid place-items-center rounded-lg border border-white/10 bg-white/5 shrink-0">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-sm text-white truncate">{title}</div>
          <div className="text-[11px] text-zinc-400 truncate">{subtitle}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-2">
        {endChip}
        {selected && <Check size={16} className="text-emerald-300" />}
      </div>
    </button>
  );
}
