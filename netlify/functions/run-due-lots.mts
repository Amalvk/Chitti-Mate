import type { Config } from '@netlify/functions'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import type { Chitti, Cycle, Member, Payment } from '../../src/types'
import { getEligibility } from '../../src/services/auction/eligibility'
import { selectLotWinner } from '../../src/services/auction/selectWinner'

// Server-side backstop for src/hooks/useLotAutoTrigger.ts: that hook only ever
// fires from a browser tab that happens to be open past a cycle's auction
// time, so a chitti nobody is looking at when the clock hits zero just sits
// there undrawn. This runs on a schedule regardless of who's online and
// performs the same idempotent "decide and persist the winner" step, so the
// lot always resolves at auction time. Confirming the winner (see
// confirmWinner in src/services/chitti/lot.ts) stays a manual admin action.
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

type Outcome = 'drawn' | 'no_eligible_members' | 'already_decided' | 'not_due' | 'no_active_cycle'

async function runDueLot(db: Firestore, chitti: Chitti): Promise<Outcome> {
  const cycleId = cycleIdFor(chitti.currentCycle)
  const cycleRef = db.doc(`chittis/${chitti.id}/cycles/${cycleId}`)
  const cycleSnap = await cycleRef.get()
  const cycle = cycleSnap.data() as Cycle | undefined
  if (!cycle || cycle.status !== 'active') return 'no_active_cycle'
  if (cycle.winnerId) return 'already_decided'
  if (new Date(cycle.auctionAt).getTime() > Date.now()) return 'not_due'

  const [membersSnap, paymentsSnap] = await Promise.all([
    db.collection(`chittis/${chitti.id}/members`).get(),
    db.collection(`chittis/${chitti.id}/cycles/${cycleId}/payments`).get(),
  ])
  const members = membersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Member)
  const payments = paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment)

  const eligibleMembers = getEligibility(members, payments, cycle)
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

  const drawn = results.filter((r) => r.outcome === 'drawn').length
  console.log(`run-due-lots: checked ${chittis.length} active chitti(s), drew ${drawn} lot(s)`, results)

  return new Response(JSON.stringify({ checked: chittis.length, drawn, results }), {
    headers: { 'content-type': 'application/json' },
  })
}

export const config: Config = {
  // Every minute — matches the second-level precision the client's own
  // countdown implies, within a scheduled function's minute-level cron grain.
  schedule: '* * * * *',
}
