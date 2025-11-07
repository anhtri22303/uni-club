"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  useEvents, 
  useClubs, 
  useClubApplications,
  useUniversityPoints,
  useAttendanceSummary,
  useAttendanceRanking,
  useClubMemberCounts
} from "@/hooks/use-query-hooks"
import { timeObjectToString } from "@/service/eventApi"
import { useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Building,
  Download,
  ArrowUpRight,
  Activity,
  FileText,
  CheckCircle,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, List } from "lucide-react"
import { ClubApplicationsList } from "./components/ClubApplicationsList"
import { EventRequestsList } from "./components/EventRequestsList"
import { AttendanceSummaryCard } from "./components/AttendanceSummaryCard"
import { AllClubsList } from "./components/AllClubsList"
import { AnalyticsTab } from "./components/AnalyticsTab"

export default function UniStaffReportsPage() {
  const router = useRouter()
  const isMountedRef = useRef(true)

  // ✅ USE REACT QUERY for all data fetching
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const { data: clubs = [], isLoading: clubsLoading } = useClubs()
  // const { data: policies = [] } = usePolicies() // COMMENTED OUT
  const policies: any[] = [] // Mock data for policies
  const { data: clubApplications = [], isLoading: clubAppsLoading } = useClubApplications()
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ✅ USE REACT QUERY for university analytics
  const { data: universityPointsData, isLoading: pointsLoading } = useUniversityPoints()
  const { data: attendanceSummary, isLoading: summaryLoading } = useAttendanceSummary(new Date().getFullYear())
  const { data: attendanceRanking, isLoading: rankingLoading } = useAttendanceRanking()

  // ✅ OPTIMIZED: Use React Query hook to fetch all member counts in parallel
  const clubIds = useMemo(() => clubs.map((club: any) => club.id), [clubs])
  const { data: memberCountsData, isLoading: memberCountsLoading } = useClubMemberCounts(clubIds)

  // ✅ Merge clubs with member counts and ranking data using useMemo
  const clubsWithMemberCountUnsorted = useMemo(() => {
    if (!clubs.length || !memberCountsData || !universityPointsData) {
      console.log('⏳ Waiting for data:', { 
        clubsLength: clubs.length, 
        hasMemberCounts: !!memberCountsData, 
        hasUniversityData: !!universityPointsData 
      })
      return []
    }

    console.log('🔄 Merging club data...')
    console.log('  - Clubs:', clubs.length)
    console.log('  - Member counts:', Object.keys(memberCountsData).length)
    console.log('  - University points data:', universityPointsData)

    const merged = clubs.map((club: any) => {
      const memberData = memberCountsData[club.id] || { activeMemberCount: 0, approvedEvents: 0 }
      const rankingData = universityPointsData.clubRankings?.find(
        (ranking: any) => ranking.clubId === club.id
      )
            
            return {
              ...club,
        clubName: club.name,
        memberCount: memberData.activeMemberCount,
        approvedEvents: memberData.approvedEvents,
              rank: rankingData?.rank,
              totalPoints: rankingData?.totalPoints || 0
      }
    })

    console.log('✅ Merged club data:', merged)
    return merged
  }, [clubs, memberCountsData, universityPointsData])

  const totalClubs = clubs.length
  const totalPolicies = policies.length
  const totalClubApplications = clubApplications.length
  const totalEventRequests = events.length
  
  // Count approved club applications
  const approvedClubApplications = clubApplications.filter((app: any) => app.status === "APPROVED").length
  
  // Count pending club applications
  const pendingClubApplications = clubApplications.filter((app: any) => app.status === "PENDING").length
  
  // Count rejected club applications
  const rejectedClubApplications = clubApplications.filter((app: any) => app.status === "REJECTED").length
  
  // Count events by status (all events, not filtered by expiration)
  const pendingCoClubEvents = useMemo(() => {
    return events.filter((event: any) => event.status === "PENDING_COCLUB").length
  }, [events])

  const pendingUniStaffEvents = useMemo(() => {
    return events.filter((event: any) => event.status === "PENDING_UNISTAFF").length
  }, [events])

  const approvedEventsCount = useMemo(() => {
    return events.filter((event: any) => event.status === "APPROVED").length
  }, [events])

  const ongoingEventsCount = useMemo(() => {
    return events.filter((event: any) => event.status === "ONGOING").length
  }, [events])

  const completedEventsCount = useMemo(() => {
    return events.filter((event: any) => event.status === "COMPLETED").length
  }, [events])

  const rejectedEventsCount = useMemo(() => {
    return events.filter((event: any) => event.status === "REJECTED").length
  }, [events])

  const cancelledEventsCount = useMemo(() => {
    return events.filter((event: any) => event.status === "CANCELLED").length
  }, [events])

  // Aggregate counts
  const pendingEvents = pendingCoClubEvents + pendingUniStaffEvents
  const approvedEvents = approvedEventsCount + ongoingEventsCount
  const rejectedEvents = rejectedEventsCount + cancelledEventsCount

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
                <ClubApplicationsList 
                  clubApplications={clubApplications}
                  pendingClubApplications={pendingClubApplications}
                />
                <EventRequestsList 
                  events={events}
                  eventsLoading={eventsLoading}
                  pendingEvents={pendingEvents}
                />
          </div>

          {/* Attendance Summary Card (full width) */}
              <AttendanceSummaryCard 
                attendanceSummary={attendanceSummary}
                attendanceRanking={attendanceRanking}
              />

              {/* All Clubs List (full width) */}
              <AllClubsList 
                clubsWithMemberCountUnsorted={clubsWithMemberCountUnsorted}
                clubsLoading={clubsLoading}
                universityPointsData={universityPointsData}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
              <AnalyticsTab 
                clubsWithMemberCount={clubsWithMemberCountUnsorted}
                totalClubApplications={totalClubApplications}
                approvedClubApplications={approvedClubApplications}
                pendingClubApplications={pendingClubApplications}
                rejectedClubApplications={rejectedClubApplications}
                totalEventRequests={totalEventRequests}
                pendingCoClubEvents={pendingCoClubEvents}
                pendingUniStaffEvents={pendingUniStaffEvents}
                approvedEventsCount={approvedEventsCount}
                ongoingEventsCount={ongoingEventsCount}
                completedEventsCount={completedEventsCount}
                rejectedEventsCount={rejectedEventsCount}
                cancelledEventsCount={cancelledEventsCount}
              />
            </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
