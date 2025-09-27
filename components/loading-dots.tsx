"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface LoadingDotsProps {
  size?: "sm" | "md" | "lg"
  variant?: "primary" | "secondary" | "muted"
  className?: string
}

export function LoadingDots({ size = "md", variant = "primary", className }: LoadingDotsProps) {
  const sizeClasses = {
    sm: "h-2 w-8",
    md: "h-3 w-12",
    lg: "h-4 w-16",
  }

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <Skeleton className={cn("rounded-full", sizeClasses[size])} />
      <Skeleton className={cn("rounded-full", sizeClasses[size])} style={{ animationDelay: "0.2s" }} />
      <Skeleton className={cn("rounded-full", sizeClasses[size])} style={{ animationDelay: "0.4s" }} />
    </div>
  )
}
