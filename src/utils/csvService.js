import dayjs from "dayjs";

const toISO = (v) => {
  const d = dayjs(v);
  return d.isValid() ? d.toDate().toISOString() : null;
};

const hhmm = (v) => {
  const d = dayjs(v);
  return d.isValid() ? d.format("HH:mm") : "00:00";
};

const n = (v) => (v === "" || v == null ? 0 : Number(v));

const round = (v, dp = 4) => {
  const m = Math.pow(10, dp);
  return Math.round(Number(v) * m) / m;
};

export function transformCSVRowsToTrades(rows) {
  return (rows || []).map((row) => {
    const entry_time = toISO(row["EnteredAt"]);
    const exit_time  = toISO(row["ExitedAt"]);
    const symbol     = extractSymbol(row["ContractName"]);
    const direction  = String(row["Type"] || "Long");

    const gross_pnl = n(row["PnL"]);
    const fees      = n(row["Fees"]);
    const net_pnl   = round(gross_pnl - fees, 2); // ✅ always Net = Gross - Fees

    const date = dayjs(row["TradeDay"]).isValid()
      ? dayjs(row["TradeDay"]).format("YYYY-MM-DD")
      : (entry_time ? dayjs(entry_time).format("YYYY-MM-DD") : null);

    const entry_price = round(n(row["EntryPrice"]), 4);
    const exit_price  = round(n(row["ExitPrice"]), 4);
    const size        = n(row["Size"]);

    return {
      symbol,
      date,
      time: hhmm(row["EnteredAt"]),
      direction,
      size,
      entry_price,
      exit_price,
      // store both; UI and stats should use `pnl` (net) everywhere
      gross_pnl,
      fees,
      pnl: net_pnl,          // ✅ net, kept in sync with fees at import time
      duration: String(row["TradeDuration"] || ""),
      entry_time,
      exit_time,
      is_imported: true,
      source: "csv-import",
    };
  });
}

function extractSymbol(contractName = "") {
  const letters = String(contractName).match(/[A-Za-z]+/g);
  return letters ? letters[0].toUpperCase() : "SYM";
}

/**
 * Legacy key (your old scheme): symbol + entry_time + exit_time
 * Kept for compatibility with any existing DB helper you might be using.
 */
export function buildTradeKeyLegacy(t) {
  if (!t?.symbol || !t?.entry_time || !t?.exit_time) return null;
  return `${String(t.symbol).toUpperCase()}_${new Date(t.entry_time).toISOString()}_${new Date(t.exit_time).toISOString()}`;
}

/**
 * New, trims-safe fingerprint:
 * Includes direction + size + rounded prices so partial exits at the same times
 * are treated as distinct fills.
 * (Deliberately excludes PnL so fee edits don’t change identity.)
 */
export function buildTradeFingerprint(t) {
  if (!t?.symbol || !t?.entry_time || !t?.exit_time) return null;
  const sym = String(t.symbol).toUpperCase();
  const dir = String(t.direction || "Long").toUpperCase();
  const ent = new Date(t.entry_time).toISOString();
  const ext = new Date(t.exit_time).toISOString();
  const ep  = isFinite(t.entry_price) ? Number(t.entry_price).toFixed(4) : "0.0000";
  const xp  = isFinite(t.exit_price)  ? Number(t.exit_price).toFixed(4)  : "0.0000";
  const sz  = isFinite(t.size) ? String(Number(t.size)) : "0";
  return `${sym}_${dir}_${ent}_${ext}_${ep}_${xp}_${sz}`;
}
