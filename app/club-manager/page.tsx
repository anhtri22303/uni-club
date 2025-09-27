"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Users, Calendar, UserCheck, Clock, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

// Import data
import clubs from "@/src/data/clubs.json"
import events from "@/src/data/events.json"
import users from "@/src/data/users.json"

export default function ClubManagerDashboard() {
  const { auth } = useAuth()
  const { clubMemberships, membershipApplications } = useData()
  const router = useRouter()

  // For demo purposes, assume the club manager manages the first club
  // In a real app, this would be determined by the user's club association
  const managedClub = clubs[0] // AI Club

  // Get club-specific data
  const clubMembers = clubMemberships.filter((m) => m.clubId === managedClub.id && m.status === "APPROVED")

  const pendingApplications = membershipApplications.filter(
    (a) => a.clubId === managedClub.id && a.status === "PENDING",
  )

  const clubEvents = events.filter((e) => e.clubId === managedClub.id)

  const upcomingEvents = clubEvents.filter((event) => new Date(event.date) > new Date()).length

  // Recent applications (last 5)
  const recentApplications = membershipApplications
    .filter((a) => a.clubId === managedClub.id)
    .sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime())
    .slice(0, 5)

  return (
    <ProtectedRoute allowedRoles={["club_manager"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Club Manager Dashboard</h1>
            <p className="text-muted-foreground">Managing {managedClub.name}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Members"
              value={clubMembers.length}
              description="Active club members"
              icon={Users}
              trend={{ value: 8, label: "from last month" }}
              variant="primary"
            />
            <StatsCard
              title="Pending Applications"
              value={pendingApplications.length}
              description="Awaiting review"
              icon={Clock}
              variant="warning"
            />
            <StatsCard
              title="Upcoming Events"
              value={upcomingEvents}
              description="This month"
              icon={Calendar}
              variant="info"
            />
            <StatsCard
              title="Total Events"
              value={clubEvents.length}
              description="All time"
              icon={TrendingUp}
              variant="success"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Applications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Recent Applications
                </CardTitle>
                <CardDescription>Latest membership requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentApplications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No recent applications</p>
                  ) : (
                    recentApplications.map((application) => {
                      const applicant = users.find((u) => u.id === application.userId)
                      return (
                        <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{applicant?.fullName}</p>
                            <p className="text-sm text-muted-foreground">{applicant?.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {application.appliedAt
                                ? new Date(application.appliedAt).toLocaleDateString()
                                : "Recently"}
                            </p>
                          </div>
                          <Badge
                            variant={
                              application.status === "APPROVED"
                                ? "default"
                                : application.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {application.status}
                          </Badge>
                        </div>
                      )
                    })
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-3 bg-transparent"
                    onClick={() => router.push("/club-manager/members")}
                  >
                    Manage All Applications
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Club Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Club Overview</CardTitle>
                <CardDescription>{managedClub.name} statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="outline">{managedClub.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Members:</span>
                    <span className="font-semibold">{clubMembers.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Events Created:</span>
                    <span className="font-semibold">{clubEvents.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending Reviews:</span>
                    <span className="font-semibold">{pendingApplications.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your club efficiently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <Button variant="outline" onClick={() => router.push("/club-manager/members")}>
                  <Users className="h-4 w-4 mr-2" />
                  Review Applications
                </Button>
                <Button variant="outline" onClick={() => router.push("/club-manager/events")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
                <Button variant="outline" onClick={() => router.push("/club-manager/members")}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Manage Members
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
