import type { EligibilityResult, Member, Payment } from '@/types'

/**
 * A member is eligible for a cycle's lot as long as they've paid (any time
 * before the lot actually runs — a late payment still counts, since an admin
 * can mark it paid and re-run the lot right up until it's decided) and have
 * never won a previous cycle.
 */
export function getEligibility(members: Member[], payments: Payment[]): EligibilityResult[] {
  const paymentByMember = new Map(payments.map((p) => [p.memberId, p]))

  return members
    .filter((m) => m.status === 'active')
    .map((member) => {
      if (member.hasWon) {
        return {
          member,
          eligible: false,
          reason: `Already won Cycle ${member.wonCycle}`,
        }
      }

      const payment = paymentByMember.get(member.id)
      if (!payment || payment.status !== 'paid') {
        return { member, eligible: false, reason: 'Payment pending' }
      }

      return { member, eligible: true, reason: null }
    })
}

export function getEligibleMembers(members: Member[], payments: Payment[]): Member[] {
  return getEligibility(members, payments)
    .filter((r) => r.eligible)
    .map((r) => r.member)
}
