// src/components/NotesPanel.jsx
import React from "react";
import { Plus, Edit2 } from "lucide-react";

export default function NotesPanel({
  notes = [],       // array of { id, text }
  onAdd,            // fn()
  onEdit,           // fn(note)
  panelClassName = "",
}) {
  return (
    <div className={`${panelClassName}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-white">📝 Notes</h2>
        <button
          onClick={onAdd}
          className="
            bg-[#00FFA3] hover:bg-[#00e28b]
            text-black px-3 py-1 rounded-full
            shadow-[0_4px_15px_rgba(0,255,163,0.3)]
            transition-transform duration-200 hover:scale-105
          "
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No notes yet.</p>
      ) : (
        <ul className="space-y-2 max-h-[30vh] overflow-auto scrollbar-thin scrollbar-thumb-[#00FFA3]/40 scrollbar-track-[#ffffff]/5">
          {notes.map((n) => (
            <li
              key={n.id}
              onClick={() => onEdit(n)}
              className="
                flex items-center justify-between
                bg-gray-800/60 hover:bg-gray-700/60
                text-gray-200 text-sm
                rounded-lg px-3 py-2 cursor-pointer
                transition-colors duration-150
              "
            >
              <span className="truncate">{n.text}</span>
              <Edit2 className="w-4 h-4 text-[#00FFA3]" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
