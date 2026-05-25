'use client';

import { motion } from 'framer-motion';
import {
  Repeat,
  Fingerprint,
  Blocks,
  Globe,
  Gauge,
  Lock,
} from 'lucide-react';

const differentiators = [
  {
    icon: Repeat,
    title: 'Switch Models Instantly',
    description:
      'Not locked into one model. Pick the best AI for each message — swap between models mid-conversation without losing context.',
  },
  {
    icon: Fingerprint,
    title: 'Truly Personalized',
    description:
      'Your AI learns your style, preferences, and workflows over time. The more you use it, the better it gets at being your AI.',
  },
  {
    icon: Blocks,
    title: 'Your Agents, Your Rules',
    description:
      'Build custom agents with specific instructions, tools, and knowledge bases. Automate the repetitive work your way.',
  },
  {
    icon: Globe,
    title: 'Open Ecosystem',
    description:
      'Not a walled garden. Connect to your tools, export your data anytime, and access everything via API.',
  },
  {
    icon: Gauge,
    title: 'Pay for What You Use',
    description:
      'No $20/month for features you barely touch. Generous free tier, then transparent pay-per-use or flat plans that fit your budget.',
  },
  {
    icon: Lock,
    title: 'Privacy-First Design',
    description:
      'Your conversations are yours. No training on your data, end-to-end encryption, and full control over data retention.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

export function ComparisonSection() {
  return (
    <section className="relative bg-gray-950 py-28" id="comparison">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gray-800 to-transparent" />

      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            What Makes Renovix AI Different
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            We built the AI platform we wished existed — flexible, private,
            and designed around how people actually work.
          </p>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {differentiators.map((item, i) => (
            <motion.div
              key={item.title}
              className="relative"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
            >
              <div className="mb-3 inline-flex rounded-xl bg-indigo-500/10 p-3">
                <item.icon className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
