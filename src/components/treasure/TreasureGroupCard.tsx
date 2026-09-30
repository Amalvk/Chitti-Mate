import { Link } from 'react-router-dom'
import { PiggyBank } from 'lucide-react'
import type { TreasureGroup } from '@/types'
import { useTreasureMembers, useContributions } from '@/hooks/useTreasure'
import { formatCurrency } from '@/utils/currency'
import { totalBalance } from '@/utils/treasure'
import { Card } from '@/components/ui/Card'

export function TreasureGroupCard({ group }: { group: TreasureGroup }) {
  const { members } = useTreasureMembers(group.id)
  const { contributions } = useContributions(group.id)

  const activeMembers = members.filter((m) => m.status === 'active')
  const totalSaved = totalBalance(contributions)

  return (
    <Link to={`/admin/treasure/${group.id}`} className="block">
      <Card className="flex flex-col gap-4 transition-shadow hover:shadow-soft-lg dark:hover:border-ink-700">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-300">
            <PiggyBank className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-ink-900 dark:text-ink-50">{group.name}</p>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {activeMembers.length} {activeMembers.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-ink-50 p-4 dark:bg-ink-800">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400 dark:text-ink-500">Total saved</p>
          <p className="mt-1 text-2xl font-extrabold text-success-600 dark:text-success-400">
            {formatCurrency(totalSaved)}
          </p>
        </div>
      </Card>
    </Link>
  )
}
