import { useState } from 'react'
import { SlidersHorizontal, Save, Trash2, RotateCcw } from 'lucide-react'
import { Select, labelClass, fieldClass } from '../../../components/shared/fields'
import type { FilterState, SavedFilterPreset } from '../hooks/useInfluencerState'
import type { Platform, PipelineStatus } from '../types'

type InfluencerFiltersPanelProps = {
  filters: FilterState
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  onReset: () => void
  savedPresets: SavedFilterPreset[]
  onSavePreset: (name: string) => void
  onDeletePreset: (id: string) => void
  onApplyPreset: (filters: FilterState) => void
}

export function InfluencerFiltersPanel({
  filters,
  onFilterChange,
  onReset,
  savedPresets,
  onSavePreset,
  onDeletePreset,
  onApplyPreset,
}: InfluencerFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [presetName, setPresetName] = useState('')

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!presetName.trim()) return
    onSavePreset(presetName.trim())
    setPresetName('')
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      {/* Top Toolbar: Search + Toggle Filters + Quick Preset selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="flex flex-1 min-w-[280px] max-w-md items-center gap-2">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onFilterChange('query', e.target.value)}
            placeholder="Search name, handle, email, tags, notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Advanced Filters */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
              isOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
            title="Reset Filters"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Preset Presets List Row */}
      {savedPresets.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-800/40 pt-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1.5">Saved Presets:</span>
          {savedPresets.map((preset) => (
            <div
              key={preset.id}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/80 pl-2.5 pr-1 py-1 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              <button
                type="button"
                onClick={() => onApplyPreset(preset.filters)}
                className="font-medium text-slate-300 hover:text-cyan-400"
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={() => onDeletePreset(preset.id)}
                className="text-slate-500 hover:text-rose-400 p-0.5"
                title="Delete preset"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Expandable Advanced Filters Drawer */}
      {isOpen && (
        <div className="mt-4 border-t border-slate-800/80 pt-4 animate-in fade-in slide-in-from-top-2 duration-250">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {/* Platform */}
            <label className={labelClass}>
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">Platform</span>
              <Select value={filters.platform} onChange={(e) => onFilterChange('platform', e.target.value as 'All' | Platform)}>
                <option value="All">All Platforms</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
              </Select>
            </label>

            {/* Category */}
            <label className={labelClass}>
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">Category</span>
              <Select value={filters.category} onChange={(e) => onFilterChange('category', e.target.value)}>
                <option value="All">All Categories</option>
                <option value="Fashion">Fashion</option>
                <option value="Beauty">Beauty</option>
                <option value="Gaming">Gaming</option>
                <option value="Fitness">Fitness</option>
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Lifestyle">Lifestyle</option>
              </Select>
            </label>

            {/* Followers range */}
            <label className={labelClass}>
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">Followers (Reach)</span>
              <Select value={filters.followers} onChange={(e) => onFilterChange('followers', e.target.value)}>
                <option value="All">All Sizes</option>
                <option value="Micro (<50k)">Micro (&lt;50k)</option>
                <option value="Mid (50k-200k)">Mid (50k-200k)</option>
                <option value="Macro (200k-1M)">Macro (200k-1M)</option>
                <option value="Mega (>1M)">Mega (&gt;1M)</option>
              </Select>
            </label>

            {/* Engagement */}
            <label className={labelClass}>
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">Engagement</span>
              <Select value={filters.engagement} onChange={(e) => onFilterChange('engagement', e.target.value)}>
                <option value="All">All Rates</option>
                <option value="High (>5%)">High (&gt;5%)</option>
                <option value="Medium (>2%)">Medium (&gt;2%)</option>
              </Select>
            </label>

            {/* Pipeline Stage */}
            <label className={labelClass}>
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">Pipeline Stage</span>
              <Select value={filters.pipelineStatus} onChange={(e) => onFilterChange('pipelineStatus', e.target.value as 'All' | PipelineStatus)}>
                <option value="All">All Stages</option>
                <option value="New">New</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Contacted">Contacted</option>
                <option value="Replied">Replied</option>
                <option value="Negotiating">Negotiating</option>
                <option value="Booked">Booked</option>
                <option value="Completed">Completed</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </label>

            {/* Contact Details */}
            <label className={labelClass}>
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">Contact Channels</span>
              <Select value={filters.contact} onChange={(e) => onFilterChange('contact', e.target.value as FilterState['contact'])}>
                <option value="All">All Contact</option>
                <option value="Has email">Has email</option>
                <option value="Has phone">Has phone</option>
                <option value="Has both">Has both</option>
              </Select>
            </label>

            {/* Country */}
            <label className={labelClass}>
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">Country</span>
              <input
                type="text"
                value={filters.country === 'All' ? '' : filters.country}
                onChange={(e) => onFilterChange('country', e.target.value || 'All')}
                placeholder="e.g. US, United Kingdom"
                className={fieldClass}
              />
            </label>

            {/* Language */}
            <label className={labelClass}>
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">Language</span>
              <input
                type="text"
                value={filters.language === 'All' ? '' : filters.language}
                onChange={(e) => onFilterChange('language', e.target.value || 'All')}
                placeholder="e.g. English, Spanish"
                className={fieldClass}
              />
            </label>

            {/* Subcategory */}
            <label className={labelClass}>
              <span className="mb-1.5 block text-xs font-semibold text-slate-400">Niche Subcategory</span>
              <input
                type="text"
                value={filters.subcategory === 'All' ? '' : filters.subcategory}
                onChange={(e) => onFilterChange('subcategory', e.target.value || 'All')}
                placeholder="e.g. Streetwear, PC Tech"
                className={fieldClass}
              />
            </label>

            {/* Boolean Toggles */}
            <div className="flex flex-col gap-2.5 sm:col-span-2 md:col-span-3 lg:col-span-3 justify-end pb-1.5">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.verified === 'Verified only'}
                    onChange={(e) => onFilterChange('verified', e.target.checked ? 'Verified only' : 'All')}
                    className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0"
                  />
                  Verified Accounts Only
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.brandSafe === 'Brand Safe only'}
                    onChange={(e) => onFilterChange('brandSafe', e.target.checked ? 'Brand Safe only' : 'All')}
                    className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0"
                  />
                  Brand Safe Creators
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.favorite}
                    onChange={(e) => onFilterChange('favorite', e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0"
                  />
                  Starred Favorites
                </label>
              </div>
            </div>
          </div>

          {/* Preset Saving Mini Form */}
          <form onSubmit={handleSavePreset} className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800/60 pt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Save Current Filters:</span>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g. High-Engage Fashion"
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition max-w-xs"
            />
            <button
              type="submit"
              disabled={!presetName.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={12} />
              <span>Save Preset</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
