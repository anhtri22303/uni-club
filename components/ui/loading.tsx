import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size = "md", text, fullScreen = false, ...props }, ref) => {
    const content = (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-2",
          fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
          className
        )}
        {...props}
      >
        <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </div>
    )

    return content
  }
)
Loading.displayName = "Loading"

export { Loading }

