import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { RotateCcw } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type MarkStatus = 'idle' | 'correct' | 'wrong'

interface Student {
  id: string
  name: string
  score: number
  status: MarkStatus
}

// ─── Themes per student column ────────────────────────────────────────────────

const THEMES = [
  {
    bg: 'bg-blue-50',
    headerBg: 'bg-blue-100',
    headerText: 'text-blue-800',
    border: 'border-blue-200',
    scoreBadge: 'bg-blue-600 text-white',
    leaderBadge: 'bg-amber-400 text-amber-900',
    correctBtn: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-emerald-200',
    wrongBtn:   'bg-rose-100   hover:bg-rose-200   active:bg-rose-300   text-rose-700 border border-rose-200',
    emoji: '🦋',
  },
  {
    bg: 'bg-violet-50',
    headerBg: 'bg-violet-100',
    headerText: 'text-violet-800',
    border: 'border-violet-200',
    scoreBadge: 'bg-violet-600 text-white',
    leaderBadge: 'bg-amber-400 text-amber-900',
    correctBtn: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-emerald-200',
    wrongBtn:   'bg-rose-100   hover:bg-rose-200   active:bg-rose-300   text-rose-700 border border-rose-200',
    emoji: '🌸',
  },
  {
    bg: 'bg-emerald-50',
    headerBg: 'bg-emerald-100',
    headerText: 'text-emerald-800',
    border: 'border-emerald-200',
    scoreBadge: 'bg-emerald-600 text-white',
    leaderBadge: 'bg-amber-400 text-amber-900',
    correctBtn: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-emerald-200',
    wrongBtn:   'bg-rose-100   hover:bg-rose-200   active:bg-rose-300   text-rose-700 border border-rose-200',
    emoji: '🌿',
  },
]

// ─── Sound helpers ────────────────────────────────────────────────────────────

function playCorrect() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(523.25, ctx.currentTime)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5)
  } catch { /* ignore */ }
}

function playWrong() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35)
  } catch { /* ignore */ }
}

// ─── Rank helpers ─────────────────────────────────────────────────────────────

function rankEmoji(rank: number) {
  return (['🥇', '🥈', '🥉'] as const)[rank - 1] ?? ''
}

// ─── Component ────────────────────────────────────────────────────────────────

const INIT: Student[] = [
  { id: 'A', name: '学生 A', score: 0, status: 'idle' },
  { id: 'B', name: '学生 B', score: 0, status: 'idle' },
  { id: 'C', name: '学生 C', score: 0, status: 'idle' },
]

