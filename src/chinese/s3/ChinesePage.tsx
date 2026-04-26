import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

// ─── Sample S3 Chinese Topics ─────────────────────────────────────────────────

const TOPICS = [
  { emoji: '📖', title: '阅读理解', desc: '培养阅读技巧与理解能力' },
  { emoji: '✍️', title: '写作',     desc: '学习记叙文与描写文写法' },
  { emoji: '🔤', title: '词语',     desc: '认识同义词、反义词与成语' },
  { emoji: '📝', title: '造句',     desc: '灵活运用句子结构' },
  { emoji: '🗣️', title: '口语',    desc: '提高口头表达与交流能力' },
]

const ACCENT_COLORS = [
  { border: '#e11d48', bg: '#fff1f2' },
  { border: '#7c3aed', bg: '#f5f3ff' },
  { border: '#0284c7', bg: '#f0f9ff' },
  { border: '#059669', bg: '#f0fdf4' },
  { border: '#d97706', bg: '#fffbeb' },
]

// ─── Interactive games ────────────────────────────────────────────────────────

const GAMES = [
  {
    emoji: '🎮',
    title: '生词游戏',
    desc: '课堂生词听写 · 计时抢答 · 实时评分',
    to: '/s3/chinese/shengci',
    gradient: 'from-rose-500 to-pink-600',
    badge: '🔴 可以玩了',
  },
  {
    emoji: '🎲',
    title: '课堂随机抽背',
    desc: '随机抽取学生 · 随机抽取词语 · 课堂抽背神器',
    to: '/s3/chinese/choubei',
    gradient: 'from-violet-500 to-purple-600',
    badge: '🟣 可以玩了',
  },
]

export default function ChinesePage() {
  return (
    <div className="w-full max-w-full">

      {/* Header */}
      <header className="text-center mb-10 pt-7 px-9">
        <div className="inline-flex items-center gap-3 mb-3">
          <span className="text-5xl">🀄</span>
          <h1 className="text-6xl md:text-7xl font-black tracking-widest text-slate-800 drop-shadow-sm">
            华文
          </h1>
        </div>
        <p className="text-2xl text-slate-500 mt-1 font-bold">小三华文 — 学习主题</p>
        <div className="mt-3 inline-block bg-rose-100 text-rose-700 font-bold text-sm px-4 py-1.5 rounded-full">
          Standard 3 · 三年级
        </div>
      </header>

      {/* Interactive Games */}
      <section className="px-9 mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">🎯 互动游戏</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAMES.map(game => (
            <Link key={game.to} to={game.to} className="no-underline group">
              <div className={cn(
                'relative rounded-3xl p-6 overflow-hidden bg-gradient-to-br',
                game.gradient,
                'shadow-[0_6px_30px_rgba(0,0,0,0.15)] flex flex-col gap-3',
                'transition-all duration-200 hover:-translate-y-1.5',
                'hover:shadow-[0_12px_40px_rgba(225,29,72,0.35)]',
              )}>
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
                <div className="text-4xl">{game.emoji}</div>
                <div>
                  <div className="text-xl font-black text-white">{game.title}</div>
                  <div className="text-sm text-white/70 mt-1 font-medium">{game.desc}</div>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full">
                    {game.badge}
                  </span>
                  <span className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all text-sm">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Topic cards */}
      <section className="px-9 mb-12">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">📚 学习主题</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOPICS.map((topic, i) => {
            const color = ACCENT_COLORS[i % ACCENT_COLORS.length]
            return (
              <div
                key={topic.title}
                className={cn(
                  'bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.07)]',
                  'flex flex-col gap-3 cursor-pointer transition-all',
                  'hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)]',
                )}
                style={{ borderTop: `5px solid ${color.border}` }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: color.bg }}
                >
                  {topic.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">{topic.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">{topic.desc}</p>
                </div>
                <div
                  className="mt-auto text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full self-start"
                  style={{ color: color.border, background: color.bg }}
                >
                  即将推出
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Coming soon banner */}
      <section className="mx-9 mb-12 bg-gradient-to-r from-rose-50 to-violet-50 border-2 border-dashed border-rose-200 rounded-3xl p-8 text-center">
        <div className="text-4xl mb-3">🚧</div>
        <h2 className="text-2xl font-black text-slate-700">更多互动练习即将上线</h2>
        <p className="text-slate-500 mt-2 text-base font-medium max-w-md mx-auto">
          华文互动练习题正在开发中。敬请期待！
        </p>
      </section>

    </div>
  )
}
