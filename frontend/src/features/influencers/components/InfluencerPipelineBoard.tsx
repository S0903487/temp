import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react'
import { Avatar } from '../../../components/shared/Avatar'
import type { Influencer, PipelineStatus } from '../types'
import { PIPELINE_STATUSES } from '../types'

type InfluencerPipelineBoardProps = {
  influencers: Influencer[]
  onUpdatePipeline: (id: string, stage: PipelineStatus) => void
}

export function InfluencerPipelineBoard({
  influencers,
  onUpdatePipeline,
}: InfluencerPipelineBoardProps) {
  const navigate = useNavigate()
  
  const [pages, setPages] = useState<Record<PipelineStatus, number>>({
    New: 1,
    Reviewed: 1,
    Contacted: 1,
    Replied: 1,
    Negotiating: 1,
    Booked: 1,
    Completed: 1,
    Inactive: 1,
  })

  const PAGE_SIZE = 10

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
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 select-none themed-scrollbar">
      {PIPELINE_STATUSES.map((status) => {
        const list = columns[status] || []
        const hasPagination = list.length > 25
        const currentPage = pages[status] || 1
        const totalPages = Math.ceil(list.length / PAGE_SIZE) || 1
        
        const displayedList = hasPagination 
          ? list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
          : list

        return (
          <div
            key={status}
            className="flex-shrink-0 w-72 rounded border border-slate-200 bg-slate-50 p-3.5 flex flex-col max-h-[600px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                <h4 className="text-xs font-bold text-slate-800">{status}</h4>
              </div>
              <span className="rounded bg-slate-200 border border-slate-300 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                {list.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[150px] themed-scrollbar">
              {displayedList.length === 0 && (
                <div className="h-20 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded text-xs text-slate-400">
                  <AlertCircle size={12} className="mb-1 text-slate-300" />
                  <span className="text-[11px] font-bold">No creators in this stage</span>
                </div>
              )}

              {displayedList.map((inf) => (
                <div
                  key={inf.id}
                  onClick={() => navigate(`/influencers/${inf.id}`)}
                  className="group bg-white border border-slate-200 hover:border-slate-400 rounded p-3 cursor-pointer shadow-xs transition duration-150 relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={inf.fullName} imageUrl={inf.profileImage} size={26} />
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 group-hover:text-black transition">
                          {inf.fullName}
                        </h5>
                        <p className="text-[10px] text-slate-400">{inf.username}</p>
                      </div>
                    </div>
                    {/* Platform indicators */}
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{inf.platform}</span>
                  </div>

                  {/* Stats snippet */}
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2">
                    <div>
                      <span className="text-slate-400 font-semibold">Reach:</span>{' '}
                      <span className="font-bold text-slate-700">{inf.followers.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Eng:</span>{' '}
                      <span className="font-bold text-slate-700">{inf.engagementRate.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Funnel quick shifting arrow indicators */}
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={PIPELINE_STATUSES.indexOf(status) === 0}
                      onClick={() => handleMoveStage(inf.id, status, 'backward')}
                      className="p-1 rounded text-slate-400 hover:text-black hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Move back"
                    >
                      <ArrowLeft size={11} />
                    </button>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Move Stage</span>
                    <button
                      type="button"
                      disabled={PIPELINE_STATUSES.indexOf(status) === PIPELINE_STATUSES.length - 1}
                      onClick={() => handleMoveStage(inf.id, status, 'forward')}
                      className="p-1 rounded text-slate-400 hover:text-black hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Move forward"
                    >
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls inside column if exceeds 25 */}
            {hasPagination && (
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPages(prev => ({ ...prev, [status]: Math.max(1, currentPage - 1) }))}
                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Prev
                </button>
                <span className="font-semibold">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPages(prev => ({ ...prev, [status]: Math.min(totalPages, currentPage + 1) }))}
                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
