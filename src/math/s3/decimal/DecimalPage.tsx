import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Shuffle, Brain, AlignCenter } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'align' | 'cups'
type CupMode = 'add' | 'subtract'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Round to avoid JS float noise */
function r(n: number, dp = 2) {
  return Math.round(n * 10 ** dp) / 10 ** dp
}

/** Number of decimal places in a number string */
function decimalPlaces(n: number): number {
  const s = n.toString()
  const dot = s.indexOf('.')
  return dot === -1 ? 0 : s.length - dot - 1
}

/** Pad a number to `places` decimal places string */
function toFixed(n: number, places: number): string {
  return n.toFixed(places)
}

/** Generate a random decimal 0.1–0.99 with 1 or 2 dp, not ending in 0 */
function randDecimal(forceOneDp = false): number {
  if (forceOneDp) {
    const d = Math.floor(Math.random() * 9) + 1   // 1–9
    return d / 10
  }
  const dp = Math.random() < 0.5 ? 1 : 2
  if (dp === 1) {
    return (Math.floor(Math.random() * 9) + 1) / 10
  }
  // 2 dp — last digit must not be 0
  const cents = Math.floor(Math.random() * 89) + 11  // 11–99
  if (cents % 10 === 0) return cents / 100 + 0.01
  return cents / 100
}

/** Generate a pair — randomly either both 1dp, both 2dp, or mixed */
function newPair(): [number, number] {
  const kind = Math.floor(Math.random() * 3) // 0=both 1dp, 1=both 2dp, 2=mixed
  let a: number, b: number
  if (kind === 0) {
    // both 1 dp
    a = randDecimal(true)
    b = randDecimal(true)
    while (r(a + b) > 1.8) b = randDecimal(true)
  } else if (kind === 1) {
    // both 2 dp
    a = randDecimal(false)
    while (decimalPlaces(a) !== 2) a = randDecimal(false)
    b = randDecimal(false)
    while (decimalPlaces(b) !== 2) b = randDecimal(false)
    while (r(a + b) > 1.8) { b = randDecimal(false); while (decimalPlaces(b) !== 2) b = randDecimal(false) }
  } else {
    // mixed: one 1dp, one 2dp
    a = randDecimal(true)
    b = randDecimal(false)
    while (decimalPlaces(b) !== 2) b = randDecimal(false)
    while (r(a + b) > 1.8) { b = randDecimal(false); while (decimalPlaces(b) !== 2) b = randDecimal(false) }
  }
  return [a, b]
}

/** Generate a cup pair for add/subtract */
function newCupPair(mode: CupMode): [number, number] {
  const a = randDecimal(true)
  let b = randDecimal(true)
  if (mode === 'subtract') {
    // ensure a > b
    while (b >= a) b = randDecimal(true)
  } else {
    while (r(a + b) > 1.0) b = randDecimal(true)
  }
  return [a, b]
}

// ─── Alignment Step Component ─────────────────────────────────────────────────

type AlignStep = 'initial' | 'pad' | 'aligned' | 'result'

