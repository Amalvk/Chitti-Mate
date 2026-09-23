import type { Member } from '@/types'

/**
 * Authoritative winner-selection function for the lot.
 *
 * This is intentionally isolated from any UI/animation code: the reveal
 * animation only replays a result that was already decided and persisted
 * here, so a page refresh or a second browser tab can never produce a
 * different winner for the same cycle.
 *
 * Kept as a pure function so the same logic can move to a Cloud Function
 * later without touching call sites.
 */
export function selectLotWinner(eligibleMembers: Member[]): Member | null {
  if (eligibleMembers.length === 0) return null
  const index = Math.floor(Math.random() * eligibleMembers.length)
  return eligibleMembers[index]
}
