import { useState } from 'react'
import { User } from 'lucide-react'
import type { Member, Payment } from '@/types'
import { formatCurrency } from '@/utils/currency'
import { formatTime } from '@/utils/date'
import { PaymentStatusBadge } from '@/components/chitti/PaymentSummary'
import { Button } from '@/components/ui/Button'

interface PaymentRowProps {
  member: Member
  payment: Payment | undefined
  editable?: boolean
  onMarkPaid?: (memberId: string) => Promise<void> | void
  onMarkPending?: (memberId: string) => Promise<void> | void
}

export function PaymentRow({ member, payment, editable = false, onMarkPaid, onMarkPending }: PaymentRowProps) {
  const [busy, setBusy] = useState(false)
  const status = payment?.status ?? 'pending'

  async function toggle() {
    setBusy(true)
    try {
      if (status === 'paid') await onMarkPending?.(member.id)
      else await onMarkPaid?.(member.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:shadow-none">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
        <User className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-ink-900 dark:text-ink-50">{member.name}</p>
        {status === 'paid' && payment?.paidAt ? (
          <p className="text-xs text-ink-500 dark:text-ink-400">
            {formatCurrency(payment.amount)} · Paid at {formatTime(payment.paidAt)}
          </p>
        ) : (
          <p className="text-xs text-ink-400 dark:text-ink-500">Not paid yet</p>
        )}
      </div>
      {editable ? (
        <Button
          size="sm"
          variant={status === 'paid' ? 'secondary' : 'primary'}
          loading={busy}
          onClick={toggle}
        >
          {status === 'paid' ? 'Mark Pending' : 'Mark as Paid'}
        </Button>
      ) : (
        <PaymentStatusBadge status={status} />
      )}
    </div>
  )
}
