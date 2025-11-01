"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Gift, TrendingUp, CheckCircle, Clock, Users as UsersIcon, UserCheck, UserX, Shield, Building2, UserPlus, UsersRound, Calendar, MapPin, Eye, ChevronLeft, ChevronRight, BarChart3, PieChart as PieChartIcon } from "lucide-react"
import { useEvents } from "@/hooks/use-query-hooks"
import { getClubStats } from "@/service/clubApi"
import { getUserStats } from "@/service/userApi"
import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function PartnerDashboard() {
  const router = useRouter()
  const [userStats, setUserStats] = useState<any>(null)
  const [clubStats, setClubStats] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [approvalFilter, setApprovalFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5
  
  // Tab states for each section
  const [userStatsTab, setUserStatsTab] = useState<string>("table")
  const [clubStatsTab, setClubStatsTab] = useState<string>("table")
  const [eventStatsTab, setEventStatsTab] = useState<string>("table")

  // ✅ USE REACT QUERY for events
  const { data: events = [], isLoading: eventsLoading } = useEvents()

  // Fetch club stats and user stats when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch club stats
        const clubStatsData = await getClubStats()
        setClubStats(clubStatsData)

        // Fetch user stats
        const statsData = await getUserStats()
        setUserStats(statsData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    loadData()
  }, [])

  const totalClubs = clubStats?.totalClubs || 0
  const totalMembers = clubStats?.totalMembers || 0
  const activeMembers = clubStats?.activeMembers || 0
  const totalEvents = events.length
  const totalUsers = userStats?.total || 0
  const activeUsers = userStats?.active || 0
  const inactiveUsers = userStats?.inactive || 0

  // Helper to get event status based on date and time
  const getEventStatus = (eventDate: string, eventTime: string) => {
    if (!eventDate) return "Finished"
    const now = new Date()
    const [hour = "00", minute = "00"] = (eventTime || "00:00").split(":")
    const event = new Date(eventDate)
    event.setHours(Number(hour), Number(minute), 0, 0)

    const EVENT_DURATION_MS = 2 * 60 * 60 * 1000
    const start = event.getTime()
    const end = start + EVENT_DURATION_MS

    if (now.getTime() < start) {
      if (start - now.getTime() < 7 * 24 * 60 * 60 * 1000) return "Soon"
      return "Future"
    }
    if (now.getTime() >= start && now.getTime() <= end) return "Now"
    return "Finished"
  }

  // Event statistics
  const eventStats = useMemo(() => {
    const approved = events.filter((e: any) => e.status === "APPROVED").length
    const waitingUniStaff = events.filter((e: any) => e.status === "PENDING_UNISTAFF").length
    const waitingCoClub = events.filter((e: any) => e.status === "PENDING_COCLUB").length
    const pending = waitingUniStaff + waitingCoClub // Total pending (both types)
    const rejected = events.filter((e: any) => e.status === "REJECTED").length
    const now = events.filter((e: any) => getEventStatus(e.date, e.time) === "Now").length
    const soon = events.filter((e: any) => getEventStatus(e.date, e.time) === "Soon").length
    const finished = events.filter((e: any) => getEventStatus(e.date, e.time) === "Finished").length
    
    return { approved, pending, waitingUniStaff, waitingCoClub, rejected, now, soon, finished }
  }, [events])

  // Filtered events based on status and approval
  const filteredEvents = useMemo(() => {
    return events.filter((event: any) => {
      const status = getEventStatus(event.date, event.time)
      const matchesStatus = statusFilter === "all" || status.toLowerCase() === statusFilter.toLowerCase()
      const matchesApproval = approvalFilter === "all" || event.status === approvalFilter
      return matchesStatus && matchesApproval
    })
  }, [events, statusFilter, approvalFilter])

  // Sort events by date (newest first)
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a: any, b: any) => {
      const dateA = new Date(a.date || '1970-01-01').getTime()
      const dateB = new Date(b.date || '1970-01-01').getTime()
      return dateB - dateA
    })
  }, [filteredEvents])

  // Calculate pagination
  const totalPages = Math.ceil(sortedEvents.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedEvents = sortedEvents.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, approvalFilter])

  // Chart data preparations
  const COLORS = {
    active: '#22c55e',
    inactive: '#94a3b8',
    pending: '#eab308',
    approved: '#22c55e',
    rejected: '#ef4444',
  }

  // User stats chart data
  const userChartData = useMemo(() => {
    if (!userStats) return []
    return [
      { name: 'Active', value: activeUsers, color: COLORS.active },
      { name: 'Inactive', value: inactiveUsers, color: COLORS.inactive },
    ]
  }, [userStats, activeUsers, inactiveUsers])

  const userRoleChartData = useMemo(() => {
    if (!userStats?.byRole) return []
    return Object.entries(userStats.byRole).map(([role, count]: [string, any]) => ({
      name: role,
      value: count,
    }))
  }, [userStats])

  // Club stats chart data
  const clubChartData = useMemo(() => {
    return [
      { name: 'Total Clubs', value: totalClubs, color: '#6366f1' },
      { name: 'Total Members', value: totalMembers, color: '#06b6d4' },
      { name: 'Active Members', value: activeMembers, color: '#10b981' },
    ]
  }, [totalClubs, totalMembers, activeMembers])

  // Event stats chart data
  const eventChartData = useMemo(() => {
    return [
      { name: 'Approved', value: eventStats.approved, color: COLORS.approved },
      { name: 'Pending', value: eventStats.pending, color: COLORS.pending },
      { name: 'Rejected', value: eventStats.rejected, color: COLORS.rejected },
    ]
  }, [eventStats])

  const eventStatusChartData = useMemo(() => {
    return [
      { name: 'Now', value: eventStats.now, color: '#ef4444' },
      { name: 'Soon', value: eventStats.soon, color: '#3b82f6' },
      { name: 'Finished', value: eventStats.finished, color: '#94a3b8' },
    ]
  }, [eventStats])

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Admin Dashboard</h1>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Clubs"
              value={totalClubs}
              description="Active clubs"
              icon={Gift}
              variant="primary"
              onClick={() => router.push("/admin/clubs")}
            />
            <StatsCard
              title="Total Events"
              value={totalEvents}
              description="All events"
              icon={TrendingUp}
              trend={{ value: 12, label: "from last month" }}
              variant="success"
              onClick={() => router.push("/admin/events")}
            />
            <StatsCard
              title="Total Users"
              value={totalUsers}
              description="Registered users"
              icon={CheckCircle}
              variant="info"
              onClick={() => router.push("/admin/users")}
            />
            <StatsCard
              title="Total Members"
              value={totalMembers}
              description="Club members"
              icon={UsersIcon}
              variant="warning"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* User Statistics Overview */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>User Statistics Overview</CardTitle>
                <CardDescription>Comprehensive user analytics and breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={userStatsTab} onValueChange={setUserStatsTab}>
                  <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                    <TabsTrigger value="table" className="gap-2 text-sm font-semibold py-2.5">
                      <BarChart3 className="h-4 w-4" />
                      Table View
                    </TabsTrigger>
                    <TabsTrigger value="chart" className="gap-2 text-sm font-semibold py-2.5">
                      <PieChartIcon className="h-4 w-4" />
                      Chart View
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="table" className="mt-0">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      {/* Total Users */}
                      <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                        <UsersIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-3" />
                        <div className="text-4xl font-bold text-blue-700 dark:text-blue-300">{totalUsers}</div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">Total Users</div>
                      </div>

                      {/* Active Users */}
                      <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                        <UserCheck className="h-12 w-12 text-green-600 dark:text-green-400 mb-3" />
                        <div className="text-4xl font-bold text-green-700 dark:text-green-300">{activeUsers}</div>
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">Active Users</div>
                      </div>

                      {/* Inactive Users */}
                      <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
                        <UserX className="h-12 w-12 text-gray-600 dark:text-gray-400 mb-3" />
                        <div className="text-4xl font-bold text-gray-700 dark:text-gray-300">{inactiveUsers}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">Inactive Users</div>
                      </div>

                      {/* By Role Breakdown */}
                      <div className="flex flex-col justify-center p-6 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                        <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-3 mx-auto" />
                        <div className="text-sm font-semibold text-purple-700 dark:text-purple-300 text-center mb-2">By Role</div>
                        <div className="space-y-1 text-xs">
                          {userStats?.byRole && Object.entries(userStats.byRole).map(([role, count]: [string, any]) => (
                            <div key={role} className="flex justify-between items-center">
                              <span className="text-purple-600 dark:text-purple-400 font-medium">{role}:</span>
                              <span className="text-purple-700 dark:text-purple-300 font-bold">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Breakdown Table */}
                    <div className="mt-6 border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Metric</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">Value</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm font-medium">Total Users</td>
                            <td className="px-4 py-3 text-sm text-right font-bold">{totalUsers}</td>
                            <td className="px-4 py-3 text-sm text-right text-muted-foreground">100%</td>
                          </tr>
                          <tr className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm">Active Users</td>
                            <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400 font-semibold">{activeUsers}</td>
                            <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                              {totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                          <tr className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm">Inactive Users</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400 font-semibold">{inactiveUsers}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                              {totalUsers > 0 ? ((inactiveUsers / totalUsers) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                          {userStats?.byRole && Object.entries(userStats.byRole).map(([role, count]: [string, any]) => (
                            <tr key={role} className="hover:bg-muted/50">
                              <td className="px-4 py-3 text-sm pl-8">↳ {role}</td>
                              <td className="px-4 py-3 text-sm text-right text-purple-600 dark:text-purple-400 font-semibold">{count}</td>
                              <td className="px-4 py-3 text-sm text-right text-purple-600 dark:text-purple-400">
                                {totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(1) : 0}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  <TabsContent value="chart" className="mt-0">
                    {/* User Status Donut Chart */}
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <div className="p-1.5 bg-blue-500 rounded-lg">
                            <UsersIcon className="h-5 w-5 text-white" />
                          </div>
                          User Status Distribution
                        </CardTitle>
                        <CardDescription>Active vs Inactive users</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col lg:flex-row items-center gap-8">
                          {/* Donut Chart */}
                          <div className="relative w-48 h-48 flex-shrink-0">
                            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                              {totalUsers > 0 ? (
                                <>
                                  {/* Active Arc */}
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="20"
                                    strokeDasharray={`${(activeUsers / totalUsers) * 251.2} 251.2`}
                                    className="transition-all duration-500"
                                  />
                                  {/* Inactive Arc */}
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#94a3b8"
                                    strokeWidth="20"
                                    strokeDasharray={`${(inactiveUsers / totalUsers) * 251.2} 251.2`}
                                    strokeDashoffset={`-${(activeUsers / totalUsers) * 251.2}`}
                                    className="transition-all duration-500"
                                  />
                                </>
                              ) : (
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                              )}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-3xl font-bold">{totalUsers}</div>
                              <div className="text-xs text-muted-foreground">Total</div>
                            </div>
                          </div>
                          
                          {/* Legend */}
                          <div className="flex-1 space-y-3 w-full">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-green-500" />
                                <span className="font-medium">Active</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-green-600">{activeUsers}</span>
                                <span className="text-sm text-green-600">
                                  ({totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%)
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-900">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-gray-400" />
                                <span className="font-medium">Inactive</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-gray-600">{inactiveUsers}</span>
                                <span className="text-sm text-gray-600">
                                  ({totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Club Statistics Overview */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Club Statistics Overview</CardTitle>
                <CardDescription>Comprehensive club and membership analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={clubStatsTab} onValueChange={setClubStatsTab}>
                  <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                    <TabsTrigger value="table" className="gap-2 text-sm font-semibold py-2.5">
                      <BarChart3 className="h-4 w-4" />
                      Table View
                    </TabsTrigger>
                    <TabsTrigger value="chart" className="gap-2 text-sm font-semibold py-2.5">
                      <PieChartIcon className="h-4 w-4" />
                      Chart View
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="table" className="mt-0">
                    <div className="grid gap-6 md:grid-cols-3">
                      {/* Total Clubs */}
                      <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
                        <Building2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mb-3" />
                        <div className="text-4xl font-bold text-indigo-700 dark:text-indigo-300">{totalClubs}</div>
                        <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">Total Clubs</div>
                      </div>

                      {/* Total Members */}
                      <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900">
                        <UsersRound className="h-12 w-12 text-cyan-600 dark:text-cyan-400 mb-3" />
                        <div className="text-4xl font-bold text-cyan-700 dark:text-cyan-300">{totalMembers}</div>
                        <div className="text-sm text-cyan-600 dark:text-cyan-400 font-medium mt-1">Total Members</div>
                      </div>

                      {/* Active Members */}
                      <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
                        <UserPlus className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mb-3" />
                        <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">{activeMembers}</div>
                        <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">Active Members</div>
                      </div>
                    </div>

                    {/* Detailed Breakdown Table */}
                    <div className="mt-6 border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Metric</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">Value</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm font-medium">Total Clubs</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-indigo-600 dark:text-indigo-400">{totalClubs}</td>
                            <td className="px-4 py-3 text-sm text-right text-muted-foreground">All registered clubs</td>
                          </tr>
                          <tr className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm font-medium">Total Members</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-cyan-600 dark:text-cyan-400">{totalMembers}</td>
                            <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                              {totalClubs > 0 ? (totalMembers / totalClubs).toFixed(1) : 0} avg per club
                            </td>
                          </tr>
                          <tr className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm font-medium">Active Members</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600 dark:text-emerald-400">{activeMembers}</td>
                            <td className="px-4 py-3 text-sm text-right text-emerald-600 dark:text-emerald-400">
                              {totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(1) : 0}% activity rate
                            </td>
                          </tr>
                          <tr className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm font-medium">Inactive Members</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-600 dark:text-gray-400">{totalMembers - activeMembers}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                              {totalMembers > 0 ? (((totalMembers - activeMembers) / totalMembers) * 100).toFixed(1) : 0}% inactive
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Visual Stats */}
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground mb-2">Member Activity Rate</div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                              style={{ width: `${totalMembers > 0 ? Math.min((activeMembers / totalMembers) * 100, 100) : 0}%` }}
                            />
                          </div>
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 min-w-[3rem] text-right">
                            {totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground mb-2">Average Members per Club</div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                            {totalClubs > 0 ? (totalMembers / totalClubs).toFixed(1) : 0}
                          </div>
                          <div className="text-xs text-muted-foreground">members/club</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="chart" className="mt-0">
                    {/* Club & Membership Bar Chart */}
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <div className="p-1.5 bg-indigo-500 rounded-lg">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          Club & Membership Metrics
                        </CardTitle>
                        <CardDescription>Overview of clubs and members</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Total Display */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                              <div className="text-3xl font-bold text-indigo-600">{totalClubs}</div>
                              <div className="text-sm text-muted-foreground mt-1">Total Clubs</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/30 rounded-lg border border-cyan-200 dark:border-cyan-800">
                              <div className="text-3xl font-bold text-cyan-600">{totalMembers}</div>
                              <div className="text-sm text-muted-foreground mt-1">Total Members</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                              <div className="text-3xl font-bold text-emerald-600">{activeMembers}</div>
                              <div className="text-sm text-muted-foreground mt-1">Active Members</div>
                            </div>
                          </div>

                          {/* Simple Bar Chart */}
                          <div className="space-y-4">
                            {/* Total Clubs Bar */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Total Clubs</span>
                                <span className="font-bold text-indigo-600">{totalClubs}</span>
                              </div>
                              <div className="relative h-8 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <div
                                  className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                                  style={{
                                    width: `${Math.max(totalClubs, totalMembers, activeMembers) > 0 ? (totalClubs / Math.max(totalClubs, totalMembers, activeMembers)) * 100 : 0}%`,
                                    backgroundColor: '#6366f1',
                                  }}
                                >
                                  {totalClubs > 0 && (
                                    <span className="text-xs font-bold text-white px-2">{totalClubs}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Total Members Bar */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Total Members</span>
                                <span className="font-bold text-cyan-600">{totalMembers}</span>
                              </div>
                              <div className="relative h-8 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <div
                                  className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                                  style={{
                                    width: `${Math.max(totalClubs, totalMembers, activeMembers) > 0 ? (totalMembers / Math.max(totalClubs, totalMembers, activeMembers)) * 100 : 0}%`,
                                    backgroundColor: '#06b6d4',
                                  }}
                                >
                                  {totalMembers > 0 && (
                                    <span className="text-xs font-bold text-white px-2">{totalMembers}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Active Members Bar */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Active Members</span>
                                <span className="font-bold text-emerald-600">{activeMembers}</span>
                              </div>
                              <div className="relative h-8 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <div
                                  className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                                  style={{
                                    width: `${Math.max(totalClubs, totalMembers, activeMembers) > 0 ? (activeMembers / Math.max(totalClubs, totalMembers, activeMembers)) * 100 : 0}%`,
                                    backgroundColor: '#10b981',
                                  }}
                                >
                                  {activeMembers > 0 && (
                                    <span className="text-xs font-bold text-white px-2">{activeMembers}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Event Statistics Overview */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Event Statistics Overview</CardTitle>
                <CardDescription>All events status and filters</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={eventStatsTab} onValueChange={setEventStatsTab}>
                  <div className="flex items-center justify-between mb-6">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                      <TabsTrigger value="table" className="gap-2 text-sm font-semibold py-2.5">
                        <BarChart3 className="h-4 w-4" />
                        Table View
                      </TabsTrigger>
                      <TabsTrigger value="chart" className="gap-2 text-sm font-semibold py-2.5">
                        <PieChartIcon className="h-4 w-4" />
                        Chart View
                      </TabsTrigger>
                    </TabsList>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/admin/events")}
                    >
                      View All Events
                    </Button>
                  </div>
                  <TabsContent value="table" className="mt-0">
                    {/* Event Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-6">
                  {/* Total Events */}
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                    <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                    <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{totalEvents}</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">Total</div>
                  </div>

                  {/* Approved */}
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                    <div className="text-3xl font-bold text-green-700 dark:text-green-300">{eventStats.approved}</div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">Approved</div>
                  </div>

                  {/* Pending */}
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                    <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-2" />
                    <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{eventStats.pending}</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mt-1">Pending</div>
                  </div>

                  {/* Now */}
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
                    <TrendingUp className="h-8 w-8 text-red-600 dark:text-red-400 mb-2" />
                    <div className="text-3xl font-bold text-red-700 dark:text-red-300">{eventStats.now}</div>
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">Now</div>
                  </div>

                  {/* Soon */}
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{eventStats.soon}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">Soon</div>
                  </div>

                  {/* Finished */}
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
                    <CheckCircle className="h-8 w-8 text-gray-600 dark:text-gray-400 mb-2" />
                    <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{eventStats.finished}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">Finished</div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Status Filter</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="now">Now</SelectItem>
                        <SelectItem value="soon">Soon</SelectItem>
                        <SelectItem value="finished">Finished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Approval Filter</label>
                    <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Approval</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="PENDING_UNISTAFF">Pending Uni-Staff</SelectItem>
                        <SelectItem value="PENDING_COCLUB">Pending Co-Club</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(statusFilter !== "all" || approvalFilter !== "all") && (
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStatusFilter("all")
                          setApprovalFilter("all")
                        }}
                        className="h-9"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                {/* Recent Events List */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold mb-3 flex items-center justify-between">
                    <span>Recent Events ({filteredEvents.length})</span>
                    {filteredEvents.length > ITEMS_PER_PAGE && (
                      <span className="text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages} ({startIndex + 1}-{Math.min(endIndex, sortedEvents.length)} of {filteredEvents.length})
                      </span>
                    )}
                  </div>
                  {eventsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading events...</div>
                  ) : paginatedEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No events found</div>
                  ) : (
                    paginatedEvents.map((event: any) => {
                      const status = getEventStatus(event.date, event.time)
                      return (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/events/${event.id}`)}
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{event.name || event.title}</p>
                              <Badge
                                variant={
                                  status === "Finished"
                                    ? "secondary"
                                    : status === "Soon"
                                    ? "default"
                                    : status === "Now"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {status}
                              </Badge>
                              {event.status === "ONGOING" && (
                                <Badge variant="default" className="text-xs bg-purple-600 text-white">Ongoing</Badge>
                              )}
                              {event.status === "APPROVED" && (
                                <Badge variant="default" className="text-xs bg-green-600">Approved</Badge>
                              )}
                              {event.status === "PENDING_COCLUB" && (
                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-500">Pending Co-Club</Badge>
                              )}
                              {event.status === "PENDING_UNISTAFF" && (
                                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-500">Pending Uni-Staff</Badge>
                              )}
                              {event.status === "REJECTED" && (
                                <Badge variant="destructive" className="text-xs">Rejected</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(event.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                              {event.locationName && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.locationName}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="flex-shrink-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(endIndex, sortedEvents.length)} of {filteredEvents.length} events
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="h-8 w-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                  </TabsContent>
                  <TabsContent value="chart" className="mt-0">
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Event Approval Status Bar Chart */}
                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-1.5 bg-purple-500 rounded-lg">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            Event Approval Status
                          </CardTitle>
                          <CardDescription>Distribution by approval status</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {/* Total Display */}
                            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                              <div className="text-4xl font-bold text-purple-600">{totalEvents}</div>
                              <div className="text-sm text-muted-foreground mt-1">Total Events</div>
                            </div>

                            {/* Bar Chart */}
                            <div className="space-y-6">
                              {/* Approved Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-green-500" />
                                    <span className="font-semibold text-sm text-green-700 dark:text-green-400">Approved</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-green-600 dark:text-green-500">{eventStats.approved}</span>
                                    <span className="text-xs text-green-600 dark:text-green-500 w-12 text-right">
                                      {totalEvents > 0 ? Math.round((eventStats.approved / totalEvents) * 100) : 0}%
                                    </span>
                                  </div>
                                </div>
                                <div className="relative h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                  <div
                                    className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                                    style={{
                                      width: `${totalEvents > 0 ? (eventStats.approved / totalEvents) * 100 : 0}%`,
                                      backgroundColor: '#22c55e',
                                    }}
                                  >
                                    {eventStats.approved > 0 && (
                                      <span className="text-xs font-bold text-white px-2">
                                        {eventStats.approved} event{eventStats.approved !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Pending Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                                    <span className="font-semibold text-sm text-yellow-700 dark:text-yellow-400">Pending</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{eventStats.pending}</span>
                                    <span className="text-xs text-yellow-600 dark:text-yellow-500 w-12 text-right">
                                      {totalEvents > 0 ? Math.round((eventStats.pending / totalEvents) * 100) : 0}%
                                    </span>
                                  </div>
                                </div>
                                <div className="relative h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                  <div
                                    className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                                    style={{
                                      width: `${totalEvents > 0 ? (eventStats.pending / totalEvents) * 100 : 0}%`,
                                      backgroundColor: '#eab308',
                                    }}
                                  >
                                    {eventStats.pending > 0 && (
                                      <span className="text-xs font-bold text-white px-2">
                                        {eventStats.pending} event{eventStats.pending !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Rejected Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-red-500" />
                                    <span className="font-semibold text-sm text-red-700 dark:text-red-400">Rejected</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-red-600 dark:text-red-500">{eventStats.rejected}</span>
                                    <span className="text-xs text-red-600 dark:text-red-500 w-12 text-right">
                                      {totalEvents > 0 ? Math.round((eventStats.rejected / totalEvents) * 100) : 0}%
                                    </span>
                                  </div>
                                </div>
                                <div className="relative h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                  <div
                                    className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                                    style={{
                                      width: `${totalEvents > 0 ? (eventStats.rejected / totalEvents) * 100 : 0}%`,
                                      backgroundColor: '#ef4444',
                                    }}
                                  >
                                    {eventStats.rejected > 0 && (
                                      <span className="text-xs font-bold text-white px-2">
                                        {eventStats.rejected} event{eventStats.rejected !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Event Timeline Status Bar Chart */}
                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-1.5 bg-blue-500 rounded-lg">
                              <Clock className="h-5 w-5 text-white" />
                            </div>
                            Event Timeline Status
                          </CardTitle>
                          <CardDescription>Distribution by time status</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {/* Total Display */}
                            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="text-4xl font-bold text-blue-600">{totalEvents}</div>
                              <div className="text-sm text-muted-foreground mt-1">Total Events</div>
                            </div>

                            {/* Bar Chart */}
                            <div className="space-y-6">
                              {/* Now Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-red-500" />
                                    <span className="font-semibold text-sm text-red-700 dark:text-red-400">Now</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-red-600 dark:text-red-500">{eventStats.now}</span>
                                    <span className="text-xs text-red-600 dark:text-red-500 w-12 text-right">
                                      {totalEvents > 0 ? Math.round((eventStats.now / totalEvents) * 100) : 0}%
                                    </span>
                                  </div>
                                </div>
                                <div className="relative h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                  <div
                                    className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                                    style={{
                                      width: `${totalEvents > 0 ? (eventStats.now / totalEvents) * 100 : 0}%`,
                                      backgroundColor: '#ef4444',
                                    }}
                                  >
                                    {eventStats.now > 0 && (
                                      <span className="text-xs font-bold text-white px-2">
                                        {eventStats.now} event{eventStats.now !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Soon Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                                    <span className="font-semibold text-sm text-blue-700 dark:text-blue-400">Soon</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-500">{eventStats.soon}</span>
                                    <span className="text-xs text-blue-600 dark:text-blue-500 w-12 text-right">
                                      {totalEvents > 0 ? Math.round((eventStats.soon / totalEvents) * 100) : 0}%
                                    </span>
                                  </div>
                                </div>
                                <div className="relative h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                  <div
                                    className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                                    style={{
                                      width: `${totalEvents > 0 ? (eventStats.soon / totalEvents) * 100 : 0}%`,
                                      backgroundColor: '#3b82f6',
                                    }}
                                  >
                                    {eventStats.soon > 0 && (
                                      <span className="text-xs font-bold text-white px-2">
                                        {eventStats.soon} event{eventStats.soon !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Finished Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-800/50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-gray-400" />
                                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-400">Finished</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-gray-600 dark:text-gray-500">{eventStats.finished}</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-500 w-12 text-right">
                                      {totalEvents > 0 ? Math.round((eventStats.finished / totalEvents) * 100) : 0}%
                                    </span>
                                  </div>
                                </div>
                                <div className="relative h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                  <div
                                    className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                                    style={{
                                      width: `${totalEvents > 0 ? (eventStats.finished / totalEvents) * 100 : 0}%`,
                                      backgroundColor: '#94a3b8',
                                    }}
                                  >
                                    {eventStats.finished > 0 && (
                                      <span className="text-xs font-bold text-white px-2">
                                        {eventStats.finished} event{eventStats.finished !== 1 ? 's' : ''}
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
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
