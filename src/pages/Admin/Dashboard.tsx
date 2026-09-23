import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, Plus, Users, Wallet } from 'lucide-react'
import { useChittis } from '@/hooks/useChitti'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { StatCard } from '@/components/ui/StatCard'
import { ChittiCard } from '@/components/chitti/ChittiCard'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const { chittis, loading, error } = useChittis()
  const { stats } = useDashboardStats(chittis)
  const upcoming = chittis.filter((c) => c.status === 'active')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">
          {getGreeting()} 👋
        </h1>
        <p className="text-ink-500 dark:text-ink-400">Demo Admin</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active Chittis" value={stats.activeChittis} icon={<Wallet className="size-[18px]" />} />
        <StatCard label="Members" value={stats.totalMembers} icon={<Users className="size-[18px]" />} tone="neutral" />
        <StatCard
          label="Pending Payments"
          value={stats.pendingPayments}
          icon={<Clock className="size-[18px]" />}
          tone="warning"
        />
        <StatCard
          label="Completed Cycles"
          value={stats.completedCycles}
          icon={<CheckCircle2 className="size-[18px]" />}
          tone="success"
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">Upcoming Auctions</h2>
          <Link to="/admin/chittis/new" className="text-sm font-semibold text-brand-600 dark:text-brand-400">
            + New
          </Link>
        </div>

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <ErrorState description={error} onRetry={() => window.location.reload()} />
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={<Wallet className="size-6" />}
            title="No active chittis yet"
            description="Create your first chitti to get started."
            action={
              <Link to="/admin/chittis/new">
                <Button icon={<Plus className="size-4" />}>Create Chitti</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {upcoming.map((chitti) => (
              <ChittiCard key={chitti.id} chitti={chitti} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
