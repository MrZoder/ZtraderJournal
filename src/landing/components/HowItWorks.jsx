import { motion } from "framer-motion";

const steps = [
  {
    title: "1. Log Your Trades",
    description: "Enter trades quickly or auto import from your broker.",
  },
  {
    title: "2. Sync & Analyze",
    description: "Unlock key metrics and visualize your progress.",
  },
  {
    title: "3. Review & Adapt",
    description: "Understand your emotions, refine your strategy.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-6 py-20 bg-zinc-900 text-center">
      <motion.h2
        className="text-3xl font-bold mb-12"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        How It Works
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 text-left shadow-md hover:shadow-lg transition"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-bold mb-2">{step.title}</h3>
            <p className="text-zinc-400">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
