import { useChittiOutletContext } from '@/context/chittiOutletContext'
import { CycleTimeline } from '@/components/chitti/CycleTimeline'

export function Cycles() {
  const { chitti, cycles, members } = useChittiOutletContext()

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">Cycles</h2>
      <CycleTimeline cycles={cycles} totalCycles={chitti.totalCycles} members={members} />
    </div>
  )
}
