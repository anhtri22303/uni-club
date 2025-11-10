"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Users, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useProfile, useClub, useClubMembers, useMemberApplicationsByClub, useEventsByClubId, useEventCoHostByClubId } from "@/hooks/use-query-hooks"
import { getClubIdFromToken } from "@/service/clubApi"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { timeObjectToString } from "@/service/eventApi"
import { getProducts } from "@/service/productApi"
import { getClubRedeemOrders } from "@/service/redeemApi"
import { getClubWallet, getClubToMemberTransactions } from "@/service/walletApi"
import { fetchClubAttendanceHistory } from "@/service/attendanceApi"
import { fetchMajorById } from "@/service/majorApi"

// Import dashboard components
import {
  ClubInfoCard,
  MemberStatsCard,
  ApplicationStatsCard,
  EventStatsCard,
  ProductStatsCard,
  OrderStatsCard,
  WalletStatsCard,
  RecentApplicationsList,
  MembersByMajorList,
  CoHostEventsSection,
  MemberRoleChart,
  ApplicationStatusChart,
  EventsOverviewChart,
  MajorDistributionChart,
  ProductStatusChart,
  OrderStatusChart,
  WalletOverviewChart,
  KeyMetricsSummary,
} from "./components/dashboard"

export default function ClubLeaderDashboardPage() {
  const { auth } = useAuth()
  const { clubMemberships, membershipApplications, updateClubLeaderApplications, updateClubLeaderEventCounts } = useData()
  const router = useRouter()
  const [clubId, setClubId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview")
  const [isMobile, setIsMobile] = useState(false)

  // Get clubId from token
  useEffect(() => {
    const id = getClubIdFromToken()
    if (id) {
      setClubId(id)
    }
  }, [])

  // Track window size for mobile responsiveness
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch additional data (products, orders, wallet, attendance)
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [walletData, setWalletData] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])
  const [additionalDataLoading, setAdditionalDataLoading] = useState(false)
  const [policyName, setPolicyName] = useState<string | null>(null)

  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (!clubId) return
      
      setAdditionalDataLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]
        const [productsData, ordersData, walletDataResponse, transactionsData, attendanceData] = await Promise.all([
          getProducts(clubId, { includeInactive: true }).catch(() => []),
          getClubRedeemOrders(clubId).catch(() => []),
          getClubWallet(clubId).catch(() => null),
          getClubToMemberTransactions().catch(() => []),
          fetchClubAttendanceHistory({ clubId, date: today }).catch(() => [])
        ])

        setProducts(productsData)
        setOrders(ordersData)
        setWalletData(walletDataResponse)
        setTransactions(transactionsData)
        const attendance = (attendanceData as any)?.data || attendanceData || []
        setAttendanceHistory(Array.isArray(attendance) ? attendance : [])
      } catch (error) {
        console.error('Error fetching additional data:', error)
      } finally {
        setAdditionalDataLoading(false)
      }
    }

    fetchAdditionalData()
  }, [clubId])

  // USE REACT QUERY for profile, club, members, applications, and events
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: managedClub, isLoading: clubLoading } = useClub(clubId || 0, !!clubId)
  const { data: apiMembers = [], isLoading: membersLoading } = useClubMembers(clubId || 0, !!clubId)
  const { data: applications = [], isLoading: applicationsLoading } = useMemberApplicationsByClub(
    clubId || 0,
    !!clubId
  )
  const { data: rawEvents = [], isLoading: eventsLoading } = useEventsByClubId(clubId || 0, !!clubId)
  const { data: rawCoHostEvents = [], isLoading: coHostEventsLoading } = useEventCoHostByClubId(clubId || 0, !!clubId)

  const loading = profileLoading || clubLoading

  // Fetch major policy name when managedClub is loaded
  useEffect(() => {
    const fetchPolicyName = async () => {
      if (!managedClub?.majorId) return
      
      try {
        const majorData = await fetchMajorById(managedClub.majorId)
        console.log('Major data received:', majorData)
        
        // Check for policies array (proper typing)
        if (majorData?.policies && Array.isArray(majorData.policies) && majorData.policies.length > 0) {
          // Get the first active policy, or just the first policy if none are active
          const activePolicy = majorData.policies.find(p => p.active)
          const policyToUse = activePolicy || majorData.policies[0]
          setPolicyName(policyToUse.policyName)
          console.log('Policy name set:', policyToUse.policyName)
        } else {
          console.log('No policies found for major')
          setPolicyName(null)
        }
      } catch (error) {
        console.error('Error fetching policy name:', error)
        setPolicyName(null)
      }
    }

    fetchPolicyName()
  }, [managedClub])

  // Update DataContext with pending applications for sidebar badge
  useEffect(() => {
    if (applications && applications.length > 0) {
      const pendingApplications = applications.filter((app: any) => app.status === "PENDING")
      updateClubLeaderApplications(pendingApplications)
      console.log('📊 Club Leader Dashboard: Updated pending applications count:', pendingApplications.length)
    } else {
      updateClubLeaderApplications([])
    }
  }, [applications, updateClubLeaderApplications])

  // Update DataContext with event counts for sidebar badges
  useEffect(() => {
    if (!clubId) return

    // Count events from getEventsByClubId with PENDING_COCLUB status
    const pendingCoClubCount = rawEvents.filter((e: any) => e.status === "PENDING_COCLUB").length

    // Count events from getEventsByClubId with PENDING_UNISTAFF status
    const pendingUniStaffCount = rawEvents.filter((e: any) => e.status === "PENDING_UNISTAFF").length

    // Count co-host events with PENDING status
    const coHostPendingCount = rawCoHostEvents.filter((event: any) => {
      const myCoHostStatus = event.coHostedClubs?.find((club: any) => club.id === clubId)?.coHostStatus
      return myCoHostStatus === "PENDING"
    }).length

    updateClubLeaderEventCounts({
      pendingCoClub: pendingCoClubCount,
      pendingUniStaff: pendingUniStaffCount,
      coHostPending: coHostPendingCount
    })

    console.log('📊 Club Leader Dashboard: Updated event counts:', {
      pendingCoClub: pendingCoClubCount,
      pendingUniStaff: pendingUniStaffCount,
      coHostPending: coHostPendingCount
    })
  }, [rawEvents, rawCoHostEvents, clubId, updateClubLeaderEventCounts])

  // Transform API members data
  const allClubMembers = managedClub
    ? apiMembers
        .filter((m: any) => String(m.clubId) === String(managedClub.id) && m.state === "ACTIVE")
        .map((m: any) => ({
          id: m.membershipId ?? `m-${m.userId}`,
          userId: m.userId,
          clubId: m.clubId,
          fullName: m.fullName ?? `User ${m.userId}`,
          email: m.email ?? "N/A",
          phone: m.phone ?? "N/A",
          studentCode: m.studentCode ?? "N/A",
          majorName: m.major ?? "N/A",
          avatarUrl: m.avatarUrl ?? "/placeholder-user.jpg",
          role: m.clubRole ?? "MEMBER",
          isStaff: m.staff ?? false,
          status: m.state,
          joinedAt: m.joinedDate ? new Date(m.joinedDate).toLocaleDateString() : "N/A",
          joinedDate: m.joinedDate,
        }))
    : []

  // MEMBER STATISTICS
  const totalMembers = allClubMembers.length
  const leaderCount = allClubMembers.filter((m) => m.role === "LEADER").length
  const viceLeaderCount = allClubMembers.filter((m) => m.role === "VICE_LEADER").length
  const regularMembers = allClubMembers.filter((m) => m.role === "MEMBER").length
  const staffMembers = allClubMembers.filter((m) => m.isStaff).length

  // Members by major
  const membersByMajor = allClubMembers.reduce((acc: Record<string, number>, member) => {
    const major = member.majorName
    if (major && major !== "N/A") {
      acc[major] = (acc[major] || 0) + 1
    }
    return acc
  }, {})

  // Recently joined members (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentlyJoined = allClubMembers.filter(
    (m) => m.joinedDate && new Date(m.joinedDate) >= thirtyDaysAgo
  ).length

  // APPLICATION STATISTICS
  const totalApplications = applications.length
  const pendingApplicationsCount = applications.filter((a: any) => a.status === "PENDING").length
  const approvedApplicationsCount = applications.filter((a: any) => a.status === "APPROVED").length
  const rejectedApplicationsCount = applications.filter((a: any) => a.status === "REJECTED").length

  // PRODUCT/GIFT STATISTICS
  const totalProducts = products.length
  const activeProducts = products.filter((p: any) => p.status === "ACTIVE").length
  const inactiveProducts = products.filter((p: any) => p.status === "INACTIVE").length
  const totalStock = products.reduce((sum: number, p: any) => sum + (p.stockQuantity || 0), 0)
  const totalProductValue = products.reduce((sum: number, p: any) => sum + ((p.pointPrice || 0) * (p.stockQuantity || 0)), 0)

  // ORDER STATISTICS
  const totalOrders = orders.length
  const completedOrders = orders.filter((o: any) => o.status === "COMPLETED").length
  const pendingOrders = orders.filter((o: any) => o.status === "PENDING").length
  const cancelledOrders = orders.filter((o: any) => o.status === "CANCELLED").length
  const totalPointsRedeemed = orders
    .filter((o: any) => o.status === "COMPLETED")
    .reduce((sum: number, o: any) => sum + (o.totalPoints || 0), 0)

  // WALLET STATISTICS
  const walletBalance = walletData?.balancePoints || 0
  const totalTransactions = transactions.length
  const totalPointsGiven = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
  const avgTransaction = totalTransactions > 0 ? Math.round(totalPointsGiven / totalTransactions) : 0

  // ATTENDANCE STATISTICS
  const totalAttendanceRecords = attendanceHistory.length

  // EVENT STATISTICS - Helper functions
  const isEventExpired = (event: any) => {
    if (!event.date || !event.endTime) return false

    try {
      const now = new Date()
      const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
      const [year, month, day] = event.date.split('-').map(Number)
      const endTimeStr = timeObjectToString(event.endTime)
      const [hours, minutes] = endTimeStr.split(':').map(Number)
      const eventEndDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)
      return vnTime > eventEndDateTime
    } catch (error) {
      console.error('Error checking event expiration:', error)
      return false
    }
  }

  // Count events by status
  const pendingCoClubEvents = rawEvents.filter((e: any) => e.status === "PENDING_COCLUB").length
  const pendingUniStaffEvents = rawEvents.filter((e: any) => e.status === "PENDING_UNISTAFF").length
  const approvedEvents = rawEvents.filter((e: any) => e.status === "APPROVED").length
  const ongoingEvents = rawEvents.filter((e: any) => e.status === "ONGOING").length
  const completedEvents = rawEvents.filter((e: any) => e.status === "COMPLETED").length
  const rejectedEvents = rawEvents.filter((e: any) => e.status === "REJECTED").length
  const cancelledEvents = rawEvents.filter((e: any) => e.status === "CANCELLED").length
  
  // Aggregate counts
  const totalPendingEvents = pendingCoClubEvents + pendingUniStaffEvents
  const totalApprovedEvents = approvedEvents + ongoingEvents
  const activeEvents = approvedEvents + ongoingEvents // Events that can be registered/attended
  const totalSuccessfulEvents = approvedEvents + ongoingEvents + completedEvents
  
  // Recent applications
  const recentApplications = applications
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5)

  // CO-HOST EVENTS FILTERING
  const activeCoHostEvents = rawCoHostEvents.filter((event: any) => {
    if (isEventExpired(event)) return false
    const myCoHostStatus = event.coHostedClubs?.find((club: any) => club.id === clubId)?.coHostStatus
    return myCoHostStatus === "PENDING"
  })

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <Skeleton className="h-64 sm:h-72 rounded-lg" />
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-40 sm:h-48 rounded-lg" />
              <Skeleton className="h-40 sm:h-48 rounded-lg" />
              <Skeleton className="h-40 sm:h-48 rounded-lg" />
            </div>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <Skeleton className="h-80 sm:h-96 rounded-lg" />
              <Skeleton className="h-80 sm:h-96 rounded-lg" />
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
          {/* Club Information */}
          <ClubInfoCard managedClub={managedClub} clubLoading={clubLoading} policyName={policyName} />

          {/* Tab Buttons */}
          <div className="flex gap-2 border-b">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className={`flex items-center gap-2 rounded-b-none ${
                activeTab === "overview" 
                  ? "border-b-2 border-primary" 
                  : "border-b-2 border-transparent hover:border-muted"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              <Users className="h-4 w-4" />
              Overview
            </Button>
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              className={`flex items-center gap-2 rounded-b-none ${
                activeTab === "analytics" 
                  ? "border-b-2 border-primary" 
                  : "border-b-2 border-transparent hover:border-muted"
              }`}
              onClick={() => setActiveTab("analytics")}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
          </div>

          {/* Overview Tab Content */}
          {activeTab === "overview" && (
            <>
              {/* Stats Cards Row 1 */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <MemberStatsCard
                  totalMembers={totalMembers}
                  leaderCount={leaderCount}
                  viceLeaderCount={viceLeaderCount}
                  regularMembers={regularMembers}
                  staffMembers={staffMembers}
                  recentlyJoined={recentlyJoined}
                  membersLoading={membersLoading}
                />
                <ApplicationStatsCard
                  totalApplications={totalApplications}
                  approvedApplicationsCount={approvedApplicationsCount}
                  pendingApplicationsCount={pendingApplicationsCount}
                  rejectedApplicationsCount={rejectedApplicationsCount}
                  applicationsLoading={applicationsLoading}
                />
                <EventStatsCard
                  totalEvents={rawEvents.length}
                  pendingCoClubEvents={pendingCoClubEvents}
                  pendingUniStaffEvents={pendingUniStaffEvents}
                  approvedEvents={approvedEvents}
                  ongoingEvents={ongoingEvents}
                  completedEvents={completedEvents}
                  rejectedEvents={rejectedEvents}
                  cancelledEvents={cancelledEvents}
                  eventsLoading={eventsLoading}
                />
                  </div>

              {/* Stats Cards Row 2 */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <ProductStatsCard
                  totalProducts={totalProducts}
                  activeProducts={activeProducts}
                  inactiveProducts={inactiveProducts}
                  totalStock={totalStock}
                  totalProductValue={totalProductValue}
                  additionalDataLoading={additionalDataLoading}
                />
                <OrderStatsCard
                  totalOrders={totalOrders}
                  completedOrders={completedOrders}
                  pendingOrders={pendingOrders}
                  cancelledOrders={cancelledOrders}
                  totalPointsRedeemed={totalPointsRedeemed}
                  additionalDataLoading={additionalDataLoading}
                />
                <WalletStatsCard
                  walletBalance={walletBalance}
                  totalTransactions={totalTransactions}
                  totalPointsGiven={totalPointsGiven}
                  avgTransaction={avgTransaction}
                  totalAttendanceRecords={totalAttendanceRecords}
                  additionalDataLoading={additionalDataLoading}
                />
                  </div>

              {/* Lists */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                <RecentApplicationsList
                  recentApplications={recentApplications}
                  applicationsLoading={applicationsLoading}
                />
                <MembersByMajorList
                  membersByMajor={membersByMajor}
                  totalMembers={totalMembers}
                  membersLoading={membersLoading}
                />
          </div>

              {/* Co-Host Events */}
              <CoHostEventsSection
                activeCoHostEvents={activeCoHostEvents}
                clubId={clubId}
                coHostEventsLoading={coHostEventsLoading}
              />
            </>
          )}

          {/* Analytics Tab Content */}
          {activeTab === "analytics" && (
            <div className="space-y-4 sm:space-y-6">
              {/* First Row: Member Distribution & Application Status */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                <MemberRoleChart
                  leaderCount={leaderCount}
                  viceLeaderCount={viceLeaderCount}
                  regularMembers={regularMembers}
                  staffMembers={staffMembers}
                  totalMembers={totalMembers}
                  membersLoading={membersLoading}
                />
                <ApplicationStatusChart
                  approvedApplicationsCount={approvedApplicationsCount}
                  pendingApplicationsCount={pendingApplicationsCount}
                  rejectedApplicationsCount={rejectedApplicationsCount}
                  totalApplications={totalApplications}
                  applicationsLoading={applicationsLoading}
                />
              </div>

              {/* Second Row: Events & Members by Major */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                <EventsOverviewChart
                  rawEvents={rawEvents}
                  pendingCoClubEvents={pendingCoClubEvents}
                  pendingUniStaffEvents={pendingUniStaffEvents}
                  approvedEvents={approvedEvents}
                  ongoingEvents={ongoingEvents}
                  completedEvents={completedEvents}
                  rejectedEvents={rejectedEvents}
                  cancelledEvents={cancelledEvents}
                  eventsLoading={eventsLoading}
                />
                <MajorDistributionChart
                  membersByMajor={membersByMajor}
                  membersLoading={membersLoading}
                />
              </div>

              {/* Third Row: Products, Orders, Wallet Charts */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
                <ProductStatusChart
                  activeProducts={activeProducts}
                  inactiveProducts={inactiveProducts}
                  totalProducts={totalProducts}
                  additionalDataLoading={additionalDataLoading}
                />
                <OrderStatusChart
                  completedOrders={completedOrders}
                  pendingOrders={pendingOrders}
                  cancelledOrders={cancelledOrders}
                  totalOrders={totalOrders}
                  additionalDataLoading={additionalDataLoading}
                />
                <WalletOverviewChart
                  walletBalance={walletBalance}
                  totalPointsGiven={totalPointsGiven}
                  totalPointsRedeemed={totalPointsRedeemed}
                  additionalDataLoading={additionalDataLoading}
                />
              </div>

              {/* Fourth Row: Key Metrics Summary */}
              <KeyMetricsSummary
                totalMembers={totalMembers}
                recentlyJoined={recentlyJoined}
                approvedApplicationsCount={approvedApplicationsCount}
                totalApplications={totalApplications}
                activeApprovedEvents={activeEvents}
                totalApprovedEvents={totalApprovedEvents}
                pendingApplicationsCount={pendingApplicationsCount}
              />
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