function AlignTab() {
  const [opMode, setOpMode] = useState<'add' | 'subtract'>('add')
  const [[a, b], setPair] = useState<[number, number]>(newPair)
  const [step, setStep] = useState<AlignStep>('initial')

  const dpA = decimalPlaces(a)
  const dpB = decimalPlaces(b)
  const maxDp = Math.max(dpA, dpB)
  const result = opMode === 'add' ? r(a + b, maxDp) : r(a - b, maxDp)
  const opSymbol = opMode === 'add' ? '+' : '−'

  function genPair(mode: 'add' | 'subtract') {
    if (mode === 'subtract') {
      // ensure a > b for clean positive result; both any dp combo
      let na = newPair()[0], nb = newPair()[1]
      // swap so na > nb
      if (na <= nb) [na, nb] = [nb, na]
      // if still equal, regenerate
      let attempts = 0
      while (na === nb && attempts++ < 20) { [na, nb] = newPair() ; if (na <= nb) [na, nb] = [nb, na] }
      return [na, nb] as [number, number]
    }
    return newPair()
  }

  const shuffle = useCallback(() => {
    setPair(genPair(opMode))
    setStep('initial')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opMode])

  function switchOp(mode: 'add' | 'subtract') {
    setOpMode(mode)
    setPair(genPair(mode))
    setStep('initial')
  }

  // Was the last digit added (zero padded)?
  const aPadded = dpA < maxDp
  const bPadded = dpB < maxDp

  // When both numbers have the same dp, skip the "pad" step
  const sameDp = dpA === dpB
  const steps: AlignStep[] = sameDp
    ? ['initial', 'aligned', 'result']
    : ['initial', 'pad', 'aligned', 'result']

  const isAligned = step === 'aligned' || step === 'result'
  const showResult = step === 'result'

  // Step labels
  const stepMeta: Record<AlignStep, { label: string; color: string }> = {
    initial:  { label: '小数', color: 'bg-slate-100 text-slate-600' },
    pad:      { label: '补零对齐', color: 'bg-amber-100 text-amber-700' },
    aligned:  { label: '竖式对齐', color: 'bg-blue-100 text-blue-700' },
    result:   { label: '得出答案', color: 'bg-emerald-100 text-emerald-700' },
  }

  const stepIdx = steps.indexOf(step)
  const canNext = stepIdx < steps.length - 1
  const canPrev = stepIdx > 0

  function next() { if (canNext) setStep(steps[stepIdx + 1]) }
  function prev() { if (canPrev) setStep(steps[stepIdx - 1]) }

  // Which dp to display each number per step
  const dispDpA = step === 'initial' ? dpA : maxDp
  const dispDpB = step === 'initial' ? dpB : maxDp

  const strA        = toFixed(a, dispDpA)
  const strB        = toFixed(b, dispDpB)
  const strAAligned = toFixed(a, maxDp)
  const strBAligned = toFixed(b, maxDp)
  const strResult   = toFixed(result, maxDp)

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">

      {/* Op mode toggle */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1.5">
        {(['add', 'subtract'] as const).map(m => (
          <motion.button
            key={m}
            onClick={() => switchOp(m)}
            className={cn(
              'px-6 py-2.5 rounded-xl font-black text-base transition-colors',
              opMode === m
                ? m === 'add'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-violet-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600',
            )}
            whileTap={{ scale: 0.95 }}
          >
            {m === 'add' ? '➕ 加法' : '➖ 减法'}
          </motion.button>
        ))}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all',
              step === s ? stepMeta[s].color + ' scale-110 shadow-sm' : 'bg-slate-100 text-slate-400',
            )}>
              <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px] font-black">{i + 1}</span>
              {stepMeta[s].label}
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-5 h-0.5 rounded', i < stepIdx ? 'bg-emerald-400' : 'bg-slate-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Main display card */}
      <div className="w-full bg-white rounded-3xl border-2 border-slate-200 shadow-lg p-14">

        {/*
          Grid layout — 3 columns:
            col 1 (op):   fixed width, right-aligned  → "+" or blank
            col 2 (int):  min-content, right-aligned  → integer part
            col 3 (frac): min-content, left-aligned   → ".XX"
          This guarantees decimal points always line up perfectly.
        */}
        <div
          className="grid items-baseline"
          style={{ gridTemplateColumns: '4rem auto auto', justifyContent: 'center' }}
        >
          {/* ── Row A ── */}
          {/* op col — invisible spacer, same char width as opSymbol */}
          <span className="text-7xl font-black text-transparent select-none text-right pr-4">{opSymbol}</span>
          {/* int col */}
          <span className={cn('text-8xl font-black leading-none text-right', 'text-blue-600')}>
            {isAligned ? strAAligned.split('.')[0] : strA.split('.')[0]}
          </span>
          {/* frac col (dot + digits) */}
          <DecFrac
            str={isAligned ? strAAligned : strA}
            padded={aPadded && step === 'pad'}
            dotColor="text-rose-500"
            numColor="text-blue-600"
            size="text-8xl"
          />

          {/* ── Row B ── */}
          {/* op col */}
          <div className="text-7xl font-black text-right pr-4 leading-none py-1">
            {isAligned ? (
              <motion.span
                className="text-slate-400"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {opSymbol}
              </motion.span>
            ) : (
              <span className="text-transparent select-none">{opSymbol}</span>
            )}
          </div>
          {/* int col */}
          <span className={cn('text-8xl font-black leading-none text-right', 'text-violet-600')}>
            {isAligned ? strBAligned.split('.')[0] : strB.split('.')[0]}
          </span>
          {/* frac col */}
          <DecFrac
            str={isAligned ? strBAligned : strB}
            padded={bPadded && step === 'pad'}
            dotColor="text-rose-500"
            numColor="text-violet-600"
            size="text-8xl"
          />

          {/* ── First divider (spans all 3 cols) ── */}
          {isAligned && (
            <motion.div
              className="col-span-3 h-1 bg-slate-300 rounded my-4"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.15 }}
              style={{ transformOrigin: 'left' }}
            />
          )}

          {/* ── Result row ── */}
          {showResult && (
            <>
              <motion.span
                className="text-7xl font-black text-transparent select-none text-right pr-4 leading-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {opSymbol}
              </motion.span>
              <motion.span
                className="text-8xl font-black leading-none text-right text-emerald-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              >
                {strResult.split('.')[0]}
              </motion.span>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              >
                <DecFrac
                  str={strResult}
                  padded={false}
                  dotColor="text-emerald-400"
                  numColor="text-emerald-600"
                  size="text-8xl"
                />
              </motion.div>
            </>
          )}

          {/* ── Bottom line after result ── */}
          {showResult && (
            <motion.div
              className="col-span-3 h-1 bg-slate-300 rounded mt-4"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.4 }}
              style={{ transformOrigin: 'left' }}
            />
          )}
        </div>

        {/* Step description */}
        <motion.div
          key={step}
          className="mt-6 text-center text-lg text-slate-500 font-bold"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {step === 'initial' && !sameDp && `${strA} 和 ${strB} 的小数位数不同`}
          {step === 'initial' &&  sameDp && `${strA} 和 ${strB} 的小数位数一样`}
          {step === 'pad'     && aPadded && `把 ${a} 补零写成 ${strAAligned}`}
          {step === 'pad'     && bPadded && `把 ${b} 补零写成 ${strBAligned}`}
          {step === 'aligned' && (opMode === 'add' ? '小数点对齐，准备相加！' : '小数点对齐，准备相减！')}
          {step === 'result'  && `${strAAligned} ${opSymbol} ${strBAligned} = ${strResult}`}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={prev}
          disabled={!canPrev}
          className="px-6 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-500 font-black text-base disabled:opacity-30 hover:bg-slate-50"
          whileTap={{ scale: 0.95 }}
        >
          ← 上一步
        </motion.button>

        <motion.button
          onClick={next}
          disabled={!canNext}
          className={cn(
            'px-10 py-3.5 rounded-2xl font-black text-base text-white transition-colors',
            canNext ? 'bg-blue-500 hover:bg-blue-600 shadow-md shadow-blue-200' : 'bg-slate-300',
          )}
          whileTap={{ scale: 0.95 }}
          whileHover={canNext ? { scale: 1.03 } : {}}
        >
          {stepIdx === steps.length - 2
            ? '显示答案 →'
            : stepIdx === steps.length - 1
            ? '完成 ✓'
            : sameDp
            ? '竖式对齐 →'
            : stepIdx === 0
            ? '对齐小数点 →'
            : '竖式对齐 →'}
        </motion.button>

        <motion.button
          onClick={shuffle}
          className="flex items-center gap-1.5 px-5 py-3.5 rounded-2xl border-2 border-amber-200 text-amber-600 font-black text-base hover:bg-amber-50"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
        >
          <Shuffle className="w-5 h-5" />
          换题
        </motion.button>
      </div>
    </div>
  )
}

