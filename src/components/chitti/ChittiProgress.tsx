import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface ChittiProgressProps {
  completedCycles: number
  totalCycles: number
}

export function ChittiProgress({ completedCycles, totalCycles }: ChittiProgressProps) {
  const pct = totalCycles > 0 ? Math.round((completedCycles / totalCycles) * 100) : 0
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-ink-900 dark:text-ink-50">Chitti Progress</h3>
        <span className="text-sm font-semibold text-ink-500 tabular dark:text-ink-400">
          {completedCycles} / {totalCycles} cycles
        </span>
      </div>
      <ProgressBar value={completedCycles} max={totalCycles} tone="success" />
      <p className="mt-2 text-right text-xs font-semibold text-success-600 dark:text-success-400">{pct}% complete</p>
    </Card>
  )
}
