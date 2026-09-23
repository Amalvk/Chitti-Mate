export type MemberStatus = 'active' | 'removed'

export interface Member {
  id: string
  name: string
  phone: string
  status: MemberStatus
  hasWon: boolean
  wonCycle: number | null
  createdAt: string
}

export type CreateMemberInput = Pick<Member, 'name' | 'phone'>
