import { useMemo, useState } from 'react'
import { Plus, LayoutGrid, List } from 'lucide-react'
import PageShell from '../../components/shared/PageShell'
import { AddInfluencerModal } from './components/AddInfluencerModal'
import { InfluencerCard } from './components/InfluencerCard'
import { InfluencerFilters } from './components/InfluencerFilters'
import { InfluencerTable } from './components/InfluencerTable'
import { InfluencerStats } from './components/InfluencerStats'
import { ColumnSelector } from './components/ColumnSelector'
import { Pagination } from './components/Pagination'
import { useCreateInfluencer, useInfluencers } from './hooks/useInfluencers'
import type { Platform, PipelineStatus } from './types'
import type { SortField } from './components/InfluencerTable'
import type { VerifiedFilter, BrandSafeFilter, ContactFilter, FollowersFilter, EngagementFilter } from './components/InfluencerFilters'

const COLS = [
  { key: 'platform', label: 'Platform' },
  { key: 'followers', label: 'Followers' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'category', label: 'Category' },
  { key: 'contact', label: 'Contact details' },
  { key: 'status', label: 'Status' },
  { key: 'pipeline', label: 'Pipeline status' },
]

export default function InfluencersPage() {
  const { data: influencers, isLoading, isError, error } = useInfluencers()
  const createInfluencer = useCreateInfluencer()

  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<'All' | Platform>('All')
  const [category, setCategory] = useState('All')
  const [followers, setFollowers] = useState<FollowersFilter>('All')
  const [engagement, setEngagement] = useState<EngagementFilter>('All')
  const [verified, setVerified] = useState<VerifiedFilter>('All')
  const [brandSafe, setBrandSafe] = useState<BrandSafeFilter>('All')
  const [contact, setContact] = useState<ContactFilter>('All')
  const [pipelineStatus, setPipelineStatus] = useState<'All' | PipelineStatus>('All')

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['platform', 'followers', 'engagement', 'category', 'contact', 'pipeline'])
  const [sortField, setSortField] = useState<SortField>('followers')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const handleFilter = <T,>(setter: (val: T) => void, val: T) => {
    setter(val)
    setCurrentPage(1)
  }

  const filtered = useMemo(() => {
    const list = influencers ?? []
    return list.filter((inf) => {
      const h = `${inf.fullName} ${inf.username || ''} ${inf.platform} ${inf.category || ''} ${inf.country || ''} ${inf.language || ''}`.toLowerCase()
      if (query && !h.includes(query.toLowerCase())) return false
      if (platform !== 'All' && inf.platform !== platform) return false
      if (category !== 'All' && inf.category !== category) return false
      if (followers === 'Micro (<50k)' && inf.followers >= 50000) return false
      if (followers === 'Mid (50k-200k)' && (inf.followers < 50000 || inf.followers > 200000)) return false
      if (followers === 'Macro (200k-1M)' && (inf.followers < 200000 || inf.followers > 1000000)) return false
      if (followers === 'Mega (>1M)' && inf.followers <= 1000000) return false
      if (engagement === 'High (>5%)' && inf.engagementRate <= 5.0) return false
      if (engagement === 'Medium (>2%)' && inf.engagementRate <= 2.0) return false
      if (verified === 'Verified only' && !inf.verified) return false
      if (brandSafe === 'Brand Safe only' && !inf.brandSafe) return false
      if (contact === 'Has email' && !inf.email) return false
      if (contact === 'Has phone' && !inf.phone) return false
      if (contact === 'Has both' && (!inf.email || !inf.phone)) return false
      if (pipelineStatus !== 'All' && inf.pipelineStatus !== pipelineStatus) return false
      return true
    })
  }, [influencers, query, platform, category, followers, engagement, verified, brandSafe, contact, pipelineStatus])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = (a[sortField] ?? '') as string | number
      let bv = (b[sortField] ?? '') as string | number
      if (typeof av === 'string') {
        av = av.toLowerCase()
        bv = (bv as string).toLowerCase()
      }
      if (av < bv) return sortOrder === 'asc' ? -1 : 1
      if (av > bv) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortField, sortOrder])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, currentPage, pageSize])

  return (
    <PageShell title="Influencer CRM" description="Search, analyze, and track outreach status for your talent database." eyebrow="Creator operations">
      <div className="space-y-6">
        {influencers && <InfluencerStats influencers={influencers} />}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800/60 pb-4 mb-4">
            <div className="flex-1 max-w-md relative">
              <input
                value={query}
                onChange={(e) => handleFilter(setQuery, e.target.value)}
                placeholder="Search name, category, country..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500'}`} title="Table View"><List size={16} /></button>
                <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-lg transition ${viewMode === 'card' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500'}`} title="Card View"><LayoutGrid size={16} /></button>
              </div>
              <ColumnSelector columns={COLS} visibleColumns={visibleColumns} onToggle={(k) => setVisibleColumns((c) => c.includes(k) ? c.filter((col) => col !== k) : [...c, k])} />
              <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition shadow-sm"><Plus size={16} />Add Influencer</button>
            </div>
          </div>
          <InfluencerFilters
            platform={platform} category={category} followers={followers} engagement={engagement} verified={verified} brandSafe={brandSafe} contact={contact} pipelineStatus={pipelineStatus}
            onPlatformChange={(v) => handleFilter(setPlatform, v)} onCategoryChange={(v) => handleFilter(setCategory, v)} onFollowersChange={(v) => handleFilter(setFollowers, v)} onEngagementChange={(v) => handleFilter(setEngagement, v)} onVerifiedChange={(v) => handleFilter(setVerified, v)} onBrandSafeChange={(v) => handleFilter(setBrandSafe, v)} onContactChange={(v) => handleFilter(setContact, v)} onPipelineStatusChange={(v) => handleFilter(setPipelineStatus, v)}
          />
          {isLoading && <p className="mt-6 text-sm text-slate-400 animate-pulse">Loading influencers...</p>}
          {isError && <p className="mt-6 text-sm text-red-400">Error: {error?.message}</p>}
          {!isLoading && filtered.length === 0 && <p className="mt-6 text-sm text-slate-500">No matching influencers found.</p>}
          {filtered.length > 0 && (
            <div className="mt-6">
              {viewMode === 'table' ? (
                <InfluencerTable influencers={paginated} sortField={sortField} sortOrder={sortOrder} onSort={handleSort} visibleColumns={visibleColumns} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{paginated.map((inf) => <InfluencerCard key={inf.id} influencer={inf} />)}</div>
              )}
              <Pagination totalItems={filtered.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
            </div>
          )}
        </div>
      </div>
      <AddInfluencerModal isOpen={isModalOpen} isSubmitting={createInfluencer.isPending} errorMessage={createInfluencer.error?.message ?? null} onClose={() => setIsModalOpen(false)} onSubmit={(data) => createInfluencer.mutate(data, { onSuccess: () => setIsModalOpen(false) })} />
    </PageShell>
  )
}
