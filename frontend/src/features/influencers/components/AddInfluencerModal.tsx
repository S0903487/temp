/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { X, UploadCloud, Link2, Loader2 } from 'lucide-react'
import { Avatar } from '../../../components/shared/Avatar'
import { Select, fieldClass, textAreaClass, labelClass } from '../../../components/shared/fields'
import { COUNTRIES } from '../../../lib/countries'
import { resizeImageToWebp, blobToDataUrl } from '../../../lib/image'
import { fetchRemoteImage } from '../../../lib/uploads'
import type { Influencer, Platform } from '../types'
import type { CreateInfluencerInput } from '../services/influencerService'

type InfluencerFormModalProps = {
  isOpen: boolean
  isSubmitting: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (data: CreateInfluencerInput) => void
  /** When provided, the modal opens pre-filled for editing this creator instead of creating a new one. */
  influencer?: Influencer | null
}

const defaultForm = {
  fullName: '',
  username: '',
  bio: '',
  platform: 'Instagram' as Platform,
  category: 'Lifestyle',
  country: 'United States',
  language: 'English',
  email: '',
  phone: '',
  notes: '',
  status: 'Active' as Influencer['status'],
  profileImage: '',
  followers: '',
  engagementRate: '',
  averageViews: '',
  averageLikes: '',
  averageComments: '',
  pricePost: '',
  priceStory: '',
  verified: false,
  brandSafe: true,
}

type FormState = typeof defaultForm

function formFromInfluencer(influencer: Influencer): FormState {
  return {
    fullName: influencer.fullName,
    username: influencer.username,
    bio: influencer.bio ?? '',
    platform: influencer.platform,
    category: influencer.category,
    country: influencer.country,
    language: influencer.language,
    email: influencer.email ?? '',
    phone: influencer.phone ?? '',
    notes: influencer.notes ?? '',
    status: influencer.status,
    profileImage: influencer.profileImage ?? '',
    followers: influencer.followers ? String(influencer.followers) : '',
    engagementRate: influencer.engagementRate ? String(influencer.engagementRate) : '',
    averageViews: influencer.averageViews ? String(influencer.averageViews) : '',
    averageLikes: influencer.averageLikes ? String(influencer.averageLikes) : '',
    averageComments: influencer.averageComments ? String(influencer.averageComments) : '',
    pricePost: influencer.pricePost ? String(influencer.pricePost) : '',
    priceStory: influencer.priceStory ? String(influencer.priceStory) : '',
    verified: influencer.verified,
    brandSafe: influencer.brandSafe,
  }
}

function validateUsername(username: string): boolean {
  const clean = username.replace(/^@/, '')
  if (!clean || clean.length < 2) return false
  // TikTok/Instagram usernames only allow alphanumeric, underscore, dot
  const regex = /^[a-zA-Z0-9._]+$/
  return regex.test(clean)
}

