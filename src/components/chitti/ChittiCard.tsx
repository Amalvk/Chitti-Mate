import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import FlipClockCountdown from '@leenguyen/react-flip-clock-countdown'
import '@leenguyen/react-flip-clock-countdown/dist/index.css'
import type { Chitti } from '@/types'
import { useMembers } from '@/hooks/useMembers'
import { useCurrentCycle } from '@/hooks/useCycle'
import { usePayments } from '@/hooks/usePayments'
import { cycleIdFor } from '@/services/chitti/lot'
import { deleteChitti } from '@/services/chitti/chitti'
import { formatCurrency } from '@/utils/currency'
import { Card } from '@/components/ui/Card'
import { CountdownSkeleton } from '@/components/ui/Skeleton'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'

interface ChittiCardProps {
  chitti: Chitti
  /** Shows a delete affordance in the top-right corner — only where deleting straight from a list makes sense (the chittis list), not the dashboard's upcoming-auctions preview. */
  deletable?: boolean
}

export function ChittiCard({ chitti, deletable = false }: ChittiCardProps) {
  const { members } = useMembers(chitti.id)
  const { cycle, loading: cycleLoading } = useCurrentCycle(chitti.id, chitti.currentCycle)
  const cycleId = cycleIdFor(chitti.currentCycle)
  const { payments } = usePayments(chitti.id, cycleId)
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const activeMembers = members.filter((m) => m.status === 'active')
  const paidCount = payments.filter((p) => p.status === 'paid').length

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteChitti(chitti.id)
      toast.success('Chitti deleted')
      setDeleteSheetOpen(false)
    } catch {
      toast.error('Could not delete this chitti. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="relative">
      <Link to={`/admin/chittis/${chitti.id}`} className="block">
        <Card className="flex flex-col gap-4 transition-shadow hover:shadow-soft-lg dark:hover:border-ink-700">
          <div className={deletable ? 'pr-9' : undefined}>
            <p className="truncate text-lg font-bold text-ink-900 dark:text-ink-50">{chitti.name}</p>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {formatCurrency(chitti.amount)} / {chitti.duration === 'monthly' ? 'month' : 'week'} ·
              Cycle {chitti.currentCycle} / {chitti.totalCycles}
            </p>
          </div>

          {chitti.status === 'active' && (cycle || cycleLoading) && (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-ink-50 p-4 dark:bg-ink-800">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-400 dark:text-ink-500">Next auction</p>
              {cycle ? (
                <FlipClockCountdown
                  className="chitti-flip-clock-compact"
                  to={cycle.auctionAt}
                  showLabels={false}
                />
              ) : (
                <CountdownSkeleton />
              )}
            </div>
          )}

          <p className="text-sm font-semibold text-ink-600 dark:text-ink-300">
            {paidCount} / {activeMembers.length} paid
          </p>
        </Card>
      </Link>

      {deletable && (
        <button
          onClick={() => setDeleteSheetOpen(true)}
          aria-label={`Delete ${chitti.name}`}
          title="Delete chitti"
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:text-ink-500 dark:hover:bg-danger-500/15 dark:hover:text-danger-300"
        >
          <Trash2 className="size-4" />
        </button>
      )}

      {deletable && (
        <BottomSheet
          open={deleteSheetOpen}
          onClose={() => setDeleteSheetOpen(false)}
          title="Delete this chitti?"
          dismissible={!deleting}
        >
          <div className="flex flex-col gap-8">
            <p className="text-sm text-ink-500 dark:text-ink-400">
              This permanently deletes <span className="font-semibold text-ink-700 dark:text-ink-200">{chitti.name}</span>,
              its members, and its full cycle and payment history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth disabled={deleting} onClick={() => setDeleteSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                loading={deleting}
                icon={<Trash2 className="size-4" />}
                onClick={() => void handleDelete()}
              >
                Delete
              </Button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
