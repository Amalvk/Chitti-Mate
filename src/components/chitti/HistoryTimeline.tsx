import { History, Trophy } from 'lucide-react'
import type { Cycle, Member } from '@/types'
import { formatCurrency } from '@/utils/currency'
import { formatDateLong } from '@/utils/date'
import { EmptyState } from '@/components/ui/EmptyState'

interface HistoryTimelineProps {
  cycles: Cycle[]
  members: Member[]
  amount: number
}

export function HistoryTimeline({ cycles, members, amount }: HistoryTimelineProps) {
  const memberById = new Map(members.map((m) => [m.id, m]))
  const completed = cycles
    .filter((c) => c.status === 'completed')
    .sort((a, b) => b.cycleNumber - a.cycleNumber)

  if (completed.length === 0) {
    return (
      <EmptyState
        icon={<History className="size-6" />}
        title="No history yet"
        description="Completed cycles and their winners will show up here."
      />
    )
  }

  return (
    <ol className="relative flex flex-col gap-6 pl-2">
      {completed.map((cycle, i) => {
        const winner = cycle.winnerId ? memberById.get(cycle.winnerId) : undefined
        const isLast = i === completed.length - 1
        return (
          <li key={cycle.id} className="relative flex gap-4 pl-6">
            {!isLast && (
              <span className="absolute left-[7px] top-6 h-[calc(100%-4px)] w-px bg-ink-200 dark:bg-ink-700" />
            )}
            <span className="absolute left-0 top-1.5 flex size-3.5 items-center justify-center rounded-full bg-brand-500 ring-4 ring-brand-100 dark:ring-brand-500/25" />
            <div className="flex-1 rounded-3xl border border-ink-100 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:shadow-none">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                Cycle {cycle.cycleNumber}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <Trophy className="size-4 text-warning-500" />
                <p className="text-base font-bold text-ink-900 dark:text-ink-50">{winner?.name ?? 'Unknown'}</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-300">{formatCurrency(amount)}</p>
              {cycle.completedAt && (
                <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">{formatDateLong(cycle.completedAt)}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