export default function ShengciGame() {
  const [students, setStudents] = useState<Student[]>(INIT)
  const [round, setRound] = useState(0)
  const [showReset, setShowReset] = useState(false)

  const ranked = [...students].sort((a, b) => b.score - a.score)
  const maxScore = Math.max(...students.map(s => s.score))
  const allMarked = students.every(s => s.status !== 'idle')

  function mark(id: string, correct: boolean) {
    correct ? playCorrect() : playWrong()
    setStudents(prev => {
      const next = prev.map(s =>
        s.id === id && s.status === 'idle'
          ? { ...s, score: correct ? s.score + 1 : s.score, status: (correct ? 'correct' : 'wrong') as MarkStatus }
          : s
      )
      if (next.every(s => s.status !== 'idle')) setRound(r => r + 1)
      return next
    })
  }

  function nextRound() {
    setStudents(s => s.map(st => ({ ...st, status: 'idle' })))
  }

  function reset() {
    setStudents(INIT.map(s => ({ ...s })))
    setRound(0)
    setShowReset(false)
  }

  return (
    <div className="min-h-svh bg-white flex flex-col select-none">

      {/* ── Slim top bar ─────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">��</span>
          <span className="text-base font-black text-slate-800">生词游戏</span>
          {round > 0 && (
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
              第 {round} 轮
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {allMarked && (
              <motion.button
                onClick={nextRound}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-bold shadow-sm transition-colors"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                whileTap={{ scale: 0.95 }}
              >
                ⏭ 下一题
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            onClick={() => setShowReset(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="查看成绩 / 重置"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </header>

      {/* ── 3 Student panels ─────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-3">
        {students.map((student, idx) => {
          const t = THEMES[idx]
          const rank = ranked.findIndex(r => r.id === student.id) + 1
          const isLeader = student.score > 0 && student.score === maxScore
          const canMark = student.status === 'idle'

          const panelBg =
            student.status === 'correct' ? 'bg-emerald-50' :
            student.status === 'wrong'   ? 'bg-rose-50'    :
            t.bg

          return (
            <div
              key={student.id}
              className={cn(
                'flex flex-col border-r last:border-r-0 border-slate-200 transition-colors duration-300',
                panelBg,
              )}
            >
              {/* Header */}
              <div className={cn(
                'shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-200',
                t.headerBg,
              )}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{t.emoji}</span>
                  <div>
                    <div className={cn('font-black text-lg', t.headerText)}>{student.name}</div>
                    {rank <= 3 && student.score > 0 && (
                      <div className="text-xs font-semibold text-slate-500">
                        {rankEmoji(rank)} 第{rank}名
                      </div>
                    )}
                  </div>
                </div>

                <motion.div
                  key={student.score}
                  initial={{ scale: 1.5, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                  className={cn(
                    'flex items-center gap-1 px-4 py-1.5 rounded-full text-xl font-black',
                    isLeader ? t.leaderBadge : t.scoreBadge,
                  )}
                >
                  {isLeader && <span>⭐</span>}
                  {student.score}
                  <span className="text-xs font-normal opacity-70">分</span>
                </motion.div>
              </div>

              {/* Body */}
              <div className="flex-1 flex flex-col items-stretch justify-between px-6 py-8 gap-6">

                {/* Status area — fills all available height */}
                <div className="flex-1 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {student.status === 'idle' && (
                      <motion.div
                        key="idle"
                        className="w-full h-full min-h-[200px] rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <span className="text-6xl opacity-15 select-none">✏️</span>
                      </motion.div>
                    )}

                    {student.status === 'correct' && (
                      <motion.div
                        key="correct"
                        className="w-full min-h-[200px] rounded-3xl border-2 border-emerald-300 bg-white flex flex-col items-center justify-center gap-3"
                        initial={{ scale: 0.75, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.75, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                      >
                        <motion.span
                          className="text-8xl"
                          animate={{ rotate: [0, -12, 12, -6, 6, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          ✅
                        </motion.span>
                        <span className="text-2xl font-black text-emerald-600">答对了！</span>
                      </motion.div>
                    )}

                    {student.status === 'wrong' && (
                      <motion.div
                        key="wrong"
                        className="w-full min-h-[200px] rounded-3xl border-2 border-rose-300 bg-white flex flex-col items-center justify-center gap-3"
                        initial={{ scale: 0.75, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, x: [0, -10, 10, -6, 6, 0] }}
                        exit={{ scale: 0.75, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <span className="text-8xl">❌</span>
                        <span className="text-2xl font-black text-rose-500">答错了</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ✓ / ✗ buttons */}
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => mark(student.id, true)}
                    disabled={!canMark}
                    className={cn(
                      'flex-1 py-5 rounded-2xl font-black text-2xl shadow-md transition-colors',
                      'disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none',
                      t.correctBtn,
                    )}
                    whileHover={canMark ? { scale: 1.04, y: -2 } : {}}
                    whileTap={canMark ? { scale: 0.94 } : {}}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    ✓
                  </motion.button>
                  <motion.button
                    onClick={() => mark(student.id, false)}
                    disabled={!canMark}
                    className={cn(
                      'flex-1 py-5 rounded-2xl font-black text-2xl shadow-sm transition-colors',
                      'disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none',
                      t.wrongBtn,
                    )}
                    whileHover={canMark ? { scale: 1.04, y: -2 } : {}}
                    whileTap={canMark ? { scale: 0.94 } : {}}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    ✗
                  </motion.button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Reset / leaderboard modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showReset && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReset(false)}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 px-10 py-8 flex flex-col items-center gap-5 mx-6"
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-4xl">🏆</div>
              <div className="text-2xl font-black text-slate-800">当前成绩</div>
              <div className="flex flex-col gap-2.5 w-full min-w-[260px]">
                {ranked.map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-2xl border',
                      i === 0 ? 'bg-amber-50 border-amber-200' :
                      i === 1 ? 'bg-slate-50 border-slate-200' :
                                'bg-orange-50 border-orange-200',
                    )}
                  >
                    <span className="text-2xl">{rankEmoji(i + 1)}</span>
                    <span className="flex-1 font-bold text-slate-700">{s.name}</span>
                    <span className={cn('text-xl font-black', i === 0 ? 'text-amber-600' : 'text-slate-500')}>
                      {s.score} 分
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={() => setShowReset(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  继续
                </button>
                <button
                  onClick={reset}
                  className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-colors shadow-md"
                >
                  🔄 重置
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
