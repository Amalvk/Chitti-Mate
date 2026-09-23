import { useState } from 'react'
import toast from 'react-hot-toast'
import { Lock, Plus, Users } from 'lucide-react'
import { useChittiOutletContext } from '@/context/chittiOutletContext'
import { MemberCard } from '@/components/members/MemberCard'
import { MemberForm } from '@/components/members/MemberForm'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { addMember, deactivateMember } from '@/services/chitti/members'
import type { CreateMemberInput, Member } from '@/types'

export function Members() {
  const { chitti, members, cycles } = useChittiOutletContext()
  const [sheetOpen, setSheetOpen] = useState(false)

  // Once the first cycle's auction has run, the roster locks — the pot,
  // payout and total cycle count were all fixed against that member count.
  const firstAuctionDone = cycles.some((c) => c.cycleNumber === 1 && c.winnerId !== null)

  async function handleAdd(input: CreateMemberInput) {
    await addMember(chitti.id, input)
    toast.success('Member added')
    setSheetOpen(false)
  }

  async function handleDeactivate(member: Member) {
    await deactivateMember(chitti.id, member.id)
    toast.success(`${member.name} deactivated`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">{members.length} Members</h2>
        <Button
          size="sm"
          icon={<Plus className="size-4" />}
          onClick={() => setSheetOpen(true)}
          disabled={firstAuctionDone}
        >
          Add Member
        </Button>
      </div>

      {firstAuctionDone && (
        <div className="flex items-center gap-2 rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-500 dark:border-ink-800 dark:bg-ink-800 dark:text-ink-400">
          <Lock className="size-4 shrink-0" />
          The roster is locked now that the first auction has run. You can still deactivate a
          member, but new members can no longer be added.
        </div>
      )}

      {members.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="No members yet"
          description="Add members to start tracking payments and lots."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              editable
              action="deactivate"
              onRemove={handleDeactivate}
            />
          ))}
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add Member">
        <MemberForm onAdd={handleAdd} />
      </BottomSheet>
    </div>
  )
}
