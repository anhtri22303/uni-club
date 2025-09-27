"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { LoadingOverlay } from "@/components/loading-overlay"

interface LoadingContextType {
  isGlobalLoading: boolean
  globalLoadingMessage?: string
  showGlobalLoading: (message?: string) => void
  hideGlobalLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false)
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState<string>()

  const showGlobalLoading = useCallback((message?: string) => {
    setIsGlobalLoading(true)
    setGlobalLoadingMessage(message)
  }, [])

  const hideGlobalLoading = useCallback(() => {
    setIsGlobalLoading(false)
    setGlobalLoadingMessage(undefined)
  }, [])

  return (
    <LoadingContext.Provider
      value={{
        isGlobalLoading,
        globalLoadingMessage,
        showGlobalLoading,
        hideGlobalLoading,
      }}
    >
      {children}
      <LoadingOverlay isVisible={isGlobalLoading} message={globalLoadingMessage} />
    </LoadingContext.Provider>
  )
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error("useGlobalLoading must be used within a LoadingProvider")
  }
  return context
}
