import { NavLink } from 'react-router-dom'

interface ChittiTabBarProps {
  chittiId: string
}

export function ChittiTabBar({ chittiId }: ChittiTabBarProps) {
  const base = `/admin/chittis/${chittiId}`
  const tabs = [
    { to: base, label: 'Overview', end: true },
    { to: `${base}/members`, label: 'Members', end: false },
    { to: `${base}/payments`, label: 'Payments', end: false },
    { to: `${base}/cycles`, label: 'Cycles', end: false },
  ]

  return (
    <div className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900'
                : 'bg-white text-ink-500 border border-ink-200 dark:bg-ink-900 dark:text-ink-400 dark:border-ink-700'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
