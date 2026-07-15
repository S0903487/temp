import { useMemo, useState } from 'react'
import { List, Kanban, Grid } from 'lucide-react'
import PageShell from '../../components/shared/PageShell'
import { ColumnSelector } from './components/ColumnSelector'
import { Pagination } from './components/Pagination'
import { InfluencerHeader } from './components/InfluencerHeader'
import { InfluencerStatsGrid } from './components/InfluencerStatsGrid'
import { InfluencerFiltersPanel } from './components/InfluencerFiltersPanel'
import { InfluencerDataGrid } from './components/InfluencerDataGrid'
import { InfluencerPipelineBoard } from './components/InfluencerPipelineBoard'
import { InfluencerDetailsDrawer } from './components/InfluencerDetailsDrawer'
import { ImportModal } from './components/ImportModal'
import { AddInfluencerModal } from './components/AddInfluencerModal'
import { InfluencerCard } from './components/InfluencerCard'

import { useInfluencerState } from './hooks/useInfluencerState'
import {
  useCreateInfluencer,
  useDeleteInfluencer,
  useInfluencers,
  useUpdateInfluencer,
} from './hooks/useInfluencers'
import type { PipelineStatus } from './types'
import type { SortField } from './components/InfluencerDataGrid'
import type { CreateInfluencerInput } from './services/influencerService'

const COLS = [
  { key: 'platform', label: 'Platform' },
  { key: 'followers', label: 'Followers' },
  { key: 'engagement', label: 'Engagement Rate' },
  { key: 'category', label: 'Niche Category' },
  { key: 'contact', label: 'Contact Details' },
  { key: 'pipeline', label: 'Outreach Stage' },
  { key: 'country', label: 'Country' },
  { key: 'language', label: 'Language' },
  { key: 'averageViews', label: 'Avg Views' },
  { key: 'averageLikes', label: 'Avg Likes' },
  { key: 'averageComments', label: 'Avg Comments' },
  { key: 'pricePost', label: 'Price per Post' },
  { key: 'priceStory', label: 'Price per Story' },
  { key: 'verified', label: 'Verified Status' },
  { key: 'brandSafe', label: 'Brand Safety' },
  { key: 'status', label: 'Health Status' },
  { key: 'notes', label: 'Notes' },
]

