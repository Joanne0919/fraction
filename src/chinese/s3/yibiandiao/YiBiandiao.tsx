import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { RotateCcw, CheckCircle2, XCircle, Eye } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type YiReading = 'yī' | 'yí' | 'yì' | 'yi'

// step 1 'word'     → show full word, no pinyin on any char
// step 2 'tone'     → reveal pinyin of the char(s) AFTER 一, options appear
// step 3 'answered' → show 一's pinyin, rule banner
type Step = 'word' | 'tone' | 'answered'

interface WordCard {
  pre?: string       // chars BEFORE 一 (e.g. "动" in 动一动)
  prePinyin?: string // pinyin of pre chars (shown after answered)
  char: string       // char(s) AFTER 一
  pinyin: string     // pinyin of char(s) after 一 — revealed on step 'tone'
  tone: 1 | 2 | 3 | 4 | 0   // tone of the char AFTER 一 (0 = neutral 轻声)
  yiReading?: YiReading      // override 一's reading (e.g. 'yī' for 第一名)
  example: string
}

// ─── Tone colour config ───────────────────────────────────────────────────────

const TONE_COLOR = {
  0: { big: 'text-slate-400',   label: '轻声' },
  1: { big: 'text-sky-500',     label: '一声' },
  2: { big: 'text-emerald-500', label: '二声' },
  3: { big: 'text-amber-500',   label: '三声' },
  4: { big: 'text-rose-500',    label: '四声' },
} as const

// ─── Tone rule ────────────────────────────────────────────────────────────────

function getAnswer(tone: 0 | 1 | 2 | 3 | 4, override?: YiReading): YiReading {
  if (override) return override
  if (tone === 0) return 'yi'
  return tone === 4 ? 'yí' : 'yì'
}

// ─── Word bank ────────────────────────────────────────────────────────────────

const WORDS: WordCard[] = [
  // ── 一声 (tone 1) ──────────────────────────────────────────────
  { char: '天', pinyin: 'tiān', tone: 1, example: '一天' },
  { char: '些', pinyin: 'xiē',  tone: 1, example: '一些' },
  { char: '边', pinyin: 'biān', tone: 1, example: '一边' },
  { char: '双', pinyin: 'shuāng', tone: 1, example: '一双' },
  // ── 二声 (tone 2) ──────────────────────────────────────────────
  { char: '直', pinyin: 'zhí',  tone: 2, example: '一直' },
  { char: '年', pinyin: 'nián', tone: 2, example: '一年' },
  { char: '群', pinyin: 'qún',  tone: 2, example: '一群' },
  // ── 三声 (tone 3) ──────────────────────────────────────────────
  { char: '起', pinyin: 'qǐ',   tone: 3, example: '一起' },
  { char: '本', pinyin: 'běn',  tone: 3, example: '一本' },
  { char: '百', pinyin: 'bǎi',  tone: 3, example: '一百' },
  // ── 四声 (tone 4) ──────────────────────────────────────────────
  { char: '个', pinyin: 'gè',   tone: 4, example: '一个' },
  { char: '共', pinyin: 'gòng', tone: 4, example: '一共' },
  { char: '定', pinyin: 'dìng', tone: 4, example: '一定' },
  { char: '样', pinyin: 'yàng', tone: 4, example: '一样' },
  { char: '半', pinyin: 'bàn',  tone: 4, example: '一半' },
  { char: '下', pinyin: 'xià',  tone: 4, example: '一下' },
  { char: '块', pinyin: 'kuài', tone: 4, example: '一块' },
  { char: '次', pinyin: 'cì',   tone: 4, example: '一次' },
  // ── 轻声 叠词 / 数字结尾 (tone 0) ─────────────────────────────
  { pre: '动', prePinyin: 'dòng', char: '动', pinyin: 'dòng', tone: 0, example: '动一动' },
  { pre: '看', prePinyin: 'kàn',  char: '看', pinyin: 'kàn',  tone: 0, example: '看一看' },
  { pre: '想', prePinyin: 'xiǎng', char: '想', pinyin: 'xiǎng', tone: 0, example: '想一想' },
  { pre: '说', prePinyin: 'shuō', char: '说', pinyin: 'shuō', tone: 0, example: '说一说' },
  { pre: '试', prePinyin: 'shì',  char: '试', pinyin: 'shì',  tone: 0, example: '试一试' },
  // 第一名：一 is ordinal number → reads 一声 yī
  { pre: '第', prePinyin: 'dì', char: '名', pinyin: 'míng', tone: 1, yiReading: 'yī', example: '第一名' },
]

// ─── Option Button ────────────────────────────────────────────────────────────

