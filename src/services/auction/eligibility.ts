import type { Cycle, EligibilityResult, Member, Payment } from '@/types'

/**
 * A member is eligible for a cycle's lot only if they paid before the payment
 * deadline for that cycle and have never won a previous cycle.
 */
export function getEligibility(
  members: Member[],
  payments: Payment[],
  cycle: Cycle,
): EligibilityResult[] {
  const paymentByMember = new Map(payments.map((p) => [p.memberId, p]))
  const deadline = new Date(cycle.paymentDeadline).getTime()

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
      if (!payment || payment.status !== 'paid' || !payment.paidAt) {
        return { member, eligible: false, reason: 'Payment pending' }
      }

      if (new Date(payment.paidAt).getTime() > deadline) {
        return { member, eligible: false, reason: 'Paid after deadline' }
      }

      return { member, eligible: true, reason: null }
    })
}

export function getEligibleMembers(
  members: Member[],
  payments: Payment[],
  cycle: Cycle,
): Member[] {
  return getEligibility(members, payments, cycle)
    .filter((r) => r.eligible)
    .map((r) => r.member)
}
