import { onSnapshot, orderBy, query } from 'firebase/firestore'
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
