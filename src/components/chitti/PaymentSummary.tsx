import { CheckCircle2, Clock } from 'lucide-react'
import type { Payment } from '@/types'

interface PaymentSummaryProps {
  payments: Payment[]
  totalMembers: number
}

/** "8 of 10 members paid" strip used on the details/dashboard cards. */
export function PaymentSummary({ payments, totalMembers }: PaymentSummaryProps) {
  const paidCount = payments.filter((p) => p.status === 'paid').length
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-ink-700 dark:text-ink-200">
      <CheckCircle2 className="size-4 text-success-500" />
      {paidCount} of {totalMembers} members paid
    </div>
  )
}

export function PaymentStatusBadge({ status }: { status: Payment['status'] }) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700 ring-1 ring-inset ring-success-100 dark:bg-success-500/15 dark:text-success-300 dark:ring-success-500/25">
        <CheckCircle2 className="size-3.5" /> Paid
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-600 ring-1 ring-inset ring-warning-100 dark:bg-warning-500/15 dark:text-warning-300 dark:ring-warning-500/25">
      <Clock className="size-3.5" /> Pending
    </span>
  )
}
