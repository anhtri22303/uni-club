"use client"

import type * as React from "react"
import { Button, type buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"

interface LoadingButtonProps extends React.ComponentProps<typeof Button>, VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn("relative transition-all duration-200", loading && "cursor-not-allowed", className)}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <div className="flex items-center gap-2 w-full">
            <Skeleton className="h-4 w-4 rounded-full" />
            {loadingText ? <Skeleton className="h-4 flex-1" /> : <Skeleton className="h-4 w-16" />}
          </div>
        </div>
      )}
      <div className={cn("flex items-center gap-2", loading && "opacity-0")}>{children}</div>
    </Button>
  )
}
