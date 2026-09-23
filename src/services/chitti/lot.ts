import { doc, getDoc, getDocs, runTransaction, writeBatch } from 'firebase/firestore'
import type { Chitti, Cycle, Member } from '@/types'
import { getEligibility } from '@/services/auction/eligibility'
import { selectLotWinner } from '@/services/auction/selectWinner'
import { db } from '@/services/firebase/config'
import { chittiDoc, cycleDoc, membersCol, paymentsCol } from '@/services/firebase/paths'
import { addCyclePeriod } from '@/utils/date'

export function cycleIdFor(cycleNumber: number): string {
  return `cycle-${cycleNumber}`
}

export interface PrepareLotResult {
  status: 'no_eligible_members' | 'ready'
  winnerId: string | null
  eligibleMembers: Member[]
  allMembers: Member[]
}

/**
 * Determines and PERSISTS the lot winner before any reveal animation plays.
 * Idempotent: if the cycle already has a winnerId (e.g. a second tab already
 * ran the lot), that persisted winner is returned unchanged rather than
 * re-rolled, so the animation always reveals the one authoritative result.
 */
export async function prepareLot(chittiId: string, cycleId: string): Promise<PrepareLotResult> {
  const [membersSnap, paymentsSnap, cycleSnap] = await Promise.all([
    getDocs(membersCol(chittiId)),
    getDocs(paymentsCol(chittiId, cycleId)),
    getDoc(cycleDoc(chittiId, cycleId)),
  ])

  const allMembers = membersSnap.docs.map((d) => d.data())
  const payments = paymentsSnap.docs.map((d) => d.data())
  const cycle = cycleSnap.data()
  if (!cycle) throw new Error('Cycle not found')

  if (cycle.winnerId) {
    const eligibleMembers = getEligibility(allMembers, payments)
      .filter((r) => r.eligible)
      .map((r) => r.member)
    return { status: 'ready', winnerId: cycle.winnerId, eligibleMembers, allMembers }
  }

  const eligibility = getEligibility(allMembers, payments)
  const eligibleMembers = eligibility.filter((r) => r.eligible).map((r) => r.member)

  if (eligibleMembers.length === 0) {
    return { status: 'no_eligible_members', winnerId: null, eligibleMembers: [], allMembers }
  }

  const winner = selectLotWinner(eligibleMembers)

  const winnerId = await runTransaction(db, async (tx) => {
    const freshSnap = await tx.get(cycleDoc(chittiId, cycleId))
    const fresh = freshSnap.data()
    if (!fresh) throw new Error('Cycle not found')
    if (fresh.winnerId) return fresh.winnerId

    tx.update(cycleDoc(chittiId, cycleId), {
      status: 'lot_pending',
      winnerId: winner?.id ?? null,
    })
    return winner?.id ?? null
  })

  return { status: 'ready', winnerId, eligibleMembers, allMembers }
}

/**
 * Finalizes the cycle after admin confirmation: marks the member as a
 * winner, completes the cycle, and provisions the next cycle (or marks the
 * chitti completed when there are no cycles left).
 */
export async function confirmWinner(chittiId: string, cycleId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const chittiSnap = await tx.get(chittiDoc(chittiId))
    const cycleSnap = await tx.get(cycleDoc(chittiId, cycleId))
    const chitti = chittiSnap.data()
    const cycle = cycleSnap.data()
    if (!chitti || !cycle) throw new Error('Chitti or cycle not found')
    if (cycle.status === 'completed') return
    if (!cycle.winnerId) throw new Error('No winner to confirm')

    const winnerRef = doc(membersCol(chittiId), cycle.winnerId)
    const winnerSnap = await tx.get(winnerRef)
    const winner = winnerSnap.data()
    if (!winner) throw new Error('Winner member not found')

    const now = new Date().toISOString()

    tx.update(cycleDoc(chittiId, cycleId), {
      status: 'completed',
      completedAt: now,
    })

    tx.update(winnerRef, {
      hasWon: true,
      wonCycle: cycle.cycleNumber,
    })

    const isLastCycle = cycle.cycleNumber >= chitti.totalCycles
    if (isLastCycle) {
      tx.update(chittiDoc(chittiId), {
        status: 'completed',
        updatedAt: now,
      })
      return
    }

    const nextCycleNumber = cycle.cycleNumber + 1
    const nextCycle: Cycle = {
      id: cycleIdFor(nextCycleNumber),
      cycleNumber: nextCycleNumber,
      auctionAt: addCyclePeriod(cycle.auctionAt, chitti.duration),
      paymentDeadline: addCyclePeriod(cycle.paymentDeadline, chitti.duration),
      status: 'active',
      winnerId: null,
      selectionMethod: chitti.selectionMethod,
      completedAt: null,
    }
    tx.set(cycleDoc(chittiId, nextCycle.id), nextCycle)

    tx.update(chittiDoc(chittiId), {
      currentCycle: nextCycleNumber,
      updatedAt: now,
    })
  })

  await seedNextCyclePayments(chittiId, cycleId)
}

/** Payment docs for the next cycle are seeded outside the transaction (one write per member). */
async function seedNextCyclePayments(chittiId: string, completedCycleId: string): Promise<void> {
  const [membersSnap, cycleSnap] = await Promise.all([
    getDocs(membersCol(chittiId)),
    getDoc(cycleDoc(chittiId, completedCycleId)),
  ])
  const completedCycle = cycleSnap.data()
  if (!completedCycle) return

  const chittiSnap = await getDoc(chittiDoc(chittiId))
  const chitti = chittiSnap.data() as Chitti | undefined
  if (!chitti || chitti.status === 'completed') return

  const nextCycleId = cycleIdFor(completedCycle.cycleNumber + 1)
  const activeMembers = membersSnap.docs.map((d) => d.data()).filter((m) => m.status === 'active')

  const batch = writeBatch(db)
  for (const member of activeMembers) {
    const ref = doc(paymentsCol(chittiId, nextCycleId), member.id)
    batch.set(ref, {
      id: member.id,
      memberId: member.id,
      amount: chitti.amount,
      status: 'pending',
      paidAt: null,
    })
  }
  await batch.commit()
}
