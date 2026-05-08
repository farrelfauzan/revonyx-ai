'use client';

import { motion } from 'framer-motion';
import { Globe, Cpu, CreditCard, ShieldCheck } from 'lucide-react';

const services = [
  {
    icon: Globe,
    title: 'Unified API Access',
    description:
      'One endpoint for all leading LLMs — Llama, Qwen, Mistral and more. No need to manage multiple provider integrations.',
  },
  {
    icon: CreditCard,
    title: 'Pay-Per-Request Billing',
    description:
      'Only pay for what you use. No monthly subscriptions, no hidden fees. Top up your balance and start making requests instantly.',
  },
  {
    icon: Cpu,
    title: 'Smart Model Routing',
    description:
      'Automatic failover between providers ensures high availability. If one provider is down, your requests are seamlessly routed.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise-Grade Security',
    description:
      'Hashed API keys, rate limiting, input validation, and full audit trails. Your data and requests are protected at every layer.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12 },
  }),
};

export function ServicesSection() {
  return (
    <section className="relative bg-gray-950 py-28" id="services">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Everything You Need to Ship AI Features
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            A complete platform designed so you can focus on building great
            products — not managing AI infrastructure.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-8 transition-colors hover:border-indigo-500/40 hover:bg-gray-900/80"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
            >
              {/* Hover glow */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-lg bg-indigo-500/10 p-3">
                  <service.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">
                  {service.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
