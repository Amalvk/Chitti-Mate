import { Trash2, Trophy, User, UserCheck, UserX } from 'lucide-react'
import type { Member, Payment } from '@/types'
import { Button } from '@/components/ui/Button'

interface MemberCardProps {
  member: Member
  editable?: boolean
  onRemove?: (member: Member) => void
  /**
   * 'remove' deletes a not-yet-saved draft row (CreateChitti); 'deactivate'
   * and 'activate' toggle a saved member's status — non-destructive, they
   * keep their payment/win history either way.
   */
  action?: 'remove' | 'deactivate' | 'activate'
  /** Current cycle's payment for this member. Pass alongside `onMarkPaid`/`onMarkPending` to show the inline payment toggle; omit where payments don't apply (drafts, no active cycle). */
  payment?: Payment
  onMarkPaid?: (memberId: string) => void
  onMarkPending?: (memberId: string) => void
}

export function MemberCard({
  member,
  editable = false,
  onRemove,
  action = 'remove',
  payment,
  onMarkPaid,
  onMarkPending,
}: MemberCardProps) {
  const removed = member.status === 'removed'
  const ActionIcon = action === 'activate' ? UserCheck : action === 'deactivate' ? UserX : Trash2
  const actionLabel = action === 'activate' ? 'Activate' : action === 'deactivate' ? 'Deactivate' : 'Remove'
  const showPaymentToggle = !removed && (onMarkPaid || onMarkPending)
  const paymentStatus = payment?.status ?? 'pending'

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:shadow-none">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
        <User className="size-5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center self-stretch">
        <p className="truncate font-bold text-ink-900 dark:text-ink-50">{member.name}</p>
        {member.hasWon && (
          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-medium text-warning-500 dark:bg-warning-500/10 dark:text-warning-400">
            <Trophy className="size-3" />
            Cycle {member.wonCycle}
          </span>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {showPaymentToggle && (
          <Button
            size="sm"
            variant={paymentStatus === 'paid' ? 'secondary' : 'primary'}
            onClick={() => (paymentStatus === 'paid' ? onMarkPending?.(member.id) : onMarkPaid?.(member.id))}
          >
            {paymentStatus === 'paid' ? 'Mark Pending' : 'Mark as Paid'}
          </Button>
        )}
        {editable && onRemove && action === 'remove' && (
          <button
            onClick={() => onRemove(member)}
            aria-label={`${actionLabel} ${member.name}`}
            title={actionLabel}
            className="flex size-8 items-center justify-center rounded-full text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:text-ink-500 dark:hover:bg-danger-500/15 dark:hover:text-danger-300"
          >
            <ActionIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
