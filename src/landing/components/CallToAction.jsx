import { motion } from "framer-motion";

export default function CallToAction() {
  return (
    <section className="px-6 py-20 bg-zinc-900 text-center">
      <motion.h2
        className="text-2xl font-bold mb-3"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        Ready to get started?
      </motion.h2>
      <motion.p
        className="text-zinc-400 mb-8"
        initial={{ opacity: 0, y: 5 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        viewport={{ once: true }}
      >
        Sign in or create your account
      </motion.p>

      <motion.div
        className="max-w-md mx-auto bg-black rounded-xl p-6 text-left space-y-4 shadow-lg border border-zinc-800"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        viewport={{ once: true }}
      >
        <input
          type="email"
          placeholder="Email"
          className="w-full bg-zinc-800 border border-zinc-700 text-white p-3 rounded-lg outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full bg-zinc-800 border border-zinc-700 text-white p-3 rounded-lg outline-none"
        />
        <button className="w-full bg-[#00FFA3] text-black font-semibold py-3 rounded-lg hover:scale-105 transition">
          Enter the Ledger
        </button>
      </motion.div>
    </section>
  );
}