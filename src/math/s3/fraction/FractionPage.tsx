import { useState, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

// ─── Food Theme ───────────────────────────────────────────────────────────────
type FoodTheme = 'pizza' | 'choc' | 'cake'

const FOOD_META: Record<FoodTheme, { label: string; emoji: string; subtitle: string }> = {
  pizza: { label: '披萨',   emoji: '🍕', subtitle: '点击切片来学习分数！🎉' },
  choc:  { label: '巧克力', emoji: '🍫', subtitle: '掰开巧克力来学习分数！🎉' },
  cake:  { label: '蛋糕',   emoji: '🎂', subtitle: '切蛋糕来学习分数！🎉' },
}

// ─── Audio Helpers ────────────────────────────────────────────────────────────
function playSelect() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator(); const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.22, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2)
  } catch (_) { /* silent */ }
}
function playDeselect() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator(); const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.18)
  } catch (_) { /* silent */ }
}

// ─── Math Helpers ─────────────────────────────────────────────────────────────
function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }
function lcm(a: number, b: number): number { return (a * b) / gcd(a, b) }
function toCommonDen(nA: number, dA: number, nB: number, dB: number): [number, number, number] {
  const c = lcm(dA, dB)
  return [nA * (c / dA), nB * (c / dB), c]
}

// ─── Constants ───────────────────────────────────────────────────────────────
const ITEM_ACCENT    = ['#E8472A', '#2E86AB', '#6B4226']
const ITEM_ACCENT_BG = ['#fff3f0', '#eef7ff', '#f4ede8']
const ITEM_FILL      = ['#F4A261', '#48CAE4', '#A8DADC']
const CRUST_COLOR     = '#C8860A'
const CHEESE_COLOR    = '#F5C842'
const PEPPERONI_COLOR = '#9B2226'
const SLICE_OPTIONS   = [2, 3, 4, 5, 6, 7, 8, 9, 10]
const CHOC_OPTIONS    = [2, 4, 6, 8, 10]
type Mode = 'normal' | 'addition' | 'subtraction'

// ─── SVG Components ───────────────────────────────────────────────────────────
interface FoodSVGProps {
  slices: number; selected: boolean[]; onToggle: (i: number) => void
  accentColor: string; selectedFill: string; theme: FoodTheme; size?: number
}

