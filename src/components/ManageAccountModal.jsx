// src/components/ManageAccountsModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  X, Pencil, Trash2, Save, Ban, Building2, Wallet,
} from "lucide-react";
import {
  fetchAccounts,
  updateAccount,
  deleteAccount,
} from "../utils/accountsService";

/**
 * Props:
 * - onClose(): void
 * - onChanged?(): void   // optional callback to refresh dashboard after edits
 */
export default function ManageAccountsModal({ onClose, onChanged }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", firm: "", currency: "USD" });
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const accs = await fetchAccounts();
      accs.sort(
        (a, b) =>
          Number(b.is_real) - Number(a.is_real) ||
          String(a.name).localeCompare(String(b.name))
      );
      setAccounts(accs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (acc) => {
    setEditingId(acc.id);
    setDraft({
      name: acc.name || "",
      firm: acc.firm || "",
      currency: acc.currency || "USD",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ name: "", firm: "", currency: "USD" });
  };

  const saveEdit = async (id) => {
    setBusyId(id);
    try {
      await updateAccount(id, {
        name: draft.name.trim(),
        firm: draft.firm.trim() || null,
        currency: draft.currency || "USD",
      });
      await load();
      setEditingId(null);
      onChanged?.();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this account? Trades will remain but lose the link.")) return;
    setBusyId(id);
    try {
      await deleteAccount(id);
      await load();
      onChanged?.();
    } finally {
      setBusyId(null);
    }
  };

  const grouped = useMemo(() => {
    const real = accounts.filter((a) => a.is_real);
    const sim = accounts.filter((a) => !a.is_real);
    return [
      { title: "Real", items: real },
      { title: "Practice (Demo / Evaluation)", items: sim },
    ];
  }, [accounts]);

  return (
    <div
      className="
        w-full
        sm:w-[min(720px,92vw)]
        mx-auto
        bg-gradient-to-b from-zinc-900 to-zinc-950
        text-white
        rounded-none sm:rounded-2xl
        border border-white/10
        shadow-2xl
        overflow-hidden
      "
      style={{ maxHeight: "min(92vh, 100svh - 2rem)" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-900/90 backdrop-blur border-b border-white/10 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold">Manage Accounts</h2>
            <p className="text-[12px] text-zinc-400">
              Rename or delete. <span className="text-zinc-300">Funded/Personal</span> count as real;
              <span className="text-zinc-300"> Demo/Evaluation</span> as practice.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/10 text-zinc-300"
            aria-label="Close"
          >
            <X />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-6 py-3 sm:py-5 overflow-y-auto">
        {loading ? (
          <div className="py-16 text-center text-zinc-400">Loading…</div>
        ) : (
          grouped.map((g) =>
            g.items.length ? (
              <section key={g.title} className="mb-6">
                <h3 className="px-1 pb-2 text-xs uppercase tracking-wide text-zinc-400">
                  {g.title}
                </h3>

                {/* Mobile: stacked cards */}
                <ul className="sm:hidden space-y-3">
                  {g.items.map((a) => {
                    const isEditing = editingId === a.id;
                    return (
                      <li
                        key={a.id}
                        className="rounded-xl border border-white/10 bg-zinc-900/60 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {!isEditing ? (
                              <>
                                <p className="font-semibold truncate">{a.name}</p>
                                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                                  <Badge label={a.account_type === "Express" ? "Funded" : a.account_type || "—"} />
                                  {a.firm && <Badge icon={<Building2 className="h-3 w-3" />} label={a.firm} />}
                                  {a.currency && <Badge icon={<Wallet className="h-3 w-3" />} label={a.currency} />}
                                </div>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <InputSmall
                                  placeholder="Name"
                                  value={draft.name}
                                  onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
                                />
                                <InputSmall
                                  placeholder="Firm (optional)"
                                  value={draft.firm}
                                  onChange={(v) => setDraft((d) => ({ ...d, firm: v }))}
                                />
                                <InputSmall
                                  placeholder="Currency"
                                  value={draft.currency}
                                  onChange={(v) => setDraft((d) => ({ ...d, currency: v }))}
                                />
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex gap-1">
                            {!isEditing ? (
                              <>
                                <IconBtn
                                  title="Rename"
                                  onClick={() => startEdit(a)}
                                  icon={<Pencil className="h-4 w-4" />}
                                />
                                <IconBtn
                                  title="Delete"
                                  danger
                                  disabled={busyId === a.id}
                                  onClick={() => remove(a.id)}
                                  icon={<Trash2 className="h-4 w-4" />}
                                />
                              </>
                            ) : (
                              <>
                                <IconBtn
                                  title="Save"
                                  onClick={() => saveEdit(a.id)}
                                  disabled={!draft.name.trim() || busyId === a.id}
                                  icon={<Save className="h-4 w-4" />}
                                />
                                <IconBtn
                                  title="Cancel"
                                  onClick={cancelEdit}
                                  icon={<Ban className="h-4 w-4" />}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Desktop/Tablet: table */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm bg-zinc-900/50">
                    <thead className="bg-zinc-800/60">
                      <tr>
                        {["Name", "Firm", "Type", "Currency", ""].map((h) => (
                          <th key={h} className="px-4 py-2 text-left text-zinc-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((a) => {
                        const isEditing = editingId === a.id;
                        return (
                          <tr key={a.id} className="border-t border-white/10">
                            <td className="px-4 py-2">
                              {!isEditing ? (
                                a.name
                              ) : (
                                <InputInline
                                  value={draft.name}
                                  onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
                                />
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {!isEditing ? (
                                a.firm || "—"
                              ) : (
                                <InputInline
                                  value={draft.firm}
                                  onChange={(v) => setDraft((d) => ({ ...d, firm: v }))}
                                  placeholder="Firm"
                                />
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {a.account_type === "Express" ? "Funded" : a.account_type || "—"}
                            </td>
                            <td className="px-4 py-2">
                              {!isEditing ? (
                                a.currency || "USD"
                              ) : (
                                <InputInline
                                  value={draft.currency}
                                  onChange={(v) => setDraft((d) => ({ ...d, currency: v }))}
                                  className="max-w-[100px]"
                                />
                              )}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {!isEditing ? (
                                <div className="inline-flex gap-2">
                                  <IconBtn
                                    title="Rename"
                                    onClick={() => startEdit(a)}
                                    icon={<Pencil className="h-4 w-4" />}
                                  />
                                  <IconBtn
                                    title="Delete"
                                    danger
                                    disabled={busyId === a.id}
                                    onClick={() => remove(a.id)}
                                    icon={<Trash2 className="h-4 w-4" />}
                                  />
                                </div>
                              ) : (
                                <div className="inline-flex gap-2">
                                  <IconBtn
                                    title="Save"
                                    onClick={() => saveEdit(a.id)}
                                    disabled={!draft.name.trim() || busyId === a.id}
                                    icon={<Save className="h-4 w-4" />}
                                  />
                                  <IconBtn
                                    title="Cancel"
                                    onClick={cancelEdit}
                                    icon={<Ban className="h-4 w-4" />}
                                  />
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null
          )
        )}

        <div className="pt-3 pb-[max(12px,env(safe-area-inset-bottom))] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- small UI helpers ---------- */
function IconBtn({ title, onClick, icon, danger, disabled }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-2.5 py-1.5 border text-sm inline-flex items-center justify-center
        ${danger
          ? "border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
          : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"} 
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon}
    </button>
  );
}

function Badge({ label, icon }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
      {icon}
      {label}
    </span>
  );
}

function InputInline({ value, onChange, placeholder, className = "" }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`rounded-md bg-zinc-800 border border-white/10 px-2 py-1 text-sm ${className}`}
    />
  );
}

function InputSmall({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md bg-zinc-800 border border-white/10 px-3 py-2 text-sm"
    />
  );
}
