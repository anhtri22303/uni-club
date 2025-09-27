"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePagination } from "@/hooks/use-pagination"
import { useData } from "@/contexts/data-context"
import {
  PieChart,
  Users,
  Calendar,
  Building,
  Download,
  Filter,
  ArrowUpRight,
  Activity,
  Target,
  Award,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

// Import data
import users from "@/src/data/users.json"
import clubs from "@/src/data/clubs.json"
import events from "@/src/data/events.json"
import redemptions from "@/src/data/redemptions.json"

export default function AdminReportsPage() {
  const { clubMemberships, membershipApplications, vouchers } = useData()

  const usersByRole = users.reduce(
    (acc, user) => {
      user.roles.forEach((role) => {
        acc[role] = (acc[role] || 0) + 1
      })
      return acc
    },
    {} as Record<string, number>,
  )

  const clubsByCategory = clubs.reduce(
    (acc, club) => {
      acc[club.category] = (acc[club.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const membershipsByStatus = membershipApplications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const eventsByMonth = events.reduce(
    (acc, event) => {
      const month = new Date(event.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      acc[month] = (acc[month] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const voucherStats = {
    total: vouchers.length + redemptions.length,
    used: vouchers.filter((v) => v.used).length + redemptions.length,
    active: vouchers.filter((v) => !v.used).length,
  }

  const clubPerformance = clubs
    .map((club) => {
      const members = clubMemberships.filter((m) => m.clubId === club.id && m.status === "APPROVED").length
      const clubEvents = events.filter((e) => e.clubId === club.id).length
      const score = members * 2 + clubEvents
      return { ...club, members, events: clubEvents, score }
    })
    .sort((a, b) => b.score - a.score)

  const totalUsers = users.length
  const totalClubs = clubs.length
  const totalEvents = events.length
  const engagementRate = totalUsers
    ? Math.round((clubMemberships.filter((m) => m.status === "APPROVED").length / totalUsers) * 100)
    : 0
  const approvalRate = membershipApplications.length
    ? Math.round((membershipApplications.filter((a) => a.status === "APPROVED").length / membershipApplications.length) * 100)
    : 0
  const eventsPerClub = totalClubs ? (totalEvents / totalClubs).toFixed(1) : "0.0"

  // --- Pagination for Top Performing Clubs (minimal: arrows + current page only) ---
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedClubs,
    setCurrentPage,
  } = usePagination({
    data: clubPerformance,
    initialPageSize: 3, // giữ nguyên theo code bạn gửi
  })

  // Fixed Tailwind color map cho status chấm tròn
  const statusDotClass: Record<string, string> = {
    APPROVED: "bg-green-500",
    PENDING: "bg-yellow-500",
    REJECTED: "bg-red-500",
  }

  const goPrev = () => setCurrentPage(Math.max(1, currentPage - 1))
  const goNext = () => setCurrentPage(Math.min(totalPages, currentPage + 1))

  return (
    <ProtectedRoute allowedRoles={["uni_admin"]}>
      <AppShell>
        <div className="space-y-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Comprehensive insights and performance metrics</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-secondary">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card className="stats-card-hover border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalUsers}</div>
                <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card-hover border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Active Clubs</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <Building className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">{totalClubs}</div>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +8% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card-hover border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Events</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{totalEvents}</div>
                <div className="flex items-center text-xs text-purple-600 dark:text-purple-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +24% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card-hover border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Engagement Rate
                </CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{engagementRate}%</div>
                <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +5% from last month
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* User Distribution */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  User Distribution
                </CardTitle>
                <CardDescription>Breakdown by user roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(usersByRole).map(([role, count]) => {
                    const percentage = totalUsers ? Math.round((count / totalUsers) * 100) : 0
                    return (
                      <div key={role} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{role.replace("_", " ")}</span>
                          <span className="text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Clubs + Minimal Pager */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Award className="h-5 w-5 text-secondary" />
                  </div>
                  Top Performing Clubs
                </CardTitle>
                <CardDescription>Ranked by member count and event activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paginatedClubs.map((club, index) => {
                    const absoluteIndex = (currentPage - 1) * pageSize + index
                    return (
                      <div
                        key={club.id}
                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              absoluteIndex === 0
                                ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                : absoluteIndex === 1
                                ? "bg-gradient-to-r from-gray-400 to-gray-600"
                                : absoluteIndex === 2
                                ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                : "bg-gradient-to-r from-primary to-secondary"
                            }`}
                          >
                            #{absoluteIndex + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{club.name}</p>
                            <p className="text-sm text-muted-foreground">{club.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-primary">{club.members}</p>
                              <p className="text-xs text-muted-foreground">Members</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-secondary">{club.events}</p>
                              <p className="text-xs text-muted-foreground">Events</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Minimal pager: chỉ 2 mũi tên và số trang hiện tại ở giữa */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <Button
                      aria-label="Previous page"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={goPrev}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="min-w-[2rem] text-center text-sm font-medium">{currentPage}</div>

                    <Button
                      aria-label="Next page"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={goNext}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Membership Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  Membership Analytics
                </CardTitle>
                <CardDescription>Application status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(membershipsByStatus).map(([status, count]) => {
                    const totalApps = membershipApplications.length || 1
                    const percentage = Math.round((count / totalApps) * 100)
                    const dotClass = statusDotClass[status] || "bg-muted-foreground"
                    return (
                      <div key={status} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${dotClass}`} />
                          <span className="capitalize font-medium">{status.toLowerCase()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              status === "APPROVED" ? "default" : status === "PENDING" ? "secondary" : "destructive"
                            }
                          >
                            {count}
                          </Badge>
                          <span className="text-sm text-muted-foreground">({percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Event Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  Event Activity Timeline
                </CardTitle>
                <CardDescription>Monthly event creation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(eventsByMonth).map(([month, count]) => {
                    const maxCount = Math.max(...Object.values(eventsByMonth), 1)
                    const percentage = (count / maxCount) * 100
                    return (
                      <div key={month} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{month}</span>
                          <span className="text-muted-foreground">{count} events</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-primary rounded-lg">
                  <PieChart className="h-6 w-6 text-white" />
                </div>
                Key Performance Indicators
              </CardTitle>
              <CardDescription>Critical metrics for system performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-8 md:grid-cols-3">
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {engagementRate}%
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">User Engagement Rate</div>
                  <div className="text-xs text-muted-foreground">Users with active memberships</div>
                  <div className="flex items-center justify-center text-xs text-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +5% vs last month
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                    {approvalRate}%
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Approval Rate</div>
                  <div className="text-xs text-muted-foreground">Applications approved</div>
                  <div className="flex items-center justify-center text-xs text-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +2% vs last month
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    {eventsPerClub}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Events per Club</div>
                  <div className="text-xs text-muted-foreground">Average activity level</div>
                  <div className="flex items-center justify-center text-xs text-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +0.3 vs last month
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
