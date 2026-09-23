import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface BackHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  onBack?: () => void
  action?: ReactNode
}

export function BackHeader({ title, subtitle, onBack, action }: BackHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className="mb-5 flex items-start gap-3">
      <button
        onClick={onBack ?? (() => navigate(-1))}
        aria-label="Go back"
        className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-ink-600 shadow-soft hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-300 dark:shadow-none dark:hover:bg-ink-800"
      >
        <ChevronLeft className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">{title}</h1>
        {subtitle && <div className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
