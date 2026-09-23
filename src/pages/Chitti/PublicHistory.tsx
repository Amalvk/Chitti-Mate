import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useChittiOutletContext } from '@/context/chittiOutletContext'
import { HistoryTimeline } from '@/components/chitti/HistoryTimeline'

export function PublicHistory() {
  const { id } = useParams<{ id: string }>()
  const { chitti, cycles, members } = useChittiOutletContext()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link
          to={`/chitti/${id}`}
          className="flex size-9 items-center justify-center rounded-full bg-white text-ink-600 shadow-soft hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-300 dark:shadow-none dark:hover:bg-ink-800"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Chitti History</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">{chitti.name}</p>
        </div>
      </div>

      <HistoryTimeline cycles={cycles} members={members} amount={chitti.amount} />
    </div>
  )
}
