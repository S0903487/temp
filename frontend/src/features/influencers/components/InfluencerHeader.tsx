import { Database, RefreshCw, Download, Upload } from 'lucide-react'

type InfluencerHeaderProps = {
  totalCount: number
  isFetching: boolean
  onRefetch: () => void
  onOpenImport: () => void
  onOpenAdd: () => void
  onExport: () => void
  selectedCount: number
}

export function InfluencerHeader({
  totalCount,
  isFetching,
  onRefetch,
  onOpenImport,
  onOpenAdd,
  onExport,
  selectedCount,
}: InfluencerHeaderProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 pb-2 md:flex-row md:items-center md:justify-between">
      {/* Title and breadcrumbs */}
      <div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>InfluenceOS</span>
          <span>/</span>
          <span className="text-slate-900">Creator Operations</span>
        </div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Influencers</h1>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
            {totalCount} Total
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 font-semibold">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
            Live Sync: Connected
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="inline-flex items-center gap-1">
            <Database size={10} className="text-slate-700" />
            Database: SQLite
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span>Updated: Just now</span>
        </div>
      </div>

      {/* Primary utility buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onRefetch}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:text-black hover:border-black transition"
          title="Refresh Data"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          onClick={onOpenImport}
          className="inline-flex h-7 items-center gap-1 rounded border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:text-black hover:border-black transition"
        >
          <Upload size={11} className="text-slate-500" />
          <span>Import</span>
        </button>

        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-7 items-center gap-1 rounded border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:text-black hover:border-black transition"
        >
          <Download size={11} className="text-slate-500" />
          <span>{selectedCount > 0 ? `Export (${selectedCount})` : 'Export CSV'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex h-7 items-center gap-1 rounded bg-black px-3 text-[11px] font-bold text-white hover:bg-slate-800 active:bg-black transition shadow-sm"
        >
          <span>Add Influencer</span>
        </button>
      </div>
    </div>
  )
}
