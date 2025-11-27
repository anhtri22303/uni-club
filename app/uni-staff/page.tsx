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
  useClubMemberCounts,
  useLocations,
  useMajors,
  usePolicies
} from "@/hooks/use-query-hooks"
import { timeObjectToString } from "@/service/eventApi"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Building,
  Download,
  ArrowUpRight,
  Activity,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, List, TrendingUp } from "lucide-react"
import { ClubApplicationsList } from "./components/ClubApplicationsList"
import { EventRequestsList } from "./components/EventRequestsList"
import { AttendanceSummaryCard } from "./components/AttendanceSummaryCard"
import { AllClubsList } from "./components/AllClubsList"
import { AnalyticsTab } from "./components/AnalyticsTab"
import { DashboardCharts } from "./components/DashboardCharts"
import { StatisticsCards } from "./components/StatisticsCards"
import { DataSummaryTables } from "./components/DataSummaryTables"
import { getTags, Tag } from "@/service/tagApi"
import { getFeedbackByClubId } from "@/service/feedbackApi"
import { usePointRequests } from "@/service/pointRequestsApi"
import { getMutiplierPolicy } from "@/service/multiplierPolicyApi"

export default function UniStaffReportsPage() {
  const router = useRouter()
  const isMountedRef = useRef(true)

  //    USE REACT QUERY for all data fetching
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const { data: clubs = [], isLoading: clubsLoading } = useClubs()
  const { data: clubApplications = [], isLoading: clubAppsLoading } = useClubApplications()
  const { data: locations = [], isLoading: locationsLoading } = useLocations()
  const { data: majors = [], isLoading: majorsLoading } = useMajors()
  const { data: policies = [], isLoading: policiesLoading } = usePolicies()
  const { data: pointRequests = [] } = usePointRequests()
  
  // Additional state for tags, multiplier policies, and feedbacks
  const [tags, setTags] = useState<Tag[]>([])
  const [multiplierPolicies, setMultiplierPolicies] = useState<any[]>([])
  const [feedbackSummary, setFeedbackSummary] = useState<any[]>([])
  const [loadingAdditional, setLoadingAdditional] = useState(true)
  const [systemDataViewMode, setSystemDataViewMode] = useState<'table' | 'chart'>('table')
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Fetch additional data (Tags, Multiplier Policies, Feedback Summary)
  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        setLoadingAdditional(true)
        
        // Fetch Tags
        const tagsData = await getTags()
        setTags(tagsData || [])
        
        // Fetch Multiplier Policies
        const multiplierData = await getMutiplierPolicy()
        setMultiplierPolicies(multiplierData || [])
        
        // Fetch Feedback Summary for all clubs
        if (clubs.length > 0) {
          const feedbackPromises = clubs.map(async (club: any) => {
            try {
              const feedbacks = await getFeedbackByClubId(club.id)
              if (feedbacks && feedbacks.length > 0) {
                const totalRating = feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0)
                return {
                  clubId: club.id,
                  clubName: club.name,
                  totalFeedbacks: feedbacks.length,
                  avgRating: totalRating / feedbacks.length
                }
              }
              return null
            } catch (error) {
              console.error(`Error fetching feedbacks for club ${club.id}:`, error)
              return null
            }
          })
          
          const feedbackResults = await Promise.all(feedbackPromises)
          setFeedbackSummary(feedbackResults.filter(Boolean))
        }
      } catch (error) {
        console.error('Error fetching additional data:', error)
      } finally {
        setLoadingAdditional(false)
      }
    }
    
    if (clubs.length > 0) {
      fetchAdditionalData()
    } else if (!clubsLoading) {
      setLoadingAdditional(false)
    }
  }, [clubs, clubsLoading])

  //    USE REACT QUERY for university analytics
  const { data: universityPointsData, isLoading: pointsLoading } = useUniversityPoints()
  const { data: attendanceSummary, isLoading: summaryLoading } = useAttendanceSummary(new Date().getFullYear())
  const { data: attendanceRanking, isLoading: rankingLoading } = useAttendanceRanking()

  //    OPTIMIZED: Use React Query hook to fetch all member counts in parallel
  const clubIds = useMemo(() => clubs.map((club: any) => club.id), [clubs])
  const { data: memberCountsData, isLoading: memberCountsLoading } = useClubMemberCounts(clubIds)

  //    Merge clubs with member counts and ranking data using useMemo
  const clubsWithMemberCountUnsorted = useMemo(() => {
    if (!clubs.length || !memberCountsData || !universityPointsData) {
      console.log(' Waiting for data:', { 
        clubsLength: clubs.length, 
        hasMemberCounts: !!memberCountsData, 
        hasUniversityData: !!universityPointsData 
      })
      return []
    }

    console.log(' Merging club data...')
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

    console.log('   Merged club data:', merged)
    return merged
  }, [clubs, memberCountsData, universityPointsData])

  const totalClubs = clubs.length
  const totalPolicies = policies.length
  const totalClubApplications = clubApplications.length
  const totalEventRequests = events.length
  
  // Additional statistics - with safe array handling
  const locationsArray = Array.isArray(locations) ? locations : (locations?.content || [])
  const totalLocations = locationsArray.length
  const totalTags = tags.length
  const coreTags = tags.filter(tag => tag.core).length
  const totalMajors = majors.length
  const totalFeedbacks = feedbackSummary.reduce((sum, item) => sum + item.totalFeedbacks, 0)
  const avgRating = feedbackSummary.length > 0 
    ? feedbackSummary.reduce((sum, item) => sum + item.avgRating, 0) / feedbackSummary.length 
    : 0
  const totalMultiplierPolicies = multiplierPolicies.length
  const pointRequestsArray = Array.isArray(pointRequests) ? pointRequests : (pointRequests?.data || [])
  const totalPointRequests = pointRequestsArray.length
  const pendingPointRequests = pointRequestsArray.filter((req: any) => req.status === "PENDING").length
  
  // Count completed club applications
  const completedClubApplications = clubApplications.filter((app: any) => app.status === "COMPLETED").length
  
  // Count approved club applications (In Progress)
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
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-primary to-secondary flex-1 sm:flex-initial"
                onClick={() => router.push('/uni-staff/reports')}
              >
                <Download className="h-4 w-4" />
                <span className="hidden xs:inline">To Report Page</span>
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
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-blue-600 dark:text-blue-400">Active Members:</span>
                    <span className="font-semibold bg-blue-200 dark:bg-blue-800 px-1.5 py-0.5 rounded">
                      {clubsWithMemberCountUnsorted.reduce((sum: number, club: any) => sum + club.memberCount, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-blue-600 dark:text-blue-400">Total Events:</span>
                    <span className="font-semibold bg-blue-200 dark:bg-blue-800 px-1.5 py-0.5 rounded">
                      {clubsWithMemberCountUnsorted.reduce((sum: number, club: any) => sum + club.approvedEvents, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-blue-600 dark:text-blue-400">Avg Members/Club:</span>
                    <span className="font-semibold bg-blue-200 dark:bg-blue-800 px-1.5 py-0.5 rounded">
                      {totalClubs > 0 ? Math.round(clubsWithMemberCountUnsorted.reduce((sum: number, club: any) => sum + club.memberCount, 0) / totalClubs) : 0}
                    </span>
                  </div>
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
                  <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">{totalClubApplications}</div>
                  <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-green-600 dark:text-green-400">Pending Review:</span>
                    <span className="font-semibold bg-yellow-200 dark:bg-yellow-800 px-1.5 py-0.5 rounded">
                      {pendingClubApplications}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-green-600 dark:text-green-400">In Progress:</span>
                    <span className="font-semibold bg-blue-200 dark:bg-blue-800 px-1.5 py-0.5 rounded">
                      {approvedClubApplications}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-2.5 w-2.5" />
                      Completed:
                    </span>
                    <span className="font-semibold bg-green-200 dark:bg-green-800 px-1.5 py-0.5 rounded">
                      {completedClubApplications}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-green-600 dark:text-green-400">Rejected:</span>
                    <span className="font-semibold bg-red-200 dark:bg-red-800 px-1.5 py-0.5 rounded">
                      {rejectedClubApplications}
                    </span>
                  </div>
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
                  <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">{totalEventRequests}</div>
                  <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                      <Clock className="h-2.5 w-2.5" />
                      Pending Uni-Staff:
                    </span>
                    <span className="font-semibold bg-yellow-200 dark:bg-yellow-800 px-1.5 py-0.5 rounded">
                      {pendingUniStaffEvents}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                      <Clock className="h-2.5 w-2.5" />
                      Pending Co-Club:
                    </span>
                    <span className="font-semibold bg-orange-200 dark:bg-orange-800 px-1.5 py-0.5 rounded">
                      {pendingCoClubEvents}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-purple-600 dark:text-purple-400">Active:</span>
                    <span className="font-semibold bg-blue-200 dark:bg-blue-800 px-1.5 py-0.5 rounded">
                      {approvedEventsCount + ongoingEventsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                      <CheckCircle className="h-2.5 w-2.5" />
                      Completed:
                    </span>
                    <span className="font-semibold bg-green-200 dark:bg-green-800 px-1.5 py-0.5 rounded">
                      {completedEventsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                      <XCircle className="h-2.5 w-2.5" />
                      Cancelled:
                    </span>
                    <span className="font-semibold bg-red-200 dark:bg-red-800 px-1.5 py-0.5 rounded">
                      {rejectedEvents}
                    </span>
                  </div>
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
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-orange-600 dark:text-orange-400">Major Policies:</span>
                    <span className="font-semibold bg-orange-200 dark:bg-orange-800 px-1.5 py-0.5 rounded">
                      {totalPolicies}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-orange-600 dark:text-orange-400">Multiplier Policies:</span>
                    <span className="font-semibold bg-orange-200 dark:bg-orange-800 px-1.5 py-0.5 rounded">
                      {totalMultiplierPolicies}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-orange-600 dark:text-orange-400">Active Locations:</span>
                    <span className="font-semibold bg-orange-200 dark:bg-orange-800 px-1.5 py-0.5 rounded">
                      {totalLocations}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-orange-600 dark:text-orange-400">Active Tags:</span>
                    <span className="font-semibold bg-orange-200 dark:bg-orange-800 px-1.5 py-0.5 rounded">
                      {totalTags}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Overview, Analytics, and System Data */}
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger value="overview" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <List className="h-3 w-3 sm:h-4 sm:w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                System Data
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
              {/* Dashboard Charts */}
              <DashboardCharts 
                events={events}
                clubs={clubs}
                clubApplications={clubApplications}
                totalClubApplications={totalClubApplications}
                completedClubApplications={completedClubApplications}
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
              
              {/* Original Analytics Tab */}
              <AnalyticsTab 
                clubsWithMemberCount={clubsWithMemberCountUnsorted}
                totalClubApplications={totalClubApplications}
                completedClubApplications={completedClubApplications}
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

            <TabsContent value="system" className="space-y-4 sm:space-y-6">
              {/* View Mode Toggle Button */}
              <div className="flex justify-end">
                <div className="inline-flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Button
                    variant={systemDataViewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSystemDataViewMode('table')}
                    className="gap-2 text-xs sm:text-sm"
                  >
                    <List className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Table</span>
                  </Button>
                  <Button
                    variant={systemDataViewMode === 'chart' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSystemDataViewMode('chart')}
                    className="gap-2 text-xs sm:text-sm"
                  >
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Chart</span>
                  </Button>
                </div>
              </div>

              {/* Statistics Cards for System Data */}
              <StatisticsCards 
                totalLocations={totalLocations}
                totalTags={totalTags}
                coreTags={coreTags}
                totalMajors={totalMajors}
                totalFeedbacks={totalFeedbacks}
                avgRating={avgRating}
                totalPolicies={totalPolicies}
                totalMultiplierPolicies={totalMultiplierPolicies}
                loading={loadingAdditional || locationsLoading || majorsLoading || policiesLoading}
              />

              {/* Data Summary Tables */}
              <DataSummaryTables 
                locations={locationsArray}
                tags={tags && Array.isArray(tags) ? tags : []}
                majors={majors}
                feedbackSummary={feedbackSummary}
                loading={loadingAdditional}
                viewMode={systemDataViewMode}
                onViewModeChange={setSystemDataViewMode}
              />
            </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