function OptionBtn({
  reading, selected, step, answer, onSelect,
}: {
  reading: YiReading
  selected: YiReading | null
  step: Step
  answer: YiReading
  onSelect: (r: YiReading) => void
}) {
  const revealed  = step === 'answered'
  const isThis    = selected === reading
  const isCorrect = reading === answer
  const showWrong = revealed && isThis && !isCorrect
  const showRight = revealed && isCorrect

  return (
    <motion.button
      onClick={() => step === 'tone' && onSelect(reading)}
      whileHover={step === 'tone' ? { scale: 1.06 } : {}}
      whileTap={step === 'tone' ? { scale: 0.93 } : {}}
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-44 h-24 rounded-3xl border-4 font-black text-4xl transition-all duration-200 select-none',
        step === 'tone' && !isThis && 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 cursor-pointer',
        step === 'tone' &&  isThis && 'bg-blue-100 border-blue-400 text-blue-700',
        showRight  && 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200',
        showWrong  && 'bg-rose-100 border-rose-400 text-rose-700',
      )}
    >
      {reading}
      {showRight && <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-white/80" />}
      {showWrong && <XCircle      className="absolute top-2 right-2 w-5 h-5 text-rose-400" />}
    </motion.button>
  )
}

// ─── Rule Banner ──────────────────────────────────────────────────────────────

function RuleBanner({ tone, answer }: { tone: 0 | 1 | 2 | 3 | 4; answer: YiReading }) {
  const isNeutral = tone === 0
  const isT4 = tone === 4
  const msg = isNeutral
    ? `叠词中间 → 一 读轻声 ${answer}`
    : isT4
    ? `后面是四声 → 一 读 ${answer}（二声）`
    : `后面是${TONE_COLOR[tone].label} → 一 读 ${answer}（四声）`
  const cls = isNeutral
    ? 'bg-slate-50 border-slate-200 text-slate-600'
    : isT4
    ? 'bg-rose-50 border-rose-200 text-rose-700'
    : 'bg-slate-50 border-slate-200 text-slate-700'
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={cn('flex items-center gap-3 px-7 py-3.5 rounded-2xl text-xl font-bold border-2', cls)}
    >
      <span className="text-2xl">💡</span>
      {msg}
    </motion.div>
  )
}

// ─── Rules Side Panel ─────────────────────────────────────────────────────────

const RULES = [
  { num: '1', emoji: '🔢', title: '数字或结尾', body: '读一声 yī' },
  { num: '2', emoji: '4️⃣', title: '四声前面',   body: '读二声 yí' },
  { num: '3', emoji: '📖', title: '一二三声前', body: '读四声 yì' },
  { num: '4', emoji: '✨', title: '叠词中间',   body: '读轻声 yi' },
]

