'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Manager',
    company: 'TechFlow',
    content:
      'Renovix AI replaced 4 different tools for me. The custom agents handle my meeting prep, email drafts, and research — saving me 2+ hours daily.',
    avatar: 'SC',
  },
  {
    name: 'Marcus Rivera',
    role: 'Full-Stack Developer',
    company: 'DevScale',
    content:
      'The code assistant agent is insane. It understands context from my entire codebase and helps me debug issues in minutes instead of hours.',
    avatar: 'MR',
  },
  {
    name: 'Emily Watson',
    role: 'Content Lead',
    company: 'GrowthLab',
    content:
      'We switched from ChatGPT Plus to Renovix AI for our team. The shared workspace and custom agents for our brand voice are game-changers.',
    avatar: 'EW',
  },
  {
    name: 'David Park',
    role: 'Startup Founder',
    company: 'LaunchPad AI',
    content:
      'I built 3 custom agents for my workflow: one for investor emails, one for market research, and one for product specs. Best investment I made.',
    avatar: 'DP',
  },
  {
    name: 'Aisha Patel',
    role: 'Data Scientist',
    company: 'AnalyticsCo',
    content:
      'The ability to switch between models mid-conversation is brilliant. I use different models for different parts of my analysis pipeline.',
    avatar: 'AP',
  },
  {
    name: 'James Liu',
    role: 'Marketing Director',
    company: 'BrandForge',
    content:
      'Our entire marketing team uses Renovix AI daily. The content agents produce copy that actually sounds like us, not generic AI slop.',
    avatar: 'JL',
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

export function TestimonialsSection() {
  return (
    <section className="relative bg-gray-950 py-28" id="testimonials">
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
            Loved by Thousands of Users
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            Join a growing community of professionals, developers, and creators
            who use Renovix AI to supercharge their work every day.
          </p>
          <div className="mt-6 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-sm text-gray-400">4.9/5 from 2,000+ reviews</span>
          </div>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-gray-700"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
            >
              <Quote className="mb-3 h-5 w-5 text-indigo-500/50" />
              <p className="mb-4 text-sm text-gray-300 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
