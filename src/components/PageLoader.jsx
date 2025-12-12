// src/components/PageLoader.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

export default function PageLoader({ pageName }) {
  const waveControls = useAnimation();
  const gridControls = useAnimation();
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
  );

  useEffect(() => {
    // Lock scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Start animations
    startWave();
    startGridPulse();

    // Update clock every minute
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      );
    }, 1000);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearInterval(timer);
    };
  }, []);

  // Animate candlestick wave
  const startWave = async () => {
    while (true) {
      await waveControls.start({
        pathLength: 1,
        transition: { duration: 2, ease: "easeInOut" },
      });
      await waveControls.start({
        pathLength: 0,
        transition: { duration: 2, ease: "easeInOut" },
      });
    }
  };

  // Pulse the grid
  const startGridPulse = async () => {
    while (true) {
      await gridControls.start({
        opacity: [0.2, 0.5, 0.2],
        transition: { duration: 3, ease: "easeInOut" },
      });
    }
  };

  // Simulated spread in pips
  const spread = (Math.random() * 2 + 0.1).toFixed(1);
  const spreadClass = spread <= 1 ? "text-green-400" : "text-red-400";

  return (
    <AnimatePresence>
      <motion.div
        key="live-clock-trader-loader"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-black-800 via-black-900 to-gray-800 px-4 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
        transition={{ duration: 0.5 }}
      >
        {/* Pulsing grid overlay */}
        <motion.div
          className="absolute inset-0 bg-[repeating-linear-gradient(0deg,#ffffff05,#ffffff05_1px,#00000000_1px,#00000000_20px),repeating-linear-gradient(90deg,#ffffff05,#ffffff05_1px,#00000000_1px,#00000000_20px)]"
          animate={gridControls}
          style={{ pointerEvents: "none" }}
        />

        {/* Candlestick wave chart */}
        <motion.svg
          width="280"
          height="140"
          viewBox="0 0 280 140"
          className="mb-8 relative z-10"
        >
          <motion.path
            d="M0,90 L40,70 L80,95 L120,60 L160,85 L200,50 L240,75 L280,65"
            fill="none"
            stroke="#6EE7B7"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={waveControls}
          />
          {/* Mini candlesticks */}
          {[30, 110, 190, 250].map((x, i) => (
            <motion.rect
              key={i}
              x={x}
              y={80 - i * 5}
              width="6"
              height={20 + i * 4}
              fill={i % 2 ? "#E04D4D" : "#6EE7B7"}
              animate={{ y: [80 - i * 5, 80 - i * 5 - 8, 80 - i * 5] }}
              transition={{
                repeat: Infinity,
                duration: 1.6 + i * 0.2,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.svg>

        {/* Central pulsing ring */}
        <motion.div
          className="relative flex items-center justify-center mb-6 z-10"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <div className="w-16 h-16 rounded-full border-4 border-green-300 flex items-center justify-center shadow-lg">
            <div className="w-10 h-10 bg-green-300 rounded-full opacity-60 animate-pulse" />
          </div>
        </motion.div>

        {/* Title & live clock */}
        <motion.div
          className="text-center mb-8 z-10"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 240, damping: 20 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 uppercase tracking-wide">
            {pageName}
          </h1>
          <p className="mt-2 text-sm text-gray-400 font-mono">
            {currentTime} — synchronizing trades
          </p>
        </motion.div>

        {/* Spread badge */}
        <motion.div
          className={`px-5 py-1 rounded-full text-sm font-mono ${spreadClass} bg-gray-800/70 backdrop-blur-sm z-10`}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          Spread: {spread} pips
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
