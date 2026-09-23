import FlipClockCountdown from '@leenguyen/react-flip-clock-countdown'
import '@leenguyen/react-flip-clock-countdown/dist/index.css'
import { Timer } from 'lucide-react'
import { useCountdown } from '@/hooks/useCountdown'
import { formatDate, formatTime } from '@/utils/date'

interface CountdownCardProps {
  targetIso: string
  label?: string
}

export function CountdownCard({ targetIso, label = 'Next auction' }: CountdownCardProps) {
  const isPast = useCountdown(targetIso)?.isPast
  if (isPast === undefined) return null

  return (
    <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-6 text-center dark:border-brand-500/25 dark:bg-brand-500/10">
      <div className="mb-4 flex items-center justify-center gap-1.5 text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
        <Timer className="size-4" />
        {label}
      </div>
      {isPast ? (
        <p className="py-2 text-lg font-bold text-ink-700 dark:text-ink-200">Auction time has arrived</p>
      ) : (
        <div className="flex justify-center overflow-x-auto">
          <FlipClockCountdown
            className="chitti-flip-clock"
            to={targetIso}
            labels={['Days', 'Hrs', 'Mins', 'Secs']}
            labelStyle={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}
          />
        </div>
      )}
      <p className="mt-3 text-sm font-medium text-ink-500 dark:text-ink-400">
        {formatDate(targetIso)} · {formatTime(targetIso)}
      </p>
    </div>
  )
}
