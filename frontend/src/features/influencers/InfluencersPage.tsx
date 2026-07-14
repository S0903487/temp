import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import PageShell from '../../components/shared/PageShell'
import { AddInfluencerModal } from './components/AddInfluencerModal'
import { InfluencerCard } from './components/InfluencerCard'
import { InfluencerFilters } from './components/InfluencerFilters'
import type { EmailFilter, VerifiedFilter } from './components/InfluencerFilters'
import { InfluencerTable } from './components/InfluencerTable'
import { useCreateInfluencer, useInfluencers } from './hooks/useInfluencers'
import type { Platform } from './types'

function InfluencersPage() {
  const { data: influencers, isLoading, isError, error } = useInfluencers()
  const createInfluencer = useCreateInfluencer()

  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<'All' | Platform>('All')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<'followers-desc' | 'followers-asc'>('followers-desc')
  const [verified, setVerified] = useState<VerifiedFilter>('All')
  const [hasEmail, setHasEmail] = useState<EmailFilter>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const visibleInfluencers = useMemo(() => {
    const source = influencers ?? []
    const filtered = source.filter((influencer) => {
      const haystack = `${influencer.fullName} ${influencer.username} ${influencer.category} ${influencer.country} ${influencer.language}`.toLowerCase()
      const matchesQuery = haystack.includes(query.toLowerCase())
      const matchesPlatform = platform === 'All' || influencer.platform === platform
      const matchesCategory = category === 'All' || influencer.category === category
      const matchesVerified = verified === 'All' || influencer.verified
      const matchesEmail = hasEmail === 'All' || Boolean(influencer.email)

      return matchesQuery && matchesPlatform && matchesCategory && matchesVerified && matchesEmail
    })

    return filtered.sort((left, right) => {
      return sort === 'followers-desc' ? right.followers - left.followers : left.followers - right.followers
    })
  }, [category, hasEmail, influencers, platform, query, sort, verified])

  const statsData = useMemo(() => {
    const source = influencers ?? []
    const totalInfluencers = source.length
    const instagramInfluencers = source.filter((item) => item.platform === 'Instagram').length
    const tikTokInfluencers = source.filter((item) => item.platform === 'TikTok').length
    const averageEngagement =
      source.length > 0
        ? (source.reduce((sum, item) => sum + item.engagementRate, 0) / source.length).toFixed(1)
        : '0.0'
    const totalReach = source.reduce((sum, item) => sum + item.followers, 0)
    const categoryCounts = source.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    }, {})
    const topCategory = Object.entries(categoryCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'Diverse'

    return [
      { label: 'Total Influencers', value: totalInfluencers.toLocaleString() },
      { label: 'Instagram Influencers', value: instagramInfluencers.toString() },
      { label: 'TikTok Influencers', value: tikTokInfluencers.toString() },
      { label: 'Average Engagement', value: `${averageEngagement}%` },
      { label: 'Total Reach', value: totalReach.toLocaleString() },
      { label: 'Top Category', value: topCategory },
    ]
  }, [influencers])

  return (
    <PageShell
      title="Influencer CRM"
      description="Manage creators, shortlist talent, and keep every relationship organized in one place."
      eyebrow="Creator operations"
      action={influencers ? `${influencers.length} creators` : undefined}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statsData.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Creator roster</h2>
              <p className="text-sm text-slate-400">Search, filter, and review your curated creator list.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Plus size={16} />
              Add Influencer
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 lg:max-w-md">
              <span className="text-slate-500">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, niche, country, or language"
                className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>
            <div className="w-full lg:max-w-xs">
              <InfluencerFilters
                platform={platform}
                category={category}
                sort={sort}
                verified={verified}
                hasEmail={hasEmail}
                onPlatformChange={setPlatform}
                onCategoryChange={setCategory}
                onSortChange={setSort}
                onVerifiedChange={setVerified}
                onHasEmailChange={setHasEmail}
              />
            </div>
          </div>

          {isLoading && <p className="mt-6 text-sm text-slate-400">Loading influencers…</p>}
          {isError && (
            <p className="mt-6 text-sm text-red-400">
              Couldn't load influencers{error instanceof Error ? `: ${error.message}` : '.'}
            </p>
          )}
          {influencers && influencers.length === 0 && (
            <p className="mt-6 text-sm text-slate-400">No influencers yet. Add your first creator.</p>
          )}

          {visibleInfluencers.length > 0 && (
            <>
              <div className="mt-6 hidden lg:block">
                <InfluencerTable influencers={visibleInfluencers} />
              </div>

              <div className="mt-6 grid gap-4 lg:hidden">
                {visibleInfluencers.map((influencer) => (
                  <InfluencerCard key={influencer.id} influencer={influencer} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <AddInfluencerModal
        isOpen={isModalOpen}
        isSubmitting={createInfluencer.isPending}
        errorMessage={createInfluencer.error instanceof Error ? createInfluencer.error.message : null}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) =>
          createInfluencer.mutate(data, {
            onSuccess: () => setIsModalOpen(false),
          })
        }
      />
    </PageShell>
  )
}

export default InfluencersPage
