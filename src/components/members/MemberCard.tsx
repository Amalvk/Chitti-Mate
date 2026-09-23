import { Phone, Trash2, Trophy, User, UserX } from 'lucide-react'
import type { Member } from '@/types'
import { maskPhone } from '@/utils/validation'
import { Badge } from '@/components/ui/Badge'

interface MemberCardProps {
  member: Member
  editable?: boolean
  onRemove?: (member: Member) => void
  /**
   * 'remove' deletes a not-yet-saved draft row (CreateChitti); 'deactivate' is
   * the real, non-destructive action on a saved member — they keep their
   * history, they just stop being eligible for future cycles.
   */
  action?: 'remove' | 'deactivate'
}

export function MemberCard({ member, editable = false, onRemove, action = 'remove' }: MemberCardProps) {
  const removed = member.status === 'removed'
  const ActionIcon = action === 'deactivate' ? UserX : Trash2
  const actionLabel = action === 'deactivate' ? 'Deactivate' : 'Remove'
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-soft dark:bg-ink-900 dark:shadow-none ${
        removed ? 'opacity-50' : 'border-ink-100 dark:border-ink-800'
      }`}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
        <User className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-ink-900 dark:text-ink-50">{member.name}</p>
        {member.phone && (
          <p className="flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400">
            <Phone className="size-3.5" />
            {maskPhone(member.phone)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {member.hasWon && (
          <Badge tone="warning" icon={<Trophy className="size-3.5" />}>
            Won Cycle {member.wonCycle}
          </Badge>
        )}
        {removed && <Badge tone="neutral">Inactive</Badge>}
        {editable && !removed && onRemove && (
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
