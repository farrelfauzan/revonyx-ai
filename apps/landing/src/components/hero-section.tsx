'use client';

import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import { CircuitBackground } from './circuit-background';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
      <CircuitBackground />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
            <Zap className="h-4 w-4" />
            <span>Unified AI API Platform</span>
          </div>
        </motion.div>

        <motion.h1
          className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          One API.{' '}
          <span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Every Model.
          </span>
          <br />
          Pay Only What You Use.
        </motion.h1>

        <motion.p
          className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Access top-tier LLMs — Llama, Qwen, Mistral and more — through a single
          endpoint. No subscriptions. No commitments. Just simple pay-per-request
          pricing.
        </motion.p>

        <motion.div
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <a
            href="#get-started"
            className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
          >
            See How It Works
          </a>
        </motion.div>

        {/* Code snippet preview */}
        <motion.div
          className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-xl border border-gray-800 bg-gray-900/80 text-left shadow-2xl shadow-indigo-500/5 backdrop-blur"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <span className="h-3 w-3 rounded-full bg-green-500/60" />
            <span className="ml-2 text-xs text-gray-500">request.sh</span>
          </div>
          <pre className="overflow-x-auto p-5 text-sm leading-relaxed">
            <code>
              <span className="text-green-400">curl</span>
              <span className="text-gray-300"> https://api.performa.ai/v1/chat/completions \</span>
              {'\n'}
              <span className="text-gray-500">  -H </span>
              <span className="text-amber-300">{'"Authorization: Bearer sk_live_..."'}</span>
              <span className="text-gray-300"> \</span>
              {'\n'}
              <span className="text-gray-500">  -H </span>
              <span className="text-amber-300">{'"Content-Type: application/json"'}</span>
              <span className="text-gray-300"> \</span>
              {'\n'}
              <span className="text-gray-500">  -d </span>
              <span className="text-amber-300">{"'"}</span>
              <span className="text-violet-300">{'{"model":"llama-3.3-70b","messages":[{"role":"user","content":"Hello!"}]}'}</span>
              <span className="text-amber-300">{"'"}</span>
            </code>
          </pre>
        </motion.div>
      </div>
    </section>
  );
}
