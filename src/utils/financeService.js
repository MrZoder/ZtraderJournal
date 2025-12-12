// src/utils/financeService.js
import { supabase } from "./tradeService";

/** =========================
 *  Payouts (scoped)
 *  ========================= */
export async function fetchPayouts(scope = { accountId: null }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let q = supabase
    .from("payouts")
    .select("*")
    .eq("user_id", user.id);

  if (scope?.accountId) q = q.eq("account_id", scope.accountId);

  const { data, error } = await q
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addPayout(payload, scope = { accountId: null }) {
  // payload: { date (YYYY-MM-DD), amount (number), source?, notes?, account_id? }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const row = {
    user_id: user.id,
    date: payload.date,
    amount: Number(payload.amount),
    source: payload.source || null,
    notes: payload.notes || null,
    account_id: payload.account_id ?? scope.accountId ?? null,
    // keep legacy text for now if you want: account_type: payload.account_type ?? null,
  };

  const { data, error } = await supabase.from("payouts").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function deletePayout(id) {
  const { error } = await supabase.from("payouts").delete().eq("id", id);
  if (error) throw error;
}

/** =========================
 *  Helpers / KPIs
 *  ========================= */

// Given trades (already scoped) compute winning days over trailing window
export function computeWinningDays(trades, windowDays = 14) {
  const byDay = new Map(); // ISO date -> pnl sum
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);

  for (const t of (trades || [])) {
    if (!t?.date) continue;
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime()) || d < cutoff) continue;
    const key = d.toISOString().slice(0, 10);
    const pnl = Number.parseFloat(t.pnl) || 0;
    byDay.set(key, (byDay.get(key) || 0) + pnl);
  }

  let wins = 0;
  for (const val of byDay.values()) {
    if (val > 0) wins += 1;
  }
  return { wins, totalDaysConsidered: byDay.size };
}

export function isEligibleForPayout(trades, opts = { windowDays: 14, requiredWinningDays: 5 }) {
  const windowDays = opts.windowDays ?? 14;
  const requiredWinningDays = opts.requiredWinningDays ?? 5;
  const { wins } = computeWinningDays(trades, windowDays);
  return {
    windowDays,
    requiredWinningDays,
    wins,
    eligible: wins >= requiredWinningDays
  };
}

export function kpisFromPayouts(payouts, grossPnl = 0) {
  const sum = (rows) => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const now = new Date();
  const year = now.getUTCFullYear();

  const ytd = payouts.filter((p) => {
    if (!p?.date) return false;
    const d = new Date(p.date);
    return d.getUTCFullYear() === year;
  });

  const last30 = payouts.filter((p) => {
    if (!p?.date) return false;
    const d = new Date(p.date);
    return (now - d) / (1000 * 60 * 60 * 24) <= 30;
  });

  const total = sum(payouts);
  const ytdSum = sum(ytd);
  const l30 = sum(last30);
  const avg = payouts.length ? total / payouts.length : 0;

  // new: net after payouts
  const net = grossPnl - total;

  return { total, ytd: ytdSum, last30: l30, avg, net };
}
