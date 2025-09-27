"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "primary" | "secondary" | "muted" | "premium"
  className?: string
}

export function LoadingSpinner({ size = "md", variant = "premium", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  }

  if (variant === "premium") {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        {/* Central morphing core */}
        <div className="absolute inset-0 clubly-morph clubly-gradient-flow rounded-full opacity-90" />

        {/* Orbiting particles */}
        <div className="absolute inset-0">
          <div className="clubly-orbit">
            <div className="w-2 h-2 bg-primary rounded-full shadow-lg" />
          </div>
          <div className="clubly-orbit clubly-delay-2">
            <div className="w-1.5 h-1.5 bg-secondary rounded-full shadow-lg" />
          </div>
          <div className="clubly-orbit clubly-delay-4">
            <div className="w-1 h-1 bg-accent rounded-full shadow-lg" />
          </div>
        </div>

        {/* Pulse rings */}
        <div className="absolute inset-0 clubly-pulse-ring">
          <div className="w-full h-full border-2 border-primary/30 rounded-full" />
        </div>
        <div className="absolute inset-0 clubly-pulse-ring clubly-delay-1">
          <div className="w-full h-full border border-secondary/20 rounded-full" />
        </div>
      </div>
    )
  }

  const variantClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    muted: "text-muted-foreground",
    premium: "", // handled above
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-transparent border-t-current",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    />
  )
}
