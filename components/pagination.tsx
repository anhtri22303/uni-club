"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
  simple?: boolean // 新增：是否使用简洁样式
}

// 简洁分页组件 - 样式像图片中那样
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        className={`
          flex items-center gap-1 px-3 py-1.5 text-sm font-medium
          transition-colors
          ${isFirstPage 
            ? 'text-muted-foreground/50 cursor-not-allowed' 
            : 'text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer'
          }
        `}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
      </button>
      
      <span className="text-sm font-medium text-cyan-500 dark:text-cyan-400 px-2">
        {currentPage}/{totalPages}
      </span>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        className={`
          flex items-center gap-1 px-3 py-1.5 text-sm font-medium
          transition-colors
          ${isLastPage 
            ? 'text-muted-foreground/50 cursor-not-allowed' 
            : 'text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer'
          }
        `}
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 12, 24, 48],
  simple = true, // 默认使用简洁样式
}: PaginationProps) {
  if (totalPages <= 1) return null

  // 如果使用简洁样式，返回 SimplePagination
  if (simple) {
    return <SimplePagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
  }

  // 否则使用完整样式（保留原有功能）
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const getVisiblePages = () => {
    const delta = 2
    const range: number[] = []
    const rangeWithDots: (number | "...")[] = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalItems} results
        </p>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Rows per page</p>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          aria-label="First page"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Previous page"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={page === "..."}
              className="h-8 w-8 p-0"
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          aria-label="Next page"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Last page"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
