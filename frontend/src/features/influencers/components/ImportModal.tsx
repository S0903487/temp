import { useState } from 'react'
import { X, Upload, Check, FileSpreadsheet, Camera, Sparkles } from 'lucide-react'

type ImportModalProps = {
  isOpen: boolean
  onClose: () => void
  onManualClick: () => void
  onImportSuccess: (data: Record<string, unknown>[]) => void
}

export function ImportModal({ isOpen, onClose, onManualClick, onImportSuccess }: ImportModalProps) {
  const [method, setMethod] = useState<'csv' | 'api' | 'none'>('none')
  const [apiPlatform, setApiPlatform] = useState<'instagram' | 'tiktok' | 'youtube' | 'none'>('none')
  const [inputValue, setInputValue] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  if (!isOpen) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateImport()
    }
  }

  const simulateImport = () => {
    setStatus('loading')
    setTimeout(() => {
      setStatus('success')
      // Simulate providing some sample imported influencers back
      setTimeout(() => {
        onImportSuccess([
          { fullName: 'Imported Creator Alpha', username: 'alpha_imported', platform: 'Instagram', followers: 120000, engagementRate: 4.2 },
          { fullName: 'Imported Creator Beta', username: 'beta_tiktok', platform: 'TikTok', followers: 350000, engagementRate: 6.8 },
        ])
        onClose()
        setStatus('idle')
        setMethod('none')
      }, 1500)
    }, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      
      <div className="relative w-full max-w-lg overflow-hidden rounded border border-slate-200 bg-white p-5 shadow-xl flex flex-col max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-base font-extrabold text-slate-900">Import Creators Directory</h3>
          <button onClick={onClose} className="rounded border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 transition cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {status === 'loading' && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <span className="h-8 w-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mb-4" />
            <h4 className="text-sm font-extrabold text-slate-900">Executing data pipeline...</h4>
            <p className="text-xs text-slate-500 mt-1">Validating email handles, follower sizes and deduplicating rows.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-200">
              <Check size={20} />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Pipeline Sync Complete</h4>
            <p className="text-xs text-slate-500 mt-1">Creators have been appended to your active organization roster.</p>
          </div>
        )}

        {status === 'idle' && (
          <div className="space-y-4">
            {method === 'none' && (
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('csv')}
                  className="flex items-center gap-3.5 rounded border border-slate-200 bg-white p-3 text-left hover:bg-slate-50 transition group cursor-pointer"
                >
                  <div className="h-9 w-9 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-black transition">Bulk CSV / Excel File Drop</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Upload .csv lists with customized tags, emails and contracts.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMethod('api')
                    setApiPlatform('instagram')
                  }}
                  className="flex items-center gap-3.5 rounded border border-slate-200 bg-white p-3 text-left hover:bg-slate-50 transition group cursor-pointer"
                >
                  <div className="h-9 w-9 rounded bg-pink-50 text-pink-700 flex items-center justify-center border border-pink-100 flex-shrink-0">
                    <Camera size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-black transition">Instagram / TikTok / YouTube Sync</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Auto-pull handle statistics, engagement and bio logs instantly.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onManualClick()
                  }}
                  className="flex items-center gap-3.5 rounded border border-slate-200 bg-white p-3 text-left hover:bg-slate-50 transition group cursor-pointer"
                >
                  <div className="h-9 w-9 rounded bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100 flex-shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-black transition">Single Manual CRM Entry</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Add a specific partner manually to your campaigns list.</p>
                  </div>
                </button>
              </div>
            )}

            {/* CSV File Drop Interface */}
            {method === 'csv' && (
              <div className="space-y-4">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded p-6 flex flex-col items-center justify-center text-center transition cursor-pointer ${
                    dragActive
                      ? 'border-slate-900 bg-slate-50 text-slate-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                  onClick={simulateImport}
                >
                  <Upload size={24} className="text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Drag and drop your spreadsheet here</p>
                  <p className="text-[10px] text-slate-500 mt-1">Accepts standard .csv up to 10MB (click to browse samples)</p>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => setMethod('none')} className="font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer">
                    ← Back to choices
                  </button>
                </div>
              </div>
            )}

            {/* Social handles fetch interface */}
            {method === 'api' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(['instagram', 'tiktok', 'youtube'] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setApiPlatform(plat)}
                      className={`flex-1 py-1.5 text-xs font-bold capitalize rounded border transition cursor-pointer ${
                        apiPlatform === plat
                          ? 'border-black bg-black text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Creator Username Handle</span>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="e.g. liam_tech_review"
                    className="block w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:border-slate-900 focus:ring-0 transition"
                  />
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => setMethod('none')} className="font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={simulateImport}
                    disabled={!inputValue.trim()}
                    className="rounded bg-black px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Fetch & Import
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
