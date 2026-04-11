import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Web Audio sound effects (no external files needed) ────────────────────────
function playCorrect() {
  try {
    const ctx = new AudioContext()
    // Happy ascending chime: C5 → E5 → G5
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.13
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.35, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38)
      osc.start(t)
      osc.stop(t + 0.4)
    })
    // Sparkle shimmer on top
    const shimmer = ctx.createOscillator()
    const shimGain = ctx.createGain()
    shimmer.connect(shimGain)
    shimGain.connect(ctx.destination)
    shimmer.type = 'triangle'
    shimmer.frequency.setValueAtTime(1200, ctx.currentTime + 0.26)
    shimmer.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.5)
    shimGain.gain.setValueAtTime(0, ctx.currentTime + 0.26)
    shimGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.3)
    shimGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55)
    shimmer.start(ctx.currentTime + 0.26)
    shimmer.stop(ctx.currentTime + 0.56)
    setTimeout(() => ctx.close(), 1000)
  } catch (_) { /* AudioContext not available */ }
}

function playWrong() {
  try {
    const ctx = new AudioContext()
    // Sad descending buzz: two low notes dropping
    const osc1  = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.type = 'sawtooth'
    osc1.frequency.setValueAtTime(320, ctx.currentTime)
    osc1.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.35)
    gain1.gain.setValueAtTime(0.28, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.42)
    // Second lower thud
    const osc2  = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'square'
    osc2.frequency.setValueAtTime(200, ctx.currentTime + 0.3)
    osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6)
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.3)
    gain2.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.34)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65)
    osc2.start(ctx.currentTime + 0.3)
    osc2.stop(ctx.currentTime + 0.67)
    setTimeout(() => ctx.close(), 1200)
  } catch (_) { /* AudioContext not available */ }
}

type FractionType = 'proper' | 'improper' | 'mixed'
type Phase = 'idle' | 'moving' | 'dropping' | 'grabbing' | 'rising' | 'depositing' | 'returning' | 'releasing' | 'done'

interface FractionItem {
  id: number
  type: FractionType
  display: string
  numerator: number
  denominator: number
  whole?: number
  xPct: number   // 0‒100 % of machine width
  yPct: number   // 0‒100 % of machine height
  plush: number
}

// ─── Fraction data ─────────────────────────────────────────────────────────────
const PROPER_POOL:   [number,number][]        = [[1,2],[2,3],[3,4],[1,4],[3,5],[2,5],[5,6],[7,8],[1,3],[4,5]]
const IMPROPER_POOL: [number,number][]        = [[3,2],[5,3],[7,4],[9,5],[5,2],[4,3],[7,3],[8,5],[11,4],[9,4]]
const MIXED_POOL:    [number,number,number][] = [[1,1,2],[2,1,3],[1,3,4],[3,1,2],[2,2,3],[1,2,5],[3,3,4],[2,3,5],[1,5,6],[4,1,2]]

function pick<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

// 9 items spread across the machine (% positions) — 3×3 grid-ish layout
const SLOTS_PCT: [number, number][] = [
  [12, 60], [28, 72], [44, 58], [60, 70], [76, 60], [88, 72],
  [20, 82], [50, 84], [74, 80],
]

function generateRound(): FractionItem[] {
  const proper   = pick(PROPER_POOL, 3)
  const improper = pick(IMPROPER_POOL, 3)
  const mixed    = pick(MIXED_POOL, 3)

  const raw: { type: FractionType; display: string; numerator: number; denominator: number; whole?: number }[] = [
    ...proper.map(([n, d]) => ({ type: 'proper'   as FractionType, display: `${n}/${d}`, numerator: n, denominator: d })),
    ...improper.map(([n, d]) => ({ type: 'improper' as FractionType, display: `${n}/${d}`, numerator: n, denominator: d })),
    ...mixed.map(([w, n, d]) => ({ type: 'mixed' as FractionType, display: `${w} ${n}/${d}`, numerator: n, denominator: d, whole: w })),
  ].sort(() => Math.random() - 0.5)

  return raw.map((f, i) => ({
    ...f,
    id: i,
    plush: i % 5,
    xPct: SLOTS_PCT[i][0] + (Math.random() * 4 - 2),
    yPct: SLOTS_PCT[i][1] + (Math.random() * 4 - 2),
  }))
}

// ─── Cartoon characters (5 distinct animals, fully hand-drawn SVG) ────────────