function PizzaSVG({ slices, selected, onToggle, accentColor, selectedFill, size = 200 }: Omit<FoodSVGProps, 'theme'>) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 10, uid = `pizza-${size}-${slices}`
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className="drop-shadow-lg transition-transform hover:scale-[1.03] w-full h-auto max-w-[260px]"
      aria-label={`Pizza with ${slices} slices`}>
      <defs>
        <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00000033" />
        </filter>
        <radialGradient id={`cg-${uid}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFF3B0" /><stop offset="100%" stopColor={CHEESE_COLOR} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R + 7} fill={CRUST_COLOR} filter={`url(#shadow-${uid})`} />
      <circle cx={cx} cy={cy} r={R} fill="#D62828" />
      <circle cx={cx} cy={cy} r={R * 0.93} fill={`url(#cg-${uid})`} />
      {Array.from({ length: slices }, (_, i) => {
        const isSel = selected[i] ?? false
        const sa = (i / slices) * 2 * Math.PI - Math.PI / 2
        const ea = ((i + 1) / slices) * 2 * Math.PI - Math.PI / 2
        const ma = (sa + ea) / 2, la = slices === 1 ? 1 : 0
        const r = R * 0.93, g = slices > 6 ? 0.008 : 0.015
        const x1 = cx + r * Math.cos(sa + g), y1 = cy + r * Math.sin(sa + g)
        const x2 = cx + r * Math.cos(ea - g), y2 = cy + r * Math.sin(ea - g)
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2} Z`
        const px = cx + R * 0.58 * Math.cos(ma), py = cy + R * 0.58 * Math.sin(ma)
        return (
          <g key={i} onClick={() => onToggle(i)} style={{ cursor: 'pointer' }}
            role="button" aria-label={`Slice ${i + 1}`} aria-pressed={isSel}>
            <path d={d} fill={isSel ? selectedFill : CHEESE_COLOR} opacity={isSel ? 1 : 0.28}
              stroke="#fff" strokeWidth="2" />
            {isSel && <path d={d} fill={selectedFill} opacity={0.22} stroke="none" />}
            <line x1={cx} y1={cy} x2={cx + R * Math.cos(sa)} y2={cy + R * Math.sin(sa)}
              stroke="#fff" strokeWidth="1.6" opacity="0.7" />
            {isSel && <>
              <circle cx={px} cy={py} r={R * 0.085} fill={PEPPERONI_COLOR} opacity="0.9" />
              <circle cx={px} cy={py} r={R * 0.046} fill="#7B1D1D" opacity="0.55" />
            </>}
            <path d={d} fill="transparent" />
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={9} fill={CRUST_COLOR} />
      <circle cx={cx} cy={cy} r={5} fill="#A0600A" />
      <circle cx={cx} cy={cy} r={R + 7} fill="none" stroke={accentColor} strokeWidth="3" opacity="0.45" />
    </svg>
  )
}

function ChocSVG({ slices, selected, onToggle, accentColor, selectedFill, size = 200 }: Omit<FoodSVGProps, 'theme'>) {
  const rows = 2, cols = Math.max(1, slices / 2)
  const pad = 12, gap = 6
  const cellW = (size - pad * 2 - gap * (cols - 1)) / cols
  const cellH = (size * 0.6 - pad * 2 - gap * (rows - 1)) / rows
  const totalH = rows * cellH + (rows - 1) * gap + pad * 2 + 4
  return (
    <svg width={size} height={totalH} viewBox={`0 0 ${size} ${totalH}`}
      className="drop-shadow-lg w-full h-auto max-w-[260px]"
      aria-label={`Chocolate bar with ${slices} pieces`}>
      <rect x={2} y={2} width={size - 4} height={totalH - 4} rx={12} ry={12} fill="#4a1c00" filter="url(#choc-shadow)" />
      <defs>
        <filter id="choc-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#00000040" />
        </filter>
      </defs>
      {Array.from({ length: slices }, (_, i) => {
        const col = i % cols, row = Math.floor(i / cols)
        const x = pad + col * (cellW + gap), y = pad + row * (cellH + gap)
        const isSel = selected[i] ?? false
        return (
          <g key={i} onClick={() => onToggle(i)} style={{ cursor: 'pointer' }}
            role="button" aria-label={`Piece ${i + 1}`} aria-pressed={isSel}>
            <rect x={x} y={y} width={cellW} height={cellH} rx={6} ry={6}
              fill={isSel ? selectedFill : '#6b2f00'} opacity={isSel ? 1 : 0.35}
              stroke={accentColor} strokeWidth="1.5" />
            {isSel && <rect x={x + cellW * 0.15} y={y + cellH * 0.12}
              width={cellW * 0.25} height={cellH * 0.12} rx={3} fill="#fff" opacity="0.3" />}
            <rect x={x} y={y} width={cellW} height={cellH} rx={6} fill="transparent" />
          </g>
        )
      })}
    </svg>
  )
}

function CakeSVG({ slices, selected, onToggle, accentColor, selectedFill, size = 200 }: Omit<FoodSVGProps, 'theme'>) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 14, uid = `cake-${size}-${slices}`
  const SPONGE = '#F9C784', FROSTING = '#FDEEFF', DRIP = '#E78EDE'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className="drop-shadow-lg transition-transform hover:scale-[1.03] w-full h-auto max-w-[260px]"
      aria-label={`Cake with ${slices} slices`}>
      <defs>
        <filter id={`cake-sh-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00000033" />
        </filter>
        <radialGradient id={`cake-grad-${uid}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fff8f0" /><stop offset="100%" stopColor={SPONGE} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R + 8} fill="#C06090" filter={`url(#cake-sh-${uid})`} />
      <circle cx={cx} cy={cy} r={R + 4} fill={DRIP} />
      <circle cx={cx} cy={cy} r={R} fill={`url(#cake-grad-${uid})`} />
      {Array.from({ length: slices }, (_, i) => {
        const isSel = selected[i] ?? false
        const sa = (i / slices) * 2 * Math.PI - Math.PI / 2
        const ea = ((i + 1) / slices) * 2 * Math.PI - Math.PI / 2
        const ma = (sa + ea) / 2, la = slices === 1 ? 1 : 0
        const g = slices > 6 ? 0.008 : 0.015
        const x1 = cx + R * Math.cos(sa + g), y1 = cy + R * Math.sin(sa + g)
        const x2 = cx + R * Math.cos(ea - g), y2 = cy + R * Math.sin(ea - g)
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${la} 1 ${x2} ${y2} Z`
        const dx = cx + R * 0.58 * Math.cos(ma), dy = cy + R * 0.58 * Math.sin(ma)
        return (
          <g key={i} onClick={() => onToggle(i)} style={{ cursor: 'pointer' }}
            role="button" aria-label={`Slice ${i + 1}`} aria-pressed={isSel}>
            <path d={d} fill={isSel ? selectedFill : FROSTING} opacity={isSel ? 1 : 0.3} stroke="#fff" strokeWidth="2" />
            {isSel && <>
              <circle cx={dx} cy={dy} r={R * 0.08} fill="#FF6B6B" opacity="0.9" />
              <circle cx={dx} cy={dy - R * 0.14} r={R * 0.025} fill="#FFD700" opacity="0.95" />
            </>}
            <line x1={cx} y1={cy} x2={cx + R * Math.cos(sa)} y2={cy + R * Math.sin(sa)}
              stroke="#fff" strokeWidth="1.6" opacity="0.7" />
            <path d={d} fill="transparent" />
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={R + 4} fill="none" stroke={FROSTING} strokeWidth="5" opacity="0.6" />
      <circle cx={cx} cy={cy} r={10} fill={DRIP} />
      <circle cx={cx} cy={cy} r={5} fill="#C06090" />
      <circle cx={cx} cy={cy} r={R + 8} fill="none" stroke={accentColor} strokeWidth="3" opacity="0.4" />
    </svg>
  )
}

function FoodSVG({ theme, ...props }: FoodSVGProps) {
  if (theme === 'choc') return <ChocSVG {...props} />
  if (theme === 'cake') return <CakeSVG {...props} />
  return <PizzaSVG {...props} />
}

// ─── Fraction Component ───────────────────────────────────────────────────────
interface FracProps { num: number; den: number; color?: string; size?: 'lg' | 'md' | 'sm' }

function Frac({ num, den, color = '#333', size = 'lg' }: FracProps) {
  const numCls = size === 'lg' ? 'text-6xl' : size === 'md' ? 'text-4xl' : 'text-2xl'
  const denCls = size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-3xl' : 'text-xl'
  const barH   = size === 'lg' ? 'h-[5px] my-1.5 min-w-[2.4em]' : size === 'md' ? 'h-[4px] my-1 min-w-[1.8em]' : 'h-[2px] my-0.5 min-w-[1.2em]'
  return (
    <div className="inline-flex flex-col items-center leading-none">
      <span className={cn(numCls, 'font-black leading-none')} style={{ color }}>{num}</span>
      <span className={cn('block rounded-sm', barH)} style={{ background: color }} />
      <span className={cn(denCls, 'font-bold leading-none')} style={{ color }}>{den}</span>
    </div>
  )
}

// ─── Pizza Card ───────────────────────────────────────────────────────────────
interface CardProps {
  index: number; slices: number; selected: boolean[]
  onToggle: (i: number) => void; onSliceChange: (s: number) => void; theme: FoodTheme
}

function PizzaCard({ index, slices, selected, onToggle, onSliceChange, theme }: CardProps) {
  const meta = FOOD_META[theme]
  const label = `${meta.emoji} ${meta.label} ${String.fromCharCode(65 + index)}`
  const accent = ITEM_ACCENT[index]
  const bg = ITEM_ACCENT_BG[index]
  const fill = ITEM_FILL[index]
  const count = selected.filter(Boolean).length
  const sliceOpts = theme === 'choc' ? CHOC_OPTIONS : SLICE_OPTIONS

  return (
    <div className="bg-white rounded-3xl flex flex-col items-center gap-3 flex-1 min-w-0 p-4 pb-5
      shadow-[0_6px_28px_rgba(0,0,0,0.09)] transition-transform hover:-translate-y-1"
      style={{ borderTop: `6px solid ${accent}` }}>
      <div className="text-2xl font-black tracking-wide" style={{ color: accent }}>{label}</div>

      {/* Slice selector */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-base font-extrabold text-slate-500 whitespace-nowrap">✂️ 切片：</span>
        <div className="flex gap-1.5 flex-wrap justify-center">
          {sliceOpts.map(s => (
            <button key={s} onClick={() => onSliceChange(s)}
              className={cn(
                'w-10 h-10 rounded-xl text-base font-extrabold border-2 transition-all',
                slices === s ? 'text-white shadow-md scale-110' : 'bg-slate-50 text-slate-500 hover:scale-110'
              )}
              style={slices === s
                ? { background: accent, borderColor: accent }
                : { borderColor: accent, color: accent }}
            >{s}</button>
          ))}
        </div>
      </div>

      <FoodSVG theme={theme} slices={slices} selected={selected}
        onToggle={onToggle} accentColor={accent} selectedFill={fill} />

      <div className="flex flex-col items-center gap-2 rounded-2xl px-8 py-4 w-full"
        style={{ background: bg }}>
        <div className="text-lg font-black uppercase tracking-widest opacity-80" style={{ color: accent }}>分数</div>
        <Frac num={count} den={slices} color={accent} size="lg" />
      </div>
    </div>
  )
}

// ─── Math Result ──────────────────────────────────────────────────────────────
function MathResult({ mode, counts, dens }: { mode: 'addition' | 'subtraction'; counts: number[]; dens: number[] }) {
  const [showHint, setShowHint] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const numA = counts[0] ?? 0, numB = counts[1] ?? 0
  const denA = dens[0] ?? 4, denB = dens[1] ?? 4
  const op = mode === 'addition' ? '+' : '−'
  const [cA, cB, cDen] = toCommonDen(numA, denA, numB, denB)
  const resultNum = mode === 'addition' ? cA + cB : Math.max(0, cA - cB)
  const sameDen = denA === denB
  const colorA = ITEM_ACCENT[0], colorB = ITEM_ACCENT[1], colorR = '#5C4033'

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-3xl font-black text-center text-slate-700">
        {mode === 'addition' ? '➕ 加法' : '➖ 减法'}
      </h2>

      {/* Question row */}
      <div className="flex items-center gap-5 flex-wrap bg-slate-50 rounded-2xl px-7 py-5 border-2 border-slate-200">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 min-w-[70px]">题目</span>
        <div className="flex items-center gap-4 flex-wrap">
          <Frac num={numA} den={denA} color={colorA} size="md" />
          <span className="text-4xl font-black text-slate-500">{op}</span>
          <Frac num={numB} den={denB} color={colorB} size="md" />
          <span className="text-4xl font-black text-emerald-500">=</span>
          <span className="text-4xl font-black text-slate-300">?</span>
        </div>
      </div>

      {/* Hint */}
      {!sameDen && (
        <div className="flex flex-col gap-3">
          <Button variant="outline"
            className={cn('self-start rounded-full border-2 border-orange-300 text-orange-700 bg-orange-50 px-6 py-4 h-auto text-base font-black hover:bg-orange-400 hover:text-white', showHint && 'bg-orange-400 text-white')}
            onClick={() => setShowHint(v => !v)}>
            {showHint ? '🙈 隐藏提示' : '💡 提示：通分'}
          </Button>
          {showHint && (
            <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-2xl px-6 py-4 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
              <span className="text-xl font-extrabold text-orange-800">把分母化为相同：<strong>/{cDen}</strong></span>
              <div className="flex items-center gap-4 flex-wrap mt-2">
                <Frac num={numA} den={denA} color={colorA} size="md" />
                <span className="text-2xl font-bold text-slate-400">→</span>
                <Frac num={cA} den={cDen} color={colorA} size="md" />
                <span className="text-2xl text-slate-300 mx-1">|</span>
                <Frac num={numB} den={denB} color={colorB} size="md" />
                <span className="text-2xl font-bold text-slate-400">→</span>
                <Frac num={cB} den={cDen} color={colorB} size="md" />
              </div>
            </div>
          )}
        </div>
      )}

      {sameDen && (
        <div className="flex items-center gap-3 px-3 py-1">
          <span className="text-2xl">✅</span>
          <span className="text-xl font-extrabold text-slate-500 italic">分母相同，可以直接计算！</span>
        </div>
      )}

      {/* Answer */}
      <div className="flex flex-col gap-3">
        <Button variant="outline"
          className={cn('self-start rounded-full border-2 border-blue-300 text-blue-700 bg-blue-50 px-6 py-4 h-auto text-base font-black hover:bg-blue-500 hover:text-white', showAnswer && 'bg-blue-500 text-white')}
          onClick={() => setShowAnswer(v => !v)}>
          {showAnswer ? '🙈 隐藏答案' : '🎯 显示答案'}
        </Button>
        {showAnswer && (
          <div className="flex items-center gap-5 flex-wrap bg-yellow-50 rounded-2xl px-7 py-5 border-2 border-yellow-300 animate-in slide-in-from-top-2 duration-200">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 min-w-[70px]">答案</span>
            <div className="flex items-center gap-4 flex-wrap">
              <Frac num={cA} den={cDen} color={colorA} size="md" />
              <span className="text-4xl font-black text-slate-500">{op}</span>
              <Frac num={cB} den={cDen} color={colorB} size="md" />
              <span className="text-4xl font-black text-emerald-500">=</span>
              <div className="border-4 border-slate-600 rounded-2xl px-6 py-3 bg-white shadow-md">
                <Frac num={resultNum} den={cDen} color={colorR} size="lg" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── FractionPage ─────────────────────────────────────────────────────────────
function buildSelected(s: number): boolean[] { return Array(s).fill(false) }

export default function FractionPage() {
  const [numPizzas, setNumPizzas] = useState(1)
  const [slices, setSlices] = useState([4, 4, 4])
  const [selected, setSelected] = useState<boolean[][]>([buildSelected(4), buildSelected(4), buildSelected(4)])
  const [mode, setMode] = useState<Mode>('normal')
  const [theme, setTheme] = useState<FoodTheme>('pizza')
  const meta = FOOD_META[theme]

  const handlePizzaSlices = (pi: number, s: number) => {
    setSlices(prev => { const n = [...prev]; n[pi] = s; return n })
    setSelected(prev => { const n = [...prev]; n[pi] = buildSelected(s); return n })
  }

  const toggleSlice = useCallback((pi: number, si: number) => {
    setSelected(prev => {
      const n = prev.map(a => [...a]); const was = n[pi][si]; n[pi][si] = !was
      was ? playDeselect() : playSelect(); return n
    })
  }, [])

  const reset = () => setSelected(slices.map(s => buildSelected(s)))
  const counts = selected.map(arr => arr.filter(Boolean).length)

  return (
    <div className="w-full max-w-full">

      {/* Header */}
      <header className="text-center mb-8 pt-7 px-9">
        <h1 className="text-7xl md:text-8xl font-black tracking-widest text-slate-800 drop-shadow-sm">分数</h1>
        <p className="text-2xl text-slate-500 mt-2 font-bold">{meta.subtitle}</p>
      </header>

      {/* Controls */}
      <section className="bg-white px-9 py-7 shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex flex-wrap gap-7 items-end mb-8 w-full">

        {/* Theme */}
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2.5">
            {(['pizza', 'choc', 'cake'] as FoodTheme[]).map(t => (
              <button key={t} title={FOOD_META[t].label} onClick={() => setTheme(t)}
                className={cn(
                  'text-3xl px-4 py-2.5 rounded-2xl border-3 border-slate-200 bg-slate-50 cursor-pointer transition-all hover:scale-105',
                  theme === t && 'bg-gradient-to-br from-orange-400 to-orange-500 border-orange-500 text-white shadow-lg scale-105'
                )}>
                {FOOD_META[t].emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xl font-extrabold text-slate-500">🍽️ {meta.label}数量</label>
          <div className="flex gap-2.5">
            {[1, 2, 3].map(n => (
              <button key={n} onClick={() => setNumPizzas(n)}
                className={cn(
                  'w-16 h-16 rounded-[18px] border-[3px] text-2xl font-extrabold transition-all',
                  numPizzas === n
                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg scale-105'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-orange-400 hover:text-orange-400 hover:scale-105'
                )}>{n}</button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xl font-extrabold text-slate-500">✏️ 模式</label>
          <div className="flex gap-2.5 flex-wrap">
            {(['normal', 'addition', 'subtraction'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={cn(
                  'text-lg font-extrabold px-5 py-3.5 rounded-2xl border-[3px] transition-all whitespace-nowrap',
                  mode === m
                    ? 'bg-violet-600 border-violet-600 text-white shadow-lg'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-violet-500 hover:text-violet-600 hover:scale-[1.04]'
                )}>
                {m === 'normal' ? '🟢 普通模式' : m === 'addition' ? '➕ 加法' : '➖ 减法'}
              </button>
            ))}
          </div>
        </div>

        {/* Reset */}
        <Button variant="outline"
          className="border-[3px] border-teal-400 text-teal-500 hover:bg-teal-400 hover:text-white font-extrabold text-lg px-7 py-5 h-auto rounded-2xl mt-auto"
          onClick={reset}>
          <RotateCcw className="w-5 h-5" /> 重置
        </Button>
      </section>

      {/* Cards row */}
      <section className="flex flex-nowrap gap-5 justify-stretch items-start mb-8 overflow-x-auto px-9 pb-2 w-full">
        {Array.from({ length: numPizzas }, (_, pi) => (
          <PizzaCard key={pi} index={pi} slices={slices[pi]} selected={selected[pi] ?? []}
            onToggle={si => toggleSlice(pi, si)} onSliceChange={s => handlePizzaSlices(pi, s)} theme={theme} />
        ))}
      </section>

      {/* Result */}
      {(mode === 'addition' || mode === 'subtraction') && (
        <section className="bg-white px-10 py-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] mb-7 w-full">
          {numPizzas >= 2
            ? <MathResult mode={mode} counts={counts} dens={slices} />
            : <div className="text-center text-xl font-extrabold text-slate-400 py-7 border-[3px] border-dashed border-slate-200 rounded-2xl bg-slate-50">
                💡 请选择 <strong>2个或以上的{meta.label}</strong> 来使用{mode === 'addition' ? '加法' : '减法'}模式！
              </div>
          }
        </section>
      )}

      {/* Tips */}
      <section className="flex flex-wrap justify-center gap-3.5 mt-3 mb-8 px-9">
        {['👆 点击切片来选择','🌑 暗色 = 未选中','🌕 亮色 = 已选中','🔢 分数实时更新'].map(tip => (
          <div key={tip} className="bg-white rounded-[22px] px-5 py-3 text-lg font-extrabold text-slate-500 shadow-sm border-2 border-slate-100">{tip}</div>
        ))}
      </section>

      {/* Claw Machine Game link */}
      <section className="flex justify-center mb-16 px-9">
        <Link
          to="/s3/math/fraction/claw-machine"
          className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold px-8 py-4 rounded-2xl text-xl shadow-xl transition-all duration-200"
        >
          🎮 玩分数抓娃娃游戏
        </Link>
      </section>

    </div>
  )
}
