import { Placeholder } from '@/components/ui/states'

/** Shared route fallback while a server page or its data is loading. */
export function PageLoading() {
  return (
    <div aria-busy="true" aria-label="Loading page" className="space-y-5">
      <div className="space-y-2">
        <Placeholder className="h-7 w-40" />
        <Placeholder className="h-4 w-64 max-w-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Placeholder key={index} className="h-24" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Placeholder className="h-64" />
        <Placeholder className="h-64" />
      </div>
    </div>
  )
}
