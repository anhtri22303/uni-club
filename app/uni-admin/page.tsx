"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/contexts/data-context"
import { Users, Building, Calendar, Gift, TrendingUp, Activity } from "lucide-react"

// Import data
import users from "@/src/data/users.json"
import clubs from "@/src/data/clubs.json"
import events from "@/src/data/events.json"
import offers from "@/src/data/offers.json"

export default function AdminDashboard() {
  const { clubMemberships, membershipApplications, vouchers } = useData()

  // Calculate system totals
  const totalUsers = users.length
  const totalClubs = clubs.length
  const totalEvents = events.length
  const totalOffers = offers.length + vouchers.filter((v) => v.used).length
  const activeMembers = clubMemberships.filter((m) => m.status === "APPROVED").length
  const pendingApplications = membershipApplications.filter((a) => a.status === "PENDING").length
  const totalRedemptions = vouchers.filter((v) => v.used).length // Declare totalRedemptions variable

  // Recent activity (mock data for demo)
  const recentActivities = [
    { type: "user_joined", message: "New user registered", time: "2 hours ago" },
    { type: "club_created", message: "Robotics Club created", time: "5 hours ago" },
    { type: "event_created", message: "ML 101 event scheduled", time: "1 day ago" },
    { type: "application", message: "3 new club applications", time: "2 days ago" },
  ]

  // Club statistics
  const clubStats = clubs.map((club) => {
    const members = clubMemberships.filter((m) => m.clubId === club.id && m.status === "APPROVED").length
    const clubEvents = events.filter((e) => e.clubId === club.id).length
    return { ...club, memberCount: members, eventCount: clubEvents }
  })

  return (
    <ProtectedRoute allowedRoles={["uni_admin"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">University Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and management</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Users"
              value={totalUsers}
              description="Registered users"
              icon={Users}
              trend={{ value: 12, label: "from last month" }}
              variant="primary"
            />
            <StatsCard
              title="Active Clubs"
              value={totalClubs}
              description="Student organizations"
              icon={Building}
              variant="success"
            />
            <StatsCard
              title="Total Events"
              value={totalEvents}
              description="All time events"
              icon={Calendar}
              variant="info"
            />
            <StatsCard
              title="Offers Available"
              value={totalOffers}
              description="Partner offers"
              icon={Gift}
              variant="warning"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="Active Members"
              value={activeMembers}
              description="Approved club memberships"
              icon={TrendingUp}
              variant="success"
            />
            <StatsCard
              title="Pending Applications"
              value={pendingApplications}
              description="Awaiting review"
              icon={Activity}
              variant="warning"
            />
            <StatsCard
              title="Total Redemptions"
              value={totalRedemptions}
              description="Vouchers redeemed"
              icon={Gift}
              variant="info"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Club Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Club Overview</CardTitle>
                <CardDescription>Active student organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clubStats.map((club) => (
                    <div key={club.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{club.name}</p>
                        <p className="text-sm text-muted-foreground">{club.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{club.memberCount} members</p>
                        <p className="text-xs text-muted-foreground">{club.eventCount} events</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                  <div className="text-sm text-muted-foreground">System Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((activeMembers / totalUsers) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">User Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((pendingApplications / (pendingApplications + activeMembers)) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{totalRedemptions}</div>
                  <div className="text-sm text-muted-foreground">Total Redemptions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
