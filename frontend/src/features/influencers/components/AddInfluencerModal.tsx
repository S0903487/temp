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

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Arabic',
  'Portuguese',
  'Hindi',
  'Japanese',
  'Italian',
  'Russian',
  'Korean',
  'Turkish',
  'Vietnamese',
  'Thai',
  'Polish',
  'Dutch',
  'Swedish',
  'Urdu'
]

const defaultForm = {
  fullName: '',
  username: '',
  profileLink: '',
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
  following: '',
  totalPosts: '',
  firstJoinedDate: '',
  engagementRate: '',
  averageViews: '',
  averageLikes: '',
  averageComments: '',
  totalViews: '',
  totalLikes: '',
  totalComments: '',
  pricePost: '',
  priceStory: '',
  verified: false,
  brandSafe: true,
  roi: '',
  cpa: '',
  cpi: '',
  ltv: '',
}

type FormState = typeof defaultForm

function formFromInfluencer(influencer: Influencer): FormState {
  return {
    fullName: influencer.fullName,
    username: influencer.username,
    profileLink: influencer.profileLink ?? '',
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
    following: influencer.following ? String(influencer.following) : '',
    totalPosts: influencer.totalPosts ? String(influencer.totalPosts) : '',
    firstJoinedDate: influencer.firstJoinedDate ?? '',
    engagementRate: influencer.engagementRate ? String(influencer.engagementRate) : '',
    averageViews: influencer.averageViews ? String(influencer.averageViews) : '',
    averageLikes: influencer.averageLikes ? String(influencer.averageLikes) : '',
    averageComments: influencer.averageComments ? String(influencer.averageComments) : '',
    totalViews: influencer.totalViews ? String(influencer.totalViews) : '',
    totalLikes: influencer.totalLikes ? String(influencer.totalLikes) : '',
    totalComments: influencer.totalComments ? String(influencer.totalComments) : '',
    pricePost: influencer.pricePost ? String(influencer.pricePost) : '',
    priceStory: influencer.priceStory ? String(influencer.priceStory) : '',
    verified: influencer.verified,
    brandSafe: influencer.brandSafe,
    roi: influencer.roi !== undefined && influencer.roi !== null ? String(influencer.roi) : '',
    cpa: influencer.cpa !== undefined && influencer.cpa !== null ? String(influencer.cpa) : '',
    cpi: influencer.cpi !== undefined && influencer.cpi !== null ? String(influencer.cpi) : '',
    ltv: influencer.ltv !== undefined && influencer.ltv !== null ? String(influencer.ltv) : '',
  }
}

