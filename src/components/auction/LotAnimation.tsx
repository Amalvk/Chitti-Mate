import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PartyPopper, Sparkles, UserX } from 'lucide-react'
import type { Member } from '@/types'
import { formatCurrency } from '@/utils/currency'
import { Button } from '@/components/ui/Button'
import { Confetti } from './Confetti'

type Phase = 'preparing' | 'checking' | 'selecting' | 'locking' | 'revealed'

const SHUFFLE_INTERVAL_MS = 90
/** Decelerating lock-in run once a winner is known, before settling on their name — long enough to feel like a real draw, not a coin flip. */
const LOCK_IN_DELAYS = [100, 130, 170, 220, 280, 360, 460, 580, 720]

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
}: LotAnimationProps) {
  const [phase, setPhase] = useState<Phase>('preparing')
  const [spinName, setSpinName] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const shuffleInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearAll() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (shuffleInterval.current) {
      clearInterval(shuffleInterval.current)
      shuffleInterval.current = null
    }
  }

  // Mount/open sequence: preparing -> checking -> selecting. Deliberately
  // ignores later changes to `winner` — arriving mid-shuffle is handled by
  // the lock-in effect below, not by resetting this intro sequence.
  useEffect(() => {
    if (!open) return
    clearAll()

    if (!hasEligibleMembers) {
      setPhase('preparing')
      return
    }

    if (skipSpin && winner) {
      setPhase('revealed')
      setSpinName(winner.name)
      return
    }

    setPhase('preparing')
    const t1 = setTimeout(() => setPhase('checking'), 1500)
    const t2 = setTimeout(() => setPhase('selecting'), 3000)
    timers.current.push(t1, t2)

    return clearAll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasEligibleMembers])

  // While selecting with no winner decided yet, shuffle names indefinitely —
  // this is the "lot is live" state a viewer can watch for as long as it takes.
  useEffect(() => {
    if (phase !== 'selecting' || winner || eligibleMembers.length === 0) return

    const names = eligibleMembers.map((m) => m.name)
    shuffleInterval.current = setInterval(() => {
      setSpinName(names[Math.floor(Math.random() * names.length)])
    }, SHUFFLE_INTERVAL_MS)

    return () => {
      if (shuffleInterval.current) {
        clearInterval(shuffleInterval.current)
        shuffleInterval.current = null
      }
    }
  }, [phase, winner, eligibleMembers])

  // The winner became known (this tab's own call resolved, or another
  // viewer's did) — stop shuffling and decelerate into the reveal.
  useEffect(() => {
    if (!winner || phase !== 'selecting') return
    if (shuffleInterval.current) {
      clearInterval(shuffleInterval.current)
      shuffleInterval.current = null
    }

    setPhase('locking')
    const names = eligibleMembers.length > 0 ? eligibleMembers.map((m) => m.name) : [winner.name]
    const runLockIn = (step: number) => {
      if (step >= LOCK_IN_DELAYS.length) {
        setSpinName(winner.name)
        const reveal = setTimeout(() => setPhase('revealed'), 700)
        timers.current.push(reveal)
        return
      }
      setSpinName(names[Math.floor(Math.random() * names.length)])
      const t = setTimeout(() => runLockIn(step + 1), LOCK_IN_DELAYS[step])
      timers.current.push(t)
    }
    runLockIn(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, phase])

  useEffect(() => clearAll, [])

  if (!open) return null

  const revealing = hasEligibleMembers && phase === 'revealed' && !!winner
  const showClose = revealing || !hasEligibleMembers

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-950 text-white">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <p className="text-sm font-semibold text-white/60">Cycle #{cycleNumber}</p>
        {showClose ? (
          <button onClick={onClose} className="text-sm font-semibold text-white/70 hover:text-white">
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
              <div className="flex size-16 items-center justify-center rounded-full bg-white/10">
                <UserX className="size-8 text-white/70" />
              </div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">Lot cannot start</h2>
              <p className="max-w-xs text-white/60 sm:max-w-sm sm:text-lg">
                No eligible members. All active members either have pending payments or have
                already won a previous cycle.
              </p>
              <Button variant="secondary" onClick={onClose} className="mt-2">
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
              <p className="text-white/60 sm:text-lg">{eligibleMembers.length} members eligible</p>
            </motion.div>
          )}

          {hasEligibleMembers && (phase === 'selecting' || phase === 'locking') && (
            <motion.div key="selecting" {...fade} className="flex flex-col items-center gap-6">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-300 sm:text-base">
                <Sparkles className="size-4" /> Selecting · {eligibleMembers.length} eligible
              </p>
              <div className="relative flex size-40 items-center justify-center sm:size-48">
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full bg-brand-500/20 blur-xl"
                />
                <motion.p
                  key={spinName}
                  initial={{ opacity: 0.3, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative px-2 text-4xl font-extrabold tracking-tight sm:text-5xl"
                >
                  {spinName || '—'}
                </motion.p>
              </div>
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
              <p className="text-sm font-bold uppercase tracking-widest text-white/60 sm:text-base">
                We have a winner
              </p>
              <h2 className="text-5xl font-extrabold tracking-tight sm:text-6xl">{winner.name}</h2>
              <p className="text-white/60 sm:text-lg">Cycle #{cycleNumber}</p>
              <p className="mt-1 text-2xl font-bold text-brand-300 sm:text-3xl">{formatCurrency(amount)}</p>

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
      className="size-10 rounded-full border-2 border-white/20 border-t-white"
    />
  )
}
