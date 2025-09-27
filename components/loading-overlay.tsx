"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({ isVisible, message = "Loading...", className }: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm",
        "animate-in fade-in-0 duration-200",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-6 p-8 bg-card rounded-lg shadow-lg border max-w-sm w-full mx-4">
        <div className="space-y-4 w-full">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 flex-1" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <p className="text-sm font-medium text-foreground animate-pulse">{message}</p>
      </div>
    </div>
  )
}
