import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, History } from 'lucide-react'
import { useChittiOutletContext } from '@/context/chittiOutletContext'
import { ChittiHeader } from '@/components/chitti/ChittiHeader'
import { CountdownCard } from '@/components/chitti/CountdownCard'
import { ChittiProgress } from '@/components/chitti/ChittiProgress'
import { RecentWinners } from '@/components/chitti/WinnerCard'
import { PaymentSummary } from '@/components/chitti/PaymentSummary'
import { Card } from '@/components/ui/Card'
import { LotAnimation } from '@/components/auction/LotAnimation'
import { useLotAutoTrigger } from '@/hooks/useLotAutoTrigger'

export function PublicChitti() {
  const { chitti, members, cycles, currentCycle, payments, eligibility } = useChittiOutletContext()
  const activeMembers = members.filter((m) => m.status === 'active')
  const completedCycles = chitti.currentCycle - 1

  // Members watching this page see the same live draw the admin sees. This
  // page can help trigger the draw itself (safe: `prepareLot` is idempotent)
  // but never finalizes the cycle — only the admin's Lot page calls
  // `confirmWinner`, which happens automatically there the instant a winner
  // is picked.
  const draw = useLotAutoTrigger(chitti.id, currentCycle, members, eligibility)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => setDismissed(false), [currentCycle?.id])
  // A winner being decided is always worth surfacing, even if this viewer
  // already dismissed an earlier "no eligible members" result for this same
  // cycle (that dead end and a real decision share the same cycle id).
  useEffect(() => {
    if (draw.winner) setDismissed(false)
  }, [draw.winner])
  // Don't leave the overlay stuck shuffling forever if prepareLot failed.
  useEffect(() => {
    if (draw.error) setDismissed(true)
  }, [draw.error])

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">{chitti.name}</h1>
      <ChittiHeader chitti={chitti} />

      {chitti.status === 'completed' ? (
        <Card className="flex items-center gap-3 border-success-100 bg-success-50/60 dark:border-success-500/25 dark:bg-success-500/10">
          <CheckCircle2 className="size-6 text-success-600 dark:text-success-400" />
          <div>
            <p className="font-bold text-success-800 dark:text-success-300">Chitti completed</p>
            <p className="text-sm text-success-700/80 dark:text-success-400/80">All {chitti.totalCycles} cycles have finished.</p>
          </div>
        </Card>
      ) : (
        currentCycle && (
          <>
            <CountdownCard targetIso={currentCycle.auctionAt} />
            <PaymentSummary payments={payments} totalMembers={activeMembers.length} />
          </>
        )
      )}

      <ChittiProgress completedCycles={completedCycles} totalCycles={chitti.totalCycles} />

      <RecentWinners cycles={cycles} members={members} limit={3} />

      <Link
        to={`/chitti/${chitti.id}/history`}
        className="flex items-center justify-center gap-1.5 rounded-2xl border border-ink-200 bg-white py-3.5 text-sm font-semibold text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
      >
        <History className="size-4" /> View full history
      </Link>

      {currentCycle && draw.open && !dismissed && draw.cycleNumber !== null && (
        <LotAnimation
          open
          cycleNumber={draw.cycleNumber}
          amount={chitti.amount}
          hasEligibleMembers={draw.hasEligibleMembers}
          eligibleMembers={draw.eligibleMembers}
          winner={draw.winner}
          skipSpin={draw.skipSpin}
          closeLabel="Close"
          onClose={() => setDismissed(true)}
        />
      )}
    </div>
  )
}
