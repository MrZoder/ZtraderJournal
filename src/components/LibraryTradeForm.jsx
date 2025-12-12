// src/components/LibraryTradeForm.jsx
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";

export default function LibraryTradeForm({
  existingTrade,   // if editing, this is an object; otherwise null
  onSave,          // callback: (tradeObj) => Promise
  onClose          // callback to close panel
}) {
  // 1) Local form state
  const [form, setForm] = useState({
    date:    dayjs().format("YYYY-MM-DD"),
    time:    dayjs().format("HH:mm"),
    symbol:  "",
    pnl:     "",
    rr:      "",
    rating:  "",
    emotion: "",
    image:   ""    // Base64 or empty
  });

  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  // 2) If editing, preload fields
  useEffect(() => {
    if (!existingTrade) return;

    setForm({
      date:    existingTrade.date,
      time:    existingTrade.time,
      symbol:  existingTrade.symbol,
      pnl:     existingTrade.pnl != null ? existingTrade.pnl.toString() : "",
      rr:      existingTrade.rr != null ? existingTrade.rr.toString() : "",
      rating:  existingTrade.rating || "",
      emotion: existingTrade.emotion || "",
      image:   existingTrade.image_url || ""
    });
    setPreview(existingTrade.image_url || "");
  }, [existingTrade]);

  // 3) Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // File upload → store Base64 in form.image
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setForm((f) => ({ ...f, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Paste image (Ctrl+V)
  const handlePaste = (e) => {
    if (!e.clipboardData) return;
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      const item = e.clipboardData.items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result);
          setForm((f) => ({ ...f, image: reader.result }));
        };
        reader.readAsDataURL(file);
        e.preventDefault();
        break;
      }
    }
  };

  const removeImage = () => {
    setPreview("");
    setForm((f) => ({ ...f, image: "" }));
  };

  // 4) Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!form.date || !form.time || !form.symbol.trim() || !form.pnl) {
      setError("Date, Time, Symbol, and P&L are required.");
      return;
    }

    // Build minimal trade object
    const tradeObj = {
      date:      form.date,
      time:      form.time,
      symbol:    form.symbol.trim().toUpperCase(),
      pnl:       parseFloat(form.pnl),
      rr:        form.rr ? parseFloat(form.rr) : null,
      rating:    form.rating || null,
      emotion:   form.emotion || null,
      image_url: form.image || null
    };

    onSave(tradeObj); 
    // Note: onSave can be: 
    //   if existingTrade → updateTrade(existingTrade.id, tradeObj)
    //   else               → addTrade(tradeObj)
  };

  return (
    <div
      className="
        max-w-md w-full h-[90vh] overflow-y-auto
        slidepanel-scroll no-scrollbar p-6
        bg-[rgba(39,118,255,0.3)] panel rounded-2xl
      "
      onPaste={handlePaste}
    >
      {/* Error banner */}
      {error && (
        <p className="mb-4 text-center text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-white">
        {/* Date / Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-muted">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="mt-1 w-full bg-zinc-800 text-white rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted">Time</label>
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              className="mt-1 w-full bg-zinc-800 text-white rounded-lg p-2"
              required
            />
          </div>
        </div>

        {/* Symbol / P&L */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-muted">Symbol</label>
            <input
              type="text"
              name="symbol"
              value={form.symbol}
              onChange={handleChange}
              className="mt-1 w-full bg-zinc-800 text-white rounded-lg p-2"
              placeholder="e.g. AAPL"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted">P&L</label>
            <input
              type="number"
              step="0.01"
              name="pnl"
              value={form.pnl}
              onChange={handleChange}
              className="mt-1 w-full bg-zinc-800 text-white rounded-lg p-2"
              required
            />
          </div>
        </div>

        {/* R/R / Rating / Emotion */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-text-muted">R/R</label>
            <input
              type="number"
              step="0.01"
              name="rr"
              value={form.rr}
              onChange={handleChange}
              className="mt-1 w-full bg-zinc-800 text-white rounded-lg p-2"
              placeholder="optional"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted">Rating</label>
            <select
              name="rating"
              value={form.rating}
              onChange={handleChange}
              className="mt-1 w-full bg-zinc-800 text-white rounded-lg p-2"
            >
              <option value="">Select</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-muted">Emotion</label>
            <select
              name="emotion"
              value={form.emotion}
              onChange={handleChange}
              className="mt-1 w-full bg-zinc-800 text-white rounded-lg p-2"
            >
              <option value="">Select</option>
              <option value="Calm">Calm</option>
              <option value="Anxious">Anxious</option>
              <option value="Confident">Confident</option>
              <option value="Frustrated">Frustrated</option>
            </select>
          </div>
        </div>

        {/* Screenshot Upload/Paste */}
        <div>
          <label className="block text-sm text-text-muted">
            Screenshot (upload or paste)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="mt-1 text-sm text-zinc-200"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Or paste image here (Ctrl+V)
          </p>
          {preview && (
            <div className="mt-2 relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-40 object-cover rounded-lg border border-zinc-700"
              />
              <button
                type="button"
                onClick={removeImage}
                className="
                  absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70
                  text-red-400 rounded transition
                "
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-700 rounded text-text-base hover:bg-zinc-600 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition"
          >
            {existingTrade ? "Update Trade" : "Save Trade"}
          </button>
        </div>
      </form>
    </div>
  );
}
