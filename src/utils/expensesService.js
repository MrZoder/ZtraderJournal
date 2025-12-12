// utils/expensesService.js
import { supabase } from "./supabaseClient";

// --- helpers ---
const stripUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj ?? {}).filter(([, v]) => v !== undefined));

const sanitizeForInsert = (payload) => {
  const { id, ...rest } = payload ?? {};
  return stripUndefined(rest);
};

const sanitizeForUpdate = (payload) => {
  const { id, ...rest } = payload ?? {};
  return stripUndefined(rest);
};

// --- queries ---
export async function fetchExpenses(scope, { from, to, search } = {}) {
  let q = supabase.from("expenses").select("*").order("date", { ascending: false });

  if (scope?.accountId) q = q.eq("account_id", scope.accountId);
  if (from) q = q.gte("date", from);
  if (to) q = q.lte("date", to);
  if (search) {
    // adjust to your schema: name, notes, category are common fields
    q = q.or(`name.ilike.%${search}%,notes.ilike.%${search}%,category.ilike.%${search}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function addExpense(payload) {
  // CRITICAL: never send id on insert; let DB default/identity generate it
  const clean = sanitizeForInsert(payload);
  const { data, error } = await supabase
    .from("expenses")
    .insert(clean)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExpense(id, payload) {
  const clean = sanitizeForUpdate(payload);
  const { data, error } = await supabase
    .from("expenses")
    .update(clean)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

// Templates (keep your existing implementations if different)
export async function fetchExpenseTemplates() {
  const { data, error } = await supabase.from("expense_templates").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function addExpenseTemplate(payload) {
  const clean = stripUndefined(payload);
  const { data, error } = await supabase.from("expense_templates").insert(clean).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExpenseTemplate(id) {
  const { error } = await supabase.from("expense_templates").delete().eq("id", id);
  if (error) throw error;
}

// Storage (adjust bucket/path utils to your app)
export async function uploadReceiptImage(file, { previousUrl } = {}) {
  const bucket = "receipts";
  const ext = file.name?.split(".").pop() || "jpg";
  const path = `exp/${crypto.randomUUID()}.${ext}`;

  // optionally delete previous (if you store exact storage path)
  if (previousUrl && previousUrl.startsWith("exp/")) {
    await supabase.storage.from(bucket).remove([previousUrl]).catch(() => {});
  }

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function signedReceiptUrl(path) {
  if (!path) return null;
  const bucket = "receipts";
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

// KPIs helper (unchanged)
export function kpisFromExpenses(rows) {
  const now = new Date();
  const startY = new Date(now.getFullYear(), 0, 1);
  const last30Start = new Date(now.getTime() - 30 * 86400000);

  let total = 0, ytd = 0, last30 = 0;
  const byCategory = {};

  for (const r of rows || []) {
    const amt = Number(r.amount) || 0;
    total += amt;
    const d = new Date(r.date);
    if (d >= startY) ytd += amt;
    if (d >= last30Start) last30 += amt;
    if (r.category) byCategory[r.category] = (byCategory[r.category] || 0) + amt;
  }
  return { total, ytd, last30, byCategory };
}
