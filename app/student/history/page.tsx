"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { History, UserPlus, Gift, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { getMemberApplications } from "@/service/memberApplicationApi"

// Removed static `src/data` imports — use empty fallbacks. Prefer remote `clubName` from activity data when available.
const clubs: any[] = []
const offers: any[] = []

export default function MemberHistoryPage() {
  const { auth } = useAuth()
  const { membershipApplications, vouchers } = useData()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remoteApplications, setRemoteApplications] = useState<any[]>([])

  // Load any session-saved applications (from recent POSTs)

  // Get user's activity history
  const userApplications = membershipApplications.filter((a) => a.userId === auth.userId)
  const userVouchers = vouchers.filter((v) => v.userId === auth.userId)

  // Combine and sort activities by date
  const activities = [
    // local context apps
    ...userApplications.map((app) => ({
      type: "application" as const,
      date: app.appliedAt || new Date().toISOString(),
      data: app,
    })),
    // remote apps fetched from backend (filter applied below)
    ...remoteApplications.map((app) => ({
      type: "application" as const,
      date: app.submittedAt || app.appliedAt || new Date().toISOString(),
      data: {
        applicationId: app.applicationId,
        userId: app.userId,
        clubId: String(app.clubId),
        clubName: app.clubName || app.club?.name || app.clubName,
        status: app.status,
        reviewedBy: app.reviewedBy ?? null,
        reason: app.reason,
        submittedAt: app.submittedAt,
      },
    })),
    ...userVouchers.map((voucher) => ({
      type: "redemption" as const,
      date: voucher.redeemedAt || new Date().toISOString(),
      data: voucher,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // dedupe by applicationId (when available), otherwise by clubId+userId+date
  const activitiesToDisplay = (() => {
    const out: typeof activities = []
    const seen = new Set<string>()
    for (const act of activities) {
      if (act.type !== "application") {
        out.push(act)
        continue
      }
      const app = act.data
      const key = app.applicationId ? `id:${app.applicationId}` : `cu:${app.clubId}:${app.userId}:${app.submittedAt || app.appliedAt || act.date}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(act)
    }
    return out
  })()

  // Fetch remote applications for this user
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res: any = await getMemberApplications()
        if (!mounted) return
        // determine current userId from localStorage 'uniclub-auth'
        let stored: any = null
        try {
          stored = JSON.parse(localStorage.getItem("uniclub-auth") ?? "null")
        } catch (e) {
          console.warn("Failed parse stored auth", e)
        }
        const currentUserId = stored?.userId ?? stored?.user?.userId ?? auth.userId
        const filtered = Array.isArray(res) ? res.filter((r: any) => String(r.userId) === String(currentUserId)) : []
        setRemoteApplications(filtered)
      } catch (err: any) {
        console.error(err)
        if (!mounted) return
        setError(err?.message ?? "Failed to fetch member applications")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [auth.userId])

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedActivities,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: activitiesToDisplay,
    initialPageSize: 6, // ↓ để hiện phân trang khi > 6 activity
  })

  const getClubName = (clubId: string) => {
    // clubId in local data are strings like "c-ai"; remote clubId may be numeric or string.
    // Try exact match first, then coerce numeric ids to string and try again.
    const byId = clubs.find((c) => String(c.id) === String(clubId))?.name
    // Return undefined when not found so callers can prefer other sources (e.g. remote activity.data.clubName)
    return byId
  }

  const getOfferTitle = (offerId: string) => {
    return offers.find((o) => o.id === offerId)?.title || "Unknown Offer"
  }

  if (activitiesToDisplay.length === 0) {
    // show loading / error / empty states
    return (
      <ProtectedRoute allowedRoles={["student", "member"]}>
        <AppShell>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Activity History</h1>
              <p className="text-muted-foreground">Track your club applications and voucher redemptions</p>
            </div>

            {loading ? (
              <div className="text-center text-sm text-muted-foreground">Loading applications...</div>
            ) : error ? (
              <div className="text-center text-sm text-destructive">Error: {error}</div>
            ) : (
              <EmptyState
                icon={History}
                title="No activity yet"
                description="Your club applications and voucher redemptions will appear here"
                action={{
                  label: "Browse Clubs",
                  onClick: () => (window.location.href = "/student/clubs"),
                }}
              />
            )}
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
      <ProtectedRoute allowedRoles={["student", "member"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Activity History</h1>
            <p className="text-muted-foreground">Track your club applications and voucher redemptions</p>
          </div>

          <div className="space-y-4">
            {paginatedActivities.map((activity, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {activity.type === "application" ? (
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          {activity.type === "application" ? (
                            <>
                              <h3 className="font-medium">Club Application</h3>
                              <p className="text-sm text-muted-foreground">
                                Applied to {activity.data.clubName || getClubName(activity.data.clubId) || "Unknown Club"}
                              </p>
                            </>
                          ) : (
                            <>
                              <h3 className="font-medium">Voucher Redeemed</h3>
                              <p className="text-sm text-muted-foreground">
                                {getOfferTitle(activity.data.offerId)} - Code: {activity.data.code}
                              </p>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {activity.type === "application" && (
                            <Badge
                              variant={
                                activity.data.status === "APPROVED"
                                  ? "default"
                                  : activity.data.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className={
                                activity.data.status === "APPROVED"
                                  ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100"
                                  : activity.data.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                                  : "bg-red-100 text-red-800 border-red-300 hover:bg-red-100"
                              }
                            >
                              {activity.data.status}
                            </Badge>
                          )}
                          {activity.type === "redemption" && activity.data.used && (
                            <Badge variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Used
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">{activity.data.reason}</p>
                        {activity.data.reviewedBy && (
                          <p className="text-xs text-muted-foreground mt-1">Reviewed by: {activity.data.reviewedBy}</p>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(activity.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Luôn render; Pagination tự ẩn khi chỉ có 1 trang */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1) // reset về trang 1 khi đổi số dòng/trang
            }}
            pageSizeOptions={[6, 12, 24, 48]}
          />
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
