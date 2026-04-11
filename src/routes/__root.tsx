import { useState } from 'react'
import { createRootRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { motion, AnimatePresence, type Variants } from 'motion/react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

// ─── Nav Tree Definition ──────────────────────────────────────────────────────

interface NavLeaf {
  kind: 'leaf'
  label: string
  emoji: string
  to: string
}
interface NavGroup {
  kind: 'group'
  label: string
  emoji: string
  color: string        // tailwind bg colour token e.g. 'bg-violet-500'
  textColor: string    // tailwind text colour e.g. 'text-violet-300'
  children: NavItem[]
}
type NavItem = NavLeaf | NavGroup

// Organised by Standard → Subject → Lesson
const NAV: NavItem[] = [
  {
    kind: 'group',
    label: 'Standard 3',
    emoji: '3️⃣',
    color: 'bg-slate-100',
    textColor: 'text-slate-500',
    children: [
      {
        kind: 'group',
        label: 'Math',
        emoji: '🔢',
        color: 'bg-blue-50',
        textColor: 'text-blue-700',
        children: [
          { kind: 'leaf', label: '分数', emoji: '🍕', to: '/s3/math/fraction' },
          { kind: 'leaf', label: '分数抓娃娃', emoji: '🎮', to: '/s3/math/fraction/claw-machine' },
          { kind: 'leaf', label: '小数', emoji: '🔢', to: '/s3/math/decimal' },
          { kind: 'leaf', label: '百分数·小数·百分比', emoji: '💯', to: '/s3/math/percentage' },
        ],
      },
      {
        kind: 'group',
        label: 'Chinese',
        emoji: '🀄',
        color: 'bg-rose-50',
        textColor: 'text-rose-700',
        children: [
          { kind: 'leaf', label: '华文',    emoji: '✍️', to: '/s3/chinese' },
          { kind: 'leaf', label: '生词游戏', emoji: '🎮', to: '/s3/chinese/shengci' },
          { kind: 'leaf', label: '一的变调', emoji: '🎵', to: '/s3/chinese/yibiandiao' },
        ],
      },
    ],
  },
]

// ─── Sidebar Nav Components ───────────────────────────────────────────────────

function NavTree({
  items, activePath, depth, collapsed,
}: {
  items: NavItem[]; activePath: string; depth: number; collapsed: boolean
}) {
  return (
    <motion.ul
      className="list-none p-0 m-0"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      {items.map((item, i) => (
        <NavNode key={i} item={item} activePath={activePath} depth={depth} collapsed={collapsed} />
      ))}
    </motion.ul>
  )
}

const navItemVariant: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

function NavNode({
  item, activePath, depth, collapsed,
}: {
  item: NavItem; activePath: string; depth: number; collapsed: boolean
}) {
  const [open, setOpen] = useState(true)

  if (item.kind === 'leaf') {
    const active = activePath === item.to || activePath.startsWith(item.to + '/')
    return (
      <motion.li variants={navItemVariant} title={collapsed ? item.label : undefined}>
        <Link
          to={item.to}
          className={cn(
            'group flex items-center gap-2 rounded-xl text-sm font-medium no-underline transition-all duration-200 mb-0.5',
            collapsed ? 'justify-center px-2 py-2.5 mx-0.5' : 'px-3 py-2 ml-2',
            active
              ? 'bg-rose-500 text-white font-semibold shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent'
          )}
        >
          <motion.span
            className="text-sm leading-none shrink-0"
            whileHover={{ scale: 1.3, rotate: -5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          >
            {item.emoji}
          </motion.span>
          {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
          {!collapsed && active && (
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-white shrink-0"
              layoutId="activeIndicator"
            />
          )}
        </Link>
      </motion.li>
    )
  }

  // ── Collapsed: flatten to leaf icons only ──
  if (collapsed) {
    return (
      <>
        {item.children.map((child, i) => (
          <NavNode key={i} item={child} activePath={activePath} depth={depth + 1} collapsed={collapsed} />
        ))}
      </>
    )
  }

  // ── Top-level standard header (depth 0) ──
  if (depth === 0) {
    return (
      <motion.li className="mb-3" variants={navItemVariant}>
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 hover:text-slate-600 transition-colors"
        >
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-3 h-3 shrink-0" />
          </motion.span>
          <span>{item.emoji}</span>
          <span className="flex-1 text-left">{item.label}</span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              className="mt-1 flex flex-col gap-1"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <NavTree items={item.children} activePath={activePath} depth={depth + 1} collapsed={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.li>
    )
  }

  // ── Subject group (depth 1) — colour-coded card with Motion ──
  return (
    <motion.li className="mb-2" variants={navItemVariant}>
      <motion.button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider',
          'border transition-colors duration-200',
          item.color, item.textColor,
          'border-slate-200 hover:border-slate-300',
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <motion.span
          className="text-base leading-none"
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.4 }}
        >
          {item.emoji}
        </motion.span>
        <span className="flex-1 text-left">{item.label}</span>
        <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
        </motion.span>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="mt-0.5"
          >
            <NavTree items={item.children} activePath={activePath} depth={depth + 1} collapsed={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  const location = useRouterState({ select: s => s.location })
  const activePath = location.pathname
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-svh">
      {/* Sidebar — Motion-animated width */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className={cn(
          'shrink-0 flex flex-col sticky top-0 h-svh overflow-y-auto overflow-x-hidden',
          'bg-white border-r border-slate-200 shadow-sm',
        )}
        style={{ minWidth: collapsed ? 64 : 256 }}
      >
        {/* Brand + toggle */}
        <div className={cn(
          'flex items-center border-b border-slate-200 shrink-0',
          collapsed ? 'flex-col gap-2 px-2 py-3' : 'justify-between px-4 py-4'
        )}>
          {collapsed ? (
            <Link to="/" className="text-2xl leading-none" title="Tutorial — Home">🎓</Link>
          ) : (
            <Link to="/" className="flex items-center gap-2.5 no-underline min-w-0">
              <motion.span
                className="text-2xl leading-none shrink-0"
                whileHover={{ rotate: [0, -15, 15, 0], scale: 1.1 }}
                transition={{ duration: 0.4 }}
              >
                🎓
              </motion.span>
              <div className="min-w-0">
                <div className="text-sm font-extrabold tracking-wide text-slate-800 truncate">Tutorial</div>
                <div className="text-[10px] text-rose-500/80 font-semibold truncate">Interactive Lessons</div>
              </div>
            </Link>
          )}
          <motion.button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />}
          </motion.button>
        </div>

        {/* Nav */}
        <nav className={cn('flex-1 py-4', collapsed ? 'px-1' : 'px-3')}>
          <NavTree items={NAV} activePath={activePath} depth={0} collapsed={collapsed} />
        </nav>

        {/* Footer */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 py-3 border-t border-slate-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-medium">© 2026 Tutorial</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
