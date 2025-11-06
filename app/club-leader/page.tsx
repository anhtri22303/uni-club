"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Users, Calendar, UserCheck, Clock, TrendingUp, Gift, ShoppingCart, Wallet, BarChart2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useProfile, useClub, useClubMembers, useMemberApplicationsByClub, useEventsByClubId, useEventCoHostByClubId } from "@/hooks/use-query-hooks"
import { getClubIdFromToken } from "@/service/clubApi"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiMembership } from "@/service/membershipApi"
import { BarChart3 } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts"
import { timeObjectToString } from "@/service/eventApi"
import { getProducts } from "@/service/productApi"
import { getClubRedeemOrders } from "@/service/redeemApi"
import { getClubWallet, getClubToMemberTransactions } from "@/service/walletApi"
import { fetchClubAttendanceHistory } from "@/service/attendanceApi"


// Define a type for the club based on the Swagger definition
interface Club {
  id: number;
  name: string;
  description: string;
  majorPolicyName: string;
  majorName: string;
  leaderId: number;
  leaderName: string;
}

// Define a type for the API response
interface ClubApiResponse {
  success: boolean;
  message: string;
  data: Club;
}

export default function ClubLeaderDashboardPage() {
  const { auth } = useAuth()
  const { clubMemberships, membershipApplications } = useData()
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

  // ✅ NEW: Fetch additional data (products, orders, wallet, attendance)
  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (!clubId) return
      
      setAdditionalDataLoading(true)
      try {
        // Fetch all data in parallel
        const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format
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
        // Ensure attendanceHistory is always an array
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

  // ✅ USE REACT QUERY for profile, club, members, applications, and events
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: managedClub, isLoading: clubLoading } = useClub(clubId || 0, !!clubId)
  const { data: apiMembers = [], isLoading: membersLoading } = useClubMembers(clubId || 0, !!clubId)
  const { data: applications = [], isLoading: applicationsLoading } = useMemberApplicationsByClub(
    clubId || 0,
    !!clubId
  )
  const { data: rawEvents = [], isLoading: eventsLoading } = useEventsByClubId(clubId || 0, !!clubId)
  const { data: rawCoHostEvents = [], isLoading: coHostEventsLoading } = useEventCoHostByClubId(clubId || 0, !!clubId)

  // ✅ NEW: State for additional data (products, orders, wallet, attendance)
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [walletData, setWalletData] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])
  const [additionalDataLoading, setAdditionalDataLoading] = useState(false)

  const loading = profileLoading || clubLoading

  // Type assertion for profile to fix TypeScript error
  const typedProfile = profile as any

  // Transform API members data (similar to members page)
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

  // ✅ COMPREHENSIVE MEMBER STATISTICS
  const totalMembers = allClubMembers.length
  const leaderCount = allClubMembers.filter((m) => m.role === "LEADER").length
  const viceLeaderCount = allClubMembers.filter((m) => m.role === "VICE_LEADER").length
  const regularMembers = allClubMembers.filter((m) => m.role === "MEMBER").length
  const staffMembers = allClubMembers.filter((m) => m.isStaff).length
  const nonStaffMembers = totalMembers - staffMembers

  // Members by major
  const membersByMajor = allClubMembers.reduce((acc: Record<string, number>, member) => {
    const major = member.majorName
    if (major && major !== "N/A") {
      acc[major] = (acc[major] || 0) + 1
    }
    return acc
  }, {})

  // Get members joined in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentlyJoined = allClubMembers.filter(
    (m) => m.joinedDate && new Date(m.joinedDate) >= thirtyDaysAgo
  ).length

  // ✅ APPLICATION STATISTICS from API
  const totalApplications = applications.length
  const pendingApplicationsCount = applications.filter((a: any) => a.status === "PENDING").length
  const approvedApplicationsCount = applications.filter((a: any) => a.status === "APPROVED").length
  const rejectedApplicationsCount = applications.filter((a: any) => a.status === "REJECTED").length

  // ✅ NEW: PRODUCT/GIFT STATISTICS
  const totalProducts = products.length
  const activeProducts = products.filter((p: any) => p.status === "ACTIVE").length
  const inactiveProducts = products.filter((p: any) => p.status === "INACTIVE").length
  const totalStock = products.reduce((sum: number, p: any) => sum + (p.stockQuantity || 0), 0)
  const totalProductValue = products.reduce((sum: number, p: any) => sum + ((p.pointPrice || 0) * (p.stockQuantity || 0)), 0)

  // ✅ NEW: ORDER STATISTICS
  const totalOrders = orders.length
  const completedOrders = orders.filter((o: any) => o.status === "COMPLETED").length
  const pendingOrders = orders.filter((o: any) => o.status === "PENDING").length
  const cancelledOrders = orders.filter((o: any) => o.status === "CANCELLED").length
  const totalPointsRedeemed = orders
    .filter((o: any) => o.status === "COMPLETED")
    .reduce((sum: number, o: any) => sum + (o.totalPoints || 0), 0)

  // ✅ NEW: WALLET STATISTICS
  const walletBalance = walletData?.balancePoints || 0
  const totalTransactions = transactions.length
  const totalPointsGiven = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
  const avgTransaction = totalTransactions > 0 ? Math.round(totalPointsGiven / totalTransactions) : 0

  // ✅ NEW: ATTENDANCE STATISTICS
  const totalAttendanceRecords = attendanceHistory.length
  const uniqueAttendees = new Set(attendanceHistory.map((a: any) => a.userId)).size

  // ✅ EVENT STATISTICS from API
  // Helper function to check if event has expired (past endTime)
  const isEventExpired = (event: any) => {
    if (!event.date || !event.endTime) return false

    try {
      const now = new Date()
      const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))

      const [year, month, day] = event.date.split('-').map(Number)
      
      // Convert endTime to string if it's an object
      const endTimeStr = timeObjectToString(event.endTime)
      const [hours, minutes] = endTimeStr.split(':').map(Number)

      const eventEndDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)

      return vnTime > eventEndDateTime
    } catch (error) {
      console.error('Error checking event expiration:', error)
      return false
    }
  }

  // Helper function to check if event is active (APPROVED and not expired)
  const isEventActive = (event: any) => {
    if (event.status !== "APPROVED") return false
    if (isEventExpired(event)) return false
    if (!event.date || !event.endTime) return false
    return true
  }

  // Calculate event statistics
  const totalApprovedEvents = rawEvents.filter((e: any) => e.status === "APPROVED").length
  const activeApprovedEvents = rawEvents.filter((e: any) => isEventActive(e)).length
  
  // Recent applications from API (sorted by creation date)
  const recentApplications = applications
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5)

  // ✅ CO-HOST EVENTS FILTERING
  // Filter co-host events that are active and have PENDING or APPROVED coHostStatus
  const activeCoHostEvents = rawCoHostEvents.filter((event: any) => {
    // Check if event is not expired
    if (isEventExpired(event)) return false
    
    // Find my club's coHostStatus from coHostedClubs array
    const myCoHostStatus = event.coHostedClubs?.find((club: any) => club.id === clubId)?.coHostStatus
    
    // Show only PENDING or APPROVED co-host invitations
    return myCoHostStatus === "PENDING" || myCoHostStatus === "APPROVED"
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
          <Card className="border-l-4 border-l-primary shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                Club Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clubLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !managedClub ? (
                <div className="text-center py-8">
                  <p className="text-destructive font-medium">Could not load club information</p>
                  <p className="text-sm text-muted-foreground mt-2">Please check your permissions or contact support</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Club Name - Featured */}
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Club Name</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary">{managedClub.name}</p>
                  </div>

                  {/* Grid for Major and Policy */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Major</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900">
                          {managedClub.majorName}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Policy</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900">
                          {managedClub.majorPolicyName}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Description</p>
                    <p className="text-sm leading-relaxed text-foreground">
                      {managedClub.description || "No description available"}
                    </p>
                  </div>

                  {/* Club Leader Info */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Club Leader:</span>
                    <span className="text-sm font-medium truncate">{managedClub.leaderName}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
          {/* ✅ 3 BIG HORIZONTAL STATS FRAMES */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-4 border-primary/30 bg-primary/5 hover:border-primary/50 transition-all shadow-lg hover:shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
                      {membersLoading ? "..." : totalMembers}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base font-medium mt-1">Total Members</CardDescription>
                  </div>
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Leaders:</span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {leaderCount + viceLeaderCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Regular Members:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {regularMembers}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Staff Members:</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {staffMembers}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Recently Joined (30d):</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      +{recentlyJoined}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-green-500/30 bg-green-500/5 hover:border-green-500/50 transition-all shadow-lg hover:shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                      {applicationsLoading ? "..." : totalApplications}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base font-medium mt-1">Applications</CardDescription>
                  </div>
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Approved:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {approvedApplicationsCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending Review:</span>
                    <Badge variant={pendingApplicationsCount > 0 ? "default" : "outline"} className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {pendingApplicationsCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rejected:</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {rejectedApplicationsCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground font-medium">Approval Rate:</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {totalApplications > 0 ? Math.round((approvedApplicationsCount / totalApplications) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 transition-all shadow-lg hover:shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-blue-600">
                      {eventsLoading ? "..." : rawEvents.length}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base font-medium mt-1">Events Created</CardDescription>
                  </div>
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Approved:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {totalApprovedEvents}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Events:</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {activeApprovedEvents}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending Approval:</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {rawEvents.filter((e: any) => e.status === "PENDING_UNISTAFF" || e.status === "PENDING_COCLUB").length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground font-medium">Approval Rate:</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {rawEvents.length > 0 ? Math.round((totalApprovedEvents / rawEvents.length) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ✅ NEW: 3 MORE LARGE HORIZONTAL STATS FRAMES */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-4 border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50 transition-all shadow-lg hover:shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-purple-600">
                      {additionalDataLoading ? "..." : totalProducts}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base font-medium mt-1">Products/Gifts</CardDescription>
                  </div>
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Products:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {activeProducts}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Inactive Products:</span>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {inactiveProducts}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Stock:</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {totalStock.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground font-medium">Total Value:</span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {totalProductValue.toLocaleString()} pts
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50 transition-all shadow-lg hover:shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-orange-600">
                      {additionalDataLoading ? "..." : totalOrders}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base font-medium mt-1">Redeem Orders</CardDescription>
                  </div>
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {completedOrders}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending:</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {pendingOrders}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cancelled:</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {cancelledOrders}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground font-medium">Points Redeemed:</span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {totalPointsRedeemed.toLocaleString()} pts
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50 transition-all shadow-lg hover:shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-cyan-600">
                      {additionalDataLoading ? "..." : walletBalance.toLocaleString()}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base font-medium mt-1">Wallet Balance (pts)</CardDescription>
                  </div>
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Transactions:</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {totalTransactions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Points Given:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {totalPointsGiven.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg Transaction:</span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {avgTransaction.toLocaleString()} pts
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground font-medium">Attendance Records:</span>
                    <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                      {totalAttendanceRecords}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Recent Applications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                  Recent Applications
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Latest membership requests</CardDescription>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentApplications.length === 0 ? (
                      <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">No recent applications</p>
                    ) : (
                      recentApplications.map((application: any) => {
                        return (
                          <div key={application.applicationId} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm sm:text-base font-medium truncate">{application.applicantName}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{application.applicantEmail}</p>
                              <p className="text-xs text-muted-foreground">
                                {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "Recently"}
                              </p>
                            </div>
                            <Badge
                              variant={
                                application.status === "APPROVED" ? "default" : application.status === "PENDING" ? "secondary" : "destructive"
                              }
                              className="text-xs shrink-0"
                            >
                              {application.status}
                            </Badge>
                          </div>
                        )
                      })
                    )}
                    <Button variant="outline" className="w-full mt-3 bg-transparent text-xs sm:text-sm" onClick={() => router.push("/club-leader/applications")}>Manage All Applications</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Members by Major */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  Members by Major
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Distribution across majors</CardDescription>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : Object.keys(membersByMajor).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">No major data available</p>
                ) : (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto">
                    {Object.entries(membersByMajor)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 10)
                      .map(([major, count]) => (
                        <div key={major} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex-1">
                            <p className="font-medium text-sm truncate">{major}</p>
                            <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                                style={{ width: `${((count as number) / totalMembers) * 100}%` }}
                              />
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-3 min-w-[3rem] justify-center">
                            {count as number}
                          </Badge>
                        </div>
                      ))}
                    {Object.keys(membersByMajor).length > 10 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        Showing top 10 of {Object.keys(membersByMajor).length} majors
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Co-Host Events Section */}
          <Card className="border-l-4 border-l-orange-500 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    Co-Host Event Invitations
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Active events where your club is invited as co-host
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                  {activeCoHostEvents.length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {coHostEventsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : activeCoHostEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No active co-host invitations</p>
                  <p className="text-xs text-muted-foreground mt-1">You'll see events here when other clubs invite you to co-host</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCoHostEvents.map((event: any) => {
                    const myCoHostStatus = event.coHostedClubs?.find((club: any) => club.id === clubId)?.coHostStatus
                    const eventDate = event.date ? new Date(event.date).toLocaleDateString() : "N/A"
                    const startTimeStr = timeObjectToString(event.startTime)
                    const endTimeStr = timeObjectToString(event.endTime)
                    
                    return (
                      <div
                        key={event.id}
                        className={`p-4 border-2 rounded-lg hover:shadow-md transition-all cursor-pointer ${
                          myCoHostStatus === "PENDING" 
                            ? "border-yellow-300 bg-yellow-50 hover:border-yellow-400" 
                            : "border-green-300 bg-green-50 hover:border-green-400"
                        }`}
                        onClick={() => router.push(`/club-leader/events/${event.id}`)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-base truncate">{event.name}</h3>
                              <Badge 
                                variant="outline" 
                                className={
                                  myCoHostStatus === "PENDING" 
                                    ? "border-yellow-500 text-yellow-700 bg-yellow-100" 
                                    : "border-green-500 text-green-700 bg-green-100"
                                }
                              >
                                {myCoHostStatus}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {event.description}
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span className="truncate">Host: {event.hostClub?.name}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{eventDate}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{startTimeStr} - {endTimeStr}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {event.locationName}
                                </Badge>
                              </div>
                            </div>
                            
                            {event.coHostedClubs && event.coHostedClubs.length > 1 && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                  Co-hosts: {event.coHostedClubs.map((c: any) => c.name).join(", ")}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={event.status === "APPROVED" ? "default" : "secondary"}>
                              {event.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground text-right">
                              <div>{event.currentCheckInCount}/{event.maxCheckInCount}</div>
                              <div>Check-ins</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {activeCoHostEvents.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-3" 
                      onClick={() => router.push("/club-leader/events")}
                    >
                      View All Events
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
            </>
          )}

          {/* Analytics Tab Content */}
          {activeTab === "analytics" && (
            <div className="space-y-4 sm:space-y-6">
              {/* First Row: Member Distribution & Application Status */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Members by Role - Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Users className="h-5 w-5 text-primary" />
                      Member Distribution by Role
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Role breakdown of {totalMembers} total members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {membersLoading ? (
                      <Skeleton className="h-[250px] sm:h-[300px] w-full" />
                    ) : totalMembers === 0 ? (
                      <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">No member data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Leaders", value: leaderCount + viceLeaderCount, color: "#8b5cf6" },
                              { name: "Members", value: regularMembers, color: "#22c55e" },
                              { name: "Staff", value: staffMembers, color: "#3b82f6" },
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => {
                              const isMobile = window.innerWidth < 640
                              return isMobile ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(0)}%`
                            }}
                            outerRadius={window.innerWidth < 640 ? 60 : 80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: "Leaders", value: leaderCount + viceLeaderCount, color: "#8b5cf6" },
                              { name: "Members", value: regularMembers, color: "#22c55e" },
                              { name: "Staff", value: staffMembers, color: "#3b82f6" },
                            ].filter(item => item.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Applications Status - Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      Application Status Distribution
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{totalApplications} total applications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {applicationsLoading ? (
                      <Skeleton className="h-[250px] sm:h-[300px] w-full" />
                    ) : totalApplications === 0 ? (
                      <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">No application data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Approved", value: approvedApplicationsCount, color: "#22c55e" },
                              { name: "Pending", value: pendingApplicationsCount, color: "#eab308" },
                              { name: "Rejected", value: rejectedApplicationsCount, color: "#ef4444" },
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => {
                              const isMobile = window.innerWidth < 640
                              return isMobile ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(0)}%`
                            }}
                            outerRadius={window.innerWidth < 640 ? 60 : 80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: "Approved", value: approvedApplicationsCount, color: "#22c55e" },
                              { name: "Pending", value: pendingApplicationsCount, color: "#eab308" },
                              { name: "Rejected", value: rejectedApplicationsCount, color: "#ef4444" },
                            ].filter(item => item.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Second Row: Events & Members by Major */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Events Status - Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Events Overview
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{rawEvents.length} total events created</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {eventsLoading ? (
                      <Skeleton className="h-[250px] sm:h-[300px] w-full" />
                    ) : rawEvents.length === 0 ? (
                      <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">No event data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
                        <BarChart
                          data={[
                            {
                              name: "Approved",
                              count: totalApprovedEvents,
                              fill: "#22c55e"
                            },
                            {
                              name: "Active",
                              count: activeApprovedEvents,
                              fill: "#3b82f6"
                            },
                            {
                              name: "Pending",
                              count: rawEvents.filter((e: any) => e.status === "PENDING_UNISTAFF" || e.status === "PENDING_COCLUB").length,
                              fill: "#eab308"
                            },
                            {
                              name: "Rejected",
                              count: rawEvents.filter((e: any) => e.status === "REJECTED").length,
                              fill: "#ef4444"
                            },
                          ]}
                          margin={{ 
                            top: 20, 
                            right: window.innerWidth < 640 ? 10 : 30, 
                            left: window.innerWidth < 640 ? 0 : 20, 
                            bottom: 5 
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: window.innerWidth < 640 ? 11 : 14 }}
                          />
                          <YAxis tick={{ fontSize: window.innerWidth < 640 ? 11 : 14 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" radius={[8, 8, 0, 0]}>
                            {[
                              { fill: "#22c55e" },
                              { fill: "#3b82f6" },
                              { fill: "#eab308" },
                              { fill: "#ef4444" },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Members by Major - Bar Chart */}
          <Card>
            <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Users className="h-5 w-5 text-primary" />
                      Top Majors by Member Count
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                      Top {window.innerWidth < 640 ? '5' : '8'} majors with most members
                    </CardDescription>
            </CardHeader>
            <CardContent>
                    {membersLoading ? (
                      <Skeleton className="h-[250px] sm:h-[300px] w-full" />
                    ) : Object.keys(membersByMajor).length === 0 ? (
                      <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">No major data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
                        <BarChart
                          data={Object.entries(membersByMajor)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, window.innerWidth < 640 ? 5 : 8)
                            .map(([major, count]) => {
                              const maxLength = window.innerWidth < 640 ? 12 : 20
                              return {
                                major: major.length > maxLength ? major.substring(0, maxLength) + "..." : major,
                                count: count,
                              }
                            })}
                          layout="horizontal"
                          margin={{ 
                            top: 5, 
                            right: window.innerWidth < 640 ? 10 : 30, 
                            left: window.innerWidth < 640 ? 0 : 20, 
                            bottom: window.innerWidth < 640 ? 70 : 60 
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="major" 
                            angle={-45} 
                            textAnchor="end" 
                            height={window.innerWidth < 640 ? 70 : 80}
                            tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                          />
                          <YAxis tick={{ fontSize: window.innerWidth < 640 ? 11 : 14 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Third Row: Products, Orders, Wallet Charts */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Products Chart - Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Gift className="h-5 w-5 text-purple-600" />
                      Products Status
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{totalProducts} total products</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {additionalDataLoading ? (
                      <Skeleton className="h-[250px] sm:h-[300px] w-full" />
                    ) : totalProducts === 0 ? (
                      <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">No product data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Active", value: activeProducts, color: "#22c55e" },
                              { name: "Inactive", value: inactiveProducts, color: "#94a3b8" },
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => {
                              const isMobile = window.innerWidth < 640
                              return isMobile ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(0)}%`
                            }}
                            outerRadius={window.innerWidth < 640 ? 60 : 80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: "Active", value: activeProducts, color: "#22c55e" },
                              { name: "Inactive", value: inactiveProducts, color: "#94a3b8" },
                            ].filter(item => item.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Orders Chart - Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <ShoppingCart className="h-5 w-5 text-orange-600" />
                      Order Status
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{totalOrders} total orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {additionalDataLoading ? (
                      <Skeleton className="h-[250px] sm:h-[300px] w-full" />
                    ) : totalOrders === 0 ? (
                      <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">No order data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Completed", value: completedOrders, color: "#22c55e" },
                              { name: "Pending", value: pendingOrders, color: "#eab308" },
                              { name: "Cancelled", value: cancelledOrders, color: "#ef4444" },
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => {
                              const isMobile = window.innerWidth < 640
                              return isMobile ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(0)}%`
                            }}
                            outerRadius={window.innerWidth < 640 ? 60 : 80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: "Completed", value: completedOrders, color: "#22c55e" },
                              { name: "Pending", value: pendingOrders, color: "#eab308" },
                              { name: "Cancelled", value: cancelledOrders, color: "#ef4444" },
                            ].filter(item => item.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Wallet Transactions - Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Wallet className="h-5 w-5 text-cyan-600" />
                      Wallet Overview
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Points distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {additionalDataLoading ? (
                      <Skeleton className="h-[250px] sm:h-[300px] w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
                        <BarChart
                          data={[
                            {
                              name: "Balance",
                              points: walletBalance,
                              fill: "#06b6d4"
                            },
                            {
                              name: "Given",
                              points: totalPointsGiven,
                              fill: "#22c55e"
                            },
                            {
                              name: "Redeemed",
                              points: totalPointsRedeemed,
                              fill: "#f97316"
                            },
                          ]}
                          margin={{ 
                            top: 20, 
                            right: window.innerWidth < 640 ? 10 : 30, 
                            left: window.innerWidth < 640 ? 0 : 20, 
                            bottom: 5 
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: window.innerWidth < 640 ? 11 : 14 }}
                          />
                          <YAxis tick={{ fontSize: window.innerWidth < 640 ? 11 : 14 }} />
                          <Tooltip />
                          <Bar dataKey="points" fill="#8884d8" radius={[8, 8, 0, 0]}>
                            {[
                              { fill: "#06b6d4" },
                              { fill: "#22c55e" },
                              { fill: "#f97316" },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Fourth Row: Key Metrics Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Key Metrics Summary
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Performance indicators at a glance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-700 dark:text-purple-300">{totalMembers}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">Total Members</p>
                      <Badge variant="outline" className="mt-2 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs truncate max-w-full">
                        +{recentlyJoined} this month
                      </Badge>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700 dark:text-green-300">
                        {totalApplications > 0 ? Math.round((approvedApplicationsCount / totalApplications) * 100) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">Approval Rate</p>
                      <p className="text-xs text-muted-foreground mt-2 truncate">{approvedApplicationsCount}/{totalApplications} approved</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">{activeApprovedEvents}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">Active Events</p>
                      <p className="text-xs text-muted-foreground mt-2 truncate">Out of {totalApprovedEvents} approved</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-700 dark:text-yellow-300">{pendingApplicationsCount}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">Pending Review</p>
                      <p className="text-xs text-muted-foreground mt-2 truncate">Applications waiting</p>
                    </div>
              </div>
            </CardContent>
          </Card>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
