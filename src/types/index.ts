export type * from './chitti'
export type * from './member'
export type * from './cycle'
export type * from './payment'
export type * from './treasure'

export interface EligibilityResult {
  member: import('./member').Member
  eligible: boolean
  reason: string | null
}

export interface Winner {
  memberId: string
  memberName: string
  cycleNumber: number
  amount: number
}
