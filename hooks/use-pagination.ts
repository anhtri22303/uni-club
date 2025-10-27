"use client"

import { useState, useMemo } from "react"

interface UsePaginationProps<T> {
  data: T[]
  initialPageSize?: number
  initialPage?: number
}

interface UsePaginationReturn<T> {
  currentPage: number
  pageSize: number
  totalPages: number
  totalItems: number
  paginatedData: T[]
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  goToFirstPage: () => void
  goToLastPage: () => void
  goToNextPage: () => void
  goToPreviousPage: () => void
}

export function usePagination<T>({
  data,
  initialPageSize = 10,
  initialPage = 1,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const safeData = useMemo(() => data || [], [data])
  const totalItems = safeData.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return safeData.slice(startIndex, endIndex)
  }, [safeData, currentPage, pageSize])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    // Reset to first page when page size changes
    setCurrentPage(1)
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)
  const goToNextPage = () => handlePageChange(currentPage + 1)
  const goToPreviousPage = () => handlePageChange(currentPage - 1)

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
  }
}
