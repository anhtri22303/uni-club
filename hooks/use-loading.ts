"use client"

import { useState, useCallback } from "react"

interface UseLoadingOptions {
  initialState?: boolean
}

export function useLoading(options: UseLoadingOptions = {}) {
  const [isLoading, setIsLoading] = useState(options.initialState ?? false)
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>()

  const startLoading = useCallback((message?: string) => {
    setIsLoading(true)
    setLoadingMessage(message)
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
    setLoadingMessage(undefined)
  }, [])

  const withLoading = useCallback(
    async (asyncFn: () => Promise<any>, message?: string): Promise<any> => {
      try {
        startLoading(message)
        const result = await asyncFn()
        return result
      } finally {
        stopLoading()
      }
    },
    [startLoading, stopLoading],
  )

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading,
  }
}
