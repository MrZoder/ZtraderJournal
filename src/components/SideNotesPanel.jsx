import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const SideNotesPanel = ({ notes, onAddNote, onDeleteNote }) => {
  const [newNote, setNewNote] = useState("");

  return (
    <div className="w-full bg-zinc-900 rounded-xl border border-zinc-800 p-4">
      <div className="flex items-center mb-2">
        <span className="font-semibold text-[#00ffa3]">Side Notes</span>
      </div>
      <div className="flex flex-col gap-2">
        {notes.length === 0 && <span className="text-zinc-400 text-xs">No notes yet.</span>}
        {notes.map(note => (
          <div key={note.id} className="flex items-center bg-zinc-800 rounded-lg px-3 py-2 shadow border-l-4 border-[#00FFA3]">
            <span className="text-white text-sm flex-1">{note.text}</span>
            <button
              className="ml-2 text-red-400 hover:bg-red-900/30 rounded-full p-1"
              onClick={() => onDeleteNote(note.id)}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <form
        className="mt-3 flex"
        onSubmit={e => {
          e.preventDefault();
          if (newNote.trim()) {
            onAddNote(newNote.trim());
            setNewNote("");
          }
        }}
      >
        <input
          className="flex-1 bg-zinc-800 text-white rounded-l-lg px-2 py-1 border border-zinc-700 focus:border-[#00ffa3] outline-none text-sm"
          placeholder="Quick note…"
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          maxLength={70}
        />
        <button
          type="submit"
          className="px-3 py-1 rounded-r-lg bg-[#00ffa3] text-black font-bold hover:bg-[#00e28b] transition"
        >
          <Plus size={18} />
        </button>
      </form>
    </div>
  );
};

export default SideNotesPanel;
