import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PiggyBank, Plus, Trash2, Users } from 'lucide-react'
import { useTreasureGroup, useTreasureMembers, useContributions } from '@/hooks/useTreasure'
import { deleteTreasureGroup } from '@/services/treasure/groups'
import { addTreasureMember } from '@/services/treasure/members'
import { addContribution, deleteContribution } from '@/services/treasure/contributions'
import { TreasureMemberRow } from '@/components/treasure/TreasureMemberRow'
import { BackHeader } from '@/components/layout/BackHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { TextField } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { MemberForm } from '@/components/members/MemberForm'
import { formatCurrency } from '@/utils/currency'
import { todayDateInputValue } from '@/utils/date'
import { totalBalance } from '@/utils/treasure'
import type { CreateMemberInput, Contribution, ContributionType, TreasureMember } from '@/types'

interface ContributionTarget {
  member: TreasureMember
  type: ContributionType
}

export function TreasureGroupDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { group, loading, notFound } = useTreasureGroup(id)
  const { members } = useTreasureMembers(id)
  const { contributions } = useContributions(id)

  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [target, setTarget] = useState<ContributionTarget | null>(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayDateInputValue())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const contributionsByMember = new Map<string, Contribution[]>()
  for (const c of contributions) {
    contributionsByMember.set(c.memberId, [...(contributionsByMember.get(c.memberId) ?? []), c])
  }
  const totalSaved = totalBalance(contributions)
  const targetBalance = target ? totalBalance(contributionsByMember.get(target.member.id) ?? []) : 0

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <SkeletonList count={2} />
      </div>
    )
  }

  if (notFound || !group || !id) {
    return (
      <EmptyState
        icon={<PiggyBank className="size-6" />}
        title="Group not found"
        description="This savings group may have been removed."
        action={
          <button onClick={() => navigate('/admin/treasure')} className="text-sm font-semibold text-brand-600">
            Back to Treasure
          </button>
        }
      />
    )
  }

  async function handleAddMember(input: CreateMemberInput) {
    await addTreasureMember(id!, input)
    toast.success('Member added')
    setAddMemberOpen(false)
  }

  async function handleAddContribution() {
    if (!target) return
    const parsedAmount = Number(amount)
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (target.type === 'withdrawal' && parsedAmount > targetBalance) {
      toast.error(`${target.member.name} has only ${formatCurrency(targetBalance)} saved`)
      return
    }
    setSaving(true)
    try {
      await addContribution(id!, {
        memberId: target.member.id,
        type: target.type,
        amount: parsedAmount,
        contributedAt: new Date(date).toISOString(),
        note,
      })
      toast.success(
        target.type === 'withdrawal'
          ? `Recorded ${target.member.name}'s withdrawal`
          : `Saved ${target.member.name}'s contribution`,
      )
      setTarget(null)
      setAmount('')
      setNote('')
      setDate(todayDateInputValue())
    } catch {
      toast.error('Could not save this entry. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteContribution(contribution: Contribution) {
    try {
      await deleteContribution(id!, contribution.id)
      toast.success('Entry deleted')
    } catch {
      toast.error('Could not delete this entry. Please try again.')
    }
  }

  async function handleDeleteGroup() {
    setDeleting(true)
    try {
      await deleteTreasureGroup(id!)
      toast.success('Group deleted')
      navigate('/admin/treasure')
    } catch {
      toast.error('Could not delete this group. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <BackHeader
        title={group.name}
        subtitle={`${members.filter((m) => m.status === 'active').length} members`}
        onBack={() => navigate('/admin/treasure')}
        action={
          <button
            onClick={() => setDeleteSheetOpen(true)}
            aria-label="Delete group"
            title="Delete group"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-ink-600 shadow-soft hover:bg-danger-50 hover:text-danger-600 dark:bg-ink-900 dark:text-ink-300 dark:shadow-none dark:hover:bg-danger-500/15 dark:hover:text-danger-300"
          >
            <Trash2 className="size-4" />
          </button>
        }
      />

      <Card className="flex items-center gap-3.5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-300">
          <PiggyBank className="size-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">Total saved</p>
          <p className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">{formatCurrency(totalSaved)}</p>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">{members.length} Members</h2>
        <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setAddMemberOpen(true)}>
          Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="No members yet"
          description="Add members to start tracking their savings."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {members.map((member) => (
            <TreasureMemberRow
              key={member.id}
              member={member}
              contributions={contributionsByMember.get(member.id) ?? []}
              onDeposit={(m) => setTarget({ member: m, type: 'deposit' })}
              onWithdraw={(m) => setTarget({ member: m, type: 'withdrawal' })}
              onDeleteContribution={(c) => void handleDeleteContribution(c)}
            />
          ))}
        </div>
      )}

      <BottomSheet open={addMemberOpen} onClose={() => setAddMemberOpen(false)} title="Add Member">
        <MemberForm onAdd={handleAddMember} />
      </BottomSheet>

      <BottomSheet
        open={!!target}
        onClose={() => setTarget(null)}
        title={
          target
            ? `${target.type === 'withdrawal' ? 'Withdraw' : 'Add savings'} · ${target.member.name}`
            : undefined
        }
      >
        <div className="flex flex-col gap-5">
          {target?.type === 'withdrawal' && (
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Currently saved: <span className="font-semibold text-ink-700 dark:text-ink-200">{formatCurrency(targetBalance)}</span>
            </p>
          )}
          <TextField
            label="Amount"
            inputMode="numeric"
            suffix="₹"
            placeholder="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <TextField
            label="Date"
            type="date"
            max={todayDateInputValue()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <TextField
            label="Note (optional)"
            placeholder="e.g. Cash handed over"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            fullWidth
            variant={target?.type === 'withdrawal' ? 'danger' : 'primary'}
            loading={saving}
            onClick={() => void handleAddContribution()}
          >
            {target?.type === 'withdrawal' ? 'Withdraw' : 'Save'}
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={deleteSheetOpen}
        onClose={() => setDeleteSheetOpen(false)}
        title="Delete this group?"
        dismissible={!deleting}
      >
        <div className="flex flex-col gap-8">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            This permanently deletes <span className="font-semibold text-ink-700 dark:text-ink-200">{group.name}</span>,
            its members, and every recorded contribution. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth disabled={deleting} onClick={() => setDeleteSheetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={deleting}
              icon={<Trash2 className="size-4" />}
              onClick={() => void handleDeleteGroup()}
            >
              Delete
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
