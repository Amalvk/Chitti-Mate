import { Link } from 'react-router-dom'
import FlipClockCountdown from '@leenguyen/react-flip-clock-countdown'
import '@leenguyen/react-flip-clock-countdown/dist/index.css'
import type { Chitti } from '@/types'
import { useMembers } from '@/hooks/useMembers'
import { useCurrentCycle } from '@/hooks/useCycle'
import { usePayments } from '@/hooks/usePayments'
import { cycleIdFor } from '@/services/chitti/lot'
import { formatCurrency } from '@/utils/currency'
import { Card } from '@/components/ui/Card'

export function ChittiCard({ chitti }: { chitti: Chitti }) {
  const { members } = useMembers(chitti.id)
  const { cycle } = useCurrentCycle(chitti.id, chitti.currentCycle)
  const cycleId = cycleIdFor(chitti.currentCycle)
  const { payments } = usePayments(chitti.id, cycleId)

  const activeMembers = members.filter((m) => m.status === 'active')
  const paidCount = payments.filter((p) => p.status === 'paid').length

  return (
    <Link to={`/admin/chittis/${chitti.id}`} className="block">
      <Card className="flex flex-col gap-4 transition-shadow hover:shadow-soft-lg dark:hover:border-ink-700">
        <div>
          <p className="text-lg font-bold text-ink-900 dark:text-ink-50">{chitti.name}</p>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {formatCurrency(chitti.amount)} / {chitti.duration === 'monthly' ? 'month' : 'week'} ·
            Cycle {chitti.currentCycle} / {chitti.totalCycles}
          </p>
        </div>

        {cycle && chitti.status === 'active' && (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-ink-50 p-4 dark:bg-ink-800">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-400 dark:text-ink-500">Next auction</p>
            <FlipClockCountdown
              className="chitti-flip-clock-compact"
              to={cycle.auctionAt}
              showLabels={false}
            />
          </div>
        )}

        <p className="text-sm font-semibold text-ink-600 dark:text-ink-300">
          {paidCount} / {activeMembers.length} paid
        </p>
      </Card>
    </Link>
  )
}
