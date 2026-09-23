import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Dices, ShieldCheck } from 'lucide-react'
import { useChittiOutletContext } from '@/context/chittiOutletContext'
import { EligibilityList } from '@/components/auction/EligibilityList'
import { LotAnimation } from '@/components/auction/LotAnimation'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLotAutoTrigger } from '@/hooks/useLotAutoTrigger'
import { confirmWinner, cycleIdFor } from '@/services/chitti/lot'

const RETRY_DELAYS_MS = [400, 900, 1500]

async function confirmWithRetry(chittiId: string, cycleId: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await confirmWinner(chittiId, cycleId)
      return
    } catch (err) {
      if (attempt >= RETRY_DELAYS_MS.length) throw err
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }
}

export function Lot() {
  const { chitti, members, currentCycle, eligibility } = useChittiOutletContext()
  const navigate = useNavigate()
  const draw = useLotAutoTrigger(chitti.id, currentCycle, members, eligibility)
  // A manual "Run Lot Now" click should open the modal immediately (even to
  // show "no eligible members"), not wait for the countdown/winner to make
  // `draw.open` true on its own. `dismissed` lets an admin close that "no
  // eligible members" state without it auto-reopening on every render —
  // `draw.open` itself stays true for as long as the countdown is past.
  const [manuallyOpened, setManuallyOpened] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const confirmedForCycle = useRef<number | null>(null)

  useEffect(() => {
    setManuallyOpened(false)
    setDismissed(false)
  }, [currentCycle?.id])

  // A winner being decided is always worth surfacing, even if this admin
  // already dismissed an earlier "no eligible members" result for this same
  // cycle (that dead end and a real decision share the same cycle id).
  useEffect(() => {
    if (draw.winner) setDismissed(false)
  }, [draw.winner])

  // Surface a `prepareLot` failure instead of leaving the modal stuck
  // shuffling forever with no error and no way to close it.
  useEffect(() => {
    if (draw.error) {
      toast.error(draw.error)
      setDismissed(true)
    }
  }, [draw.error])

  // Once the lot picks a winner, that IS the winner — no separate admin
  // confirmation step. This fires the instant a winner is known, in parallel
  // with the reveal animation still playing out, so by the time the admin
  // sees the celebration the cycle has (almost always) already been
  // finalized underneath it. Guarded so it only ever runs once per cycle.
  //
  // `draw.winner` can turn non-null from THIS tab's own optimistic local
  // cache the moment `prepareLot`'s transaction is staged, slightly before
  // that write is durably committed server-side. `confirmWinner` runs its
  // own transaction, which always reads the server (never the local cache)
  // — so calling it in that narrow window can read a still-null `winnerId`
  // and fail with "No winner to confirm". Retrying a few times comfortably
  // outlasts that window without needing any UI-visible retry affordance
  // now that there's no manual Confirm button.
  useEffect(() => {
    if (!currentCycle || !draw.winner) return
    if (confirmedForCycle.current === currentCycle.cycleNumber) return
    confirmedForCycle.current = currentCycle.cycleNumber
    const cycleNumber = currentCycle.cycleNumber

    confirmWithRetry(chitti.id, cycleIdFor(cycleNumber)).catch(() => {
      confirmedForCycle.current = null
      toast.error('Could not finalize the winner. Please try again.')
    })
  }, [chitti.id, currentCycle, draw.winner])

  const noActiveCycle = chitti.status === 'completed' || !currentCycle
  const open = (draw.open && !dismissed) || manuallyOpened

  async function handleRunLotNow() {
    setManuallyOpened(true)
    await draw.runNow()
  }

  function handleClose() {
    draw.acknowledge()
    if (draw.winner) {
      navigate(`/admin/chittis/${chitti.id}`)
      return
    }
    setManuallyOpened(false)
    setDismissed(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {noActiveCycle ? (
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title="Chitti completed"
          description="All cycles have finished — there is no lot to run."
        />
      ) : (
        <>
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">Cycle {chitti.currentCycle} Lot</h2>

          <EligibilityList eligibility={eligibility} />

          {!open && (
            <Button
              size="lg"
              icon={<Dices className="size-4" />}
              loading={draw.triggering}
              onClick={() => void handleRunLotNow()}
            >
              Run Lot Now
            </Button>
          )}
        </>
      )}

      {currentCycle && open && draw.cycleNumber !== null && (
        <LotAnimation
          open
          cycleNumber={draw.cycleNumber}
          amount={chitti.amount}
          hasEligibleMembers={draw.hasEligibleMembers}
          eligibleMembers={draw.eligibleMembers}
          winner={draw.winner}
          skipSpin={draw.skipSpin}
          closeLabel="Back to Chitti"
          onClose={handleClose}
        />
      )}
    </div>
  )
}
