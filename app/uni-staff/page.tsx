"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePagination } from "@/hooks/use-pagination"
import { useData } from "@/contexts/data-context"
import { usePolicies, useEvents, useClubs } from "@/hooks/use-query-hooks"
import { getClubApplications } from "@/service/clubApplicationAPI"
import { getClubMemberCount } from "@/service/clubApi"
import { fetchUniversityPoints, fetchAttendanceSummary, fetchAttendanceRanking } from "@/service/universityApi"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Building,
  Download,
  Filter,
  ArrowUpRight,
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Check,
  CheckCircle,
  Trophy,
  Award,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, List } from "lucide-react"

export default function UniStaffReportsPage() {
  const { clubApplications, eventRequests, updateClubApplications, updateEventRequests } = useData()
  const router = useRouter()

  // ✅ USE REACT QUERY for events, clubs, and policies
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const { data: clubs = [], isLoading: clubsLoading } = useClubs()
  const { data: policies = [] } = usePolicies()

  // State management - Event filters
  const [eventStatusFilter, setEventStatusFilter] = useState<string>("PENDING")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL")

  // State management - Club Application filter
  const [clubAppStatusFilter, setClubAppStatusFilter] = useState<string>("PENDING")

  // State management - Clubs with member count
  const [clubsWithMemberCount, setClubsWithMemberCount] = useState<any[]>([])

  // State management - University points data
  const [universityPointsData, setUniversityPointsData] = useState<{
    totalUniversityPoints: number
    clubRankings: Array<{
      rank: number
      clubId: number
      clubName: string
      totalPoints: number
    }>
  } | null>(null)

  // State management - Club sorting
  const [clubSortField, setClubSortField] = useState<"rank" | "points" | "members">("rank")
  const [clubSortOrder, setClubSortOrder] = useState<"asc" | "desc">("asc")

  // State management - Attendance summary
  const [attendanceSummary, setAttendanceSummary] = useState<{
    year: number
    monthlySummary: Array<{
      month: string
      participantCount: number
    }>
    clubId: number | null
    eventId: number | null
  } | null>(null)
  const [attendanceYear, setAttendanceYear] = useState<number>(new Date().getFullYear())
  const [attendanceMonthFilter, setAttendanceMonthFilter] = useState<string>("ALL")

  // State management - Attendance ranking
  const [attendanceRanking, setAttendanceRanking] = useState<{
    totalAttendances: number
    clubRankings: Array<{
      rank: number
      clubId: number
      clubName: string
      attendanceCount: number
    }>
  } | null>(null)

  // Fetch club applications and university points when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch club applications
        const clubAppData = await getClubApplications()
        updateClubApplications(clubAppData || [])

        // Use events for eventRequests to avoid calling API twice
        updateEventRequests(events || [])

        // Fetch university points
        const pointsData = await fetchUniversityPoints()
        setUniversityPointsData(pointsData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    if (events.length > 0) {
      loadData()
    }
  }, [events])

  // Fetch attendance summary when year changes
  useEffect(() => {
    const loadAttendanceSummary = async () => {
      try {
        const attendanceData = await fetchAttendanceSummary(attendanceYear)
        setAttendanceSummary(attendanceData)
      } catch (error) {
        console.error("Failed to fetch attendance summary:", error)
      }
    }
    loadAttendanceSummary()
  }, [attendanceYear])

  // Reset month filter when year changes
  useEffect(() => {
    setAttendanceMonthFilter("ALL")
  }, [attendanceYear])

  // Fetch attendance ranking when component mounts
  useEffect(() => {
    const loadAttendanceRanking = async () => {
      try {
        const rankingData = await fetchAttendanceRanking()
        setAttendanceRanking(rankingData)
      } catch (error) {
        console.error("Failed to fetch attendance ranking:", error)
      }
    }
    loadAttendanceRanking()
  }, [])

  // Fetch member count for each club and merge with points data
  useEffect(() => {
    const fetchMemberCounts = async () => {
      if (clubs.length === 0) return

      const clubsWithCounts = await Promise.all(
        clubs.map(async (club: any) => {
          try {
            const { activeMemberCount } = await getClubMemberCount(club.id)
            
            // Find matching ranking data
            const rankingData = universityPointsData?.clubRankings.find(
              (ranking) => ranking.clubId === club.id
            )
            
            return {
              ...club,
              memberCount: activeMemberCount,
              rank: rankingData?.rank,
              totalPoints: rankingData?.totalPoints || 0
            }
          } catch (error) {
            console.error(`Error fetching member count for club ${club.id}:`, error)
            return { ...club, memberCount: 0, rank: undefined, totalPoints: 0 }
          }
        })
      )

      // Sort clubs based on selected field and order
      const sortedClubs = clubsWithCounts.sort((a, b) => {
        let comparison = 0

        if (clubSortField === "rank") {
          // Sort by rank
          const rankA = a.rank !== undefined ? a.rank : Infinity
          const rankB = b.rank !== undefined ? b.rank : Infinity
          comparison = rankA - rankB
        } else if (clubSortField === "points") {
          // Sort by total points
          comparison = (a.totalPoints || 0) - (b.totalPoints || 0)
        } else if (clubSortField === "members") {
          // Sort by member count
          comparison = (a.memberCount || 0) - (b.memberCount || 0)
        }

        // Apply sort order (asc or desc)
        return clubSortOrder === "desc" ? -comparison : comparison
      })
      setClubsWithMemberCount(sortedClubs)
    }

    fetchMemberCounts()
  }, [clubs, universityPointsData, clubSortField, clubSortOrder])

  const totalClubs = clubs.length
  const totalPolicies = policies.length
  const totalClubApplications = clubApplications.length
  const totalEventRequests = eventRequests.length
  
  // Count approved club applications
  const approvedClubApplications = clubApplications.filter((app: any) => app.status === "APPROVED").length
  
  // Count pending club applications
  const pendingClubApplications = clubApplications.filter((app: any) => app.status === "PENDING").length
  
  // Count rejected club applications
  const rejectedClubApplications = clubApplications.filter((app: any) => app.status === "REJECTED").length
  
  // Count approved events (non-expired only)
  const approvedEvents = useMemo(() => {
    const now = new Date()
    return events.filter((event: any) => {
      if (event.status !== "APPROVED") return false
      
      try {
        const eventDate = new Date(event.date)
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':')
          eventDate.setHours(parseInt(hours), parseInt(minutes))
        }
        return eventDate >= now || (eventDate.toDateString() === now.toDateString())
      } catch {
        return false
      }
    }).length
  }, [events])
  
  // Count pending events (non-expired only)
  const pendingEvents = useMemo(() => {
    const now = new Date()
    return events.filter((event: any) => {
      if (event.status !== "PENDING") return false
      
      try {
        const eventDate = new Date(event.date)
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':')
          eventDate.setHours(parseInt(hours), parseInt(minutes))
        }
        return eventDate >= now || (eventDate.toDateString() === now.toDateString())
      } catch {
        return false
      }
    }).length
  }, [events])

  // Count rejected events (non-expired only)
  const rejectedEvents = useMemo(() => {
    const now = new Date()
    return events.filter((event: any) => {
      if (event.status !== "REJECTED") return false
      
      try {
        const eventDate = new Date(event.date)
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':')
          eventDate.setHours(parseInt(hours), parseInt(minutes))
        }
        return eventDate >= now || (eventDate.toDateString() === now.toDateString())
      } catch {
        return false
      }
    }).length
  }, [events])

  // Filter club applications by status and sort by latest submittedAt
  const filteredClubApplications = useMemo(() => {
    const filtered = clubApplications.filter((app: any) => {
      if (clubAppStatusFilter !== "ALL" && app.status !== clubAppStatusFilter) {
        return false
      }
      return true
    })
    
    // Sort by submittedAt in descending order (latest first)
    return filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.submittedAt).getTime()
      const dateB = new Date(b.submittedAt).getTime()
      return dateB - dateA
    })
  }, [clubApplications, clubAppStatusFilter])

  // Filter and check non-expired events
  const filteredEvents = useMemo(() => {
    const now = new Date()
    
    return events.filter((event: any) => {
      // Check status filter
      if (eventStatusFilter !== "ALL" && event.status !== eventStatusFilter) {
        return false
      }

      // Check type filter
      if (eventTypeFilter !== "ALL" && event.type !== eventTypeFilter) {
        return false
      }

      // Check if event is not expired (date + endTime)
      try {
        const eventDate = new Date(event.date)
        
        // If there's an endTime, combine date and endTime for evaluation
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':')
          eventDate.setHours(parseInt(hours), parseInt(minutes))
        }
        
        // Event must be in the future or today
        return eventDate >= now || 
               (eventDate.toDateString() === now.toDateString())
      } catch (error) {
        console.error("Error parsing event date:", error)
        return false
      }
    })
  }, [events, eventStatusFilter, eventTypeFilter])

  // Pagination for Club Applications
  const {
    currentPage: clubAppsCurrentPage,
    totalPages: clubAppsTotalPages,
    paginatedData: paginatedClubAppsList,
    setCurrentPage: setClubAppsCurrentPage,
  } = usePagination({
    data: filteredClubApplications,
    initialPageSize: 3,
  })

  // Filter attendance data by month
  const filteredAttendanceData = useMemo(() => {
    if (!attendanceSummary) return []
    
    if (attendanceMonthFilter === "ALL") {
      return attendanceSummary.monthlySummary
    }
    
    return attendanceSummary.monthlySummary.filter(
      (item) => item.month === attendanceMonthFilter
    )
  }, [attendanceSummary, attendanceMonthFilter])

  // Calculate total participants
  const totalParticipants = useMemo(() => {
    return filteredAttendanceData.reduce((sum, item) => sum + item.participantCount, 0)
  }, [filteredAttendanceData])

  // Pagination for Clubs List
  const {
    currentPage: clubsCurrentPage,
    totalPages: clubsTotalPages,
    paginatedData: paginatedClubsList,
    setCurrentPage: setClubsCurrentPage,
  } = usePagination({
    data: clubsWithMemberCount,
    initialPageSize: 5,
  })

  // Pagination for Event Requests
  const {
    currentPage: eventsCurrentPage,
    totalPages: eventsTotalPages,
    paginatedData: paginatedEventsList,
    setCurrentPage: setEventsCurrentPage,
  } = usePagination({
    data: filteredEvents,
    initialPageSize: 3,
  })

  // Reset Club Applications pagination when filter changes
  useEffect(() => {
    setClubAppsCurrentPage(1)
  }, [clubAppStatusFilter, setClubAppsCurrentPage])

  // Reset Events pagination when filters change
  useEffect(() => {
    setEventsCurrentPage(1)
  }, [eventStatusFilter, eventTypeFilter, setEventsCurrentPage])

  const statusDotClass: Record<string, string> = {
    APPROVED: "bg-green-500",
    PENDING: "bg-yellow-500",
    REJECTED: "bg-red-500",
  }

  const goClubAppsPrev = () => setClubAppsCurrentPage(Math.max(1, clubAppsCurrentPage - 1))
  const goClubAppsNext = () => setClubAppsCurrentPage(Math.min(clubAppsTotalPages, clubAppsCurrentPage + 1))

  const goClubsPrev = () => setClubsCurrentPage(Math.max(1, clubsCurrentPage - 1))
  const goClubsNext = () => setClubsCurrentPage(Math.min(clubsTotalPages, clubsCurrentPage + 1))
  
  const goEventsPrev = () => setEventsCurrentPage(Math.max(1, eventsCurrentPage - 1))
  const goEventsNext = () => setEventsCurrentPage(Math.min(eventsTotalPages, eventsCurrentPage + 1))

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        <div className="space-y-4 sm:space-y-8 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                University Staff Dashboard
              </h1>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-secondary flex-1 sm:flex-initial">
                <Download className="h-4 w-4" />
                <span className="hidden xs:inline">Export Report</span>
                <span className="xs:hidden">Export</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 xs:grid-cols-2 md:grid-cols-4">
            <Card 
              className="stats-card-hover border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100"
              onClick={() => router.push('/uni-staff/clubs')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Total Clubs</CardTitle>
                <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
                  <Building className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{totalClubs}</div>
                  <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="stats-card-hover border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100"
              onClick={() => router.push('/uni-staff/clubs-req')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Club Requests</CardTitle>
                <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">{totalClubApplications}</div>
                <div className="flex items-center text-[10px] sm:text-xs text-green-600 dark:text-green-400 mt-1">
                      <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      {approvedClubApplications} approved
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="stats-card-hover border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100"
              onClick={() => router.push('/uni-staff/events-req')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">Event Requests</CardTitle>
                <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">{totalEventRequests}</div>
                <div className="flex items-center text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 mt-1">
                      <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      {approvedEvents} approved
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="stats-card-hover border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100"
              onClick={() => router.push('/uni-staff/policies')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">
                  Total Policies
                </CardTitle>
                <div className="p-1.5 sm:p-2 bg-orange-500 rounded-lg">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100">{totalPolicies}</div>
                  <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Overview and Analytics */}
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
              <TabsTrigger value="overview" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <List className="h-3 w-3 sm:h-4 sm:w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              {/* First Row: Club Applications and Event Requests side by side */}
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Club Applications List (with status filter) */}
            <Card className="border-2">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <div className="p-1 sm:p-1.5 bg-green-500 rounded-lg flex-shrink-0">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                    <span className="truncate">Club Applications</span>
                </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs mt-1">
                    <span className="hidden sm:inline">Sorted by latest submission date • </span>
                    <span className="font-semibold text-amber-600 dark:text-amber-500">{pendingClubApplications} pending</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <Filter className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <Select value={clubAppStatusFilter} onValueChange={setClubAppStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[110px] h-7 sm:h-8 text-[11px] sm:text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              </CardHeader>
              <CardContent>
              <div className="space-y-2">
                {paginatedClubAppsList.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">No club applications found</div>
                ) : (
                  paginatedClubAppsList.map((app: any) => {
                    const submittedDate = new Date(app.submittedAt)
                    const formattedDate = submittedDate.toLocaleDateString("en-US")
                    const statusClass = statusDotClass[app.status] || "bg-gray-500"
                    
                    return (
                      <div
                        key={app.applicationId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-0"
                      >
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 mt-1 sm:mt-0 ${statusClass}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">{app.clubName}</p>
                            <div className="flex flex-col gap-0.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                              <span className="truncate">Proposer: {app.submittedBy?.fullName || app.proposer?.fullName || "Unknown"}</span>
                              <span className="truncate">Major: {app.majorName || "Not specified"}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                {formattedDate}
                          </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end sm:justify-start gap-3 flex-shrink-0">
                          <Badge
                            variant={
                              app.status === "APPROVED"
                                ? "default"
                                : app.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-[10px] sm:text-xs px-2 py-0.5"
                          >
                            {app.status === "PENDING" ? "Pending" : app.status === "APPROVED" ? "Approved" : "Rejected"}
                          </Badge>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {clubAppsTotalPages > 1 && (
                <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goClubAppsPrev}
                    disabled={clubAppsCurrentPage === 1}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                  >
                    <ChevronLeft className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <span className="text-[10px] sm:text-xs font-medium px-1">
                    {clubAppsCurrentPage}/{clubAppsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goClubAppsNext}
                    disabled={clubAppsCurrentPage === clubAppsTotalPages}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3 w-3 sm:ml-1" />
                  </Button>
                </div>
              )}
              </CardContent>
            </Card>

          {/* Event Requests List (with filters) */}
          <Card className="border-2">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex flex-col gap-3">
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <div className="p-1 sm:p-1.5 bg-purple-500 rounded-lg flex-shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                    <span className="truncate">Event Requests</span>
                </CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardDescription className="text-[10px] sm:text-xs">
                    <span className="hidden sm:inline">Filter upcoming events (non-expired) • </span>
                    <span className="font-semibold text-amber-600 dark:text-amber-500">{pendingEvents} pending</span>
                  </CardDescription>
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <Filter className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <Select value={eventStatusFilter} onValueChange={setEventStatusFilter}>
                      <SelectTrigger className="flex-1 sm:w-[90px] md:w-[110px] h-7 sm:h-8 text-[10px] sm:text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                      <SelectTrigger className="flex-1 sm:w-[90px] md:w-[110px] h-7 sm:h-8 text-[10px] sm:text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="WORKSHOP">Workshop</SelectItem>
                      <SelectItem value="SEMINAR">Seminar</SelectItem>
                      <SelectItem value="SOCIAL">Social</SelectItem>
                      <SelectItem value="COMPETITION">Competition</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  </div>
                </div>
              </div>
              </CardHeader>
              <CardContent>
              <div className="space-y-2">
                {eventsLoading ? (
                  <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">Loading...</div>
                ) : paginatedEventsList.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">No events found matching criteria</div>
                ) : (
                  paginatedEventsList.map((event: any) => {
                    const eventDate = new Date(event.date)
                    const formattedDate = eventDate.toLocaleDateString("en-US")
                    const statusClass = statusDotClass[event.status] || "bg-gray-500"
                    
                    return (
                      <div
                        key={event.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-0"
                      >
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 mt-1 sm:mt-0 ${statusClass}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">{event.name}</p>
                            <div className="flex flex-col gap-0.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                <span className="truncate">
                                {formattedDate} {event.time || ""}
                                {event.endTime && <span>- {event.endTime}</span>}
                                </span>
                              </span>
                              <span className="truncate">{event.locationName || "Location not specified"}</span>
                          </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end sm:justify-start gap-3 flex-shrink-0">
                        <div className="text-right sm:text-left">
                            <Badge
                              variant={
                                event.status === "APPROVED"
                                  ? "default"
                                  : event.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-[10px] sm:text-xs px-2 py-0.5"
                            >
                              {event.status === "PENDING" ? "Pending" : event.status === "APPROVED" ? "Approved" : "Rejected"}
                            </Badge>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                              {event.type || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                </div>

              {eventsTotalPages > 1 && (
                <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                    onClick={goEventsPrev}
                    disabled={eventsCurrentPage === 1}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                  >
                    <ChevronLeft className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                    </Button>
                  <span className="text-[10px] sm:text-xs font-medium px-1">
                    {eventsCurrentPage}/{eventsTotalPages}
                  </span>
                    <Button
                      variant="outline"
                      size="sm"
                    onClick={goEventsNext}
                    disabled={eventsCurrentPage === eventsTotalPages}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3 w-3 sm:ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Attendance Summary Card (full width) */}
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
                        {filteredAttendanceData.map((item) => {
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
                        {attendanceRanking.clubRankings.map((club) => {
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

          {/* Second Row: All Clubs List (full width) */}
          <Card className="border-2">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                <div className="p-1 sm:p-1.5 bg-blue-500 rounded-lg flex-shrink-0">
                  <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                <span className="truncate">All Clubs List</span>
                </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span>Sort and filter clubs</span>
                {universityPointsData && (
                  <span className="flex items-center gap-1 font-semibold text-purple-600">
                    <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Total University Points: {universityPointsData.totalUniversityPoints.toLocaleString()}
                  </span>
                )}
              </CardDescription>
              
              {/* Sorting Controls */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Select value={clubSortField} onValueChange={(value: any) => setClubSortField(value)}>
                    <SelectTrigger className="h-8 text-xs sm:text-sm">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rank">Sort by Rank</SelectItem>
                      <SelectItem value="points">Sort by Points</SelectItem>
                      <SelectItem value="members">Sort by Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={clubSortOrder === "asc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setClubSortOrder("asc")}
                    className="h-8 text-xs sm:text-sm flex items-center gap-1.5"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Ascending</span>
                    <span className="sm:hidden">Asc</span>
                  </Button>
                  <Button
                    variant={clubSortOrder === "desc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setClubSortOrder("desc")}
                    className="h-8 text-xs sm:text-sm flex items-center gap-1.5"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Descending</span>
                    <span className="sm:hidden">Desc</span>
                  </Button>
                </div>
              </div>
              </CardHeader>
              <CardContent>
              <div className="space-y-2">
                {clubsLoading ? (
                  <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">Loading...</div>
                ) : paginatedClubsList.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">No clubs found</div>
                ) : (
                  paginatedClubsList.map((club: any, index: number) => (
                    <div
                      key={club.id}
                      className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-3"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {/* Rank Badge */}
                        {club.rank !== undefined && (
                          <div className={`
                            w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0
                            ${club.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' : 
                              club.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md' :
                              club.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' :
                              'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800'}
                          `}>
                            #{club.rank}
                          </div>
                        )}
                        
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                          {club.name?.charAt(0) || "C"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">{club.name}</p>
                          <div className="flex flex-col gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                            <span className="truncate">Leader: {club.leaderName || "Not assigned"}</span>
                            <span className="truncate">Major: {club.majorName || "Not assigned"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        {/* Points Display */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Award className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                            <p className="text-lg sm:text-xl font-bold text-purple-600">{club.totalPoints?.toLocaleString() || 0}</p>
                        </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Points</p>
                        </div>
                        
                        {/* Members Display */}
                        <div className="text-center">
                          <p className="text-lg sm:text-xl font-bold text-blue-600">{club.memberCount || 0}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Members</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {clubsTotalPages > 1 && (
                <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goClubsPrev}
                    disabled={clubsCurrentPage === 1}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                  >
                    <ChevronLeft className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <span className="text-[10px] sm:text-xs font-medium px-1">
                    {clubsCurrentPage}/{clubsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goClubsNext}
                    disabled={clubsCurrentPage === clubsTotalPages}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3 w-3 sm:ml-1" />
                  </Button>
                </div>
              )}
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
              {/* Analytics Dashboard with Charts */}
              
              {/* Row 1: Club Applications and Event Requests Donut Charts */}
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                {/* Club Applications Donut Chart */}
                <Card className="border-2">
              <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                      <div className="p-1 sm:p-1.5 bg-green-500 rounded-lg flex-shrink-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                      <span className="truncate">Club Applications Status</span>
                </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs">Distribution of club application statuses</CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="flex flex-col sm:flex-row lg:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
                      {/* Donut Chart */}
                      <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                          {totalClubApplications > 0 ? (
                            <>
                              {/* Pending Arc */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#eab308"
                                strokeWidth="20"
                                strokeDasharray={`${(pendingClubApplications / totalClubApplications) * 251.2} 251.2`}
                                className="transition-all duration-500"
                              />
                              {/* Approved Arc */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="20"
                                strokeDasharray={`${(approvedClubApplications / totalClubApplications) * 251.2} 251.2`}
                                strokeDashoffset={`-${(pendingClubApplications / totalClubApplications) * 251.2}`}
                                className="transition-all duration-500"
                              />
                              {/* Rejected Arc */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="20"
                                strokeDasharray={`${(rejectedClubApplications / totalClubApplications) * 251.2} 251.2`}
                                strokeDashoffset={`-${((pendingClubApplications + approvedClubApplications) / totalClubApplications) * 251.2}`}
                                className="transition-all duration-500"
                              />
                            </>
                          ) : (
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-2xl sm:text-3xl font-bold">{totalClubApplications}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>
                      
                      {/* Legend */}
                      <div className="flex-1 space-y-2 sm:space-y-3 w-full">
                        <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-500 flex-shrink-0" />
                            <span className="font-medium text-xs sm:text-sm">Pending</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{pendingClubApplications}</span>
                            <span className="text-[10px] sm:text-xs md:text-sm text-yellow-600">
                              ({totalClubApplications > 0 ? Math.round((pendingClubApplications / totalClubApplications) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="font-medium text-xs sm:text-sm">Approved</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{approvedClubApplications}</span>
                            <span className="text-[10px] sm:text-xs md:text-sm text-green-600">
                              ({totalClubApplications > 0 ? Math.round((approvedClubApplications / totalClubApplications) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 flex-shrink-0" />
                            <span className="font-medium text-xs sm:text-sm">Rejected</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{rejectedClubApplications}</span>
                            <span className="text-[10px] sm:text-xs md:text-sm text-red-600">
                              ({totalClubApplications > 0 ? Math.round((rejectedClubApplications / totalClubApplications) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                      </div>
                </div>
              </CardContent>
            </Card>

                {/* Event Requests Bar Chart */}
                <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                      <div className="p-1 sm:p-1.5 bg-purple-500 rounded-lg flex-shrink-0">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                      <span className="truncate">Event Requests Status</span>
              </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs">Distribution of event request statuses (non-expired only)</CardDescription>
            </CardHeader>
            <CardContent>
                    <div className="space-y-4 sm:space-y-6">
                      {/* Total Count Display */}
                      <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="text-3xl sm:text-4xl font-bold text-white-600">{totalEventRequests}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Requests</div>
                      </div>

                      {/* Bar Chart */}
                      <div className="space-y-4 sm:space-y-6">
                        {/* Pending Bar */}
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-yellow-500 flex-shrink-0" />
                              <span className="font-semibold text-xs sm:text-sm text-yellow-700 dark:text-yellow-400">Pending</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-500">{pendingEvents}</span>
                              <span className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-500 w-10 sm:w-12 text-right">
                                {totalEventRequests > 0 ? Math.round((pendingEvents / totalEventRequests) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                          <div className="relative h-8 sm:h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div
                              className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                              style={{
                                width: `${totalEventRequests > 0 ? (pendingEvents / totalEventRequests) * 100 : 0}%`,
                                backgroundColor: '#eab308',
                              }}
                            >
                              {pendingEvents > 0 && (
                                <span className="text-[10px] sm:text-xs font-bold text-white px-1 sm:px-2">
                                  {pendingEvents} request{pendingEvents !== 1 ? 's' : ''}
                                </span>
                              )}
                  </div>
                  </div>
                </div>

                        {/* Approved Bar */}
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-green-500 flex-shrink-0" />
                              <span className="font-semibold text-xs sm:text-sm text-green-700 dark:text-green-400">Approved</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-500">{approvedEvents}</span>
                              <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-500 w-10 sm:w-12 text-right">
                                {totalEventRequests > 0 ? Math.round((approvedEvents / totalEventRequests) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                          <div className="relative h-8 sm:h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div
                              className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                              style={{
                                width: `${totalEventRequests > 0 ? (approvedEvents / totalEventRequests) * 100 : 0}%`,
                                backgroundColor: '#22c55e',
                              }}
                            >
                              {approvedEvents > 0 && (
                                <span className="text-[10px] sm:text-xs font-bold text-white px-1 sm:px-2">
                                  {approvedEvents} request{approvedEvents !== 1 ? 's' : ''}
                                </span>
                              )}
                  </div>
                  </div>
                </div>

                        {/* Rejected Bar */}
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-red-500 flex-shrink-0" />
                              <span className="font-semibold text-xs sm:text-sm text-red-700 dark:text-red-400">Rejected</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 dark:text-red-500">{rejectedEvents}</span>
                              <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-500 w-10 sm:w-12 text-right">
                                {totalEventRequests > 0 ? Math.round((rejectedEvents / totalEventRequests) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                          <div className="relative h-8 sm:h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div
                              className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                              style={{
                                width: `${totalEventRequests > 0 ? (rejectedEvents / totalEventRequests) * 100 : 0}%`,
                                backgroundColor: '#ef4444',
                              }}
                            >
                              {rejectedEvents > 0 && (
                                <span className="text-[10px] sm:text-xs font-bold text-white px-1 sm:px-2">
                                  {rejectedEvents} request{rejectedEvents !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                  </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
              </div>

              {/* Top Clubs by Member Count */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <div className="p-1 sm:p-1.5 bg-blue-500 rounded-lg flex-shrink-0">
                      <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="truncate">Top 10 Clubs by Members</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs">Most popular clubs based on member count</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const topClubs = clubsWithMemberCount.slice(0, 10)
                    const maxMembers = Math.max(...topClubs.map((c: any) => c.memberCount || 0), 1)
                    const minMembers = Math.min(...topClubs.map((c: any) => c.memberCount || 0))
                    
                    // Chart dimensions
                    const chartHeight = 300
                    const chartWidth = 800
                    const padding = { top: 20, right: 60, bottom: 80, left: 60 }
                    const graphHeight = chartHeight - padding.top - padding.bottom
                    const graphWidth = chartWidth - padding.left - padding.right
                    
                    // Calculate points for the line
                    const points = topClubs.map((club: any, index: number) => {
                      const x = padding.left + (index * graphWidth) / Math.max(topClubs.length - 1, 1)
                      const y = padding.top + graphHeight - ((club.memberCount || 0) / maxMembers) * graphHeight
                      return { x, y, club, index }
                    })
                    
                    // Create path for the line
                    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                    
                    // Create area path (fill under the line)
                    const areaPath = points.length > 0 
                      ? `M ${points[0].x} ${padding.top + graphHeight} ${points.map((p) => `L ${p.x} ${p.y}`).join(' ')} L ${points[points.length - 1].x} ${padding.top + graphHeight} Z`
                      : ''
                      
                      return (
                      <div className="w-full overflow-x-auto pb-2">
                        <svg 
                          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                          className="w-full" 
                          style={{ minWidth: '400px' }}
                        >
                          {/* Grid lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
                            const y = padding.top + graphHeight * (1 - percent)
                            return (
                              <g key={percent}>
                                <line
                                  x1={padding.left}
                                  y1={y}
                                  x2={padding.left + graphWidth}
                                  y2={y}
                                  stroke="currentColor"
                                  strokeOpacity="0.1"
                                  strokeWidth="1"
                                />
                                <text
                                  x={padding.left - 10}
                                  y={y + 4}
                                  textAnchor="end"
                                  fontSize="12"
                                  fill="currentColor"
                                  opacity="0.6"
                                >
                                  {Math.round(maxMembers * percent)}
                                </text>
                              </g>
                            )
                          })}
                          
                          {/* Area fill under the line */}
                          <path
                            d={areaPath}
                            fill="url(#gradient)"
                            opacity="0.2"
                          />
                          
                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                            </linearGradient>
                          </defs>
                          
                          {/* Line */}
                          <path
                            d={linePath}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          
                          {/* Points and labels */}
                          {points.map((point, i) => (
                            <g key={i}>
                              {/* Vertical line from point to x-axis */}
                              <line
                                x1={point.x}
                                y1={point.y}
                                x2={point.x}
                                y2={padding.top + graphHeight}
                                stroke="currentColor"
                                strokeOpacity="0.1"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                              />
                              
                              {/* Point circle */}
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r="6"
                                fill="#3b82f6"
                                stroke="white"
                                strokeWidth="2"
                                className="cursor-pointer hover:r-8 transition-all"
                              />
                              
                              {/* Member count label above point */}
                              <text
                                x={point.x}
                                y={point.y - 15}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="bold"
                                fill="#3b82f6"
                              >
                                {point.club.memberCount || 0}
                              </text>
                              
                              {/* Club name label (rotated) */}
                              <text
                                x={point.x}
                                y={padding.top + graphHeight + 15}
                                textAnchor="start"
                                fontSize="11"
                                fill="currentColor"
                                opacity="0.8"
                                transform={`rotate(45 ${point.x} ${padding.top + graphHeight + 15})`}
                              >
                                #{i + 1} {point.club.clubName?.length > 15 ? point.club.clubName.substring(0, 15) + '...' : point.club.clubName}
                              </text>
                            </g>
                          ))}
                          
                          {/* Y-axis label */}
                          <text
                            x={padding.left - 40}
                            y={padding.top + graphHeight / 2}
                            textAnchor="middle"
                            fontSize="12"
                            fontWeight="bold"
                            fill="currentColor"
                            opacity="0.6"
                            transform={`rotate(-90 ${padding.left - 40} ${padding.top + graphHeight / 2})`}
                          >
                            Members
                          </text>
                          
                          {/* X-axis label */}
                          <text
                            x={padding.left + graphWidth / 2}
                            y={chartHeight - 10}
                            textAnchor="middle"
                            fontSize="12"
                            fontWeight="bold"
                            fill="currentColor"
                            opacity="0.6"
                          >
                            Clubs (Ranked by Member Count)
                          </text>
                        </svg>
                        
                        {/* Legend */}
                        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-0.5 sm:w-4 sm:h-1 bg-blue-500 rounded flex-shrink-0" />
                            <span className="text-muted-foreground">Member Count Trend</span>
                            </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 border-2 border-white flex-shrink-0" />
                            <span className="text-muted-foreground">Club Position</span>
                          </div>
                        </div>
                  </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
