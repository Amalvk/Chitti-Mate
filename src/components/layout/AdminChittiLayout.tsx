import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { useChitti } from '@/hooks/useChitti'
import { useMembers } from '@/hooks/useMembers'
import { useCurrentCycle, useCycles } from '@/hooks/useCycle'
import { usePayments } from '@/hooks/usePayments'
import { useEligibility } from '@/hooks/useEligibility'
import { cycleIdFor } from '@/services/chitti/lot'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { BackHeader } from './BackHeader'
import { ChittiTabBar } from './ChittiTabBar'
import { FolderX } from 'lucide-react'

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

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-5 md:px-8 md:pt-8 md:pb-8">
        <SkeletonList count={2} />
      </div>
    )
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => window.location.reload()} />
  }

  if (notFound || !chitti || !id) {
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
    <div className="mx-auto max-w-3xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-5 md:px-8 md:pt-8 md:pb-8">
      <BackHeader
        title={chitti.name}
        subtitle={`Cycle ${chitti.currentCycle} of ${chitti.totalCycles}`}
        onBack={() => navigate('/admin/chittis')}
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
