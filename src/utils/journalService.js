// src/utils/journalService.js
// ---------------------------------------------------------
// ZTrader Journal Service (Supabase, RLS-safe, bug-resistant)
// - Unique index on (user_id, date, account_id) must exist
// - Columns: id, user_id(uuid), date(date), account_id(bigint|null),
//            status('draft'|'ready'|'reviewed'),
//            plan jsonb, during jsonb, review jsonb,
//            created_at, updated_at
//
// Exports include legacy names for backward compatibility.
// ---------------------------------------------------------

import { supabase } from "./supabaseClient";

/* ======================== Auth Helper ======================== */
async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/* ======================== Shape Defaults ======================== */
const emptyDoc = (date, account_id = null) => ({
  id: undefined,
  user_id: undefined,
  date,
  account_id,
  status: "draft",
  plan:   { focusGoal:"", bias:"", riskBox:{}, keyLevels:[], checklist:{}, newsTime:"" },
  during: { events: [] },
  review: { adherenceScore: 0, lessons: [], actions: [], grade: "" },
  created_at: undefined,
  updated_at: undefined,
});

/* ======================== Normalizers ======================== */
function normalizePlan(p) {
  const plan = p && typeof p === "object" ? p : {};
  return {
    focusGoal: String(plan.focusGoal ?? ""),
    bias: String(plan.bias ?? ""),
    riskBox: normalizeRisk(plan.riskBox),
    keyLevels: Array.isArray(plan.keyLevels)
      ? plan.keyLevels.map((x) => ({
          label: String(x?.label ?? ""),
          value: String(x?.value ?? ""),
        }))
      : [],
    checklist: isObj(plan.checklist)
      ? Object.fromEntries(Object.entries(plan.checklist).map(([k, v]) => [k, !!v]))
      : {},
    newsTime: String(plan.newsTime ?? ""),
  };
}
function normalizeRisk(r) {
  const o = r && typeof r === "object" ? r : {};
  return {
    maxRisk: num(o.maxRisk),
    maxTrades: int(o.maxTrades),
    maxLoss: num(o.maxLoss),
  };
}
function normalizeDuring(d) {
  const o = d && typeof d === "object" ? d : {};
  return {
    events: Array.isArray(o.events)
      ? o.events.map((e) => ({
          time: String(e?.time ?? ""),
          text: String(e?.text ?? ""),
          tags: Array.isArray(e?.tags) ? e.tags.map(String) : [],
          mood: e?.mood ? String(e.mood) : "",
          media: Array.isArray(e?.media) ? e.media : [],
        }))
      : [],
  };
}
function normalizeReview(r) {
  const o = r && typeof r === "object" ? r : {};
  return {
    adherenceScore: clampInt(o.adherenceScore, 0, 100),
    lessons: Array.isArray(o.lessons) ? o.lessons.map(String) : [],
    actions: Array.isArray(o.actions) ? o.actions.map(String) : [],
    grade: String(o.grade ?? ""),
  };
}

const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const int = (v) => (Number.isInteger(Number(v)) ? Number(v) : 0);
const clampInt = (v, lo, hi) => {
  const n = int(v);
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
};
const oneOf = (v, arr, def) => (arr.includes(v) ? v : def);

/* ======================== Core API ======================== */

/** Get a journal by date + scope (accountId nullable). Returns null if none exists. */
export async function getJournal(date, scope = { accountId: null }) {
  const user_id = await getUserId();
  const account_id = scope?.accountId ?? null;

  let q = supabase.from("journals").select("*").eq("user_id", user_id).eq("date", date);
  q = account_id === null ? q.is("account_id", null) : q.eq("account_id", account_id);

  const { data, error } = await q.maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  return {
    ...emptyDoc(date, account_id),
    ...data,
    plan: normalizePlan(data.plan),
    during: normalizeDuring(data.during),
    review: normalizeReview(data.review),
  };
}

/** Upsert (conflict on user_id,date,account_id) and return saved row. Safe for autosave. */
export async function upsertJournal(payload) {
  const user_id = await getUserId();
  const date = payload?.date;
  const account_id = payload?.account_id ?? null;
  if (!date) throw new Error("Missing journal date");

  const row = {
    user_id,
    date,
    account_id,
    status: oneOf(payload?.status, ["draft", "ready", "reviewed"], "draft"),
    plan: normalizePlan(payload?.plan),
    during: normalizeDuring(payload?.during),
    review: normalizeReview(payload?.review),
  };

  const { data, error } = await supabase
    .from("journals")
    .upsert(row, { onConflict: "user_id,date,account_id" })
    .select()
    .maybeSingle();

  if (error) throw error;

  return {
    ...emptyDoc(date, account_id),
    ...data,
    plan: normalizePlan(data.plan),
    during: normalizeDuring(data.during),
    review: normalizeReview(data.review),
  };
}

/** Legacy: list (keeps Dashboard or older components from breaking). */
export async function fetchJournals() {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("journals")
    .select("*")
    .eq("user_id", user_id)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((d) => ({
    ...d,
    plan: normalizePlan(d.plan),
    during: normalizeDuring(d.during),
    review: normalizeReview(d.review),
  }));
}

/** Delete by id. Uses RPC delete_journal if present, else direct delete (RLS). */
export async function deleteJournal(journalId) {
  const user_id = await getUserId();

  // Try secure RPC first (supports cascade into child tables, e.g. notes/media)
  const { error: rpcErr } = await supabase.rpc("delete_journal", {
    _journal_id: journalId,
    _user_id: user_id,
  });
  if (!rpcErr) return true;

  // Fallback – RLS still restricts to owner
  const { error } = await supabase
    .from("journals")
    .delete()
    .eq("id", journalId)
    .eq("user_id", user_id);

  if (error) throw error;
  return true;
}

