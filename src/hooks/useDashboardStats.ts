import { useEffect, useState } from 'react'
import { getDocs } from 'firebase/firestore'
import type { Chitti } from '@/types'
import { cycleIdFor } from '@/services/chitti/lot'
import { membersCol, paymentsCol } from '@/services/firebase/paths'

export interface DashboardStats {
  activeChittis: number
  totalMembers: number
  pendingPayments: number
  completedCycles: number
}

const EMPTY: DashboardStats = {
  activeChittis: 0,
  totalMembers: 0,
  pendingPayments: 0,
  completedCycles: 0,
}

export function useDashboardStats(chittis: Chitti[]) {
  const [stats, setStats] = useState<DashboardStats>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const results = await Promise.all(
        chittis.map(async (chitti) => {
          const [membersSnap, paymentsSnap] = await Promise.all([
            getDocs(membersCol(chitti.id)),
            getDocs(paymentsCol(chitti.id, cycleIdFor(chitti.currentCycle))),
          ])
          const activeMembers = membersSnap.docs.filter((d) => d.data().status === 'active')
          const pending = paymentsSnap.docs.filter((d) => d.data().status === 'pending')
          return {
            isActive: chitti.status === 'active',
            memberCount: activeMembers.length,
            pendingCount: pending.length,
            completedCycles: chitti.currentCycle - 1,
          }
        }),
      )

      if (cancelled) return
      setStats(
        results.reduce(
          (acc, r) => ({
            activeChittis: acc.activeChittis + (r.isActive ? 1 : 0),
            totalMembers: acc.totalMembers + r.memberCount,
            pendingPayments: acc.pendingPayments + r.pendingCount,
            completedCycles: acc.completedCycles + r.completedCycles,
          }),
          EMPTY,
        ),
      )
      setLoading(false)
    }

    if (chittis.length === 0) {
      setStats(EMPTY)
      setLoading(false)
      return
    }

    load()
    return () => {
      cancelled = true
    }
  }, [chittis])

  return { stats, loading }
}
