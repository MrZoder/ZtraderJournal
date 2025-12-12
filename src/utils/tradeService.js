// src/utils/tradeService.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET_IMAGES || "trade-images").trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* -------------------------------------------------------
   Small helpers (uploads / parsing)
------------------------------------------------------- */
const isHttpUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const isDataUri = (s) => typeof s === "string" && s.startsWith("data:image/");

function dataUriToBlob(dataUri) {
  const i = dataUri.indexOf(",");
  const meta = dataUri.slice(0, i);
  const base64 = dataUri.slice(i + 1);
  const mime = (meta.match(/^data:([^;]+)/i)?.[1]) || "image/png";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
  return { blob: new Blob([bytes], { type: mime }), mime };
}
const extFromMime = (mime) =>
  ({
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  }[mime] || "png");

/** Parse a Supabase Storage URL (public OR signed) -> path within our BUCKET (or null) */
export function storagePathFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    // URL looks like: /storage/v1/object/sign/<project-ref>/<bucket>/<path...>
    // or:            /storage/v1/object/public/<project-ref>/<bucket>/<path...>
    const objectIdx = parts.findIndex((p) => p === "object");
    if (objectIdx === -1) return null;
    // parts: ['storage','v1','object','sign', '<project-ref>', '<bucket>', ...pathParts]
    const bucket = parts[objectIdx + 2];
    if (!bucket || decodeURIComponent(bucket) !== BUCKET) return null;
    const pathParts = parts.slice(objectIdx + 3);
    return decodeURIComponent(pathParts.join("/")) || null;
  } catch {
    return null;
  }
}

/** Create a short-lived signed URL for a path in our BUCKET */
async function getDisplayableUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data?.signedUrl || null;
}

/** Upload to exact path (upsert) and return signed URL */
async function uploadToExactPath(path, blob, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType,
    upsert: true,
    cacheControl: "0",
  });
  if (error) throw error;
  return await getDisplayableUrl(path);
}

/* -------------------------------------------------------
   Auth
------------------------------------------------------- */
async function getCurrentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/* -------------------------------------------------------
   Schema coercion / whitelist
------------------------------------------------------- */
const NUMERIC_COLS = new Set([
  "pnl", "rr", "fees", "entry_price", "exit_price",
  "gross_pnl",
]);
const INT_COLS = new Set(["size", "contracts"]);

