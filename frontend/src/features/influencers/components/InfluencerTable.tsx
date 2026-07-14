import { Link } from 'react-router-dom'
import { Avatar } from '../../../components/shared/Avatar'
import { PipelineStatusBadge } from './PipelineStatusSelect'
import type { Influencer } from '../types'

type InfluencerTableProps = {
  influencers: Influencer[]
}

export function InfluencerTable({ influencers }: InfluencerTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-lg shadow-slate-950/20">
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
        <thead className="bg-slate-900/90 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Creator</th>
            <th className="px-4 py-3 font-medium">Platform</th>
            <th className="px-4 py-3 font-medium">Followers</th>
            <th className="px-4 py-3 font-medium">Engagement</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Pipeline</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-300">
          {influencers.map((influencer) => (
            <tr key={influencer.id} className="hover:bg-slate-800/70">
              <td className="px-4 py-3">
                <Link to={`/influencers/${influencer.id}`} className="flex items-center gap-3 hover:opacity-80">
                  <Avatar name={influencer.fullName} imageUrl={influencer.profileImage} size={40} />
                  <div>
                    <p className="font-semibold text-white">{influencer.fullName}</p>
                    <p className="text-xs text-slate-500">{influencer.username}</p>
                  </div>
                </Link>
              </td>
              <td className="px-4 py-3">{influencer.platform}</td>
              <td className="px-4 py-3">{influencer.followers.toLocaleString()}</td>
              <td className="px-4 py-3">{influencer.engagementRate.toFixed(1)}%</td>
              <td className="px-4 py-3">{influencer.category}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                  {influencer.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <PipelineStatusBadge status={influencer.pipelineStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
