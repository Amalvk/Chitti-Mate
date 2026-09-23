import { useEffect, useState } from 'react'
import type { Payment } from '@/types'
import { subscribeToPayments } from '@/services/chitti/payments'

export function usePayments(chittiId: string | undefined, cycleId: string | undefined) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chittiId || !cycleId) return
    setLoading(true)
    const unsubscribe = subscribeToPayments(chittiId, cycleId, (data) => {
      setPayments(data)
      setLoading(false)
    })
    return unsubscribe
  }, [chittiId, cycleId])

  return { payments, loading }
}
