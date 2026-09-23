import { doc, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore'
import type { CreateMemberInput, Member } from '@/types'
import { memberDoc, membersCol } from '@/services/firebase/paths'

export function subscribeToMembers(
  chittiId: string,
  onData: (members: Member[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(membersCol(chittiId), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err as Error),
  )
}

export async function addMember(chittiId: string, input: CreateMemberInput): Promise<Member> {
  const ref = doc(membersCol(chittiId))
  const member: Member = {
    id: ref.id,
    name: input.name,
    phone: input.phone,
    status: 'active',
    hasWon: false,
    wonCycle: null,
    createdAt: new Date().toISOString(),
  }
  await setDoc(ref, member)
  return member
}

/** Members are never deleted — only deactivated, so their payment/win history stays intact. */
export async function deactivateMember(chittiId: string, memberId: string): Promise<void> {
  await updateDoc(memberDoc(chittiId, memberId), { status: 'removed' })
}

export async function markMemberAsWinner(
  chittiId: string,
  memberId: string,
  cycleNumber: number,
): Promise<void> {
  await updateDoc(memberDoc(chittiId, memberId), { hasWon: true, wonCycle: cycleNumber })
}