// 0: Penguin  1: Fox  2: Frog  3: Dragon  4: Hamster
function CartoonChar({ idx, size = 90 }: { idx: number; size?: number }) {
  const s = size
  switch (idx % 5) {

    // ── 🐧 Penguin ──
    case 0: return (
      <svg width={s} height={s} viewBox="0 0 80 90" style={{ display:'block', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.18))' }}>
        {/* body */}
        <ellipse cx="40" cy="60" rx="24" ry="28" fill="#1e293b"/>
        {/* belly */}
        <ellipse cx="40" cy="65" rx="15" ry="20" fill="#f1f5f9"/>
        {/* head */}
        <circle cx="40" cy="30" r="20" fill="#1e293b"/>
        {/* face white patch */}
        <ellipse cx="40" cy="32" rx="13" ry="15" fill="#f1f5f9"/>
        {/* beak */}
        <ellipse cx="40" cy="42" rx="5" ry="3.5" fill="#f59e0b"/>
        {/* eyes */}
        <circle cx="33" cy="27" r="4" fill="white"/>
        <circle cx="47" cy="27" r="4" fill="white"/>
        <circle cx="34" cy="27" r="2.2" fill="#1e293b"/>
        <circle cx="48" cy="27" r="2.2" fill="#1e293b"/>
        <circle cx="34.8" cy="26.2" r="0.9" fill="white"/>
        <circle cx="48.8" cy="26.2" r="0.9" fill="white"/>
        {/* wings */}
        <ellipse cx="18" cy="62" rx="7" ry="14" fill="#1e293b" transform="rotate(-15,18,62)"/>
        <ellipse cx="62" cy="62" rx="7" ry="14" fill="#1e293b" transform="rotate(15,62,62)"/>
        {/* feet */}
        <ellipse cx="33" cy="87" rx="8" ry="4" fill="#f59e0b"/>
        <ellipse cx="47" cy="87" rx="8" ry="4" fill="#f59e0b"/>
        {/* cheeks */}
        <circle cx="28" cy="35" r="5" fill="#fda4af" opacity="0.5"/>
        <circle cx="52" cy="35" r="5" fill="#fda4af" opacity="0.5"/>
      </svg>
    )

    // ── 🦊 Fox ──
    case 1: return (
      <svg width={s} height={s} viewBox="0 0 80 90" style={{ display:'block', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.18))' }}>
        {/* pointy ears */}
        <polygon points="16,28 8,4 30,22" fill="#f97316"/>
        <polygon points="64,28 72,4 50,22" fill="#f97316"/>
        {/* ear inner */}
        <polygon points="17,26 11,8 28,21" fill="#fda4af"/>
        <polygon points="63,26 69,8 52,21" fill="#fda4af"/>
        {/* head */}
        <circle cx="40" cy="34" r="26" fill="#f97316"/>
        {/* face white muzzle */}
        <ellipse cx="40" cy="42" rx="14" ry="11" fill="#fef3c7"/>
        {/* nose */}
        <ellipse cx="40" cy="39" rx="4" ry="3" fill="#1e293b"/>
        <circle cx="39" cy="38" r="1.2" fill="white"/>
        {/* mouth */}
        <path d="M35 44 Q40 49 45 44" fill="none" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round"/>
        {/* eyes */}
        <ellipse cx="30" cy="30" rx="5" ry="5.5" fill="#1e293b"/>
        <ellipse cx="50" cy="30" rx="5" ry="5.5" fill="#1e293b"/>
        <circle cx="31.5" cy="28.5" r="1.6" fill="white"/>
        <circle cx="51.5" cy="28.5" r="1.6" fill="white"/>
        {/* cheeks */}
        <circle cx="22" cy="39" r="6" fill="#fda4af" opacity="0.45"/>
        <circle cx="58" cy="39" r="6" fill="#fda4af" opacity="0.45"/>
        {/* body */}
        <ellipse cx="40" cy="72" rx="20" ry="20" fill="#f97316"/>
        {/* tail hint */}
        <ellipse cx="62" cy="80" rx="10" ry="6" fill="#f97316" transform="rotate(-30,62,80)"/>
        <ellipse cx="62" cy="80" rx="5" ry="3" fill="#fef3c7" transform="rotate(-30,62,80)"/>
      </svg>
    )

    // ── 🐸 Frog ──
    case 2: return (
      <svg width={s} height={s} viewBox="0 0 80 90" style={{ display:'block', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.18))' }}>
        {/* body */}
        <ellipse cx="40" cy="68" rx="28" ry="22" fill="#4ade80"/>
        {/* head */}
        <ellipse cx="40" cy="36" rx="26" ry="24" fill="#4ade80"/>
        {/* eye bumps */}
        <circle cx="22" cy="18" r="10" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5"/>
        <circle cx="58" cy="18" r="10" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5"/>
        {/* eyeballs */}
        <circle cx="22" cy="18" r="7" fill="white"/>
        <circle cx="58" cy="18" r="7" fill="white"/>
        <circle cx="22" cy="19" r="4" fill="#1e293b"/>
        <circle cx="58" cy="19" r="4" fill="#1e293b"/>
        <circle cx="23" cy="17.5" r="1.5" fill="white"/>
        <circle cx="59" cy="17.5" r="1.5" fill="white"/>
        {/* belly */}
        <ellipse cx="40" cy="72" rx="18" ry="14" fill="#bbf7d0"/>
        {/* mouth */}
        <path d="M28 48 Q40 56 52 48" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
        {/* nostrils */}
        <circle cx="36" cy="44" r="2" fill="#16a34a"/>
        <circle cx="44" cy="44" r="2" fill="#16a34a"/>
        {/* front legs */}
        <ellipse cx="14" cy="76" rx="9" ry="5" fill="#4ade80" transform="rotate(-25,14,76)"/>
        <ellipse cx="66" cy="76" rx="9" ry="5" fill="#4ade80" transform="rotate(25,66,76)"/>
        {/* cheeks */}
        <circle cx="28" cy="46" r="5.5" fill="#86efac" opacity="0.6"/>
        <circle cx="52" cy="46" r="5.5" fill="#86efac" opacity="0.6"/>
      </svg>
    )

    // ── 🐲 Dragon ──
    case 3: return (
      <svg width={s} height={s} viewBox="0 0 80 90" style={{ display:'block', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.18))' }}>
        {/* horns */}
        <polygon points="26,10 20,0 32,14" fill="#a78bfa"/>
        <polygon points="54,10 60,0 48,14" fill="#a78bfa"/>
        {/* head */}
        <ellipse cx="40" cy="34" rx="26" ry="24" fill="#818cf8"/>
        {/* snout */}
        <ellipse cx="40" cy="45" rx="12" ry="9" fill="#a5b4fc"/>
        {/* nostrils */}
        <circle cx="36" cy="44" r="2.5" fill="#6366f1"/>
        <circle cx="44" cy="44" r="2.5" fill="#6366f1"/>
        {/* eyes */}
        <ellipse cx="29" cy="28" rx="6" ry="6.5" fill="#fef08a"/>
        <ellipse cx="51" cy="28" rx="6" ry="6.5" fill="#fef08a"/>
        <ellipse cx="29" cy="29" rx="3.5" ry="4.5" fill="#1e293b"/>
        <ellipse cx="51" cy="29" rx="3.5" ry="4.5" fill="#1e293b"/>
        <circle cx="30" cy="27" r="1.4" fill="white"/>
        <circle cx="52" cy="27" r="1.4" fill="white"/>
        {/* smile */}
        <path d="M32 50 Q40 56 48 50" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
        {/* body */}
        <ellipse cx="40" cy="72" rx="20" ry="20" fill="#818cf8"/>
        {/* belly scales */}
        <ellipse cx="40" cy="74" rx="13" ry="16" fill="#c7d2fe"/>
        {/* wings */}
        <path d="M20,58 C4,44 2,70 16,72" fill="#a78bfa" opacity="0.8"/>
        <path d="M60,58 C76,44 78,70 64,72" fill="#a78bfa" opacity="0.8"/>
        {/* cheeks */}
        <circle cx="24" cy="40" r="5" fill="#fda4af" opacity="0.4"/>
        <circle cx="56" cy="40" r="5" fill="#fda4af" opacity="0.4"/>
      </svg>
    )

    // ── 🐹 Hamster ──
    default: return (
      <svg width={s} height={s} viewBox="0 0 80 90" style={{ display:'block', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.18))' }}>
        {/* chubby cheek pouches */}
        <circle cx="14" cy="44" r="14" fill="#fde68a"/>
        <circle cx="66" cy="44" r="14" fill="#fde68a"/>
        {/* round ears */}
        <circle cx="20" cy="16" r="13" fill="#fbbf24"/>
        <circle cx="60" cy="16" r="13" fill="#fbbf24"/>
        <circle cx="20" cy="16" r="8" fill="#fda4af"/>
        <circle cx="60" cy="16" r="8" fill="#fda4af"/>
        {/* head */}
        <circle cx="40" cy="38" r="27" fill="#fde68a"/>
        {/* muzzle */}
        <ellipse cx="40" cy="48" rx="11" ry="8" fill="#fef3c7"/>
        {/* nose */}
        <ellipse cx="40" cy="44" rx="3.5" ry="2.5" fill="#f43f5e"/>
        {/* mouth */}
        <path d="M35 50 Q40 55 45 50" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round"/>
        {/* eyes */}
        <circle cx="29" cy="33" r="5.5" fill="#1e293b"/>
        <circle cx="51" cy="33" r="5.5" fill="#1e293b"/>
        <circle cx="30.5" cy="31.5" r="2" fill="white"/>
        <circle cx="52.5" cy="31.5" r="2" fill="white"/>
        {/* cheek blush */}
        <circle cx="22" cy="46" r="6" fill="#fb923c" opacity="0.4"/>
        <circle cx="58" cy="46" r="6" fill="#fb923c" opacity="0.4"/>
        {/* body */}
        <ellipse cx="40" cy="74" rx="22" ry="18" fill="#fde68a"/>
        {/* belly */}
        <ellipse cx="40" cy="76" rx="14" ry="12" fill="#fef3c7"/>
        {/* tiny feet */}
        <ellipse cx="30" cy="88" rx="8" ry="4" fill="#fbbf24"/>
        <ellipse cx="50" cy="88" rx="8" ry="4" fill="#fbbf24"/>
      </svg>
    )
  }
}

