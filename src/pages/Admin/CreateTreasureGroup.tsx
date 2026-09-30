import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PiggyBank } from 'lucide-react'
import { BackHeader } from '@/components/layout/BackHeader'
import { TextField } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MemberForm } from '@/components/members/MemberForm'
import { MemberCard } from '@/components/members/MemberCard'
import { createTreasureGroup } from '@/services/treasure/groups'
import { addTreasureMember } from '@/services/treasure/members'
import type { CreateMemberInput, Member } from '@/types'

export function CreateTreasureGroup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | undefined>()
  const [members, setMembers] = useState<CreateMemberInput[]>([])
  const [submitting, setSubmitting] = useState(false)

  function handleAddMember(input: CreateMemberInput) {
    setMembers((m) => [...m, input])
  }

  function handleRemoveMember(index: number) {
    setMembers((m) => m.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setNameError('Group name is required')
      toast.error('Please fix the highlighted fields')
      return
    }
    setNameError(undefined)

    setSubmitting(true)
    try {
      const groupId = await createTreasureGroup(name.trim())
      for (const member of members) {
        await addTreasureMember(groupId, member)
      }
      toast.success('Group created')
      navigate(`/admin/treasure/${groupId}`)
    } catch {
      toast.error('Could not create this group. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-ink-50 pb-28 dark:bg-ink-950">
      <div className="mx-auto max-w-lg px-4 pt-[max(1.5rem,env(safe-area-inset-top))] md:max-w-2xl md:px-8 md:pt-8">
        <BackHeader title="New Savings Group" onBack={() => navigate(-1)} />

        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4">
            <SectionTitle>Group Details</SectionTitle>
            <TextField
              label="Group Name"
              placeholder="e.g. Office Savings Circle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
            />
            <p className="text-xs text-ink-400 dark:text-ink-500">
              No fixed contribution amount or schedule — members can add savings any time, any amount.
            </p>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <SectionTitle>Members</SectionTitle>
              <span className="text-sm font-semibold text-ink-500 dark:text-ink-400">{members.length} added</span>
            </div>

            {members.length > 0 && (
              <div className="flex flex-col gap-2">
                {members.map((m, i) => (
                  <MemberCard key={i} member={draftMember(m, i)} editable onRemove={() => handleRemoveMember(i)} />
                ))}
              </div>
            )}

            <MemberForm onAdd={handleAddMember} />
            <p className="text-xs text-ink-400 dark:text-ink-500">
              Members are optional here — you can also add them later from the group page.
            </p>
          </Card>
        </div>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 border-t border-ink-100 bg-white/95 px-4 py-3 backdrop-blur md:px-8 dark:border-ink-800 dark:bg-ink-900/95">
        <div className="mx-auto max-w-xl pb-4">
          <Button
            fullWidth
            size="lg"
            icon={<PiggyBank className="size-4" />}
            loading={submitting}
            onClick={() => void handleSubmit()}
          >
            Create Group
          </Button>
        </div>
      </div>
    </div>
  )
}

function draftMember(input: CreateMemberInput, index: number): Member {
  return {
    id: `draft-${index}`,
    name: input.name,
    phone: input.phone,
    status: 'active',
    hasWon: false,
    wonCycle: null,
    createdAt: '',
  }
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400 dark:text-ink-500">{children}</h2>
}
