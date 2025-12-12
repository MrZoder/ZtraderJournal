// src/utils/accountsService.js
import { supabase } from "./tradeService";

/**
 * If you used the JSONB migration (settings jsonb), set this to true.
 * If you added a dedicated column (payout_eligibility_mode text), leave as false.
 *
 * SQL for either option is in the migration I shared.
 */
const USE_JSONB_SETTINGS = false;

/** Event name used to notify UI that accounts changed */
export const ACCOUNTS_CHANGED_EVENT = "accounts:changed";

/** Dispatch a global event so listeners (e.g., AccountScopeSelect) can reload */
export function emitAccountsChanged() {
  if (typeof window !== "undefined" && window?.dispatchEvent) {
    window.dispatchEvent(new CustomEvent(ACCOUNTS_CHANGED_EVENT));
  }
}

/** Fetch user's accounts (sorted newest first) */
export async function fetchAccounts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Create a new account; is_real is derived from account_type */
export async function createAccount(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const type = payload.account_type || "";
  const is_real = type === "Funded" || type === "Personal";

  const row = {
    user_id: user.id,
    name: (payload.name || "").trim(),
    firm: payload.firm || null,
    account_type: type,      // 'Demo'|'Evaluation'|'Funded'|'Personal'
    currency: payload.currency || "USD",
    is_real,
  };

  // If you’re using the JSONB settings approach, seed a default:
  if (USE_JSONB_SETTINGS) {
    row.settings = { payout_eligibility_mode: "cycle" };
  }

  const { data, error } = await supabase
    .from("accounts")
    .insert(row)
    .select()
    .single();
  if (error) throw error;

  emitAccountsChanged();
  return data;
}

/** Rename / update fields */
export async function updateAccount(id, patch) {
  const safe = {
    name: patch.name?.trim(),
    firm: patch.firm ?? null,
    account_type: patch.account_type ?? undefined,
    currency: patch.currency ?? undefined,
  };

  // If type changes, keep is_real derived correctly
  if (typeof safe.account_type === "string") {
    safe.is_real = safe.account_type === "Funded" || safe.account_type === "Personal";
  }

  const { data, error } = await supabase
    .from("accounts")
    .update(safe)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  emitAccountsChanged();
  return data;
}

/** Delete account; cascades through RLS-permitted relations as configured */
export async function deleteAccount(id) {
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id);
  if (error) throw error;

  emitAccountsChanged();
  return true;
}

/* =======================================================================
   Payout Eligibility Mode (per account, DB-backed)
   - getAccountSettings(accountId) -> { payout_eligibility_mode: 'cycle'|'rolling' }
   - updateAccountSettings(accountId, { payout_eligibility_mode })
   ======================================================================= */

export async function getAccountSettings(accountId) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!user) throw new Error("Not authenticated");

  if (!accountId) {
    // Defensive default if the UI hasn't selected an account yet
    return { payout_eligibility_mode: "cycle" };
  }

  const cols = USE_JSONB_SETTINGS ? "id, settings" : "id, payout_eligibility_mode";
  const { data, error } = await supabase
    .from("accounts")
    .select(cols)
    .eq("id", accountId)
    .single();

  if (error) throw error;

  if (USE_JSONB_SETTINGS) {
    const mode = data?.settings?.payout_eligibility_mode || "cycle";
    return { payout_eligibility_mode: mode };
  } else {
    const mode = data?.payout_eligibility_mode || "cycle";
    return { payout_eligibility_mode: mode };
  }
}

export async function updateAccountSettings(accountId, patch) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!user) throw new Error("Not authenticated");

  if (!accountId) throw new Error("Missing accountId");

  // Validate incoming mode
  const nextMode = patch?.payout_eligibility_mode === "rolling" ? "rolling" : "cycle";

  if (USE_JSONB_SETTINGS) {
    // Two-step merge: read current settings then update JSONB
    const { data: cur, error: readErr } = await supabase
      .from("accounts")
      .select("settings")
      .eq("id", accountId)
      .single();
    if (readErr) throw readErr;

    const merged = {
      ...(cur?.settings || {}),
      payout_eligibility_mode: nextMode,
    };

    const { error: updErr } = await supabase
      .from("accounts")
      .update({ settings: merged })
      .eq("id", accountId);
    if (updErr) throw updErr;

    emitAccountsChanged();
    return { payout_eligibility_mode: nextMode };
  } else {
    // Simple column update
    const { error } = await supabase
      .from("accounts")
      .update({ payout_eligibility_mode: nextMode })
      .eq("id", accountId);
    if (error) throw error;

    emitAccountsChanged();
    return { payout_eligibility_mode: nextMode };
  }
}
