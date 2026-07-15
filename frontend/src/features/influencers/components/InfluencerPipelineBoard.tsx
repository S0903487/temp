import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react'
import { Avatar } from '../../../components/shared/Avatar'
import type { Influencer, PipelineStatus } from '../types'
import { PIPELINE_STATUSES } from '../types'

type InfluencerPipelineBoardProps = {
  influencers: Influencer[]
  onUpdatePipeline: (id: string, stage: PipelineStatus) => void
  onOpenDrawer: (id: string) => void
}

export function InfluencerPipelineBoard({
  influencers,
  onUpdatePipeline,
  onOpenDrawer,
}: InfluencerPipelineBoardProps) {
  // Group influencers by pipeline status
  const columns = useMemo(() => {
    const groups: Record<PipelineStatus, Influencer[]> = {
      New: [],
      Reviewed: [],
      Contacted: [],
      Replied: [],
      Negotiating: [],
      Booked: [],
      Completed: [],
      Inactive: [],
    }

    influencers.forEach((inf) => {
      if (groups[inf.pipelineStatus]) {
        groups[inf.pipelineStatus].push(inf)
      } else {
        groups.New.push(inf) // fallback
      }
    })

    return groups
  }, [influencers])

  const handleMoveStage = (id: string, current: PipelineStatus, direction: 'forward' | 'backward') => {
    const idx = PIPELINE_STATUSES.indexOf(current)
    if (direction === 'forward' && idx < PIPELINE_STATUSES.length - 1) {
      onUpdatePipeline(id, PIPELINE_STATUSES[idx + 1])
    } else if (direction === 'backward' && idx > 0) {
      onUpdatePipeline(id, PIPELINE_STATUSES[idx - 1])
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 select-none">
      {PIPELINE_STATUSES.map((status) => {
        const list = columns[status] || []
        return (
          <div
            key={status}
            className="flex-shrink-0 w-80 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col max-h-[640px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <h4 className="text-sm font-bold text-white">{status}</h4>
              </div>
              <span className="rounded-full bg-slate-900 border border-slate-800 px-2 py-0.5 text-xs font-bold text-slate-400">
                {list.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[150px]">
              {list.length === 0 && (
                <div className="h-24 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-600">
                  <AlertCircle size={14} className="mb-1" />
                  <span>No creators in this stage</span>
                </div>
              )}

              {list.map((inf) => (
                <div
                  key={inf.id}
                  onClick={() => onOpenDrawer(inf.id)}
                  className="group bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 rounded-xl p-3 cursor-pointer shadow-sm transition duration-150 relative"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={inf.fullName} imageUrl={inf.profileImage} size={28} />
                      <div>
                        <h5 className="text-xs font-bold text-white group-hover:text-cyan-400 transition">
                          {inf.fullName}
                        </h5>
                        <p className="text-[10px] text-slate-500">@{inf.username}</p>
                      </div>
                    </div>
                    {/* Platform indicators */}
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">{inf.platform}</span>
                  </div>

                  {/* Stats snippet */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2.5">
                    <div>
                      <span className="text-slate-500">Reach:</span>{' '}
                      <span className="font-semibold text-slate-200">{inf.followers.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Eng:</span>{' '}
                      <span className="font-semibold text-cyan-400">{inf.engagementRate.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Funnel quick shifting arrow indicators */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={PIPELINE_STATUSES.indexOf(status) === 0}
                      onClick={() => handleMoveStage(inf.id, status, 'backward')}
                      className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition"
                      title="Move back"
                    >
                      <ArrowLeft size={12} />
                    </button>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Move Stage</span>
                    <button
                      type="button"
                      disabled={PIPELINE_STATUSES.indexOf(status) === PIPELINE_STATUSES.length - 1}
                      onClick={() => handleMoveStage(inf.id, status, 'forward')}
                      className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition"
                      title="Move forward"
                    >
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
