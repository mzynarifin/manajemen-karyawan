import { Skeleton, StatSkeleton, TableSkeleton } from '@/components/ui/states'

export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
      <TableSkeleton rows={8} columns={7} />
    </div>
  )
}