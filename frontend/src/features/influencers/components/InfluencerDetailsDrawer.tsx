import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Globe, Mail, Phone, ExternalLink, Trash2, DollarSign } from 'lucide-react'
import { Avatar } from '../../../components/shared/Avatar'
import { GrowthChart } from './GrowthChart'
import { TagSelector } from './TagSelector'
import { PipelineStatusSelect } from './PipelineStatusSelect'
import {
  useInfluencer,
  useInfluencerTags,
  useOrgTags,
  useAddInfluencerTag,
  useRemoveInfluencerTag,
  useInfluencerNotes,
  useAddInfluencerNote,
  useRemoveInfluencerNote,
  useUpdateInfluencer,
  useInfluencerCampaignHistory,
  useInfluencerSnapshots,
} from '../hooks/useInfluencers'

type InfluencerDetailsDrawerProps = {
  influencerId: string | null
  onClose: () => void
}

export function InfluencerDetailsDrawer({ influencerId, onClose }: InfluencerDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'notes' | 'campaigns'>('overview')
  const [noteBody, setNoteBody] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Freshly query details
  const { data: influencer, isLoading } = useInfluencer(influencerId ?? undefined)
  const { data: tags = [] } = useInfluencerTags(influencerId ?? undefined)
  const { data: orgTags = [] } = useOrgTags()
  const { data: notes = [] } = useInfluencerNotes(influencerId ?? undefined)
  const { data: campaignHistory = [] } = useInfluencerCampaignHistory(influencerId ?? undefined)
  const { data: snapshots = [] } = useInfluencerSnapshots(influencerId ?? undefined)

  const addTag = useAddInfluencerTag(influencerId ?? '')
  const removeTag = useRemoveInfluencerTag(influencerId ?? '')
  const addNote = useAddInfluencerNote(influencerId ?? '')
  const removeNote = useRemoveInfluencerNote(influencerId ?? '')
  const updateInfluencer = useUpdateInfluencer()

  // Auto-save local draft note on typing
  const handleNoteSave = () => {
    if (!noteBody.trim() || !influencerId) return
    setSaveStatus('saving')
    addNote.mutate(noteBody.trim(), {
      onSuccess: () => {
        setNoteBody('')
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      },
      onError: () => setSaveStatus('idle'),
    })
  }

  // Escape key close
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!influencerId) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-950 border-l border-slate-800 shadow-2xl p-6 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header toolbar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Creator Profile Inspector</span>
          <div className="flex items-center gap-2">
            <Link
              to={`/influencers/${influencerId}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 px-3 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-600 transition"
            >
              <ExternalLink size={12} />
              <span>Full Page</span>
            </Link>
            <button
              onClick={onClose}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white transition"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {isLoading || !influencer ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm py-12 animate-pulse">
            <p>Gathering fresh creator insights...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Quick header card */}
            <div className="py-4 flex items-center gap-4">
              <Avatar name={influencer.fullName} imageUrl={influencer.profileImage} size={52} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-white truncate">{influencer.fullName}</h3>
                  {influencer.verified && (
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 text-[9px]">✓</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">@{influencer.username} · {influencer.platform}</p>
                <div className="mt-1 flex items-center gap-2">
                  <PipelineStatusSelect
                    value={influencer.pipelineStatus}
                    onChange={(val) => updateInfluencer.mutate({ id: influencer.id, data: { pipelineStatus: val } })}
                    disabled={updateInfluencer.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Navigation tabs */}
            <div className="flex border-b border-slate-800/80 mb-4">
              {(['overview', 'analytics', 'notes', 'campaigns'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                    activeTab === tab
                      ? 'border-cyan-500 text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content scroll viewport */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-6 min-h-0">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Bio */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3.5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">About / Bio</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{influencer.bio || 'No bio on file.'}</p>
                  </div>

                  {/* Quick Profile fields */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Niche Category</span>
                      <span className="text-xs font-semibold text-white">{influencer.category || 'Lifestyle'}</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Region</span>
                      <span className="text-xs font-semibold text-white inline-flex items-center gap-1">
                        <Globe size={11} className="text-cyan-400" />
                        {influencer.country || 'International'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3.5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Pricing Matrix</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center justify-between border-r border-slate-800/80 pr-3">
                        <span className="text-slate-500 font-semibold">Post Rate:</span>
                        <span className="text-white font-bold inline-flex items-center">
                          <DollarSign size={12} className="text-emerald-500" />
                          {(influencer.pricePost ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pl-3">
                        <span className="text-slate-500 font-semibold">Story Rate:</span>
                        <span className="text-white font-bold inline-flex items-center">
                          <DollarSign size={12} className="text-emerald-500" />
                          {(influencer.priceStory ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Methods */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3.5 space-y-2.5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outreach & Channels</p>
                    {influencer.email && (
                      <div className="flex items-center gap-2 text-xs">
                        <Mail size={12} className="text-slate-400" />
                        <span className="text-slate-300 font-semibold">{influencer.email}</span>
                      </div>
                    )}
                    {influencer.phone && (
                      <div className="flex items-center gap-2 text-xs">
                        <Phone size={12} className="text-slate-400" />
                        <span className="text-slate-300 font-semibold">{influencer.phone}</span>
                      </div>
                    )}
                    {!influencer.email && !influencer.phone && (
                      <p className="text-xs text-slate-600">No contact credentials logged.</p>
                    )}
                  </div>

                  {/* Interactive Tags list */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3.5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category Labels & Tags</p>
                    <TagSelector
                      tags={tags}
                      suggestions={orgTags}
                      isBusy={addTag.isPending || removeTag.isPending}
                      onAdd={(name) => addTag.mutate(name)}
                      onRemove={(tagId) => removeTag.mutate(tagId)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  {/* Stats grids */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <span className="text-slate-500 font-bold block mb-1">Followers</span>
                      <span className="text-sm font-bold text-white">{influencer.followers.toLocaleString()}</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <span className="text-slate-500 font-bold block mb-1">Eng. Rate</span>
                      <span className="text-sm font-bold text-cyan-400">{influencer.engagementRate.toFixed(1)}%</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <span className="text-slate-500 font-bold block mb-1">Avg. Views</span>
                      <span className="text-sm font-bold text-white">{(influencer.averageViews ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <span className="text-slate-500 font-bold block mb-1">Avg. Likes / Comments</span>
                      <span className="text-sm font-bold text-white">
                        {((influencer.averageLikes ?? 0) + (influencer.averageComments ?? 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* SVG charts */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Audience Growth Timeline</p>
                    <GrowthChart snapshots={snapshots} metric="followers" />
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Engagement Rate Timeline</p>
                    <GrowthChart snapshots={snapshots} metric="engagementRate" />
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {/* Autosaving Notepad Area */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fast Notes Notepad</span>
                      {saveStatus === 'saving' && <span className="text-[10px] text-cyan-400 animate-pulse">Autosaving...</span>}
                      {saveStatus === 'saved' && <span className="text-[10px] text-emerald-400">Notes updated!</span>}
                    </div>
                    <textarea
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      onBlur={handleNoteSave}
                      placeholder="Add a new quick note and blur the field to autosave..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition h-20 resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleNoteSave}
                        disabled={!noteBody.trim()}
                        className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>

                  {/* Chronological list */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chronological Logs ({notes.length})</span>
                    {notes.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">No historical timeline notes added yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {notes.map((n) => (
                          <div key={n.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-slate-300 leading-relaxed">{n.body}</p>
                              <span className="text-[10px] text-slate-500 mt-1.5 block">
                                {new Date(n.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeNote.mutate(n.id)}
                              className="text-slate-600 hover:text-rose-400 transition"
                              title="Delete log entry"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'campaigns' && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Association History</span>
                  {campaignHistory.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                      No active or past campaign history associated with this creator.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {campaignHistory.map((c) => (
                        <div key={c.campaignId} className="rounded-xl border border-slate-800 bg-slate-900/20 p-3.5 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-white">{c.name}</p>
                            <p className="text-[10px] text-slate-500">Client: {c.clientName}</p>
                          </div>
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 font-semibold">
                            {c.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
