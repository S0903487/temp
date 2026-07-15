import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, MoreVertical, Eye, ExternalLink, Trash2 } from 'lucide-react'
import { Avatar } from '../../../components/shared/Avatar'
import { PipelineStatusBadge } from './PipelineStatusSelect'
import type { Influencer, PipelineStatus } from '../types'
import { PIPELINE_STATUSES } from '../types'

export type SortField = 'fullName' | 'followers' | 'engagementRate' | 'category' | 'pipelineStatus'

type InfluencerDataGridProps = {
  influencers: Influencer[]
  selectedIds: string[]
  onSelectToggle: (id: string) => void
  onSelectAllToggle: (allIds: string[]) => void
  sortField: SortField
  sortOrder: 'asc' | 'desc'
  onSort: (field: SortField) => void
  visibleColumns: string[]
  onOpenDrawer: (id: string) => void
  onUpdatePipeline: (id: string, stage: PipelineStatus) => void
  onDelete: (id: string) => void
}

type ContextMenuState = {
  x: number
  y: number
  influencer: Influencer | null
}

export function InfluencerDataGrid({
  influencers,
  selectedIds,
  onSelectToggle,
  onSelectAllToggle,
  sortField,
  sortOrder,
  onSort,
  visibleColumns,
  onOpenDrawer,
  onUpdatePipeline,
  onDelete,
}: InfluencerDataGridProps) {
  const navigate = useNavigate()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ x: 0, y: 0, influencer: null })
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (influencers.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveRowIndex((prev) => (prev === null || prev >= influencers.length - 1 ? 0 : prev + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveRowIndex((prev) => (prev === null || prev <= 0 ? influencers.length - 1 : prev - 1))
      } else if (e.key === 'Enter' && activeRowIndex !== null) {
        e.preventDefault()
        onOpenDrawer(influencers[activeRowIndex].id)
      } else if (e.key === 'Escape') {
        setContextMenu({ x: 0, y: 0, influencer: null })
        setActiveRowIndex(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [influencers, activeRowIndex, onOpenDrawer])

  // Context Menu handlers
  const handleRowContextMenu = (e: React.MouseEvent, influencer: Influencer) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      influencer,
    })
  }

  useEffect(() => {
    const closeMenu = () => setContextMenu({ x: 0, y: 0, influencer: null })
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  const isColVisible = (col: string) => visibleColumns.includes(col)
  const isAllSelected = influencers.length > 0 && selectedIds.length === influencers.length

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectAllToggle([])
    } else {
      onSelectAllToggle(influencers.map((i) => i.id))
    }
  }

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? <ArrowUp size={12} className="inline ml-1 text-cyan-400" /> : <ArrowDown size={12} className="inline ml-1 text-cyan-400" />
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-lg select-none">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-900/90 text-slate-400 sticky top-0 z-10">
            <tr>
              {/* Bulk Checkbox Column */}
              <th className="px-4 py-3.5 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0"
                />
              </th>
              {/* Main Columns */}
              <th className="px-4 py-3.5 font-semibold text-slate-300 cursor-pointer hover:text-white transition" onClick={() => onSort('fullName')}>
                Creator {renderSortIndicator('fullName')}
              </th>
              {isColVisible('platform') && <th className="px-4 py-3.5 font-semibold text-slate-300">Platform</th>}
              {isColVisible('followers') && (
                <th className="px-4 py-3.5 font-semibold text-slate-300 cursor-pointer hover:text-white transition text-right" onClick={() => onSort('followers')}>
                  Followers {renderSortIndicator('followers')}
                </th>
              )}
              {isColVisible('engagement') && (
                <th className="px-4 py-3.5 font-semibold text-slate-300 cursor-pointer hover:text-white transition text-right" onClick={() => onSort('engagementRate')}>
                  Eng. Rate {renderSortIndicator('engagementRate')}
                </th>
              )}
              {isColVisible('category') && (
                <th className="px-4 py-3.5 font-semibold text-slate-300 cursor-pointer hover:text-white transition" onClick={() => onSort('category')}>
                  Niche Niche {renderSortIndicator('category')}
                </th>
              )}
              {isColVisible('contact') && <th className="px-4 py-3.5 font-semibold text-slate-300">Contact Channels</th>}
              {isColVisible('pipeline') && (
                <th className="px-4 py-3.5 font-semibold text-slate-300 cursor-pointer hover:text-white transition" onClick={() => onSort('pipelineStatus')}>
                  Outreach Stage {renderSortIndicator('pipelineStatus')}
                </th>
              )}
              <th className="px-4 py-3.5 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {influencers.map((influencer, idx) => {
              const isSelected = selectedIds.includes(influencer.id)
              const isActive = activeRowIndex === idx

              return (
                <tr
                  key={influencer.id}
                  onContextMenu={(e) => handleRowContextMenu(e, influencer)}
                  onClick={() => onOpenDrawer(influencer.id)}
                  className={`group border-l-2 cursor-pointer transition duration-150 ${
                    isSelected
                      ? 'bg-cyan-950/25 border-cyan-500 hover:bg-cyan-950/30'
                      : isActive
                      ? 'bg-slate-800/60 border-cyan-400/60'
                      : 'border-transparent hover:bg-slate-900/40'
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectToggle(influencer.id)}
                      className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0"
                    />
                  </td>

                  {/* Profile details */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={influencer.fullName} imageUrl={influencer.profileImage} size={36} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white group-hover:text-cyan-400 transition">{influencer.fullName}</span>
                          {influencer.verified && (
                            <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 text-[8px]" title="Verified">✓</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">@{influencer.username}</span>
                      </div>
                    </div>
                  </td>

                  {/* Platform */}
                  {isColVisible('platform') && <td className="px-4 py-3 text-xs font-semibold text-slate-400">{influencer.platform}</td>}

                  {/* Followers */}
                  {isColVisible('followers') && <td className="px-4 py-3 text-right font-medium text-slate-200">{influencer.followers.toLocaleString()}</td>}

                  {/* Engagement */}
                  {isColVisible('engagement') && <td className="px-4 py-3 text-right text-cyan-400 font-semibold">{influencer.engagementRate.toFixed(1)}%</td>}

                  {/* Category */}
                  {isColVisible('category') && (
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                        {influencer.category}
                      </span>
                    </td>
                  )}

                  {/* Contact Channels */}
                  {isColVisible('contact') && (
                    <td className="px-4 py-3 text-xs space-y-0.5">
                      <p className="text-slate-300 font-medium">{influencer.email || '—'}</p>
                      {influencer.phone && <p className="text-slate-500">{influencer.phone}</p>}
                    </td>
                  )}

                  {/* Pipeline */}
                  {isColVisible('pipeline') && (
                    <td className="px-4 py-3">
                      <PipelineStatusBadge status={influencer.pipelineStatus} />
                    </td>
                  )}

                  {/* Row Actions Trigger */}
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onOpenDrawer(influencer.id)}
                      className="p-1 rounded text-slate-500 hover:text-white transition"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Right-Click Context Menu Popup */}
      {contextMenu.influencer && (
        <div
          className="fixed z-50 min-w-[200px] bg-slate-950 border border-slate-800 rounded-xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-800/80 mb-1">
            {contextMenu.influencer.fullName}
          </div>

          <button
            onClick={() => {
              if (contextMenu.influencer) onOpenDrawer(contextMenu.influencer.id)
            }}
            className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-2"
          >
            <Eye size={12} />
            <span>Show Details Sheet</span>
          </button>

          <button
            onClick={() => {
              if (contextMenu.influencer) navigate(`/influencers/${contextMenu.influencer.id}`)
            }}
            className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-2"
          >
            <ExternalLink size={12} />
            <span>Open Profile Page</span>
          </button>

          {/* Nested Pipeline Selector options */}
          <div className="border-t border-slate-800/80 my-1 pt-1">
            <span className="block px-2.5 py-1 text-[10px] font-bold text-slate-500 uppercase">Change Stage</span>
            {PIPELINE_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => {
                  if (contextMenu.influencer) {
                    onUpdatePipeline(contextMenu.influencer.id, status)
                    setContextMenu({ x: 0, y: 0, influencer: null })
                  }
                }}
                className={`w-full text-left px-4 py-1 text-xs rounded-lg ${
                  contextMenu.influencer?.pipelineStatus === status
                    ? 'text-cyan-400 font-semibold bg-slate-900/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-800/80 my-1 pt-1">
            <button
              onClick={() => {
                if (contextMenu.influencer) {
                  onDelete(contextMenu.influencer.id)
                  setContextMenu({ x: 0, y: 0, influencer: null })
                }
              }}
              className="w-full text-left px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 rounded-lg flex items-center gap-2"
            >
              <Trash2 size={12} />
              <span>Delete Creator</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
