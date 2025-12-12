// src/pages/tabs/ExpensesTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Image as ImageIcon, Save, X, Edit, ChevronDown } from "lucide-react";
import { useScope } from "../../state/scopeStore";
import {
  fetchExpenses, addExpense, updateExpense, deleteExpense,
  fetchExpenseTemplates, addExpenseTemplate, deleteExpenseTemplate,
  uploadReceiptImage, signedReceiptUrl, kpisFromExpenses
} from "../../utils/expensesService";
import { fetchAccounts } from "../../utils/accountsService";

export default function ExpensesTab({ embedded = false }) {
  const { accountId } = useScope();
  const scope = { accountId };

  const [expenses, setExpenses] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [range, setRange] = useState("this_month");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [acc, tmpls] = await Promise.all([fetchAccounts(), fetchExpenseTemplates()]);
      setAccounts(acc);
      setTemplates(tmpls);
      const { from, to } = rangeToDates(range);
      const exps = await fetchExpenses(scope, { from, to, search });
      setExpenses(exps);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [accountId, range, search]);

  const kpis = useMemo(() => kpisFromExpenses(expenses), [expenses]);

  const onCreate = () => { setEditing(null); setModalOpen(true); };
  const onEdit = (e) => { setEditing(e); setModalOpen(true); };
  const onDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteExpense(id);
      toast.success("Deleted");
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  return (
    <div className={embedded ? "space-y-6 text-white pt-0" : "space-y-6 text-white"}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Dropdown value={range} onChange={setRange} items={[
            ["this_month", "This Month"], ["last_30", "Last 30d"], ["ytd", "YTD"], ["all", "All Time"]
          ]}/>
          <input
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Search name, notes, category…"
            className="min-w-[220px] rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-black font-semibold hover:bg-emerald-400">
            <Plus size={16}/> Add New Entry
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label="Total Expenses" value={`$${kpis.total.toFixed(2)}`} variant="danger" />
        <Kpi label="YTD"           value={`$${kpis.ytd.toFixed(2)}`} variant="neutral" />
        <Kpi label="Last 30d"      value={`$${kpis.last30.toFixed(2)}`} variant="neutral" />
        <Kpi label="Top Category"  value={topCategory(kpis.byCategory)} variant="neutral" />
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full bg-zinc-900/50 min-w-[720px]">
          <thead className="bg-zinc-800/60">
            <tr>
              {["Date","Name","Account","Category","Amount",""].map((h)=>(
                <th key={h} className="px-4 py-3 text-left text-sm text-zinc-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-400">Loading…</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-500">No entries.</td></tr>
            ) : expenses.map((e)=>(
              <tr key={e.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-4 py-3">{dayjs(e.date).format("DD MMM YYYY")}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  {e.receipt_url ? <ReceiptThumb path={e.receipt_url}/> : <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white/5"><ImageIcon size={12}/></span>}
                  <span className="font-medium">{e.name}</span>
                </td>
                <td className="px-4 py-3">{labelForAccount(accounts, e.account_id)}</td>
                <td className="px-4 py-3">{e.category || "—"}</td>
                <td className="px-4 py-3 font-semibold">${Number(e.amount).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={()=>onEdit(e)} className="rounded-md bg-white/5 hover:bg-white/10 px-2 py-1 text-xs inline-flex items-center gap-1"><Edit size={14}/> Edit</button>
                    <button onClick={()=>onDelete(e.id)} className="rounded-md bg-white/5 hover:bg-white/10 px-2 py-1 text-xs inline-flex items-center gap-1 text-rose-300"><Trash2 size={14}/> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10"><h4 className="font-semibold">Expenses</h4></div>
        {loading ? (
          <div className="p-4 text-center text-zinc-400">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="p-4 text-center text-zinc-500">No entries.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {expenses.map((e)=>(
              <li key={e.id} className="p-4 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Date</span><span>{dayjs(e.date).format("DD MMM YYYY")}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Name</span><span className="truncate max-w-[60%] text-right">{e.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Account</span><span className="truncate max-w-[60%] text-right">{labelForAccount(accounts, e.account_id)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Category</span><span>{e.category || "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Amount</span><span className="font-semibold text-rose-400">${Number(e.amount).toFixed(2)}</span></div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={()=>onEdit(e)} className="text-xs text-zinc-300 rounded-md bg-white/5 hover:bg-white/10 px-2 py-1">Edit</button>
                  <button onClick={()=>onDelete(e.id)} className="text-xs text-rose-400 rounded-md bg-white/5 hover:bg-white/10 px-2 py-1">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Templates */}
      <TemplatesPanel
        templates={templates}
        accounts={accounts}
        onAdd={async (payload)=>{
          await addExpenseTemplate(payload);
          toast.success("Template saved");
          setTemplates(await fetchExpenseTemplates());
        }}
        onDelete={async (id)=>{
          await deleteExpenseTemplate(id);
          toast.success("Template removed");
          setTemplates(await fetchExpenseTemplates());
        }}
        onUse={(t)=>{
          setEditing({
            name: t.name,
            amount: t.default_amount || "",
            currency: t.currency || "USD",
            category: t.category || "",
            date: dayjs().format("YYYY-MM-DD"),
            account_id: t.default_account || accountId || null,
            notes: t.notes || "",
            receipt_url: ""
          });
          setModalOpen(true);
        }}
      />

      {/* Modal */}
      {modalOpen && (
        <ExpenseModal
          open={modalOpen}
          onClose={()=>setModalOpen(false)}
          accounts={accounts}
          initial={editing}
          onSave={async (payload)=>{
            if (editing?.id) await updateExpense(editing.id, payload);
            else await addExpense(payload);
            toast.success("Saved");
            setModalOpen(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

/* --- helpers & lil components --- */
const rangeToDates = (r) => {
  const today = dayjs();
  if (r === "this_month") return { from: today.startOf("month").format("YYYY-MM-DD"), to: today.endOf("month").format("YYYY-MM-DD") };
  if (r === "last_30")    return { from: today.subtract(30,"day").format("YYYY-MM-DD"), to: today.format("YYYY-MM-DD") };
  if (r === "ytd")        return { from: today.startOf("year").format("YYYY-MM-DD"), to: today.format("YYYY-MM-DD") };
  return {};
};

const labelForAccount = (accounts, id) => {
  const a = accounts.find((x)=>x.id===id);
  if (!a) return "—";
  const bits = [a.name, a.account_type, a.is_real ? "Real" : null].filter(Boolean);
  return bits.join(" • ");
};

function topCategory(map) {
  const entries = Object.entries(map || {});
  if (!entries.length) return "—";
  const [k] = entries.sort((a,b)=>b[1]-a[1])[0];
  return k;
}

function ReceiptThumb({ path }) {
  const [url, setUrl] = React.useState(null);
  React.useEffect(()=>{
    let live = true;
    (async()=>{
      try { const u = await signedReceiptUrl(path); if (live) setUrl(u); } catch {}
    })();
    return ()=>{ live=false; };
  }, [path]);
  if (!url) return <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white/5"><ImageIcon size={12}/></span>;
  return <img src={url} alt="" className="h-5 w-5 rounded object-cover ring-1 ring-white/10" />;
}

function Kpi({ label, value, variant="neutral" }) {
  const v =
    variant === "danger"
      ? "from-rose-500/10 via-rose-400/10 to-transparent ring-rose-400/10"
      : "from-cyan-500/10 via-emerald-400/10 to-transparent ring-white/10";
  return (
    <div className={`rounded-2xl ring-1 ${v} bg-gradient-to-br p-4`}>
      <p className="text-[11px] text-zinc-400">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Dropdown({ value, onChange, items }) {
  const [open, setOpen] = useState(false);
  const label = (items.find(([v])=>v===value)?.[1]) || value;
  return (
    <div className="relative">
      <button onClick={()=>setOpen((s)=>!s)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm">
        {label} <ChevronDown size={14}/>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 min-w-[160px] rounded-xl border border-white/10 bg-zinc-900 shadow-xl overflow-hidden">
          {items.map(([v,l])=>(
            <button key={v} onClick={()=>{ onChange(v); setOpen(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-white/5">{l}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Modal (unchanged core behavior, just tidied a bit) */
function ExpenseModal({ open, onClose, onSave, accounts, initial }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => initial || {
    name: "",
    category: "",
    amount: "",
    currency: "USD",
    date: dayjs().format("YYYY-MM-DD"),
    account_id: null,
    notes: "",
    receipt_url: ""
  });
  const fileRef = React.useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const doUpload = async (input) => {
    setUploading(true);
    try {
      const path = await uploadReceiptImage(input, { previousUrl: form.receipt_url || null });
      setForm((f)=>({ ...f, receipt_url: path }));
    } catch (e) {
      console.error(e);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name || !form.amount || !form.date) {
      toast.error("Name, amount, and date are required");
      return;
    }
    setSaving(true);
    try {
      const { id, ...rest } = form;
      await onSave({
        ...rest,
        amount: Number(rest.amount),
        account_id: rest.account_id === "" || rest.account_id === null ? null
                   : (typeof rest.account_id === "string" ? Number(rest.account_id) : rest.account_id),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur p-6" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{initial?.id ? "Edit Entry" : "Log New Entry"}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5"><X/></button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type"><div className="px-3 py-2 text-sm rounded-lg border border-white/10 bg-zinc-800">Expense</div></Field>
          <Field label="Category">
            <select value={form.category} onChange={(e)=>setForm(f=>({ ...f, category: e.target.value }))} className="input">
              <option value="">Select…</option>
              <option>Evaluation</option><option>Activation</option><option>Subscription</option><option>Data</option><option>Misc</option>
            </select>
          </Field>

          <Field label="Name"><input className="input" value={form.name} onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))} placeholder="e.g., 50K Combine – Apex"/></Field>
          <Field label="Amount"><input type="number" step="0.01" className="input" value={form.amount} onChange={(e)=>setForm(f=>({ ...f, amount: e.target.value }))}/></Field>
          <Field label="Currency">
            <select className="input" value={form.currency} onChange={(e)=>setForm(f=>({ ...f, currency: e.target.value }))}>
              <option>USD</option><option>EUR</option><option>GBP</option>
            </select>
          </Field>
          <Field label="Date"><input type="date" className="input" value={form.date} onChange={(e)=>setForm(f=>({ ...f, date: e.target.value }))}/></Field>
          {/* Account */}
<Field label="Account">
  <select
    className="input"
    value={form.account_id ?? ""}
    onChange={(e) =>
      setForm((f) => ({
        ...f,
        account_id: e.target.value ? Number(e.target.value) : null,
      }))
    }
  >
    <option value="">— None —</option>
    {accounts.map((a) => (
      <option key={a.id} value={a.id}>
        {a.name} {a.account_type ? `• ${a.account_type}` : ""} {a.is_real ? "• Real" : ""}
      </option>
    ))}
  </select>
</Field>

          <Field label="Notes"><input className="input" value={form.notes} onChange={(e)=>setForm(f=>({ ...f, notes: e.target.value }))} placeholder="Optional notes…"/></Field>

          <div className="sm:col-span-2">
            <label className="block text-xs text-zinc-400 mb-1">Receipt</label>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={(e)=>e.target.files?.[0] && doUpload(e.target.files[0])} className="hidden"/>
              <button type="button" onClick={()=>fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
                {uploading ? "Uploading…" : "Upload"}
              </button>
              {form.receipt_url && <ReceiptThumb path={form.receipt_url}/>}
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="rounded-lg bg-zinc-700 px-4 py-2 hover:bg-zinc-600">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-black font-semibold hover:bg-emerald-400 disabled:opacity-60">
              <Save size={16}/> {saving ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TemplatesPanel({ templates, accounts, onAdd, onDelete, onUse }) {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState({ name:"", default_amount:"", currency:"USD", category:"Evaluation", default_account:"", notes:"" });

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70">
      <div className="flex items-center justify-between px-4 py-3">
        <h4 className="font-semibold">Saved Templates</h4>
        <button onClick={()=>setOpen(!open)} className="text-sm text-zinc-400 hover:text-white">{open ? "Hide" : "Show"}</button>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <div className="divide-y divide-white/5 rounded-xl border border-white/10 overflow-hidden">
            {templates.length === 0 ? (
              <div className="px-3 py-4 text-sm text-zinc-500">No templates yet.</div>
            ) : templates.map(t=>(
              <div key={t.id} className="px-3 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-zinc-400">
                    ${t.default_amount?.toFixed?.(2) ?? t.default_amount} • {t.category || "—"} • {labelForAccount(accounts, t.default_account)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>onUse(t)} className="rounded-md bg-emerald-500/90 hover:bg-emerald-400 px-3 py-1 text-xs font-semibold text-black">Use</button>
                  <button onClick={()=>onDelete(t.id)} className="rounded-md bg-white/5 hover:bg-white/10 px-3 py-1 text-xs text-rose-300">Delete</button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
            <input className="input sm:col-span-2" placeholder="Name" value={draft.name} onChange={(e)=>setDraft(d=>({ ...d, name:e.target.value }))}/>
            <input className="input" type="number" step="0.01" placeholder="Amount" value={draft.default_amount} onChange={(e)=>setDraft(d=>({ ...d, default_amount:e.target.value }))}/>
            <select className="input" value={draft.category} onChange={(e)=>setDraft(d=>({ ...d, category:e.target.value }))}>
              <option>Evaluation</option><option>Activation</option><option>Subscription</option><option>Data</option><option>Misc</option>
            </select>
            <select className="input" value={draft.default_account} onChange={(e)=>setDraft(d=>({ ...d, default_account:e.target.value }))}>
              <option value="">— Account —</option>
              {accounts.map(a=>(<option key={a.id} value={a.id}>{a.name}</option>))}
            </select>
            <button
              onClick={async ()=>{
                if (!draft.name) return toast.error("Template needs a name");
                await onAdd({ ...draft, default_amount: draft.default_amount ? Number(draft.default_amount) : null });
                setDraft({ name:"", default_amount:"", currency:"USD", category:"Evaluation", default_account:"", notes:"" });
              }}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-zinc-400 mb-1">{label}</span>
      {children}
    </label>
  );
}
