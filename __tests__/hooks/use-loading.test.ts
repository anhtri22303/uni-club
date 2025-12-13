import { renderHook, act } from '@testing-library/react'
import { useLoading } from '@/hooks/use-loading'

describe('useLoading', () => {
  it('should initialize with default loading state', () => {
    const { result } = renderHook(() => useLoading())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadingMessage).toBeUndefined()
  })

  it('should initialize with custom initial state', () => {
    const { result } = renderHook(() => useLoading({ initialState: true }))

    expect(result.current.isLoading).toBe(true)
  })

  it('should start loading', () => {
    const { result } = renderHook(() => useLoading())

    act(() => {
      result.current.startLoading('Loading data...')
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.loadingMessage).toBe('Loading data...')
  })

  it('should start loading without message', () => {
    const { result } = renderHook(() => useLoading())

    act(() => {
      result.current.startLoading()
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.loadingMessage).toBeUndefined()
  })

  it('should stop loading', () => {
    const { result } = renderHook(() => useLoading({ initialState: true }))

    act(() => {
      result.current.stopLoading()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadingMessage).toBeUndefined()
  })

  it('should handle async operations with withLoading', async () => {
    const { result } = renderHook(() => useLoading())
    const asyncOperation = jest.fn().mockResolvedValue('success')

    expect(result.current.isLoading).toBe(false)

    let promise: Promise<any>
    act(() => {
      promise = result.current.withLoading(asyncOperation, 'Processing...')
    })

    // Should be loading during async operation
    expect(result.current.isLoading).toBe(true)
    expect(result.current.loadingMessage).toBe('Processing...')

    await act(async () => {
      await promise
    })

    // Should stop loading after completion
    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadingMessage).toBeUndefined()
    expect(asyncOperation).toHaveBeenCalled()
  })

  it('should stop loading even if async operation fails', async () => {
    const { result } = renderHook(() => useLoading())
    const asyncOperation = jest.fn().mockRejectedValue(new Error('Failed'))

    let promise: Promise<any>
    act(() => {
      promise = result.current.withLoading(asyncOperation)
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      try {
        await promise
      } catch (error) {
        // Expected to fail
      }
    })

    // Should stop loading even after error
    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadingMessage).toBeUndefined()
  })

  it('should return result from withLoading', async () => {
    const { result } = renderHook(() => useLoading())
    const asyncOperation = jest.fn().mockResolvedValue('data')

    let resultValue: any
    await act(async () => {
      resultValue = await result.current.withLoading(asyncOperation)
    })

    expect(resultValue).toBe('data')
  })

  it('should handle multiple loading operations', () => {
    const { result } = renderHook(() => useLoading())

    act(() => {
      result.current.startLoading('First')
    })
    expect(result.current.loadingMessage).toBe('First')

    act(() => {
      result.current.startLoading('Second')
    })
    expect(result.current.loadingMessage).toBe('Second')

    act(() => {
      result.current.stopLoading()
    })
    expect(result.current.isLoading).toBe(false)
  })
})
