import { renderHook, act } from '@testing-library/react'
import { usePagination } from '@/hooks/use-pagination'

describe('usePagination Hook', () => {
  const mockData = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }))

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData })
    )

    expect(result.current.currentPage).toBe(1)
    expect(result.current.pageSize).toBe(10)
    expect(result.current.totalItems).toBe(50)
    expect(result.current.totalPages).toBe(5)
    expect(result.current.paginatedData).toHaveLength(10)
  })

  it('should initialize with custom page size', () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData, initialPageSize: 20 })
    )

    expect(result.current.pageSize).toBe(20)
    expect(result.current.totalPages).toBe(3)
    expect(result.current.paginatedData).toHaveLength(20)
  })

  it('should navigate to next page', () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData, initialPageSize: 10 })
    )

    act(() => {
      result.current.goToNextPage()
    })

    expect(result.current.currentPage).toBe(2)
    expect(result.current.paginatedData[0].id).toBe(11)
  })

  it('should navigate to previous page', () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData, initialPageSize: 10, initialPage: 2 })
    )

    act(() => {
      result.current.goToPreviousPage()
    })

    expect(result.current.currentPage).toBe(1)
    expect(result.current.paginatedData[0].id).toBe(1)
  })

  it('should navigate to first page', () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData, initialPageSize: 10, initialPage: 3 })
    )

    act(() => {
      result.current.goToFirstPage()
    })

    expect(result.current.currentPage).toBe(1)
  })

  it('should navigate to last page', () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData, initialPageSize: 10 })
    )

    act(() => {
      result.current.goToLastPage()
    })

    expect(result.current.currentPage).toBe(5)
    expect(result.current.paginatedData).toHaveLength(10)
  })

  it('should set specific page', () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData, initialPageSize: 10 })
    )

    act(() => {
      result.current.setCurrentPage(3)
    })

    expect(result.current.currentPage).toBe(3)
    expect(result.current.paginatedData[0].id).toBe(21)
  })

  it('should change page size', () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData, initialPageSize: 10 })
    )

    act(() => {
      result.current.setPageSize(25)
    })

    expect(result.current.pageSize).toBe(25)
    expect(result.current.totalPages).toBe(2)
    expect(result.current.paginatedData).toHaveLength(25)
  })

  it('should handle empty data array', () => {
    const { result } = renderHook(() =>
      usePagination({ data: [] })
    )

    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPages).toBe(1)
    expect(result.current.paginatedData).toHaveLength(0)
  })

  it('should not go beyond last page', () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData, initialPageSize: 10, initialPage: 5 })
    )

    act(() => {
      result.current.goToNextPage()
    })

    expect(result.current.currentPage).toBe(5)
  })

  it('should not go below first page', () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData, initialPageSize: 10, initialPage: 1 })
    )

    act(() => {
      result.current.goToPreviousPage()
    })

    expect(result.current.currentPage).toBe(1)
  })

  it('should handle data with length not divisible by page size', () => {
    const smallData = Array.from({ length: 23 }, (_, i) => ({ id: i + 1 }))
    const { result } = renderHook(() =>
      usePagination({ data: smallData, initialPageSize: 10 })
    )

    expect(result.current.totalPages).toBe(3)

    act(() => {
      result.current.goToLastPage()
    })

    expect(result.current.paginatedData).toHaveLength(3)
  })
})
