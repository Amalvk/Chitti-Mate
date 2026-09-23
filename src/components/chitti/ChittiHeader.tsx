import type { Chitti } from '@/types'
import { formatCurrency } from '@/utils/currency'
import { Badge } from '@/components/ui/Badge'

export function ChittiHeader({ chitti }: { chitti: Chitti }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="text-lg font-bold text-ink-900 dark:text-ink-50">
        {formatCurrency(chitti.amount)}{' '}
        <span className="font-medium text-ink-400 dark:text-ink-500">
          / {chitti.duration === 'monthly' ? 'Month' : 'Week'}
        </span>
      </p>
      <Badge tone="brand">
        Cycle {chitti.currentCycle} of {chitti.totalCycles}
      </Badge>
      {chitti.status === 'completed' && <Badge tone="success">Completed</Badge>}
    </div>
  )
}
