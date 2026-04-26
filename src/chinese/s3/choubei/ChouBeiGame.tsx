import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VocabEntry {
  word: string
  pinyin: string | null
}

interface HistoryEntry {
  name: string
  word: string
  pinyin: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNames(raw: string): string[] {
  return raw
    .split(/[\n,，]/)
    .map(s => s.trim())
    .filter(Boolean)
}

function parseVocab(raw: string): VocabEntry[] {
  return raw
    .split(/\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^(.+?)\((.+?)\)\s*$/)
      if (match) return { word: match[1].trim(), pinyin: match[2].trim() }
      return { word: line, pinyin: null }
    })
}

function pickRandom<T>(arr: T[], exclude?: T): T {
  if (arr.length === 1) return arr[0]
  let candidates = arr.filter(x => x !== exclude)
  if (candidates.length === 0) candidates = arr
  return candidates[Math.floor(Math.random() * candidates.length)]
}

// ─── Slot Component ───────────────────────────────────────────────────────────

const PANEL_COLORS = [
  { bg: 'bg-gradient-to-br from-rose-400 to-pink-500', shadow: 'shadow-pink-300' },
  { bg: 'bg-gradient-to-br from-violet-500 to-purple-600', shadow: 'shadow-violet-300' },
  { bg: 'bg-gradient-to-br from-sky-400 to-blue-500', shadow: 'shadow-blue-300' },
  { bg: 'bg-gradient-to-br from-amber-400 to-orange-500', shadow: 'shadow-orange-300' },
  { bg: 'bg-gradient-to-br from-emerald-400 to-teal-500', shadow: 'shadow-teal-300' },
]