export function InfluencerFormModal({
  isOpen,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
  influencer,
}: InfluencerFormModalProps) {
  const isEditing = Boolean(influencer)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload')
  const [localValError, setLocalValError] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  // What the user typed in the URL tab — kept separate from form.profileImage,
  // which only ever holds a data URL we've actually resized (either from a
  // local file pick, or after importing+resizing a pasted external link).
  const [urlDraft, setUrlDraft] = useState('')

  // Re-sync the form whenever the modal is opened, either with the
  // creator being edited or a blank slate for a new one.
  useEffect(() => {
    if (!isOpen) return
    const initialForm = influencer ? formFromInfluencer(influencer) : defaultForm
    setForm(initialForm)
    setLocalValError(null)
    setImageError(null)
    setUrlDraft(initialForm.profileImage ?? '')

    // Auto-detect whether current image is an upload (base64) or a direct url
    if (initialForm.profileImage && (initialForm.profileImage.startsWith('http://') || initialForm.profileImage.startsWith('https://'))) {
      setImageSource('url')
    } else {
      setImageSource('upload')
    }
  }, [isOpen, influencer])

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Please upload an image file.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageError('File is too large. Max file size is 8MB.')
      return
    }

    setImageError(null)
    setImageUploading(true)
    try {
      // Resize to a 256x256 WebP in-browser, then store that small
      // (~10-40KB) result directly as a data URL on the record — not the
      // multi-MB original, which is what made list/search pages slow
      // when this used to save the raw picked file as base64.
      const resized = await resizeImageToWebp(file, 256)
      const dataUrl = await blobToDataUrl(resized)
      setForm((current) => ({ ...current, profileImage: dataUrl }))
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not process that image.')
    } finally {
      setImageUploading(false)
    }
  }

  /**
   * Fetches a pasted external link (e.g. an Instagram/TikTok profile photo
   * URL) through our backend, since saving that URL directly tends to
   * render as a broken image (those CDNs typically block hotlinking from
   * another origin). The fetched bytes are then resized exactly like a
   * local upload, so the end result is the same small data URL either way.
   */
  const handleImportUrl = async () => {
    const trimmed = urlDraft.trim()
    if (!trimmed) return
    setImageError(null)
    setImageUploading(true)
    try {
      const remoteBlob = await fetchRemoteImage(trimmed)
      const resized = await resizeImageToWebp(remoteBlob, 256)
      const dataUrl = await blobToDataUrl(resized)
      setForm((current) => ({ ...current, profileImage: dataUrl }))
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not import that image URL.')
    } finally {
      setImageUploading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  const toNumber = (value: string) => (value.trim() === '' ? undefined : Number(value))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.fullName.trim()) return

    const safeUsername = form.username.trim() ? (form.username.trim().startsWith('@') ? form.username.trim() : `@${form.username.trim()}`) : `@${form.fullName.replace(/\s+/g, '').toLowerCase()}`

    if (!validateUsername(safeUsername)) {
      setLocalValError('Invalid handle structure. Social handles can only contain letters, numbers, underscores, and dots (no spaces).')
      return
    }

    setLocalValError(null)
    onSubmit({
      fullName: form.fullName.trim(),
      username: safeUsername,
      bio: form.bio.trim() || undefined,
      platform: form.platform,
      category: form.category,
      country: form.country,
      language: form.language,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
      tags: isEditing ? undefined : ['New Lead'],
      profileImage: form.profileImage.trim() || undefined,
      followers: toNumber(form.followers),
      engagementRate: toNumber(form.engagementRate),
      averageViews: toNumber(form.averageViews),
      averageLikes: toNumber(form.averageLikes),
      averageComments: toNumber(form.averageComments),
      pricePost: toNumber(form.pricePost),
      priceStory: toNumber(form.priceStory),
      verified: form.verified,
      brandSafe: form.brandSafe,
    })
  }

  const isUsernameValid = form.username ? validateUsername(form.username) : true

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
              {isEditing ? 'Edit creator' : 'Quick capture'}
            </p>
            <h2 className="text-xl font-semibold text-white">
              {isEditing ? `Edit ${influencer?.fullName ?? 'influencer'}` : 'Add influencer'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>

        {(errorMessage || localValError || imageError) && (
          <p className="mt-4 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300 flex-shrink-0">
            {errorMessage || localValError || imageError}
          </p>
        )}

        <form className="mt-6 flex-1 overflow-y-auto pr-1 grid gap-4 md:grid-cols-2 themed-scrollbar" onSubmit={handleSubmit}>
          <label className={labelClass}>
            <span className="mb-2 block">Full name</span>
            <input
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              className={fieldClass}
              required
            />
          </label>
          <div className="flex flex-col">
            <label className={labelClass}>
              <span className="mb-2 block flex items-center justify-between">
                <span>Username / Handle</span>
                {form.username && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isUsernameValid ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isUsernameValid ? '✓ Valid format' : '✗ Invalid handle'}
                  </span>
                )}
              </span>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold select-none">@</span>
                <input
                  value={form.username.replace(/^@/, '')}
                  onChange={(event) => {
                    const val = event.target.value.replace(/\s+/g, '') // remove spaces directly
                    setForm((current) => ({ ...current, username: val ? `@${val}` : '' }))
                    setLocalValError(null)
                  }}
                  placeholder="creator_handle"
                  className={`${fieldClass} pl-7`}
                  required
                />
              </div>
            </label>
            {form.username && !isUsernameValid && (
              <p className="text-[10px] text-rose-400 mt-1">
                Handles can only contain alphanumeric characters, underscores, and dots.
              </p>
            )}
          </div>
          <label className={labelClass}>
            <span className="mb-2 block">Platform</span>
            <Select
              value={form.platform}
              onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value as Platform }))}
            >
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
            </Select>
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Category</span>
            <input
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Country</span>
            <Select
              value={form.country}
              onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Email</span>
            <input
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Status</span>
            <Select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Influencer['status'] }))}
            >
              <option value="Active">Active</option>
              <option value="Review">Review</option>
              <option value="Paused">Paused</option>
              <option value="Booked">Booked</option>
            </Select>
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Phone</span>
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className={fieldClass}
            />
          </label>

          <div className="md:col-span-2 border-t border-slate-800 pt-4">
            <p className="text-sm font-semibold text-slate-300">Stats</p>
            <p className="text-xs text-slate-500">
              Updating these logs a new growth snapshot, so the profile chart tracks change over time.
            </p>
          </div>
          <label className={labelClass}>
            <span className="mb-2 block">Followers</span>
            <input
              type="number"
              min="0"
              value={form.followers}
              onChange={(event) => setForm((current) => ({ ...current, followers: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Engagement rate (%)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.engagementRate}
              onChange={(event) => setForm((current) => ({ ...current, engagementRate: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Avg. views</span>
            <input
              type="number"
              min="0"
              value={form.averageViews}
              onChange={(event) => setForm((current) => ({ ...current, averageViews: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Avg. likes</span>
            <input
              type="number"
              min="0"
              value={form.averageLikes}
              onChange={(event) => setForm((current) => ({ ...current, averageLikes: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Avg. comments</span>
            <input
              type="number"
              min="0"
              value={form.averageComments}
              onChange={(event) => setForm((current) => ({ ...current, averageComments: event.target.value }))}
              className={fieldClass}
            />
          </label>

          <div className="md:col-span-2 border-t border-slate-800 pt-4">
            <p className="text-sm font-semibold text-slate-300">Pricing &amp; trust</p>
          </div>
          <label className={labelClass}>
            <span className="mb-2 block">Price per post</span>
            <input
              type="number"
              min="0"
              value={form.pricePost}
              onChange={(event) => setForm((current) => ({ ...current, pricePost: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Price per story</span>
            <input
              type="number"
              min="0"
              value={form.priceStory}
              onChange={(event) => setForm((current) => ({ ...current, priceStory: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <div className="flex items-center gap-6 md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.verified}
                onChange={(event) => setForm((current) => ({ ...current, verified: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 accent-cyan-500"
              />
              Verified account
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.brandSafe}
                onChange={(event) => setForm((current) => ({ ...current, brandSafe: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 accent-cyan-500"
              />
              Brand safe
            </label>
          </div>

          <div className="md:col-span-2 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-300">Profile image</span>
              <div className="flex gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setImageSource('upload')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    imageSource === 'upload'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud size={12} /> Upload file
                </button>
                <button
                  type="button"
                  onClick={() => setImageSource('url')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    imageSource === 'url'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Link2 size={12} /> URL path
                </button>
              </div>
            </div>

            {imageSource === 'upload' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-950/20 p-3 rounded-2xl border border-slate-800/50">
                  <Avatar name={form.fullName || 'New Creator'} imageUrl={form.profileImage} size={56} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">
                      {imageUploading ? 'Processing…' : form.profileImage ? 'Ready to save image' : 'No image loaded'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {imageUploading
                        ? 'Resizing to 256×256…'
                        : form.profileImage
                          ? 'Resized and ready — this stays attached to the record.'
                          : 'Drag an image below or click to choose.'}
                    </p>
                    {form.profileImage && !imageUploading && (
                      <button
                        type="button"
                        onClick={() => setForm((c) => ({ ...c, profileImage: '' }))}
                        className="mt-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                      >
                        Clear image
                      </button>
                    )}
                  </div>
                  {imageUploading && <Loader2 size={18} className="animate-spin text-cyan-400 flex-shrink-0" />}
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const file = e.dataTransfer.files?.[0]
                    if (file) void handleImageFile(file)
                  }}
                  onClick={() => !imageUploading && document.getElementById('profile-upload-input')?.click()}
                  className={`border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-slate-950/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center gap-2 group ${imageUploading ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <input
                    id="profile-upload-input"
                    type="file"
                    accept="image/*"
                    disabled={imageUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleImageFile(file)
                      e.target.value = ''
                    }}
                    className="hidden"
                  />
                  <div className="p-3 rounded-full bg-slate-950/40 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      <span className="text-cyan-400 group-hover:underline">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Any image, any size — we resize it to a 256×256 WebP automatically (source max 8MB)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar name={form.fullName || 'New Creator'} imageUrl={form.profileImage} size={40} />
                  <input
                    value={urlDraft}
                    onChange={(event) => setUrlDraft(event.target.value)}
                    placeholder="https://instagram.com/… or https://tiktok.com/…"
                    className={fieldClass}
                    disabled={imageUploading}
                  />
                  <button
                    type="button"
                    onClick={() => void handleImportUrl()}
                    disabled={imageUploading || !urlDraft.trim()}
                    className="flex-shrink-0 rounded-xl bg-cyan-500 px-3 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {imageUploading ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                    Import
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Profile picture links from Instagram/TikTok/etc usually won't load if pasted directly — hit
                  "Import" and we'll fetch, resize, and re-host a copy so it always renders.
                </p>
              </div>
            )}
          </div>
          <label className={`${labelClass} md:col-span-2`}>
            <span className="mb-2 block">Biography / Bio</span>
            <textarea
              value={form.bio}
              onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
              placeholder="A brief bio of the creator (e.g., Lifestyle and travel content creator based in NYC)..."
              className={textAreaClass}
              rows={2}
            />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            <span className="mb-2 block">Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className={textAreaClass}
            />
          </label>

          <div className="sticky bottom-0 bg-slate-900 pt-4 pb-1 mt-4 flex justify-end gap-3 md:col-span-2 border-t border-slate-800/80">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || imageUploading}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60 hover:bg-cyan-400 transition"
            >
              {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Save influencer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Back-compat alias — existing "add" call sites can keep this name. */
export const AddInfluencerModal = InfluencerFormModal
