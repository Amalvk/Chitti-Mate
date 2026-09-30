import { doc, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore'
import type { CreateTreasureMemberInput, TreasureMember } from '@/types'
import { treasureMemberDoc, treasureMembersCol } from '@/services/firebase/paths'

export function subscribeToTreasureMembers(
  groupId: string,
  onData: (members: TreasureMember[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(treasureMembersCol(groupId), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err as Error),
  )
}

export async function addTreasureMember(
  groupId: string,
  input: CreateTreasureMemberInput,
): Promise<TreasureMember> {
  const ref = doc(treasureMembersCol(groupId))
  const member: TreasureMember = {
    id: ref.id,
    name: input.name,
    phone: input.phone,
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  await setDoc(ref, member)
  return member
}

/** Members are never deleted — only deactivated, so their contribution history stays intact. */
export async function deactivateTreasureMember(groupId: string, memberId: string): Promise<void> {
  await updateDoc(treasureMemberDoc(groupId, memberId), { status: 'removed' })
}

export async function reactivateTreasureMember(groupId: string, memberId: string): Promise<void> {
  await updateDoc(treasureMemberDoc(groupId, memberId), { status: 'active' })
}
