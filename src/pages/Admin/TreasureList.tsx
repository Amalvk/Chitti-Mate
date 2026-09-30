import { Link } from 'react-router-dom'
import { PiggyBank, Plus } from 'lucide-react'
import { useTreasureGroups } from '@/hooks/useTreasure'
import { TreasureGroupCard } from '@/components/treasure/TreasureGroupCard'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

export function TreasureList() {
  const { groups, loading } = useTreasureGroups()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Treasure</h1>
        <Link to="/admin/treasure/new">
          <Button size="sm" icon={<Plus className="size-4" />}>
            New Group
          </Button>
        </Link>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="size-6" />}
          title="No savings groups yet"
          description="Create a group to start tracking members' ad-hoc savings — no fixed amount or schedule."
          action={
            <Link to="/admin/treasure/new">
              <Button icon={<Plus className="size-4" />}>Create Group</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <TreasureGroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
