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
import { useProfile, useClub, useClubMembers, useMemberApplicationsByClub, useEventsByClubId } from "@/hooks/use-query-hooks"
import { getClubIdFromToken } from "@/service/clubApi"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
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

  // ✅ USE REACT QUERY for profile, club, members, applications, and events
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: managedClub, isLoading: clubLoading } = useClub(clubId || 0, !!clubId)
  const { data: apiMembers = [], isLoading: membersLoading } = useClubMembers(clubId || 0, !!clubId)
  const { data: applications = [], isLoading: applicationsLoading } = useMemberApplicationsByClub(
    clubId || 0,
    !!clubId
  )
  const { data: rawEvents = [], isLoading: eventsLoading } = useEventsByClubId(clubId || 0, !!clubId)

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

  // ✅ EVENT STATISTICS from API
  // Helper function to check if event has expired (past endTime)
  const isEventExpired = (event: any) => {
    if (!event.date || !event.endTime) return false

    try {
      const now = new Date()
      const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))

      const [year, month, day] = event.date.split('-').map(Number)
      const [hours, minutes] = event.endTime.split(':').map(Number)

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

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <div>
              <Skeleton className="h-8 sm:h-9 w-3/4 sm:w-1/2" />
              <Skeleton className="h-4 sm:h-5 w-2/3 sm:w-1/3 mt-2" />
            </div>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-40 sm:h-48 rounded-lg" />
              <Skeleton className="h-40 sm:h-48 rounded-lg" />
              <Skeleton className="h-40 sm:h-48 rounded-lg" />
            </div>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
              <Skeleton className="h-80 sm:h-96 rounded-lg" />
              <Skeleton className="h-64 sm:h-80 rounded-lg" />
              <Skeleton className="h-64 sm:h-80 rounded-lg" />
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
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-balance">
              Hello, {typedProfile?.fullName || "Club Leader"} 👋
            </h1>
            {managedClub ? (
              <p className="text-sm sm:text-base text-muted-foreground">Welcome to "<span className="font-semibold text-primary">{managedClub.name}</span>"</p>
            ) : (
              <p className="text-sm sm:text-base text-destructive">Could not load club information. Please check your permissions.</p>
            )}
          </div>

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
                      {rawEvents.filter((e: any) => e.status === "PENDING").length}
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

          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Club Information</CardTitle>
                {managedClub ? (
                  <CardDescription className="text-xs sm:text-sm">{managedClub.name}</CardDescription>
                ) : (
                  <Skeleton className="h-5 w-40 mt-1" />
                )}
              </CardHeader>
              <CardContent>
                {clubLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Club Name:</span>
                      {managedClub ? <Badge variant="outline" className="max-w-[200px] truncate">{managedClub.name}</Badge> : <Skeleton className="h-6 w-24" />}
                    </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Major:</span>
                    {managedClub ? <Badge variant="outline">{managedClub.majorName}</Badge> : <Skeleton className="h-6 w-24" />}
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Policy:</span>
                      {managedClub ? <Badge variant="secondary">{managedClub.majorPolicyName}</Badge> : <Skeleton className="h-6 w-24" />}
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Description</p>
                      {managedClub ? (
                        <p className="text-sm leading-relaxed">{managedClub.description || "No description available"}</p>
                      ) : (
                        <Skeleton className="h-16 w-full" />
                      )}
                    </div>
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage your club efficiently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" onClick={() => router.push("/club-leader/applications")} className="w-full">
                  <UserCheck className="h-4 w-4 mr-2" />
                  <span className="text-sm sm:text-base">Review Applications</span>
                </Button>
                <Button variant="outline" onClick={() => router.push("/club-leader/events")} className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm sm:text-base">Create Event</span>
                </Button>
                <Button variant="outline" onClick={() => router.push("/club-leader/members")} className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm sm:text-base">Manage Members</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
