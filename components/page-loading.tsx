"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface PageLoadingProps {
  message?: string
  className?: string
}

export function PageLoading({ message = "Loading page...", className }: PageLoadingProps) {
  const sk = "bg-gray-300/60 dark:bg-gray-700/50"

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("flex flex-col items-center justify-center min-h-[400px] space-y-8 p-6", className)}
    >
      <div className="w-full max-w-4xl space-y-8">
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <Skeleton className={cn("h-8 w-64 mx-auto", sk)} />
          <Skeleton className={cn("h-4 w-96 mx-auto", sk)} />
        </div>

        {/* Main content skeleton (tất cả chuyển xám) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="space-y-4 p-6 border rounded-lg border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center gap-3">
                <Skeleton className={cn("h-12 w-12 rounded-full", sk)} />
                <div className="space-y-2 flex-1">
                  <Skeleton className={cn("h-5 w-24", sk)} />
                  <Skeleton className={cn("h-4 w-16", sk)} />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className={cn("h-4 w-full", sk)} />
                <Skeleton className={cn("h-4 w-3/4", sk)} />
                <Skeleton className={cn("h-4 w-1/2", sk)} />
              </div>
            </div>
          ))}
        </div>

        {/* Data table skeleton (tất cả chuyển xám) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className={cn("h-6 w-32", sk)} />
            <Skeleton className={cn("h-9 w-24", sk)} />
          </div>

          <div className="border rounded-lg border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-4 gap-4 p-4 border-b bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800">
              <Skeleton className={cn("h-4 w-20", sk)} />
              <Skeleton className={cn("h-4 w-24", sk)} />
              <Skeleton className={cn("h-4 w-16", sk)} />
              <Skeleton className={cn("h-4 w-20", sk)} /> {/* w-18 -> w-20 */}
            </div>

            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0 border-gray-200 dark:border-gray-800"
              >
                <Skeleton className={cn("h-4 w-16", sk)} />
                <Skeleton className={cn("h-4 w-20", sk)} />
                <Skeleton className={cn("h-4 w-12", sk)} />
                <Skeleton className={cn("h-4 w-14", sk)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading message + dots (xanh -> xám) */}
      <div className="text-center space-y-4">
        <p className="text-lg font-semibold text-foreground animate-pulse">{message}</p>
        <div className="flex items-center justify-center space-x-1">
          <span className="text-sm text-muted-foreground">Please wait</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" />
            <div
              className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