function toNumberOrNull(v, isInt = false) {
  if (v === "" || v === undefined || v === null) return null;
  const n = isInt ? parseInt(v, 10) : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
const round2 = (v) => (v == null ? null : Math.round(Number(v) * 100) / 100);

const ALLOWED_COLUMNS = new Set([
  // core
  "user_id", "date", "time", "symbol", "pnl", "rr",
  "created_at", "updated_at",
  // jsonb + extras
  "details", "emotions", "lessons", "setup",
  // media
  "image_url",
  // misc
  "rating", "emotion", "followedPlan", "contracts", "accountType",
  // timing
  "entry_time", "exit_time", "duration",
  // numbers
  "fees", "entry_price", "exit_price", "size", "gross_pnl",
  // enums/strings
  "direction",
  // flags
  "is_imported",
  // arrays
  "tags",
  // new links
  "account_id",
  // broker link
  "broker_trade_id",
]);

/**
 * Normalize and DERIVE pnl from (gross_pnl - fees) if possible.
 * Backward-compatible with legacy rows that only had `pnl`.
 */
function normalizeToSchema(obj, user_id) {
  const p = { ...obj, user_id };

  // symbol uppercase
  if (p.symbol != null) p.symbol = String(p.symbol).toUpperCase();

  // coerce numerics
  for (const key of Object.keys(p)) {
    if (NUMERIC_COLS.has(key)) p[key] = toNumberOrNull(p[key], false);
    if (INT_COLS.has(key))     p[key] = toNumberOrNull(p[key], true);
  }

  // derive net/gross
  let gross = p.gross_pnl;
  let fees  = p.fees;
  let net   = p.pnl;

  if (gross != null && fees != null) {
    net = round2(gross - fees);
  } else if (net != null && fees != null && gross == null) {
    gross = round2(net + fees);
  } else if (gross != null && fees == null && net == null) {
    net = round2(gross);
  } else if (net != null && fees == null && gross == null) {
    gross = round2(net);
  }
  p.gross_pnl = gross;
  p.fees      = fees;
  p.pnl       = net;

  // tags -> text[]
  if (Array.isArray(p.tags)) {
    p.tags = p.tags.filter(Boolean);
  } else if (typeof p.tags === "string") {
    p.tags = p.tags.split(",").map((t) => t.trim()).filter(Boolean);
  } else if (!p.tags) {
    p.tags = [];
  }

  // image column harmonize
  if (!p.image_url) {
    p.image_url = p.screenshot_url || p.screenshotUrl || p.screenshot || null;
  }
  delete p.screenshot_url;
  delete p.screenshotUrl;
  delete p.screenshot;

  // move notes/session into details.*
  const details = { ...(p.details || {}) };
  if (p.notes   != null) { details.notes   = p.notes;   delete p.notes; }
  if (p.session != null) { details.session = p.session; delete p.session; }
  if (Object.keys(details).length) p.details = details;

  // whitelist
  for (const key of Object.keys(p)) {
    if (!ALLOWED_COLUMNS.has(key)) delete p[key];
  }
  return p;
}

/* -------------------------------------------------------
   Public: upload/replace screenshot
------------------------------------------------------- */
export async function uploadTradeImage(input, opts = {}) {
  const user_id = await getCurrentUserId();
  const previousUrl = opts.previousUrl || null;

  if (typeof input === "string" && isHttpUrl(input) && !isDataUri(input)) {
    // For http(s) non-data URIs, if it's our storage signed URL, re-sign to refresh.
    const maybePath = storagePathFromUrl(input);
    if (maybePath) {
      return await getDisplayableUrl(maybePath);
    }
    // otherwise just store the external URL
    return input;
  }

  let blob, contentType;
  if (typeof input === "string" && isDataUri(input)) {
    const conv = dataUriToBlob(input);
    blob = conv.blob; contentType = conv.mime;
  } else if (input instanceof File || input instanceof Blob) {
    blob = input; contentType = input.type || "image/png";
  } else {
    return null;
  }

  // If we know the previous path and it's under the same user, overwrite in-place
  const prevPath = previousUrl ? storagePathFromUrl(previousUrl) : null;
  if (prevPath && prevPath.startsWith(`${user_id}/`)) {
    return await uploadToExactPath(prevPath, blob, contentType);
  }

  // New object: user_id/<ts>.<ext>
  const ext = extFromMime(contentType);
  const newPath = `${user_id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(newPath, blob, {
    contentType, upsert: false, cacheControl: "0",
  });
  if (error) throw error;
  return await getDisplayableUrl(newPath);
}

/* -------------------------------------------------------
   Images: self-heal signed URLs
------------------------------------------------------- */
/**
 * Return a fresh signed URL for a storage path or an existing Supabase storage URL.
 * Non-supabase http(s) URLs are returned as-is.
 */
export async function ensureSignedImageUrl(urlOrPath) {
  // Already an http(s) URL?
  if (typeof urlOrPath === "string" && /^https?:\/\//i.test(urlOrPath)) {
    const maybePath = storagePathFromUrl(urlOrPath);
    if (!maybePath) return urlOrPath; // external URL, not our storage
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(maybePath, 60 * 60);
    if (error) throw error;
    return data?.signedUrl || urlOrPath;
  }
  // It's a raw storage path
  if (typeof urlOrPath === "string") {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(urlOrPath, 60 * 60);
    if (error) throw error;
    return data?.signedUrl || urlOrPath;
  }
  return "";
}

/** Compat shim for older components */
export function displayUrlForImage(url) {
  return typeof url === "string" ? url : "";
}

/* -------------------------------------------------------
   CRUD
------------------------------------------------------- */
export async function fetchTrades(scope = {}) {
  const { accountId } = scope;

  let query = supabase
    .from("trades")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  if (accountId) {
    // Scope to a single account
    query = query.eq("account_id", accountId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addTrade(obj) {
  const user_id = await getCurrentUserId();
  const pl = normalizeToSchema(obj, user_id);
  const { data, error } = await supabase.from("trades").insert(pl).select().single();
  if (error) throw error;
  return data;
}

export async function updateTrade(id, obj) {
  const user_id = await getCurrentUserId();
  const pl = normalizeToSchema(obj, user_id);
  const { data, error } = await supabase.from("trades").update(pl).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTrade(id) {
  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllTrades() {
  const user_id = await getCurrentUserId();
  const { error } = await supabase.from("trades").delete().eq("user_id", user_id);
  if (error) throw error;
}

/* -------------------------------------------------------
   Trims-safe fingerprints for import de-dupe
------------------------------------------------------- */
export function buildServerFingerprint(t) {
  if (!t?.symbol || !t?.entry_time || !t?.exit_time) return null;
  const sym = String(t.symbol).toUpperCase();
  const dir = String(t.direction || "Long").toUpperCase();
  const ent = new Date(t.entry_time).toISOString();
  const ext = new Date(t.exit_time).toISOString();
  const ep  = Number.isFinite(t.entry_price) ? Number(t.entry_price).toFixed(4) : "0.0000";
  const xp  = Number.isFinite(t.exit_price)  ? Number(t.exit_price).toFixed(4)  : "0.0000";
  const sz  = Number.isFinite(t.size) ? String(Number(t.size)) : "0";
  return `${sym}_${dir}_${ent}_${ext}_${ep}_${xp}_${sz}`;
}

export async function getExistingTradeKeys() {
  const user_id = await getCurrentUserId();
  const { data, error } = await supabase
    .from("trades")
    .select("symbol, direction, entry_time, exit_time, entry_price, exit_price, size")
    .eq("user_id", user_id);
  if (error) throw error;

  return (data || []).map(buildServerFingerprint).filter(Boolean);
}

/**
 * Upsert list with server/client de-dupe.
 * Matches DB unique: (user_id, symbol, direction, entry_time, exit_time, entry_price, exit_price, size)
 */
export async function addMultipleTrades(list) {
  const user_id = await getCurrentUserId();
  const payload = (list || [])
    .filter((t) => t && t.symbol && t.entry_time && t.exit_time)
    .map((t) => normalizeToSchema(t, user_id));

  if (!payload.length) return [];

  // Client-side batch de-dupe by fingerprint
  const seen = new Set();
  const filtered = [];
  for (const t of payload) {
    const fp = buildServerFingerprint(t);
    if (!fp || seen.has(fp)) continue;
    seen.add(fp);
    filtered.push(t);
  }
  if (!filtered.length) return [];

  try {
    const { data, error } = await supabase
      .from("trades")
      .upsert(filtered, {
        onConflict: "user_id,symbol,direction,entry_time,exit_time,entry_price,exit_price,size",
        ignoreDuplicates: true,
      })
      .select();
    if (error) throw error;
    return data || [];
  } catch (e) {
    if (e?.code === "42P10") {
      const { data, error } = await supabase.from("trades").insert(filtered).select();
      if (error) throw error;
      return data || [];
    }
    throw e;
  }
}
