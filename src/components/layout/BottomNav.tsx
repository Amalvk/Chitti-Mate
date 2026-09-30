import { NavLink } from 'react-router-dom'
import { Activity, LayoutGrid, MoreHorizontal, PiggyBank, Receipt, Wallet } from 'lucide-react'

const items = [
  { to: '/admin', label: 'Home', icon: LayoutGrid, end: true },
  { to: '/admin/chittis', label: 'Chittis', icon: Wallet, end: false },
  { to: '/admin/payments', label: 'Payments', icon: Receipt, end: false },
  { to: '/admin/treasure', label: 'Treasure', icon: PiggyBank, end: false },
  { to: '/admin/activity', label: 'Activity', icon: Activity, end: false },
  { to: '/admin/more', label: 'More', icon: MoreHorizontal, end: false },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 backdrop-blur md:hidden dark:border-ink-800 dark:bg-ink-900/95"
    >
      <ul className="grid grid-cols-6">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400 dark:text-ink-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
