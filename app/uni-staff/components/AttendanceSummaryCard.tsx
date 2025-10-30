"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Filter, Trophy, Users } from "lucide-react"
import { useMemo, useState, useEffect } from "react"

interface AttendanceSummaryCardProps {
  attendanceSummary: any
  attendanceRanking: any
}

export function AttendanceSummaryCard({ attendanceSummary, attendanceRanking }: AttendanceSummaryCardProps) {
  const [attendanceYear, setAttendanceYear] = useState<number>(new Date().getFullYear())
  const [attendanceMonthFilter, setAttendanceMonthFilter] = useState<string>("ALL")

  // Reset month filter when year changes
  useEffect(() => {
    setAttendanceMonthFilter("ALL")
  }, [attendanceYear])

  // Filter attendance data by month
  const filteredAttendanceData = useMemo(() => {
    if (!attendanceSummary) return []
    
    if (attendanceMonthFilter === "ALL") {
      return attendanceSummary.monthlySummary
    }
    
    return attendanceSummary.monthlySummary.filter(
      (item: any) => item.month === attendanceMonthFilter
    )
  }, [attendanceSummary, attendanceMonthFilter])

  // Calculate total participants
  const totalParticipants = useMemo(() => {
    return filteredAttendanceData.reduce((sum: number, item: any) => sum + item.participantCount, 0)
  }, [filteredAttendanceData])

  return (
    <Card className="border-2">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <div className="p-1 sm:p-1.5 bg-purple-500 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="truncate">Event Attendance Summary</span>
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs mt-1">
              Total participants by month • 
              <span className="font-semibold text-purple-600 dark:text-purple-500 ml-1">
                {totalParticipants.toLocaleString()} total participants
              </span>
            </CardDescription>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <Select value={attendanceYear.toString()} onValueChange={(value) => setAttendanceYear(parseInt(value))}>
              <SelectTrigger className="w-[90px] sm:w-[100px] h-7 sm:h-8 text-[11px] sm:text-xs">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={attendanceMonthFilter} onValueChange={setAttendanceMonthFilter}>
              <SelectTrigger className="w-[100px] sm:w-[120px] h-7 sm:h-8 text-[11px] sm:text-xs">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Months</SelectItem>
                <SelectItem value={`${attendanceYear}-01`}>January</SelectItem>
                <SelectItem value={`${attendanceYear}-02`}>February</SelectItem>
                <SelectItem value={`${attendanceYear}-03`}>March</SelectItem>
                <SelectItem value={`${attendanceYear}-04`}>April</SelectItem>
                <SelectItem value={`${attendanceYear}-05`}>May</SelectItem>
                <SelectItem value={`${attendanceYear}-06`}>June</SelectItem>
                <SelectItem value={`${attendanceYear}-07`}>July</SelectItem>
                <SelectItem value={`${attendanceYear}-08`}>August</SelectItem>
                <SelectItem value={`${attendanceYear}-09`}>September</SelectItem>
                <SelectItem value={`${attendanceYear}-10`}>October</SelectItem>
                <SelectItem value={`${attendanceYear}-11`}>November</SelectItem>
                <SelectItem value={`${attendanceYear}-12`}>December</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-4">
            <TabsTrigger value="monthly" className="text-xs sm:text-sm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
              Monthly Summary
            </TabsTrigger>
            <TabsTrigger value="ranking" className="text-xs sm:text-sm">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
              Club Rankings
            </TabsTrigger>
          </TabsList>

          {/* Monthly Summary Tab */}
          <TabsContent value="monthly" className="mt-0">
            {!attendanceSummary ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Loading attendance data...</div>
            ) : filteredAttendanceData.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No attendance data available</div>
            ) : (
              <div className="space-y-3">
                {/* Display monthly data */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredAttendanceData.map((item: any) => {
                    // Format month display
                    const monthDate = new Date(item.month + "-01")
                    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    
                    return (
                      <Card key={item.month} className="border bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">
                                {monthName}
                              </p>
                              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {item.participantCount.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                participants
                              </p>
                            </div>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                
                {/* Summary statistics */}
                {attendanceMonthFilter === "ALL" && filteredAttendanceData.length > 1 && (
                  <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Participants</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {totalParticipants.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Average per Month</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {Math.round(totalParticipants / filteredAttendanceData.length).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Months Tracked</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {filteredAttendanceData.length}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Club Rankings Tab */}
          <TabsContent value="ranking" className="mt-0">
            {!attendanceRanking ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Loading attendance rankings...</div>
            ) : attendanceRanking.clubRankings.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No attendance rankings available</div>
            ) : (
              <div className="space-y-4">
                {/* Total Attendances Summary */}
                <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm opacity-90 mb-1">Total Event Attendances</p>
                      <p className="text-3xl sm:text-4xl md:text-5xl font-bold">
                        {attendanceRanking.totalAttendances.toLocaleString()}
                      </p>
                      <p className="text-[10px] sm:text-xs opacity-75 mt-1">
                        Across all clubs and events
                      </p>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/20 rounded-lg">
                      <Users className="h-8 w-8 sm:h-10 sm:w-10" />
                    </div>
                  </div>
                </div>

                {/* Top 5 Clubs Ranking */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Top Clubs by Attendance</h3>
                  {attendanceRanking.clubRankings.map((club: any) => {
                    // Calculate percentage of total
                    const percentage = (club.attendanceCount / attendanceRanking.totalAttendances) * 100
                    
                    // Get medal color based on rank
                    const getMedalColor = (rank: number) => {
                      if (rank === 1) return "text-yellow-500"
                      if (rank === 2) return "text-gray-400"
                      if (rank === 3) return "text-amber-600"
                      return "text-muted-foreground"
                    }

                    return (
                      <Card key={club.clubId} className="border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Rank Badge */}
                            <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${
                              club.rank === 1 ? "bg-yellow-100 dark:bg-yellow-900/30" :
                              club.rank === 2 ? "bg-gray-100 dark:bg-gray-800" :
                              club.rank === 3 ? "bg-amber-100 dark:bg-amber-900/30" :
                              "bg-purple-100 dark:bg-purple-900/30"
                            }`}>
                              {club.rank <= 3 ? (
                                <Trophy className={`h-5 w-5 ${getMedalColor(club.rank)}`} />
                              ) : (
                                <span className="font-bold text-sm text-purple-600 dark:text-purple-400">
                                  #{club.rank}
                                </span>
                              )}
                            </div>

                            {/* Club Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-sm truncate">{club.clubName}</h4>
                                <Badge variant="secondary" className="flex-shrink-0 text-xs">
                                  {club.attendanceCount.toLocaleString()} attendees
                                </Badge>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="space-y-1">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  {percentage.toFixed(1)}% of total attendances
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

