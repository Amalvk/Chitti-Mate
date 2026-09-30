import { doc, getDocs, onSnapshot, orderBy, query, setDoc, writeBatch } from 'firebase/firestore'
import type { TreasureGroup } from '@/types'
import { db } from '@/services/firebase/config'
import { contributionsCol, treasureGroupDoc, treasureGroupsCol, treasureMembersCol } from '@/services/firebase/paths'

export function subscribeToTreasureGroups(
  onData: (groups: TreasureGroup[]) => void,
  onError?: (error: Error) => void,
) {
  const q = query(treasureGroupsCol(), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err as Error),
  )
}

export function subscribeToTreasureGroup(
  groupId: string,
  onData: (group: TreasureGroup | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    treasureGroupDoc(groupId),
    (snap) => onData(snap.exists() ? snap.data() : null),
    (err) => onError?.(err as Error),
  )
}

export async function createTreasureGroup(name: string): Promise<string> {
  const ref = doc(treasureGroupsCol())
  const group: TreasureGroup = {
    id: ref.id,
    name,
    createdAt: new Date().toISOString(),
  }
  await setDoc(ref, group)
  return ref.id
}

/** Cascade-deletes the group's members and every member's contributions — Firestore doesn't do this on its own. */
export async function deleteTreasureGroup(groupId: string): Promise<void> {
  const batch = writeBatch(db)

  const membersSnap = await getDocs(treasureMembersCol(groupId))
  const contributionsSnap = await getDocs(contributionsCol(groupId))
  contributionsSnap.docs.forEach((d) => batch.delete(d.ref))
  membersSnap.docs.forEach((d) => batch.delete(d.ref))
  batch.delete(treasureGroupDoc(groupId))

  await batch.commit()
}
