// src/utils/ruleService.js
// Backward-compatible Daily Rules API, now backed by `journals` table.
// Keeps the old function names/signatures used by DailyRules.jsx.

import dayjs from "dayjs";
import { supabase } from "./tradeService"; // for history helpers
import { getJournal, updateJournalFields } from "./journalService";

/* ------------------------------- utils ------------------------------- */

const iso = (d) =>
  d && /^\d{4}-\d{2}-\d{2}$/.test(String(d))
    ? d
    : dayjs(d || undefined).format("YYYY-MM-DD");

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

// Normalize what we store in journals.plan.rules
// Internally we prefer { id, text, pinned, done, streak }
function toInternalRules(rules) {
  return ensureArray(rules)
    .map((r) => {
      if (!r) return null;
      const id = String(r.id || `r_${Math.random().toString(36).slice(2, 10)}`);
      const text = String(r.text || "");
      // accept either 'completed' (old) or 'done' (new)
      const done = typeof r.done === "boolean" ? r.done : !!r.completed;
      const pinned = !!r.pinned;
      const streak = Number.isFinite(r.streak) ? r.streak : 0;
      return { id, text, pinned, done, streak };
    })
    .filter(Boolean);
}

// Normalize what we return to UI (back-compat):
// UI expects { id, text, completed, streak }, we also include pinned + done for newer code.
function toUiRules(internal) {
  return ensureArray(internal).map((r) => ({
    id: r.id,
    text: r.text,
    completed: !!r.done,        // legacy prop
    done: !!r.done,             // new prop (safe to keep)
    pinned: !!r.pinned,
    streak: Number.isFinite(r.streak) ? r.streak : 0,
  }));
}

/* ----------------------------- public API ---------------------------- */
/**
 * getDailyRules(dateKey, userId?)
 * Returns: { rules: Rule[], plan: string, reflection: string }
 * - rules are read from journals.plan.rules
 * - plan is read from journals.plan.planNote (string) if present (fallback "")
 * - reflection is read from journals.review.reflection (string) if present (fallback "")
 */
export async function getDailyRules(dateKey, _userId) {
  const date = iso(dateKey);
  const doc = (await getJournal(date, { accountId: null })) || null;

  const rulesInternal = doc?.plan?.rules || [];
  const rules = toUiRules(rulesInternal);

  const plan =
    typeof doc?.plan?.planNote === "string"
      ? doc.plan.planNote
      : typeof doc?.plan?.planText === "string"
      ? doc.plan.planText
      : "";

  const reflection =
    typeof doc?.review?.reflection === "string" ? doc.review.reflection : "";

  // Always return at least one empty rule (to keep your UI stable)
  const safeRules =
    rules.length > 0
      ? rules
      : [
          {
            id: `r_${Math.random().toString(36).slice(2, 10)}`,
            text: "",
            completed: false,
            done: false,
            pinned: false,
            streak: 0,
          },
        ];

  return { rules: safeRules, plan, reflection };
}

/**
 * saveDailyRules(dateKey, userId?, { rules, plan, reflection })
 * - Writes rules -> journals.plan.rules
 * - Writes plan (string) -> journals.plan.planNote
 * - Writes reflection (string) -> journals.review.reflection
 */
export async function saveDailyRules(
  dateKey,
  _userId,
  { rules, plan = "", reflection = "" }
) {
  const date = iso(dateKey);

  const rulesInternal = toInternalRules(rules);

  // We do a *field-merge* into journals JSON to avoid clobbering other plan/review fields.
  const patch = {
    plan: {
      rules: rulesInternal,
      planNote: String(plan || ""),
    },
    review: {
      reflection: String(reflection || ""),
    },
  };

  // updateJournalFields(date, scope, patch) merges JSONB server-side
  await updateJournalFields(date, { accountId: null }, patch);
  return true;
}

/* -------------------------- optional helpers ------------------------- */
/**
 * getRuleHistory(pastDays = 7)
 * Return recent days with their rules from journals table.
 * [{ date: 'YYYY-MM-DD', rules: [...] }, ...]
 */
export async function getRuleHistory(pastDays = 7) {
  const start = dayjs().subtract(pastDays, "day").format("YYYY-MM-DD");

  // Only select what we need; RLS will scope to current user
  const { data, error } = await supabase
    .from("journals")
    .select("date, plan")
    .gte("date", start)
    .order("date", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    date: row.date,
    rules: toUiRules(row?.plan?.rules || []),
  }));
}

/**
 * deleteOldRules(maxAgeDays = 30)
 * No-op in the new design (you likely want to keep journals).
 * Kept for backward compatibility; it won't throw.
 */
export async function deleteOldRules(_maxAgeDays = 30) {
  return true;
}

/* --------------------- convenience helper actions -------------------- */
// Optional helpers if your UI pins/toggles items directly via this module
export async function pinDailyRule(dateKey, id, pinned = true) {
  const cur = await getDailyRules(dateKey);
  const next = cur.rules.map((r) => (r.id === id ? { ...r, pinned: !!pinned } : r));
  await saveDailyRules(dateKey, null, {
    rules: next,
    plan: cur.plan,
    reflection: cur.reflection,
  });
}

export async function toggleDailyRuleDone(dateKey, id) {
  const cur = await getDailyRules(dateKey);
  const next = cur.rules.map((r) =>
    r.id === id
      ? { ...r, completed: !r.completed, done: !r.done }
      : r
  );
  await saveDailyRules(dateKey, null, {
    rules: next,
    plan: cur.plan,
    reflection: cur.reflection,
  });
}
