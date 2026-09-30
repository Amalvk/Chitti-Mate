export type TreasureMemberStatus = 'active' | 'removed'

/** A savings group, independent of any chitti — no fixed amount or period, members just contribute whenever they have money to put in. */
export interface TreasureGroup {
  id: string
  name: string
  createdAt: string
}

export interface TreasureMember {
  id: string
  name: string
  phone: string
  status: TreasureMemberStatus
  createdAt: string
}

export type ContributionType = 'deposit' | 'withdrawal'

/** One ad-hoc deposit or withdrawal by a member — no fixed amount or recurring schedule. `amount` is always the positive magnitude moved; `type` says which direction. */
export interface Contribution {
  id: string
  memberId: string
  /** Missing on entries written before withdrawals existed — treat as 'deposit'. */
  type?: ContributionType
  amount: number
  contributedAt: string
  note: string | null
  createdAt: string
}

export type CreateTreasureMemberInput = Pick<TreasureMember, 'name' | 'phone'>
