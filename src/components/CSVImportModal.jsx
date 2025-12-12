import React, { useState } from "react";
import { X, FileUp, Loader, Info } from "lucide-react";
import Papa from "papaparse";
import { toast } from "react-hot-toast";
import { addMultipleTrades, getExistingTradeKeys  } from "../utils/tradeService";
import { transformCSVRowsToTrades, buildTradeFingerprint, buildTradeKeyLegacy } from "../utils/csvService";

export default function CSVImportModal({ isOpen, onClose, refresh }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [dupCount, setDupCount] = useState(0);

  const parse = (file) =>
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const mapped = transformCSVRowsToTrades(res.data);
        setRows(mapped);
        setDupCount(0);
        toast.success(`Parsed ${mapped.length} row(s)`);
      },
      error: () => toast.error("Failed to parse CSV"),
    });

  const handleImport = async () => {
  if (!rows.length) return;
  setLoading(true);
  try {
    // 1) existing in DB (fingerprints)
    const existingFPs = await getExistingTradeKeys();
    const existingSet = new Set(existingFPs);

    // 2) batch de-dupe (fingerprint) + count reasons
    const batchSet = new Set();
    const deduped = [];
    let skippedExisting = 0;
    let skippedBatch = 0;
    let skippedInvalid = 0;

    for (const t of rows) {
      const fp = buildTradeFingerprint(t);
      if (!fp) { skippedInvalid++; continue; }
      if (existingSet.has(fp)) { skippedExisting++; continue; }
      if (batchSet.has(fp))    { skippedBatch++;    continue; }
      batchSet.add(fp);
      deduped.push(t);
    }

    if (!deduped.length) {
      setDupCount(skippedExisting + skippedBatch + skippedInvalid);
      toast.error("All rows were duplicates/invalid — nothing to import.");
      return;
    }

    // 3) insert with server upsert (now aligned to fingerprint columns)
    await addMultipleTrades(deduped);

    // 4) toasts
    toast.success(`Imported ${deduped.length} trade(s)`);
    const totalSkipped = skippedExisting + skippedBatch + skippedInvalid;
    if (totalSkipped > 0) {
      setDupCount(totalSkipped);
      const parts = [];
      if (skippedExisting) parts.push(`${skippedExisting} existing`);
      if (skippedBatch)    parts.push(`${skippedBatch} duplicates in file`);
      if (skippedInvalid)  parts.push(`${skippedInvalid} invalid`);
      toast(`Skipped ${totalSkipped}: ${parts.join(" • ")}`, { icon: "⚠️" });
    }

    refresh?.();
    setRows([]);
    setFileKey((k) => k + 1);
    onClose();
  } catch (e) {
    console.error(e);
    // Friendly 23505 just in case someone still has an older addMultipleTrades:
    if (e?.code === "23505") {
      toast("Some rows were already in your account (duplicates skipped).", { icon: "⚠️" });
    } else {
      toast.error("Import failed");
    }
  } finally {
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900 p-6 text-white shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 hover:bg-white/5">
          <X className="text-zinc-400" size={18} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <FileUp size={22} />
          <h2 className="text-xl font-bold">Import Trades from CSV</h2>
        </div>

        {dupCount > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200">
            <Info size={16} className="mt-0.5" />
            <p className="text-sm">
              Skipped <b>{dupCount}</b> duplicate/invalid row(s). De-dup uses a fills fingerprint:
              <b> symbol + direction + entry/exit time + entry/exit price + size</b>.
            </p>
          </div>
        )}

        <div className="mb-6">
          <input
            key={fileKey}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && parse(e.target.files[0])}
            className="w-full rounded-lg border border-white/10 bg-zinc-800 p-2 text-sm file:mr-4 file:rounded-md file:border-none file:bg-zinc-700 file:px-4 file:py-2 file:text-white"
          />
        </div>

        {rows.length > 0 && (
          <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-800/70 text-left text-zinc-400">
                <tr>
                  {["Symbol", "Dir", "Size", "EntryPx", "ExitPx", "Gross", "Fees", "Net", "EntryTime", "ExitTime"].map((h) => (
                    <th key={h} className="px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.slice(0, 12).map((t, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{t.symbol}</td>
                    <td className="px-3 py-2">{t.direction}</td>
                    <td className="px-3 py-2">{t.size}</td>
                    <td className="px-3 py-2">{t.entry_price}</td>
                    <td className="px-3 py-2">{t.exit_price}</td>
                    <td className="px-3 py-2">{t.gross_pnl}</td>
                    <td className="px-3 py-2">{t.fees}</td>
                    <td className="px-3 py-2 font-semibold">{t.pnl}</td>
                    <td className="px-3 py-2">{t.entry_time?.slice(0,19).replace("T"," ") || "-"}</td>
                    <td className="px-3 py-2">{t.exit_time?.slice(0,19).replace("T"," ") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-3 py-2 text-xs italic text-zinc-500">
              Showing first {Math.min(12, rows.length)} of {rows.length} rows.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg bg-zinc-700 px-4 py-2 text-white hover:bg-zinc-600">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !rows.length}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading && <Loader className="animate-spin" size={16} />}
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
