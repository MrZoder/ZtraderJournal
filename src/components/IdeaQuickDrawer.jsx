// src/components/IdeaQuickDrawer.jsx
import React, { useState } from "react";
import { StickyNote, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import IdeaBoardPanel from "./IdeaBoardPanel";

export default function IdeaQuickDrawer({ notes, settings, onChangeNotes, onChangeSettings, allTrades }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full p-3 bg-[rgba(0,255,163,0.2)] hover:bg-[rgba(0,255,163,0.28)] border border-[rgba(0,255,163,0.45)] shadow-2xl"
        title="Idea Drawer"
      >
        <StickyNote className="w-5 h-5 text-[rgba(0,255,163,0.95)]" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div
              className="absolute right-0 top-0 h-full w-[92%] sm:w-[480px] bg-[#0e141a] border-l border-[rgba(0,255,163,0.35)] p-4 overflow-y-auto"
              initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-[rgba(0,255,163,0.95)] font-semibold">Idea Drawer</div>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-zinc-300" />
                </button>
              </div>
              <IdeaBoardPanel
                data={notes}
                settings={settings}
                onChange={onChangeNotes}
                onChangeSettings={onChangeSettings}
                allTrades={allTrades}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
