import { motion } from "framer-motion";

const plans = [
  {
    title: "Monthly",
    price: "$19/mo",
    description: "Start your journal and cancel anytime.",
    button: "Start Logging Trades",
    highlight: false,
  },
  {
    title: "Lifetime",
    price: "$399",
    description: "One-time purchase, full access forever.",
    button: "Get Lifetime Access",
    highlight: true,
  },
];

export default function PricingPlans() {
  return (
    <section className="px-6 py-20 text-center">
      <motion.h2
        className="text-3xl font-bold mb-12"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        Pricing
      </motion.h2>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.title}
            className={`w-full sm:w-1/3 p-6 rounded-2xl shadow-xl bg-zinc-900 border ${
              plan.highlight ? "border-[#00FFA3]" : "border-zinc-800"
            }`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
            <p className="text-3xl font-extrabold mb-2">{plan.price}</p>
            <p className="text-zinc-400 mb-6">{plan.description}</p>
            <button className="bg-[#00FFA3] text-black w-full py-2 rounded-lg font-semibold hover:scale-105 transition">
              {plan.button}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
