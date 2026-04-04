import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { RotateCcw, Shuffle, Eye, EyeOff } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'percentage' | 'decimal' | 'perHundred'
type GridSize = 100 | 10

// ─── Mode config ──────────────────────────────────────────────────────────────

const MODES: { id: Mode; label: string; color: string; active: string }[] = [
  {
    id: 'percentage',
    label: '百分数',
    color: 'border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100',
    active: 'bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-200',
  },
  {
    id: 'decimal',
    label: '小数',
    color: 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100',
    active: 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200',
  },
  {
    id: 'perHundred',
    label: '百分比',
    color: 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100',
    active: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200',
  },
]

// ─── Compute display value from filled count ──────────────────────────────────

function displayValue(filled: number, mode: Mode, size: GridSize): string {
  if (mode === 'percentage') return `${filled}/${size}`
  if (mode === 'decimal') {
    const v = filled / size
    // Always show 2 decimal places for 100-grid to avoid confusion (e.g. 0.30 not 0.3)
    const digits = size === 100 ? 2 : 1
    return v.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  }
  // 百分比 %
  if (size === 10) return `${filled * 10}%`
  return `${filled}%`
}

// ─── Grid square colour by fill ratio ────────────────────────────────────────

function squareColor(filled: number): string {
  if (filled === 0) return 'bg-slate-100 hover:bg-slate-200'
  if (filled <= 25) return 'bg-sky-400'
  if (filled <= 50) return 'bg-blue-500'
  if (filled <= 75) return 'bg-violet-500'
  return 'bg-rose-500'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PercentagePage() {
  const [gridSize, setGridSize] = useState<GridSize>(100)
  const [grid, setGrid] = useState<boolean[]>(Array(100).fill(false))
  const [mode, setMode] = useState<Mode>('percentage')
  const [dragging, setDragging] = useState<boolean | null>(null)
  const [showAnswer, setShowAnswer] = useState(true)

  const filled = grid.filter(Boolean).length

  // Switch grid size — reset grid, randomise filled cells for 10-grid
  const switchSize = useCallback((size: GridSize) => {
    setGridSize(size)
    setShowAnswer(false)
    if (size === 10) {
      const count = Math.floor(Math.random() * 9) + 1
      const next = Array(10).fill(false)
      const indices = Array.from({ length: 10 }, (_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
      indices.forEach(i => { next[i] = true })
      setGrid(next)
    } else {
      setGrid(Array(100).fill(false))
    }
  }, [])

  // Reshuffle — random fill for either grid size
  const reshuffle = useCallback(() => {
    const size = gridSize
    const max = size === 10 ? 9 : 99
    const count = Math.floor(Math.random() * max) + 1
    const next = Array(size).fill(false)
    const indices = Array.from({ length: size }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
    indices.forEach(i => { next[i] = true })
    setGrid(next)
    setShowAnswer(false) // hide answer on new question
  }, [gridSize])

  function toggleCell(idx: number, fillValue: boolean) {
    setGrid(prev => {
      const next = [...prev]
      next[idx] = fillValue
      return next
    })
  }

  function handleMouseDown(i: number) {
    const newState = !grid[i]
    setDragging(newState)
    toggleCell(i, newState)
  }

  function handleMouseEnter(i: number) {
    if (dragging === null) return
    toggleCell(i, dragging)
  }

  function handleMouseUp() {
    setDragging(null)
  }

  function reset() {
    setGrid(Array(gridSize).fill(false))
  }

  // Colour changes with fill level
  const filledColor = squareColor(filled)

  return (
    <div
      className="min-h-svh bg-gradient-to-br from-slate-50 to-violet-50/30 flex flex-col select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📊</span>
          <div>
            <div className="text-base font-black text-slate-800">百分数·小数·百分比</div>
            <div className="text-[11px] text-slate-400 font-medium">Percentage · S3 Math</div>
          </div>
        </div>

        {/* Grid size toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {([100, 10] as GridSize[]).map(s => (
            <motion.button
              key={s}
              onClick={() => switchSize(s)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-black transition-colors',
                gridSize === s
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600',
              )}
              whileTap={{ scale: 0.95 }}
            >
              {s === 100 ? '100 格' : '10 格'}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={reshuffle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-amber-600 hover:bg-amber-50 text-sm font-bold transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            title="随机换题"
          >
            <Shuffle className="w-4 h-4" />
            换题
          </motion.button>
          <motion.button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-sm font-bold transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, rotate: -30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </motion.button>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 px-6 py-10">

        {/* Left: Grid ────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-5">

          {/* Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={gridSize}
              className="grid gap-1.5 p-4 bg-white rounded-3xl shadow-lg border border-slate-200"
              style={{ gridTemplateColumns: `repeat(${gridSize === 100 ? 10 : 10}, 1fr)` }}
              draggable={false}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {grid.map((on, i) => (
                <motion.button
                  key={i}
                  onMouseDown={() => handleMouseDown(i)}
                  onMouseEnter={() => handleMouseEnter(i)}
                  className={cn(
                    gridSize === 10 ? 'w-16 h-16' : 'w-11 h-11',
                    'rounded-xl transition-colors duration-100 cursor-pointer border-2',
                    on
                      ? cn(filledColor, 'border-transparent')
                      : 'bg-slate-100 hover:bg-violet-100 border-slate-200 hover:border-violet-300',
                  )}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  aria-label={`square ${i + 1}`}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Filled counter */}
          <div className="flex items-center gap-3 text-slate-500 text-lg font-semibold">
            <span>已填：</span>
            <motion.span
              key={filled}
              className="text-slate-800 font-black text-2xl"
              initial={{ scale: 1.3, y: -4 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            >
              {filled}
            </motion.span>
            <span>/ {gridSize}</span>

            {/* Mini progress bar */}
            <div className="w-28 h-2.5 rounded-full bg-slate-200 overflow-hidden ml-1">
              <motion.div
                className={cn('h-full rounded-full', filled > 0 ? filledColor : 'bg-slate-300')}
                  animate={{ width: `${(filled / gridSize) * 100}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Right: Mode + Display ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-8 w-full max-w-sm">

          {/* Mode toggle */}
          <div className="w-full flex flex-col gap-2">
            <div className="text-sm font-black uppercase tracking-widest text-slate-400 text-center mb-1">
              显示模式
            </div>
            {MODES.map(m => (
              <motion.button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'w-full flex items-center justify-between px-6 py-4 rounded-2xl border-2 font-bold text-base transition-colors',
                  mode === m.id ? m.active : m.color,
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              >
                <span>{m.label}</span>
                {mode === m.id && (
                  <motion.span
                    className="text-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Answer display */}
          <div className="w-full flex flex-col items-center gap-4 bg-white rounded-3xl border-2 border-slate-200 px-8 py-10 shadow-sm">

            {/* Header row: 答案 label + eye toggle */}
            <div className="flex items-center justify-between w-full">
              <div className="text-sm font-black uppercase tracking-widest text-slate-400">
                答案
              </div>
              <motion.button
                onClick={() => setShowAnswer(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-colors',
                  showAnswer
                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    : 'bg-violet-100 text-violet-600 hover:bg-violet-200',
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showAnswer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {showAnswer ? '隐藏' : '显示'}
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {showAnswer ? (
                <>
                  {mode === 'percentage' ? (
                    /* Fraction form: filled / gridSize */
                    <motion.div
                      key={`${filled}-${gridSize}-percentage`}
                      className="flex flex-col items-center gap-0 text-violet-600"
                      initial={{ opacity: 0, scale: 0.7, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.7, y: -10 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <span className="text-8xl font-black leading-none">{filled}</span>
                      <div className="w-full h-1 rounded-full bg-violet-400 my-2" />
                      <span className="text-6xl font-black leading-none">{gridSize}</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`${filled}-${gridSize}-${mode}`}
                      className={cn(
                        'text-8xl font-black tracking-tight leading-none',
                        mode === 'decimal' ? 'text-blue-600' : 'text-emerald-600',
                      )}
                      initial={{ opacity: 0, scale: 0.7, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.7, y: -10 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      {displayValue(filled, mode, gridSize)}
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  key="hidden"
                  className="flex flex-col items-center gap-2 py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-5xl">🙈</div>
                  <div className="text-slate-400 text-sm font-bold">答案已隐藏</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick-fill hint */}
          <div className="text-xs text-slate-400 text-center leading-relaxed">
            点击格子来填色 · 拖动可批量填写
          </div>
        </div>
      </div>
    </div>
  )
}
