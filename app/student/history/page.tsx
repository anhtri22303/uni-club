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
import { useMyMemberApplications, useMyClubApplications, useMyRedeemOrders, useMyEvents, useProfile } from "@/hooks/use-query-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { History, UserPlus, Gift, CheckCircle, Users, Building2, Package, Calendar, MessageSquare, ChevronDown, ChevronUp, Star, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { getMyFeedbackByMembershipId, Feedback } from "@/service/feedbackApi"
import { getWallet, getWalletTransactions, ApiWallet, ApiWalletTransaction } from "@/service/walletApi"
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
  const [activeTab, setActiveTab] = useState<"member" | "club" | "order" | "event" | "wallet">("member")
  
  // Wallet state
  const [myWallet, setMyWallet] = useState<ApiWallet | null>(null)
  const [walletTransactions, setWalletTransactions] = useState<ApiWalletTransaction[]>([])
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  // USE REACT QUERY for applications
  const { data: remoteApps, isLoading: memberLoading, error: memberError } = useMyMemberApplications()
  const { data: clubApps, isLoading: clubLoading, error: clubError } = useMyClubApplications()
  const { data: remoteOrdersData, isLoading: orderLoading, error: orderError, } = useMyRedeemOrders()
  const { data: myEventsData, isLoading: eventLoading, error: eventError } = useMyEvents()
  const { data: myMemberships } = useProfile()
  // Ensure arrays (API may return wrapped response)
  const remoteApplications: any[] = Array.isArray(remoteApps) ? remoteApps : ((remoteApps as any)?.data || [])
  const clubApplications: any[] = Array.isArray(clubApps) ? clubApps : ((clubApps as any)?.data || [])
  // FILTER
  const [filter, setFilter] = useState<string>("all")
  const handleTabChange = (tab: "member" | "club" | "order" | "event" | "wallet") => {
    setActiveTab(tab)
    setFilter("all") // Reset filter khi đổi tab
    
    // Load wallet data when switching to wallet tab
    if (tab === "wallet" && !myWallet) {
      loadWalletData()
    }
  }
  
  // Load wallet data
  const loadWalletData = async () => {
    try {
      setWalletLoading(true)
      setWalletError(null)
      const [walletResponse, transactionsResponse] = await Promise.all([
        getWallet(),
        getWalletTransactions()
      ])
      setMyWallet(walletResponse.data)
      setWalletTransactions(transactionsResponse.data || [])
    } catch (err: any) {
      setWalletError(err?.response?.data?.message || err?.message || "Failed to load wallet")
    } finally {
      setWalletLoading(false)
    }
  }

  const remoteOrders: any[] = Array.isArray(remoteOrdersData)
    ? remoteOrdersData
    : ((remoteOrdersData as any)?.data || [])

  const myEvents: any[] = Array.isArray(myEventsData)
    ? myEventsData
    : ((myEventsData as any)?.data || [])

  // === My Feedback state (within My Events tab) ===
  const [showMyFeedback, setShowMyFeedback] = useState(false)
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | number | null>(null)
  const [myFeedbackLoading, setMyFeedbackLoading] = useState(false)
  const [myFeedbackError, setMyFeedbackError] = useState<string | null>(null)
  const [myFeedbacks, setMyFeedbacks] = useState<Feedback[]>([])
  const [expandedEventKey, setExpandedEventKey] = useState<string | null>(null)

  // Initialize default membership when available
  useEffect(() => {
    if (!showMyFeedback) return
    if (selectedMembershipId) return
    const list = Array.isArray(myMemberships) ? myMemberships : []
    if (list.length > 0) setSelectedMembershipId(list[0].membershipId)
  }, [showMyFeedback, myMemberships, selectedMembershipId])

  // Fetch my feedbacks when toggled on and membership chosen
  useEffect(() => {
    const load = async () => {
      if (!showMyFeedback || !selectedMembershipId) return
      try {
        setMyFeedbackLoading(true)
        setMyFeedbackError(null)
        const data = await getMyFeedbackByMembershipId(selectedMembershipId)
        setMyFeedbacks(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setMyFeedbackError(err?.response?.data?.message || err?.message || "Failed to load feedbacks")
      } finally {
        setMyFeedbackLoading(false)
      }
    }
    load()
  }, [showMyFeedback, selectedMembershipId])

  // Group feedbacks by eventId
  const feedbackGroups = useMemo(() => {
    const groups: Record<number, { eventId: number; eventName: string; clubName: string; items: Feedback[] }> = {}
    for (const fb of myFeedbacks) {
      const key = fb.eventId
      if (!groups[key]) {
        groups[key] = { eventId: fb.eventId, eventName: fb.eventName, clubName: fb.clubName, items: [] }
      }
      groups[key].items.push(fb)
    }
    return Object.values(groups).sort((a, b) => b.eventId - a.eventId)
  }, [myFeedbacks])

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
          : activeTab === "event"
            ? eventLoading
            : walletLoading
  const error =
    activeTab === "member"
      ? memberError
      : activeTab === "club"
        ? clubError
        : activeTab === "order"
          ? orderError
          : activeTab === "event"
            ? eventError
            : walletError

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

  // Calculate pending count for each tab
  const memberPendingCount = useMemo(() => {
    return remoteApplications.filter((app: any) => app.status === "PENDING").length
  }, [remoteApplications])

  const clubPendingCount = useMemo(() => {
    return clubApplications.filter((app: any) => app.status === "PENDING").length
  }, [clubApplications])

  const orderPendingCount = useMemo(() => {
    return remoteOrders.filter((order: any) => order.status === "PENDING").length
  }, [remoteOrders])

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
                {memberPendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {memberPendingCount}
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
                {clubPendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {clubPendingCount}
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
                {orderPendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {orderPendingCount}
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
            {/* My Wallets */}
            <button
              onClick={() => handleTabChange("wallet")}
              className={`px-4 py-2 font-medium transition-colors relative ${activeTab === "wallet"
                ? "text-blue-600 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                My Wallet
              </div>
              {activeTab === "wallet" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          </div>

          {/* Filter */}
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            {/* Left: My Feedback toggle within My Events tab */}
            {activeTab === "event" && (
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-2 rounded-md border transition-colors flex items-center gap-2 ${showMyFeedback ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300" : "hover:bg-muted"}`}
                  onClick={() => setShowMyFeedback((v) => !v)}
                >
                  <MessageSquare className="h-4 w-4" />
                  My Feedback
                </button>
                {showMyFeedback && (
                  <Select value={selectedMembershipId ? String(selectedMembershipId) : ""} onValueChange={(val) => setSelectedMembershipId(Number(val))}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select membership (club)" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(myMemberships) ? myMemberships : []).map((m: any) => (
                        <SelectItem key={m.membershipId} value={String(m.membershipId)}>
                          {m.clubName} (#{m.membershipId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Right: Status filter (hidden when My Feedback is active or on wallet tab) */}
            <div className="flex justify-end">
              {!(activeTab === "event" && showMyFeedback) && activeTab !== "wallet" && (
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
              )}
            </div>
          </div>

          {/* Loading State (override for My Feedback) */}
          {(activeTab === "event" && showMyFeedback) ? (
            myFeedbackLoading ? (
              <div className="text-center text-sm text-muted-foreground py-8">Loading my feedback...</div>
            ) : myFeedbackError ? (
              <div className="text-center text-sm text-destructive py-8">Error: {myFeedbackError}</div>
            ) : feedbackGroups.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No feedback yet"
                description="You have not submitted any feedback for your events."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbackGroups.map((group, idx) => {
                  const cardKey = `${group.eventId}-${idx}`
                  const expanded = expandedEventKey === cardKey
                  return (
                    <Card key={cardKey} className="border-l-4 border-l-blue-500 dark:border-l-blue-400 transition-all hover:shadow-md">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3
                              className="font-medium hover:underline cursor-pointer truncate"
                              onClick={() => setExpandedEventKey((prev) => (prev === cardKey ? null : cardKey))}
                              title={group.eventName}
                            >
                              {group.eventName}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {group.clubName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {group.items.length} feedback{group.items.length > 1 ? "s" : ""}
                            </p>
                          </div>
                          <button
                            className="px-2 py-1 rounded-md border hover:bg-muted"
                            onClick={() => setExpandedEventKey((prev) => (prev === cardKey ? null : cardKey))}
                            aria-label="Toggle feedback list"
                          >
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>

                        {expanded && (
                          <div className="mt-4 space-y-3">
                            {group.items.map((fb) => (
                              <div key={fb.feedbackId} className="p-3 rounded-md border bg-muted/30">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-medium truncate">
                                    {fb.memberName || "You"}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {[1,2,3,4,5].map((i) => (
                                      <Star
                                        key={i}
                                        className={`h-3.5 w-3.5 ${i <= fb.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm mt-1">{fb.comment}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(fb.createdAt).toLocaleString()}
                                  {fb.updatedAt ? ` • Updated: ${new Date(fb.updatedAt).toLocaleDateString()}` : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          ) : activeTab === "wallet" ? (
            // Wallet Tab Content
            walletLoading ? (
              <div className="text-center text-sm text-muted-foreground py-8">Loading wallet...</div>
            ) : walletError ? (
              <div className="text-center text-sm text-destructive py-8">Error: {walletError}</div>
            ) : !myWallet ? (
              <EmptyState
                icon={Wallet}
                title="No wallet found"
                description="Unable to load your wallet information."
              />
            ) : (
              <div className="space-y-4">
                {/* Wallet Summary Card */}
                <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">My Wallet</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {myWallet.clubName || "Personal Wallet"}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <span className="text-sm text-muted-foreground">Balance:</span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {myWallet.balancePoints} pts
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm text-muted-foreground">Owner Type:</span>
                            <Badge variant="outline">{myWallet.ownerType}</Badge>
                          </div>
                          {myWallet.clubId && (
                            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                              <span className="text-sm text-muted-foreground">Club ID:</span>
                              <span className="text-sm font-medium">#{myWallet.clubId}</span>
                            </div>
                          )}
                          {myWallet.userFullName && (
                            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                              <span className="text-sm text-muted-foreground">Owner:</span>
                              <span className="text-sm font-medium">{myWallet.userFullName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction History */}
                <div>
                  <h3 className="font-medium text-lg mb-3">Transaction History</h3>
                  {walletTransactions.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <EmptyState
                          icon={History}
                          title="No transactions yet"
                          description="Your transaction history will appear here."
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {walletTransactions.map((transaction) => {
                        const isIncoming = transaction.signedAmount.startsWith("+")
                        return (
                          <Card key={transaction.id} className={`border-l-4 ${isIncoming ? "border-l-green-500 dark:border-l-green-400" : "border-l-red-500 dark:border-l-red-400"} transition-all hover:shadow-md`}>
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <div className="shrink-0">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncoming ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
                                    {isIncoming ? (
                                      <ArrowDownLeft className={`h-5 w-5 ${isIncoming ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
                                    ) : (
                                      <ArrowUpRight className={`h-5 w-5 ${isIncoming ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs">
                                          {transaction.type.replace(/_/g, " ")}
                                        </Badge>
                                        <span className={`text-lg font-bold ${isIncoming ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                          {transaction.signedAmount} pts
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {transaction.description}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        {transaction.senderName && (
                                          <span>From: <span className="font-medium">{transaction.senderName}</span></span>
                                        )}
                                        {transaction.receiverName && (
                                          <span>To: <span className="font-medium">{transaction.receiverName}</span></span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(transaction.createdAt).toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          ) : loading ? (
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
                  if (activity.type === "redemption") return "border-l-purple-500 dark:border-l-purple-400"

                  // LOGIC MÀU CHO ORDER
                  if (activity.type === "redeemOrder") {
                    const orderStatus = activity.data.status
                    if (orderStatus === "COMPLETED") return "border-l-green-500 dark:border-l-green-400"
                    if (orderStatus === "PENDING") return "border-l-yellow-500 dark:border-l-yellow-400"
                    if (
                      orderStatus === "CANCELLED" ||
                      orderStatus === "REFUNDED" ||
                      orderStatus === "PARTIALLY_REFUNDED"
                    )
                      return "border-l-red-500 dark:border-l-red-400"
                    return "border-l-gray-300 dark:border-l-gray-600"
                  }

                  // LOGIC MÀU CHO EVENT
                  if (activity.type === "event") {
                    const eventStatus = activity.data.status
                    if (eventStatus === "APPROVED" || eventStatus === "COMPLETED") return "border-l-green-500 dark:border-l-green-400"
                    if (eventStatus === "ONGOING") return "border-l-blue-500 dark:border-l-blue-400"
                    if (eventStatus === "PENDING_UNISTAFF") return "border-l-yellow-500 dark:border-l-yellow-400"
                    if (eventStatus === "REJECTED") return "border-l-red-500 dark:border-l-red-400"
                    return "border-l-gray-300 dark:border-l-gray-600"
                  }

                  const status = activity.data.status
                  if (status === "APPROVED") return "border-l-green-500 dark:border-l-green-400"
                  if (status === "COMPLETE") return "border-l-blue-500 dark:border-l-blue-400"
                  if (status === "PENDING") return "border-l-yellow-500 dark:border-l-yellow-400"
                  if (status === "REJECTED") return "border-l-red-500 dark:border-l-red-400"
                  return "border-l-gray-300 dark:border-l-gray-600"
                }

                return (
                  <Card key={index} className={`border-l-4 ${getBorderColor()} transition-all hover:shadow-md`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0">
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
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                                        : activity.data.status === "COMPLETE"
                                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                          : activity.data.status === "PENDING"
                                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                                            : "bg-red-100 dark:bg-red-900/70 text-red-800 dark:text-red-100 border-red-300 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-900/80"
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
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                                      : activity.data.status === "PENDING"
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                                        : "bg-red-100 dark:bg-red-900/70 text-red-800 dark:text-red-100 border-red-300 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-900/80" // Áp dụng cho CANCELLED, REFUNDED, PARTIALLY_REFUNDED
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
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                                      : activity.data.status === "ONGOING"
                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                        : activity.data.status === "PENDING_UNISTAFF"
                                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                                          : "bg-red-100 dark:bg-red-900/70 text-red-800 dark:text-red-100 border-red-300 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-900/80"
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

          {/* Pagination - only show when there's data and not on wallet tab */}
          {!loading && !error && activitiesToDisplay.length > 0 && activeTab !== "wallet" && (
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
