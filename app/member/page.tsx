"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Trophy, Users, Calendar, Gift, Scan, Crown, Medal, Award, Star, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

// Import data
import clubs from "@/src/data/clubs.json"
import events from "@/src/data/events.json"

export default function StudentDashboard() {
  const { auth } = useAuth()
  const { clubMemberships, vouchers } = useData()
  const router = useRouter()

  // Calculate user stats
  const userClubMemberships = clubMemberships.filter((m) => m.userId === auth.userId && m.status === "APPROVED")
  const userVouchers = vouchers.filter((v) => v.userId === auth.userId)
  const activeVouchers = userVouchers.filter((v) => !v.used)

  // Mock points calculation (in real app would come from backend)
  const totalPoints = 450
  const currentTier = totalPoints >= 500 ? "Gold" : totalPoints >= 200 ? "Silver" : "Bronze"

  const tierConfig = {
    Bronze: {
      icon: Award,
      color: "from-amber-600 to-amber-400",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
      textColor: "text-amber-800",
      borderColor: "border-amber-200",
      threshold: 0,
      nextThreshold: 200,
    },
    Silver: {
      icon: Medal,
      color: "from-slate-500 to-slate-300",
      bgColor: "bg-gradient-to-br from-slate-50 to-gray-50",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
      threshold: 200,
      nextThreshold: 500,
    },
    Gold: {
      icon: Crown,
      color: "from-yellow-500 to-yellow-300",
      bgColor: "bg-gradient-to-br from-yellow-50 to-amber-50",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-200",
      threshold: 500,
      nextThreshold: null,
    },
  }

  const currentTierConfig = tierConfig[currentTier]
  const TierIcon = currentTierConfig.icon

  // Upcoming events (next 3)
  const upcomingEvents = events
    .filter((event) => new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  return (
  <ProtectedRoute allowedRoles={["member"]}>
      <AppShell>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-balance leading-tight">
                Welcome back, {auth.user?.fullName}!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">Here's your club activity overview</p>
            </div>
            <Button
              onClick={() => router.push("/scan")}
              size="icon"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary hover:bg-primary/90"
            >
              <Scan className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Points"
              value={totalPoints}
              description="Earn more by attending events"
              icon={Trophy}
              trend={{ value: 12, label: "from last month" }}
              variant="primary"
            />
            <StatsCard
              title="Club Memberships"
              value={userClubMemberships.length}
              description="Active memberships"
              icon={Users}
              variant="success"
            />
            <StatsCard
              title="Upcoming Events"
              value={upcomingEvents.length}
              description="This month"
              icon={Calendar}
              variant="info"
            />
            <StatsCard
              title="Active Vouchers"
              value={activeVouchers.length}
              description="Ready to use"
              icon={Gift}
              variant="warning"
            />
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Card
              className={`relative overflow-hidden ${currentTierConfig.bgColor} ${currentTierConfig.borderColor} border-2`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
              <CardHeader className="relative pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  <div className={`p-2 rounded-full bg-gradient-to-r ${currentTierConfig.color}`}>
                    <TierIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className={currentTierConfig.textColor}>Current Tier</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r ${currentTierConfig.color} text-white border-0 shadow-lg`}
                    >
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {currentTier}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {totalPoints}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">points</div>
                  </div>
                </div>

                {currentTierConfig.nextThreshold && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs sm:text-sm font-medium">
                      <span className={currentTierConfig.textColor}>
                        Progress to {currentTierConfig.nextThreshold === 500 ? "Gold" : "Silver"}
                      </span>
                      <span className={currentTierConfig.textColor}>
                        {totalPoints}/{currentTierConfig.nextThreshold}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-white/50 rounded-full h-3 shadow-inner">
                        <div
                          className={`bg-gradient-to-r ${currentTierConfig.color} h-3 rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden`}
                          style={{ width: `${Math.min((totalPoints / currentTierConfig.nextThreshold) * 100, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        {currentTierConfig.nextThreshold - totalPoints > 0
                          ? `${currentTierConfig.nextThreshold - totalPoints} points to ${currentTierConfig.nextThreshold === 500 ? "Gold" : "Silver"} tier`
                          : "You've reached the highest tier!"}
                      </p>
                      {currentTierConfig.nextThreshold - totalPoints <= 50 &&
                        currentTierConfig.nextThreshold - totalPoints > 0 && (
                          <Badge variant="secondary" className="text-xs animate-pulse">
                            Almost there!
                          </Badge>
                        )}
                    </div>
                  </div>
                )}

                {!currentTierConfig.nextThreshold && (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-2 text-yellow-600 font-semibold">
                      <Crown className="h-5 w-5" />
                      <span>Maximum tier achieved!</span>
                      <Crown className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      You've reached the highest tier. Keep earning points for exclusive rewards!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 border-2">
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
              <CardHeader className="pb-3 sm:pb-6 relative">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  Upcoming Events
                </CardTitle>
                <CardDescription className="text-sm font-medium">Don't miss these exciting events</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-3">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground text-sm font-medium">No upcoming events</p>
                      <p className="text-xs text-muted-foreground mt-1">Check back later for new events</p>
                    </div>
                  ) : (
                    upcomingEvents.map((event, index) => {
                      const club = clubs.find((c) => c.id === event.clubId)
                      return (
                        <div
                          key={event.id}
                          className={`flex items-center justify-between p-3 sm:p-4 border-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] ${
                            index === 0 ? "border-blue-300 bg-blue-50/50" : "border-slate-200"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              <p className="font-semibold text-sm sm:text-base truncate text-slate-900">
                                {event.title}
                              </p>
                            </div>
                            <p className="text-xs sm:text-sm text-blue-600 font-medium truncate">{club?.name}</p>
                            <p className="text-xs text-muted-foreground font-medium">
                              {new Date(event.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-3 flex flex-col items-end gap-1">
                            <Badge
                              variant="secondary"
                              className="text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0"
                            >
                              {event.points} pts
                            </Badge>
                            {index === 0 && (
                              <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                                Next
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-4 bg-white/80 backdrop-blur-sm border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-semibold text-sm h-10 sm:h-11 transition-all duration-300"
                    onClick={() => router.push("/member/events")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    View All Events
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
              <CardDescription className="text-sm">Jump to your most used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/member/clubs")}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Browse </span>Clubs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/member/checkin")}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Check </span>In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/member/offers")}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Gift className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">View </span>Offers
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/member/wallet")}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Gift className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">My </span>Vouchers
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/member/history")}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Activity </span>History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
