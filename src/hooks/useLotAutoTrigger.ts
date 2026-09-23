import { useEffect, useMemo, useRef, useState } from 'react'
import type { Cycle, EligibilityResult, Member } from '@/types'
import { prepareLot, cycleIdFor } from '@/services/chitti/lot'
import { useCountdown } from './useCountdown'

interface RevealedDraw {
  cycleId: string
  cycleNumber: number
  winner: Member
}

export interface LotDrawState {
  /** Whether the live-draw overlay should be showing right now. */
  open: boolean
  hasEligibleMembers: boolean
  eligibleMembers: Member[]
  /** Null until the draw is actually decided (persisted in Firestore). */
  winner: Member | null
  /**
   * The cycle number the current reveal belongs to. Once a winner is
   * latched (see below), this stays pinned to that cycle even after
   * `currentCycle` itself has moved on to the next one.
   */
  cycleNumber: number | null
  /**
   * True only when the draw was already decided before this hook ever saw
   * the cycle (e.g. the page loaded after the fact) — the caller should jump
   * straight to the reveal instead of replaying a shuffle for a result
   * that's already known.
   */
  skipSpin: boolean
  /**
   * Drop the latched reveal once the caller is done showing it (e.g. the
   * admin clicked "Continue" after confirming). Until this is called, the
   * reveal survives the cycle rolling over to the next one.
   */
  acknowledge: () => void
  /** Set when `prepareLot` itself threw (network/permission failure) — never set for the ordinary "no eligible members" outcome. */
  error: string | null
}

/**
 * Watches a cycle's auction countdown and, the moment it reaches zero,
 * ensures the lot has actually been run — calling `prepareLot` at most once
 * per cycle from this hook instance.
 *
 * `prepareLot` is itself transactional/idempotent, so it's safe for every
 * open tab (admin or public, on any device) to race to call it: only the
 * first write wins, and every other caller — including ones that never
 * called it at all — converges on the same result via the live `cycles`
 * subscription that feeds `currentCycle` in. Rendering is driven entirely by
 * that reactive state, never by this tab's own call's response, so every
 * viewer sees the same draw regardless of who happened to trigger it.
 *
 * Once decided, the winner is *latched* locally: confirming a winner (admin
 * action, elsewhere) advances `chitti.currentCycle` and swaps in a new cycle
 * doc almost immediately, which would otherwise yank the just-revealed
 * winner off the screen mid-celebration as soon as `currentCycle` updates.
 * The latch keeps showing the decided cycle until the caller acknowledges it.
 */
export function useLotAutoTrigger(
  chittiId: string | undefined,
  currentCycle: Cycle | null,
  members: Member[],
  eligibility: EligibilityResult[],
): LotDrawState {
  const countdown = useCountdown(currentCycle?.status === 'active' ? currentCycle.auctionAt : undefined)
  const triggeredForCycle = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const decidedOnFirstSight = useRef(new Map<string, boolean>())
  const skipSpin = useMemo(() => {
    if (!currentCycle) return false
    if (!decidedOnFirstSight.current.has(currentCycle.id)) {
      decidedOnFirstSight.current.set(currentCycle.id, currentCycle.winnerId !== null)
    }
    return decidedOnFirstSight.current.get(currentCycle.id) ?? false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCycle?.id, currentCycle?.winnerId])

  // Ensures the lot has actually been run for the current cycle — internal
  // only now that there's no manual "Run Lot Now" admin action; the effect
  // below is the sole caller, firing the moment the countdown crosses zero.
  async function triggerLot(): Promise<void> {
    if (!chittiId || !currentCycle) return
    if (triggeredForCycle.current === currentCycle.id) return
    triggeredForCycle.current = currentCycle.id
    setError(null)
    try {
      const result = await prepareLot(chittiId, cycleIdFor(currentCycle.cycleNumber))
      // Nothing was persisted for "no eligible members" — allow a later
      // retry (eligibility can change, e.g. a payment lands) instead of
      // permanently wedging this tab out of ever calling prepareLot again.
      if (result.status !== 'ready') {
        triggeredForCycle.current = null
      }
    } catch {
      triggeredForCycle.current = null
      setError('Could not run the lot. Please try again.')
    }
  }

  useEffect(() => {
    if (!chittiId || !currentCycle) return
    if (currentCycle.status !== 'active') return
    if (!countdown?.isPast) return
    void triggerLot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chittiId, currentCycle?.id, currentCycle?.status, countdown?.isPast])

  // `useCountdown` ticks every second, re-rendering everything downstream —
  // memoized so `eligibleMembers` keeps a stable reference across those
  // ticks (LotAnimation's shuffle effect depends on it, and would otherwise
  // tear down and restart its interval once a second for no real reason).
  const eligibleMembers = useMemo(
    () => eligibility.filter((r) => r.eligible).map((r) => r.member),
    [eligibility],
  )
  const memberById = new Map(members.map((m) => [m.id, m]))
  const liveWinner = currentCycle?.winnerId ? memberById.get(currentCycle.winnerId) ?? null : null

  const [revealed, setRevealed] = useState<RevealedDraw | null>(null)
  useEffect(() => {
    if (!currentCycle || !liveWinner) return
    setRevealed((prev) =>
      prev?.cycleId === currentCycle.id
        ? prev
        : { cycleId: currentCycle.id, cycleNumber: currentCycle.cycleNumber, winner: liveWinner },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCycle?.id, liveWinner])

  function acknowledge() {
    setRevealed(null)
  }

  const winner = revealed?.winner ?? liveWinner
  const cycleNumber = revealed?.cycleNumber ?? currentCycle?.cycleNumber ?? null
  const open =
    !!revealed || (!!currentCycle && currentCycle.status !== 'completed' && !!countdown?.isPast)
  // Once latched, there necessarily WERE eligible members (that's how a
  // winner got picked) — this must stay true regardless of the next cycle's
  // own (possibly empty) live eligibility, or the reveal would render behind
  // the "Lot cannot start" branch instead of the winner it already decided.
  const hasEligibleMembers = !!revealed || eligibleMembers.length > 0

  return {
    open,
    hasEligibleMembers,
    eligibleMembers,
    winner,
    cycleNumber,
    skipSpin,
    acknowledge,
    error,
  }
}
