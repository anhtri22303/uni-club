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
import { useMyMemberApplications, useMyClubApplications, useMyRedeemOrders, useMyEvents } from "@/hooks/use-query-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { History, UserPlus, Gift, CheckCircle, Users, Building2, Package, Calendar } from "lucide-react"
import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { timeObjectToString } from "@/service/eventApi"
import { useRouter } from "next/navigation"

// Removed static `src/data` imports — use empty fallbacks. Prefer remote `clubName` from activity data when available.
const clubs: any[] = []
const offers: any[] = []

export default function MemberHistoryPage() {
  const { auth } = useAuth()
  const { membershipApplications, vouchers } = useData()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"member" | "club" | "order" | "event">("member")
  // USE REACT QUERY for applications
  const { data: remoteApps, isLoading: memberLoading, error: memberError } = useMyMemberApplications()
  const { data: clubApps, isLoading: clubLoading, error: clubError } = useMyClubApplications()
  const { data: remoteOrdersData, isLoading: orderLoading, error: orderError, } = useMyRedeemOrders()
  const { data: myEventsData, isLoading: eventLoading, error: eventError } = useMyEvents()
  // Ensure arrays (API may return wrapped response)
  const remoteApplications: any[] = Array.isArray(remoteApps) ? remoteApps : ((remoteApps as any)?.data || [])
  const clubApplications: any[] = Array.isArray(clubApps) ? clubApps : ((clubApps as any)?.data || [])
  // FILTER
  const [filter, setFilter] = useState<string>("all")
  const handleTabChange = (tab: "member" | "club" | "order" | "event") => {
    setActiveTab(tab)
    setFilter("all") // Reset filter khi đổi tab
  }

  const remoteOrders: any[] = Array.isArray(remoteOrdersData)
    ? remoteOrdersData
    : ((remoteOrdersData as any)?.data || [])

  const myEvents: any[] = Array.isArray(myEventsData)
    ? myEventsData
    : ((myEventsData as any)?.data || [])

  // const loading = activeTab === "member" ? memberLoading : clubLoading
  // const error = activeTab === "member" ? memberError : clubError
  // LOGIC LOADING VÀ ERROR
  const loading =
    activeTab === "member"
      ? memberLoading
      : activeTab === "club"
        ? clubLoading
        : activeTab === "order"
          ? orderLoading
          : eventLoading
  const error =
    activeTab === "member"
      ? memberError
      : activeTab === "club"
        ? clubError
        : activeTab === "order"
          ? orderError
          : eventError

  // LOGIC ĐỂ CHỌN FILTER CHO TỪNG TAB
  const filterOptions = useMemo(() => {
    switch (activeTab) {
      case "member":
        return [
          { value: "all", label: "All Statuses" },
          { value: "PENDING", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
        ]
      case "club":
        return [
          { value: "all", label: "All Statuses" },
          { value: "PENDING", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
          { value: "COMPLETE", label: "Complete" },
        ]
      case "order":
        return [
          { value: "all", label: "All Statuses" },
          { value: "PENDING", label: "Pending" },
          { value: "COMPLETED", label: "Completed" },
          { value: "REFUNDED", label: "Refunded" },
          { value: "PARTIALLY_REFUNDED", label: "Partially Refunded" },
          { value: "CANCELLED", label: "Cancelled" },
        ]
      case "event":
        return [
          { value: "all", label: "All Statuses" },
          { value: "PENDING_UNISTAFF", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
          { value: "ONGOING", label: "Ongoing" },
          { value: "COMPLETED", label: "Completed" },
        ]
      default:
        return [{ value: "all", label: "All Statuses" }]
    }
  }, [activeTab])

  // Get user's activity history
  const userApplications = membershipApplications.filter((a) => a.userId === auth.userId)
  const userVouchers = vouchers.filter((v) => v.userId === auth.userId)

  // Member applications activities
  const memberActivities = [
    // local context apps
    ...userApplications.map((app) => ({
      type: "application" as const,
      date: app.appliedAt || new Date().toISOString(),
      data: app,
    })),
    // remote apps fetched from backend using /api/member-applications/my
    ...(remoteApplications || []).map((app: any) => ({
      type: "application" as const,
      date: app.createdAt || app.submittedAt || app.appliedAt || new Date().toISOString(),
      data: {
        applicationId: app.applicationId,
        userId: app.applicantId,
        clubId: String(app.clubId),
        clubName: app.clubName,
        status: app.status,
        reviewedBy: app.handledByName ?? null,
        reason: app.reason || app.message,
        submittedAt: app.createdAt,
      },
    })),
    ...userVouchers.map((voucher) => ({
      type: "redemption" as const,
      date: voucher.redeemedAt || new Date().toISOString(),
      data: voucher,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Club applications activities
  const clubActivitiesData = (clubApplications || []).map((app: any) => ({
    type: "clubApplication" as const,
    date: app.submittedAt || new Date().toISOString(),
    data: {
      applicationId: app.applicationId,
      clubName: app.clubName,
      description: app.description,
      category: app.category || "",
      status: app.status,
      reviewedBy: app.reviewedBy?.fullName ?? null,
      rejectReason: app.rejectReason || "",
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
    },
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // ORDER HISTORY
  const orderActivities = (remoteOrders || [])
    .map((order: any) => ({
      type: "redeemOrder" as const,
      date: order.createdAt || new Date().toISOString(),
      data: {
        orderId: order.orderId,
        orderCode: order.orderCode,
        productName: order.productName,
        quantity: order.quantity,
        totalPoints: order.totalPoints,
        status: order.status,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        clubName: order.clubName,
        memberName: order.memberName,
        productType: order.productType,
        reasonRefund: order.reasonRefund,
        clubId: order.clubId,
        eventId: order.eventId,
      },
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // EVENT HISTORY
  const eventActivities = (myEvents || [])
    .map((event: any) => ({
      type: "event" as const,
      date: event.date || new Date().toISOString(),
      data: {
        id: event.id,
        name: event.name,
        description: event.description,
        type: event.type,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        status: event.status,
        checkInCode: event.checkInCode,
        budgetPoints: event.budgetPoints,
        locationName: event.locationName,
        maxCheckInCount: event.maxCheckInCount,
        currentCheckInCount: event.currentCheckInCount,
        commitPointCost: event.commitPointCost,
        hostClub: event.hostClub,
        coHostedClubs: event.coHostedClubs,
      },
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Switch activities based on active tab
  //const activities = activeTab === "member" ? memberActivities : clubActivitiesData 
  const activities =
    activeTab === "member"
      ? memberActivities
      : activeTab === "club"
        ? clubActivitiesData
        : activeTab === "order"
          ? orderActivities
          : eventActivities

  // LOGIC LỌC
  const filteredActivities = useMemo(() => {
    if (filter === "all") {
      return activities
    }
    return activities.filter((activity) => {
      // 'redemption' (voucher cũ) không có status, luôn hiển thị
      if (activity.type === "redemption") {
        return true
      }
      // Lọc các loại khác theo status
      return activity.data.status === filter
    })
  }, [activities, filter])

  // dedupe by applicationId (when available), otherwise by clubId+userId+date
  const activitiesToDisplay = (() => {
    const out: any[] = []
    const seen = new Set<string>()

    // for (const act of activities) {
    for (const act of filteredActivities) {
      if (act.type === "redemption" || act.type === "clubApplication" || act.type === "redeemOrder") {
        out.push(act)
        continue
      }
      if (act.type === "application") {
        const app = act.data
        const key = app.applicationId ? `id:${app.applicationId}` : `cu:${app.clubId}:${app.userId}:${app.submittedAt || app.appliedAt || act.date}`
        if (seen.has(key)) continue
        seen.add(key)
      }
      out.push(act)
    }
    return out
  })()

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
    initialPageSize: 10, // ↓ để hiện phân trang khi > 4 activity
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

  return (
    <ProtectedRoute allowedRoles={["student", "member"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Activity History</h1>
            <p className="text-muted-foreground">Track your club applications and voucher redemptions</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            {/* (Button Member Applications) */}
            <button
              // onClick={() => setActiveTab("member")}
              onClick={() => handleTabChange("member")}
              className={`px-4 py-2 font-medium transition-colors relative ${activeTab === "member"
                ? "text-blue-600 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Member Applications
                {remoteApplications.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {remoteApplications.length}
                  </Badge>
                )}
              </div>
              {activeTab === "member" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
            {/* (Button Club Applications) */}
            <button
              // onClick={() => setActiveTab("club")}
              onClick={() => handleTabChange("club")}
              className={`px-4 py-2 font-medium transition-colors relative ${activeTab === "club"
                ? "text-blue-600 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Club Applications
                {clubApplications.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {clubApplications.length}
                  </Badge>
                )}
              </div>
              {activeTab === "club" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
            {/* Order History */}
            <button
              // onClick={() => setActiveTab("order")}
              onClick={() => handleTabChange("order")}
              className={`px-4 py-2 font-medium transition-colors relative ${activeTab === "order"
                ? "text-blue-600 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order History
                {remoteOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {remoteOrders.length}
                  </Badge>
                )}
              </div>
              {activeTab === "order" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
            {/* My Events */}
            <button
              onClick={() => handleTabChange("event")}
              className={`px-4 py-2 font-medium transition-colors relative ${activeTab === "event"
                ? "text-blue-600 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                My Events
                {myEvents.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {myEvents.length}
                  </Badge>
                )}
              </div>
              {activeTab === "event" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          </div>

          {/* Filter */}
          <div className="flex justify-end">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-8">Loading applications...</div>
          ) : error ? (
            <div className="text-center text-sm text-destructive py-8">Error: {String(error)}</div>
          ) : activitiesToDisplay.length === 0 ? (
            <EmptyState
              icon={History}
              title="No activity yet"
              description={
                activeTab === "member"
                  ? "Your member applications and voucher redemptions will appear here"
                  : activeTab === "club"
                    ? "Your club creation applications will appear here"
                    : activeTab === "order"
                      ? "Your product order history will appear here"
                      : "Your registered events will appear here"
              }
              action={{
                label:
                  activeTab === "member"
                    ? "Browse Clubs"
                    : activeTab === "club"
                      ? "Create Club"
                      : activeTab === "order"
                        ? "Browse Gift"
                        : "Browse Events",
                onClick: () =>
                (window.location.href =
                  activeTab === "member"
                    ? "/student/clubs"
                    : activeTab === "club"
                      ? "/student/clubs"
                      : activeTab === "order"
                        ? "/student/gift"
                        : "/student/events"),
              }}
            />
          ) : (
            // <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedActivities.map((activity, index) => {
                // Determine border color based on status
                const getBorderColor = () => {
                  if (activity.type === "redemption") return "border-l-purple-500"

                  // LOGIC MÀU CHO ORDER
                  if (activity.type === "redeemOrder") {
                    const orderStatus = activity.data.status
                    if (orderStatus === "COMPLETED") return "border-l-green-500"
                    if (orderStatus === "PENDING") return "border-l-yellow-500"
                    if (
                      orderStatus === "CANCELLED" ||
                      orderStatus === "REFUNDED" ||
                      orderStatus === "PARTIALLY_REFUNDED"
                    )
                      return "border-l-red-500"
                    return "border-l-gray-300"
                  }

                  // LOGIC MÀU CHO EVENT
                  if (activity.type === "event") {
                    const eventStatus = activity.data.status
                    if (eventStatus === "APPROVED" || eventStatus === "COMPLETED") return "border-l-green-500"
                    if (eventStatus === "ONGOING") return "border-l-blue-500"
                    if (eventStatus === "PENDING_UNISTAFF") return "border-l-yellow-500"
                    if (eventStatus === "REJECTED") return "border-l-red-500"
                    return "border-l-gray-300"
                  }

                  const status = activity.data.status
                  if (status === "APPROVED") return "border-l-green-500"
                  if (status === "COMPLETE") return "border-l-blue-500"
                  if (status === "PENDING") return "border-l-yellow-500"
                  if (status === "REJECTED") return "border-l-red-500"
                  return "border-l-gray-300"
                }

                return (
                  <Card key={index} className={`border-l-4 ${getBorderColor()} transition-all hover:shadow-md`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {activity.type === "application" ? (
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          ) : activity.type === "clubApplication" ? (
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            //  ICON CHO ORDER
                          ) : activity.type === "redeemOrder" ? (
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                          ) : activity.type === "event" ? (
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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
                                  <h3 className="font-medium">Member Application</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Applied to {activity.data.clubName || getClubName(activity.data.clubId) || "Unknown Club"}
                                  </p>
                                </>
                              ) : activity.type === "clubApplication" ? (
                                <>
                                  <h3 className="font-medium">Club Creation Application</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Applied to create: {activity.data.clubName}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Category: {activity.data.category}
                                  </p>
                                </>
                                //  NỘI DUNG CHO ORDER
                              ) : activity.type === "redeemOrder" ? (
                                <>
                                  <h3 className="font-medium">
                                    Product Order
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Product name: {activity.data.productName}
                                    <br />
                                    Quantity: {activity.data.quantity}
                                  </p>
                                  {/* Hiển thị điểm đã tiêu */}
                                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    Total points: {activity.data.totalPoints} points
                                  </p>
                                </>
                              ) : activity.type === "event" ? (
                                <>
                                  <h3 
                                    className="font-medium hover:underline cursor-pointer"
                                    onClick={() => router.push(`/student/events/${activity.data.id}`)}
                                  >
                                    {activity.data.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Host: {activity.data.hostClub?.name || "Unknown Club"}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    📍 {activity.data.locationName} | 🕒 {timeObjectToString(activity.data.startTime)} - {timeObjectToString(activity.data.endTime)}
                                  </p>
                                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    Commit points: {activity.data.commitPointCost} points
                                  </p>
                                </>
                              ) : (
                                <>
                                  <h3 className="font-medium">
                                    Voucher Redeemed
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {getOfferTitle(activity.data.offerId)} -
                                    Code: {activity.data.code}
                                  </p>
                                </>
                              )}
                            </div>

                            {/* Thêm Badge cho Order */}
                            <div className="flex items-center gap-2">
                              {(activity.type === "application" ||
                                activity.type === "clubApplication") && (
                                  <Badge
                                    variant={
                                      activity.data.status === "APPROVED"
                                        ? "default"
                                        : activity.data.status === "COMPLETE"
                                          ? "default"
                                          : activity.data.status === "PENDING"
                                            ? "secondary"
                                            : "destructive"
                                    }
                                    className={
                                      activity.data.status === "APPROVED"
                                        ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100"
                                        : activity.data.status === "COMPLETE"
                                          ? "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100"
                                          : activity.data.status === "PENDING"
                                            ? "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                                            : "bg-red-100 text-red-800 border-red-300 hover:bg-red-100"
                                    }
                                  >
                                    {activity.data.status}
                                  </Badge>
                                )}
                              {/* Badge cho Order */}
                              {activity.type === "redeemOrder" && (
                                <Badge
                                  variant={
                                    activity.data.status === "COMPLETED"
                                      ? "default"
                                      : activity.data.status === "PENDING"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className={
                                    activity.data.status === "COMPLETED"
                                      ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100"
                                      : activity.data.status === "PENDING"
                                        ? "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                                        : "bg-red-100 text-red-800 border-red-300 hover:bg-red-100" // Áp dụng cho CANCELLED, REFUNDED, PARTIALLY_REFUNDED
                                  }
                                >
                                  {activity.data.status}
                                </Badge>
                              )}
                              {/* Badge cho Event */}
                              {activity.type === "event" && (
                                <Badge
                                  variant={
                                    activity.data.status === "APPROVED" || activity.data.status === "COMPLETED"
                                      ? "default"
                                      : activity.data.status === "ONGOING"
                                        ? "default"
                                        : activity.data.status === "PENDING_UNISTAFF"
                                          ? "secondary"
                                          : "destructive"
                                  }
                                  className={
                                    activity.data.status === "APPROVED" || activity.data.status === "COMPLETED"
                                      ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100"
                                      : activity.data.status === "ONGOING"
                                        ? "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100"
                                        : activity.data.status === "PENDING_UNISTAFF"
                                          ? "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                                          : "bg-red-100 text-red-800 border-red-300 hover:bg-red-100"
                                  }
                                >
                                  {activity.data.status}
                                </Badge>
                              )}
                              {activity.type === "redemption" &&
                                activity.data.used && (
                                  <Badge variant="outline">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Used
                                  </Badge>
                                )}
                            </div>
                          </div>

                          {/* Hiển thị chi tiết cho từng loại */}
                          <div className="mt-2">
                            {activity.type === "application" ? (
                              <p className="text-sm text-muted-foreground">
                                {activity.data.reason}
                              </p>
                            ) : activity.type === "clubApplication" ? (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  {activity.data.description}
                                </p>
                                {activity.data.rejectReason && (
                                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                    Reject reason:{" "}
                                    {activity.data.rejectReason}
                                  </p>
                                )}
                              </>
                            ) : activity.type === "redeemOrder" ? (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  Order Code:{" "}
                                  <span className="font-medium text-foreground">
                                    {activity.data.orderCode}
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  From: {activity.data.clubName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Type product: {activity.data.productType}
                                </p>
                                {/* Hiển thị lý do refund NẾU CÓ */}
                                {activity.data.reasonRefund && (
                                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                    Refund reason:{" "}
                                    {activity.data.reasonRefund}
                                  </p>
                                )}
                              </>
                            ) : activity.type === "redemption" ? (
                              <p className="text-sm text-muted-foreground">
                                {activity.data.reason}
                              </p>
                            ) : activity.type === "event" ? (
                              <>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {activity.data.description}
                                </p>
                                {activity.data.coHostedClubs && activity.data.coHostedClubs.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Co-hosts: {activity.data.coHostedClubs.map((c: any) => c.name).join(", ")}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  Event Type: {activity.data.type}
                                </p>
                              </>
                            ) : null}

                            {/* Common fields */}
                            {activity.data.reviewedBy && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Reviewed by: {activity.data.reviewedBy}
                              </p>
                            )}

                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(activity.date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>

                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pagination - only show when there's data */}
          {!loading && !error && activitiesToDisplay.length > 0 && (
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
              pageSizeOptions={[10, 30, 50]}
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
