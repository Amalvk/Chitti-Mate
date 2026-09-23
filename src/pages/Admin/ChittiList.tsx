import { Link } from 'react-router-dom'
import { Plus, Wallet } from 'lucide-react'
import { useChittis } from '@/hooks/useChitti'
import { ChittiCard } from '@/components/chitti/ChittiCard'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

export function ChittiList() {
  const { chittis, loading, error } = useChittis()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Chittis</h1>
        <Link to="/admin/chittis/new">
          <Button size="sm" icon={<Plus className="size-4" />}>
            New Chitti
          </Button>
        </Link>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <ErrorState description={error} onRetry={() => window.location.reload()} />
      ) : chittis.length === 0 ? (
        <EmptyState
          icon={<Wallet className="size-6" />}
          title="No chittis yet"
          description="Create your first chitti to start tracking members and payments."
          action={
            <Link to="/admin/chittis/new">
              <Button icon={<Plus className="size-4" />}>Create Chitti</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {chittis.map((chitti) => (
            <ChittiCard key={chitti.id} chitti={chitti} />
          ))}
        </div>
      )}
    </div>
  )
}
