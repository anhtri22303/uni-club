"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/contexts/data-context"
import { Gift, TrendingUp, CheckCircle, Clock, Users as UsersIcon, UserCheck, UserX, Shield, Building2, UserPlus, UsersRound } from "lucide-react"
import { fetchEvent } from "@/service/eventApi"
import { getClubStats } from "@/service/clubApi"
import { getUserStats } from "@/service/userApi"
import { useEffect, useState } from "react"

// Removed static `src/data` imports — use empty fallbacks. Replace with real data from API/context later.
const offers: any[] = []
const redemptions: any[] = []
const users: any[] = []

export default function PartnerDashboard() {
  const { vouchers, events, clubs, users, updateEvents, updateClubs, updateUsers } = useData()
  const [userStats, setUserStats] = useState<any>(null)
  const [clubStats, setClubStats] = useState<any>(null)

  // Fetch events, club stats and user stats when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch events
        const eventData = await fetchEvent()
        updateEvents(eventData || [])
        
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
  }, [updateEvents])

  // For demo purposes, assume this admin manages CoffeeLab offers
  const partnerName = "CoffeeLab"
  const partnerOffers = offers.filter((o) => o.partner === partnerName)
  const partnerRedemptions = redemptions.filter((r) => {
    const offer = offers.find((o) => o.id === r.offerId)
    return offer?.partner === partnerName
  })

  const partnerVouchers = vouchers.filter((v) => {
    const offer = offers.find((o) => o.id === v.offerId)
    return offer?.partner === partnerName
  })

  const totalClubs = clubStats?.totalClubs || 0
  const totalMembers = clubStats?.totalMembers || 0
  const activeMembers = clubStats?.activeMembers || 0
  const totalEvents = events.length
  const totalUsers = userStats?.total || 0
  const activeUsers = userStats?.active || 0
  const inactiveUsers = userStats?.inactive || 0
  const totalRedemptions = partnerRedemptions.length + partnerVouchers.length
  const activeVouchers = partnerVouchers.filter((v) => !v.used).length

  // Recent activity (combine redemptions and vouchers)
  const recentActivity = [
    ...partnerRedemptions.map((r) => ({ ...r, type: "historical" })),
    ...partnerVouchers.filter((v) => v.used).map((v) => ({ ...v, type: "recent" })),
  ].slice(0, 5)

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Admin Dashboard</h1>
            <p className="text-muted-foreground">Managing {partnerName} offers and redemptions</p>
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
              title="Active Vouchers"
              value={activeVouchers}
              description="Pending redemption"
              icon={Clock}
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

            {/* Offer Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Offer Performance</CardTitle>
                <CardDescription>Your most popular offers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partnerOffers.map((offer) => {
                    const offerRedemptions = [
                      ...partnerRedemptions.filter((r) => r.offerId === offer.id),
                      ...partnerVouchers.filter((v) => v.offerId === offer.id),
                    ]
                    return (
                      <div key={offer.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{offer.title}</p>
                          <p className="text-sm text-muted-foreground">{offer.costPoints} points</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{offerRedemptions.length} redemptions</p>
                          <p className="text-xs text-muted-foreground">
                            {partnerOffers.length > 0 ? Math.round(offerRedemptions.length / partnerOffers.length) : 0}{" "}
                            avg
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest voucher redemptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  ) : (
                    recentActivity.map((activity, index) => {
                      const user = users.find((u) => u.id === activity.userId)
                      const offer = offers.find((o) => o.id === activity.offerId)
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {user?.fullName || "Unknown User"} redeemed {offer?.title || "Unknown Offer"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.date || activity.redeemedAt
                                ? new Date(activity.date || activity.redeemedAt).toLocaleDateString()
                                : "Recently"}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Key metrics for {partnerName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalClubs}</div>
                  <div className="text-sm text-muted-foreground">Total Clubs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{totalRedemptions}</div>
                  <div className="text-sm text-muted-foreground">Total Redemptions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {totalEvents}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {totalUsers}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
