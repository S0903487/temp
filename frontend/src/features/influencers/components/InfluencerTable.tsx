import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Avatar } from '../../../components/shared/Avatar'
import { PipelineStatusBadge } from './PipelineStatusSelect'
import type { Influencer } from '../types'
import { useAuthUser } from '../../auth/hooks/useAuth'

export type SortField = 'fullName' | 'followers' | 'engagementRate' | 'category' | 'pipelineStatus'

type InfluencerTableProps = {
  influencers: Influencer[]
  sortField: SortField
  sortOrder: 'asc' | 'desc'
  onSort: (field: SortField) => void
  visibleColumns: string[]
}

export function InfluencerTable({
  influencers,
  sortField,
  sortOrder,
  onSort,
  visibleColumns,
}: InfluencerTableProps) {
  const navigate = useNavigate()
  const { data: currentUser } = useAuthUser()

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button') || target.closest('select')) {
      return
    }
    navigate(`/influencers/${id}`)
  }

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? <ArrowUp size={12} className="inline ml-1 text-cyan-400" /> : <ArrowDown size={12} className="inline ml-1 text-cyan-400" />
  }

  const isColVisible = (col: string) => visibleColumns.includes(col)

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-lg shadow-slate-950/20">
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
        <thead className="bg-slate-900/90 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition select-none whitespace-nowrap" onClick={() => onSort('fullName')}>
              Creator {renderSortIndicator('fullName')}
            </th>
            {isColVisible('platform') && <th className="px-4 py-3 font-medium whitespace-nowrap">Platform</th>}
            {isColVisible('followers') && (
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition select-none whitespace-nowrap" onClick={() => onSort('followers')}>
                Followers {renderSortIndicator('followers')}
              </th>
            )}
            {isColVisible('engagement') && (
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition select-none whitespace-nowrap" onClick={() => onSort('engagementRate')}>
                Engagement {renderSortIndicator('engagementRate')}
              </th>
            )}
            {isColVisible('category') && (
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition select-none whitespace-nowrap" onClick={() => onSort('category')}>
                Category {renderSortIndicator('category')}
              </th>
            )}
            {isColVisible('contact') && <th className="px-4 py-3 font-medium whitespace-nowrap">Contact</th>}
            {isColVisible('status') && <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>}
            {isColVisible('pipeline') && (
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition select-none whitespace-nowrap" onClick={() => onSort('pipelineStatus')}>
                Pipeline {renderSortIndicator('pipelineStatus')}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-300">
          {influencers.map((influencer) => {
            const isOtherOrg = currentUser && influencer.organizationId !== currentUser.organizationId;
            return (
              <tr
                key={influencer.id}
                onClick={(e) => handleRowClick(influencer.id, e)}
                className="hover:bg-slate-800/40 cursor-pointer transition"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Avatar name={influencer.fullName} imageUrl={influencer.profileImage} size={40} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white whitespace-nowrap">{influencer.fullName}</p>
                        {isOtherOrg && (
                          <span className="inline-flex items-center rounded-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider select-none whitespace-nowrap">
                            Created by Other
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">@{influencer.username}</p>
                    </div>
                  </div>
                </td>
              {isColVisible('platform') && <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{influencer.platform}</td>}
              {isColVisible('followers') && <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">{influencer.followers.toLocaleString()}</td>}
              {isColVisible('engagement') && <td className="px-4 py-3 text-cyan-400 font-semibold whitespace-nowrap">{influencer.engagementRate.toFixed(1)}%</td>}
              {isColVisible('category') && <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 whitespace-nowrap">{influencer.category}</span></td>}
              {isColVisible('contact') && (
                <td className="px-4 py-3 text-xs space-y-0.5 whitespace-nowrap">
                  <p className="text-slate-300">{influencer.email || '—'}</p>
                  <p className="text-slate-500">{influencer.phone || ''}</p>
                </td>
              )}
              {isColVisible('status') && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 font-medium whitespace-nowrap">
                    {influencer.status}
                  </span>
                </td>
              )}
              {isColVisible('pipeline') && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <PipelineStatusBadge status={influencer.pipelineStatus} />
                </td>
              )}
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  )
}
