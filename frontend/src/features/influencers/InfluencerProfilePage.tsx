import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Mail, Phone, ShieldCheck } from 'lucide-react'
import PageShell from '../../components/shared/PageShell'
import { Avatar } from '../../components/shared/Avatar'
import { CampaignHistoryList } from './components/CampaignHistoryList'
import { GrowthChart } from './components/GrowthChart'
import { NotesPanel } from './components/NotesPanel'
import { PipelineStatusSelect } from './components/PipelineStatusSelect'
import { TagSelector } from './components/TagSelector'
import {
  useAddInfluencerNote,
  useAddInfluencerTag,
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  )
}

function InfluencerProfilePage() {
  const { id } = useParams<{ id: string }>()

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

  if (isLoading) {
    return (
      <PageShell title="Influencer Profile" description="Loading creator details…" eyebrow="Creator operations">
        <p className="text-sm text-slate-400">Loading…</p>
      </PageShell>
    )
  }

  if (isError || !influencer) {
    return (
      <PageShell title="Influencer Profile" description="We couldn't find this creator." eyebrow="Creator operations">
        <Link to="/influencers" className="text-sm text-cyan-400 hover:underline">
          ← Back to influencers
        </Link>
      </PageShell>
    )
  }

  const handlePipelineChange = (pipelineStatus: PipelineStatus) => {
    if (!id) return
    updateInfluencer.mutate({ id, data: { pipelineStatus } })
  }

  return (
    <PageShell
      title={influencer.fullName}
      description={influencer.bio || 'No bio on file yet.'}
      eyebrow="Creator profile"
      action={<PipelineStatusSelect value={influencer.pipelineStatus} onChange={handlePipelineChange} disabled={updateInfluencer.isPending} />}
    >
      <div className="space-y-6">
        <Link to="/influencers" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={14} /> Back to all creators
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={influencer.fullName} imageUrl={influencer.profileImage} size={64} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-white">{influencer.fullName}</h2>
                {influencer.verified && <BadgeCheck size={18} className="text-sky-400" />}
                {influencer.brandSafe && <ShieldCheck size={18} className="text-emerald-400" />}
              </div>
              <p className="text-sm text-slate-400">
                {influencer.username} · {influencer.platform} · {influencer.category}
              </p>
              <p className="text-xs text-slate-500">
                {influencer.country}
                {influencer.language ? ` · ${influencer.language}` : ''}
              </p>
            </div>
            <div className="ml-auto flex flex-col gap-1 text-sm text-slate-300">
              {influencer.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-500" /> {influencer.email}
                </span>
              )}
              {influencer.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-500" /> {influencer.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Followers" value={influencer.followers.toLocaleString()} />
          <StatCard label="Engagement" value={`${influencer.engagementRate.toFixed(1)}%`} />
          <StatCard label="Avg. Views" value={influencer.averageViews.toLocaleString()} />
          <StatCard label="Avg. Likes / Comments" value={`${influencer.averageLikes.toLocaleString()} / ${influencer.averageComments.toLocaleString()}`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="mb-3 text-lg font-semibold text-white">Growth history</h3>
            <GrowthChart snapshots={snapshots} metric="followers" />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="mb-3 text-lg font-semibold text-white">Engagement history</h3>
            <GrowthChart snapshots={snapshots} metric="engagementRate" />
          </section>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="mb-3 text-lg font-semibold text-white">Tags</h3>
          <TagSelector
            tags={tags}
            suggestions={orgTags}
            isBusy={addTag.isPending || removeTag.isPending}
            onAdd={(name) => addTag.mutate(name)}
            onRemove={(tagId) => removeTag.mutate(tagId)}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="mb-3 text-lg font-semibold text-white">Notes</h3>
            <NotesPanel
              notes={notes}
              isLoading={notesLoading}
              isSubmitting={addNote.isPending}
              onAdd={(body) => addNote.mutate(body)}
              onRemove={(noteId) => removeNote.mutate(noteId)}
            />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="mb-3 text-lg font-semibold text-white">Campaign history</h3>
            <CampaignHistoryList items={campaignHistory} isLoading={campaignsLoading} />
          </section>
        </div>
      </div>
    </PageShell>
  )
}

export default InfluencerProfilePage