export default function InfluencersPage() {
  const { data: influencers = [], isLoading, isError, error, refetch, isFetching } = useInfluencers()
  const createInfluencer = useCreateInfluencer()
  const updateInfluencer = useUpdateInfluencer()
  const deleteInfluencer = useDeleteInfluencer()

  const state = useInfluencerState()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Filtering Logic
  const filtered = useMemo(() => {
    const list = influencers
    const q = state.debouncedQuery.toLowerCase()

    return list.filter((inf) => {
      // Freeform debounced search
      if (q) {
        const textToMatch = `${inf.fullName} ${inf.username || ''} ${inf.email || ''} ${inf.phone || ''} ${inf.bio || ''} ${inf.category || ''} ${inf.country || ''} ${inf.language || ''} ${inf.notes || ''} ${inf.tags?.join(' ') || ''}`.toLowerCase()
        if (!textToMatch.includes(q)) return false
      }

      // Advanced Filters
      if (state.filters.platform !== 'All' && inf.platform !== state.filters.platform) return false
      if (state.filters.category !== 'All' && inf.category !== state.filters.category) return false
      if (state.filters.pipelineStatus !== 'All' && inf.pipelineStatus !== state.filters.pipelineStatus) return false

      if (state.filters.country !== 'All' && inf.country && !inf.country.toLowerCase().includes(state.filters.country.toLowerCase())) return false
      if (state.filters.language !== 'All' && inf.language && !inf.language.toLowerCase().includes(state.filters.language.toLowerCase())) return false
      if (state.filters.subcategory !== 'All' && inf.category && !inf.category.toLowerCase().includes(state.filters.subcategory.toLowerCase())) return false

      // Follower classification filter
      if (state.filters.followers === 'Micro (<50k)' && inf.followers >= 50000) return false
      if (state.filters.followers === 'Mid (50k-200k)' && (inf.followers < 50000 || inf.followers > 200000)) return false
      if (state.filters.followers === 'Macro (200k-1M)' && (inf.followers < 200000 || inf.followers > 1000000)) return false
      if (state.filters.followers === 'Mega (>1M)' && inf.followers <= 1000000) return false

      // Engagement classification filter
      if (state.filters.engagement === 'High (>5%)' && inf.engagementRate <= 5.0) return false
      if (state.filters.engagement === 'Medium (>2%)' && inf.engagementRate <= 2.0) return false

      // Booleans
      if (state.filters.verified === 'Verified only' && !inf.verified) return false
      if (state.filters.brandSafe === 'Brand Safe only' && !inf.brandSafe) return false
      if (state.filters.favorite && inf.status !== 'Booked') return false // star mapping status

      // Contacts
      if (state.filters.contact === 'Has email' && !inf.email) return false
      if (state.filters.contact === 'Has phone' && !inf.phone) return false
      if (state.filters.contact === 'Has both' && (!inf.email || !inf.phone)) return false

      return true
    })
  }, [influencers, state.debouncedQuery, state.filters])

  // Sorting Logic
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = (a[state.sortField] ?? '') as string | number
      let bv = (b[state.sortField] ?? '') as string | number

      if (typeof av === 'string') {
        av = av.toLowerCase()
        bv = (bv as string).toLowerCase()
      }

      if (av < bv) return state.sortOrder === 'asc' ? -1 : 1
      if (av > bv) return state.sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, state.sortField, state.sortOrder])

  // Pagination viewport
  const paginated = useMemo(() => {
    const start = (state.currentPage - 1) * state.pageSize
    return sorted.slice(start, start + state.pageSize)
  }, [sorted, state.currentPage, state.pageSize])

  // CSV Exporter Action (Selected or Filtered rows)
  const handleExportCSV = () => {
    const listToExport = state.selectedIds.length > 0
      ? sorted.filter((i) => state.selectedIds.includes(i.id))
      : sorted

    const headers = ['Full Name', 'Username', 'Platform', 'Category', 'Followers', 'Engagement Rate', 'Email', 'Phone', 'Pipeline Status']
    const rows = listToExport.map((i) => [
      i.fullName,
      i.username || '',
      i.platform,
      i.category || '',
      i.followers,
      i.engagementRate,
      i.email || '',
      i.phone || '',
      i.pipelineStatus,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `influenceos_creators_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportSuccess = (importedData: Record<string, unknown>[]) => {
    importedData.forEach((item) => {
      createInfluencer.mutate(item as CreateInfluencerInput)
    })
  }

  const handleUpdatePipeline = (id: string, pipelineStatus: PipelineStatus) => {
    updateInfluencer.mutate({ id, data: { pipelineStatus } })
  }

  const handleSortFieldChange = (field: SortField) => {
    if (state.sortField === field) {
      state.setSortOrder(state.sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      state.setSortField(field)
      state.setSortOrder('desc')
    }
    state.setCurrentPage(1)
  }

  return (
    <PageShell
      title="Influencer CRM"
      description="Manage partnerships, track active outreach funnels, and inspect creator history logs."
      eyebrow="Roster Management"
    >
      <div className="space-y-6">
        {/* Dynamic CRM Stats Indicators */}
        <InfluencerStatsGrid influencers={influencers} />

        {/* Top Control Bar with Search, Filter Presets, and Actions */}
        <InfluencerHeader
          totalCount={influencers.length}
          isFetching={isFetching}
          onRefetch={refetch}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenAdd={() => setIsAddOpen(true)}
          onExport={handleExportCSV}
          selectedCount={state.selectedIds.length}
        />

        {/* Filters and Search Bar Container */}
        <InfluencerFiltersPanel
          filters={state.filters}
          onFilterChange={state.updateFilter}
          onReset={state.resetFilters}
          savedPresets={state.savedPresets}
          onSavePreset={state.savePreset}
          onDeletePreset={state.deletePreset}
          onApplyPreset={state.applyPreset}
        />

        {/* View Mode Toolbar: Table, Grid or Kanban Board */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center bg-white border border-slate-200 rounded p-0.5">
            <button
              onClick={() => state.setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition ${
                state.viewMode === 'table' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'
              }`}
              title="Spreadsheet Table"
            >
              <List size={12} />
              <span>Spreadsheet</span>
            </button>
            <button
              onClick={() => state.setViewMode('card')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition ${
                state.viewMode === 'card' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'
              }`}
              title="Creator Cards Grid"
            >
              <Grid size={12} />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => state.setViewMode('pipeline')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition ${
                state.viewMode === 'pipeline' ? 'bg-black text-white' : 'text-slate-600 hover:text-black'
              }`}
              title="Kanban Pipeline Board"
            >
              <Kanban size={12} />
              <span>Pipeline Funnel</span>
            </button>
          </div>

          {state.viewMode === 'table' && (
            <ColumnSelector
              columns={COLS}
              visibleColumns={state.visibleColumns}
              onToggle={(k) =>
                state.setVisibleColumns((c) =>
                  c.includes(k) ? c.filter((col) => col !== k) : [...c, k]
                )
              }
            />
          )}
        </div>

        {/* Primary Data rendering views */}
        {isLoading && (
          <div className="py-24 text-center">
            <span className="h-8 w-8 rounded-full border-2 border-slate-950 border-t-transparent animate-spin inline-block" />
            <p className="mt-3 text-xs text-slate-500 font-bold animate-pulse">Syncing talent repository...</p>
          </div>
        )}

        {isError && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-xs text-red-700 text-center">
            Error loading directory: {error instanceof Error ? error.message : 'Unknown network failure'}
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="rounded border border-dashed border-slate-200 p-16 text-center bg-white">
            <p className="text-xs text-slate-500 font-bold">No creators found matching the chosen search criteria or filters.</p>
            <button
              onClick={state.resetFilters}
              className="mt-3 inline-flex items-center gap-1 text-xs text-slate-900 font-bold hover:underline cursor-pointer"
            >
              Reset active filter states
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div>
            {state.viewMode === 'table' ? (
              <InfluencerDataGrid
                influencers={paginated}
                selectedIds={state.selectedIds}
                onSelectToggle={(id) =>
                  state.setSelectedIds((prev) =>
                    prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                  )
                }
                onSelectAllToggle={state.setSelectedIds}
                sortField={state.sortField}
                sortOrder={state.sortOrder}
                onSort={handleSortFieldChange}
                visibleColumns={state.visibleColumns}
                onOpenDrawer={state.setActiveInfluencerId}
                onUpdatePipeline={handleUpdatePipeline}
                onDelete={(id) => deleteInfluencer.mutate(id)}
              />
            ) : state.viewMode === 'card' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginated.map((influencer) => (
                  <InfluencerCard
                    key={influencer.id}
                    influencer={influencer}
                    onOpenDrawer={state.setActiveInfluencerId}
                    onDelete={(id) => deleteInfluencer.mutate(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full max-w-full overflow-hidden">
                <InfluencerPipelineBoard
                  influencers={filtered}
                  onUpdatePipeline={handleUpdatePipeline}
                  onOpenDrawer={state.setActiveInfluencerId}
                />
              </div>
            )}

            {state.viewMode !== 'pipeline' && (
              <Pagination
                totalItems={filtered.length}
                currentPage={state.currentPage}
                pageSize={state.pageSize}
                onPageChange={state.setCurrentPage}
                onPageSizeChange={(size) => {
                  state.setPageSize(size)
                  state.setCurrentPage(1)
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Right Side Sheet Details Drawer */}
      <InfluencerDetailsDrawer
        influencerId={state.activeInfluencerId}
        onClose={() => state.setActiveInfluencerId(null)}
      />

      {/* Add Single Manual Creator Modal */}
      <AddInfluencerModal
        isOpen={isAddOpen}
        isSubmitting={createInfluencer.isPending}
        errorMessage={createInfluencer.error instanceof Error ? createInfluencer.error.message : null}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(data) => createInfluencer.mutate(data, { onSuccess: () => setIsAddOpen(false) })}
      />

      {/* Bulk CSV / Handle Import wizard */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onManualClick={() => setIsAddOpen(true)}
        onImportSuccess={handleImportSuccess}
      />
    </PageShell>
  )
}
