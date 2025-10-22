"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Users, Calendar, UserCheck, Clock, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useProfile, useClub } from "@/hooks/use-query-hooks"
import { getClubIdFromToken } from "@/service/clubApi"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import events from "@/src/data/events.json"
import users from "@/src/data/users.json"
import { ApiMembership } from "@/service/membershipApi"


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

  // Get clubId from token
  useEffect(() => {
    const id = getClubIdFromToken()
    if (id) {
      setClubId(id)
    }
  }, [])

  // ✅ USE REACT QUERY for profile and club
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: managedClub, isLoading: clubLoading } = useClub(clubId || 0, !!clubId)

  const loading = profileLoading || clubLoading

  // Type assertion for profile to fix TypeScript error
  const typedProfile = profile as any

  const clubMembers = managedClub ? clubMemberships.filter((m) => m.clubId === managedClub.id && m.status === "APPROVED") : []
  const pendingApplications = managedClub ? membershipApplications.filter((a) => a.clubId === managedClub.id && a.status === "PENDING") : []
  const clubEvents = managedClub ? events.filter((e) => e.clubId === String(managedClub.id)) : []
  const upcomingEvents = clubEvents.filter((event) => new Date(event.date) > new Date()).length
  const recentApplications = managedClub
    ? membershipApplications
      .filter((a) => a.clubId === managedClub.id)
      .sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime())
      .slice(0, 5)
    : []

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-6">
            <div>
              <Skeleton className="h-9 w-1/2" />
              <Skeleton className="h-5 w-1/3 mt-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-96 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">
              Hello, {typedProfile?.fullName || "Club Leader"} 👋
            </h1>
            {managedClub ? (
              <p className="text-muted-foreground">Welcome to "{managedClub.name}"</p>
            ) : (
              <p className="text-destructive">Could not load club information. Please check your permissions.</p>
            )}
          </div>

          {/* ... StatsCards remain the same ... */}
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
            {/* ... Recent Applications card remains the same ... */}
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
                              {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : "Recently"}
                            </p>
                          </div>
                          <Badge
                            variant={
                              application.status === "APPROVED" ? "default" : application.status === "PENDING" ? "secondary" : "destructive"
                            }
                          >
                            {application.status}
                          </Badge>
                        </div>
                      )
                    })
                  )}
                  <Button variant="outline" className="w-full mt-3 bg-transparent" onClick={() => router.push("/club-leader/members")}>Manage All Applications</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Club Overview</CardTitle>
                {managedClub ? (
                  <CardDescription>{managedClub.name} statistics</CardDescription>
                ) : (
                  <Skeleton className="h-5 w-40 mt-1" />
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Major:</span>
                    {managedClub ? <Badge variant="outline">{managedClub.majorName}</Badge> : <Skeleton className="h-6 w-24" />}
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

          {/* ... Quick Actions card remains the same ... */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your club efficiently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <Button variant="outline" onClick={() => router.push("/club-leader/members")}>
                  <Users className="h-4 w-4 mr-2" />
                  Review Applications
                </Button>
                <Button variant="outline" onClick={() => router.push("/club-leader/events")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
                <Button variant="outline" onClick={() => router.push("/club-leader/members")}>
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
