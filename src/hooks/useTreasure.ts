import { useEffect, useState } from 'react'
import type { Contribution, TreasureGroup, TreasureMember } from '@/types'
import { subscribeToTreasureGroup, subscribeToTreasureGroups } from '@/services/treasure/groups'
import { subscribeToTreasureMembers } from '@/services/treasure/members'
import { subscribeToContributions } from '@/services/treasure/contributions'

export function useTreasureGroups() {
  const [groups, setGroups] = useState<TreasureGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToTreasureGroups(
      (data) => {
        setGroups(data)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [])

  return { groups, loading }
}

export function useTreasureGroup(groupId: string | undefined) {
  const [group, setGroup] = useState<TreasureGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!groupId) {
      setLoading(false)
      setNotFound(true)
      return
    }
    setLoading(true)
    setNotFound(false)
    const unsubscribe = subscribeToTreasureGroup(
      groupId,
      (data) => {
        setGroup(data)
        setNotFound(!data)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [groupId])

  return { group, loading, notFound }
}

export function useTreasureMembers(groupId: string | undefined) {
  const [members, setMembers] = useState<TreasureMember[]>([])

  useEffect(() => {
    if (!groupId) return
    return subscribeToTreasureMembers(groupId, setMembers)
  }, [groupId])

  return { members }
}

export function useContributions(groupId: string | undefined) {
  const [contributions, setContributions] = useState<Contribution[]>([])

  useEffect(() => {
    if (!groupId) return
    return subscribeToContributions(groupId, setContributions)
  }, [groupId])

  return { contributions }
}
