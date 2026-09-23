import { useEffect, useMemo, useRef, useState } from 'react'
import type { Cycle, EligibilityResult, Member } from '@/types'
import { prepareLot, confirmWinner, cycleIdFor } from '@/services/chitti/lot'
import { useCountdown } from './useCountdown'

// This tab's own `prepareLot` write can be echoed back through its local
// Firestore cache (making the live winner go non-null) before that write is
// durably committed server-side. `confirmWinner` always reads the server, so
// it can land in that narrow window and see a still-null `winnerId`. The
// retry budget needs to comfortably outlast real-world write latency — a
// short budget is routinely too short over anything but a fast local
// connection, surfacing a false "could not finalize" error even though the
// very next retry (or a page refresh) would have shown it as finalized.
const CONFIRM_RETRY_DELAYS_MS = [400, 800, 1200, 1800, 2500, 3500, 5000]

async function confirmWithRetry(chittiId: string, cycleId: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await confirmWinner(chittiId, cycleId)
      return
    } catch (err) {
      if (attempt >= CONFIRM_RETRY_DELAYS_MS.length) throw err
      await new Promise((resolve) => setTimeout(resolve, CONFIRM_RETRY_DELAYS_MS[attempt]))
    }
  }
}

interface RevealedDraw {
  cycleId: string
  cycleNumber: number
  winner: Member
  /** The eligible pool as it was for THIS cycle at decision time — see the latch below. */
  eligibleMembers: Member[]
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
  /** Set when `confirmWinner` still failed after exhausting its retry budget. Caller decides whether/how to surface it. */
  confirmError: string | null
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
        : {
            cycleId: currentCycle.id,
            cycleNumber: currentCycle.cycleNumber,
            winner: liveWinner,
            eligibleMembers,
          },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCycle?.id, liveWinner])

  // Once the lot picks a winner, that IS the winner — no separate admin
  // confirmation step. This fires the instant a winner is known from EITHER
  // the admin's Lot page or an external viewer's link, so history and the
  // next cycle update promptly regardless of which one happened to be open;
  // `confirmWinner` itself is idempotent, so every caller racing it is safe.
  // Guarded so it only ever runs once per cycle per hook instance.
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const confirmedForCycle = useRef<number | null>(null)
  useEffect(() => {
    if (!chittiId || !currentCycle || !liveWinner) return
    if (confirmedForCycle.current === currentCycle.cycleNumber) return
    confirmedForCycle.current = currentCycle.cycleNumber
    const cycleNumber = currentCycle.cycleNumber

    confirmWithRetry(chittiId, cycleIdFor(cycleNumber)).catch(() => {
      confirmedForCycle.current = null
      setConfirmError('Could not finalize the winner. Please try again.')
    })
  }, [chittiId, currentCycle, liveWinner])

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
  // `confirmWinner` runs independently and can advance `currentCycle` to the
  // next one (with its own, unrelated live eligibility) well before the admin's
  // reveal animation finishes playing out. Once latched, the eligible pool
  // shown must stay pinned to the one THIS cycle's winner was actually drawn
  // from — otherwise the ceremony's "N eligible" count and name pool visibly
  // shift mid-animation as the next cycle's payments get seeded underneath it.
  const displayedEligibleMembers = revealed?.eligibleMembers ?? eligibleMembers

  return {
    open,
    hasEligibleMembers,
    eligibleMembers: displayedEligibleMembers,
    winner,
    cycleNumber,
    skipSpin,
    acknowledge,
    error,
    confirmError,
  }
}
