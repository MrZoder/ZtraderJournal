import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="text-white px-6 py-20 text-center relative overflow-hidden">
      {/* Background glow */}
      <motion.div
        className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[rgba(0,255,163,0.05)] blur-3xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* Hero Content */}
      <motion.h1
        className="text-4xl sm:text-5xl font-black leading-tight mb-4"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        Trade Like a Pro.
        <br className="hidden sm:block" />
        Journal Like a Killer.
      </motion.h1>

      <motion.p
        className="text-zinc-400 text-lg max-w-xl mx-auto mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <span className="text-white font-semibold">Z Trader</span> is your daily performance edge: track, analyze & evolve.
      </motion.p>

      <motion.button
        className="bg-[#00FFA3] text-black px-6 py-3 rounded-full font-semibold text-lg hover:scale-105 transition shadow-md"
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.97 }}
      >
        Start Journaling Free
      </motion.button>
    </section>
  );
}
