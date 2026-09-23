import { doc, getDoc, writeBatch } from 'firebase/firestore'
import type { Chitti, Cycle, Member, Payment } from '@/types'
import { db } from '@/services/firebase/config'
import { chittiDoc, chittisCol, membersCol, paymentsCol } from '@/services/firebase/paths'
import { cycleIdFor } from '@/services/chitti/lot'

export const DEMO_CHITTI_ID = 'demo-family-chitti'

const DEMO_MEMBER_NAMES = [
  'Rahul',
  'Arun',
  'Vishnu',
  'Amal',
  'Sree',
  'Manu',
  'Nikhil',
  'Ajay',
  'Rakesh',
  'Hari',
]

/** Winner of each completed cycle, by member name. */
const PAST_WINNERS = ['Rahul', 'Vishnu', 'Sree']

/** Members whose current-cycle payment is still pending, for a realistic mixed state. */
const PENDING_PAYERS = new Set(['Rakesh', 'Hari'])

function monthsAgo(n: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d
}

function fakePhone(index: number): string {
  return `9${String(700000000 + index * 7823).slice(0, 9)}`
}

/**
 * Seeds a realistic demo chitti (10 members, 10 cycles, 3 completed) once,
 * so the app looks alive on first visit. No-ops if it already exists.
 */
export async function ensureDemoData(): Promise<string> {
  const existing = await getDoc(chittiDoc(DEMO_CHITTI_ID))
  if (existing.exists()) return DEMO_CHITTI_ID

  const chittiRef = doc(chittisCol(), DEMO_CHITTI_ID)
  const now = new Date()
  const nowIso = now.toISOString()

  const memberRefs = DEMO_MEMBER_NAMES.map(() => doc(membersCol(chittiRef.id)))
  const idByName = new Map(DEMO_MEMBER_NAMES.map((name, i) => [name, memberRefs[i].id]))

  const currentCycleNumber = PAST_WINNERS.length + 1
  const totalCycles = 10

  const chitti: Chitti = {
    id: chittiRef.id,
    name: 'Family Chitti',
    amount: 5000,
    commission: 500,
    duration: 'monthly',
    totalMembers: DEMO_MEMBER_NAMES.length,
    totalCycles,
    startDate: monthsAgo(PAST_WINNERS.length).toISOString(),
    selectionMethod: 'lot',
    currentCycle: currentCycleNumber,
    status: 'active',
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  const batch = writeBatch(db)
  batch.set(chittiRef, chitti)

  DEMO_MEMBER_NAMES.forEach((name, i) => {
    const wonCycleIndex = PAST_WINNERS.indexOf(name)
    const member: Member = {
      id: memberRefs[i].id,
      name,
      phone: fakePhone(i),
      status: 'active',
      hasWon: wonCycleIndex !== -1,
      wonCycle: wonCycleIndex !== -1 ? wonCycleIndex + 1 : null,
      createdAt: monthsAgo(PAST_WINNERS.length).toISOString(),
    }
    batch.set(memberRefs[i], member)
  })

  PAST_WINNERS.forEach((winnerName, i) => {
    const cycleNumber = i + 1
    const auctionAt = monthsAgo(PAST_WINNERS.length - cycleNumber + 1)
    const cycle: Cycle = {
      id: cycleIdFor(cycleNumber),
      cycleNumber,
      auctionAt: auctionAt.toISOString(),
      paymentDeadline: new Date(auctionAt.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      winnerId: idByName.get(winnerName) ?? null,
      selectionMethod: 'lot',
      completedAt: auctionAt.toISOString(),
    }
    batch.set(doc(chittiRef, 'cycles', cycle.id), cycle)
  })

  const currentAuctionAt = new Date(now.getTime() + 45 * 60 * 1000)
  const currentDeadline = new Date(now.getTime() + 20 * 60 * 1000)
  const currentCycle: Cycle = {
    id: cycleIdFor(currentCycleNumber),
    cycleNumber: currentCycleNumber,
    auctionAt: currentAuctionAt.toISOString(),
    paymentDeadline: currentDeadline.toISOString(),
    status: 'active',
    winnerId: null,
    selectionMethod: 'lot',
    completedAt: null,
  }
  batch.set(doc(chittiRef, 'cycles', currentCycle.id), currentCycle)

  DEMO_MEMBER_NAMES.forEach((name) => {
    const memberId = idByName.get(name)!
    const isPending = PENDING_PAYERS.has(name)
    const payment: Payment = {
      id: memberId,
      memberId,
      amount: chitti.amount,
      status: isPending ? 'pending' : 'paid',
      paidAt: isPending ? null : new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    }
    batch.set(doc(paymentsCol(chittiRef.id, currentCycle.id), memberId), payment)
  })

  await batch.commit()
  return chittiRef.id
}
