type PageSkeletonProps = { cards?: number; compact?: boolean };

export function PageSkeleton({ cards = 6, compact = false }: PageSkeletonProps) {
  return <main className="min-h-screen bg-[#f8fafd] px-5 py-8 sm:px-8" aria-busy="true" aria-label="Loading page">
    <div className="mx-auto max-w-[1600px] animate-pulse">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-3"><div className="h-3 w-24 rounded bg-blue-100"/><div className="h-9 w-56 rounded-lg bg-slate-200"/><div className="h-4 w-80 max-w-[70vw] rounded bg-slate-100"/></div>
        <div className="hidden h-10 w-28 rounded-lg bg-blue-100 sm:block"/>
      </header>
      <div className={`grid gap-4 ${compact ? 'md:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
        {Array.from({ length: cards }, (_, index) => <div key={index} className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm"><div className="h-4 w-2/5 rounded bg-slate-200"/><div className="mt-5 h-8 w-3/5 rounded bg-slate-100"/><div className="mt-4 h-3 w-full rounded bg-slate-100"/><div className="mt-2 h-3 w-4/5 rounded bg-slate-100"/></div>)}
      </div>
    </div>
  </main>;
}
