import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X, ChevronDown } from "lucide-react";

export default function JournalSelector({
  journals,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onRename, // NEW PROP
}) {
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newJournal, setNewJournal] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameInput, setRenameInput] = useState("");
  const containerRef = useRef();

  useEffect(() => {
    const handleClick = (e) => {
      if (open && containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!showAdd) setNewJournal("");
  }, [showAdd]);

  return (
    <div className="w-full flex flex-col md:flex-row items-center gap-3 mb-4 relative z-40">
      <div className="relative w-full max-w-xs" ref={containerRef}>
        <button
          className="w-full flex items-center justify-between rounded-xl bg-zinc-900 text-white py-2 px-4 border border-zinc-700 hover:border-[#00ffa3] transition"
          onClick={() => setOpen((o) => !o)}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate font-bold">
            {journals.find(j => j.id === selectedId)?.name || "Select a journal"}
          </span>
          <ChevronDown className="ml-2" size={20} />
        </button>

        {open && (
          <div className="absolute left-0 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl animate-fade-in z-50">
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {journals.length === 0 && (
                <div className="px-4 py-3 text-zinc-400 italic text-sm">No journals found</div>
              )}
              {journals.map(j => (
                <div
                  key={j.id}
                  className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-[#00ffa3]/10 rounded transition
                    ${j.id === selectedId ? "bg-[#00ffa3]/20" : ""}
                  `}
                  onClick={() => {
                    if (renamingId !== j.id) {
                      setOpen(false);
                      if (j.id !== selectedId) onSelect(j.id);
                    }
                  }}
                  role="option"
                  aria-selected={j.id === selectedId}
                >
                  {renamingId === j.id ? (
                    <>
                      <input
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-zinc-800 rounded p-1 text-white text-sm border border-zinc-600 focus:border-[#00ffa3] outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (renameInput.trim()) {
                              onRename(j.id, renameInput.trim());
                              setRenamingId(null);
                            }
                          } else if (e.key === "Escape") {
                            setRenamingId(null);
                          }
                        }}
                        autoFocus
                      />
                      <button onClick={(e) => {
                        e.stopPropagation();
                        if (renameInput.trim()) {
                          onRename(j.id, renameInput.trim());
                          setRenamingId(null);
                        }
                      }}>
                        <Check className="text-green-400" size={16} />
                      </button>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(null);
                      }}>
                        <X className="text-red-400" size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate font-semibold">{j.name || "Untitled"}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameInput(j.name);
                          setRenamingId(j.id);
                        }}
                        className="text-zinc-400 hover:text-[#00ffa3] transition"
                        title="Rename"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="p-1 text-red-400 hover:bg-red-900/30 rounded-full transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete this journal?")) onDelete(j.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-zinc-700">
              <button
                className="w-full flex items-center justify-center px-3 py-2 mt-1 rounded-xl bg-[#00FFA3] text-black font-semibold hover:bg-[#00db8c] transition"
                onClick={() => {
                  setShowAdd(true);
                  setOpen(false);
                }}
              >
                <Plus size={16} className="mr-1" /> Add Journal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Journal Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
          <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-sm shadow-xl border border-[#00ffa3] flex flex-col gap-4">
            <h2 className="text-xl font-bold text-[#00ffa3] mb-2">New Journal</h2>
            <input
              className="w-full bg-zinc-800 rounded-lg p-3 text-white text-base border border-zinc-700 focus:border-[#00ffa3] outline-none"
              placeholder="Journal name…"
              value={newJournal}
              maxLength={50}
              onChange={e => setNewJournal(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && newJournal.trim()) {
                  onAdd(newJournal.trim());
                  setShowAdd(false);
                }
              }}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newJournal.trim()) {
                    onAdd(newJournal.trim());
                    setShowAdd(false);
                  }
                }}
                className="flex-1 bg-[#00ffa3] hover:bg-[#02c588] text-black px-4 py-2 rounded-lg font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
