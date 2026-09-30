import { useState } from 'react'
import { ChevronDown, Receipt } from 'lucide-react'
import { useChittis } from '@/hooks/useChitti'
import { ChittiPaymentMatrix } from '@/components/payments/ChittiPaymentMatrix'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'

export function Payments() {
  const { chittis, loading, error } = useChittis()
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Payments</h1>

      {loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <ErrorState description={error} onRetry={() => window.location.reload()} />
      ) : chittis.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-6" />}
          title="No chittis yet"
          description="Payment history will appear here once you create a chitti."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {chittis.map((chitti) => {
            const open = openId === chitti.id
            return (
              <Card key={chitti.id} padded={false} className="overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : chitti.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-ink-50 dark:hover:bg-ink-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink-900 dark:text-ink-50">{chitti.name}</p>
                    <p className="text-xs text-ink-400 dark:text-ink-500">
                      Cycle {chitti.currentCycle} of {chitti.totalCycles}
                    </p>
                  </div>
                  {chitti.status === 'completed' && <Badge tone="success">Completed</Badge>}
                  <ChevronDown className={`size-4 shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="border-t border-ink-100 px-5 py-4 dark:border-ink-800">
                    <ChittiPaymentMatrix chittiId={chitti.id} />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
