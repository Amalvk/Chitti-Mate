import type { ReactNode } from 'react'

type Tone = 'success' | 'warning' | 'danger' | 'brand' | 'neutral'

const toneClasses: Record<Tone, string> = {
  success:
    'bg-success-50 text-success-700 ring-1 ring-inset ring-success-100 dark:bg-success-500/15 dark:text-success-300 dark:ring-success-500/25',
  warning:
    'bg-warning-50 text-warning-600 ring-1 ring-inset ring-warning-100 dark:bg-warning-500/15 dark:text-warning-300 dark:ring-warning-500/25',
  danger:
    'bg-danger-50 text-danger-600 ring-1 ring-inset ring-danger-100 dark:bg-danger-500/15 dark:text-danger-300 dark:ring-danger-500/25',
  brand:
    'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25',
  neutral: 'bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-700',
}

interface BadgeProps {
  tone?: Tone
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'neutral', icon, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  )
}
