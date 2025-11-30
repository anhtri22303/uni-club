"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Star, Users, TrendingUp, DollarSign, Package, AlertTriangle, UserCheck, CheckCircle, ShieldCheck, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useState, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ClubOverview {
  clubId: number
  clubName: string
  ratingEvent: number
  totalCheckin: number
  checkinRate: number
  totalMember: number
  totalStaff: number
  totalBudgetEvent: number
  totalProductEvent: number
  totalDiscipline: number
  attendanceRate: number
}

interface ClubRankingDashboardProps {
  clubsOverview: ClubOverview[]
  loading?: boolean
  onMonthChange?: (year: number, month: number) => void
  selectedYear?: number
  selectedMonth?: number
  viewMode?: 'list' | 'chart'
}

export default function ClubRankingDashboard({ 
  clubsOverview, 
  loading,
  onMonthChange,
  selectedYear,
  selectedMonth,
  viewMode = 'list'
}: ClubRankingDashboardProps) {
  const [hoveredBar, setHoveredBar] = useState<{ clubName: string; value: number; x: number; y: number } | null>(null)
  const [sizeMode, setSizeMode] = useState<'members' | 'total' | 'staff'>('total')
  const [engagementMode, setEngagementMode] = useState<'checkin' | 'attendance' | 'average'>('average')
  const [checkinMode, setCheckinMode] = useState<'total' | 'rate'>('total')
  
  const currentYear = new Date().getFullYear()
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  // FIX: Move all useMemo hooks BEFORE any conditional returns (React Rules of Hooks)
  // OPTIMIZED: Cache all sorted rankings với useMemo để tránh re-compute không cần thiết
  // Ranking 1: Top Rated Clubs (by ratingEvent) - Static, không phụ thuộc toggle
  const topRatedClubs = useMemo(() => {
    if (!clubsOverview || clubsOverview.length === 0) return []
    return [...clubsOverview]
      .sort((a, b) => b.ratingEvent - a.ratingEvent)
      .slice(0, 5)
  }, [clubsOverview])

  // Ranking 2: Most Active Clubs - Static
  const mostActiveClubs = useMemo(() => {
    if (!clubsOverview || clubsOverview.length === 0) return []
    return [...clubsOverview]
      .sort((a, b) => {
        const activityA = a.totalProductEvent + a.totalBudgetEvent
        const activityB = b.totalProductEvent + b.totalBudgetEvent
        return activityB - activityA
      })
      .slice(0, 5)
  }, [clubsOverview])

  // Ranking 3: Largest Clubs - Dynamic based on sizeMode
  const largestClubs = useMemo(() => {
    if (!clubsOverview || clubsOverview.length === 0) return []
    return [...clubsOverview]
      .sort((a, b) => {
        let sizeA, sizeB
        if (sizeMode === 'members') {
          sizeA = a.totalMember
          sizeB = b.totalMember
        } else if (sizeMode === 'staff') {
          sizeA = a.totalStaff
          sizeB = b.totalStaff
        } else {
          sizeA = a.totalMember + a.totalStaff
          sizeB = b.totalMember + b.totalStaff
        }
        return sizeB - sizeA
      })
      .slice(0, 5)
  }, [clubsOverview, sizeMode])

  // Ranking 4: Best Engagement - Dynamic based on engagementMode
  const bestEngagementClubs = useMemo(() => {
    if (!clubsOverview || clubsOverview.length === 0) return []
    return [...clubsOverview]
      .sort((a, b) => {
        let engagementA, engagementB
        if (engagementMode === 'checkin') {
          engagementA = a.checkinRate
          engagementB = b.checkinRate
        } else if (engagementMode === 'attendance') {
          engagementA = a.attendanceRate
          engagementB = b.attendanceRate
        } else {
          engagementA = (a.checkinRate + a.attendanceRate) / 2
          engagementB = (b.checkinRate + b.attendanceRate) / 2
        }
        return engagementB - engagementA
      })
      .slice(0, 5)
  }, [clubsOverview, engagementMode])

  // Ranking 5: Most Check-ins - Dynamic based on checkinMode
  const mostCheckinClubs = useMemo(() => {
    if (!clubsOverview || clubsOverview.length === 0) return []
    return [...clubsOverview]
      .sort((a, b) => {
        if (checkinMode === 'rate') {
          return b.checkinRate - a.checkinRate
        }
        return b.totalCheckin - a.totalCheckin
      })
      .slice(0, 5)
  }, [clubsOverview, checkinMode])

  // Ranking 6: Best Discipline - Static
  const bestDisciplineClubs = useMemo(() => {
    if (!clubsOverview || clubsOverview.length === 0) return []
    return [...clubsOverview]
      .sort((a, b) => a.totalDiscipline - b.totalDiscipline)
      .slice(0, 5)
  }, [clubsOverview])

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!clubsOverview || clubsOverview.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          No club data available
        </CardContent>
      </Card>
    )
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-200 to-amber-200 dark:from-yellow-700 dark:to-amber-700 text-gray-900 dark:text-amber-100 hover:shadow-md border-2 border-amber-300 dark:border-amber-600"
      case 2:
        return "bg-gradient-to-r from-slate-200 to-gray-200 dark:from-slate-700 dark:to-gray-700 text-gray-900 dark:text-slate-100 hover:shadow-sm border-2 border-slate-300 dark:border-slate-600"
      case 3:
        return "bg-gradient-to-r from-orange-200 to-amber-100 dark:from-orange-700 dark:to-amber-600 text-gray-900 dark:text-orange-100 hover:shadow-sm border-2 border-orange-300 dark:border-orange-600"
      case 4:
        return "bg-gradient-to-r from-blue-100 to-sky-200 dark:from-blue-700 dark:to-sky-700 text-gray-900 dark:text-blue-100 hover:shadow-sm border-2 border-blue-300 dark:border-blue-600"
      default:
        return "bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-700 dark:to-blue-700 text-gray-900 dark:text-indigo-100 hover:shadow-sm border-2 border-blue-300 dark:border-blue-600"
    }
  }

  const getBarColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-t from-yellow-400 to-amber-300 dark:from-yellow-600 dark:to-amber-500"
      case 2:
        return "bg-gradient-to-t from-slate-400 to-gray-300 dark:from-slate-600 dark:to-gray-500"
      case 3:
        return "bg-gradient-to-t from-orange-400 to-amber-300 dark:from-orange-600 dark:to-amber-500"
      case 4:
        return "bg-gradient-to-t from-blue-400 to-sky-300 dark:from-blue-600 dark:to-sky-500"
      default:
        return "bg-gradient-to-t from-indigo-400 to-blue-300 dark:from-indigo-600 dark:to-blue-500"
    }
  }

  const RankingCard = ({ 
    title, 
    icon: Icon, 
    clubs, 
    valueKey, 
    valueLabel, 
    valueFormatter = (v: number) => v.toFixed(2),
    gradient,
    toggleButtons
  }: { 
    title: string
    icon: any
    clubs: ClubOverview[]
    valueKey: keyof ClubOverview
    valueLabel: string
    valueFormatter?: (value: number) => string
    gradient: string
    toggleButtons?: React.ReactNode
  }) => {
    if (viewMode === 'chart') {
      // Chart view
      const maxValue = Math.max(...clubs.map(c => c[valueKey] as number))
      
      return (
        <Card className={`${gradient} transition-all hover:shadow-xl relative`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-gray-900 dark:text-white">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                {title}
              </CardTitle>
              {toggleButtons && (
                <div className="flex gap-1">
                  {toggleButtons}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-around gap-2 px-2">
              {clubs.map((club, index) => {
                const rank = index + 1
                const value = club[valueKey] as number
                const heightPercent = (value / maxValue) * 100
                
                return (
                  <div
                    key={club.clubId}
                    className="flex-1 flex flex-col items-center gap-2 group"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setHoveredBar({
                        clubName: club.clubName,
                        value: value,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      })
                    }}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div className="relative w-full flex items-end justify-center" style={{ height: '260px' }}>
                      <div
                        className={`w-full rounded-t-lg ${getBarColor(rank)} transition-all duration-300 cursor-pointer group-hover:opacity-80 group-hover:scale-105 shadow-lg`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="shrink-0 h-6 w-6 flex items-center justify-center font-bold text-xs bg-black/20 dark:bg-white/20 text-white border-0"
                    >
                      {rank}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
          
          {/* Tooltip */}
          {hoveredBar && (
            <div
              className="fixed z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-xl text-sm font-semibold pointer-events-none"
              style={{
                left: `${hoveredBar.x}px`,
                top: `${hoveredBar.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="font-bold">{hoveredBar.clubName}</div>
              <div className="text-xs opacity-90">{valueFormatter(hoveredBar.value)} {valueLabel}</div>
            </div>
          )}
        </Card>
      )
    }

    // List view (original)
    return (
      <Card className={`${gradient} transition-all hover:shadow-xl`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-gray-900 dark:text-white">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              {title}
            </CardTitle>
            {toggleButtons && (
              <div className="flex gap-1">
                {toggleButtons}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {clubs.map((club, index) => {
                const rank = index + 1
                const value = club[valueKey] as number
                
                return (
                  <div
                    key={club.clubId}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${getRankColor(rank)} transition-all hover:scale-[1.02] hover:shadow-md`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge 
                        variant="secondary" 
                        className="shrink-0 h-8 w-8 flex items-center justify-center font-bold bg-black/20 dark:bg-white/20 text-white border-0"
                      >
                        {rank}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{club.clubName}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs opacity-80">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {club.totalMember} members
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {club.ratingEvent.toFixed(1)}★
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-base sm:text-lg">{valueFormatter(value)}</p>
                      <p className="text-xs opacity-70">{valueLabel}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold">Club Rankings</h2>
        </div>
        
        {onMonthChange && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedMonth ? `${selectedYear}-${selectedMonth}` : 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  onMonthChange(0, 0) // 0 means all time
                } else {
                  const [year, month] = value.split('-').map(Number)
                  onMonthChange(year, month)
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={`${currentYear}-${month.value}`}>
                    {month.label} {currentYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <RankingCard
          title="Top Rated Clubs"
          icon={Star}
          clubs={topRatedClubs}
          valueKey="ratingEvent"
          valueLabel="Rating score"
          valueFormatter={(v) => `${v.toFixed(2)}★`}
          gradient="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-950 dark:to-orange-900 border border-orange-200 dark:border-orange-800"
        />

        <RankingCard
          title="Most Active Clubs"
          icon={TrendingUp}
          clubs={mostActiveClubs}
          valueKey="totalProductEvent"
          valueLabel="Events & products"
          valueFormatter={(v) => {
            const club = mostActiveClubs.find(c => c.totalProductEvent === v)
            return club ? `${club.totalProductEvent + club.totalBudgetEvent}` : `${v}`
          }}
          gradient="bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-950 dark:to-emerald-900 border border-green-200 dark:border-green-800"
        />

        <RankingCard
          title="Largest Clubs"
          icon={Users}
          clubs={largestClubs}
          valueKey={sizeMode === 'members' ? 'totalMember' : sizeMode === 'staff' ? 'totalStaff' : 'totalMember'}
          valueLabel={sizeMode === 'members' ? 'Members only' : sizeMode === 'staff' ? 'Staff only' : 'Total size'}
          valueFormatter={(v) => {
            const club = largestClubs.find(c => 
              sizeMode === 'members' ? c.totalMember === v : 
              sizeMode === 'staff' ? c.totalStaff === v : 
              c.totalMember === v
            )
            if (!club) return `${v}`
            if (sizeMode === 'total') return `${club.totalMember + club.totalStaff}`
            return `${v}`
          }}
          gradient="bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-cyan-950 dark:to-blue-900 border border-cyan-200 dark:border-cyan-800"
          toggleButtons={
            <>
              <Button
                type="button"
                size="sm"
                variant={sizeMode === 'members' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSizeMode('members')
                }}
                className="h-7 px-2 text-xs"
              >
                Members
              </Button>
              <Button
                type="button"
                size="sm"
                variant={sizeMode === 'staff' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSizeMode('staff')
                }}
                className="h-7 px-2 text-xs"
              >
                Staff
              </Button>
              <Button
                type="button"
                size="sm"
                variant={sizeMode === 'total' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSizeMode('total')
                }}
                className="h-7 px-2 text-xs"
              >
                Total
              </Button>
            </>
          }
        />

        <RankingCard
          title="Best Engagement"
          icon={UserCheck}
          clubs={bestEngagementClubs}
          valueKey="checkinRate"
          valueLabel={engagementMode === 'checkin' ? 'Check-in rate' : engagementMode === 'attendance' ? 'Attendance rate' : 'Avg engagement'}
          valueFormatter={(v) => {
            const club = bestEngagementClubs.find(c => c.checkinRate === v)
            if (!club) return `${(v * 100).toFixed(2)}%`
            
            if (engagementMode === 'checkin') {
              return `${(club.checkinRate * 100).toFixed(2)}%`
            } else if (engagementMode === 'attendance') {
              return `${(club.attendanceRate * 100).toFixed(2)}%`
            } else {
              const engagement = ((club.checkinRate + club.attendanceRate) / 2) * 100
              return `${engagement.toFixed(2)}%`
            }
          }}
          gradient="bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-950 dark:to-pink-900 border border-purple-200 dark:border-purple-800"
          toggleButtons={
            <>
              <Button
                type="button"
                size="sm"
                variant={engagementMode === 'checkin' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setEngagementMode('checkin')
                }}
                className="h-7 px-2 text-xs"
              >
                Check-in
              </Button>
              <Button
                type="button"
                size="sm"
                variant={engagementMode === 'attendance' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setEngagementMode('attendance')
                }}
                className="h-7 px-2 text-xs"
              >
                Attendance
              </Button>
              <Button
                type="button"
                size="sm"
                variant={engagementMode === 'average' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setEngagementMode('average')
                }}
                className="h-7 px-2 text-xs"
              >
                Average
              </Button>
            </>
          }
        />

        <RankingCard
          title="Most Check-ins"
          icon={CheckCircle}
          clubs={mostCheckinClubs}
          valueKey={checkinMode === 'total' ? 'totalCheckin' : 'checkinRate'}
          valueLabel={checkinMode === 'total' ? 'Total check-ins' : 'Check-in rate'}
          valueFormatter={(v) => {
            if (checkinMode === 'total') return `${v}`
            return `${(v * 100).toFixed(2)}%`
          }}
          gradient="bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-950 dark:to-teal-900 border border-teal-200 dark:border-teal-800"
          toggleButtons={
            <>
              <Button
                type="button"
                size="sm"
                variant={checkinMode === 'total' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCheckinMode('total')
                }}
                className="h-7 px-2 text-xs"
              >
                Total
              </Button>
              <Button
                type="button"
                size="sm"
                variant={checkinMode === 'rate' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCheckinMode('rate')
                }}
                className="h-7 px-2 text-xs"
              >
                Rate
              </Button>
            </>
          }
        />

        <RankingCard
          title="Best Discipline"
          icon={ShieldCheck}
          clubs={bestDisciplineClubs}
          valueKey="totalDiscipline"
          valueLabel="Violations"
          valueFormatter={(v) => `${v}`}
          gradient="bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-950 dark:to-rose-900 border border-rose-200 dark:border-rose-800"
        />
      </div>


    </div>
  )
}
