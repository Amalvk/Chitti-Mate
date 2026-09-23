import { onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import type { Payment } from '@/types'
import { paymentDoc, paymentsCol } from '@/services/firebase/paths'

export function subscribeToPayments(
  chittiId: string,
  cycleId: string,
  onData: (payments: Payment[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(paymentsCol(chittiId, cycleId), orderBy('memberId', 'asc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err as Error),
  )
}

export async function markPaymentPaid(
  chittiId: string,
  cycleId: string,
  memberId: string,
): Promise<void> {
  await updateDoc(paymentDoc(chittiId, cycleId, memberId), {
    status: 'paid',
    paidAt: new Date().toISOString(),
  })
}

export async function markPaymentPending(
  chittiId: string,
  cycleId: string,
  memberId: string,
): Promise<void> {
  await updateDoc(paymentDoc(chittiId, cycleId, memberId), {
    status: 'pending',
    paidAt: null,
  })
}
