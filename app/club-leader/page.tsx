"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Users, Calendar, UserCheck, Clock, TrendingUp, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useProfile, useClub } from "@/hooks/use-query-hooks"
import { getClubIdFromToken } from "@/service/clubApi"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import events from "@/src/data/events.json"
import users from "@/src/data/users.json"
import { ApiMembership } from "@/service/membershipApi"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { forgotPassword } from "@/service/authApi"


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
  const { auth, logout } = useAuth()
  const { clubMemberships, membershipApplications } = useData()
  const router = useRouter()
  const { toast } = useToast()
  const [clubId, setClubId] = useState<number | null>(null)
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isLoadingPasswordReset, setIsLoadingPasswordReset] = useState(false)

  // Get clubId from token
  useEffect(() => {
    const id = getClubIdFromToken()
    if (id) {
      setClubId(id)
    }
  }, [])

  // Check if password reset is required
  useEffect(() => {
    const requireReset = sessionStorage.getItem("requirePasswordReset")
    const email = sessionStorage.getItem("resetEmail")
    
    if (requireReset === "true" && email) {
      setResetEmail(email)
      setShowPasswordResetModal(true)
      // Clear the flags immediately to prevent showing again on refresh
      sessionStorage.removeItem("requirePasswordReset")
      sessionStorage.removeItem("resetEmail")
    }
  }, [])

  // ✅ USE REACT QUERY for profile and club
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: managedClub, isLoading: clubLoading } = useClub(clubId || 0, !!clubId)

  const loading = profileLoading || clubLoading

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      })
      return
    }

    setIsLoadingPasswordReset(true)

    try {
      const response = await forgotPassword(resetEmail)
      
      toast({
        title: "Password Reset Email Sent",
        description: response.message || "Please check your email for the password reset link",
      })

      // Close modal and logout
      setShowPasswordResetModal(false)
      
      // Wait a moment for the toast to show, then logout
      setTimeout(() => {
        logout()
      }, 1500)
    } catch (error: any) {
      toast({
        title: "Failed to Send Reset Email",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPasswordReset(false)
    }
  }

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
        {/* Password Reset Modal */}
        <Dialog open={showPasswordResetModal} onOpenChange={(open) => {
          // Prevent closing the modal by clicking outside or pressing escape
          if (!open) return
        }}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Password Reset Required</DialogTitle>
                  <DialogDescription className="mt-1">
                    You are using a default password. Please reset your password for security.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  We'll send a password reset link to this email address.
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                onClick={handlePasswordReset}
                disabled={isLoadingPasswordReset || !resetEmail}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isLoadingPasswordReset ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
