import { useState } from 'react'
import { ChevronDown, Minus, Plus, Trash2, User } from 'lucide-react'
import type { Contribution, TreasureMember } from '@/types'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { totalBalance } from '@/utils/treasure'
import { Button } from '@/components/ui/Button'

interface TreasureMemberRowProps {
  member: TreasureMember
  contributions: Contribution[]
  onDeposit: (member: TreasureMember) => void
  onWithdraw: (member: TreasureMember) => void
  onDeleteContribution: (contribution: Contribution) => void
}

export function TreasureMemberRow({
  member,
  contributions,
  onDeposit,
  onWithdraw,
  onDeleteContribution,
}: TreasureMemberRowProps) {
  const [expanded, setExpanded] = useState(false)
  const total = totalBalance(contributions)

  return (
    <div className="rounded-2xl border border-ink-100 bg-white shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:shadow-none">
      <div className="flex items-center gap-3 p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
          <User className="size-5" />
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          disabled={contributions.length === 0}
          className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-ink-900 dark:text-ink-50">{member.name}</p>
            <p className="text-sm font-semibold text-success-600 dark:text-success-400">{formatCurrency(total)} saved</p>
          </div>
          {contributions.length > 0 && (
            <ChevronDown className={`size-4 shrink-0 text-ink-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button size="sm" variant="secondary" icon={<Minus className="size-4" />} onClick={() => onWithdraw(member)}>
            Withdraw
          </Button>
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => onDeposit(member)}>
            Add
          </Button>
        </div>
      </div>

      {expanded && contributions.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-ink-100 p-4 pt-3 dark:border-ink-800">
          {contributions.map((c) => {
            const withdrawal = c.type === 'withdrawal'
            return (
              <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className={withdrawal ? 'font-semibold text-danger-600 dark:text-danger-400' : 'font-semibold text-ink-700 dark:text-ink-200'}>
                    {withdrawal ? '−' : '+'}
                    {formatCurrency(c.amount)}
                  </span>
                  <span className="ml-2 text-ink-400 dark:text-ink-500">{formatDate(c.contributedAt)}</span>
                  {c.note && <span className="ml-2 truncate text-ink-400 dark:text-ink-500">· {c.note}</span>}
                </div>
                <button
                  onClick={() => onDeleteContribution(c)}
                  aria-label="Delete this entry"
                  title="Delete this entry"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-ink-300 hover:bg-danger-50 hover:text-danger-600 dark:text-ink-600 dark:hover:bg-danger-500/15 dark:hover:text-danger-300"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
