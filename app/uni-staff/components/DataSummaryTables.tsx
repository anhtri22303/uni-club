"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Tags as TagsIcon, LibraryBig, MessageCircle, ArrowRight, Star, BarChart3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface Location {
  id: number
  name: string
  address: string
  capacity: number
}

interface Tag {
  tagId: number
  name: string
  description: string
  core: boolean
}

interface Major {
  id: number
  name: string
  [key: string]: any
}

interface FeedbackSummary {
  clubId: number
  clubName: string
  totalFeedbacks: number
  avgRating: number
}

interface DataSummaryTablesProps {
  locations?: Location[]
  tags?: Tag[]
  majors?: Major[]
  feedbackSummary?: FeedbackSummary[]
  loading?: boolean
  viewMode?: 'table' | 'chart'
  onViewModeChange?: (mode: 'table' | 'chart') => void
}

export function DataSummaryTables({
  locations = [],
  tags = [],
  majors = [],
  feedbackSummary = [],
  loading = false,
  viewMode = 'table',
  onViewModeChange,
}: DataSummaryTablesProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Sort and limit data
  const topLocations = [...locations].sort((a, b) => b.capacity - a.capacity).slice(0, 5)
  const topTags = [...tags].sort((a, b) => (b.core ? 1 : 0) - (a.core ? 1 : 0)).slice(0, 6)
  const topMajors = [...majors].slice(0, 6)
  const topFeedbacks = [...feedbackSummary].sort((a, b) => b.avgRating - a.avgRating).slice(0, 5)

  // Calculate chart data
  const maxCapacity = Math.max(...topLocations.map(l => l.capacity), 1)
  const maxFeedbackCount = Math.max(...topFeedbacks.map(f => f.totalFeedbacks), 1)

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      {/* Top Locations by Capacity */}
      <Card className="border-0 shadow-lg bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 bg-blue-500 rounded-lg">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Top Locations
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Venues sorted by capacity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          {topLocations.length > 0 ? (
            <>
              {viewMode === 'table' ? (
                // Table view
                topLocations.map((location, index) => (
                  <div
                    key={location.id}
                    className="flex items-start justify-between p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] sm:text-xs">#{index + 1}</Badge>
                        <h4 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">
                          {location.name}
                        </h4>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{location.address}</p>
                    </div>
                    <Badge className="ml-2 bg-blue-500 text-white text-[10px] sm:text-xs shrink-0">
                      {location.capacity} seats
                    </Badge>
                  </div>
                ))
              ) : (
                // Chart view
                <div className="space-y-2 sm:space-y-3">
                  {topLocations.map((location, index) => (
                    <div key={location.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs">
                        <span className="font-medium text-blue-900 dark:text-blue-100 truncate max-w-[60%]">
                          {location.name}
                        </span>
                        <span className="text-muted-foreground">{location.capacity} seats</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 sm:h-8 relative overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 flex items-center justify-end pr-2 transition-all duration-500"
                          style={{ width: `${(location.capacity / maxCapacity) * 100}%`, minWidth: '2rem' }}
                        >
                          <span className="text-white text-[10px] sm:text-xs font-bold">#{index + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs sm:text-sm"
                onClick={() => router.push('/uni-staff/locations')}
              >
                View All Locations <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8 text-xs sm:text-sm">No locations available</div>
          )}
        </CardContent>
      </Card>

      {/* Tags Overview - Redesigned */}
      <Card className="border-0 shadow-lg bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 bg-purple-500 rounded-lg">
              <TagsIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Tags Overview
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">System and custom tags</CardDescription>
        </CardHeader>
        <CardContent>
          {tags.length > 0 ? (
            <>
              {/* Summary counts */}
              <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                <div className="flex flex-col items-center flex-1 min-w-[120px]">
                  <span className="text-2xl sm:text-3xl font-bold text-purple-600">{tags.filter(t => t.core).length}</span>
                  <span className="text-xs text-muted-foreground">Core Tags</span>
                </div>
                <div className="flex flex-col items-center flex-1 min-w-[120px]">
                  <span className="text-2xl sm:text-3xl font-bold text-pink-600">{tags.filter(t => !t.core).length}</span>
                  <span className="text-xs text-muted-foreground">Custom Tags</span>
                </div>
                <div className="flex flex-col items-center flex-1 min-w-[120px]">
                  <span className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-200">{tags.length}</span>
                  <span className="text-xs text-muted-foreground">Total Tags</span>
                </div>
              </div>
              {/* 2 columns: Core tags | Custom tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold text-xs text-purple-700 mb-2 flex items-center gap-1">
                    <TagsIcon className="h-3 w-3 text-purple-500" /> Core Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.filter(t => t.core).length === 0 && (
                      <span className="text-xs text-muted-foreground">No core tags</span>
                    )}
                    {tags.filter(t => t.core).map(tag => (
                      <Badge key={tag.tagId} className="bg-purple-500 text-white text-[10px] sm:text-xs">
                        {tag.name} <span className="ml-1">⭐</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-xs text-pink-700 mb-2 flex items-center gap-1">
                    <TagsIcon className="h-3 w-3 text-pink-500" /> Custom Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.filter(t => !t.core).length === 0 && (
                      <span className="text-xs text-muted-foreground">No custom tags</span>
                    )}
                    {tags.filter(t => !t.core).map(tag => (
                      <Badge key={tag.tagId} variant="outline" className="border-pink-300 text-[10px] sm:text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <Button
                  variant="default"
                  size="sm"
                  className="px-6 text-xs sm:text-sm font-semibold"
                  onClick={() => router.push('/uni-staff/tags')}
                >
                  Manage Tags <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8 text-xs sm:text-sm">No tags available</div>
          )}
        </CardContent>
      </Card>

      {/* Majors List */}
      <Card className="border-0 shadow-lg bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 bg-green-500 rounded-lg">
              <LibraryBig className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Majors
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Academic programs</CardDescription>
        </CardHeader>
        <CardContent>
          {topMajors.length > 0 ? (
            <>
              {viewMode === 'table' ? (
                // Table view
                <div className="space-y-2">
                  {topMajors.map((major, index) => (
                    <div
                      key={major.id}
                      className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
                    >
                      <Badge variant="outline" className="text-[10px] sm:text-xs">#{index + 1}</Badge>
                      <span className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100 truncate">
                        {major.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                // Chart view - Simple count display
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-5xl sm:text-6xl font-bold text-green-600">
                      {majors.length}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-2">Total Majors</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {topMajors.slice(0, 4).map((major, index) => (
                      <div
                        key={major.id}
                        className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg text-center"
                      >
                        <div className="text-lg sm:text-xl font-bold text-green-600">#{index + 1}</div>
                        <div className="text-[10px] sm:text-xs text-green-900 dark:text-green-100 truncate">
                          {major.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {majors.length > topMajors.length && viewMode === 'table' && (
                <div className="text-center text-[10px] sm:text-xs text-muted-foreground mt-3">
                  +{majors.length - topMajors.length} more majors
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-xs sm:text-sm"
                onClick={() => router.push('/uni-staff/majors')}
              >
                View All Majors <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8 text-xs sm:text-sm">No majors available</div>
          )}
        </CardContent>
      </Card>

      {/* Top Rated Clubs (Feedback Summary) */}
      <Card className="border-0 shadow-lg bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 bg-orange-500 rounded-lg">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Top Rated Clubs
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Based on member feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          {topFeedbacks.length > 0 ? (
            <>
              {viewMode === 'table' ? (
                // Table view
                topFeedbacks.map((feedback, index) => (
                  <div
                    key={feedback.clubId}
                    className="flex items-center justify-between p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline" className="text-[10px] sm:text-xs">#{index + 1}</Badge>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-semibold text-orange-900 dark:text-orange-100 truncate">
                          {feedback.clubName}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {feedback.totalFeedbacks} feedback{feedback.totalFeedbacks !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs sm:text-sm font-bold text-orange-900 dark:text-orange-100">
                        {feedback.avgRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                // Chart view - Rating bars
                <div className="space-y-2 sm:space-y-3">
                  {topFeedbacks.map((feedback, index) => (
                    <div key={feedback.clubId} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs">
                        <span className="font-medium text-orange-900 dark:text-orange-100 truncate max-w-[60%]">
                          {feedback.clubName}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold">{feedback.avgRating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 sm:h-8 relative overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-end pr-2 transition-all duration-500"
                            style={{ width: `${(feedback.avgRating / 5) * 100}%`, minWidth: '2rem' }}
                          >
                            <span className="text-white text-[10px] sm:text-xs font-bold">#{index + 1}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                          {feedback.totalFeedbacks}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs sm:text-sm"
                onClick={() => router.push('/uni-staff/feedbacks')}
              >
                View All Feedbacks <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8 text-xs sm:text-sm">No feedback data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
