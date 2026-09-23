import {
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import type { Chitti, CreateChittiInput, CreateMemberInput } from '@/types'
import { db } from '@/services/firebase/config'
import { chittiDoc, chittisCol, cyclesCol, membersCol, paymentDoc, paymentsCol } from '@/services/firebase/paths'

export const FIRST_CYCLE_ID = 'cycle-1'

export function subscribeToChittis(
  onData: (chittis: Chitti[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(chittisCol(), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err as Error),
  )
}

export function subscribeToChitti(
  chittiId: string,
  onData: (chitti: Chitti | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    chittiDoc(chittiId),
    (snap) => onData(snap.exists() ? snap.data() : null),
    (err) => onError?.(err as Error),
  )
}

export async function getChittiOnce(chittiId: string): Promise<Chitti | null> {
  const snap = await getDoc(chittiDoc(chittiId))
  return snap.exists() ? snap.data() : null
}

interface CreateChittiPayload {
  chitti: CreateChittiInput
  members: CreateMemberInput[]
  paymentDeadline: string
  auctionAt: string
}

/**
 * Creates a chitti along with its members and the first cycle (with a
 * pending payment record per member) in one transaction, so a partially
 * written chitti never becomes visible to listeners.
 */
export async function createChittiWithMembers(payload: CreateChittiPayload): Promise<string> {
  const chittiRef = doc(chittisCol())
  const now = new Date().toISOString()
  const memberRefs = payload.members.map(() => doc(membersCol(chittiRef.id)))

  await runTransaction(db, async (tx) => {
    const chitti: Chitti = {
      id: chittiRef.id,
      ...payload.chitti,
      currentCycle: 1,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }
    tx.set(chittiRef, chitti)

    payload.members.forEach((member, i) => {
      const memberRef = memberRefs[i]
      tx.set(memberRef, {
        id: memberRef.id,
        name: member.name,
        phone: member.phone,
        status: 'active',
        hasWon: false,
        wonCycle: null,
        createdAt: now,
      })

      const paymentRef = paymentDoc(chittiRef.id, FIRST_CYCLE_ID, memberRef.id)
      tx.set(paymentRef, {
        id: memberRef.id,
        memberId: memberRef.id,
        amount: payload.chitti.amount,
        status: 'pending',
        paidAt: null,
      })
    })

    const cycleRef = doc(chittiRef, 'cycles', FIRST_CYCLE_ID)
    tx.set(cycleRef, {
      id: FIRST_CYCLE_ID,
      cycleNumber: 1,
      auctionAt: payload.auctionAt,
      paymentDeadline: payload.paymentDeadline,
      status: 'active',
      winnerId: null,
      selectionMethod: payload.chitti.selectionMethod,
      completedAt: null,
    })
  })

  return chittiRef.id
}

export async function updateChitti(chittiId: string, patch: Partial<Chitti>): Promise<void> {
  await updateDoc(chittiDoc(chittiId), { ...patch, updatedAt: new Date().toISOString() })
}

/**
 * Deletes a chitti along with every subcollection doc under it (members,
 * cycles, and each cycle's payments) — Firestore doesn't cascade-delete
 * subcollections on its own, so each one is enumerated and batched
 * explicitly. Irreversible; the caller is responsible for confirming with
 * the admin first.
 */
export async function deleteChitti(chittiId: string): Promise<void> {
  const batch = writeBatch(db)

  const cyclesSnap = await getDocs(cyclesCol(chittiId))
  for (const cycle of cyclesSnap.docs) {
    const paymentsSnap = await getDocs(paymentsCol(chittiId, cycle.id))
    paymentsSnap.docs.forEach((payment) => batch.delete(payment.ref))
    batch.delete(cycle.ref)
  }

  const membersSnap = await getDocs(membersCol(chittiId))
  membersSnap.docs.forEach((member) => batch.delete(member.ref))

  batch.delete(chittiDoc(chittiId))

  await batch.commit()
}
