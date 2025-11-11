import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  variant?: "default" | "primary" | "success" | "warning" | "info" | "failure"
  onClick?: () => void
}

export function StatsCard({ title, value, description, icon: Icon, trend, variant = "default", onClick }: StatsCardProps) {
  const gradientClasses = {
    default: "bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200",
    primary: "bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200",
    success: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200",
    warning: "bg-gradient-to-br from-orange-50 to-red-50 border-orange-200",
    info: "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200",
    failure: "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200",
  }

  const iconClasses = {
    default: "text-slate-600 bg-slate-100",
    primary: "text-violet-600 bg-violet-100",
    success: "text-emerald-600 bg-emerald-100",
    warning: "text-orange-600 bg-orange-100",
    info: "text-blue-600 bg-blue-100",
    failure: "text-red-600 bg-yellow-100",
  }

  const valueClasses = {
    default: "text-slate-900",
    primary: "text-violet-900",
    success: "text-emerald-900",
    warning: "text-orange-900",
    info: "text-blue-900",
    failure: "text-yellow-900",
  }

  return (
    <Card 
      className={`stats-card-hover relative overflow-hidden ${gradientClasses[variant]} border-2 transition-all ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">{title}</CardTitle>
        <div className={`p-2.5 rounded-xl ${iconClasses[variant]} shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className={`text-3xl font-bold mb-1 ${valueClasses[variant]}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>

        {description && <p className="text-sm text-muted-foreground mb-2 font-medium">{description}</p>}

        {trend && (
          <div className="flex items-center gap-1">
            {trend.value > 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-semibold ${trend.value > 0 ? "text-emerald-600" : "text-red-600"}`}>
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-sm text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
