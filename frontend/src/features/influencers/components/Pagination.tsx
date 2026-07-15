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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-3.5 border-t border-slate-100">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 font-bold focus:outline-none focus:ring-0 cursor-pointer"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>per page</span>
        {totalItems > 0 && (
          <span className="ml-1.5 font-bold text-slate-600">
            (Showing {startItem}–{endItem} of {totalItems})
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={handlePrev}
          className="px-2.5 py-1.5 rounded border border-slate-200 bg-white text-xs text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
              className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                currentPage === page
                  ? 'bg-black text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={handleNext}
          className="px-2.5 py-1.5 rounded border border-slate-200 bg-white text-xs text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  )
}
