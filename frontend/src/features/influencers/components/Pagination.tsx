type PaginationProps = {
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-4 border-t border-slate-800/80">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-0"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>per page</span>
        {totalItems > 0 && (
          <span className="ml-2 font-medium">
            (Showing {startItem}–{endItem} of {totalItems})
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={handlePrev}
          className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
          .map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentPage === page
                  ? 'bg-cyan-500 text-slate-950'
                  : 'border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white'
              }`}
            >
              {page}
            </button>
          ))}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={handleNext}
          className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold"
        >
          Next
        </button>
      </div>
    </div>
  )
}
