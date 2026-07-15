import { useState } from 'react'
import { SlidersHorizontal, Save, Trash2, RotateCcw } from 'lucide-react'
import { Select } from '../../../components/shared/fields'
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
    <div className="space-y-3">
      {/* Top Toolbar: Search + Toggle Filters + Quick Preset selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Search */}
        <div className="flex flex-1 min-w-[280px] max-w-md items-center gap-2">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onFilterChange('query', e.target.value)}
            placeholder="Search name, handle, email, tags, notes..."
            className="w-full bg-white border border-slate-200 rounded px-3 h-7 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-black transition"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Toggle Advanced Filters */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`inline-flex h-7 items-center gap-1 rounded border px-2.5 text-[11px] font-bold transition cursor-pointer ${
              isOpen
                ? 'bg-black text-white border-black'
                : 'bg-white border-slate-200 text-slate-600 hover:text-black hover:border-slate-400'
            }`}
          >
            <SlidersHorizontal size={11} />
            <span>Filters</span>
          </button>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:border-red-300 transition shrink-0 cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* Preset Presets List Row */}
      {savedPresets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1.5">Saved Presets:</span>
          {savedPresets.map((preset) => (
            <div
              key={preset.id}
              className="inline-flex h-6 items-center gap-1 rounded border border-slate-200 bg-white pl-2 pr-0.5 text-[10px] text-slate-600 transition hover:border-slate-300"
            >
              <button
                type="button"
                onClick={() => onApplyPreset(preset.filters)}
                className="font-bold text-slate-700 hover:text-black cursor-pointer text-[10px]"
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={() => onDeletePreset(preset.id)}
                className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                title="Delete preset"
              >
                <Trash2 size={9} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Expandable Advanced Filters Drawer */}
      {isOpen && (
        <div className="border border-slate-200 rounded bg-white p-3.5 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {/* Platform */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Platform</span>
              <Select className="!h-7 !py-0 !pl-2.5 !pr-8 !text-[11px] !rounded !shadow-none" value={filters.platform} onChange={(e) => onFilterChange('platform', e.target.value as 'All' | Platform)}>
                <option value="All">All Platforms</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
              </Select>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Category</span>
              <Select className="!h-7 !py-0 !pl-2.5 !pr-8 !text-[11px] !rounded !shadow-none" value={filters.category} onChange={(e) => onFilterChange('category', e.target.value)}>
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
            </div>

            {/* Followers range */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Followers (Reach)</span>
              <Select className="!h-7 !py-0 !pl-2.5 !pr-8 !text-[11px] !rounded !shadow-none" value={filters.followers} onChange={(e) => onFilterChange('followers', e.target.value)}>
                <option value="All">All Sizes</option>
                <option value="Micro (<50k)">Micro (&lt;50k)</option>
                <option value="Mid (50k-200k)">Mid (50k-200k)</option>
                <option value="Macro (200k-1M)">Macro (200k-1M)</option>
                <option value="Mega (>1M)">Mega (&gt;1M)</option>
              </Select>
            </div>

            {/* Engagement */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Engagement</span>
              <Select className="!h-7 !py-0 !pl-2.5 !pr-8 !text-[11px] !rounded !shadow-none" value={filters.engagement} onChange={(e) => onFilterChange('engagement', e.target.value)}>
                <option value="All">All Rates</option>
                <option value="High (>5%)">High (&gt;5%)</option>
                <option value="Medium (>2%)">Medium (&gt;2%)</option>
              </Select>
            </div>

            {/* Pipeline Stage */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pipeline Stage</span>
              <Select className="!h-7 !py-0 !pl-2.5 !pr-8 !text-[11px] !rounded !shadow-none" value={filters.pipelineStatus} onChange={(e) => onFilterChange('pipelineStatus', e.target.value as 'All' | PipelineStatus)}>
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
            </div>

            {/* Contact Details */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Contact Channels</span>
              <Select className="!h-7 !py-0 !pl-2.5 !pr-8 !text-[11px] !rounded !shadow-none" value={filters.contact} onChange={(e) => onFilterChange('contact', e.target.value as FilterState['contact'])}>
                <option value="All">All Contact</option>
                <option value="Has email">Has email</option>
                <option value="Has phone">Has phone</option>
                <option value="Has both">Has both</option>
              </Select>
            </div>

            {/* Country */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Country</span>
              <input
                type="text"
                value={filters.country === 'All' ? '' : filters.country}
                onChange={(e) => onFilterChange('country', e.target.value || 'All')}
                placeholder="e.g. US, UK"
                className="w-full rounded border border-slate-200 bg-white px-2.5 h-7 text-[11px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-black"
              />
            </div>

            {/* Language */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Language</span>
              <input
                type="text"
                value={filters.language === 'All' ? '' : filters.language}
                onChange={(e) => onFilterChange('language', e.target.value || 'All')}
                placeholder="e.g. English, Spanish"
                className="w-full rounded border border-slate-200 bg-white px-2.5 h-7 text-[11px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-black"
              />
            </div>

            {/* Subcategory */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Niche Subcategory</span>
              <input
                type="text"
                value={filters.subcategory === 'All' ? '' : filters.subcategory}
                onChange={(e) => onFilterChange('subcategory', e.target.value || 'All')}
                placeholder="e.g. Streetwear"
                className="w-full rounded border border-slate-200 bg-white px-2.5 h-7 text-[11px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-black"
              />
            </div>

            {/* Boolean Toggles */}
            <div className="flex flex-col gap-2.5 sm:col-span-2 md:col-span-3 lg:col-span-3 justify-end pb-1.5">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.verified === 'Verified only'}
                    onChange={(e) => onFilterChange('verified', e.target.checked ? 'Verified only' : 'All')}
                    className="rounded border-slate-300 text-black focus:ring-0 cursor-pointer"
                  />
                  Verified Only
                </label>

                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.brandSafe === 'Brand Safe only'}
                    onChange={(e) => onFilterChange('brandSafe', e.target.checked ? 'Brand Safe only' : 'All')}
                    className="rounded border-slate-300 text-black focus:ring-0 cursor-pointer"
                  />
                  Brand Safe
                </label>

                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.favorite}
                    onChange={(e) => onFilterChange('favorite', e.target.checked)}
                    className="rounded border-slate-300 text-black focus:ring-0 cursor-pointer"
                  />
                  Starred
                </label>
              </div>
            </div>
          </div>

          {/* Preset Saving Mini Form */}
          <form onSubmit={handleSavePreset} className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Save Current Filters:</span>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g. Fashion High-Engage"
              className="rounded border border-slate-200 bg-white px-2.5 h-7 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-black transition max-w-xs"
            />
            <button
              type="submit"
              disabled={!presetName.trim()}
              className="inline-flex h-7 items-center gap-1 rounded bg-black px-3 text-[11px] font-bold text-white hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              <Save size={11} />
              <span>Save Preset</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
