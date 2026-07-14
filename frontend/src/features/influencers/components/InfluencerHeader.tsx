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
    <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900/10 pb-5 md:flex-row md:items-center md:justify-between">
      {/* Title and breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          <span>InfluenceOS</span>
          <span>/</span>
          <span className="text-cyan-400">Creator Operations</span>
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Influencers</h1>
          <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-xs font-bold text-slate-400 border border-slate-700/50">
            {totalCount} Total
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync: Connected
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="inline-flex items-center gap-1">
            <Database size={11} className="text-cyan-400" />
            Database: SQLite (WAL optimized)
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span>Last updated: Just now</span>
        </div>
      </div>

      {/* Primary utility buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefetch}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 transition"
          title="Refresh Data"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin text-cyan-400' : ''} />
        </button>

        <button
          type="button"
          onClick={onOpenImport}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 transition"
        >
          <Upload size={13} className="text-slate-400" />
          <span>Import</span>
        </button>

        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 transition"
        >
          <Download size={13} className="text-slate-400" />
          <span>{selectedCount > 0 ? `Export (${selectedCount})` : 'Export CSV'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-cyan-500 px-4 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition shadow-md shadow-cyan-950/20"
        >
          <span>Add Influencer</span>
        </button>
      </div>
    </div>
  )
}
