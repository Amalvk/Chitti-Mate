import { useEffect, useState } from 'react'
import type { Member } from '@/types'
import { subscribeToMembers } from '@/services/chitti/members'

export function useMembers(chittiId: string | undefined) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chittiId) return
    setLoading(true)
    const unsubscribe = subscribeToMembers(
      chittiId,
      (data) => {
        setMembers(data)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [chittiId])

  return { members, loading, error }
}
