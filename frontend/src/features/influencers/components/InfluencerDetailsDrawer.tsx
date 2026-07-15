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
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioVal, setBioVal] = useState('')

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
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl p-5 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header toolbar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
          {influencer ? (
            <Link
              to={`/influencers/${influencer.id}`}
              className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 rounded group flex-1 min-w-0"
              title="Click to view full detail page"
            >
              <Avatar name={influencer.fullName} imageUrl={influencer.profileImage} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-black transition truncate">{influencer.fullName}</h4>
                  {influencer.verified && (
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100 text-slate-800 text-[9px] font-bold">✓</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                  @{influencer.username} · {influencer.platform} · {influencer.followers?.toLocaleString() || 0} followers
                </p>
              </div>
              <ExternalLink size={12} className="text-slate-400 group-hover:text-slate-900 transition flex-shrink-0" />
            </Link>
          ) : (
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Creator Profile Inspector</span>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-8 w-8 inline-flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {isLoading || !influencer ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs py-12 animate-pulse">
            <p>Gathering fresh creator insights...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Quick header card */}
            <div className="py-3 flex items-center gap-4">
              <Avatar name={influencer.fullName} imageUrl={influencer.profileImage} size={52} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 truncate">{influencer.fullName}</h3>
                  {influencer.verified && (
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100 text-slate-800 text-[9px] font-bold">✓</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">@{influencer.username} · {influencer.platform}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <PipelineStatusSelect
                    value={influencer.pipelineStatus}
                    onChange={(val) => updateInfluencer.mutate({ id: influencer.id, data: { pipelineStatus: val } })}
                    disabled={updateInfluencer.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Navigation tabs */}
            <div className="flex border-b border-slate-100 mb-3">
              {(['overview', 'analytics', 'notes', 'campaigns'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                    activeTab === tab
                      ? 'border-black text-slate-950'
                      : 'border-transparent text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content scroll viewport */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 min-h-0 themed-scrollbar">
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  {/* Bio */}
                  <div className="rounded border border-slate-200 bg-white p-3.5 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">About / Bio</p>
                      {!isEditingBio ? (
                        <button
                          onClick={() => {
                            setBioVal(influencer.bio || '')
                            setIsEditingBio(true)
                          }}
                          className="text-[10px] font-bold text-slate-900 hover:underline cursor-pointer"
                        >
                          {influencer.bio ? 'Edit' : 'Add Bio'}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setIsEditingBio(false)
                              setBioVal(influencer.bio || '')
                            }}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-900 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              updateInfluencer.mutate(
                                { id: influencer.id, data: { bio: bioVal } },
                                {
                                  onSuccess: () => setIsEditingBio(false),
                                }
                              )
                            }}
                            className="text-[10px] font-bold text-black hover:underline cursor-pointer"
                            disabled={updateInfluencer.isPending}
                          >
                            {updateInfluencer.isPending ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditingBio ? (
                      <textarea
                        value={bioVal}
                        onChange={(e) => setBioVal(e.target.value)}
                        placeholder="Write something about this creator..."
                        className="block w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:border-slate-900 focus:ring-0 transition h-20 resize-none"
                      />
                    ) : (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {influencer.bio || (
                          <span
                            className="text-slate-400 italic cursor-pointer"
                            onClick={() => {
                              setBioVal(influencer.bio || '')
                              setIsEditingBio(true)
                            }}
                          >
                            No bio on file. Click to add one.
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Quick Profile fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded border border-slate-200 bg-white p-3 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Niche Category</span>
                      <span className="text-xs font-bold text-slate-900">{influencer.category || 'Lifestyle'}</span>
                    </div>
                    <div className="rounded border border-slate-200 bg-white p-3 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Region</span>
                      <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1">
                        <Globe size={11} className="text-slate-400" />
                        {influencer.country || 'International'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="rounded border border-slate-200 bg-white p-3 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pricing Matrix</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center justify-between border-r border-slate-100 pr-3">
                        <span className="text-slate-500 font-bold">Post Rate:</span>
                        <span className="text-slate-900 font-extrabold inline-flex items-center">
                          <DollarSign size={12} className="text-emerald-600" />
                          {(influencer.pricePost ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pl-3">
                        <span className="text-slate-500 font-bold">Story Rate:</span>
                        <span className="text-slate-900 font-extrabold inline-flex items-center">
                          <DollarSign size={12} className="text-emerald-600" />
                          {(influencer.priceStory ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Methods */}
                  <div className="rounded border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Outreach & Channels</p>
                    {influencer.email && (
                      <div className="flex items-center gap-2 text-xs">
                        <Mail size={12} className="text-slate-400" />
                        <span className="text-slate-700 font-bold">{influencer.email}</span>
                      </div>
                    )}
                    {influencer.phone && (
                      <div className="flex items-center gap-2 text-xs">
                        <Phone size={12} className="text-slate-400" />
                        <span className="text-slate-700 font-bold">{influencer.phone}</span>
                      </div>
                    )}
                    {!influencer.email && !influencer.phone && (
                      <p className="text-xs text-slate-400">No contact credentials logged.</p>
                    )}
                  </div>

                  {/* Interactive Tags list */}
                  <div className="rounded border border-slate-200 bg-white p-3.5 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category Labels & Tags</p>
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
                <div className="space-y-3">
                  {/* Stats grids */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded border border-slate-200 bg-white p-3 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Followers</span>
                      <span className="text-sm font-extrabold text-slate-900">{influencer.followers.toLocaleString()}</span>
                    </div>
                    <div className="rounded border border-slate-200 bg-white p-3 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Eng. Rate</span>
                      <span className="text-sm font-extrabold text-slate-900">{influencer.engagementRate.toFixed(1)}%</span>
                    </div>
                    <div className="rounded border border-slate-200 bg-white p-3 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Avg. Views</span>
                      <span className="text-sm font-extrabold text-slate-900">{(influencer.averageViews ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="rounded border border-slate-200 bg-white p-3 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Avg. Likes / Comments</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {((influencer.averageLikes ?? 0) + (influencer.averageComments ?? 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* SVG charts */}
                  <div className="rounded border border-slate-200 bg-white p-3 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Audience Growth Timeline</p>
                    <GrowthChart snapshots={snapshots} metric="followers" />
                  </div>

                  <div className="rounded border border-slate-200 bg-white p-3 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Engagement Rate Timeline</p>
                    <GrowthChart snapshots={snapshots} metric="engagementRate" />
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-3">
                  {/* Autosaving Notepad Area */}
                  <div className="rounded border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Notes Notepad</span>
                      {saveStatus === 'saving' && <span className="text-[10px] text-slate-900 animate-pulse font-bold">Autosaving...</span>}
                      {saveStatus === 'saved' && <span className="text-[10px] text-emerald-600 font-bold">Notes updated!</span>}
                    </div>
                    <textarea
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      onBlur={handleNoteSave}
                      placeholder="Add a new quick note and blur the field to autosave..."
                      className="block w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:border-slate-900 focus:ring-0 transition h-20 resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleNoteSave}
                        disabled={!noteBody.trim()}
                        className="rounded bg-black px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>

                  {/* Chronological list */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chronological Logs ({notes.length})</span>
                    {notes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No historical timeline notes added yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {notes.map((n) => (
                          <div key={n.id} className="rounded border border-slate-100 bg-slate-50 p-3 flex items-start justify-between gap-3 shadow-2xs">
                            <div>
                              <p className="text-xs text-slate-800 leading-relaxed font-medium">{n.body}</p>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 block">
                                {new Date(n.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeNote.mutate(n.id)}
                              className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Delete log entry"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'campaigns' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Campaign Association History</span>
                  {campaignHistory.length === 0 ? (
                    <div className="rounded border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                      No active or past campaign history associated with this creator.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {campaignHistory.map((c) => (
                        <div key={c.campaignId} className="rounded border border-slate-200 bg-white p-3 flex items-center justify-between shadow-xs">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{c.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Client: {c.clientName}</p>
                          </div>
                          <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
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
