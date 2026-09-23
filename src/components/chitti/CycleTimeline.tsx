import { Check, Circle, Dot, Trophy } from 'lucide-react'
import type { Cycle, Member } from '@/types'
import { formatDateTime } from '@/utils/date'

interface CycleTimelineProps {
  cycles: Cycle[]
  totalCycles: number
  members: Member[]
}

export function CycleTimeline({ cycles, totalCycles, members }: CycleTimelineProps) {
  const memberById = new Map(members.map((m) => [m.id, m]))
  const knownNumbers = new Set(cycles.map((c) => c.cycleNumber))
  const maxKnown = cycles.reduce((max, c) => Math.max(max, c.cycleNumber), 0)

  const placeholders: { cycleNumber: number }[] = []
  for (let n = maxKnown + 1; n <= totalCycles; n++) {
    if (!knownNumbers.has(n)) placeholders.push({ cycleNumber: n })
  }

  const rows = [...cycles].sort((a, b) => a.cycleNumber - b.cycleNumber)

  return (
    <ol className="flex flex-col gap-3">
      {rows.map((cycle) => (
        <li
          key={cycle.id}
          className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:shadow-none"
        >
          <StatusIcon status={cycle.status} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink-900 dark:text-ink-50">Cycle {cycle.cycleNumber}</p>
            {cycle.status === 'completed' && cycle.winnerId ? (
              <p className="flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400">
                <Trophy className="size-3.5 text-warning-500" />
                {memberById.get(cycle.winnerId)?.name ?? 'Unknown'}
              </p>
            ) : cycle.status === 'active' ? (
              <p className="text-sm text-ink-500 dark:text-ink-400">Auction {formatDateTime(cycle.auctionAt)}</p>
            ) : (
              <p className="text-sm text-ink-500 dark:text-ink-400">Winner selected, pending confirmation</p>
            )}
          </div>
          <StatusLabel status={cycle.status} />
        </li>
      ))}
      {placeholders.map((p) => (
        <li
          key={p.cycleNumber}
          className="flex items-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 p-4 dark:border-ink-700 dark:bg-ink-800/60"
        >
          <Circle className="size-5 text-ink-300 dark:text-ink-600" />
          <div className="flex-1">
            <p className="font-bold text-ink-400 dark:text-ink-500">Cycle {p.cycleNumber}</p>
            <p className="text-sm text-ink-400 dark:text-ink-500">Upcoming</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function StatusIcon({ status }: { status: Cycle['status'] }) {
  if (status === 'completed') {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-500 text-white">
        <Check className="size-4" />
      </span>
    )
  }
  if (status === 'active' || status === 'lot_pending') {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
        <Dot className="size-6" />
      </span>
    )
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
      <Circle className="size-3.5" />
    </span>
  )
}

function StatusLabel({ status }: { status: Cycle['status'] }) {
  const map: Record<Cycle['status'], { text: string; tone: string }> = {
    completed: { text: 'Completed', tone: 'text-success-600 dark:text-success-400' },
    active: { text: 'Current', tone: 'text-brand-600 dark:text-brand-400' },
    lot_pending: { text: 'Awaiting confirm', tone: 'text-warning-600 dark:text-warning-400' },
    upcoming: { text: 'Upcoming', tone: 'text-ink-400 dark:text-ink-500' },
  }
  const { text, tone } = map[status]
  return <span className={`text-xs font-bold uppercase tracking-wide ${tone}`}>{text}</span>
}
