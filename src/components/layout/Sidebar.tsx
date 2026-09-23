import { NavLink } from 'react-router-dom'
import { Activity, LayoutGrid, MoreHorizontal, Wallet } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const items = [
  { to: '/admin', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/admin/chittis', label: 'Chittis', icon: Wallet, end: false },
  { to: '/admin/activity', label: 'Activity', icon: Activity, end: false },
  { to: '/admin/more', label: 'Settings', icon: MoreHorizontal, end: false },
]

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink-100 bg-white px-4 py-6 md:flex dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center justify-between px-2">
        <Logo />
        <ThemeToggle />
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100'
              }`
            }
          >
            <Icon className="size-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-2xl bg-ink-50 px-3.5 py-3 text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-400">
        Demo Admin mode
        <br />
        Authentication coming soon
      </div>
    </aside>
  )
}
