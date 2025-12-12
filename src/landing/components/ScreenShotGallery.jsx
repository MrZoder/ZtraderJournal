import { motion } from "framer-motion";

export default function ScreenshotGallery() {
  return (
    <section className="px-6 py-16 text-center">
      <motion.h2
        className="text-3xl font-bold mb-10"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        Product Screenshots
      </motion.h2>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {["/src/landing/DashboardPageZtrader.png", "/src/landing/StatisticsZtrader.png"].map((src, i) => (
          <motion.img
            key={src}
            src={src}
            alt={`screenshot-${i}`}
            className="w-full sm:w-1/3 rounded-xl shadow-xl border border-zinc-800"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.2 }}
            viewport={{ once: true }}
          />
        ))}
      </div>
    </section>
  );
}
