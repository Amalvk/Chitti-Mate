import { Link } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { Member, Payment } from '@/types'

interface MembersSummaryCardProps {
  members: Member[]
  payments: Payment[]
  to: string
}

export function MembersSummaryCard({ members, payments, to }: MembersSummaryCardProps) {
  const active = members.filter((m) => m.status === 'active')
  const paid = payments.filter((p) => p.status === 'paid').length
  const pending = active.length - paid

  return (
    <Link to={to} className="block">
      <Card className="flex items-center gap-4 transition-shadow hover:shadow-soft-lg dark:hover:shadow-none">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          <Users className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-ink-900 dark:text-ink-50">{active.length} Members</p>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            <span className="font-semibold text-success-600 dark:text-success-400">{paid} Paid</span>
            {' · '}
            <span className="font-semibold text-warning-600 dark:text-warning-400">{Math.max(pending, 0)} Pending</span>
          </p>
        </div>
        <ChevronRight className="size-5 text-ink-300 dark:text-ink-600" />
      </Card>
    </Link>
  )
}
