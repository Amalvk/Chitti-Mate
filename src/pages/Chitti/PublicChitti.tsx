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

/**
 * Identifies a specific decided-or-not outcome for a cycle (not just the
 * cycle itself), so dismissing a "no eligible members" dead end doesn't also
 * suppress the real winner reveal once eligibility gets fixed later for that
 * same cycle.
 */
function drawOutcomeId(cycleId: string, winnerId: string | null): string {
  return `${cycleId}:${winnerId ?? 'none'}`
}

function readDismissedOutcome(chittiId: string): string | null {
  try {
    return localStorage.getItem(`chitty-mate:dismissed-draw:${chittiId}`)
  } catch {
    return null
  }
}

function writeDismissedOutcome(chittiId: string, outcome: string): void {
  try {
    localStorage.setItem(`chitty-mate:dismissed-draw:${chittiId}`, outcome)
  } catch {
    // localStorage unavailable (private mode, etc.) — falls back to only
    // suppressing the overlay for the rest of this tab's session.
  }
}

export function PublicChitti() {
  const { chitti, members, cycles, currentCycle, payments, eligibility } = useChittiOutletContext()
  const activeMembers = members.filter((m) => m.status === 'active')
  const completedCycles = chitti.currentCycle - 1

  // Members watching this page see the same live draw the admin sees, and
  // can trigger AND finalize it themselves (both safe/idempotent — see
  // useLotAutoTrigger) — so history and the next cycle update promptly
  // whether an admin or an external viewer happened to have this open when
  // the winner was decided.
  const draw = useLotAutoTrigger(chitti.id, currentCycle, members, eligibility)

  // A viewer who already saw and closed this exact outcome shouldn't have it
  // block the page again on every refresh — they should land straight on the
  // regular view (history, next countdown, etc). Persisted so it survives a
  // reload, unlike plain component state; re-keyed automatically the moment
  // the outcome for this cycle actually changes (e.g. a real winner replacing
  // an earlier "no eligible members" dead end).
  const currentOutcome = currentCycle ? drawOutcomeId(currentCycle.id, currentCycle.winnerId) : null
  const [dismissed, setDismissed] = useState(
    () => currentOutcome !== null && readDismissedOutcome(chitti.id) === currentOutcome,
  )
  useEffect(() => {
    setDismissed(currentOutcome !== null && readDismissedOutcome(chitti.id) === currentOutcome)
  }, [chitti.id, currentOutcome])
  // Don't leave the overlay stuck shuffling forever if prepareLot failed.
  useEffect(() => {
    if (draw.error) setDismissed(true)
  }, [draw.error])

  function handleDismissDraw() {
    setDismissed(true)
    if (currentOutcome) writeDismissedOutcome(chitti.id, currentOutcome)
  }

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
          onClose={handleDismissDraw}
        />
      )}
    </div>
  )
}
