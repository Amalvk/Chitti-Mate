import toast from 'react-hot-toast'
import { AlertTriangle, Wallet } from 'lucide-react'
import { useChittiOutletContext } from '@/context/chittiOutletContext'
import { PaymentRow } from '@/components/payments/PaymentRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { markPaymentPaid, markPaymentPending } from '@/services/chitti/payments'
import { cycleIdFor } from '@/services/chitti/lot'
import { isPast } from '@/utils/date'

export function Payments() {
  const { chitti, members, payments, currentCycle } = useChittiOutletContext()
  const activeMembers = members.filter((m) => m.status === 'active')
  const paymentByMember = new Map(payments.map((p) => [p.memberId, p]))
  const cycleId = cycleIdFor(chitti.currentCycle)
  const deadlinePassed = currentCycle ? isPast(currentCycle.paymentDeadline) : false

  async function handleMarkPaid(memberId: string) {
    await markPaymentPaid(chitti.id, cycleId, memberId)
    toast.success('Payment marked as paid')
  }

  async function handleMarkPending(memberId: string) {
    await markPaymentPending(chitti.id, cycleId, memberId)
  }

  if (!currentCycle) {
    return (
      <EmptyState icon={<Wallet className="size-6" />} title="No active cycle" description="Payments will appear once a cycle starts." />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">Cycle {chitti.currentCycle} Payments</h2>
      </div>

      {deadlinePassed && currentCycle.status === 'active' && (
        <div className="flex items-center gap-2 rounded-2xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm font-semibold text-warning-700 dark:border-warning-500/25 dark:bg-warning-500/15 dark:text-warning-300">
          <AlertTriangle className="size-4 shrink-0" />
          Payment deadline has passed. New payments won't count for this cycle's lot.
        </div>
      )}

      {activeMembers.length === 0 ? (
        <EmptyState icon={<Wallet className="size-6" />} title="No members" description="Add members first." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {activeMembers.map((member) => (
            <PaymentRow
              key={member.id}
              member={member}
              payment={paymentByMember.get(member.id)}
              editable
              onMarkPaid={handleMarkPaid}
              onMarkPending={handleMarkPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
