import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Ban, Dices, Sparkles } from 'lucide-react'
import { BackHeader } from '@/components/layout/BackHeader'
import { TextField } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MemberForm } from '@/components/members/MemberForm'
import { MemberCard } from '@/components/members/MemberCard'
import { createChittiWithMembers } from '@/services/chitti/chitti'
import { combineDateAndTime, todayDateInputValue } from '@/utils/date'
import { formatCurrency } from '@/utils/currency'
import { validateCreateChittiForm, hasErrors } from '@/utils/validation'
import type { CreateChittiFormValues } from '@/utils/validation'
import type { ChittiDuration, CreateMemberInput, Member } from '@/types'

const initialValues: CreateChittiFormValues = {
  name: '',
  amount: '',
  commission: '',
  duration: 'monthly',
  startDate: todayDateInputValue(),
  selectionMethod: 'lot',
  auctionDate: todayDateInputValue(),
  auctionTime: '',
}

export function CreateChitti() {
  const navigate = useNavigate()
  const [values, setValues] = useState<CreateChittiFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [members, setMembers] = useState<CreateMemberInput[]>([])
  const [submitting, setSubmitting] = useState(false)

  function setField<K extends keyof CreateChittiFormValues>(key: K, value: CreateChittiFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleAddMember(input: CreateMemberInput) {
    setMembers((m) => [...m, input])
  }

  function handleRemoveMember(index: number) {
    setMembers((m) => m.filter((_, i) => i !== index))
  }

  const amount = Number(values.amount) || 0
  const commission = Number(values.commission) || 0
  const grossPot = members.length * amount
  const payout = Math.max(grossPot - commission, 0)

  async function handleSubmit() {
    const fieldErrors = validateCreateChittiForm(values, members.length)
    setErrors(fieldErrors)
    if (hasErrors(fieldErrors)) {
      toast.error('Please fix the highlighted fields')
      return
    }

    const auctionAt = combineDateAndTime(values.auctionDate, values.auctionTime)

    setSubmitting(true)
    try {
      const id = await createChittiWithMembers({
        chitti: {
          name: values.name.trim(),
          amount,
          commission,
          duration: values.duration,
          totalMembers: members.length,
          totalCycles: members.length,
          startDate: new Date(values.startDate).toISOString(),
          selectionMethod: values.selectionMethod,
        },
        members,
        auctionAt,
        // Payments simply need to land before the auction runs — there's no
        // separate deadline to schedule up front.
        paymentDeadline: auctionAt,
      })
      toast.success('Chitti created')
      navigate(`/admin/chittis/${id}`)
    } catch {
      toast.error('Could not create chitti. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-ink-50 pb-28 dark:bg-ink-950">
      <div className="mx-auto max-w-lg px-4 pt-[max(1.5rem,env(safe-area-inset-top))] md:max-w-2xl md:px-8 md:pt-8">
        <BackHeader title="Create Chitti" onBack={() => navigate(-1)} />

        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4">
            <SectionTitle>Chitti Details</SectionTitle>
            <TextField
              label="Chitti Name"
              placeholder="e.g. Family Chitti"
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              error={errors.name}
            />
            <TextField
              label="Contribution Amount"
              hint="Paid by each member, every cycle"
              placeholder="5000"
              inputMode="numeric"
              suffix="₹"
              value={values.amount}
              onChange={(e) => setField('amount', e.target.value)}
              error={errors.amount}
            />
            <TextField
              label="Commission (optional)"
              hint="Your cut, deducted from the payout each cycle"
              placeholder="0"
              inputMode="numeric"
              suffix="₹"
              value={values.commission}
              onChange={(e) => setField('commission', e.target.value)}
              error={errors.commission}
            />

            {amount > 0 && members.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-2xl bg-brand-50 p-4 text-sm dark:bg-brand-500/10">
                <SummaryRow label={`${formatCurrency(amount)} × ${members.length} members`} value={formatCurrency(grossPot)} />
                {commission > 0 && <SummaryRow label="− Commission" value={`− ${formatCurrency(commission)}`} />}
                <div className="my-1 h-px bg-brand-100 dark:bg-brand-500/20" />
                <SummaryRow label="Payout per cycle" value={formatCurrency(payout)} strong />
                <SummaryRow label="Total cycles" value={`${members.length} (one per member)`} />
              </div>
            )}

            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink-700 dark:text-ink-200">Duration</p>
              <SegmentedControl
                name="duration"
                value={values.duration}
                onChange={(v) => setField('duration', v as ChittiDuration)}
                options={[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
              />
            </div>
            <TextField
              label="Start Date"
              type="date"
              min={todayDateInputValue()}
              value={values.startDate}
              onChange={(e) => setField('startDate', e.target.value)}
              error={errors.startDate}
            />
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <SectionTitle>Members</SectionTitle>
              <span className="text-sm font-semibold text-ink-500 dark:text-ink-400">
                {members.length} added
              </span>
            </div>

            {members.length > 0 && (
              <div className="flex flex-col gap-2">
                {members.map((m, i) => (
                  <MemberCard
                    key={i}
                    member={draftMember(m, i)}
                    editable
                    onRemove={() => handleRemoveMember(i)}
                  />
                ))}
              </div>
            )}

            <MemberForm onAdd={handleAddMember} />
            {errors.members && <p className="text-xs font-medium text-danger-600 dark:text-danger-400">{errors.members}</p>}
          </Card>

          <Card className="flex flex-col gap-4">
            <SectionTitle>Auction Configuration</SectionTitle>
            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink-700 dark:text-ink-200">Selection Method</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 rounded-2xl border border-brand-500 bg-brand-50 px-4 py-3.5 dark:bg-brand-500/15">
                  <input type="radio" checked readOnly className="accent-brand-600" />
                  <Dices className="size-4 text-brand-600 dark:text-brand-300" />
                  <span className="font-semibold text-brand-700 dark:text-brand-300">Lot</span>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3.5 opacity-60 dark:border-ink-700 dark:bg-ink-800">
                  <input type="radio" disabled className="accent-ink-400" />
                  <Ban className="size-4 text-ink-400 dark:text-ink-500" />
                  <span className="flex-1 font-semibold text-ink-500 dark:text-ink-400">By Call</span>
                  <span className="rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-500 dark:bg-ink-700 dark:text-ink-400">
                    Coming soon
                  </span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                label="Auction Date"
                type="date"
                min={todayDateInputValue()}
                value={values.auctionDate}
                onChange={(e) => setField('auctionDate', e.target.value)}
              />
              <TextField
                label="Auction Time"
                type="time"
                value={values.auctionTime}
                onChange={(e) => setField('auctionTime', e.target.value)}
              />
            </div>
            <p className="text-xs text-ink-400 dark:text-ink-500">
              Share the chitti link with members now — mark payments as they come in, any time before the auction starts.
            </p>
            {errors.auction && (
              <p className="text-xs font-medium text-danger-600 dark:text-danger-400">{errors.auction}</p>
            )}
          </Card>
        </div>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 border-t border-ink-100 bg-white/95 px-4 py-3 backdrop-blur md:px-8 dark:border-ink-800 dark:bg-ink-900/95">
        <div className="mx-auto max-w-lg md:max-w-2xl">
          <Button
            fullWidth
            size="lg"
            icon={<Sparkles className="size-4" />}
            loading={submitting}
            onClick={handleSubmit}
          >
            Create Chitti
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

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? 'font-bold text-brand-700 dark:text-brand-200' : 'text-ink-600 dark:text-ink-300'}>
        {label}
      </span>
      <span className={strong ? 'font-bold text-brand-700 dark:text-brand-200' : 'font-semibold text-ink-700 dark:text-ink-200'}>
        {value}
      </span>
    </div>
  )
}
