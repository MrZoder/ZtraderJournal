// src/components/TimelinePanel.jsx
import React from "react";
import { format } from "date-fns";

export default function TimelinePanel({
  entries,
  selectedEntryId,
  onSelect,
  onNewEntry,
}) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-zinc-900 to-zinc-800 p-4 rounded-xl space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-green-300">🕰️ Timeline</h3>
        <button
          onClick={onNewEntry}
          className="text-green-400 hover:text-green-300 transition"
        >
          + New
        </button>
      </div>
      <ul className="space-y-2">
        {entries.length ? (
          entries.map((entry) => (
            <li key={entry.id}>
              <button
                onClick={() => onSelect(entry.id)}
                className={`
                  w-full text-left p-3 rounded-lg transition
                  ${selectedEntryId === entry.id
                    ? "bg-green-600 text-black"
                    : "hover:bg-zinc-700 text-zinc-200"}
                `}
              >
                <div className="text-xs text-zinc-400">
                  {format(new Date(entry.date), "PPPP")}
                </div>
                <div className="font-medium truncate">
                  {entry.title || "Untitled Entry"}
                </div>
                {entry.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-zinc-700 text-zinc-300 text-[10px] px-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </li>
          ))
        ) : (
          <li className="text-zinc-500 italic">No entries yet</li>
        )}
      </ul>
    </div>
  );
}