function randomColor() {
  return PANEL_COLORS[Math.floor(Math.random() * PANEL_COLORS.length)]
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Phase = 'setup' | 'game'

export default function ChouBeiGame() {
  // ── Setup state ──
  const [phase, setPhase] = useState<Phase>('setup')
  const [namesRaw, setNamesRaw] = useState(
    '小明\n小华\n小美\n大雄\n静香\n胖虎'
  )
  const [vocabRaw, setVocabRaw] = useState(
    '苹果(píng guǒ)\n学校(xué xiào)\n快乐(kuài lè)\n朋友(péng yǒu)\n老师(lǎo shī)\n书本(shū běn)'
  )

  // ── Game state ──
  const [names, setNames] = useState<string[]>([])
  const [vocab, setVocab] = useState<VocabEntry[]>([])
  const [showPinyin, setShowPinyin] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [, setSelectedName] = useState<string | null>(null)
  const [, setSelectedVocab] = useState<VocabEntry | null>(null)
  const [displayName, setDisplayName] = useState<string>('???')
  const [displayVocab, setDisplayVocab] = useState<VocabEntry>({ word: '???', pinyin: null })
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [, setPanelColor] = useState(PANEL_COLORS[0])
  const [justSelected, setJustSelected] = useState(false)

  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastNameRef = useRef<string | null>(null)
  const lastVocabRef = useRef<VocabEntry | null>(null)

  // ── Start game ──
  function handleStart() {
    const n = parseNames(namesRaw)
    const v = parseVocab(vocabRaw)
    if (n.length === 0 || v.length === 0) return
    setNames(n)
    setVocab(v)
    setSelectedName(null)
    setSelectedVocab(null)
    setDisplayName(n[0])
    setDisplayVocab(v[0])
    setHistory([])
    setPhase('game')
  }

  // ── Shuffle animation ──
  const startSpin = useCallback((nameArr: string[], vocabArr: VocabEntry[]) => {
    setJustSelected(false)
    setSpinning(true)
    spinIntervalRef.current = setInterval(() => {
      setDisplayName(nameArr[Math.floor(Math.random() * nameArr.length)])
      setDisplayVocab(vocabArr[Math.floor(Math.random() * vocabArr.length)])
      setPanelColor(randomColor())
    }, 40)
  }, [])

  function handleSpin() {
    if (spinning) return
    startSpin(names, vocab)
  }

  function handleStop() {
    if (!spinning) return
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current)
      spinIntervalRef.current = null
    }
    const name = pickRandom(names, lastNameRef.current ?? undefined)
    const v = pickRandom(vocab, lastVocabRef.current ?? undefined)
    lastNameRef.current = name
    lastVocabRef.current = v
    setSelectedName(name)
    setSelectedVocab(v)
    setDisplayName(name)
    setDisplayVocab(v)
    setSpinning(false)
    setJustSelected(true)
    setHistory(h => [{ name, word: v.word, pinyin: v.pinyin }, ...h].slice(0, 20))
    setPanelColor(PANEL_COLORS[0])
  }

  function handleReset() {
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current)
      spinIntervalRef.current = null
    }
    setSpinning(false)
    setSelectedName(null)
    setSelectedVocab(null)
    setDisplayName(names[0] ?? '???')
    setDisplayVocab(vocab[0] ?? { word: '???', pinyin: null })
    setJustSelected(false)
    lastNameRef.current = null
    lastVocabRef.current = null
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current)
    }
  }, [])

  // ── SETUP SCREEN ──
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-violet-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🎲</div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">课堂随机抽背</h1>
            <p className="text-slate-500 mt-2 font-medium">输入学生名字和词语，开始抽背！</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Names */}
            <div className="bg-white rounded-3xl p-6 shadow-lg shadow-rose-100 border border-rose-100">
              <label className="flex items-center gap-2 font-black text-rose-600 mb-3 text-lg">
                <span>👦</span> 学生名字
              </label>
              <p className="text-xs text-slate-400 mb-3">每行一个名字，或用逗号分隔</p>
              <textarea
                className="w-full h-44 rounded-2xl border-2 border-rose-100 focus:border-rose-400 focus:outline-none p-3 text-slate-700 font-medium resize-none text-sm leading-relaxed bg-rose-50/40"
                value={namesRaw}
                onChange={e => setNamesRaw(e.target.value)}
                placeholder={'小明\n小华\n小美'}
              />
            </div>

            {/* Vocab */}
            <div className="bg-white rounded-3xl p-6 shadow-lg shadow-violet-100 border border-violet-100">
              <label className="flex items-center gap-2 font-black text-violet-600 mb-3 text-lg">
                <span>📖</span> 词语列表
              </label>
              <p className="text-xs text-slate-400 mb-3">
                格式：<span className="font-mono bg-violet-50 px-1 rounded">苹果(píng guǒ)</span>，不写拼音也可以
              </p>
              <textarea
                className="w-full h-44 rounded-2xl border-2 border-violet-100 focus:border-violet-400 focus:outline-none p-3 text-slate-700 font-medium resize-none text-sm leading-relaxed bg-violet-50/40"
                value={vocabRaw}
                onChange={e => setVocabRaw(e.target.value)}
                placeholder={'苹果(píng guǒ)\n学校(xué xiào)\n快乐'}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            disabled={parseNames(namesRaw).length === 0 || parseVocab(vocabRaw).length === 0}
            className="w-full py-5 rounded-3xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-2xl shadow-xl shadow-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🚀 进入游戏
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── GAME SCREEN ──

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-rose-50 to-amber-50 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <button
          onClick={() => { handleReset(); setPhase('setup') }}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors"
        >
          ← 重新设置
        </button>
        <h1 className="text-xl font-black text-slate-700 tracking-wide">🎲 课堂随机抽背</h1>
        <div className="flex items-center gap-3">
          {/* Pinyin toggle */}
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-slate-100">
            <span className="text-xs font-bold text-slate-500">显示拼音</span>
            <button
              onClick={() => setShowPinyin(p => !p)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors duration-300',
                showPinyin ? 'bg-emerald-400' : 'bg-slate-200'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300',
                  showPinyin ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
          {/* History toggle */}
          <button
            onClick={() => setShowHistory(h => !h)}
            className="bg-white rounded-full px-4 py-2 shadow-md border border-slate-100 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            📜 记录 ({history.length})
          </button>
        </div>
      </div>

      {/* Main panels */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 px-6 py-4 items-stretch">
        {/* Name Panel */}
        <motion.div
          layout
          className={cn(
            'flex-1 rounded-4xl flex flex-col items-center justify-center p-8 shadow-2xl',
            justSelected
              ? 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-pink-300'
              : 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-pink-200'
          )}
        >
          <div className="text-white/70 font-black text-lg tracking-widest uppercase mb-4">👦 学生</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={displayName}
              initial={{ y: spinning ? -20 : 0, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: spinning ? 20 : 0, opacity: 0 }}
              transition={{ duration: spinning ? 0.03 : 0.4, type: spinning ? 'tween' : 'spring', bounce: 0.5 }}
              className="text-white font-black text-center leading-none"
              style={{ fontSize: 'clamp(3rem, 10vw, 7rem)' }}
            >
              {displayName}
            </motion.div>
          </AnimatePresence>
          {justSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-6 bg-white/25 rounded-full px-5 py-2 text-white font-bold text-base"
            >
              🎉 抽中了！
            </motion.div>
          )}
        </motion.div>

        {/* Divider */}
        <div className="hidden md:flex items-center justify-center">
          <div className="h-full w-px bg-slate-200" />
          <span className="absolute text-3xl select-none">⚡</span>
        </div>

        {/* Vocab Panel */}
        <motion.div
          layout
          className={cn(
            'flex-1 rounded-4xl flex flex-col items-center justify-center p-8 shadow-2xl',
            justSelected
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-300'
              : 'bg-gradient-to-br from-violet-400 to-purple-500 shadow-violet-200'
          )}
        >
          <div className="text-white/70 font-black text-lg tracking-widest uppercase mb-4">📖 词语</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={displayVocab.word}
              initial={{ y: spinning ? -20 : 0, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: spinning ? 20 : 0, opacity: 0 }}
              transition={{ duration: spinning ? 0.03 : 0.4, type: spinning ? 'tween' : 'spring', bounce: 0.5 }}
              className="text-center"
            >
              {/* Pinyin */}
              <AnimatePresence>
                {showPinyin && displayVocab.pinyin && (
                  <motion.div
                    key="pinyin"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-white/80 font-bold mb-2 tracking-widest"
                    style={{ fontSize: 'clamp(1rem, 3vw, 2rem)' }}
                  >
                    {displayVocab.pinyin}
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Word */}
              <div
                className="text-white font-black leading-none"
                style={{ fontSize: 'clamp(3rem, 10vw, 7rem)' }}
              >
                {displayVocab.word}
              </div>
            </motion.div>
          </AnimatePresence>
          {justSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-6 bg-white/25 rounded-full px-5 py-2 text-white font-bold text-base"
            >
              ✨ 背这个！
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pb-8 px-6 flex-wrap">
        {!spinning ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSpin}
            className="px-10 py-4 rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-xl shadow-xl shadow-orange-200"
          >
            🎲 开始抽取
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStop}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="px-10 py-4 rounded-3xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-xl shadow-xl shadow-pink-200"
          >
            🛑 停止！
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className="px-8 py-4 rounded-3xl bg-white text-slate-600 font-black text-lg shadow-lg border border-slate-100"
        >
          🔄 重置
        </motion.button>
      </div>

      {/* History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', bounce: 0.2 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-4xl shadow-2xl border-t border-slate-100 p-6 max-h-[55vh] overflow-y-auto z-50"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-slate-700 text-xl">📜 抽背记录</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-slate-400 text-center py-8">还没有记录</p>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl',
                      i === 0 ? 'bg-rose-50 border-2 border-rose-200' : 'bg-slate-50'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-black rounded-full w-7 h-7 flex items-center justify-center shrink-0',
                      i === 0 ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'
                    )}>
                      {history.length - i}
                    </span>
                    <span className="font-black text-rose-600 text-lg min-w-16">{h.name}</span>
                    <span className="text-slate-300 text-lg">→</span>
                    <div className="flex flex-col">
                      <span className="font-black text-violet-600 text-lg">{h.word}</span>
                      {h.pinyin && (
                        <span className="text-xs text-slate-400">{h.pinyin}</span>
                      )}
                    </div>
                    {i === 0 && (
                      <span className="ml-auto text-xs bg-rose-500 text-white px-2 py-1 rounded-full font-bold">最新</span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for history */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistory(false)}
            className="fixed inset-0 bg-black z-40"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
