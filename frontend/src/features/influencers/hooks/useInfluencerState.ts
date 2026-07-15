import { useState, useEffect } from 'react'
import type { Platform, PipelineStatus } from '../types'
import type { SortField } from '../components/InfluencerDataGrid'

export type FilterState = {
  query: string
  platform: 'All' | Platform
  category: string
  subcategory: string
  country: string
  language: string
  followers: string
  engagement: string
  verified: 'All' | 'Verified only'
  brandSafe: 'All' | 'Brand Safe only'
  contact: 'All' | 'Has email' | 'Has phone' | 'Has both'
  pipelineStatus: 'All' | PipelineStatus
  recentlyUpdated: boolean
  favorite: boolean
}

export type SavedFilterPreset = {
  id: string
  name: string
  filters: FilterState
}

const DEFAULT_FILTERS: FilterState = {
  query: '',
  platform: 'All',
  category: 'All',
  subcategory: 'All',
  country: 'All',
  language: 'All',
  followers: 'All',
  engagement: 'All',
  verified: 'All',
  brandSafe: 'All',
  contact: 'All',
  pipelineStatus: 'All',
  recentlyUpdated: false,
  favorite: false,
}

export function useInfluencerState() {
  // Global Filters
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Search Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(filters.query)
    }, 250)
    return () => clearTimeout(handler)
  }, [filters.query])

  // View Settings
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'pipeline'>(() => {
    try {
      const stored = localStorage.getItem('influenceos_view_mode')
      if (stored === 'table' || stored === 'card' || stored === 'pipeline') {
        return stored
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'table'
  })

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('influenceos_visible_columns')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // Ignore localStorage errors
    }
    return [
      'platform',
      'followers',
      'engagement',
      'category',
      'contact',
      'pipeline',
    ]
  })

  useEffect(() => {
    try {
      localStorage.setItem('influenceos_view_mode', viewMode)
    } catch {
      // Ignore localStorage errors
    }
  }, [viewMode])

  useEffect(() => {
    try {
      localStorage.setItem('influenceos_visible_columns', JSON.stringify(visibleColumns))
    } catch {
      // Ignore localStorage errors
    }
  }, [visibleColumns])

  const [sortField, setSortField] = useState<SortField>('followers')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Details Drawer
  const [activeInfluencerId, setActiveInfluencerId] = useState<string | null>(null)

  // Saved Filters Presets
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>(() => {
    try {
      const stored = localStorage.getItem('influenceos_saved_presets')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Save presets to localStorage
  const savePreset = (name: string) => {
    const newPreset: SavedFilterPreset = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      filters: { ...filters },
    }
    const updated = [...savedPresets, newPreset]
    setSavedPresets(updated)
    localStorage.setItem('influenceos_saved_presets', JSON.stringify(updated))
  }

  const deletePreset = (id: string) => {
    const updated = savedPresets.filter((p) => p.id !== id)
    setSavedPresets(updated)
    localStorage.setItem('influenceos_saved_presets', JSON.stringify(updated))
  }

  const applyPreset = (presetFilters: FilterState) => {
    setFilters(presetFilters)
    setCurrentPage(1)
  }

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setCurrentPage(1)
  }

  return {
    filters,
    debouncedQuery,
    viewMode,
    visibleColumns,
    sortField,
    sortOrder,
    currentPage,
    pageSize,
    selectedIds,
    activeInfluencerId,
    savedPresets,
    updateFilter,
    resetFilters,
    setViewMode,
    setVisibleColumns,
    setSortField,
    setSortOrder,
    setCurrentPage,
    setPageSize,
    setSelectedIds,
    setActiveInfluencerId,
    savePreset,
    deletePreset,
    applyPreset,
  }
}
