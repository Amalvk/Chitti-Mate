import { Outlet, useParams } from 'react-router-dom'
import { useChitti } from '@/hooks/useChitti'
import { useMembers } from '@/hooks/useMembers'
import { useCurrentCycle, useCycles } from '@/hooks/useCycle'
import { usePayments } from '@/hooks/usePayments'
import { useEligibility } from '@/hooks/useEligibility'
import { cycleIdFor } from '@/services/chitti/lot'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { FolderX } from 'lucide-react'

export function PublicLayout() {
  const { id } = useParams<{ id: string }>()
  const { chitti, loading, error, notFound } = useChitti(id)
  const { members } = useMembers(id)
  const { cycles } = useCycles(id)
  const { cycle: currentCycle } = useCurrentCycle(id, chitti?.currentCycle)
  const currentCycleId = chitti ? cycleIdFor(chitti.currentCycle) : undefined
  const { payments } = usePayments(id, currentCycleId)
  const eligibility = useEligibility(members, payments, currentCycle)

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-950">
      <header className="border-b border-ink-100 bg-white px-4 pb-3.5 pt-[max(1rem,env(safe-area-inset-top))] md:px-8 md:py-3.5 dark:border-ink-800 dark:bg-ink-900">
        <div className="mx-auto flex max-w-lg items-center justify-between md:max-w-2xl">
          <Logo />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-5 md:max-w-2xl md:px-8 md:py-8">
        {loading ? (
          <SkeletonList count={2} />
        ) : error ? (
          <ErrorState description={error} onRetry={() => window.location.reload()} />
        ) : notFound || !chitti || !id ? (
          <EmptyState
            icon={<FolderX className="size-6" />}
            title="Chitti not found"
            description="This link may be invalid or the chitti was removed."
          />
        ) : (
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
        )}
      </main>
    </div>
  )
}
