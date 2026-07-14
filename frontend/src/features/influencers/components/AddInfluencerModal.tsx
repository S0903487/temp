/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { Avatar } from '../../../components/shared/Avatar'
import { Select, fieldClass, textAreaClass, labelClass } from '../../../components/shared/fields'
import { COUNTRIES } from '../../../lib/countries'
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

  // Re-sync the form whenever the modal is opened, either with the
  // creator being edited or a blank slate for a new one.
  useEffect(() => {
    if (!isOpen) return
    setForm(influencer ? formFromInfluencer(influencer) : defaultForm)
  }, [isOpen, influencer])

  if (!isOpen) {
    return null
  }

  const toNumber = (value: string) => (value.trim() === '' ? undefined : Number(value))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.fullName.trim()) return

    const safeUsername = form.username.trim() || `@${form.fullName.replace(/\s+/g, '').toLowerCase()}`
    onSubmit({
      fullName: form.fullName.trim(),
      username: safeUsername,
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

        {errorMessage && (
          <p className="mt-4 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300 flex-shrink-0">{errorMessage}</p>
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
          <label className={labelClass}>
            <span className="mb-2 block">Username</span>
            <input
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              className={fieldClass}
              required
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

          <label className={`${labelClass} md:col-span-2`}>
            <span className="mb-2 block">Profile image URL</span>
            <div className="flex items-center gap-3">
              <Avatar name={form.fullName || 'New Creator'} imageUrl={form.profileImage} size={40} />
              <input
                value={form.profileImage}
                onChange={(event) => setForm((current) => ({ ...current, profileImage: event.target.value }))}
                placeholder="https://…"
                className={fieldClass}
              />
            </div>
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
              disabled={isSubmitting}
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
