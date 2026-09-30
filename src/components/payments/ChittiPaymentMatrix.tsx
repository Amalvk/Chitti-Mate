import { useEffect, useState } from 'react'
import { getDocs } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import type { Cycle, Member, Payment } from '@/types'
import { cyclesCol, membersCol, paymentsCol } from '@/services/firebase/paths'
import { markPaymentPaid, markPaymentPending } from '@/services/chitti/payments'
import { formatCurrency } from '@/utils/currency'
import { Badge } from '@/components/ui/Badge'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

interface ChittiPaymentMatrixProps {
  chittiId: string
}

interface MatrixData {
  members: Member[]
  cycles: Cycle[]
  /** cycleId -> memberId -> payment. A missing entry means the member wasn't part of the chitti yet when that cycle's payments were seeded — distinct from an unpaid ("due") entry. */
  paymentsByCycle: Map<string, Map<string, Payment>>
}

function cellKey(cycleId: string, memberId: string): string {
  return `${cycleId}:${memberId}`
}

interface PendingToggle {
  cycle: Cycle
  member: Member
  payment: Payment
}

/** Full member × cycle payment history for one chitti — a one-off report view, so plain `getDocs` rather than live subscriptions (past cycles' payments are frozen anyway once a cycle moves on). Marking/unmarking a cell here writes straight to Firestore and is reflected locally right away. */
export function ChittiPaymentMatrix({ chittiId }: ChittiPaymentMatrixProps) {
  const [data, setData] = useState<MatrixData | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [membersSnap, cyclesSnap] = await Promise.all([
        getDocs(membersCol(chittiId)),
        getDocs(cyclesCol(chittiId)),
      ])
      const members = [...membersSnap.docs.map((d) => d.data())].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      )
      const cycles = [...cyclesSnap.docs.map((d) => d.data())].sort((a, b) => a.cycleNumber - b.cycleNumber)

      const paymentsByCycle = new Map<string, Map<string, Payment>>()
      await Promise.all(
        cycles.map(async (cycle) => {
          const paymentsSnap = await getDocs(paymentsCol(chittiId, cycle.id))
          paymentsByCycle.set(cycle.id, new Map(paymentsSnap.docs.map((d) => [d.data().memberId, d.data()])))
        }),
      )

      if (!cancelled) setData({ members, cycles, paymentsByCycle })
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [chittiId])

  async function confirmToggle() {
    if (!pendingToggle) return
    const { cycle, member, payment } = pendingToggle
    const key = cellKey(cycle.id, member.id)
    setPendingToggle(null)
    setBusyKey(key)
    try {
      if (payment.status === 'paid') {
        await markPaymentPending(chittiId, cycle.id, member.id)
        toast.success(`Unmarked ${member.name}'s Cycle ${cycle.cycleNumber} payment`)
      } else {
        await markPaymentPaid(chittiId, cycle.id, member.id)
        toast.success(`Marked ${member.name}'s Cycle ${cycle.cycleNumber} payment as paid`)
      }
      setData((prev) => {
        if (!prev) return prev
        const nextByCycle = new Map(prev.paymentsByCycle)
        const nextForCycle = new Map(nextByCycle.get(cycle.id))
        nextForCycle.set(member.id, {
          ...payment,
          status: payment.status === 'paid' ? 'pending' : 'paid',
          paidAt: payment.status === 'paid' ? null : new Date().toISOString(),
        })
        nextByCycle.set(cycle.id, nextForCycle)
        return { ...prev, paymentsByCycle: nextByCycle }
      })
    } catch {
      toast.error('Could not update this payment. Please try again.')
    } finally {
      setBusyKey(null)
    }
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const { members, cycles, paymentsByCycle } = data

  if (members.length === 0 || cycles.length === 0) {
    return <p className="py-4 text-center text-sm text-ink-400 dark:text-ink-500">No payment history yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink-100 dark:border-ink-800">
            <th className="sticky left-0 bg-white px-3 py-2 text-left font-bold text-ink-700 dark:bg-ink-900 dark:text-ink-200">
              Member
            </th>
            {cycles.map((cycle) => (
              <th
                key={cycle.id}
                className="whitespace-nowrap px-3 py-2 text-center font-bold text-ink-700 dark:text-ink-200"
              >
                Cycle {cycle.cycleNumber}
              </th>
            ))}
            <th className="whitespace-nowrap px-3 py-2 text-center font-bold text-ink-700 dark:text-ink-200">
              Dues
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const dueCycles = cycles.filter((cycle) => {
              const payment = paymentsByCycle.get(cycle.id)?.get(member.id)
              return payment && payment.status !== 'paid'
            })
            const dueAmount = dueCycles.reduce((sum, cycle) => {
              const payment = paymentsByCycle.get(cycle.id)?.get(member.id)
              return sum + (payment?.amount ?? 0)
            }, 0)
            return (
              <tr key={member.id} className="border-b border-ink-50 last:border-0 dark:border-ink-800/60">
                <td className="sticky left-0 whitespace-nowrap bg-white px-3 py-2.5 font-semibold text-ink-900 dark:bg-ink-900 dark:text-ink-50">
                  {member.name}
                  {member.status === 'removed' && (
                    <span className="ml-1.5 text-xs font-normal text-ink-400 dark:text-ink-500">(inactive)</span>
                  )}
                </td>
                {cycles.map((cycle) => {
                  const payment = paymentsByCycle.get(cycle.id)?.get(member.id)
                  const key = cellKey(cycle.id, member.id)
                  const busy = busyKey === key
                  return (
                    <td key={cycle.id} className="px-3 py-2.5 text-center">
                      {!payment ? (
                        <span title="Not part of this cycle" className="text-ink-300 dark:text-ink-600">
                          —
                        </span>
                      ) : (
                        <button
                          onClick={() => setPendingToggle({ cycle, member, payment })}
                          disabled={busy}
                          title={
                            payment.status === 'paid'
                              ? `Paid Cycle ${cycle.cycleNumber} — click to unmark`
                              : `Due Cycle ${cycle.cycleNumber} — click to mark as paid`
                          }
                          className="mx-auto flex size-6 items-center justify-center rounded-full hover:bg-ink-100 disabled:opacity-50 dark:hover:bg-ink-800"
                        >
                          {busy ? (
                            <Loader2 className="size-4 animate-spin text-ink-400" />
                          ) : payment.status === 'paid' ? (
                            <CheckCircle2 className="size-4 text-success-500" />
                          ) : (
                            <XCircle className="size-4 text-danger-500" />
                          )}
                        </button>
                      )}
                    </td>
                  )
                })}
                <td className="px-3 py-2.5 text-center">
                  {dueCycles.length === 0 ? (
                    <Badge tone="success">{formatCurrency(0)}</Badge>
                  ) : (
                    <span title={`Due: ${dueCycles.map((c) => `Cycle ${c.cycleNumber}`).join(', ')}`}>
                      <Badge tone="danger">{formatCurrency(dueAmount)}</Badge>
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <BottomSheet
        open={!!pendingToggle}
        onClose={() => setPendingToggle(null)}
        title={pendingToggle?.payment.status === 'paid' ? 'Unmark this payment?' : 'Mark as paid?'}
      >
        {pendingToggle && (
          <div className="flex flex-col gap-8">
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {pendingToggle.payment.status === 'paid' ? (
                <>
                  This will mark <span className="font-semibold text-ink-700 dark:text-ink-200">{pendingToggle.member.name}</span>
                  's Cycle {pendingToggle.cycle.cycleNumber} payment as due again.
                </>
              ) : (
                <>
                  This will mark <span className="font-semibold text-ink-700 dark:text-ink-200">{pendingToggle.member.name}</span>
                  's Cycle {pendingToggle.cycle.cycleNumber} payment ({formatCurrency(pendingToggle.payment.amount)}) as paid.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setPendingToggle(null)}>
                Cancel
              </Button>
              <Button fullWidth onClick={() => void confirmToggle()}>
                Confirm
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
