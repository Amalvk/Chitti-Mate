import { useEffect, useState } from 'react'
import { getCountdownParts, type CountdownParts } from '@/utils/date'

/** Ticks every second, always recomputing from the real clock against `targetIso`. */
export function useCountdown(targetIso: string | null | undefined): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(() =>
    targetIso ? getCountdownParts(targetIso) : null,
  )

  useEffect(() => {
    if (!targetIso) {
      setParts(null)
      return
    }
    setParts(getCountdownParts(targetIso))
    const interval = setInterval(() => {
      setParts(getCountdownParts(targetIso))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetIso])

  return parts
}
