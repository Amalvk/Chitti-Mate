import { getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import type { Cycle } from '@/types'
import { cycleDoc, cyclesCol } from '@/services/firebase/paths'

export function subscribeToCycles(
  chittiId: string,
  onData: (cycles: Cycle[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(cyclesCol(chittiId), orderBy('cycleNumber', 'asc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err as Error),
  )
}

export function subscribeToCycle(
  chittiId: string,
  cycleId: string,
  onData: (cycle: Cycle | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    cycleDoc(chittiId, cycleId),
    (snap) => onData(snap.exists() ? snap.data() : null),
    (err) => onError?.(err as Error),
  )
}

/**
 * Reschedules a not-yet-completed cycle's auction date/payment deadline.
 * Refused once the cycle is completed — its payout and winner are already
 * locked in by then, so the schedule that produced them shouldn't move.
 */
export async function updateCycleSchedule(
  chittiId: string,
  cycleId: string,
  updates: { auctionAt: string; paymentDeadline: string },
): Promise<void> {
  const snap = await getDoc(cycleDoc(chittiId, cycleId))
  const cycle = snap.data()
  if (!cycle) throw new Error('Cycle not found')
  if (cycle.status === 'completed') throw new Error('Cannot edit a completed cycle')
  await updateDoc(cycleDoc(chittiId, cycleId), updates)
}
