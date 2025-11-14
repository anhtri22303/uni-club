"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MapPin, 
  Tags, 
  LibraryBig, 
  MessageCircle, 
  ArrowUpRight,
  FileText,
  TrendingUp
} from "lucide-react"

interface StatisticsCardsProps {
  totalLocations?: number
  totalTags?: number
  coreTags?: number
  totalMajors?: number
  totalFeedbacks?: number
  avgRating?: number
  totalPolicies?: number
  totalMultiplierPolicies?: number
  loading?: boolean
}

export function StatisticsCards({
  totalLocations = 0,
  totalTags = 0,
  coreTags = 0,
  totalMajors = 0,
  totalFeedbacks = 0,
  avgRating = 0,
  totalPolicies = 0,
  totalMultiplierPolicies = 0,
  loading = false,
}: StatisticsCardsProps) {
  const stats = [
    {
      title: "Total Locations",
      value: totalLocations,
      icon: MapPin,
      gradient: "from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-900",
      iconBg: "bg-blue-500",
      textColor: "text-blue-700 dark:text-blue-300",
      valueColor: "text-blue-900 dark:text-blue-100",
      href: "/uni-staff/locations"
    },
    {
      title: "Total Tags",
      value: totalTags,
      subtitle: `${coreTags} core tags`,
      icon: Tags,
      gradient: "from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-900",
      iconBg: "bg-purple-500",
      textColor: "text-purple-700 dark:text-purple-300",
      valueColor: "text-purple-900 dark:text-purple-100",
      href: "/uni-staff/tags"
    },
    {
      title: "Total Majors",
      value: totalMajors,
      icon: LibraryBig,
      gradient: "from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-900",
      iconBg: "bg-green-500",
      textColor: "text-green-700 dark:text-green-300",
      valueColor: "text-green-900 dark:text-green-100",
      href: "/uni-staff/majors"
    },
    {
      title: "Total Feedbacks",
      value: totalFeedbacks,
      subtitle: avgRating > 0 ? `Avg: ${avgRating.toFixed(1)} ⭐` : undefined,
      icon: MessageCircle,
      gradient: "from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-900",
      iconBg: "bg-orange-500",
      textColor: "text-orange-700 dark:text-orange-300",
      valueColor: "text-orange-900 dark:text-orange-100",
      href: "/uni-staff/feedbacks"
    },
    {
      title: "Policies",
      value: totalPolicies,
      icon: FileText,
      gradient: "from-indigo-50 to-violet-50 dark:from-indigo-950 dark:to-violet-900",
      iconBg: "bg-indigo-500",
      textColor: "text-indigo-700 dark:text-indigo-300",
      valueColor: "text-indigo-900 dark:text-indigo-100",
      href: "/uni-staff/policies"
    },
    {
      title: "Multiplier Policies",
      value: totalMultiplierPolicies,
      icon: TrendingUp,
      gradient: "from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-900",
      iconBg: "bg-rose-500",
      textColor: "text-rose-700 dark:text-rose-300",
      valueColor: "text-rose-900 dark:text-rose-100",
      href: "/uni-staff/multiplier-policy"
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-0 animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <a
            key={index}
            href={stat.href}
            className="block transition-transform hover:scale-105 active:scale-100"
          >
            <Card className={`stats-card-hover border-0 bg-linear-to-br ${stat.gradient} cursor-pointer transition-all hover:shadow-lg h-full`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-xs sm:text-sm font-medium ${stat.textColor}`}>
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 sm:p-2 ${stat.iconBg} rounded-lg`}>
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl sm:text-3xl font-bold ${stat.valueColor}`}>
                      {stat.value}
                    </div>
                    {stat.subtitle && (
                      <div className={`flex items-center text-[10px] sm:text-xs ${stat.textColor} mt-1`}>
                        {stat.subtitle}
                      </div>
                    )}
                  </div>
                  <ArrowUpRight className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.textColor}`} />
                </div>
              </CardContent>
            </Card>
          </a>
        )
      })}
    </div>
  )
}
