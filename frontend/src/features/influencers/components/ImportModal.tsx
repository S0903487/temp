import { useState, useEffect, useRef } from 'react'
import { X, Upload, Check, FileSpreadsheet, Camera, Sparkles, Download, AlertCircle, FileText, RefreshCw } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { useBulkUpsertInfluencers } from '../hooks/useInfluencers'
import type { BulkUpdateItem } from '../services/influencerService'

type ImportModalProps = {
  isOpen: boolean
  onClose: () => void
  onManualClick: () => void
  onImportSuccess?: () => void
}

export function ImportModal({ isOpen, onClose, onManualClick, onImportSuccess }: ImportModalProps) {
  const [method, setMethod] = useState<'file' | 'api' | 'none'>('none')
  const [apiPlatform, setApiPlatform] = useState<'instagram' | 'tiktok' | 'youtube'>('instagram')
  const [inputValue, setInputValue] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'preview' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [parsedData, setParsedData] = useState<BulkUpdateItem[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkUpsert = useBulkUpsertInfluencers()

  // Freeze body scroll when modal appears
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    } else {
      resetState()
    }
  }, [isOpen])

  const resetState = () => {
    setMethod('none')
    setInputValue('')
    setStatus('idle')
    setErrorMessage(null)
    setParsedData([])
    setFileName('')
    setProgress({ current: 0, total: 0 })
  }

  if (!isOpen) return null

  // Map arbitrary key variants to standardized BulkUpdateItem fields
  const normalizeRow = (raw: Record<string, unknown>): BulkUpdateItem | null => {
    const keys = Object.keys(raw)
    const getVal = (...names: string[]): unknown => {
      for (const name of names) {
        const foundKey = keys.find((k) => k.trim().toLowerCase() === name.toLowerCase())
        if (foundKey && raw[foundKey] !== undefined && raw[foundKey] !== null && String(raw[foundKey]).trim() !== '') {
          return raw[foundKey]
        }
      }
      return undefined
    }

    const username = getVal('username', 'handle', 'user', 'instagram', 'tiktok', 'youtube', 'social handle', 'creator handle')
    const fullName = getVal('fullName', 'full_name', 'name', 'creator name', 'creator', 'influencer', 'title') || username
    const platform = getVal('platform', 'network', 'channel') || 'Instagram'

    if (!username && !fullName) return null

    const cleanNumber = (val: unknown) => {
      if (val === undefined || val === null) return undefined
      const num = Number(String(val).replace(/[^0-9.-]+/g, ''))
      return isNaN(num) ? undefined : num
    }

    const cleanBool = (val: unknown) => {
      if (val === undefined || val === null) return undefined
      const s = String(val).trim().toLowerCase()
      if (s === 'true' || s === 'yes' || s === '1') return true
      if (s === 'false' || s === 'no' || s === '0') return false
      return undefined
    }

    const platformStr = String(platform)
    const validPlatform = (['Instagram', 'TikTok', 'YouTube'].includes(platformStr) ? platformStr : 'Instagram') as 'Instagram' | 'TikTok' | 'YouTube'

    return {
      id: getVal('id', 'influencer_id', 'profile_id') ? String(getVal('id', 'influencer_id', 'profile_id')) : undefined,
      fullName: String(fullName),
      username: username ? String(username).replace(/^@/, '').trim() : undefined,
      platform: validPlatform,
      category: getVal('category', 'niche', 'industry') ? String(getVal('category', 'niche', 'industry')) : undefined,
      country: getVal('country', 'location', 'region') ? String(getVal('country', 'location', 'region')) : undefined,
      language: getVal('language', 'lang') ? String(getVal('language', 'lang')) : undefined,
      followers: cleanNumber(getVal('followers', 'follower_count', 'followers_count', 'audience')),
      following: cleanNumber(getVal('following', 'following_count')),
      totalPosts: cleanNumber(getVal('totalPosts', 'total_posts', 'posts')),
      firstJoinedDate: getVal('firstJoinedDate', 'first_joined_date', 'joined_date') ? String(getVal('firstJoinedDate', 'first_joined_date', 'joined_date')) : undefined,
      engagementRate: cleanNumber(getVal('engagementRate', 'engagement_rate', 'engagement', 'eng_rate')),
      averageViews: cleanNumber(getVal('averageViews', 'average_views', 'views', 'avg_views')),
      totalViews: cleanNumber(getVal('totalViews', 'total_views')),
      averageLikes: cleanNumber(getVal('averageLikes', 'average_likes', 'avg_likes')),
      totalLikes: cleanNumber(getVal('totalLikes', 'total_likes')),
      averageComments: cleanNumber(getVal('averageComments', 'average_comments', 'avg_comments')),
      totalComments: cleanNumber(getVal('totalComments', 'total_comments')),
      email: getVal('email', 'contact_email', 'mail') ? String(getVal('email', 'contact_email', 'mail')) : undefined,
      phone: getVal('phone', 'contact_phone', 'mobile') ? String(getVal('phone', 'contact_phone', 'mobile')) : undefined,
      pipelineStatus: getVal('pipelineStatus', 'pipeline_status', 'outreach_stage', 'stage', 'pipeline') ? String(getVal('pipelineStatus', 'pipeline_status', 'outreach_stage', 'stage', 'pipeline')) : 'New',
      status: getVal('status', 'health_status') ? String(getVal('status', 'health_status')) : 'Active',
      pricePost: cleanNumber(getVal('pricePost', 'price_post', 'rate_post', 'price')),
      priceStory: cleanNumber(getVal('priceStory', 'price_story', 'rate_story')),
      verified: cleanBool(getVal('verified', 'is_verified')),
      brandSafe: cleanBool(getVal('brandSafe', 'brand_safe', 'is_brand_safe')),
      bio: getVal('bio', 'description') ? String(getVal('bio', 'description')) : undefined,
      notes: getVal('notes', 'comments') ? String(getVal('notes', 'comments')) : undefined,
      profileLink: getVal('profileLink', 'profile_link', 'url') ? String(getVal('profileLink', 'profile_link', 'url')) : undefined,
      roi: cleanNumber(getVal('roi')),
      cpa: cleanNumber(getVal('cpa')),
      cpi: cleanNumber(getVal('cpi')),
      ltv: cleanNumber(getVal('ltv')),
    }
  }

  const processFile = async (file: File) => {
    setFileName(file.name)
    setStatus('parsing')
    setErrorMessage(null)

    try {
      const extension = file.name.split('.').pop()?.toLowerCase()

      if (extension === 'json') {
        const text = await file.text()
        const rawJson = JSON.parse(text)
        const itemsArray = Array.isArray(rawJson) ? rawJson : rawJson.items || [rawJson]
        const normalized = itemsArray.map(normalizeRow).filter((r): r is BulkUpdateItem => r !== null)

        if (normalized.length === 0) {
          throw new Error('No valid influencer records found in JSON file.')
        }
        setParsedData(normalized)
        setStatus('preview')
      } else if (extension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const normalized = (results.data as Record<string, unknown>[])
              .map(normalizeRow)
              .filter((r): r is BulkUpdateItem => r !== null)

            if (normalized.length === 0) {
              setErrorMessage('No valid influencer records found in CSV.')
              setStatus('error')
              return
            }
            setParsedData(normalized)
            setStatus('preview')
          },
          error: (err) => {
            setErrorMessage(`Failed to parse CSV: ${err.message}`)
            setStatus('error')
          },
        })
      } else if (['xlsx', 'xls'].includes(extension || '')) {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

        const normalized = jsonRows.map(normalizeRow).filter((r): r is BulkUpdateItem => r !== null)

        if (normalized.length === 0) {
          throw new Error('No valid influencer records found in Excel worksheet.')
        }
        setParsedData(normalized)
        setStatus('preview')
      } else {
        throw new Error('Unsupported file format. Please upload .xlsx, .csv, or .json.')
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error processing file')
      setStatus('error')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const handleExecuteImport = async () => {
    if (parsedData.length === 0) return

    setStatus('uploading')
    const CHUNK_SIZE = 500
    const totalChunks = Math.ceil(parsedData.length / CHUNK_SIZE)

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunk = parsedData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
        setProgress({ current: Math.min((i + 1) * CHUNK_SIZE, parsedData.length), total: parsedData.length })

        await bulkUpsert.mutateAsync(chunk)
      }

      setStatus('success')
      setTimeout(() => {
        onImportSuccess?.()
        onClose()
      }, 1200)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to bulk import creators.')
      setStatus('error')
    }
  }

  const downloadSampleTemplate = () => {
    const sampleRows = [
      {
        fullName: 'Alexander Wright',
        username: 'alex_tech_reviews',
        platform: 'YouTube',
        category: 'Technology',
        country: 'United States',
        language: 'English',
        followers: 450000,
        engagementRate: 5.4,
        averageViews: 125000,
        email: 'alexander@techreviews.com',
        phone: '+1 555-0192',
        pipelineStatus: 'Contacted',
        pricePost: 1200,
        priceStory: 450,
      },
      {
        fullName: 'Elena Rostova',
        username: 'elena_fits',
        platform: 'Instagram',
        category: 'Fitness & Wellness',
        country: 'United Kingdom',
        language: 'English',
        followers: 180000,
        engagementRate: 6.2,
        averageViews: 45000,
        email: 'elena@rostovafit.co.uk',
        phone: '+44 7700 900077',
        pipelineStatus: 'Booked',
        pricePost: 750,
        priceStory: 300,
      }
    ]

    const ws = XLSX.utils.json_to_sheet(sampleRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Creators_Bulk_Import')
    XLSX.writeFile(wb, 'InfluenceOS_Creators_Bulk_Template.xlsx')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Bulk Creator Import Engine</h3>
            <p className="text-[11px] text-slate-500 font-medium">Upsert 50K+ creator profiles from Excel, CSV, or JSON spreadsheets.</p>
          </div>
          <button onClick={onClose} className="rounded border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 transition cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {status === 'parsing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <RefreshCw size={28} className="text-slate-900 animate-spin mb-3" />
            <h4 className="text-sm font-semibold text-slate-900">Parsing Spreadsheet Records...</h4>
            <p className="text-xs text-slate-500 mt-1">Normalizing handles, emails, engagement statistics and rates.</p>
          </div>
        )}

        {status === 'uploading' && (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-4 border border-slate-200">
              <div
                className="bg-black h-full transition-all duration-300"
                style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              Syncing {progress.current} of {progress.total} creators to database...
            </h4>
            <p className="text-xs text-slate-500 mt-1">Atomically updating handles and pipeline stages in high-throughput D1 batches.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 border border-emerald-200">
              <Check size={24} />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Bulk Database Sync Complete</h4>
            <p className="text-xs text-slate-500 mt-1">Successfully upserted {parsedData.length} creators into your organization repository.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center text-center">
            <AlertCircle size={28} className="text-red-500 mb-2" />
            <h4 className="text-sm font-semibold text-slate-900">Import Encountered an Error</h4>
            <p className="text-xs text-red-600 mt-1 max-w-md bg-red-50 p-2.5 rounded border border-red-200">{errorMessage}</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 px-4 py-1.5 bg-black text-white rounded text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {status === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <FileText size={16} className="text-slate-500" />
                <span>{fileName}</span>
              </div>
              <span className="text-xs font-semibold bg-black text-white px-2 py-0.5 rounded">
                {parsedData.length} Creators Detected
              </span>
            </div>

            <div className="border border-slate-200 rounded max-h-48 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                  <tr>
                    <th className="p-2 border-b">Name</th>
                    <th className="p-2 border-b">Handle</th>
                    <th className="p-2 border-b">Platform</th>
                    <th className="p-2 border-b">Followers</th>
                    <th className="p-2 border-b">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {parsedData.slice(0, 6).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-bold whitespace-nowrap">{item.fullName}</td>
                      <td className="p-2 text-slate-500 font-mono whitespace-nowrap">@{item.username || '—'}</td>
                      <td className="p-2 whitespace-nowrap">{item.platform}</td>
                      <td className="p-2 font-semibold whitespace-nowrap">{item.followers ? item.followers.toLocaleString() : '—'}</td>
                      <td className="p-2 whitespace-nowrap">{item.pipelineStatus || 'New'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 6 && (
                <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-50 border-t border-slate-100 font-medium">
                  + {parsedData.length - 6} more rows ready for bulk processing
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                ← Change File
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-4 py-2 bg-black text-white rounded text-xs font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs"
              >
                Upsert {parsedData.length} Creators
              </button>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div className="space-y-4">
            {method === 'none' && (
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('file')}
                  className="flex items-center gap-3.5 rounded-lg border border-slate-200 bg-white p-3.5 text-left hover:bg-slate-50 transition group cursor-pointer shadow-xs"
                >
                  <div className="h-10 w-10 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 group-hover:text-black transition">Spreadsheet / JSON Bulk Import</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Upload .xlsx, .csv, or .json with auto-mapped handles, engagement, and rates.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('api')}
                  className="flex items-center gap-3.5 rounded-lg border border-slate-200 bg-white p-3.5 text-left hover:bg-slate-50 transition group cursor-pointer shadow-xs"
                >
                  <div className="h-10 w-10 rounded bg-pink-50 text-pink-700 flex items-center justify-center border border-pink-100 flex-shrink-0">
                    <Camera size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 group-hover:text-black transition">Quick Social Handle Add</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Quickly import an Instagram, TikTok, or YouTube creator by handle.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onManualClick()
                  }}
                  className="flex items-center gap-3.5 rounded-lg border border-slate-200 bg-white p-3.5 text-left hover:bg-slate-50 transition group cursor-pointer shadow-xs"
                >
                  <div className="h-10 w-10 rounded bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100 flex-shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 group-hover:text-black transition">Single Manual Form Entry</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Add a specific partner manually to your roster with custom notes.</p>
                  </div>
                </button>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={downloadSampleTemplate}
                    className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-black hover:underline cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download Excel Template</span>
                  </button>
                </div>
              </div>
            )}

            {method === 'file' && (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  accept=".xlsx,.xls,.csv,.json"
                  className="hidden"
                />

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition cursor-pointer ${
                    dragActive ? 'border-black bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Upload size={28} className="text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-800">Drag & drop your file here, or click to browse</p>
                  <p className="text-[10px] text-slate-500 mt-1">Supports Excel (.xlsx, .xls), CSV (.csv), and JSON (.json) up to 50MB</p>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <button type="button" onClick={() => setMethod('none')} className="font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer">
                    ← Back to choices
                  </button>
                  <button
                    type="button"
                    onClick={downloadSampleTemplate}
                    className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-black hover:underline cursor-pointer"
                  >
                    <Download size={12} />
                    <span>Sample Excel Template</span>
                  </button>
                </div>
              </div>
            )}

            {method === 'api' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(['instagram', 'tiktok', 'youtube'] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setApiPlatform(plat)}
                      className={`flex-1 py-1.5 text-xs font-bold capitalize rounded border transition cursor-pointer ${
                        apiPlatform === plat ? 'border-black bg-black text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
                    className="block w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:ring-0 transition"
                  />
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => setMethod('none')} className="font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!inputValue.trim()) return
                      setParsedData([{
                        fullName: inputValue.trim(),
                        username: inputValue.trim().replace(/^@/, ''),
                        platform: apiPlatform === 'instagram' ? 'Instagram' : apiPlatform === 'tiktok' ? 'TikTok' : 'YouTube',
                      }])
                      setStatus('preview')
                    }}
                    disabled={!inputValue.trim()}
                    className="rounded bg-black px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Fetch & Preview
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
