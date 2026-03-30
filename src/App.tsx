import { useState, useCallback } from 'react'
import './App.css'

// ─── Food Theme ───────────────────────────────────────────────────────────────
type FoodTheme = 'pizza' | 'choc' | 'cake'

const FOOD_META: Record<FoodTheme, { label: string; emoji: string; subtitle: string }> = {
  pizza: { label: '披萨',   emoji: '🍕', subtitle: '点击切片来学习分数！🎉' },
  choc:  { label: '巧克力', emoji: '🍫', subtitle: '掰开巧克力来学习分数！🎉' },
  cake:  { label: '蛋糕',   emoji: '🎂', subtitle: '切蛋糕来学习分数！🎉'    },
}

// ─── Audio Helpers ───────────────────────────────────────────────────────────

function playSelect() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.22, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  } catch (_) { /* silent fallback */ }
}

function playDeselect() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.18)
  } catch (_) { /* silent fallback */ }
}

// ─── Math Helpers ─────────────────────────────────────────────────────────────

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b)
}

function toCommonDen(
  numA: number, denA: number,
  numB: number, denB: number
): [number, number, number] {
  const common = lcm(denA, denB)
  return [
    numA * (common / denA),
    numB * (common / denB),
    common,
  ]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEM_ACCENT    = ['#E8472A', '#2E86AB', '#6B4226']
const ITEM_ACCENT_BG = ['#fff3f0', '#eef7ff', '#f4ede8']
const ITEM_FILL      = ['#F4A261', '#48CAE4', '#A8DADC']
const CRUST_COLOR     = '#C8860A'
const CHEESE_COLOR    = '#F5C842'
const PEPPERONI_COLOR = '#9B2226'
const SLICE_OPTIONS   = [2, 3, 4, 5, 6, 7, 8, 9, 10]
const CHOC_OPTIONS    = [2, 4, 6, 8, 10]    // chocolate: always 2 rows

type Mode = 'normal' | 'addition' | 'subtraction'

// ─── Pizza SVG ───────────────────────────────────────────────────────────────

interface FoodSVGProps {
  slices: number
  selected: boolean[]
  onToggle: (i: number) => void
  accentColor: string
  selectedFill: string
  theme: FoodTheme
  size?: number
}

function PizzaSVG({ slices, selected, onToggle, accentColor, selectedFill, size = 200 }: Omit<FoodSVGProps, 'theme'>) {
  const cx  = size / 2
  const cy  = size / 2
  const R   = size / 2 - 10
  const uid = `pizza-${size}-${slices}`

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pizza-svg"
      aria-label={`Pizza with ${slices} slices`}
    >
      <defs>
        <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00000033" />
        </filter>
        <radialGradient id={`cg-${uid}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFF3B0" />
          <stop offset="100%" stopColor={CHEESE_COLOR} />
        </radialGradient>
      </defs>

      {/* Crust */}
      <circle cx={cx} cy={cy} r={R + 7} fill={CRUST_COLOR} filter={`url(#shadow-${uid})`} />
      {/* Sauce */}
      <circle cx={cx} cy={cy} r={R} fill="#D62828" />
      {/* Cheese base */}
      <circle cx={cx} cy={cy} r={R * 0.93} fill={`url(#cg-${uid})`} />

      {Array.from({ length: slices }, (_, i) => {
        const isSelected  = selected[i] ?? false
        const startAngle  = (i / slices) * 2 * Math.PI - Math.PI / 2
        const endAngle    = ((i + 1) / slices) * 2 * Math.PI - Math.PI / 2
        const midAngle    = (startAngle + endAngle) / 2
        const largeArc    = slices === 1 ? 1 : 0
        const r           = R * 0.93
        const gap         = slices > 6 ? 0.008 : 0.015
        const x1          = cx + r * Math.cos(startAngle + gap)
        const y1          = cy + r * Math.sin(startAngle + gap)
        const x2          = cx + r * Math.cos(endAngle - gap)
        const y2          = cy + r * Math.sin(endAngle - gap)
        const d           = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
        const pR          = R * 0.58
        const px          = cx + pR * Math.cos(midAngle)
        const py          = cy + pR * Math.sin(midAngle)

        return (
          <g
            key={i}
            className={`slice-group${isSelected ? ' selected' : ''}`}
            onClick={() => onToggle(i)}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label={`Slice ${i + 1}${isSelected ? ' (selected)' : ''}`}
            aria-pressed={isSelected}
          >
            {/* Faded unselected / bright selected fill */}
            <path
              d={d}
              fill={isSelected ? selectedFill : CHEESE_COLOR}
              opacity={isSelected ? 1 : 0.28}
              stroke="#fff"
              strokeWidth="2"
              className="slice-path"
            />
            {/* Glow overlay on selected */}
            {isSelected && (
              <path d={d} fill={selectedFill} opacity={0.22} stroke="none" className="slice-glow" />
            )}
            {/* Divider line */}
            <line
              x1={cx} y1={cy}
              x2={cx + R * Math.cos(startAngle)}
              y2={cy + R * Math.sin(startAngle)}
              stroke="#fff" strokeWidth="1.6" opacity="0.7"
            />
            {/* Pepperoni on selected slices */}
            {isSelected && (
              <>
                <circle cx={px} cy={py} r={R * 0.085} fill={PEPPERONI_COLOR} opacity="0.9" />
                <circle cx={px} cy={py} r={R * 0.046} fill="#7B1D1D" opacity="0.55" />
              </>
            )}
            {/* Invisible hit area */}
            <path d={d} fill="transparent" className="slice-hit" />
          </g>
        )
      })}

      {/* Center cap */}
      <circle cx={cx} cy={cy} r={9}  fill={CRUST_COLOR} />
      <circle cx={cx} cy={cy} r={5}  fill="#A0600A" />
      {/* Accent ring */}
      <circle cx={cx} cy={cy} r={R + 7} fill="none" stroke={accentColor} strokeWidth="3" opacity="0.45" />
    </svg>
  )
}

// ─── Chocolate Bar SVG ────────────────────────────────────────────────────────
// Always 2 rows: cols = slices/2 (since CHOC_OPTIONS = 2,4,6,8,10)

function ChocSVG({ slices, selected, onToggle, accentColor, selectedFill, size = 200 }: Omit<FoodSVGProps, 'theme'>) {
  const rows  = 2
  const cols  = Math.max(1, slices / 2)
  const pad   = 12
  const gap   = 6
  const barW  = size
  const cellW = (barW - pad * 2 - gap * (cols - 1)) / cols
  const cellH = (size * 0.6 - pad * 2 - gap * (rows - 1)) / rows
  const totalH = rows * cellH + (rows - 1) * gap + pad * 2 + 4

  return (
    <svg width={size} height={totalH} viewBox={`0 0 ${size} ${totalH}`} className="pizza-svg" aria-label={`Chocolate bar with ${slices} pieces`}>
      {/* Bar background */}
      <rect x={2} y={2} width={size - 4} height={totalH - 4} rx={12} ry={12}
        fill="#4a1c00" filter="url(#choc-shadow)" />
      <defs>
        <filter id="choc-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#00000040" />
        </filter>
      </defs>
      {Array.from({ length: slices }, (_, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x   = pad + col * (cellW + gap)
        const y   = pad + row * (cellH + gap)
        const isSel = selected[i] ?? false
        return (
          <g key={i} onClick={() => onToggle(i)} style={{ cursor: 'pointer' }}
            role="button" aria-label={`Piece ${i + 1}`} aria-pressed={isSel}
            className={`slice-group${isSel ? ' selected' : ''}`}>
            <rect x={x} y={y} width={cellW} height={cellH} rx={6} ry={6}
              fill={isSel ? selectedFill : '#6b2f00'}
              opacity={isSel ? 1 : 0.35}
              stroke={accentColor} strokeWidth="1.5"
              className="slice-path" />
            {isSel && (
              <>
                {/* shine */}
                <rect x={x + cellW * 0.15} y={y + cellH * 0.12} width={cellW * 0.25} height={cellH * 0.12}
                  rx={3} fill="#fff" opacity="0.3" />
              </>
            )}
            <rect x={x} y={y} width={cellW} height={cellH} rx={6} fill="transparent" className="slice-hit" />
          </g>
        )
      })}
    </svg>
  )
}

// ─── Cake SVG ─────────────────────────────────────────────────────────────────

function CakeSVG({ slices, selected, onToggle, accentColor, selectedFill, size = 200 }: Omit<FoodSVGProps, 'theme'>) {
  const cx = size / 2
  const cy = size / 2
  const R  = size / 2 - 14
  const uid = `cake-${size}-${slices}`

  // Cake colours
  const SPONGE  = '#F9C784'
  const FROSTING = '#FDEEFF'
  const DRIP    = '#E78EDE'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pizza-svg" aria-label={`Cake with ${slices} slices`}>
      <defs>
        <filter id={`cake-sh-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00000033" />
        </filter>
        <radialGradient id={`cake-grad-${uid}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fff8f0" />
          <stop offset="100%" stopColor={SPONGE} />
        </radialGradient>
      </defs>

      {/* Base cake circle */}
      <circle cx={cx} cy={cy} r={R + 8} fill="#C06090" filter={`url(#cake-sh-${uid})`} />
      <circle cx={cx} cy={cy} r={R + 4} fill={DRIP} />
      <circle cx={cx} cy={cy} r={R}     fill={`url(#cake-grad-${uid})`} />

      {Array.from({ length: slices }, (_, i) => {
        const isSel     = selected[i] ?? false
        const startAngle = (i / slices) * 2 * Math.PI - Math.PI / 2
        const endAngle   = ((i + 1) / slices) * 2 * Math.PI - Math.PI / 2
        const midAngle   = (startAngle + endAngle) / 2
        const largeArc   = slices === 1 ? 1 : 0
        const r          = R
        const gap        = slices > 6 ? 0.008 : 0.015
        const x1 = cx + r * Math.cos(startAngle + gap)
        const y1 = cy + r * Math.sin(startAngle + gap)
        const x2 = cx + r * Math.cos(endAngle - gap)
        const y2 = cy + r * Math.sin(endAngle - gap)
        const d  = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
        const dR  = R * 0.58
        const dx  = cx + dR * Math.cos(midAngle)
        const dy  = cy + dR * Math.sin(midAngle)

        return (
          <g key={i} className={`slice-group${isSel ? ' selected' : ''}`}
            onClick={() => onToggle(i)} style={{ cursor: 'pointer' }}
            role="button" aria-label={`Slice ${i + 1}`} aria-pressed={isSel}>
            <path d={d} fill={isSel ? selectedFill : FROSTING}
              opacity={isSel ? 1 : 0.3} stroke="#fff" strokeWidth="2" className="slice-path" />
            {isSel && (
              <>
                {/* candle dot on selected */}
                <circle cx={dx} cy={dy} r={R * 0.08} fill="#FF6B6B" opacity="0.9" />
                <circle cx={dx} cy={dy - R * 0.14} r={R * 0.025} fill="#FFD700" opacity="0.95" />
              </>
            )}
            <line x1={cx} y1={cy} x2={cx + R * Math.cos(startAngle)} y2={cy + R * Math.sin(startAngle)}
              stroke="#fff" strokeWidth="1.6" opacity="0.7" />
            <path d={d} fill="transparent" className="slice-hit" />
          </g>
        )
      })}

      {/* Frosting top ring */}
      <circle cx={cx} cy={cy} r={R + 4} fill="none" stroke={FROSTING} strokeWidth="5" opacity="0.6" />
      {/* Center decoration */}
      <circle cx={cx} cy={cy} r={10} fill={DRIP} />
      <circle cx={cx} cy={cy} r={5}  fill="#C06090" />
      {/* Accent ring */}
      <circle cx={cx} cy={cy} r={R + 8} fill="none" stroke={accentColor} strokeWidth="3" opacity="0.4" />
    </svg>
  )
}

// ─── Food SVG Dispatcher ──────────────────────────────────────────────────────

function FoodSVG({ theme, ...props }: FoodSVGProps) {
  if (theme === 'choc')  return <ChocSVG  {...props} />
  if (theme === 'cake')  return <CakeSVG  {...props} />
  return <PizzaSVG {...props} />
}

// ─── Fraction Stack ───────────────────────────────────────────────────────────

interface FracProps {
  num: number
  den: number
  color?: string
  size?: 'lg' | 'md' | 'sm'
}

function Frac({ num, den, color = '#333', size = 'lg' }: FracProps) {
  return (
    <div className={`frac frac--${size}`} style={{ '--frac-color': color } as React.CSSProperties}>
      <span className="frac__num" style={{ color }}>{num}</span>
      <span className="frac__bar" style={{ background: color }} />
      <span className="frac__den" style={{ color }}>{den}</span>
    </div>
  )
}

// ─── Pizza Card ───────────────────────────────────────────────────────────────

interface CardProps {
  index: number
  slices: number
  selected: boolean[]
  onToggle: (i: number) => void
  onSliceChange: (s: number) => void
  theme: FoodTheme
}

function PizzaCard({ index, slices, selected, onToggle, onSliceChange, theme }: CardProps) {
  const meta       = FOOD_META[theme]
  const label      = `${meta.emoji} ${meta.label} ${String.fromCharCode(65 + index)}`
  const accent     = ITEM_ACCENT[index]
  const bg         = ITEM_ACCENT_BG[index]
  const fill       = ITEM_FILL[index]
  const count      = selected.filter(Boolean).length
  const sliceOpts  = theme === 'choc' ? CHOC_OPTIONS : SLICE_OPTIONS

  return (
    <div className="pizza-card" style={{ '--pizza-accent': accent, '--pizza-bg': bg } as React.CSSProperties}>
      <div className="pizza-card__title" style={{ color: accent }}>{label}</div>

      {/* Per-pizza slice selector */}
      <div className="pizza-card__slice-row">
        <span className="pizza-card__slice-label">✂️ 切片：</span>
        <div className="pizza-card__slice-btns">
          {sliceOpts.map(s => (
            <button
              key={s}
              className={`slice-mini-btn${slices === s ? ' slice-mini-btn--active' : ''}`}
              style={slices === s ? { background: accent, borderColor: accent } : { borderColor: accent, color: accent }}
              onClick={() => onSliceChange(s)}
            >{s}</button>
          ))}
        </div>
      </div>

      <FoodSVG
        theme={theme}
        slices={slices}
        selected={selected}
        onToggle={onToggle}
        accentColor={accent}
        selectedFill={fill}
      />
      <div className="pizza-card__frac-area">
        <div className="pizza-card__frac-label" style={{ color: accent }}>分数</div>
        <Frac num={count} den={slices} color={accent} size="lg" />
      </div>
    </div>
  )
}

// ─── Math Result ──────────────────────────────────────────────────────────────

interface MathResultProps {
  mode: 'addition' | 'subtraction'
  counts: number[]
  dens: number[]
}

function MathResult({ mode, counts, dens }: MathResultProps) {
  const [showHint,   setShowHint]   = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  const numA = counts[0] ?? 0
  const numB = counts[1] ?? 0
  const denA = dens[0] ?? 4
  const denB = dens[1] ?? 4
  const op   = mode === 'addition' ? '+' : '−'

  const [cA, cB, cDen] = toCommonDen(numA, denA, numB, denB)
  const resultNum = mode === 'addition' ? cA + cB : Math.max(0, cA - cB)
  const sameDen   = denA === denB

  const colorA = ITEM_ACCENT[0]
  const colorB = ITEM_ACCENT[1]
  const colorR = '#5C4033'

  return (
    <div className="math-result">
      <h2 className="math-result__title">
        {mode === 'addition' ? '➕ 加法' : '➖ 减法'}
      </h2>

      {/* Line 1: original */}
      <div className="math-line">
        <span className="math-line__tag">题目</span>
        <div className="math-line__expr">
          <Frac num={numA} den={denA} color={colorA} size="md" />
          <span className="math-op">{op}</span>
          <Frac num={numB} den={denB} color={colorB} size="md" />
          <span className="math-op math-op--eq">=</span>
          <span className="math-op" style={{ color: '#bbb' }}>?</span>
        </div>
      </div>

      {/* Hint: common denominator conversion */}
      {!sameDen && (
        <div className="math-reveal-row">
          <button
            className={`reveal-btn reveal-btn--hint${showHint ? ' revealed' : ''}`}
            onClick={() => setShowHint(v => !v)}
          >
            {showHint ? '🙈 隐藏提示' : '💡 提示：通分'}
          </button>
          {showHint && (
            <div className="math-hint-box">
              <span className="math-hint-text">
                把分母化为相同：&nbsp;
                <strong>/{cDen}</strong>
              </span>
              <div className="math-line__expr" style={{ marginTop: 8 }}>
                <Frac num={numA} den={denA} color={colorA} size="md" />
                <span style={{ fontSize: '1.8rem', color: '#888', fontWeight: 700 }}>→</span>
                <Frac num={cA} den={cDen} color={colorA} size="md" />
                <span style={{ fontSize: '1.8rem', color: '#ccc', margin: '0 8px' }}>|</span>
                <Frac num={numB} den={denB} color={colorB} size="md" />
                <span style={{ fontSize: '1.8rem', color: '#888', fontWeight: 700 }}>→</span>
                <Frac num={cB} den={cDen} color={colorB} size="md" />
              </div>
            </div>
          )}
        </div>
      )}

      {sameDen && (
        <div className="math-arrow-row">
          <span className="math-arrow-icon">✅</span>
          <span className="math-arrow-text">分母相同，可以直接计算！</span>
        </div>
      )}

      {/* Answer reveal */}
      <div className="math-reveal-row">
        <button
          className={`reveal-btn reveal-btn--answer${showAnswer ? ' revealed' : ''}`}
          onClick={() => setShowAnswer(v => !v)}
        >
          {showAnswer ? '🙈 隐藏答案' : '🎯 显示答案'}
        </button>
        {showAnswer && (
          <div className="math-line math-line--result">
            <span className="math-line__tag">答案</span>
            <div className="math-line__expr">
              <Frac num={cA} den={cDen} color={colorA} size="md" />
              <span className="math-op">{op}</span>
              <Frac num={cB} den={cDen} color={colorB} size="md" />
              <span className="math-op math-op--eq">=</span>
              <div className="math-answer-box" style={{ borderColor: colorR }}>
                <Frac num={resultNum} den={cDen} color={colorR} size="lg" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

function buildSelected(s: number): boolean[] {
  return Array(s).fill(false)
}

function App() {
  const [numPizzas, setNumPizzas] = useState<number>(1)
  const [slices,    setSlices]    = useState<number[]>([4, 4, 4])
  const [selected,  setSelected]  = useState<boolean[][]>([buildSelected(4), buildSelected(4), buildSelected(4)])
  const [mode,      setMode]      = useState<Mode>('normal')
  const [theme,     setTheme]     = useState<FoodTheme>('pizza')

  const meta = FOOD_META[theme]

  const handleNumPizzas = (n: number) => {
    setNumPizzas(n)
  }

  const handlePizzaSlices = (pizzaIdx: number, s: number) => {
    setSlices(prev => {
      const next = [...prev]
      next[pizzaIdx] = s
      return next
    })
    setSelected(prev => {
      const next = [...prev]
      next[pizzaIdx] = buildSelected(s)
      return next
    })
  }

  const toggleSlice = useCallback((pizzaIdx: number, sliceIdx: number) => {
    setSelected(prev => {
      const next = prev.map(arr => [...arr])
      const was  = next[pizzaIdx][sliceIdx]
      next[pizzaIdx][sliceIdx] = !was
      was ? playDeselect() : playSelect()
      return next
    })
  }, [])

  const reset = () =>
    setSelected(slices.map(s => buildSelected(s)))

  const counts = selected.map(arr => arr.filter(Boolean).length)

  return (
    <div className="app">

      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">分数</h1>
        <p className="app-subtitle">{meta.subtitle}</p>
      </header>

      {/* Controls */}
      <section className="controls-panel">

        {/* Food theme switcher */}
        <div className="control-group">
          <div className="btn-row">
            {(['pizza', 'choc', 'cake'] as FoodTheme[]).map(t => (
              <button
                key={t}
                className={`theme-btn${theme === t ? ' theme-btn--active' : ''}`}
                onClick={() => setTheme(t)}
                title={FOOD_META[t].label}
              >
                {FOOD_META[t].emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">🍽️ {meta.label}数量</label>
          <div className="btn-row">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                className={`big-btn${numPizzas === n ? ' big-btn--active' : ''}`}
                onClick={() => handleNumPizzas(n)}
              >{n}</button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">✏️ 模式</label>
          <div className="btn-row">
            {(['normal', 'addition', 'subtraction'] as Mode[]).map(m => (
              <button
                key={m}
                className={`mode-btn${mode === m ? ' mode-btn--active' : ''}`}
                onClick={() => setMode(m)}
              >
                {m === 'normal' ? '🟢 普通模式' : m === 'addition' ? '➕ 加法' : '➖ 减法'}
              </button>
            ))}
          </div>
        </div>

        <button className="reset-btn" onClick={reset}>🔄 重置</button>
      </section>

      {/* Pizzas – always one row */}
      <section className="pizzas-section">
        {Array.from({ length: numPizzas }, (_, pi) => (
          <PizzaCard
            key={pi}
            index={pi}
            slices={slices[pi]}
            selected={selected[pi] ?? []}
            onToggle={si => toggleSlice(pi, si)}
            onSliceChange={s => handlePizzaSlices(pi, s)}
            theme={theme}
          />
        ))}
      </section>

      {/* Result panel */}
      {(mode === 'addition' || mode === 'subtraction') && (
        <section className="results-panel">
          {numPizzas >= 2
            ? <MathResult mode={mode} counts={counts} dens={slices} />
            : <div className="hint-box">💡 请选择 <strong>2个或以上的{meta.label}</strong> 来使用{mode === 'addition' ? '加法' : '减法'}模式！</div>
          }
        </section>
      )}

      {/* Tips */}
      <section className="tips-row">
        <div className="tip-chip">👆 点击切片来选择</div>
        <div className="tip-chip">🌑 暗色 = 未选中</div>
        <div className="tip-chip">🌕 亮色 = 已选中</div>
        <div className="tip-chip">🔢 分数实时更新</div>
      </section>

    </div>
  )
}

export default App