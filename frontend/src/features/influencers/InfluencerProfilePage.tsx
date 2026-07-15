import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Mail, Pencil, Phone, ShieldCheck, Trash2 } from 'lucide-react'
import PageShell from '../../components/shared/PageShell'
import { Avatar } from '../../components/shared/Avatar'
import { CampaignHistoryList } from './components/CampaignHistoryList'
import { GrowthChart } from './components/GrowthChart'
import { InfluencerFormModal } from './components/AddInfluencerModal'
import { NotesPanel } from './components/NotesPanel'
import { PipelineStatusSelect } from './components/PipelineStatusSelect'
import { TagSelector } from './components/TagSelector'
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3.5 shadow-xs">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  )
}

function InfluencerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

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
      title={influencer.fullName}
      description={influencer.bio || 'No bio on file yet.'}
      eyebrow="Creator profile"
      action={<PipelineStatusSelect value={influencer.pipelineStatus} onChange={handlePipelineChange} disabled={updateInfluencer.isPending} />}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/influencers" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-black font-bold">
            <ArrowLeft size={13} /> Back to all creators
          </Link>

          <div className="flex items-center gap-2">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                <span>Delete this creator?</span>
                <button
                  type="button"
                  onClick={handleDeleteConfirmed}
                  disabled={deleteInfluencer.isPending}
                  className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                >
                  {deleteInfluencer.isPending ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:text-black hover:bg-slate-50 font-bold transition cursor-pointer"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2.5 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-bold transition cursor-pointer"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        {deleteInfluencer.isError && (
          <p className="text-xs text-red-600">
            Couldn't delete this creator{deleteInfluencer.error instanceof Error ? `: ${deleteInfluencer.error.message}` : '.'}
          </p>
        )}

        <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={influencer.fullName} imageUrl={influencer.profileImage} size={48} />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-extrabold text-slate-900">{influencer.fullName}</h2>
                {influencer.verified && <BadgeCheck size={14} className="text-sky-500" />}
                {influencer.brandSafe && <ShieldCheck size={14} className="text-emerald-500" />}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {influencer.username} · {influencer.platform} · {influencer.category}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {influencer.country}
                {influencer.language ? ` · ${influencer.language}` : ''}
              </p>
            </div>
            <div className="ml-auto flex flex-col gap-0.5 text-xs text-slate-600">
              {influencer.email && (
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Mail size={12} className="text-slate-400" /> {influencer.email}
                </span>
              )}
              {influencer.phone && (
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Phone size={12} className="text-slate-400" /> {influencer.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Followers" value={influencer.followers.toLocaleString()} />
          <StatCard label="Engagement" value={`${influencer.engagementRate.toFixed(1)}%`} />
          <StatCard label="Avg. Views" value={influencer.averageViews.toLocaleString()} />
          <StatCard label="Avg. Likes / Comments" value={`${influencer.averageLikes.toLocaleString()} / ${influencer.averageComments.toLocaleString()}`} />
        </div>

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
