import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PartyPopper, Sparkles, UserX, Users } from 'lucide-react'
import type { Member } from '@/types'
import { formatCurrency } from '@/utils/currency'
import { Button } from '@/components/ui/Button'
import { Confetti } from './Confetti'

type Phase = 'preparing' | 'checking' | 'roster' | 'selecting' | 'revealed'

/** Visible rows in the scrolling reel — must be odd so there's a single centre row. */
const REEL_SIZE = 7
const REEL_CENTER = Math.floor(REEL_SIZE / 2)
/** Direction each tick advances the round-robin cursor (wraps through the member list in a fixed, repeating order — never randomised — so no two nearby rows repeat a name). */
const REEL_DIRECTION = -1
const PREPARING_MS = 1500
const CHECKING_MS = 1500
/** Scales with roster size so the staggered reveal always finishes with room to read it, capped so a big chitti doesn't drag the ceremony out. */
function rosterHoldMs(memberCount: number): number {
  return Math.min(4500, 2000 + memberCount * 80)
}
/**
 * Total length of the spin, start to settle. Fixed regardless of how fast the
 * server resolves the winner — a *slower* server just spins past it naturally
 * (see the "ran out of schedule" branch below), a fast one still gets the
 * full ceremony instead of skipping straight to a reveal.
 */
const SPIN_TOTAL_MS = 15000
/** Tick pace at the very start of the spin — fast enough to blur past. */
const SPIN_FAST_MS = 60
/** Tick pace once the spin has fully decelerated, right before it settles. */
const SPIN_SLOW_MS = 850

/**
 * Continuous easing from fast to slow across the whole spin — a single smooth
 * curve rather than distinct fast/medium/slow blocks, so the deceleration
 * reads as one continuous slowdown instead of stepped gear changes.
 */
function spinIntervalAt(elapsedMs: number): number {
  const p = Math.min(elapsedMs / SPIN_TOTAL_MS, 1)
  const eased = p * p * p
  return SPIN_FAST_MS + (SPIN_SLOW_MS - SPIN_FAST_MS) * eased
}

/** Precomputed tick delays covering the full spin — fixed and independent of the winner, so "how many ticks remain" is exact arithmetic, not a live measurement. */
function buildSpinSchedule(): number[] {
  const delays: number[] = []
  let elapsed = 0
  while (elapsed < SPIN_TOTAL_MS) {
    const delay = spinIntervalAt(elapsed)
    delays.push(delay)
    elapsed += delay
  }
  return delays
}

function mod(value: number, length: number): number {
  return ((value % length) + length) % length
}

interface LotAnimationProps {
  open: boolean
  cycleNumber: number
  amount: number
  hasEligibleMembers: boolean
  eligibleMembers: Member[]
  /** Null while the draw is still being decided — the shuffle keeps running until this arrives. */
  winner: Member | null
  /** Skip the intro/shuffle and jump straight to the reveal — used when the draw was already decided before this viewer opened the page. */
  skipSpin?: boolean
  /** Label for the single action shown after the reveal. Defaults to "Continue". */
  closeLabel?: string
  onClose: () => void
  /**
   * Admin-only escape hatches shown on the "no eligible members" dead end —
   * omitted for the public viewer, who can't act on either. Navigating away
   * and back re-triggers the lot automatically (a fresh mount re-attempts
   * `prepareLot`), so these don't need their own "retry" affordance.
   */
  onManagePayments?: () => void
  onManageMembers?: () => void
}

