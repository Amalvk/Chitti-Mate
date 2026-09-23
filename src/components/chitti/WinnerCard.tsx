import { Trophy } from 'lucide-react'
import type { Cycle, Member } from '@/types'
import { Card } from '@/components/ui/Card'

interface RecentWinnersProps {
  cycles: Cycle[]
  members: Member[]
  limit?: number
}

export function RecentWinners({ cycles, members, limit = 2 }: RecentWinnersProps) {
  const memberById = new Map(members.map((m) => [m.id, m]))
  const winners = cycles
    .filter((c) => c.status === 'completed' && c.winnerId)
    .sort((a, b) => b.cycleNumber - a.cycleNumber)
    .slice(0, limit)

  if (winners.length === 0) return null

  return (
    <Card>
      <h3 className="mb-3 font-bold text-ink-900 dark:text-ink-50">Recent Winners</h3>
      <ul className="flex flex-col gap-3">
        {winners.map((cycle) => {
          const winner = cycle.winnerId ? memberById.get(cycle.winnerId) : undefined
          return (
            <li key={cycle.id} className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-warning-50 text-warning-500 dark:bg-warning-500/15 dark:text-warning-300">
                <Trophy className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                  Cycle {cycle.cycleNumber}
                </p>
                <p className="font-bold text-ink-900 dark:text-ink-50">{winner?.name ?? 'Unknown member'}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
