import type { Config } from '@netlify/functions'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import type { Chitti, Cycle, Member, Payment } from '../../src/types'
import { getEligibility } from '../../src/services/auction/eligibility'
import { selectLotWinner } from '../../src/services/auction/selectWinner'
import { addCyclePeriod } from '../../src/utils/date'

// Server-side backstop for src/hooks/useLotAutoTrigger.ts (decide) and
// src/pages/Admin/Lot.tsx (confirm): both only ever fire from a browser tab
// that happens to be open at the right moment, so a chitti nobody is looking
// at just sits undrawn, or drawn-but-never-finalized (blocking the next cycle
// and never showing up in history) indefinitely. This runs on a schedule
// regardless of who's online — whether the decision came from an admin, an
// external viewer's link, or this function's own earlier run — and drives
// every active chitti's current cycle through decide -> finalize.
function cycleIdFor(cycleNumber: number): string {
  return `cycle-${cycleNumber}`
}

function adminDb(): Firestore {
  if (!getApps().length) {
    const encoded = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!encoded) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT env var')
    const serviceAccount = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'))
    initializeApp({ credential: cert(serviceAccount) })
  }
  return getFirestore()
}

/**
 * Admin-SDK port of confirmWinner + seedNextCyclePayments from
 * src/services/chitti/lot.ts: marks the winner, completes the cycle,
 * provisions the next one (or completes the chitti), and seeds its payments.
 */
async function confirmWinnerAdmin(db: Firestore, chittiId: string, cycleId: string): Promise<void> {
  await db.runTransaction(async (tx) => {
    const chittiRef = db.doc(`chittis/${chittiId}`)
    const cycleRef = db.doc(`chittis/${chittiId}/cycles/${cycleId}`)
    const chittiSnap = await tx.get(chittiRef)
    const cycleSnap = await tx.get(cycleRef)
    const chitti = chittiSnap.data() as Chitti | undefined
    const cycle = cycleSnap.data() as Cycle | undefined
    if (!chitti || !cycle) return
    if (cycle.status === 'completed') return
    if (!cycle.winnerId) return

    const winnerRef = db.doc(`chittis/${chittiId}/members/${cycle.winnerId}`)
    const winnerSnap = await tx.get(winnerRef)
    if (!winnerSnap.exists) return

    const now = new Date().toISOString()
    tx.update(cycleRef, { status: 'completed', completedAt: now })
    tx.update(winnerRef, { hasWon: true, wonCycle: cycle.cycleNumber })

    const isLastCycle = cycle.cycleNumber >= chitti.totalCycles
    if (isLastCycle) {
      tx.update(chittiRef, { status: 'completed', updatedAt: now })
      return
    }

    const nextCycleNumber = cycle.cycleNumber + 1
    const nextCycleRef = db.doc(`chittis/${chittiId}/cycles/${cycleIdFor(nextCycleNumber)}`)
    tx.set(nextCycleRef, {
      cycleNumber: nextCycleNumber,
      auctionAt: addCyclePeriod(cycle.auctionAt, chitti.duration),
      paymentDeadline: addCyclePeriod(cycle.paymentDeadline, chitti.duration),
      status: 'active',
      winnerId: null,
      selectionMethod: chitti.selectionMethod,
      completedAt: null,
    })
    tx.update(chittiRef, { currentCycle: nextCycleNumber, updatedAt: now })
  })

  const chittiSnap = await db.doc(`chittis/${chittiId}`).get()
  const chitti = chittiSnap.data() as Chitti | undefined
  if (!chitti || chitti.status === 'completed') return
  const completedCycleSnap = await db.doc(`chittis/${chittiId}/cycles/${cycleId}`).get()
  const completedCycle = completedCycleSnap.data() as Cycle | undefined
  if (!completedCycle || completedCycle.status !== 'completed') return

  const nextCycleId = cycleIdFor(completedCycle.cycleNumber + 1)
  const membersSnap = await db.collection(`chittis/${chittiId}/members`).get()
  const activeMembers = membersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Member)
    .filter((m) => m.status === 'active')

  const batch = db.batch()
  for (const member of activeMembers) {
    batch.set(db.doc(`chittis/${chittiId}/cycles/${nextCycleId}/payments/${member.id}`), {
      memberId: member.id,
      amount: chitti.amount,
      status: 'pending',
      paidAt: null,
    })
  }
  await batch.commit()
}

type Outcome = 'drawn' | 'confirmed' | 'no_eligible_members' | 'already_completed' | 'not_due' | 'no_active_cycle'

async function runDueLot(db: Firestore, chitti: Chitti): Promise<Outcome> {
  const cycleId = cycleIdFor(chitti.currentCycle)
  const cycleRef = db.doc(`chittis/${chitti.id}/cycles/${cycleId}`)
  const cycleSnap = await cycleRef.get()
  const cycle = cycleSnap.data() as Cycle | undefined
  if (!cycle) return 'no_active_cycle'
  if (cycle.status === 'completed') return 'already_completed'

  if (cycle.winnerId) {
    // Decided (by this function's own earlier run, an admin, or an external
    // viewer's page) but never finalized — finish the job so the next cycle
    // isn't stuck waiting on someone to open the admin Lot page, and this
    // one actually shows up in history.
    await confirmWinnerAdmin(db, chitti.id, cycleId)
    return 'confirmed'
  }

  if (cycle.status !== 'active') return 'no_active_cycle'
  if (new Date(cycle.auctionAt).getTime() > Date.now()) return 'not_due'

  const [membersSnap, paymentsSnap] = await Promise.all([
    db.collection(`chittis/${chitti.id}/members`).get(),
    db.collection(`chittis/${chitti.id}/cycles/${cycleId}/payments`).get(),
  ])
  const members = membersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Member)
  const payments = paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment)

  const eligibleMembers = getEligibility(members, payments)
    .filter((r) => r.eligible)
    .map((r) => r.member)
  if (eligibleMembers.length === 0) return 'no_eligible_members'

  const winner = selectLotWinner(eligibleMembers)

  // Re-checked inside the transaction in case a client tab's own
  // useLotAutoTrigger call (or a concurrent run of this function) won the
  // race in between the read above and now.
  await db.runTransaction(async (tx) => {
    const freshSnap = await tx.get(cycleRef)
    const fresh = freshSnap.data() as Cycle | undefined
    if (!fresh || fresh.winnerId) return
    tx.update(cycleRef, { status: 'lot_pending', winnerId: winner?.id ?? null })
  })

  await confirmWinnerAdmin(db, chitti.id, cycleId)
  return 'drawn'
}

export default async (): Promise<Response> => {
  const db = adminDb()
  const chittisSnap = await db.collection('chittis').where('status', '==', 'active').get()
  const chittis = chittisSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Chitti)

  const results = await Promise.all(
    chittis.map(async (chitti) => {
      try {
        return { chittiId: chitti.id, outcome: await runDueLot(db, chitti) }
      } catch (err) {
        return { chittiId: chitti.id, outcome: 'error' as const, error: String(err) }
      }
    }),
  )

  const drawn = results.filter((r) => r.outcome === 'drawn' || r.outcome === 'confirmed').length
  console.log(`run-due-lots: checked ${chittis.length} active chitti(s), advanced ${drawn} cycle(s)`, results)

  return new Response(JSON.stringify({ checked: chittis.length, drawn, results }), {
    headers: { 'content-type': 'application/json' },
  })
}

export const config: Config = {
  // Every minute — matches the second-level precision the client's own
  // countdown implies, within a scheduled function's minute-level cron grain.
  schedule: '* * * * *',
}
