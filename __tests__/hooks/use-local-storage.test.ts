import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/use-local-storage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should initialize with default value', () => {
    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'default-value')
    )

    expect(result.current[0]).toBe('default-value')
  })

  it('should initialize with value from localStorage if exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))

    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'default-value')
    )

    expect(result.current[0]).toBe('stored-value')
  })

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'initial')
    )

    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'))
  })

  it('should handle function updates', () => {
    const { result } = renderHook(() => 
      useLocalStorage('counter', 0)
    )

    act(() => {
      result.current[1](prev => prev + 1)
    })

    expect(result.current[0]).toBe(1)
  })

  it('should handle objects', () => {
    const initialObject = { name: 'Test', count: 0 }
    
    const { result } = renderHook(() => 
      useLocalStorage('test-object', initialObject)
    )

    const updatedObject = { name: 'Updated', count: 5 }
    act(() => {
      result.current[1](updatedObject)
    })

    expect(result.current[0]).toEqual(updatedObject)
    expect(JSON.parse(localStorage.getItem('test-object')!)).toEqual(updatedObject)
  })

  it('should handle arrays', () => {
    const { result } = renderHook(() => 
      useLocalStorage<number[]>('test-array', [])
    )

    act(() => {
      result.current[1]([1, 2, 3])
    })

    expect(result.current[0]).toEqual([1, 2, 3])
  })

  it('should handle null values', () => {
    const { result } = renderHook(() => 
      useLocalStorage<string | null>('test-key', null)
    )

    expect(result.current[0]).toBeNull()
  })

  it('should handle invalid JSON in localStorage', () => {
    localStorage.setItem('test-key', 'invalid-json{')

    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'default')
    )

    // Should fall back to default value
    expect(result.current[0]).toBe('default')
  })

  it('should sync across hook instances with same key', () => {
    const { result: result1 } = renderHook(() => 
      useLocalStorage('shared-key', 'initial')
    )

    const { result: result2 } = renderHook(() => 
      useLocalStorage('shared-key', 'initial')
    )

    act(() => {
      result1.current[1]('updated')
    })

    // Both should have the updated value
    expect(result1.current[0]).toBe('updated')
    expect(result2.current[0]).toBe('updated')
  })

  it('should handle boolean values', () => {
    const { result } = renderHook(() => 
      useLocalStorage('test-bool', false)
    )

    act(() => {
      result.current[1](true)
    })

    expect(result.current[0]).toBe(true)
    expect(localStorage.getItem('test-bool')).toBe('true')
  })

  it('should handle number values', () => {
    const { result } = renderHook(() => 
      useLocalStorage('test-number', 42)
    )

    act(() => {
      result.current[1](100)
    })

    expect(result.current[0]).toBe(100)
  })
})
