// src/pages/JournalPage/components/MobileTabBar.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const MOBILE_DOCK_H = 56; // compact height

const bar =
  "rounded-[16px] border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,.35)]";

export default function MobileTabBar({ items, active, onChange }) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(typeof window !== "undefined" ? window.scrollY : 0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const delta = y - lastY.current;
      lastY.current = y;
      if (Math.abs(delta) < 6) return;
      setVisible(delta < 0 || y < 12); // show on scroll up / top
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* make BOTH tab rails horizontally scrollable with edge masks */}
      <style>{`
        .journal-pills-scroll, .mobile-tab-rail {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent);
        }
        .journal-pills-scroll::-webkit-scrollbar,
        .mobile-tab-rail::-webkit-scrollbar { display: none; }
      `}</style>

      <AnimatePresence>
        {visible && (
          <motion.nav
            key="dock"
            initial={{ y: MOBILE_DOCK_H + 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: MOBILE_DOCK_H + 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="md:hidden fixed inset-x-3 z-40"
            style={{ bottom: `calc(12px + env(safe-area-inset-bottom, 0px))` }}
          >
            <div className={`${bar} px-1 py-1 relative`}>
              {/* fade masks for nicer edges */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[rgba(11,15,20,0.9)] to-transparent rounded-l-[16px]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[rgba(11,15,20,0.9)] to-transparent rounded-r-[16px]" />

              <div className="mobile-tab-rail flex items-stretch gap-1 snap-x snap-mandatory px-1">
                {items.map(({ key, label, icon: Icon }) => {
                  const is = key === active;
                  return (
                    <button
                      key={key}
                      onClick={() => onChange(key)}
                      className={`snap-start min-w-[96px] h-11 rounded-[12px] px-3 flex items-center justify-center gap-2 text-[12px] ${
                        is
                          ? "text-black bg-gradient-to-br from-emerald-400 to-cyan-400"
                          : "text-zinc-300 bg-white/6 border border-white/10"
                      }`}
                    >
                      {Icon ? (
                        <Icon size={16} className={is ? "opacity-90" : "opacity-80"} />
                      ) : null}
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
