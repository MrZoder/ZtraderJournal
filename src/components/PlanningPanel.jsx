import React from "react";

const GOALS = [
  "Only A+ Setups",
  "No Overtrading",
  "Respect Stop Loss",
  "High Patience",
  "Exit at Targets",
];

const get = (obj, path, fallback) =>
  path.split(".").reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), obj) ?? fallback;

const setDeep = (obj, path, value) => {
  const parts = path.split(".");
  const clone = { ...(obj || {}) };
  let curr = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    curr[p] = { ...(curr[p] || {}) };
    curr = curr[p];
  }
  curr[parts[parts.length - 1]] = value;
  return clone;
};

export default function PlanningPanel({ data = {}, onChange }) {
  // Safe defaults so it works even if JournalPage isn't updated yet
  const checklist = get(data, "checklist", {
    reviewedNews: false,
    plannedSetups: false,
    riskLimitsSet: false,
    mindsetClear: false,
  });
  const riskBox = get(data, "riskBox", {
    maxRisk: "",
    maxTrades: "",
    maxLoss: "",
    notes: "",
  });
  const keyLevels = get(data, "keyLevels", [{ label: "", value: "" }]);
  const focusGoal = get(data, "focusGoal", "");

  const push = (path, value) => onChange?.(setDeep(data, path, value));

  const toggleChecklist = (key) => push("checklist", { ...checklist, [key]: !checklist[key] });
  const updateRisk = (key, value) => push("riskBox", { ...riskBox, [key]: value });

  const updateKeyLevel = (index, field, value) => {
    const next = [...keyLevels];
    next[index] = { ...(next[index] || {}), [field]: value };
    push("keyLevels", next);
  };
  const addKeyLevel = () => keyLevels.length < 4 && push("keyLevels", [...keyLevels, { label: "", value: "" }]);
  const removeKeyLevel = (index) => {
    const next = keyLevels.filter((_, i) => i !== index);
    push("keyLevels", next.length ? next : [{ label: "", value: "" }]);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Focus Goal */}
      <section>
        <h3 className="text-lg font-bold text-teal-300 mb-1">Today's Focus</h3>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => push("focusGoal", g)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                focusGoal === g ? "bg-teal-500 text-gray-900" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* Desktop-only INTERNAL scroll area */}
      <div className="overflow-visible md:overflow-auto md:max-h-[520px] md:pr-2 scroll-area rounded-xl">
        <div className="space-y-6">
          {/* Pre-Market Checklist */}
          <section>
            <h3 className="text-lg font-bold text-teal-300 mb-1">Pre-Market Checklist</h3>
            <div className="space-y-2">
              {Object.entries(checklist).map(([key, val]) => (
                <label key={key} className="flex items-center space-x-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!val}
                    onChange={() => toggleChecklist(key)}
                    className="w-4 h-4 text-teal-500 bg-gray-800 rounded border-gray-600"
                  />
                  <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Risk Management Box */}
          <section>
            <h3 className="text-lg font-bold text-teal-300 mb-1">Risk Plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Max Risk ($)"
                className="bg-[#141a21] border border-teal-700 px-3 py-2 rounded-lg text-sm text-teal-300"
                value={riskBox.maxRisk || ""}
                onChange={(e) => updateRisk("maxRisk", e.target.value)}
              />
              <input
                type="text"
                placeholder="Max Trades"
                className="bg-[#141a21] border border-teal-700 px-3 py-2 rounded-lg text-sm text-teal-300"
                value={riskBox.maxTrades || ""}
                onChange={(e) => updateRisk("maxTrades", e.target.value)}
              />
              <input
                type="text"
                placeholder="Max Loss ($)"
                className="bg-[#141a21] border border-teal-700 px-3 py-2 rounded-lg text-sm text-teal-300"
                value={riskBox.maxLoss || ""}
                onChange={(e) => updateRisk("maxLoss", e.target.value)}
              />
              <input
                type="text"
                placeholder="Other Notes"
                className="bg-[#141a21] border border-teal-700 px-3 py-2 rounded-lg text-sm text-teal-300"
                value={riskBox.notes || ""}
                onChange={(e) => updateRisk("notes", e.target.value)}
              />
            </div>
          </section>

          {/* Key Levels */}
          <section>
            <h3 className="text-lg font-bold text-teal-300 mb-1">Key Levels</h3>
            <div className="space-y-2">
              {keyLevels.map((kl, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Label"
                    value={kl?.label || ""}
                    onChange={(e) => updateKeyLevel(i, "label", e.target.value)}
                    className="bg-[#141a21] border border-teal-700 px-3 py-2 rounded-lg text-sm text-gray-200 w-1/2"
                  />
                  <input
                    type="text"
                    placeholder="Price"
                    value={kl?.value || ""}
                    onChange={(e) => updateKeyLevel(i, "value", e.target.value)}
                    className="bg-[#141a21] border border-teal-700 px-3 py-2 rounded-lg text-sm text-gray-200 w-1/2"
                  />
                  {keyLevels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKeyLevel(i)}
                      className="text-red-400 hover:text-red-500 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {keyLevels.length < 4 && (
                <button
                  type="button"
                  onClick={addKeyLevel}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-teal-600 text-sm text-white font-semibold"
                >
                  + Add Level
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