// ─── DecFrac: renders ".XX" portion of a decimal ─────────────────────────────

function DecFrac({
  str, padded, dotColor, numColor, size,
}: {
  str: string
  padded: boolean
  dotColor: string
  numColor: string
  size: string
}) {
  const dot = str.indexOf('.')
  if (dot === -1) return <span />
  const fracFull = str.slice(dot + 1)  // e.g. "30"
  const base     = padded ? fracFull.slice(0, -1) : fracFull
  const extra    = padded ? fracFull.slice(-1) : null

  return (
    <div className={cn('flex items-baseline font-black leading-none', size)}>
      <span className={cn('mx-0.5', dotColor)}>.</span>
      <span className={numColor}>{base}</span>
      {extra && (
        <motion.span
          className="text-amber-500"
          initial={{ opacity: 0, scale: 0.3, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
          {extra}
        </motion.span>
      )}
    </div>
  )
}

// ─── Water Cup Component ──────────────────────────────────────────────────────

function CupTab() {
  const [mode, setMode] = useState<CupMode>('add')
  const [[a, b], setPair] = useState<[number, number]>(() => newCupPair('add'))
  const [poured, setPoured] = useState(false)

  const result = mode === 'add' ? r(a + b) : r(a - b)

  function shuffle() {
    setPair(newCupPair(mode))
    setPoured(false)
  }

  function switchMode(m: CupMode) {
    setMode(m)
    setPair(newCupPair(m))
    setPoured(false)
  }

  function pour() {
    setPoured(true)
  }

  // Cup A fill % (0–100)
  const fillResult = poured ? result * 100 : 0

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">

      {/* Mode toggle */}
      <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1.5">
        {(['add', 'subtract'] as CupMode[]).map(m => (
          <motion.button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              'px-5 py-2.5 rounded-xl font-black text-sm transition-colors',
              mode === m
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600',
            )}
            whileTap={{ scale: 0.95 }}
          >
            {m === 'add' ? '➕ 加法' : '➖ 减法'}
          </motion.button>
        ))}
      </div>

      {/* Cups scene */}
      <div className="w-full bg-white rounded-3xl border-2 border-slate-200 shadow-lg p-8">
        <div className="flex items-end justify-center gap-6">

          {/* Cup A */}
          <Cup
            label="杯子 A"
            value={a}
            fillPct={mode === 'subtract' && poured ? result * 100 : a * 100}
            color="bg-blue-400"
            highlight={!poured}
          />

          {/* Operator */}
          <div className="flex flex-col items-center pb-6 gap-1">
            <span className="text-4xl font-black text-slate-300">
              {mode === 'add' ? '+' : '−'}
            </span>
          </div>

          {/* Cup B */}
          <Cup
            label="杯子 B"
            value={b}
            fillPct={mode === 'add' && poured ? 0 : b * 100}
            color="bg-violet-400"
            highlight={!poured}
            fading={mode === 'add' && poured}
          />

          {/* Arrow + result cup */}
          <AnimatePresence>
            {mode === 'add' && (
              <motion.div
                className="flex items-end gap-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span className="text-3xl font-black text-slate-300 pb-6">=</span>
                <Cup
                  label="合计"
                  value={poured ? result : null}
                  fillPct={fillResult}
                  color="bg-emerald-400"
                  highlight={poured}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* After subtract: show result label under cup A */}
        <AnimatePresence>
          {mode === 'subtract' && poured && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-2xl font-black text-emerald-600">
                {a} − {b} = <span className="text-4xl">{result}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Description */}
        <motion.p
          key={`${mode}-${poured}`}
          className="mt-4 text-center text-sm text-slate-400 font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {!poured && mode === 'add' && `把 ${a} 和 ${b} 的水倒在一起，结果是多少？`}
          {!poured && mode === 'subtract' && `杯子 A 有 ${a}，倒走 ${b}，还剩多少？`}
          {poured && mode === 'add' && `${a} + ${b} = ${result} 🎉`}
          {poured && mode === 'subtract' && `${a} − ${b} = ${result} 🎉`}
        </motion.p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={pour}
          disabled={poured}
          className={cn(
            'px-8 py-3 rounded-2xl font-black text-base text-white transition-colors shadow-md',
            !poured
              ? mode === 'add'
                ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
                : 'bg-violet-500 hover:bg-violet-600 shadow-violet-200'
              : 'bg-slate-300',
          )}
          whileTap={{ scale: 0.95 }}
          whileHover={!poured ? { scale: 1.03 } : {}}
        >
          {mode === 'add' ? '🫗 倒在一起' : '💧 倒走水'}
        </motion.button>

        <motion.button
          onClick={shuffle}
          className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border-2 border-amber-200 text-amber-600 font-black text-sm hover:bg-amber-50"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
        >
          <Shuffle className="w-4 h-4" />
          换题
        </motion.button>
      </div>
    </div>
  )
}

