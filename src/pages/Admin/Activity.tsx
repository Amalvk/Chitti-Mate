import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDocs, query, where } from 'firebase/firestore'
import { Activity as ActivityIcon, Trophy } from 'lucide-react'
import { useChittis } from '@/hooks/useChitti'
import { cyclesCol, membersCol } from '@/services/firebase/paths'
import { formatDateTime } from '@/utils/date'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'

interface ActivityItem {
  chittiId: string
  chittiName: string
  cycleNumber: number
  winnerName: string
  completedAt: string
}

export function Activity() {
  const { chittis, loading: chittisLoading } = useChittis()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (chittis.length === 0) {
        setItems([])
        setLoading(false)
        return
      }
      setLoading(true)
      const all = await Promise.all(
        chittis.map(async (chitti) => {
          const [cyclesSnap, membersSnap] = await Promise.all([
            getDocs(query(cyclesCol(chitti.id), where('status', '==', 'completed'))),
            getDocs(membersCol(chitti.id)),
          ])
          const memberById = new Map(membersSnap.docs.map((d) => [d.id, d.data().name]))
          return cyclesSnap.docs.map((d) => {
            const cycle = d.data()
            return {
              chittiId: chitti.id,
              chittiName: chitti.name,
              cycleNumber: cycle.cycleNumber,
              winnerName: (cycle.winnerId && memberById.get(cycle.winnerId)) || 'Unknown',
              completedAt: cycle.completedAt ?? '',
            }
          })
        }),
      )
      if (cancelled) return
      const flat = all
        .flat()
        .sort((a, b) => (b.completedAt > a.completedAt ? 1 : -1))
        .slice(0, 20)
      setItems(flat)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [chittis])

  const isLoading = chittisLoading || loading

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Activity</h1>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon className="size-6" />}
          title="No activity yet"
          description="Completed lots and winners across your chittis will show up here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <Link key={`${item.chittiId}-${item.cycleNumber}-${i}`} to={`/admin/chittis/${item.chittiId}`}>
              <Card className="flex items-center gap-3 hover:shadow-soft-lg dark:hover:shadow-none">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-warning-50 text-warning-500 dark:bg-warning-500/15 dark:text-warning-300">
                  <Trophy className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink-900 dark:text-ink-50">
                    {item.winnerName} won Cycle {item.cycleNumber}
                  </p>
                  <p className="text-sm text-ink-500 dark:text-ink-400">{item.chittiName}</p>
                </div>
                {item.completedAt && (
                  <p className="shrink-0 text-xs text-ink-400 dark:text-ink-500">{formatDateTime(item.completedAt)}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
