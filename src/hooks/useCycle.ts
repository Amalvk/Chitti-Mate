import { useEffect, useState } from 'react'
import type { Cycle } from '@/types'
import { subscribeToCycle, subscribeToCycles } from '@/services/chitti/cycles'
import { cycleIdFor } from '@/services/chitti/lot'

export function useCycles(chittiId: string | undefined) {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chittiId) return
    setLoading(true)
    const unsubscribe = subscribeToCycles(chittiId, (data) => {
      setCycles(data)
      setLoading(false)
    })
    return unsubscribe
  }, [chittiId])

  return { cycles, loading }
}

export function useCurrentCycle(chittiId: string | undefined, currentCycleNumber: number | undefined) {
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chittiId || !currentCycleNumber) return
    setLoading(true)
    const unsubscribe = subscribeToCycle(chittiId, cycleIdFor(currentCycleNumber), (data) => {
      setCycle(data)
      setLoading(false)
    })
    return unsubscribe
  }, [chittiId, currentCycleNumber])

  return { cycle, loading }
}
