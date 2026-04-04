import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'

// ── Subject cards ─────────────────────────────────────────────────────────────
const SUBJECTS = [
  {
    emoji: '🔢',
    label: 'Mathematics',
    desc: 'Fractions, numbers & more',
    to: '/s3/math/fraction',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-600',
    hover: 'hover:border-blue-400 hover:shadow-blue-100',
  },
  {
    emoji: '🀄',
    label: '华文 Chinese',
    desc: '阅读、写作、词语',
    to: '/s3/chinese',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-600',
    hover: 'hover:border-rose-400 hover:shadow-rose-100',
  },
]

// ── Animation variants ────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

const EASE = [0.22, 1, 0.36, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
}

// ── Component ─────────────────────────────────────────────────────────────────
function HomePage() {
  return (
    <div className="relative min-h-svh flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-rose-50/30">

      {/* Subtle ambient shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-100/60 blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-rose-100/60 blur-[80px]" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-10 px-6 py-20 text-center max-w-3xl"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.div variants={fadeUp}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold tracking-widest text-rose-600 uppercase">
            ✨ Standard 3 Learning Platform
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-4">
          <motion.div
            className="text-7xl leading-none select-none"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎓
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-800 leading-[1.1]">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
              Tutorial
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-sm leading-relaxed">
            Interactive lessons crafted to make learning fun, visual, and effective.
          </p>
        </motion.div>

        {/* Subject cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl"
          variants={container}
        >
          {SUBJECTS.map((s) => (
            <motion.div key={s.to} variants={cardVariant}>
              <Link
                to={s.to}
                className={[
                  'group flex flex-col gap-3 rounded-2xl border-2 p-5 text-left no-underline',
                  'transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02]',
                  'shadow-sm hover:shadow-lg',
                  s.bg, s.border, s.hover,
                ].join(' ')}
              >
                <div className="flex items-start justify-between">
                  <motion.span
                    className="text-4xl leading-none"
                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.15 }}
                    transition={{ duration: 0.4 }}
                  >
                    {s.emoji}
                  </motion.span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.badge}`}>
                    S3
                  </span>
                </div>
                <div>
                  <div className={`text-base font-bold ${s.text}`}>{s.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.desc}</div>
                </div>
                <motion.div
                  className={`mt-1 text-xs font-semibold ${s.text} flex items-center gap-1`}
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                >
                  Start learning →
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer hint */}
        <motion.p variants={fadeUp} className="text-xs text-slate-400">
          More subjects coming soon · Use the sidebar to navigate
        </motion.p>
      </motion.div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
