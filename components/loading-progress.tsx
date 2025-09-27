"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface LoadingProgressProps {
  value?: number
  indeterminate?: boolean
  message?: string
  className?: string
}

export function LoadingProgress({ value, indeterminate = false, message, className }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (indeterminate) {
      const timer = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 10))
      }, 200)
      return () => clearInterval(timer)
    }
  }, [indeterminate])

  const currentValue = indeterminate ? progress : value

  return (
    <div className={cn("space-y-2", className)}>
      {message && <p className="text-sm font-medium text-foreground">{message}</p>}
      <Progress value={currentValue} className={cn("transition-all duration-300", indeterminate && "animate-pulse")} />
      {!indeterminate && typeof value === "number" && (
        <p className="text-xs text-muted-foreground text-right">{Math.round(value)}%</p>
      )}
    </div>
  )
}
