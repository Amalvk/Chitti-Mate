import { useMemo } from 'react'
import type { Cycle, Member, Payment } from '@/types'
import { getEligibility } from '@/services/auction/eligibility'

export function useEligibility(members: Member[], payments: Payment[], cycle: Cycle | null) {
  return useMemo(() => {
    if (!cycle) return []
    return getEligibility(members, payments)
  }, [members, payments, cycle])
}
