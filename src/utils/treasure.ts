import type { Contribution } from '@/types'

/** Signed effect of one entry on a balance — deposits add, withdrawals subtract. Missing `type` (entries written before withdrawals existed) is treated as a deposit. */
export function netAmount(contribution: Contribution): number {
  return contribution.type === 'withdrawal' ? -contribution.amount : contribution.amount
}

export function totalBalance(contributions: Contribution[]): number {
  return contributions.reduce((sum, c) => sum + netAmount(c), 0)
}
