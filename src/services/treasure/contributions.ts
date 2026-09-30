import { deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore'
import type { Contribution, ContributionType } from '@/types'
import { contributionDoc, contributionsCol } from '@/services/firebase/paths'

export function subscribeToContributions(
  groupId: string,
  onData: (contributions: Contribution[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(contributionsCol(groupId), orderBy('contributedAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err as Error),
  )
}

export interface AddContributionInput {
  memberId: string
  type: ContributionType
  amount: number
  contributedAt: string
  note?: string
}

export async function addContribution(groupId: string, input: AddContributionInput): Promise<void> {
  const ref = doc(contributionsCol(groupId))
  const contribution: Contribution = {
    id: ref.id,
    memberId: input.memberId,
    type: input.type,
    amount: input.amount,
    contributedAt: input.contributedAt,
    note: input.note?.trim() || null,
    createdAt: new Date().toISOString(),
  }
  await setDoc(ref, contribution)
}

/** Lets an admin undo a mistaken entry — contributions have no other edit path. */
export async function deleteContribution(groupId: string, contributionId: string): Promise<void> {
  await deleteDoc(contributionDoc(groupId, contributionId))
}
