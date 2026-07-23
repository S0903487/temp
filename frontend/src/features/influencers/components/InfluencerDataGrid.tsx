import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, MoreVertical, ExternalLink, Trash2 } from 'lucide-react'
import { Avatar } from '../../../components/shared/Avatar'
import { PipelineStatusBadge } from './PipelineStatusSelect'
import type { Influencer, PipelineStatus } from '../types'
import { PIPELINE_STATUSES } from '../types'
import { useOrganization } from '../../organizations/hooks/useOrganization'
import { formatCurrency } from '../../../lib/currency'
import { useAuthUser } from '../../auth/hooks/useAuth'

export type SortField =
  | 'fullName'
  | 'followers'
  | 'following'
  | 'totalPosts'
  | 'firstJoinedDate'
  | 'engagementRate'
  | 'category'
  | 'pipelineStatus'
  | 'country'
  | 'language'
  | 'averageViews'
  | 'totalViews'
  | 'averageLikes'
  | 'totalLikes'
  | 'averageComments'
  | 'totalComments'
  | 'pricePost'
  | 'priceStory'
  | 'status'

type InfluencerDataGridProps = {
  influencers: Influencer[]
  selectedIds: string[]
  onSelectToggle: (id: string) => void
  onSelectAllToggle: (allIds: string[]) => void
  sortField: SortField
  sortOrder: 'asc' | 'desc'
  onSort: (field: SortField) => void
  visibleColumns: string[]
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
  onUpdatePipeline,
  onDelete,
}: InfluencerDataGridProps) {
  const { data: organization } = useOrganization()
  const { data: currentUser } = useAuthUser()
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
        navigate(`/influencers/${influencers[activeRowIndex].id}`)
      } else if (e.key === 'Escape') {
        setContextMenu({ x: 0, y: 0, influencer: null })
        setActiveRowIndex(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [influencers, activeRowIndex, navigate])

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
    return sortOrder === 'asc' ? <ArrowUp size={12} className="inline ml-1 text-slate-900" /> : <ArrowDown size={12} className="inline ml-1 text-slate-900" />
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs select-none">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              {/* Bulk Checkbox Column */}
              <th className="px-3 py-2.5 w-10 text-center whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 bg-white text-slate-900 focus:ring-0"
                />
              </th>
              {isColVisible('id') && <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 whitespace-nowrap">ID</th>}
              {/* Main Columns */}
              <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition whitespace-nowrap" onClick={() => onSort('fullName')}>
                Creator {renderSortIndicator('fullName')}
              </th>
              {isColVisible('platform') && <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 whitespace-nowrap">Platform</th>}
              {isColVisible('followers') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('followers')}>
                  Followers {renderSortIndicator('followers')}
                </th>
              )}
              {isColVisible('following') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('following')}>
                  Following {renderSortIndicator('following')}
                </th>
              )}
              {isColVisible('totalPosts') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('totalPosts')}>
                  Total Posts {renderSortIndicator('totalPosts')}
                </th>
              )}
              {isColVisible('firstJoinedDate') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('firstJoinedDate')}>
                  First Joined {renderSortIndicator('firstJoinedDate')}
                </th>
              )}
              {isColVisible('engagement') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('engagementRate')}>
                  Eng. Rate {renderSortIndicator('engagementRate')}
                </th>
              )}
              {isColVisible('category') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition whitespace-nowrap" onClick={() => onSort('category')}>
                  Niche Category {renderSortIndicator('category')}
                </th>
              )}
              {isColVisible('contact') && <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 whitespace-nowrap">Contact Channels</th>}
              {isColVisible('pipeline') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition whitespace-nowrap" onClick={() => onSort('pipelineStatus')}>
                  Outreach Stage {renderSortIndicator('pipelineStatus')}
                </th>
              )}
              {isColVisible('country') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition whitespace-nowrap" onClick={() => onSort('country')}>
                  Country {renderSortIndicator('country')}
                </th>
              )}
              {isColVisible('language') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition whitespace-nowrap" onClick={() => onSort('language')}>
                  Language {renderSortIndicator('language')}
                </th>
              )}
              {isColVisible('averageViews') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('averageViews')}>
                  Avg Views {renderSortIndicator('averageViews')}
                </th>
              )}
              {isColVisible('totalViews') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('totalViews')}>
                  Total Views {renderSortIndicator('totalViews')}
                </th>
              )}
              {isColVisible('averageLikes') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('averageLikes')}>
                  Avg Likes {renderSortIndicator('averageLikes')}
                </th>
              )}
              {isColVisible('totalLikes') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('totalLikes')}>
                  Total Likes {renderSortIndicator('totalLikes')}
                </th>
              )}
              {isColVisible('averageComments') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('averageComments')}>
                  Avg Comments {renderSortIndicator('averageComments')}
                </th>
              )}
              {isColVisible('totalComments') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('totalComments')}>
                  Total Comments {renderSortIndicator('totalComments')}
                </th>
              )}
              {isColVisible('pricePost') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('pricePost')}>
                  Price/Post {renderSortIndicator('pricePost')}
                </th>
              )}
              {isColVisible('priceStory') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition text-right whitespace-nowrap" onClick={() => onSort('priceStory')}>
                  Price/Story {renderSortIndicator('priceStory')}
                </th>
              )}
              {isColVisible('verified') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 whitespace-nowrap">
                  Verified
                </th>
              )}
              {isColVisible('brandSafe') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 whitespace-nowrap">
                  Brand Safe
                </th>
              )}
              {isColVisible('status') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 cursor-pointer hover:text-slate-900 transition whitespace-nowrap" onClick={() => onSort('status')}>
                  Health Status {renderSortIndicator('status')}
                </th>
              )}
              {isColVisible('profileLink') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 whitespace-nowrap">
                  Profile Link
                </th>
              )}
              {isColVisible('roi') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right whitespace-nowrap">
                  ROI
                </th>
              )}
              {isColVisible('cpa') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right whitespace-nowrap">
                  CPA
                </th>
              )}
              {isColVisible('cpi') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right whitespace-nowrap">
                  CPI
                </th>
              )}
              {isColVisible('ltv') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right whitespace-nowrap">
                  LTV
                </th>
              )}
              {isColVisible('notes') && (
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 whitespace-nowrap">
                  Notes
                </th>
              )}
              <th className="px-3 py-2.5 w-10 whitespace-nowrap" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {influencers.map((influencer, idx) => {
              const isSelected = selectedIds.includes(influencer.id)
              const isActive = activeRowIndex === idx

              return (
                <tr
                  key={influencer.id}
                  onContextMenu={(e) => handleRowContextMenu(e, influencer)}
                  onClick={() => navigate(`/influencers/${influencer.id}`)}
                  className={`group cursor-pointer transition duration-150 ${
                    isSelected
                      ? 'bg-slate-50 hover:bg-slate-100'
                      : isActive
                      ? 'bg-slate-100'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="px-3 py-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectToggle(influencer.id)}
                      className="rounded border-slate-300 bg-white text-slate-900 focus:ring-0"
                    />
                  </td>

                  {/* ID */}
                  {isColVisible('id') && (
                    <td className="px-3 py-2 text-[10px] font-semibold text-slate-500 font-mono whitespace-nowrap" title={influencer.id}>
                      <span className="inline-block max-w-[130px] truncate align-middle">
                        {influencer.id}
                      </span>
                    </td>
                  )}

                  {/* Profile details */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={influencer.fullName} imageUrl={influencer.profileImage} size={28} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-bold text-slate-900 group-hover:text-black transition whitespace-nowrap">{influencer.fullName}</span>
                          {influencer.verified && (
                            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-[8px] font-bold" title="Verified">✓</span>
                          )}
                          {currentUser && influencer.organizationId !== currentUser.organizationId && (
                            <span className="inline-flex items-center rounded-sm bg-indigo-50 border border-indigo-100 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-indigo-700 select-none whitespace-nowrap">
                              Created by Other
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">@{influencer.username}</span>
                      </div>
                    </div>
                  </td>

                  {/* Platform */}
                  {isColVisible('platform') && <td className="px-3 py-2 text-[11px] font-bold text-slate-600 whitespace-nowrap">{influencer.platform}</td>}

                  {/* Followers */}
                  {isColVisible('followers') && <td className="px-3 py-2 text-right font-semibold text-slate-800 whitespace-nowrap">{influencer.followers.toLocaleString()}</td>}

                  {/* Following */}
                  {isColVisible('following') && <td className="px-3 py-2 text-right font-semibold text-slate-800 whitespace-nowrap">{influencer.following.toLocaleString()}</td>}

                  {/* Total Posts */}
                  {isColVisible('totalPosts') && <td className="px-3 py-2 text-right font-semibold text-slate-800 whitespace-nowrap">{influencer.totalPosts.toLocaleString()}</td>}

                  {/* First Joined Date */}
                  {isColVisible('firstJoinedDate') && <td className="px-3 py-2 text-right text-slate-800 whitespace-nowrap">{influencer.firstJoinedDate || '—'}</td>}

                  {/* Engagement */}
                  {isColVisible('engagement') && <td className="px-3 py-2 text-right text-slate-800 font-bold whitespace-nowrap">{influencer.engagementRate.toFixed(1)}%</td>}

                  {/* Category */}
                  {isColVisible('category') && (
                    <td className="px-3 py-2 whitespace-nowrap">
                      {influencer.category ? (
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 whitespace-nowrap">
                          {influencer.category}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>
                  )}

                  {/* Contact Channels */}
                  {isColVisible('contact') && (
                    <td className="px-3 py-2 text-[11px] space-y-0.5 whitespace-nowrap">
                      <p className="text-slate-800 font-medium">{influencer.email || '—'}</p>
                      {influencer.phone && <p className="text-slate-400 text-[10px]">{influencer.phone}</p>}
                    </td>
                  )}

                  {/* Pipeline */}
                  {isColVisible('pipeline') && (
                    <td className="px-3 py-2 whitespace-nowrap">
                      <PipelineStatusBadge status={influencer.pipelineStatus} />
                    </td>
                  )}

                  {/* Country */}
                  {isColVisible('country') && (
                    <td className="px-3 py-2 text-slate-700 font-semibold text-[11px] whitespace-nowrap">{influencer.country || '—'}</td>
                  )}

                  {/* Language */}
                  {isColVisible('language') && (
                    <td className="px-3 py-2 text-slate-700 font-semibold text-[11px] whitespace-nowrap">{influencer.language || '—'}</td>
                  )}

                  {/* Average Views */}
                  {isColVisible('averageViews') && (
                    <td className="px-3 py-2 text-right font-semibold text-slate-800 text-[11px] whitespace-nowrap">
                      {influencer.averageViews ? influencer.averageViews.toLocaleString() : '0'}
                    </td>
                  )}

                  {/* Total Views */}
                  {isColVisible('totalViews') && (
                    <td className="px-3 py-2 text-right font-semibold text-slate-800 text-[11px] whitespace-nowrap">
                      {influencer.totalViews ? influencer.totalViews.toLocaleString() : '0'}
                    </td>
                  )}

                  {/* Average Likes */}
                  {isColVisible('averageLikes') && (
                    <td className="px-3 py-2 text-right font-semibold text-slate-800 text-[11px] whitespace-nowrap">
                      {influencer.averageLikes ? influencer.averageLikes.toLocaleString() : '0'}
                    </td>
                  )}

                  {/* Total Likes */}
                  {isColVisible('totalLikes') && (
                    <td className="px-3 py-2 text-right font-semibold text-slate-800 text-[11px] whitespace-nowrap">
                      {influencer.totalLikes ? influencer.totalLikes.toLocaleString() : '0'}
                    </td>
                  )}

                  {/* Average Comments */}
                  {isColVisible('averageComments') && (
                    <td className="px-3 py-2 text-right font-semibold text-slate-800 text-[11px] whitespace-nowrap">
                      {influencer.averageComments ? influencer.averageComments.toLocaleString() : '0'}
                    </td>
                  )}

                  {/* Total Comments */}
                  {isColVisible('totalComments') && (
                    <td className="px-3 py-2 text-right font-semibold text-slate-800 text-[11px] whitespace-nowrap">
                      {influencer.totalComments ? influencer.totalComments.toLocaleString() : '0'}
                    </td>
                  )}

                  {/* Price Post */}
                  {isColVisible('pricePost') && (
                    <td className="px-3 py-2 text-right font-bold text-slate-800 text-[11px] whitespace-nowrap">
                      {formatCurrency(influencer.pricePost, organization?.currency)}
                    </td>
                  )}

                  {/* Price Story */}
                  {isColVisible('priceStory') && (
                    <td className="px-3 py-2 text-right font-bold text-slate-800 text-[11px] whitespace-nowrap">
                      {formatCurrency(influencer.priceStory, organization?.currency)}
                    </td>
                  )}

                  {/* Verified */}
                  {isColVisible('verified') && (
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${influencer.verified ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                        {influencer.verified ? 'Yes' : 'No'}
                      </span>
                    </td>
                  )}

                  {/* Brand Safe */}
                  {isColVisible('brandSafe') && (
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${influencer.brandSafe ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                        {influencer.brandSafe ? 'Safe' : 'Unsafe'}
                      </span>
                    </td>
                  )}

                  {/* Status */}
                  {isColVisible('status') && (
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${
                        influencer.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                        influencer.status === 'Booked' ? 'bg-purple-50 text-purple-700' :
                        influencer.status === 'Review' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {influencer.status}
                      </span>
                    </td>
                  )}

                  {/* Profile Link */}
                  {isColVisible('profileLink') && (
                    <td className="px-3 py-2 text-[11px] font-semibold text-blue-600 hover:underline whitespace-nowrap">
                      {influencer.profileLink ? (
                        <a href={influencer.profileLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1">
                          Link <ExternalLink size={10} />
                        </a>
                      ) : '—'}
                    </td>
                  )}

                  {/* ROI */}
                  {isColVisible('roi') && (
                    <td className="px-3 py-2 text-right font-bold text-slate-800 text-[11px] whitespace-nowrap">
                      {influencer.roi !== undefined && influencer.roi !== null ? `${influencer.roi}%` : '—'}
                    </td>
                  )}

                  {/* CPA */}
                  {isColVisible('cpa') && (
                    <td className="px-3 py-2 text-right font-bold text-slate-800 text-[11px] whitespace-nowrap">
                      {influencer.cpa !== undefined && influencer.cpa !== null ? formatCurrency(influencer.cpa, organization?.currency) : '—'}
                    </td>
                  )}

                  {/* CPI */}
                  {isColVisible('cpi') && (
                    <td className="px-3 py-2 text-right font-bold text-slate-800 text-[11px] whitespace-nowrap">
                      {influencer.cpi !== undefined && influencer.cpi !== null ? formatCurrency(influencer.cpi, organization?.currency) : '—'}
                    </td>
                  )}

                  {/* LTV */}
                  {isColVisible('ltv') && (
                    <td className="px-3 py-2 text-right font-bold text-slate-800 text-[11px] whitespace-nowrap">
                      {influencer.ltv !== undefined && influencer.ltv !== null ? formatCurrency(influencer.ltv, organization?.currency) : '—'}
                    </td>
                  )}

                  {/* Notes */}
                  {isColVisible('notes') && (
                    <td className="px-3 py-2 max-w-[150px] truncate text-[10px] text-slate-500 font-medium whitespace-nowrap" title={influencer.notes}>
                      {influencer.notes || '—'}
                    </td>
                  )}

                  {/* Row Actions Trigger */}
                  <td
                    className="px-3 py-2 text-center whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation()
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        influencer,
                      })
                    }}
                  >
                    <button
                      type="button"
                      className="p-1 rounded text-slate-400 hover:text-slate-900 transition cursor-pointer"
                    >
                      <MoreVertical size={12} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Right-Click Context Menu Popup */}
      {contextMenu.influencer && (() => {
        const screenWidth = window.innerWidth
        const screenHeight = window.innerHeight
        const menuWidth = 220
        const menuHeight = 320
        const left = contextMenu.x + menuWidth > screenWidth ? Math.max(16, screenWidth - menuWidth - 16) : contextMenu.x
        const top = contextMenu.y + menuHeight > screenHeight ? Math.max(16, screenHeight - menuHeight - 16) : contextMenu.y
        return (
          <div
            className="fixed z-50 min-w-[200px] bg-white border border-slate-200 rounded p-1 shadow-md animate-in fade-in zoom-in-95 duration-100"
            style={{ top, left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 mb-1">
              {contextMenu.influencer.fullName}
            </div>

            <button
              onClick={() => {
                if (contextMenu.influencer) navigate(`/influencers/${contextMenu.influencer.id}`)
              }}
              className="w-full text-left px-2 py-1 text-xs text-slate-700 hover:text-black hover:bg-slate-50 rounded flex items-center gap-2 font-semibold cursor-pointer"
            >
              <ExternalLink size={12} />
              <span>Open Profile Page</span>
            </button>

            {/* Nested Pipeline Selector options */}
            <div className="border-t border-slate-100 my-1 pt-1">
              <span className="block px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase">Change Stage</span>
              {PIPELINE_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    if (contextMenu.influencer) {
                      onUpdatePipeline(contextMenu.influencer.id, status)
                      setContextMenu({ x: 0, y: 0, influencer: null })
                    }
                  }}
                  className={`w-full text-left px-3 py-0.5 text-xs rounded font-semibold cursor-pointer ${
                    contextMenu.influencer?.pipelineStatus === status
                      ? 'text-black font-bold bg-slate-100'
                      : 'text-slate-600 hover:text-black hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 my-1 pt-1">
              <button
                onClick={() => {
                  if (contextMenu.influencer) {
                    onDelete(contextMenu.influencer.id)
                    setContextMenu({ x: 0, y: 0, influencer: null })
                  }
                }}
                className="w-full text-left px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded flex items-center gap-2 font-semibold cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Delete Creator</span>
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
