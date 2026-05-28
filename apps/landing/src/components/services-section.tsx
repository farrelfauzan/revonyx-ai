'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Brain, Shield, Zap, Layers, History } from 'lucide-react';

const services = [
  {
    icon: MessageSquare,
    title: 'Natural Chat Interface',
    description:
      'Conversational AI that feels natural. Multi-turn context, markdown rendering, code highlighting, and file uploads — all in a beautiful interface.',
  },
  {
    icon: Brain,
    title: 'Persistent Memory',
    description:
      'Your AI remembers your preferences, past conversations, and context. The more you chat, the more personalized and helpful it becomes.',
  },
  {
    icon: Layers,
    title: 'Multi-Model Switching',
    description:
      'Switch between AI models mid-conversation. Use the best model for each task — creative writing, coding, analysis, or brainstorming.',
  },
  {
    icon: Zap,
    title: 'Custom Environments',
    description:
      'Create personalized AI environments with custom instructions, knowledge bases, and workflows tailored to your specific needs.',
  },
  {
    icon: History,
    title: 'Full Chat History',
    description:
      'All your conversations are saved and searchable. Pick up where you left off, revisit old chats, or share conversations with your team.',
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description:
      'End-to-end encryption, SOC 2 compliance, and granular access controls. Your data stays private and secure at every layer.',
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
            A Chat Platform Built for Productivity
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            More than just chat — a complete AI workspace with memory, custom
            environments, and powerful features that grow with you.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
