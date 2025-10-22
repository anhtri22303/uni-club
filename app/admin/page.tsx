"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gift, TrendingUp, CheckCircle, Clock, Users as UsersIcon, UserCheck, UserX, Shield, Building2, UserPlus, UsersRound, Calendar, MapPin, Eye, ChevronLeft, ChevronRight } from "lucide-react"
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
    const pending = events.filter((e: any) => e.status === "PENDING").length
    const rejected = events.filter((e: any) => e.status === "REJECTED").length
    const now = events.filter((e: any) => getEventStatus(e.date, e.time) === "Now").length
    const soon = events.filter((e: any) => getEventStatus(e.date, e.time) === "Soon").length
    const finished = events.filter((e: any) => getEventStatus(e.date, e.time) === "Finished").length
    
    return { approved, pending, rejected, now, soon, finished }
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
            />
            <StatsCard
              title="Total Events"
              value={totalEvents}
              description="All events"
              icon={TrendingUp}
              trend={{ value: 12, label: "from last month" }}
              variant="success"
            />
            <StatsCard
              title="Total Users"
              value={totalUsers}
              description="Registered users"
              icon={CheckCircle}
              variant="info"
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
              </CardContent>
            </Card>

            {/* Club Statistics Overview */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Club Statistics Overview</CardTitle>
                <CardDescription>Comprehensive club and membership analytics</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Event Statistics Overview */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Event Statistics Overview</CardTitle>
                    <CardDescription>All events status and filters</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin/events")}
                  >
                    View All Events
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                        <SelectItem value="PENDING">Pending</SelectItem>
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
                              {event.status === "APPROVED" && (
                                <Badge variant="default" className="text-xs">Approved</Badge>
                              )}
                              {event.status === "PENDING" && (
                                <Badge variant="outline" className="text-xs">Pending</Badge>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