export function LotAnimation({
  open,
  cycleNumber,
  amount,
  hasEligibleMembers,
  eligibleMembers,
  winner,
  skipSpin = false,
  closeLabel = 'Continue',
  onClose,
  onManagePayments,
  onManageMembers,
}: LotAnimationProps) {
  const [phase, setPhase] = useState<Phase>('preparing')
  const [reel, setReel] = useState<{ id: number; name: string }[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const nextReelId = useRef(0)
  const reelTickMs = useRef(SPIN_FAST_MS)
  const winnerRef = useRef(winner)
  useEffect(() => {
    winnerRef.current = winner
  }, [winner])

  function seedReel(names: string[]) {
    nextReelId.current = 0
    setReel(
      Array.from({ length: REEL_SIZE }, (_, i) => ({
        id: nextReelId.current++,
        name: names[i % names.length] ?? '',
      })),
    )
  }

  function pushReelName(name: string) {
    setReel((prev) => [...prev.slice(1), { id: nextReelId.current++, name }])
  }

  function clearAll() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  // Mount/open sequence: preparing -> checking -> roster -> selecting.
  // Deliberately ignores later changes to `winner` — arriving mid-spin is
  // handled by the spin effect below, not by resetting this intro sequence.
  useEffect(() => {
    if (!open) return
    clearAll()

    if (!hasEligibleMembers) {
      setPhase('preparing')
      return
    }

    if (skipSpin && winner) {
      setPhase('revealed')
      return
    }

    setPhase('preparing')
    const rosterMs = rosterHoldMs(eligibleMembers.length)
    const t1 = setTimeout(() => setPhase('checking'), PREPARING_MS)
    const t2 = setTimeout(() => setPhase('roster'), PREPARING_MS + CHECKING_MS)
    const t3 = setTimeout(() => setPhase('selecting'), PREPARING_MS + CHECKING_MS + rosterMs)
    timers.current.push(t1, t2, t3)

    return clearAll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasEligibleMembers])

  // Runs the entire spin: a continuously decelerating round-robin cycle
  // through the eligible members (fixed cyclic order, never random, so no
  // two nearby rows repeat a name) lasting SPIN_TOTAL_MS. Once the winner is
  // known — usually within the first tick or two, since resolving it takes
  // far less than the spin itself — the cursor is realigned exactly once so
  // it keeps cycling in the same fixed order but now lands the winner in the
  // centre row precisely when the schedule runs out.
  useEffect(() => {
    if (phase !== 'selecting' || eligibleMembers.length === 0) return

    const names = eligibleMembers.map((m) => m.name)
    const n = names.length
    const schedule = buildSpinSchedule()
    const totalTicks = schedule.length

    let pushCursor = Math.floor(Math.random() * n)
    let recalibrated = false
    let cancelled = false

    seedReel(names)

    function push(index: number) {
      pushReelName(names[mod(index, n)])
    }

    function reveal() {
      const t = setTimeout(() => setPhase('revealed'), 500)
      timers.current.push(t)
    }

    // Fallback for a slow-resolving winner: the schedule ran out before it
    // arrived, so idle-spin (still fixed cyclic order) at the slowest pace
    // until it does, then settle straight onto it.
    function idleUntilWinner() {
      if (cancelled) return
      const winnerName = winnerRef.current
      const winnerIdx = winnerName ? names.indexOf(winnerName.name) : -1
      if (winnerIdx !== -1) {
        settleOnto(winnerIdx)
        return
      }
      push(pushCursor)
      pushCursor = mod(pushCursor + REEL_DIRECTION, n)
      reelTickMs.current = SPIN_SLOW_MS
      const t = setTimeout(idleUntilWinner, SPIN_SLOW_MS)
      timers.current.push(t)
    }

    // Pushes the guaranteed-correct tail — the winner, then exactly
    // REEL_CENTER more cyclic pushes — so it lands in the centre row.
    function settleOnto(winnerIdx: number) {
      let k = 0
      const step = () => {
        if (cancelled) return
        push(winnerIdx + REEL_DIRECTION * k)
        reelTickMs.current = SPIN_SLOW_MS
        if (k >= REEL_CENTER) {
          reveal()
          return
        }
        k++
        const t = setTimeout(step, SPIN_SLOW_MS)
        timers.current.push(t)
      }
      step()
    }

    function runScheduled(i: number) {
      if (cancelled) return
      const winnerName = winnerRef.current
      const winnerIdx = winnerName ? names.indexOf(winnerName.name) : -1

      if (i >= totalTicks) {
        idleUntilWinner()
        return
      }

      if (!recalibrated && winnerIdx !== -1) {
        // Exactly this many cyclic ticks remain after this one — align the
        // cursor so following them lands the winner in the centre row the
        // instant the schedule ends.
        const remaining = totalTicks - 1 - i
        pushCursor = mod(winnerIdx + REEL_DIRECTION * (REEL_CENTER - remaining), n)
        recalibrated = true
      }

      push(pushCursor)
      pushCursor = mod(pushCursor + REEL_DIRECTION, n)
      reelTickMs.current = schedule[i]

      if (i === totalTicks - 1) {
        reveal()
        return
      }

      const t = setTimeout(() => runScheduled(i + 1), schedule[i])
      timers.current.push(t)
    }

    runScheduled(0)

    return () => {
      cancelled = true
    }
  }, [phase, eligibleMembers])

  useEffect(() => clearAll, [])

  if (!open) return null

  const revealing = hasEligibleMembers && phase === 'revealed' && !!winner
  const showClose = revealing || !hasEligibleMembers

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-deep-navy text-soft-white">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <p className="text-sm font-semibold text-cool-gray">Cycle #{cycleNumber}</p>
        {showClose ? (
          <button onClick={onClose} className="text-sm font-semibold text-cool-gray hover:text-soft-white">
            Close
          </button>
        ) : (
          <span />
        )}
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Full-viewport-width burst, independent of the (narrower) content column below it. */}
        {revealing && <Confetti count={48} />}

        <AnimatePresence mode="wait">
          {!hasEligibleMembers && (
            <motion.div key="none" {...fade} className="flex flex-col items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-midnight">
                <UserX className="size-8 text-cool-gray" />
              </div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">Lot cannot start</h2>
              <p className="max-w-xs text-cool-gray sm:max-w-sm sm:text-lg">
                No eligible members. All active members either have pending payments or have
                already won a previous cycle.
              </p>
              {(onManagePayments || onManageMembers) && (
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  {onManagePayments && (
                    <Button variant="secondary" onClick={onManagePayments}>
                      Manage Payments
                    </Button>
                  )}
                  {onManageMembers && (
                    <Button variant="secondary" onClick={onManageMembers}>
                      Manage Members
                    </Button>
                  )}
                </div>
              )}
              <Button variant="secondary" onClick={onClose} className="mt-1">
                Close
              </Button>
            </motion.div>
          )}

          {hasEligibleMembers && phase === 'preparing' && (
            <motion.div key="preparing" {...fade} className="flex flex-col items-center gap-4">
              <Spinner />
              <h2 className="text-xl font-bold sm:text-2xl">Preparing the lot…</h2>
            </motion.div>
          )}

          {hasEligibleMembers && phase === 'checking' && (
            <motion.div key="checking" {...fade} className="flex flex-col items-center gap-4">
              <Spinner />
              <h2 className="text-xl font-bold sm:text-2xl">Checking eligible members…</h2>
              <p className="text-cool-gray sm:text-lg">{eligibleMembers.length} members eligible</p>
            </motion.div>
          )}

          {hasEligibleMembers && phase === 'roster' && (
            <motion.div key="roster" {...fade} className="flex w-full max-w-md flex-col items-center gap-4">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-bright-blue sm:text-base">
                <Users className="size-4" /> {eligibleMembers.length} eligible for this cycle
              </p>
              <div className="grid max-h-72 w-full grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {eligibleMembers.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.035, duration: 0.18 }}
                    className="truncate rounded-xl bg-midnight px-3 py-2 text-sm font-semibold"
                  >
                    {member.name}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {hasEligibleMembers && phase === 'selecting' && (
            <motion.div key="selecting" {...fade} className="flex flex-col items-center gap-6">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-bright-blue sm:text-base">
                <Sparkles className="size-4" /> Selecting · {eligibleMembers.length} eligible
              </p>
              <LotReel reel={reel} tickMs={reelTickMs.current} />
            </motion.div>
          )}

          {revealing && winner && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 16, stiffness: 220 }}
              className="relative flex flex-col items-center gap-3"
            >
              <PartyPopper className="size-8 text-warning-400 sm:size-10" />
              <p className="text-sm font-bold uppercase tracking-widest text-cool-gray sm:text-base">
                We have a winner
              </p>
              <h2 className="text-5xl font-extrabold tracking-tight sm:text-6xl">{winner.name}</h2>
              <p className="text-cool-gray sm:text-lg">Cycle #{cycleNumber}</p>
              <p className="mt-1 text-2xl font-bold text-bright-blue sm:text-3xl">{formatCurrency(amount)}</p>

              <Button size="lg" className="mt-6" onClick={onClose}>
                {closeLabel}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25 },
}

