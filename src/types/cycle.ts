import type { SelectionMethod } from './chitti'


export type CycleStatus = 'upcoming' | 'active' | 'lot_pending' | 'completed'

export interface Cycle {
  id: string
  cycleNumber: number
  auctionAt: string
  paymentDeadline: string
  status: CycleStatus
  winnerId: string | null
  selectionMethod: SelectionMethod
  completedAt: string | null
}

/** Client-side phases of the live auction/lot experience for the current cycle. */
export type AuctionPhase =
  | 'countdown'
  | 'preparing'
  | 'checking'
  | 'selecting'
  | 'revealed'
  | 'confirmed'
