export type ChittiDuration = 'weekly' | 'monthly'
export type ChittiStatus = 'active' | 'completed'
export type SelectionMethod = 'lot' | 'call'

export interface Chitti {
  id: string
  name: string
  amount: number
  commission: number
  duration: ChittiDuration
  totalMembers: number
  totalCycles: number
  startDate: string
  selectionMethod: SelectionMethod
  currentCycle: number
  status: ChittiStatus
  createdAt: string
  updatedAt: string
}

export type CreateChittiInput = Omit<
  Chitti,
  'id' | 'currentCycle' | 'status' | 'createdAt' | 'updatedAt'
>
