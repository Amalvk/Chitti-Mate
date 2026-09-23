import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center dark:border-ink-700 dark:bg-ink-900/60">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-ink-900 dark:text-ink-50">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-500 max-w-xs dark:text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this right now.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-danger-100 bg-danger-50/60 px-6 py-12 text-center dark:border-danger-500/25 dark:bg-danger-500/10">
      <div>
        <p className="font-semibold text-danger-700 dark:text-danger-300">{title}</p>
        <p className="mt-1 text-sm text-danger-600/80 max-w-xs dark:text-danger-400/80">{description}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-danger-700 ring-1 ring-inset ring-danger-200 hover:bg-danger-50 dark:bg-ink-900 dark:text-danger-300 dark:ring-danger-500/25 dark:hover:bg-danger-500/10"
        >
          Try again
        </button>
      )}
    </div>
  )
}
