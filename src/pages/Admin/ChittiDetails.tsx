import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle2, Dices, Share2, Trash2, Trophy, Wallet } from 'lucide-react'
import { useChittiOutletContext } from '@/context/chittiOutletContext'
import { ChittiHeader } from '@/components/chitti/ChittiHeader'
import { CountdownCard } from '@/components/chitti/CountdownCard'
import { ChittiProgress } from '@/components/chitti/ChittiProgress'
import { RecentWinners } from '@/components/chitti/WinnerCard'
import { MembersSummaryCard } from '@/components/chitti/MembersSummaryCard'
import { PaymentSummary } from '@/components/chitti/PaymentSummary'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { shareChitti } from '@/utils/share'
import { useCountdown } from '@/hooks/useCountdown'
import { formatMonthName } from '@/utils/date'
import { deleteChitti } from '@/services/chitti/chitti'

// Module-level (not component state) so it survives this page unmounting and
// remounting — e.g. the admin dismisses the live draw and navigates back
// here. Without that, a cycle stuck past-due with no eligible members would
// force-redirect back to /lot on every single visit, trapping the admin away
// from Members/Payments (the only place they can actually fix eligibility).
// A full page reload is an acceptable reset point, same as the guards inside
// useLotAutoTrigger.
const autoNavigatedCycles = new Set<string>()

export function ChittiDetails() {
  const { chitti, members, cycles, currentCycle, payments } = useChittiOutletContext()
  const navigate = useNavigate()
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const activeMembers = members.filter((m) => m.status === 'active')
  const completedCycles = chitti.currentCycle - 1

  const latestWinner = useMemo(() => {
    const completed = cycles
      .filter((c) => c.status === 'completed' && c.winnerId)
      .sort((a, b) => b.cycleNumber - a.cycleNumber)
    const cycle = completed[0]
    const member = cycle ? members.find((m) => m.id === cycle.winnerId) : undefined
    return cycle && member ? { cycle, member } : null
  }, [cycles, members])

  // The moment this cycle's auction time arrives, take the admin straight
  // into the live draw instead of making them notice the timer and click
  // "Run Lot" themselves. Guarded per cycle id so React StrictMode's dev
  // double-invoke can't push two history entries, and so this only ever
  // fires once per cycle rather than on every mount of this page.
  const countdown = useCountdown(currentCycle?.status === 'active' ? currentCycle.auctionAt : undefined)
  useEffect(() => {
    if (!currentCycle || !countdown?.isPast) return
    if (autoNavigatedCycles.has(currentCycle.id)) return
    autoNavigatedCycles.add(currentCycle.id)
    navigate(`/admin/chittis/${chitti.id}/lot`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown?.isPast, currentCycle?.id, chitti.id, navigate])

  async function handleShare() {
    const result = await shareChitti(chitti.id, chitti.name)
    if (result === 'copied') toast.success('Chitti link copied')
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteChitti(chitti.id)
      toast.success('Chitti deleted')
      navigate('/admin/chittis')
    } catch {
      toast.error('Could not delete this chitti. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <ChittiHeader chitti={chitti} />
        <button
          onClick={handleShare}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
        >
          <Share2 className="size-4" /> Share
        </button>
      </div>

      {latestWinner && (
        <Card className="flex items-center gap-3.5 border-warning-200 bg-gradient-to-br from-warning-50 to-brand-50 dark:border-warning-500/25 dark:from-warning-500/10 dark:to-brand-500/10">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning-500 text-white shadow-soft dark:shadow-none">
            <Trophy className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold text-ink-900 dark:text-ink-50">{latestWinner.member.name}</p>
            <p className="text-sm font-semibold text-warning-700 dark:text-warning-300">
              {formatMonthName(latestWinner.cycle.completedAt ?? latestWinner.cycle.auctionAt)} Winner · Cycle{' '}
              {latestWinner.cycle.cycleNumber}
            </p>
          </div>
        </Card>
      )}

      {chitti.status === 'completed' ? (
        <Card className="flex items-center gap-3 border-success-100 bg-success-50/60 dark:border-success-500/25 dark:bg-success-500/10">
          <CheckCircle2 className="size-6 text-success-600 dark:text-success-400" />
          <div>
            <p className="font-bold text-success-800 dark:text-success-300">Chitti completed</p>
            <p className="text-sm text-success-700/80 dark:text-success-400/80">All {chitti.totalCycles} cycles have finished.</p>
          </div>
        </Card>
      ) : currentCycle ? (
        <>
          <CountdownCard targetIso={currentCycle.auctionAt} />
          <div className="flex items-center justify-between">
            <PaymentSummary payments={payments} totalMembers={activeMembers.length} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link to={`/admin/chittis/${chitti.id}/payments`}>
              <Button variant="secondary" fullWidth icon={<Wallet className="size-4" />}>
                Manage Payments
              </Button>
            </Link>
            <Button
              fullWidth
              icon={<Dices className="size-4" />}
              onClick={() => navigate(`/admin/chittis/${chitti.id}/lot`)}
            >
              {currentCycle.status === 'lot_pending' ? 'View Lot' : 'Run Lot'}
            </Button>
          </div>
        </>
      ) : null}

      <ChittiProgress completedCycles={completedCycles} totalCycles={chitti.totalCycles} />

      <RecentWinners cycles={cycles} members={members} />

      <MembersSummaryCard members={members} payments={payments} to={`/admin/chittis/${chitti.id}/members`} />

      <Link
        to={`/chitti/${chitti.id}/history`}
        className="text-center text-sm font-semibold text-brand-600 dark:text-brand-400"
      >
        View public history page →
      </Link>

      <button
        onClick={() => setDeleteSheetOpen(true)}
        className="flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-danger-500 hover:text-danger-600 dark:text-danger-400 dark:hover:text-danger-300"
      >
        <Trash2 className="size-4" /> Delete Chitti
      </button>

      <BottomSheet
        open={deleteSheetOpen}
        onClose={() => setDeleteSheetOpen(false)}
        title="Delete this chitti?"
        dismissible={!deleting}
      >
        <p className="mb-5 text-sm text-ink-500 dark:text-ink-400">
          This permanently deletes <span className="font-semibold text-ink-700 dark:text-ink-200">{chitti.name}</span>,
          its members, and its full cycle and payment history. This cannot be undone.
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
            onClick={() => void handleDelete()}
          >
            Delete
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