// ─── Fraction tag ──────────────────────────────────────────────────────────────
const TAG_BG: Record<FractionType, string> = {
  proper:   'bg-emerald-500 border-emerald-700',
  improper: 'bg-rose-500    border-rose-700',
  mixed:    'bg-violet-500  border-violet-700',
}

function FractionTag({ display, type }: { display: string; type: FractionType }) {
  const parts = display.split(' ')
  const isMixed = parts.length === 2
  const frac = isMixed ? parts[1] : parts[0]
  const [top, bot] = frac.split('/')
  return (
    <div className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border-2 font-black text-white shadow-lg text-base ${TAG_BG[type]}`}>
      {isMixed && <span className="text-xl leading-none">{parts[0]}</span>}
      <span className="flex flex-col items-center leading-none">
        <span className="text-lg">{top}</span>
        <span className="border-t-2 border-white w-6 my-0.5"/>
        <span className="text-lg">{bot}</span>
      </span>
    </div>
  )
}

// ─── Big Claw (SVG, rendered inside the machine SVG overlay) ───────────────────
function BigClaw({ wireH, open }: { wireH: number; open: boolean }) {
  const spread = open ? 38 : 14
  const tipY   = wireH + 68
  return (
    <g>
      {/* wire */}
      <line x1="0" y1="0" x2="0" y2={wireH}
        stroke="#94a3b8" strokeWidth="6" strokeLinecap="round"/>
      {/* motor box */}
      <rect x="-20" y={wireH - 8} width="40" height="18" rx="6"
        fill="#64748b" stroke="#475569" strokeWidth="1.5"/>
      <rect x="-10" y={wireH + 4} width="20" height="6" rx="3" fill="#334155"/>
      {/* left arm */}
      <path
        d={`M0,${wireH + 10} C${-spread * 0.6},${wireH + 30} ${-spread},${tipY - 18} ${-spread},${tipY}`}
        fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round"
        style={{ transition: 'd 0.4s cubic-bezier(.4,0,.2,1)' }}
      />
      <circle cx={-spread} cy={tipY} r="7" fill="#1e293b"
        style={{ transition: 'cx 0.4s cubic-bezier(.4,0,.2,1)' }}/>
      {/* centre arm */}
      <path d={`M0,${wireH + 10} C0,${wireH + 30} 0,${tipY - 10} 0,${tipY + 4}`}
        fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round"/>
      <circle cx="0" cy={tipY + 4} r="7" fill="#1e293b"/>
      {/* right arm */}
      <path
        d={`M0,${wireH + 10} C${spread * 0.6},${wireH + 30} ${spread},${tipY - 18} ${spread},${tipY}`}
        fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round"
        style={{ transition: 'd 0.4s cubic-bezier(.4,0,.2,1)' }}
      />
      <circle cx={spread} cy={tipY} r="7" fill="#1e293b"
        style={{ transition: 'cx 0.4s cubic-bezier(.4,0,.2,1)' }}/>
    </g>
  )
}

// ─── Plush item inside machine ─────────────────────────────────────────────────
function PlushItem({
  item, machW, machH, onClick, isSelected, disabled,
}: {
  item: FractionItem; machW: number; machH: number
  onClick: (i: FractionItem) => void; isSelected: boolean; disabled: boolean
}) {
  const px = (item.xPct / 100) * machW
  const py = (item.yPct / 100) * machH
  return (
    <button
      onClick={() => !disabled && onClick(item)}
      className={`absolute flex flex-col items-center gap-1.5 transition-all duration-300 select-none origin-bottom
        ${isSelected
          ? 'scale-125 z-20 drop-shadow-2xl'
          : disabled
            ? 'opacity-80 cursor-default z-10'
            : 'hover:scale-115 cursor-pointer z-10 hover:-translate-y-1'}`}
      style={{ left: px, top: py, transform: `translate(-50%,-50%)${isSelected?' scale(1.2)':''}` }}
    >
      {isSelected && (
        <span className="absolute -inset-3 rounded-full animate-ping bg-yellow-300/40 z-0 pointer-events-none"/>
      )}
      <span className="relative z-10 drop-shadow-lg"><CartoonChar idx={item.plush} size={90}/></span>
      <span className="relative z-10"><FractionTag display={item.display} type={item.type}/></span>
    </button>
  )
}

// ─── Bucket meta ───────────────────────────────────────────────────────────────
const BUCKET_META: Record<FractionType, {
  zh: string
  bg: string; border: string; activeBorder: string
  titleColor: string
}> = {
  proper: {
    zh: '真分数',
    bg: 'bg-white', border: 'border-gray-300', activeBorder: 'border-indigo-400',
    titleColor: 'text-gray-800',
  },
  improper: {
    zh: '假分数',
    bg: 'bg-white', border: 'border-gray-300', activeBorder: 'border-indigo-400',
    titleColor: 'text-gray-800',
  },
  mixed: {
    zh: '带分数',
    bg: 'bg-white', border: 'border-gray-300', activeBorder: 'border-indigo-400',
    titleColor: 'text-gray-800',
  },
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ClawMachineGame() {
  // We'll measure the machine container so plushies + claw stay proportional
  const machineRef = useRef<HTMLDivElement>(null)
  const [machSize, setMachSize] = useState({ w: 800, h: 520 })

  useEffect(() => {
    const update = () => {
      if (machineRef.current) {
        const r = machineRef.current.getBoundingClientRect()
        setMachSize({ w: r.width, h: r.height })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Game state
  const [items, setItems]       = useState<FractionItem[]>(() => generateRound())
  const [clawXPct, setClawXPct] = useState(50)           // % of machine width
  const [wireH, setWireH]       = useState(50)            // px from top rail
  const [clawOpen, setClawOpen] = useState(true)
  const [heldItem, setHeldItem] = useState<FractionItem | null>(null)
  const [selected, setSelected] = useState<FractionItem | null>(null)
  const [phase, setPhase]       = useState<Phase>('idle')
  const [score, setScore]       = useState(0)
  const [buckets, setBuckets]   = useState<Record<FractionType, FractionItem[]>>({ proper: [], improper: [], mixed: [] })
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)
  const [showWin, setShowWin]   = useState(false)
  const [round, setRound]       = useState(1)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = useCallback((msg: string, ok: boolean) => {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast({ msg, ok })
    toastRef.current = setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    if (items.length === 0 && phase === 'idle') {
      const t = setTimeout(() => setShowWin(true), 400)
      return () => clearTimeout(t)
    }
  }, [items.length, phase])

  const handlePlushClick = (item: FractionItem) => {
    if (phase !== 'idle') return
    setSelected(item)
    flash(`✨ 已选中 ${item.display}，请放入正确的篮子！`, true)
  }

  // Animation timeline (all durations in ms)
  // MOVE  600ms → DROP  700ms → GRAB  350ms → RISE  700ms → DEPOSIT
  const MOVE_MS    = 600
  const DROP_MS    = 700
  const GRAB_MS    = 350
  const RISE_MS    = 700
  const DEPOSIT_MS = 300

  const handleBucket = (type: FractionType) => {
    if (phase !== 'idle' || !selected) return
    const target = selected
    const correct = target.type === type

    // 1) Slide claw to target x
    setPhase('moving')
    setClawXPct(target.xPct)

    // 2) Drop wire down to just above plushie
    const dropTo = Math.max(40, (target.yPct / 100) * machSize.h - 90)
    setTimeout(() => {
      setWireH(dropTo)
      setPhase('dropping')
    }, MOVE_MS)

    // 3) Close claw (attempt to grab)
    setTimeout(() => {
      setClawOpen(false)
      setPhase('grabbing')
    }, MOVE_MS + DROP_MS)

    if (correct) {
      // ── CORRECT: lift up and deposit ──

      // 4) Rise back up holding the item
      setTimeout(() => {
        setWireH(50)
        setHeldItem(target)
        setItems(prev => prev.filter(i => i.id !== target.id))
        setPhase('rising')
      }, MOVE_MS + DROP_MS + GRAB_MS)

      // 5) Open claw and deposit
      setTimeout(() => {
        setClawOpen(true)
        setPhase('depositing')
        setBuckets(prev => ({ ...prev, [type]: [...prev[type], target] }))
        setScore(prev => prev + 10)
        flash('🎉 正确！+10 分', true)
        playCorrect()
        setHeldItem(null)
        setSelected(null)
      }, MOVE_MS + DROP_MS + GRAB_MS + RISE_MS)

      // 6) Idle
      setTimeout(() => {
        setPhase('idle')
      }, MOVE_MS + DROP_MS + GRAB_MS + RISE_MS + DEPOSIT_MS)

    } else {
      // ── WRONG: claw slips — drop back down to put the item back ──

      // 4) Rise a little (claw slips, item stays in machine)
      setTimeout(() => {
        setWireH(50)
        setPhase('rising')
      }, MOVE_MS + DROP_MS + GRAB_MS)

      // 5) Move back over the item's original spot and drop back down
      setTimeout(() => {
        setClawOpen(false)   // keep closed while returning
        setWireH(dropTo)
        setPhase('returning')
        flash('❌ 放错了！爪子滑掉了…', false)
        setScore(prev => prev - 5)
        playWrong()
      }, MOVE_MS + DROP_MS + GRAB_MS + RISE_MS)

      // 6) Open claw — release the item back in place
      setTimeout(() => {
        setClawOpen(true)
        setPhase('releasing')
      }, MOVE_MS + DROP_MS + GRAB_MS + RISE_MS + DROP_MS)

      // 7) Rise back up empty
      setTimeout(() => {
        setWireH(50)
      }, MOVE_MS + DROP_MS + GRAB_MS + RISE_MS + DROP_MS + GRAB_MS)

      // 8) Idle — item is still in the machine
      setTimeout(() => {
        setSelected(null)
        setPhase('idle')
      }, MOVE_MS + DROP_MS + GRAB_MS + RISE_MS + DROP_MS + GRAB_MS + RISE_MS)
    }
  }

  const nextRound = () => {
    setItems(generateRound())
    setBuckets({ proper: [], improper: [], mixed: [] })
    setRound(r => r + 1)
    setShowWin(false)
    setSelected(null)
    setHeldItem(null)
    setClawXPct(50)
    setWireH(50)
    setClawOpen(true)
    setPhase('idle')
    setToast(null)
  }

  const resetAll = () => { nextRound(); setScore(0); setRound(1) }

  const sorted  = Object.values(buckets).flat().length
  const correct = Object.entries(buckets).reduce((s, [t, arr]) => s + arr.filter(i => i.type === t).length, 0)

  // Claw x in px for the SVG overlay
  const clawPx = (clawXPct / 100) * machSize.w

  // Wire transition duration strings
  const wireTransDuration =
    phase === 'dropping'  ? `${DROP_MS}ms` :
    phase === 'returning' ? `${DROP_MS}ms` :
    phase === 'rising'    ? `${RISE_MS}ms` :
    phase === 'releasing' ? `${RISE_MS}ms` : '600ms'
  const clawTransDuration = `${MOVE_MS}ms`

  const PHASE_ZH: Record<Phase, string> = {
    idle:       selected ? `"${selected.display}" 已选中 — 请选择篮子 →` : '👆 点击一个玩偶来选择',
    moving:     '🎯 爪子移动中…',
    dropping:   '⬇️ 爪子下降中…',
    grabbing:   '🤏 抓取中！',
    rising:     '⬆️ 爪子上升中…',
    depositing: '📥 放入篮子…',
    returning:  '😬 放错了，爪子滑掉！把玩偶放回去…',
    releasing:  '↩️ 放回原位…',
    done:       '✅ 完成！',
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-sky-100 via-blue-50 to-indigo-100 overflow-hidden select-none font-sans">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white/80 backdrop-blur border-b border-blue-200 shadow-sm shrink-0 z-10">
        <h1 className="text-2xl font-black text-indigo-700 tracking-tight">🎪 分数抓娃娃机</h1>
        <div className="flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-700 rounded-xl px-3 py-1 text-base font-bold">
            第 <span className="text-indigo-900">{round}</span> 关
          </span>
          <span className="bg-yellow-100 text-yellow-700 rounded-xl px-3 py-1 text-base font-bold">
            ⭐ <span className="text-yellow-900">{score}</span> 分
          </span>
          <span className="bg-emerald-100 text-emerald-700 rounded-xl px-3 py-1 text-base font-bold">
            ✅ <span className="text-emerald-900">{correct}/{sorted}</span>
          </span>
          <button
            onClick={resetAll}
            className="bg-orange-100 hover:bg-orange-200 active:scale-95 text-orange-700 font-bold rounded-xl px-3 py-1 text-base border border-orange-300 transition"
          >
            🔄 重新开始
          </button>
        </div>
      </div>

      {/* ── Toast ── */}
      <div className="h-10 flex items-center justify-center shrink-0 z-10">
        {toast && (
          <div className={`px-5 py-1.5 rounded-full text-base font-bold shadow-md transition-all
            ${toast.ok ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
            {toast.msg}
          </div>
        )}
      </div>

      {/* ── Main area: machine left, buckets right ── */}
      <div className="flex flex-1 min-h-0 gap-3 px-3 pb-3">

        {/* ── Claw Machine (fills available space) ── */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">

          {/* Neon sign */}
          <div className="mb-1.5 self-center bg-gradient-to-r from-pink-400 via-yellow-300 to-cyan-400 text-white font-black text-sm px-6 py-1 rounded-full tracking-widest uppercase shadow-md">
            ✦ 抓取分数，放入正确的篮子！✦
          </div>

          {/* Cabinet */}
          <div
            ref={machineRef}
            className="relative flex-1 min-h-0 rounded-3xl overflow-hidden border-[6px] border-indigo-300 shadow-2xl"
            style={{ background: 'linear-gradient(160deg,#e0f2fe 0%,#bae6fd 35%,#7dd3fc 70%,#38bdf8 100%)' }}
          >
            {/* Background stars */}
            {['8%','22%','40%','60%','78%','92%'].map((l, i) => (
              <div key={i} className="absolute pointer-events-none text-white/25 select-none"
                style={{ left: l, top: `${8 + (i % 4) * 6}%`, fontSize: 28 + (i % 3) * 8 }}>★</div>
            ))}
            {/* Cloud puffs */}
            <div className="absolute top-6 left-12 w-36 h-10 bg-white/30 rounded-full pointer-events-none"/>
            <div className="absolute top-14 left-36 w-24 h-8  bg-white/25 rounded-full pointer-events-none"/>
            <div className="absolute top-6 right-16 w-28 h-9  bg-white/30 rounded-full pointer-events-none"/>
            {/* Glass sheen */}
            <div className="absolute inset-x-0 top-0 h-24 bg-white/20 pointer-events-none" style={{borderRadius:'20px 20px 55% 55%'}}/>
            {/* Top rail */}
            <div className="absolute top-0 inset-x-0 h-5 bg-indigo-200/70 z-20 shadow-sm"/>

            {/* ── Claw SVG (absolutely positioned, moves left/right) ── */}
            <svg
              className="absolute top-0 pointer-events-none z-30"
              style={{
                left: clawPx,
                transform: 'translateX(-50%)',
                overflow: 'visible',
                transition: `left ${clawTransDuration} cubic-bezier(.4,0,.2,1)`,
              }}
              width="90"
              height={wireH + 160}
            >
              {/* Wire transition handled via style on the line */}
              <line
                x1="0" y1="0" x2="0" y2={wireH}
                stroke="#94a3b8" strokeWidth="6" strokeLinecap="round"
                style={{ transition: `y2 ${wireTransDuration} cubic-bezier(.4,0,.2,1)` }}
              />
              {/* Motor box */}
              <rect x="-22" y={wireH - 10} width="44" height="20" rx="7"
                fill="#64748b" stroke="#475569" strokeWidth="1.5"
                style={{ transition: `y ${wireTransDuration} cubic-bezier(.4,0,.2,1)` }}/>
              <rect x="-11" y={wireH + 4} width="22" height="7" rx="3.5" fill="#334155"
                style={{ transition: `y ${wireTransDuration} cubic-bezier(.4,0,.2,1)` }}/>

              {/* Claw arms — we re-render BigClaw at wireH */}
              <BigClaw wireH={wireH} open={clawOpen}/>

              {/* Held plushie dangling from claw */}
              {heldItem && (
                <g style={{ transition: `transform ${RISE_MS}ms cubic-bezier(.4,0,.2,1)` }}>
                  <foreignObject x="-46" y={wireH + 76} width="92" height="110">
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <CartoonChar idx={heldItem.plush} size={64}/>
                      <FractionTag display={heldItem.display} type={heldItem.type}/>
                    </div>
                  </foreignObject>
                </g>
              )}
            </svg>

            {/* ── Plushies ── */}
            {items.map(item => (
              <PlushItem
                key={item.id}
                item={item}
                machW={machSize.w}
                machH={machSize.h}
                onClick={handlePlushClick}
                isSelected={selected?.id === item.id}
                disabled={phase !== 'idle'}
              />
            ))}

            {/* Empty machine message */}
            {items.length === 0 && phase === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-7xl mb-3">🎊</div>
                  <p className="text-indigo-700 font-black text-3xl drop-shadow">本关完成！</p>
                </div>
              </div>
            )}

            {/* Floor */}
            <div className="absolute bottom-0 inset-x-0 h-12 pointer-events-none rounded-b-2xl"
              style={{ background: 'linear-gradient(to top, rgba(99,102,241,0.18), transparent)' }}/>
          </div>

          {/* Status bar below machine */}
          <div className="mt-1.5 h-8 text-center text-base font-semibold text-indigo-600">
            {PHASE_ZH[phase]}
          </div>
        </div>

        {/* ── Buckets panel (right side) ── */}
        <div className="flex flex-col gap-3 w-72 shrink-0">

          {(Object.keys(BUCKET_META) as FractionType[]).map(type => {
            const m = BUCKET_META[type]
            const bi = buckets[type]
            const active = phase === 'idle' && !!selected
            return (
              <button
                key={type}
                onClick={() => handleBucket(type)}
                disabled={!active}
                className={`w-full flex-1 rounded-2xl border-4 p-4 text-left transition-all duration-200 flex flex-col
                  ${m.bg}
                  ${active
                    ? `${m.activeBorder} cursor-pointer hover:scale-[1.03] hover:shadow-2xl`
                    : `${m.border} cursor-not-allowed opacity-60`}
                `}
              >
                {/* Title only — big font */}
                <div className={`text-3xl font-black tracking-tight mb-3 ${m.titleColor}`}>
                  {m.zh}
                </div>

                {/* Fraction chips that land here after catching */}
                <div className="flex flex-wrap gap-2 flex-1 content-start min-h-10">
                  {bi.map(it => (
                    <span
                      key={it.id}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl font-extrabold shadow-sm bg-gray-100 text-gray-800"
                    >
                      {it.whole != null
                        ? <span className="inline-flex items-center gap-1">
                            <span className="text-lg font-black leading-none">{it.whole}</span>
                            <span className="flex flex-col items-center leading-none">
                              <span className="text-base font-black">{it.numerator}</span>
                              <span className="border-t-2 border-current w-full"/>
                              <span className="text-base font-black">{it.denominator}</span>
                            </span>
                          </span>
                        : <span className="flex flex-col items-center leading-none">
                            <span className="text-base font-black">{it.numerator}</span>
                            <span className="border-t-2 border-current w-full"/>
                            <span className="text-base font-black">{it.denominator}</span>
                          </span>
                      }
                    </span>
                  ))}
                </div>
              </button>
            )
          })}

        </div>
      </div>

      {/* ── Win overlay ── */}
      {showWin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-xs w-full">
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-2xl font-black text-gray-800 mb-1">第 {round} 关完成！</h2>
            <p className="text-gray-400 text-sm mb-1">{correct} 个正确 · {sorted - correct} 个错误</p>
            <p className="text-4xl font-black text-yellow-500 mb-6">{score} 分</p>
            <div className="flex gap-3 justify-center">
              <button onClick={nextRound}
                className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold px-5 py-2.5 rounded-2xl transition">
                下一关 ▶
              </button>
              <button onClick={resetAll}
                className="bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 font-bold px-5 py-2.5 rounded-2xl border border-gray-200 transition">
                🔄 重玩
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
