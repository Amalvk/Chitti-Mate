import { Outlet, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useChitti } from '@/hooks/useChitti'
import { useMembers } from '@/hooks/useMembers'
import { useCurrentCycle, useCycles } from '@/hooks/useCycle'
import { usePayments } from '@/hooks/usePayments'
import { useEligibility } from '@/hooks/useEligibility'
import { cycleIdFor } from '@/services/chitti/lot'
import { shareChitti } from '@/utils/share'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { BackHeader } from './BackHeader'
import { ChittiTabBar } from './ChittiTabBar'
import { FolderX, Share2 } from 'lucide-react'

// Module-level (not React state) — set by ChittiDetails while its own delete
// action is in flight. deleteChitti's Firestore write is echoed back through
// this tab's live onSnapshot subscription (useChitti) almost immediately —
// well before deleteChitti()'s promise resolves and the caller gets to
// navigate away — which would otherwise flash the "not found" EmptyState
// below for a moment before the route change actually lands.
export const chittisBeingDeleted = new Set<string>()

export function AdminChittiLayout() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { chitti, loading, error, notFound } = useChitti(id)
  const { members } = useMembers(id)
  const { cycles } = useCycles(id)
  const { cycle: currentCycle } = useCurrentCycle(id, chitti?.currentCycle)
  const currentCycleId = chitti ? cycleIdFor(chitti.currentCycle) : undefined
  const { payments } = usePayments(id, currentCycleId)
  const eligibility = useEligibility(members, payments, currentCycle)

  async function handleShare() {
    if (!chitti) return
    const result = await shareChitti(chitti.id, chitti.name)
    if (result === 'copied') toast.success('Chitti link copied')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <SkeletonList count={2} />
      </div>
    )
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => window.location.reload()} />
  }

  if (notFound || !chitti || !id) {
    if (id && chittisBeingDeleted.has(id)) return null

    return (
      <EmptyState
        icon={<FolderX className="size-6" />}
        title="Chitti not found"
        description="This chitti may have been removed."
        action={
          <button
            onClick={() => navigate('/admin/chittis')}
            className="text-sm font-semibold text-brand-600"
          >
            Back to chittis
          </button>
        }
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <BackHeader
        title={chitti.name}
        subtitle={`Cycle ${chitti.currentCycle} of ${chitti.totalCycles}`}
        onBack={() => navigate('/admin/chittis')}
        action={
          <button
            onClick={handleShare}
            aria-label="Share"
            title="Share"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-ink-600 shadow-soft hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-300 dark:shadow-none dark:hover:bg-ink-800"
          >
            <Share2 className="size-4" />
          </button>
        }
      />
      <ChittiTabBar chittiId={id} />
      <Outlet
        context={{
          chitti,
          members,
          cycles,
          currentCycle,
          payments,
          eligibility,
          loading: false,
        }}
      />
    </div>
  )
}
