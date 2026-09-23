interface ProgressBarProps {
  value: number
  max: number
  className?: string
  tone?: 'brand' | 'success'
}

export function ProgressBar({ value, max, className = '', tone = 'brand' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const barColor = tone === 'success' ? 'bg-success-500' : 'bg-brand-500'

  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${barColor} transition-[width] duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
