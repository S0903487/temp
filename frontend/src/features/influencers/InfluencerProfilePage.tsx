import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, HelpCircle, Mail, Pencil, Phone, ShieldCheck, Trash2, ExternalLink } from 'lucide-react'
import PageShell from '../../components/shared/PageShell'
import { Avatar } from '../../components/shared/Avatar'
import { CampaignHistoryList } from './components/CampaignHistoryList'
import { GrowthChart } from './components/GrowthChart'
import { InfluencerFormModal } from './components/AddInfluencerModal'
import { NotesPanel } from './components/NotesPanel'
import { PipelineStatusSelect } from './components/PipelineStatusSelect'
import { TagSelector } from './components/TagSelector'
import { useOrganization } from '../organizations/hooks/useOrganization'
import { formatCurrency } from '../../lib/currency'
import { useAuthUser } from '../auth/hooks/useAuth'
import {
  useAddInfluencerNote,
  useAddInfluencerTag,
  useDeleteInfluencer,
  useInfluencer,
  useInfluencerCampaignHistory,
  useInfluencerNotes,
  useInfluencerSnapshots,
  useInfluencerTags,
  useOrgTags,
  useRemoveInfluencerNote,
  useRemoveInfluencerTag,
  useUpdateInfluencer,
} from './hooks/useInfluencers'
import type { PipelineStatus } from './types'

function formatValue(val: number | null | undefined, isPercentage = false, isCurrency = false, currencyCode = 'USD'): string {
  if (val === undefined || val === null) return '—'
  // Support extreme fractional values such as 0.00001
  const formatted = val.toLocaleString(undefined, { maximumFractionDigits: 6 })
  if (isPercentage) {
    return `${formatted}%`
  }
  if (isCurrency) {
    return formatCurrency(val, currencyCode)
  }
  return formatted
}

function StatCard({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="group relative rounded border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-slate-300">
      <div className="flex items-center gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        {tooltip && (
          <div className="relative inline-block cursor-help text-slate-300 hover:text-slate-500 group/tooltip">
            <HelpCircle size={10} />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-25 mb-2 w-48 -translate-x-1/2 scale-90 rounded bg-slate-900 p-2 text-[10px] font-semibold leading-normal text-white opacity-0 shadow-lg transition-all duration-150 group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100">
              {tooltip}
              <div className="absolute top-full left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-0.5 rotate-45 bg-slate-900" />
            </div>
          </div>
        )}
      </div>
      <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  )
}

function InfluencerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: organization } = useOrganization()
  const { data: currentUser } = useAuthUser()
  const { data: influencer, isLoading, isError } = useInfluencer(id)
  const { data: tags = [] } = useInfluencerTags(id)
  const { data: orgTags = [] } = useOrgTags()
  const { data: notes = [], isLoading: notesLoading } = useInfluencerNotes(id)
  const { data: snapshots = [] } = useInfluencerSnapshots(id)
  const { data: campaignHistory = [], isLoading: campaignsLoading } = useInfluencerCampaignHistory(id)

  const addTag = useAddInfluencerTag(id ?? '')
  const removeTag = useRemoveInfluencerTag(id ?? '')
  const addNote = useAddInfluencerNote(id ?? '')
  const removeNote = useRemoveInfluencerNote(id ?? '')
  const updateInfluencer = useUpdateInfluencer()
  const deleteInfluencer = useDeleteInfluencer()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  if (isLoading) {
    return (
      <PageShell title="Influencer Profile" description="Loading creator details…" eyebrow="Creator operations">
        <p className="text-xs text-slate-400">Loading…</p>
      </PageShell>
    )
  }

  if (isError || !influencer) {
    return (
      <PageShell title="Influencer Profile" description="We couldn't find this creator." eyebrow="Creator operations">
        <Link to="/influencers" className="text-xs text-slate-900 font-bold hover:underline">
          ← Back to influencers
        </Link>
      </PageShell>
    )
  }

  const handlePipelineChange = (pipelineStatus: PipelineStatus) => {
    if (!id) return
    updateInfluencer.mutate({ id, data: { pipelineStatus } })
  }

  const handleDeleteConfirmed = () => {
    if (!id) return
    deleteInfluencer.mutate(id, {
      onSuccess: () => navigate('/influencers'),
    })
  }

  return (
    <PageShell
      title="Creator Profile"
      description="View and manage creator details, performance metrics, and outreach progress."
      eyebrow="Influencer management"
    >
      <div className="space-y-4">
        {/* SECTION 1: Unified Profile Header Section */}
        <div className="rounded border border-slate-200 bg-white p-5 shadow-xs">
          {/* Top Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <Link to="/influencers" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-black font-bold transition">
              <ArrowLeft size={13} /> Back to all creators
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <PipelineStatusSelect
                value={influencer.pipelineStatus}
                onChange={handlePipelineChange}
                disabled={updateInfluencer.isPending}
                variant="outline"
              />
              
              {isConfirmingDelete ? (
                <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                  <span>Delete?</span>
                  <button
                    type="button"
                    onClick={handleDeleteConfirmed}
                    disabled={deleteInfluencer.isPending}
                    className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                  >
                    {deleteInfluencer.isPending ? 'Deleting…' : 'Yes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="inline-flex h-7 items-center gap-1 rounded border border-slate-200 bg-white px-2.5 text-[11px] text-slate-600 hover:text-black hover:bg-slate-50 font-bold transition cursor-pointer"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="inline-flex h-7 items-center gap-1 rounded border border-red-200 bg-white px-2.5 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 font-bold transition cursor-pointer"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Details Body */}
          <div className="flex flex-col md:flex-row md:items-start gap-6 pt-5">
            <div className="flex-shrink-0">
              <Avatar name={influencer.fullName} imageUrl={influencer.profileImage} size={64} />
            </div>

            <div className="flex-grow space-y-2.5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{influencer.fullName}</h2>
                  {currentUser && influencer.organizationId !== currentUser.organizationId && (
                    <span className="inline-flex items-center rounded-sm bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 select-none">
                      Created by Other
                    </span>
                  )}
                  {influencer.verified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-100">
                      <BadgeCheck size={11} className="text-sky-500" /> Verified
                    </span>
                  )}
                  {influencer.brandSafe && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                      <ShieldCheck size={11} className="text-emerald-500" /> Brand Safe
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                  {influencer.profileLink ? (
                    <a
                      href={influencer.profileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-bold"
                    >
                      @{influencer.username}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="font-bold text-slate-700">@{influencer.username}</span>
                  )}
                  <span>·</span>
                  <span className="font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">{influencer.platform}</span>
                  <span>·</span>
                  <span className="text-slate-600 font-semibold">{influencer.category}</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-white p-0 italic leading-relaxed">
                {influencer.bio || 'No bio on file yet.'}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-slate-500">
                <div>Country: <span className="text-slate-800">{influencer.country}</span></div>
                {influencer.language && (
                  <>
                    <div className="text-slate-300">•</div>
                    <div>Language: <span className="text-slate-800">{influencer.language}</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Right side contact block */}
            <div className="flex-shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 space-y-2.5 min-w-[200px]">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Channels</h4>
              <div className="space-y-1.5 text-xs">
                {influencer.email ? (
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Mail size={13} className="text-slate-400 flex-shrink-0" />
                    <a href={`mailto:${influencer.email}`} className="hover:text-indigo-600 hover:underline truncate">
                      {influencer.email}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 italic">
                    <Mail size={13} className="flex-shrink-0" />
                    <span>No email added</span>
                  </div>
                )}
                {influencer.phone ? (
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Phone size={13} className="text-slate-400 flex-shrink-0" />
                    <a href={`tel:${influencer.phone}`} className="hover:text-indigo-600 hover:underline">
                      {influencer.phone}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 italic">
                    <Phone size={13} className="flex-shrink-0" />
                    <span>No phone added</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {deleteInfluencer.isError && (
          <p className="text-xs text-red-600">
            Couldn't delete this creator{deleteInfluencer.error instanceof Error ? `: ${deleteInfluencer.error.message}` : '.'}
          </p>
        )}

        {/* SECTION 2: Unified Metrics & Performance Section */}
        <section className="rounded border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            Performance & Financial Metrics
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Followers"
              value={formatValue(influencer.followers)}
              tooltip="Total registered follower or subscriber count across this specific social network."
            />
            <StatCard
              label="Following"
              value={formatValue(influencer.following)}
              tooltip="Total count of accounts or users this creator is currently following."
            />
            <StatCard
              label="Total Posts"
              value={formatValue(influencer.totalPosts)}
              tooltip="Total number of published posts on the creator's channel."
            />
            <StatCard
              label="Engagement"
              value={formatValue(influencer.engagementRate, true)}
              tooltip="Engagement Rate = (Likes + Comments) / Followers. Measures how actively the creator's audience interacts with posts."
            />
            <StatCard
              label="Total Views"
              value={formatValue(influencer.averageViews)}
              tooltip="Total video views or impressions recorded across the creator's content."
            />
            <StatCard
              label="Total Likes / Comments"
              value={`${formatValue(influencer.averageLikes)} / ${formatValue(influencer.averageComments)}`}
              tooltip="The overall count of post likes and comments across the creator's published content."
            />
            <StatCard
              label="Price per Post"
              value={formatValue(influencer.pricePost, false, true, organization?.currency)}
              tooltip="Baseline flat fee charged by this creator for a single main-feed post publication."
            />
            <StatCard
              label="Price per Story"
              value={formatValue(influencer.priceStory, false, true, organization?.currency)}
              tooltip="Baseline flat fee charged by this creator for a temporary (24-hour) story publication."
            />
            <StatCard
              label="ROI"
              value={formatValue(influencer.roi, true)}
              tooltip="Return on Investment = (Campaign Revenue - Cost) / Cost. Indicates the financial efficiency and profitability of this creator."
            />
            <StatCard
              label="CPA / CPI / LTV"
              value={`${formatValue(influencer.cpa, false, true, organization?.currency)} / ${formatValue(influencer.cpi, false, true, organization?.currency)} / ${formatValue(influencer.ltv, false, true, organization?.currency)}`}
              tooltip="Key funnels: Cost Per Acquisition (CPA), Cost Per Install/Click (CPI), and referred customer Lifetime Value (LTV)."
            />
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Growth history</h3>
            <GrowthChart snapshots={snapshots} metric="followers" />
          </section>

          <section className="rounded border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Engagement history</h3>
            <GrowthChart snapshots={snapshots} metric="engagementRate" />
          </section>
        </div>

        <section className="rounded border border-slate-200 bg-white p-4 shadow-xs">
          <h3 className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Tags</h3>
          <TagSelector
            tags={tags}
            suggestions={orgTags}
            isBusy={addTag.isPending || removeTag.isPending}
            onAdd={(name) => addTag.mutate(name)}
            onRemove={(tagId) => removeTag.mutate(tagId)}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Notes</h3>
            <NotesPanel
              notes={notes}
              isLoading={notesLoading}
              isSubmitting={addNote.isPending}
              onAdd={(body) => addNote.mutate(body)}
              onRemove={(noteId) => removeNote.mutate(noteId)}
            />
          </section>

          <section className="rounded border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Campaign history</h3>
            <CampaignHistoryList items={campaignHistory} isLoading={campaignsLoading} />
          </section>
        </div>
      </div>

      <InfluencerFormModal
        isOpen={isEditOpen}
        influencer={influencer}
        isSubmitting={updateInfluencer.isPending}
        errorMessage={updateInfluencer.error instanceof Error ? updateInfluencer.error.message : null}
        onClose={() => setIsEditOpen(false)}
        onSubmit={(data) => {
          if (!id) return
          updateInfluencer.mutate(
            { id, data },
            { onSuccess: () => setIsEditOpen(false) }
          )
        }}
      />
    </PageShell>
  )
}

export default InfluencerProfilePage
