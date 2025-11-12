"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getEventAttendStats, getEventAttendFraud, EventAttendStats, EventAttendFraud } from "@/service/eventAttendApi"
import { ArrowLeft, Users, CheckCircle, AlertTriangle, XCircle, TrendingUp, Activity, BarChart3, Shield } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Modal } from "@/components/modal"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export default function EventStatsDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const eventId = params?.id ? Number(params.id) : null

  const [stats, setStats] = useState<EventAttendStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fraud modal states
  const [showFraudModal, setShowFraudModal] = useState(false)
  const [fraudData, setFraudData] = useState<EventAttendFraud[]>([])
  const [fraudLoading, setFraudLoading] = useState(false)

  useEffect(() => {
    if (!eventId) {
      setError("Invalid event ID")
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getEventAttendStats(eventId)
        
        if (response.success && response.data) {
          setStats(response.data)
        } else {
          throw new Error(response.message || "Failed to fetch statistics")
        }
      } catch (err: any) {
        console.error("Error fetching event stats:", err)
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to load event statistics"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [eventId, toast])

  const handleFraudClick = async () => {
    if (!eventId) return

    try {
      setFraudLoading(true)
      setShowFraudModal(true)
      const response = await getEventAttendFraud(eventId)
      
      if (response.success && response.data) {
        setFraudData(response.data)
      } else {
        throw new Error(response.message || "Failed to fetch fraud records")
      }
    } catch (err: any) {
      console.error("Error fetching fraud data:", err)
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to load fraud records"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      setShowFraudModal(false)
    } finally {
      setFraudLoading(false)
    }
  }

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return "N/A"
    try {
      const date = new Date(dateTimeString)
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return "Invalid date"
    }
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <Skeleton className="h-8 w-8 sm:h-10 sm:w-10" />
              <div className="flex-1">
                <Skeleton className="h-6 sm:h-8 w-48 sm:w-64 mb-2" />
                <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
              </div>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="h-28 sm:h-32" />
              ))}
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (error || !stats) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-2 sm:mb-4"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
                <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Error Loading Statistics</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">{error || "Unable to load event statistics"}</p>
                <Button onClick={() => router.back()} size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="h-8 w-8 sm:h-10 sm:w-10 p-0"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Event Statistics</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{stats.eventName}</p>
            </div>
            {/* Fraud Button */}
            {stats.suspiciousCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleFraudClick}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">View Fraud</span>
                <span className="sm:hidden">Fraud</span>
                <Badge variant="secondary" className="ml-1 bg-white text-destructive text-xs px-1 sm:px-2">
                  {stats.suspiciousCount}
                </Badge>
              </Button>
            )}
          </div>

          {/* Main Statistics Grid */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Registered */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  Total Registered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{stats.totalRegistered}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total participants registered
                </p>
              </CardContent>
            </Card>

            {/* Check-in Count */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  Check-in Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{stats.checkinCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Participants checked in
                </p>
              </CardContent>
            </Card>

            {/* Mid Count */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                  Mid Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{stats.midCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mid-event check-ins
                </p>
              </CardContent>
            </Card>

            {/* Check-out Count */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  Check-out Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{stats.checkoutCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Participants checked out
                </p>
              </CardContent>
            </Card>

            {/* None Count */}
            <Card className="border-l-4 border-l-gray-500">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  No Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{stats.noneCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered but didn't attend
                </p>
              </CardContent>
            </Card>

            {/* Half Count */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  Half Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{stats.halfCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Partial attendance
                </p>
              </CardContent>
            </Card>

            {/* Full Count */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  Full Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{stats.fullCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete attendance
                </p>
              </CardContent>
            </Card>

            {/* Suspicious Count */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                  Suspicious
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{stats.suspiciousCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Flagged as suspicious
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Rate Statistics */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Participation Rate */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  Participation Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {formatPercentage(stats.participationRate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                  Percentage of registered who attended
                </p>
              </CardContent>
            </Card>

            {/* Mid Compliance Rate */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                  Mid Compliance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                  {formatPercentage(stats.midComplianceRate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                  Percentage who completed mid check-in
                </p>
              </CardContent>
            </Card>

            {/* Fraud Rate */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                  Fraud Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400">
                  {formatPercentage(stats.fraudRate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                  Percentage of suspicious activities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Fraud Detail Modal */}
          <Modal
            open={showFraudModal}
            onOpenChange={setShowFraudModal}
            title="Fraud Detection Records"
            description={`Suspicious attendance records for ${stats.eventName}`}
            className="sm:max-w-[90vw] md:max-w-[700px] lg:max-w-[900px] max-h-[85vh] overflow-hidden"
          >
            <ScrollArea className="h-full max-h-[65vh] pr-4">
              {fraudLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 sm:h-40 w-full" />
                  ))}
                </div>
              ) : fraudData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No Fraud Records</h3>
                  <p className="text-sm text-muted-foreground">
                    No suspicious activities detected for this event
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {fraudData.map((fraud, index) => (
                    <Card key={fraud.registrationId} className="border-l-4 border-l-red-500">
                      <CardHeader className="pb-2 sm:pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm sm:text-base truncate">
                              {fraud.memberName}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm truncate">
                              {fraud.memberEmail}
                            </CardDescription>
                          </div>
                          <Badge variant="destructive" className="text-xs shrink-0">
                            #{index + 1}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 sm:space-y-3">
                        {/* Timestamps Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground font-medium">Check-in</p>
                            <p className="font-mono text-xs bg-muted px-2 py-1 rounded truncate">
                              {formatDateTime(fraud.checkinAt)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground font-medium">Mid Check</p>
                            <p className="font-mono text-xs bg-muted px-2 py-1 rounded truncate">
                              {formatDateTime(fraud.checkMidAt)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground font-medium">Check-out</p>
                            <p className="font-mono text-xs bg-muted px-2 py-1 rounded truncate">
                              {formatDateTime(fraud.checkoutAt)}
                            </p>
                          </div>
                        </div>

                        {/* Fraud Reason */}
                        <div className="pt-2 border-t">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Fraud Reason:
                              </p>
                              <p className="text-xs sm:text-sm text-destructive font-medium break-words">
                                {fraud.fraudReason}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Registration ID */}
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Registration ID: <span className="font-mono font-medium">{fraud.registrationId}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowFraudModal(false)}
                size="sm"
              >
                Close
              </Button>
            </div>
          </Modal>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