/* ======================== Convenience helpers ======================== */

export async function getOrCreateJournal(date, scope = { accountId: null }) {
  const existing = await getJournal(date, scope);
  if (existing) return existing;
  return upsertJournal({ date, account_id: scope?.accountId ?? null, status: "draft" });
}

export async function updatePlan(date, scope, planPatch) {
  const current = (await getJournal(date, scope)) || emptyDoc(date, scope?.accountId ?? null);
  return upsertJournal({
    ...current,
    date,
    account_id: scope?.accountId ?? null,
    plan: { ...current.plan, ...normalizePlan(planPatch) },
  });
}

export async function updateReview(date, scope, reviewPatch) {
  const current = (await getJournal(date, scope)) || emptyDoc(date, scope?.accountId ?? null);
  return upsertJournal({
    ...current,
    date,
    account_id: scope?.accountId ?? null,
    review: { ...current.review, ...normalizeReview(reviewPatch) },
  });
}

export async function addDuringEvent(date, scope, event) {
  const current = (await getJournal(date, scope)) || emptyDoc(date, scope?.accountId ?? null);
  const safe = {
    time: String(event?.time ?? ""),
    text: String(event?.text ?? ""),
    tags: Array.isArray(event?.tags) ? event.tags.map(String) : [],
    mood: event?.mood ? String(event.mood) : "",
    media: Array.isArray(event?.media) ? event.media : [],
  };
  const next = { ...(current.during || { events: [] }) };
  next.events = [safe, ...(next.events || [])];
  return upsertJournal({ ...current, date, account_id: scope?.accountId ?? null, during: next });
}

export async function setJournalStatus(date, scope, status) {
  const s = oneOf(status, ["draft", "ready", "reviewed"], "draft");
  const current = (await getJournal(date, scope)) || emptyDoc(date, scope?.accountId ?? null);
  return upsertJournal({ ...current, date, account_id: scope?.accountId ?? null, status: s });
}

export async function listJournalsInRange(fromDate, toDate, scope = { accountId: null }) {
  const user_id = await getUserId();
  const account_id = scope?.accountId ?? null;

  let q = supabase
    .from("journals")
    .select("*")
    .eq("user_id", user_id)
    .gte("date", fromDate)
    .lte("date", toDate);

  q = account_id === null ? q.is("account_id", null) : q.eq("account_id", account_id);

  const { data, error } = await q.order("date", { ascending: true });
  if (error) throw error;

  return (data || []).map((d) => ({
    ...d,
    plan: normalizePlan(d.plan),
    during: normalizeDuring(d.during),
    review: normalizeReview(d.review),
  }));
}

/* ======================== Compatibility helpers ======================== */
/**
 * updateJournalFields(date, scope, patchOrPath, value?)
 * - If `patchOrPath` is an object: deep-merge into root {status, plan, during, review}
 * - If `patchOrPath` is a string (dot path), sets that path to `value`
 *   e.g. updateJournalFields(d, s, "plan.checklist.ready", true)
 */
export async function updateJournalFields(date, scope, patchOrPath, value) {
  const current = (await getJournal(date, scope)) || emptyDoc(date, scope?.accountId ?? null);
  let next = { ...current };

  if (typeof patchOrPath === "string") {
    next = setByPath(next, patchOrPath, value);
  } else if (isObj(patchOrPath)) {
    next = deepMergeAllowed(next, patchOrPath);
  } else {
    return current; // nothing to do
  }

  // Normalize before save
  next.status = oneOf(next.status, ["draft", "ready", "reviewed"], "draft");
  next.plan   = normalizePlan(next.plan);
  next.during = normalizeDuring(next.during);
  next.review = normalizeReview(next.review);

  return upsertJournal({
    ...next,
    date,
    account_id: scope?.accountId ?? null,
  });
}

/**
 * Optional legacy helper: update by primary key id (RLS still applies).
 * Only allows updating status/plan/during/review.
 */
export async function updateJournalById(id, patch) {
  const user_id = await getUserId();

  // Read current (to normalize + merge)
  const { data: cur, error: readErr } = await supabase
    .from("journals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user_id)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!cur) throw new Error("Journal not found");

  const merged = deepMergeAllowed(cur, patch);
  const row = {
    status: oneOf(merged.status, ["draft", "ready", "reviewed"], "draft"),
    plan: normalizePlan(merged.plan),
    during: normalizeDuring(merged.during),
    review: normalizeReview(merged.review),
  };

  const { data, error } = await supabase
    .from("journals")
    .update(row)
    .eq("id", id)
    .eq("user_id", user_id)
    .select()
    .maybeSingle();

  if (error) throw error;

  return {
    ...data,
    plan: normalizePlan(data.plan),
    during: normalizeDuring(data.during),
    review: normalizeReview(data.review),
  };
}

/* ======================== Small utils ======================== */

function setByPath(obj, path, val) {
  const keys = String(path).split(".").filter(Boolean);
  if (!keys.length) return obj;
  const copy = { ...obj };
  let cur = copy;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cur[k] = isObj(cur[k]) ? { ...cur[k] } : {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = val;
  return copy;
}

// Only allow merging of allowed top-level keys to prevent user_id/date/account_id edits
const ALLOWED_TOP = new Set(["status", "plan", "during", "review"]);
function deepMergeAllowed(base, patch) {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch || {})) {
    if (!ALLOWED_TOP.has(k)) continue;
    if (isObj(v) && isObj(out[k])) out[k] = deepMerge(out[k], v);
    else out[k] = v;
  }
  return out;
}
function deepMerge(a, b) {
  const o = { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    if (isObj(v) && isObj(o[k])) o[k] = deepMerge(o[k], v);
    else o[k] = v;
  }
  return o;
}
