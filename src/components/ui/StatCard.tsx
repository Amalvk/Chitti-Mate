import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  icon: ReactNode
  tone?: 'brand' | 'success' | 'warning' | 'neutral'
}

const toneClasses = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
  success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-300',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-300',
  neutral: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
}

export function StatCard({ label, value, icon, tone = 'brand' }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:shadow-none">
      <div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        {icon}
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-ink-900 tabular dark:text-ink-50">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  )
}
