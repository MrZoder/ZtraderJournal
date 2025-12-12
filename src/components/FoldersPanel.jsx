// src/components/FoldersPanel.jsx
import React from "react";
import { Plus, Trash2 } from "lucide-react";

export default function FoldersPanel({
  header,            // e.g. "📓 My Journals"
  folders,           // Array of { id, name }
  selectedId,        // currently selected journal id
  onSelect,          // fn(id: string)
  onNew,             // fn()
  onDelete,          // fn(id: string)
  panelClassName = "",
  selectClassName = "",
  newButtonClassName = "",
}) {
  return (
    <div className={`${panelClassName} flex items-center justify-between`}>
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold text-white">{header}</h2>
        <div className="relative mt-2">
          <select
            value={selectedId || ""}
            onChange={(e) => onSelect(e.target.value)}
            className={`
              ${selectClassName}
              w-56
              bg-gray-800 text-gray-200
              rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-[#00FFA3]
            `}
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          {selectedId && (
            <button
              onClick={() => onDelete(selectedId)}
              className="
                absolute right-2 top-2
                text-gray-400 hover:text-gray-200
                transition-colors duration-150
              "
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onNew}
        className={`${newButtonClassName} ml-6 flex items-center space-x-2`}
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">New</span>
      </button>
    </div>
  );
}