function RulesPanel() {
  return (
    <div className="h-full flex flex-col bg-yellow-50 border-l-4 border-yellow-300">
      {/* sticky-note header */}
      <div className="bg-yellow-300 px-6 py-4 flex items-center gap-2 shrink-0">
        <span className="text-2xl">📌</span>
        <span className="font-black text-yellow-900 text-4xl tracking-wide">变调规则</span>
      </div>

      {/* rules — fill remaining height evenly */}
      <div className="flex-1 flex flex-col justify-evenly px-8 py-4 gap-2">
        {RULES.map(({ num, emoji, title, body }) => (
          <div key={num} className="flex items-center gap-5">
            {/* big circle number */}
            <div className="shrink-0 w-14 h-14 rounded-full bg-yellow-300 text-yellow-900 font-black text-3xl flex items-center justify-center shadow-sm">
              {num}
            </div>
            <div className="flex flex-col leading-tight">
              <div className="text-yellow-900 font-black text-3xl flex items-center gap-1.5">
                <span>{emoji}</span>{title}
              </div>
              <div className="text-yellow-700 font-bold text-4xl mt-1">{body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* cute footer */}
      <div className="shrink-0 px-6 pb-4 flex justify-center gap-2 text-xl opacity-50 select-none">
        {['🌟', '✏️', '📚', '✏️', '🌟'].map((e, i) => <span key={i}>{e}</span>)}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function YiBiandiao() {
  const [qIdx, setQIdx]         = useState(0)
  const [seen, setSeen]         = useState<number[]>([0])
  const [step, setStep]         = useState<Step>('word')
  const [selected, setSelected] = useState<YiReading | null>(null)
  const [shake, setShake]       = useState(false)
  const [score, setScore]       = useState({ correct: 0, total: 0 })

  const word   = WORDS[qIdx]
  const answer = getAnswer(word.tone, word.yiReading)
  const toneC  = TONE_COLOR[word.tone]
  // options: neutral → yī/yí/yi | 数字(yī answer) → yī/yí/yì | regular → yī/yí/yì
  const options: YiReading[] = word.tone === 0
    ? ['yī', 'yí', 'yi']
    : ['yī', 'yí', 'yì']

  function handleRevealTone() { setStep('tone') }

  function handleSelect(r: YiReading) {
    if (step !== 'tone') return
    setSelected(r)
    const ok = r === answer
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
    if (!ok) { setShake(true); setTimeout(() => setShake(false), 500) }
    setTimeout(() => setStep('answered'), 350)
  }

  function next() {
    const remaining = WORDS.map((_, i) => i).filter(i => !seen.includes(i))
    const pool = remaining.length > 0 ? remaining : WORDS.map((_, i) => i).filter(i => i !== qIdx)
    const nxt  = pool[Math.floor(Math.random() * pool.length)]
    setQIdx(nxt)
    setSeen(prev => remaining.length > 0 ? [...prev, nxt] : [nxt])
    setStep('word')
    setSelected(null)
    setShake(false)
  }

  function reset() {
    setQIdx(0); setSeen([0]); setStep('word')
    setSelected(null); setShake(false)
    setScore({ correct: 0, total: 0 })
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-amber-50 via-white to-rose-50/40 overflow-hidden select-none">

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-8 py-3 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎵</span>
          <div>
            <div className="text-xl font-black text-slate-800">一的变调</div>
            <div className="text-xs text-slate-400 font-medium">Tone change of 一 · S3 Chinese</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-5 py-2">
            <span className="text-slate-500 text-sm font-semibold">得分</span>
            <span className="text-2xl font-black text-slate-800">{score.correct}</span>
            <span className="text-slate-400 text-sm">/ {score.total}</span>
          </div>
          <motion.button
            onClick={reset}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95, rotate: -30 }}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      {/* ── Body: centre + right rules ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Centre column ── */}
        <div className="flex-1 flex flex-col items-center justify-evenly px-8 py-6 overflow-hidden">

          {/* ── Question card ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={qIdx}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -32 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-2xl bg-white rounded-3xl border-2 border-slate-200 shadow-xl px-14 py-10 flex flex-col items-center gap-6"
            >
              {/* ── Word display ── */}
              <div className="flex items-end gap-8">

                {/* PRE chars (e.g. 动 in 动一动) — always shown, no pinyin */}
                {word.pre && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-14" />
                    <div className="text-[9rem] font-black text-slate-800 leading-none">
                      {word.pre}
                    </div>
                  </div>
                )}

                {/* 一 column */}
                <div className="flex flex-col items-center gap-2">
                  {/* pinyin of 一 — blank until answered */}
                  <div className="h-14 flex items-end justify-center">
                    <AnimatePresence mode="wait">
                      {step === 'answered' ? (
                        <motion.span
                          key="yi-pinyin"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'text-4xl font-black',
                            selected === answer ? 'text-emerald-500' : 'text-rose-500',
                          )}
                        >
                          {answer}
                        </motion.span>
                      ) : (
                        <span key="yi-blank" className="text-4xl text-transparent select-none">yì</span>
                      )}
                    </AnimatePresence>
                  </div>
                  <motion.div
                    animate={shake ? { x: [-12, 12, -9, 9, -5, 5, 0] } : { x: 0 }}
                    transition={{ duration: 0.45 }}
                    className="text-[9rem] font-black text-slate-800 leading-none"
                  >
                    一
                  </motion.div>
                </div>

                {/* char(s) AFTER 一 — pinyin revealed on step 'tone'/'answered' */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-14 flex items-end justify-center">
                    <AnimatePresence mode="wait">
                      {step === 'word' ? (
                        <span key="blank" className="text-4xl text-transparent select-none">yì</span>
                      ) : (
                        <motion.span
                          key="char-pinyin"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn('text-4xl font-black', toneC.big)}
                        >
                          {word.pinyin}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className={cn(
                    'text-[9rem] font-black leading-none transition-colors duration-300',
                    step === 'word' ? 'text-slate-800' : toneC.big,
                  )}>
                    {word.char}
                  </div>
                </div>
              </div>

              {/* rule banner — after answered */}
              <AnimatePresence>
                {step === 'answered' && (
                  <RuleBanner tone={word.tone} answer={answer} />
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* ── Action area ── */}
          <AnimatePresence mode="wait">

            {/* Step 1 → reveal pinyin button */}
            {step === 'word' && (
              <motion.button
                key="reveal-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleRevealTone}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="flex items-center gap-3 bg-violet-500 hover:bg-violet-600 text-white font-black text-3xl px-16 py-5 rounded-2xl shadow-md shadow-violet-200 transition-colors"
              >
                <Eye className="w-8 h-8" />
                看拼音
              </motion.button>
            )}

            {/* Step 2 → options */}
            {step === 'tone' && (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-6 flex-wrap justify-center"
              >
                {options.map(r => (
                  <OptionBtn key={r} reading={r} selected={selected} step={step} answer={answer} onSelect={handleSelect} />
                ))}
              </motion.div>
            )}

            {/* Step 3 → result + next */}
            {step === 'answered' && (
              <motion.div
                key="answered"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="flex gap-6 flex-wrap justify-center">
                  {options.map(r => (
                    <OptionBtn key={r} reading={r} selected={selected} step={step} answer={answer} onSelect={handleSelect} />
                  ))}
                </div>
                <motion.button
                  onClick={next}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white font-black text-3xl px-16 py-5 rounded-2xl shadow-md shadow-amber-200 transition-colors"
                >
                  下一题 →
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Rules sidebar (right) ── */}
        <div className="shrink-0 w-96">
          <RulesPanel />
        </div>

      </div>
    </div>
  )
}
