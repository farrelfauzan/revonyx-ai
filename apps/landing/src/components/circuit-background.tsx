'use client';

export function CircuitBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="circuit-pattern"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            {/* Horizontal lines */}
            <line x1="0" y1="20" x2="40" y2="20" stroke="rgba(99,102,241,0.12)" strokeWidth="1" />
            <line x1="60" y1="20" x2="100" y2="20" stroke="rgba(99,102,241,0.12)" strokeWidth="1" />
            <line x1="0" y1="50" x2="30" y2="50" stroke="rgba(139,92,246,0.10)" strokeWidth="1" />
            <line x1="70" y1="50" x2="100" y2="50" stroke="rgba(139,92,246,0.10)" strokeWidth="1" />
            <line x1="0" y1="80" x2="50" y2="80" stroke="rgba(99,102,241,0.12)" strokeWidth="1" />
            <line x1="80" y1="80" x2="100" y2="80" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />

            {/* Vertical lines */}
            <line x1="20" y1="0" x2="20" y2="40" stroke="rgba(99,102,241,0.10)" strokeWidth="1" />
            <line x1="50" y1="30" x2="50" y2="70" stroke="rgba(139,92,246,0.08)" strokeWidth="1" />
            <line x1="80" y1="60" x2="80" y2="100" stroke="rgba(99,102,241,0.10)" strokeWidth="1" />

            {/* Corners / turns */}
            <path d="M40,20 L40,50 L30,50" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="1" />
            <path d="M60,20 L60,50 L70,50" fill="none" stroke="rgba(139,92,246,0.10)" strokeWidth="1" />
            <path d="M50,70 L50,80 L80,80" fill="none" stroke="rgba(99,102,241,0.10)" strokeWidth="1" />

            {/* Junction dots */}
            <circle cx="40" cy="20" r="2" fill="rgba(99,102,241,0.25)" />
            <circle cx="60" cy="20" r="2" fill="rgba(139,92,246,0.20)" />
            <circle cx="30" cy="50" r="2" fill="rgba(139,92,246,0.20)" />
            <circle cx="70" cy="50" r="2" fill="rgba(99,102,241,0.20)" />
            <circle cx="50" cy="80" r="2" fill="rgba(99,102,241,0.25)" />
            <circle cx="80" cy="80" r="2" fill="rgba(139,92,246,0.20)" />
            <circle cx="20" cy="20" r="1.5" fill="rgba(99,102,241,0.18)" />
            <circle cx="50" cy="50" r="1.5" fill="rgba(139,92,246,0.15)" />
            <circle cx="80" cy="80" r="1.5" fill="rgba(99,102,241,0.18)" />
          </pattern>

          <radialGradient id="glow-center" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.15)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0)" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
        <rect width="100%" height="100%" fill="url(#glow-center)" />
      </svg>

      {/* Animated pulsing orbs */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl animate-pulse" />
      <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-violet-500/5 blur-3xl animate-pulse [animation-delay:1s]" />
      <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/5 blur-2xl animate-pulse [animation-delay:2s]" />
    </div>
  );
}
