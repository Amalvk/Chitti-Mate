import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AdminLayout() {
  return (
    <div className="flex min-h-dvh bg-ink-50 md:bg-ink-50 dark:bg-ink-950">
      <Sidebar />
      <div className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 pb-5 pt-[max(1.5rem,env(safe-area-inset-top))] md:px-8 md:pb-8 md:pt-8">
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