function validateUsername(username: string): boolean {
  return username.trim().length > 0
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

  // Freeze body scroll when modal appears
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

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

  const toNumber = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '') return undefined
    const parsed = Number(trimmed)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.fullName.trim()) return

    const safeUsername = form.username.trim() || form.fullName.replace(/\s+/g, '').toLowerCase()

    if (!validateUsername(safeUsername)) {
      setLocalValError('Username / Handle cannot be empty.')
      return
    }

    setLocalValError(null)
    onSubmit({
      fullName: form.fullName.trim(),
      username: safeUsername,
      profileLink: form.profileLink.trim() || undefined,
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
      profileImage: form.profileImage.trim() ? form.profileImage.trim() : null,
      followers: toNumber(form.followers),
      following: toNumber(form.following),
      totalPosts: toNumber(form.totalPosts),
      firstJoinedDate: form.firstJoinedDate.trim() || undefined,
      engagementRate: toNumber(form.engagementRate),
      averageViews: toNumber(form.averageViews),
      averageLikes: toNumber(form.averageLikes),
      averageComments: toNumber(form.averageComments),
      totalViews: toNumber(form.totalViews),
      totalLikes: toNumber(form.totalLikes),
      totalComments: toNumber(form.totalComments),
      pricePost: toNumber(form.pricePost),
      priceStory: toNumber(form.priceStory),
      roi: toNumber(form.roi),
      cpa: toNumber(form.cpa),
      cpi: toNumber(form.cpi),
      ltv: toNumber(form.ltv),
      verified: form.verified,
      brandSafe: form.brandSafe,
    })
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div className="fixed inset-0 bg-slate-950/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded border border-slate-200 bg-white p-5 shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isEditing ? 'Edit creator' : 'Quick capture'}
            </p>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? `Edit ${influencer?.fullName ?? 'influencer'}` : 'Add influencer'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 transition cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {(errorMessage || localValError || imageError) && (
          <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 font-semibold flex-shrink-0">
            {errorMessage || localValError || imageError}
          </p>
        )}

        <form className="mt-4 flex-1 overflow-y-auto pr-1 grid gap-3 md:grid-cols-2 themed-scrollbar" onSubmit={handleSubmit}>
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
              </span>
              <input
                value={form.username}
                onChange={(event) => {
                  setForm((current) => ({ ...current, username: event.target.value }))
                  setLocalValError(null)
                }}
                placeholder="e.g. creator_handle or @handle"
                className={fieldClass}
                required
              />
            </label>
          </div>
          <label className={labelClass}>
            <span className="mb-2 block">Profile Link</span>
            <input
              type="url"
              value={form.profileLink}
              onChange={(event) => setForm((current) => ({ ...current, profileLink: event.target.value }))}
              placeholder="e.g. https://instagram.com/creator_handle"
              className={fieldClass}
            />
          </label>
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
            <span className="mb-2 block">Language</span>
            <Select
              value={form.language}
              onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
            >
              {Array.from(new Set([...LANGUAGES, form.language || 'English'])).map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
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

          <div className="md:col-span-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-800">Stats</p>
            <p className="text-[10px] text-slate-400 font-medium">
              Updating these logs a new growth snapshot, so the profile chart tracks change over time.
            </p>
          </div>
          <label className={labelClass}>
            <span className="mb-2 block">Followers</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.followers}
              onChange={(event) => setForm((current) => ({ ...current, followers: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Following</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.following}
              onChange={(event) => setForm((current) => ({ ...current, following: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Engagement rate (%)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.engagementRate}
              onChange={(event) => setForm((current) => ({ ...current, engagementRate: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Total posts</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.totalPosts}
              onChange={(event) => setForm((current) => ({ ...current, totalPosts: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">First Joined Date</span>
            <input
              type="date"
              value={form.firstJoinedDate}
              onChange={(event) => setForm((current) => ({ ...current, firstJoinedDate: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Average views</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.averageViews}
              onChange={(event) => setForm((current) => ({ ...current, averageViews: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Total views</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.totalViews}
              onChange={(event) => setForm((current) => ({ ...current, totalViews: event.target.value }))}
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            <span className="mb-2 block">Average likes</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.averageLikes}
              onChange={(event) => setForm((current) => ({ ...current, averageLikes: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Total likes</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.totalLikes}
              onChange={(event) => setForm((current) => ({ ...current, totalLikes: event.target.value }))}
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            <span className="mb-2 block">Average comments</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.averageComments}
              onChange={(event) => setForm((current) => ({ ...current, averageComments: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">Total comments</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.totalComments}
              onChange={(event) => setForm((current) => ({ ...current, totalComments: event.target.value }))}
              className={fieldClass}
            />
          </label>

          <div className="md:col-span-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-800">Pricing &amp; trust</p>
          </div>
          <label className={labelClass}>
            <span className="mb-2 block">Price per post</span>
            <input
              type="number"
              min="0"
              step="any"
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
              step="any"
              value={form.priceStory}
              onChange={(event) => setForm((current) => ({ ...current, priceStory: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">ROI (%)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.roi}
              onChange={(event) => setForm((current) => ({ ...current, roi: event.target.value }))}
              className={fieldClass}
              placeholder="e.g. 150"
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">CPA ($)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.cpa}
              onChange={(event) => setForm((current) => ({ ...current, cpa: event.target.value }))}
              className={fieldClass}
              placeholder="e.g. 25.50"
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">CPI ($)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.cpi}
              onChange={(event) => setForm((current) => ({ ...current, cpi: event.target.value }))}
              className={fieldClass}
              placeholder="e.g. 1.50"
            />
          </label>
          <label className={labelClass}>
            <span className="mb-2 block">LTV ($)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.ltv}
              onChange={(event) => setForm((current) => ({ ...current, ltv: event.target.value }))}
              className={fieldClass}
              placeholder="e.g. 120"
            />
          </label>
          <div className="flex items-center gap-6 md:col-span-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.verified}
                onChange={(event) => setForm((current) => ({ ...current, verified: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 bg-white accent-black cursor-pointer"
              />
              Verified account
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.brandSafe}
                onChange={(event) => setForm((current) => ({ ...current, brandSafe: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 bg-white accent-black cursor-pointer"
              />
              Brand safe
            </label>
          </div>

          <div className="md:col-span-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">Profile image</span>
              <div className="flex gap-1 p-0.5 bg-slate-100 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => setImageSource('upload')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    imageSource === 'upload'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud size={10} /> Upload file
                </button>
                <button
                  type="button"
                  onClick={() => setImageSource('url')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    imageSource === 'url'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Link2 size={10} /> URL path
                </button>
              </div>
            </div>

            {imageSource === 'upload' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <Avatar name={form.fullName || 'New Creator'} imageUrl={form.profileImage} size={40} />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700">
                      {imageUploading ? 'Processing…' : form.profileImage ? 'Ready to save image' : 'No image loaded'}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-normal font-medium">
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
                        className="mt-0.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 transition cursor-pointer"
                      >
                        Clear image
                      </button>
                    )}
                  </div>
                  {imageUploading && <Loader2 size={14} className="animate-spin text-slate-900 flex-shrink-0" />}
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
                  className={`border-2 border-dashed border-slate-200 hover:border-black rounded p-4 flex flex-col items-center justify-center cursor-pointer transition text-center gap-1.5 group ${imageUploading ? 'pointer-events-none opacity-50' : ''}`}
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
                  <div className="p-2 rounded-full bg-slate-50 text-slate-400 group-hover:text-black group-hover:bg-slate-100 transition">
                    <UploadCloud size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      <span className="text-slate-950 group-hover:underline">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                      Any image, any size — we resize it to a 256×256 WebP automatically (source max 8MB)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Avatar name={form.fullName || 'New Creator'} imageUrl={form.profileImage} size={32} />
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
                    className="flex-shrink-0 rounded bg-black px-3 h-7 text-[11px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  >
                    {imageUploading ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                    Import
                  </button>
                </div>
                {form.profileImage && !imageUploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm((c) => ({ ...c, profileImage: '' }))
                      setUrlDraft('')
                    }}
                    className="mt-0.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 transition cursor-pointer inline-block"
                  >
                    Clear image
                  </button>
                )}
                <p className="text-[10px] text-slate-400 leading-normal">
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

          <div className="sticky bottom-0 bg-white pt-3 pb-0.5 mt-3 flex justify-end gap-2 md:col-span-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-500 font-bold hover:bg-slate-50 transition cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || imageUploading}
              className="rounded bg-black px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer disabled:opacity-50"
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
