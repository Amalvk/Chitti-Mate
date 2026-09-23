export type PaymentStatus = 'pending' | 'paid'

export interface Payment {
  /** Same value as memberId; the payment doc is keyed by member id. */
  id: string
  memberId: string
  amount: number
  status: PaymentStatus
  paidAt: string | null
}