function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
      className="size-10 rounded-full border-2 border-midnight border-t-bright-blue"
    />
  )
}

/** How much a row shrinks and fades as it moves away from the centre row. */
function reelRowStyle(offset: number) {
  const distance = Math.abs(offset)
  if (distance === 0) return { opacity: 1, scale: 1, weight: 800, color: 'text-soft-white' }
  if (distance === 1) return { opacity: 0.6, scale: 0.76, weight: 700, color: 'text-cool-gray' }
  if (distance === 2) return { opacity: 0.32, scale: 0.58, weight: 600, color: 'text-cool-gray' }
  return { opacity: 0.14, scale: 0.46, weight: 600, color: 'text-cool-gray' }
}

/** Vertical name reel for the lot draw — a column of rows sliding upward, with the winner settling into the glowing centre row. */
function LotReel({ reel, tickMs }: { reel: { id: number; name: string }[]; tickMs: number }) {
  return (
    <div
      className="relative h-72 w-64 overflow-hidden sm:h-80 sm:w-80"
      style={{
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 22%, black 78%, transparent)',
        maskImage: 'linear-gradient(to bottom, transparent, black 22%, black 78%, transparent)',
      }}
    >
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        className="absolute inset-x-6 top-1/2 h-14 -translate-y-1/2 rounded-2xl bg-bright-blue/25 blur-2xl sm:h-16"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {reel.map((row, i) => {
          const offset = i - REEL_CENTER
          const style = reelRowStyle(offset)
          return (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 44 }}
              animate={{ opacity: style.opacity, y: 0, scale: style.scale }}
              transition={{ duration: Math.min(tickMs, 260) / 1000, ease: 'easeOut' }}
              className={`flex h-12 w-full items-center justify-center px-2 text-3xl tracking-tight sm:h-14 sm:text-4xl ${style.color}`}
              style={{ fontWeight: style.weight }}
            >
              <span className="truncate">{row.name}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
