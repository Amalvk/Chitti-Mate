import { useOutletContext } from 'react-router-dom'
import type { Chitti, Cycle, EligibilityResult, Member, Payment } from '@/types'

export interface ChittiOutletContext {
  chitti: Chitti
  members: Member[]
  cycles: Cycle[]
  currentCycle: Cycle | null
  payments: Payment[]
  eligibility: EligibilityResult[]
  loading: boolean
}

export function useChittiOutletContext(): ChittiOutletContext {
  return useOutletContext<ChittiOutletContext>()
}