// ─── Cup SVG ─────────────────────────────────────────────────────────────────

function Cup({
  label, value, fillPct, color, highlight = false, fading = false,
}: {
  label: string
  value: number | null
  fillPct: number
  color: string
  highlight?: boolean
  fading?: boolean
}) {
  const W = 80
  const H = 120

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-black text-slate-400 uppercase tracking-wider">{label}</div>

      {/* Cup body */}
      <div
        className={cn(
          'relative rounded-b-2xl border-4 overflow-hidden transition-all duration-300',
          highlight ? 'border-slate-300' : 'border-slate-200',
        )}
        style={{ width: W, height: H }}
      >
        {/* Water fill */}
        <motion.div
          className={cn('absolute bottom-0 left-0 right-0 rounded-b-xl', color)}
          animate={{ height: `${Math.min(100, Math.max(0, fillPct))}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, duration: 0.8 }}
          style={{ opacity: fading ? 0.3 : 1 }}
        />

        {/* Wave shimmer */}
        {fillPct > 0 && !fading && (
          <motion.div
            className="absolute left-0 right-0 h-2 rounded-full opacity-40 bg-white"
            animate={{ bottom: `${Math.min(100, fillPct)}%`, x: [0, 4, -4, 0] }}
            transition={{ x: { repeat: Infinity, duration: 2, ease: 'easeInOut' }, bottom: { type: 'spring', stiffness: 120, damping: 18 } }}
          />
        )}
      </div>

      {/* Value label */}
      <motion.div
        key={String(value)}
        className={cn(
          'text-2xl font-black',
          highlight ? 'text-slate-700' : 'text-slate-400',
        )}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        {value !== null ? value : '?'}
      </motion.div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DecimalPage() {
  const [tab, setTab] = useState<Tab>('align')

  return (
    <div className="min-h-svh bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col select-none">

      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🔢</span>
          <div>
            <div className="text-base font-black text-slate-800">小数</div>
            <div className="text-[11px] text-slate-400 font-medium">Decimals · S3 Math</div>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <motion.button
            onClick={() => setTab('align')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-black transition-colors',
              tab === 'align'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600',
            )}
            whileTap={{ scale: 0.95 }}
          >
            <AlignCenter className="w-4 h-4" />
            竖式对齐
          </motion.button>
          <motion.button
            onClick={() => setTab('cups')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-black transition-colors',
              tab === 'cups'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600',
            )}
            whileTap={{ scale: 0.95 }}
          >
            <Brain className="w-4 h-4" />
            动动脑筋
          </motion.button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {tab === 'align' ? (
            <motion.div
              key="align"
              className="w-full"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <AlignTab />
            </motion.div>
          ) : (
            <motion.div
              key="cups"
              className="w-full"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <CupTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
