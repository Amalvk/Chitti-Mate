import { useEffect, useState } from 'react'
import type { Chitti } from '@/types'
import { subscribeToChitti, subscribeToChittis } from '@/services/chitti/chitti'

interface UseChittiResult {
  chitti: Chitti | null
  loading: boolean
  error: string | null
  notFound: boolean
}

export function useChitti(chittiId: string | undefined): UseChittiResult {
  const [chitti, setChitti] = useState<Chitti | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!chittiId) {
      setLoading(false)
      setNotFound(true)
      return
    }
    setLoading(true)
    setError(null)
    setNotFound(false)

    const unsubscribe = subscribeToChitti(
      chittiId,
      (data) => {
        setChitti(data)
        setNotFound(!data)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [chittiId])

  return { chitti, loading, error, notFound }
}

export function useChittis(): { chittis: Chitti[]; loading: boolean; error: string | null } {
  const [chittis, setChittis] = useState<Chitti[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToChittis(
      (data) => {
        setChittis(data)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  return { chittis, loading, error }
}
