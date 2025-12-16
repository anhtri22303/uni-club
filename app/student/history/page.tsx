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
import { History, UserPlus, Gift, CheckCircle, Users, Building2, Package, Calendar, MessageSquare, ChevronDown, ChevronUp, Star, Wallet, ArrowUpRight, ArrowDownLeft, ClipboardCheck } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { getMyFeedbackByMembershipId, Feedback } from "@/service/feedbackApi"
import { getWallet, getWalletTransactions, ApiWallet, ApiWalletTransaction } from "@/service/walletApi"
import { getStaffHistory, StaffHistoryOrder } from "@/service/eventStaffApi"
import { getOrderLogsByMembershipAndOrder, OrderLog } from "@/service/redeemApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { timeObjectToString } from "@/service/eventApi"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

// Removed static `src/data` imports — use empty fallbacks. Prefer remote `clubName` from activity data when available.
const clubs: any[] = []
const offers: any[] = []

export default function MemberHistoryPage() {
  const { auth } = useAuth()
  const { membershipApplications, vouchers } = useData()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<"member" | "club" | "order" | "event" | "wallet">("member")
  
  // Check for tab query parameter on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'wallet') {
      setActiveTab('wallet')
      // Load wallet data immediately
      if (!myWallet) {
        loadWalletData()
      }
    }
  }, [searchParams])
  
  // Wallet state
  const [myWallet, setMyWallet] = useState<ApiWallet | null>(null)
  const [walletTransactions, setWalletTransactions] = useState<ApiWalletTransaction[]>([])
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [walletTypeFilter, setWalletTypeFilter] = useState<string>("all")
  const [walletDateFilter, setWalletDateFilter] = useState<string>("all")
  const [walletCurrentPage, setWalletCurrentPage] = useState(1)
  const [walletPageSize, setWalletPageSize] = useState(6)
  
  // Order filter state
  const [orderProductTypeFilter, setOrderProductTypeFilter] = useState<string>("all")
  
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
    setOrderProductTypeFilter("all") // Reset order product type filter
    
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
      // First get wallet to obtain walletId
      const walletResponse = await getWallet()
      setMyWallet(walletResponse.data)
      
      // Then fetch transactions using the walletId
      if (walletResponse.data?.walletId) {
        const transactions = await getWalletTransactions(walletResponse.data.walletId)
        setWalletTransactions(transactions || [])
      }
    } catch (err: any) {
      setWalletError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load wallet")
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
  const [feedbackCurrentPage, setFeedbackCurrentPage] = useState(1)
  const [feedbackPageSize, setFeedbackPageSize] = useState(6)

  // === Staff History state (within Order History tab) ===
  const [showStaffHistory, setShowStaffHistory] = useState(false)
  const [staffHistoryOrders, setStaffHistoryOrders] = useState<StaffHistoryOrder[]>([])
  const [staffHistoryLoading, setStaffHistoryLoading] = useState(false)
  const [staffHistoryError, setStaffHistoryError] = useState<string | null>(null)
  const [staffHistoryCurrentPage, setStaffHistoryCurrentPage] = useState(1)
  const [staffHistoryPageSize, setStaffHistoryPageSize] = useState(6)

  // === Order Logs Modal state ===
  const [selectedOrderForLogs, setSelectedOrderForLogs] = useState<any | null>(null)
  const [isOrderLogsModalOpen, setIsOrderLogsModalOpen] = useState(false)

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
        setFeedbackCurrentPage(1) // Reset to page 1
        const data = await getMyFeedbackByMembershipId(selectedMembershipId)
        setMyFeedbacks(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setMyFeedbackError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load feedbacks")
      } finally {
        setMyFeedbackLoading(false)
      }
    }
    load()
  }, [showMyFeedback, selectedMembershipId])

  // Fetch staff history when toggled on
  useEffect(() => {
    const load = async () => {
      if (!showStaffHistory) return
      try {
        setStaffHistoryLoading(true)
        setStaffHistoryError(null)
        setStaffHistoryCurrentPage(1) // Reset to page 1
        const data = await getStaffHistory()
        setStaffHistoryOrders(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setStaffHistoryError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load staff history")
      } finally {
        setStaffHistoryLoading(false)
      }
    }
    load()
  }, [showStaffHistory])

  // Query for order logs when modal is open
  const { data: orderLogs = [], isLoading: orderLogsLoading, error: orderLogsError } = useQuery<OrderLog[]>({
    queryKey: ["orderLogs", selectedOrderForLogs?.orderId, selectedOrderForLogs?.membershipId],
    queryFn: async () => {
      if (!selectedOrderForLogs?.orderId || !selectedOrderForLogs?.membershipId) {
        return []
      }
      try {
        const logs = await getOrderLogsByMembershipAndOrder(
          selectedOrderForLogs.membershipId,
          selectedOrderForLogs.orderId
        )
        return logs
      } catch (error: any) {
        console.error("Failed to fetch order logs:", error)
        return []
      }
    },
    enabled: !!selectedOrderForLogs?.orderId && !!selectedOrderForLogs?.membershipId && isOrderLogsModalOpen,
    retry: 1,
  })

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

  // Helper function to get status priority for sorting
  const getStatusPriority = (status: string): number => {
    const statusMap: Record<string, number> = {
      'PENDING': 1,
      'PENDING_UNISTAFF': 1,
      'APPROVED': 2,
      'COMPLETED': 3,
      'REJECTED': 4,
      'CANCELLED': 5,
      'REFUNDED': 5,
      'PARTIALLY_REFUNDED': 5,
      'ONGOING': 2,
      'COMPLETE': 3,
    }
    return statusMap[status] || 99
  }

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
  ].sort((a, b) => {
    const statusA = a.data.status || 'UNKNOWN'
    const statusB = b.data.status || 'UNKNOWN'
    
    // PENDING always comes first
    if (statusA === "PENDING" && statusB !== "PENDING") return -1
    if (statusB === "PENDING" && statusA !== "PENDING") return 1
    
    // Both are PENDING - sort by date (newest first)
    if (statusA === "PENDING" && statusB === "PENDING") {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
    
    // Neither is PENDING - sort by date first
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    
    if (dateA !== dateB) {
      return dateB - dateA // Newest first
    }
    
    // Same date - prioritize APPROVED over REJECTED
    if (statusA === "APPROVED" && statusB !== "APPROVED") return -1
    if (statusB === "APPROVED" && statusA !== "APPROVED") return 1
    if (statusA === "REJECTED" && statusB !== "REJECTED") return 1
    if (statusB === "REJECTED" && statusA !== "REJECTED") return -1
    
    return 0
  })

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
  })).sort((a, b) => {
    const statusA = a.data.status
    const statusB = b.data.status
    
    // PENDING always comes first
    if (statusA === "PENDING" && statusB !== "PENDING") return -1
    if (statusB === "PENDING" && statusA !== "PENDING") return 1
    
    // Both are PENDING - sort by date (newest first)
    if (statusA === "PENDING" && statusB === "PENDING") {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
    
    // Neither is PENDING - sort by date first
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    
    if (dateA !== dateB) {
      return dateB - dateA // Newest first
    }
    
    // Same date - prioritize APPROVED over REJECTED
    if (statusA === "APPROVED" && statusB !== "APPROVED") return -1
    if (statusB === "APPROVED" && statusA !== "APPROVED") return 1
    if (statusA === "REJECTED" && statusB !== "REJECTED") return 1
    if (statusB === "REJECTED" && statusA !== "REJECTED") return -1
    
    return 0
  })

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
        membershipId: order.membershipId,
      },
    }))
    .sort((a, b) => {
      const statusA = a.data.status
      const statusB = b.data.status
      
      // PENDING always comes first
      if (statusA === "PENDING" && statusB !== "PENDING") return -1
      if (statusB === "PENDING" && statusA !== "PENDING") return 1
      
      // Both are PENDING - sort by date (newest first)
      if (statusA === "PENDING" && statusB === "PENDING") {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      
      // Neither is PENDING - sort by date first
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      
      if (dateA !== dateB) {
        return dateB - dateA // Newest first
      }
      
      // Same date - prioritize APPROVED over REJECTED
      if (statusA === "APPROVED" && statusB !== "APPROVED") return -1
      if (statusB === "APPROVED" && statusA !== "APPROVED") return 1
      if (statusA === "REJECTED" && statusB !== "REJECTED") return 1
      if (statusB === "REJECTED" && statusA !== "REJECTED") return -1
      
      return 0
    })

  // Helper functions for event date handling
  const getEventDate = (event: any): Date | null => {
    // Multi-day event - use startDate
    if (event.days && event.days.length > 0 && event.startDate) {
      const dateStr = event.startDate
      const dateParts = dateStr.split('-')
      return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
    }
    // Single-day event - use date field
    if (event.date) {
      const dateParts = event.date.split('-')
      return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
    }
    return null
  }

  const formatEventDateTime = (event: any): string => {
    // Multi-day event
    if (event.days && event.days.length > 0) {
      const firstDay = event.days[0]
      const lastDay = event.days[event.days.length - 1]
      if (event.days.length === 1) {
        return `${firstDay.date} | ${firstDay.startTime} - ${firstDay.endTime}`
      }
      return `${firstDay.date} to ${lastDay.date} | ${firstDay.startTime} - ${lastDay.endTime}`
    }
    // Single-day event
    if (event.date) {
      const startTime = timeObjectToString(event.startTime)
      const endTime = timeObjectToString(event.endTime)
      return `${event.date} | ${startTime} - ${endTime}`
    }
    return 'Date not available'
  }

  // EVENT HISTORY
  const eventActivities = (myEvents || [])
    .map((event: any) => {
      const eventDate = getEventDate(event)
      return {
        type: "event" as const,
        date: eventDate ? eventDate.toISOString() : new Date().toISOString(),
        data: {
          id: event.id,
          name: event.name,
          description: event.description,
          type: event.type,
          date: event.date,
          startDate: event.startDate,
          endDate: event.endDate,
          days: event.days,
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
      }
    })
    .sort((a, b) => {
      const statusA = a.data.status
      const statusB = b.data.status
      
      // PENDING (or PENDING_UNISTAFF) always comes first
      const isPendingA = statusA === "PENDING" || statusA === "PENDING_UNISTAFF"
      const isPendingB = statusB === "PENDING" || statusB === "PENDING_UNISTAFF"
      
      if (isPendingA && !isPendingB) return -1
      if (isPendingB && !isPendingA) return 1
      
      // Both are PENDING - sort by date (newest first)
      if (isPendingA && isPendingB) {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      
      // Neither is PENDING - sort by date first
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      
      if (dateA !== dateB) {
        return dateB - dateA // Newest first
      }
      
      // Same date - prioritize APPROVED/COMPLETED over REJECTED
      const isApprovedA = statusA === "APPROVED" || statusA === "COMPLETED"
      const isApprovedB = statusB === "APPROVED" || statusB === "COMPLETED"
      
      if (isApprovedA && !isApprovedB) return -1
      if (isApprovedB && !isApprovedA) return 1
      if (statusA === "REJECTED" && statusB !== "REJECTED") return 1
      if (statusB === "REJECTED" && statusA !== "REJECTED") return -1
      
      return 0
    })

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
    let result = activities as typeof activities
    
    // Filter by status
    if (filter !== "all") {
      result = result.filter((activity) => {
        // 'redemption' (voucher cũ) không có status, luôn hiển thị
        if (activity.type === "redemption") {
          return true
        }
        // Lọc các loại khác theo status
        return activity.data.status === filter
      }) as typeof activities
    }
    
    // Filter by productType (only for order tab)
    if (activeTab === "order" && orderProductTypeFilter !== "all") {
      result = result.filter((activity) => {
        if (activity.type === "redeemOrder") {
          return activity.data.productType === orderProductTypeFilter
        }
        return true
      }) as typeof activities
    }
    
    return result
  }, [activities, filter, activeTab, orderProductTypeFilter])

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
    initialPageSize: 6, // 6 items per page
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

  // Filter wallet transactions
  const filteredWalletTransactions = useMemo(() => {
    let filtered = [...walletTransactions]
    
    // Filter by type
    if (walletTypeFilter !== "all") {
      filtered = filtered.filter(t => t.type === walletTypeFilter)
    }
    
    // Filter by date
    if (walletDateFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.createdAt)
        
        switch (walletDateFilter) {
          case "today":
            return transactionDate >= today
          case "week":
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 7)
            return transactionDate >= weekAgo
          case "month":
            const monthAgo = new Date(today)
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return transactionDate >= monthAgo
          case "year":
            const yearAgo = new Date(today)
            yearAgo.setFullYear(yearAgo.getFullYear() - 1)
            return transactionDate >= yearAgo
          default:
            return true
        }
      })
    }
    
    return filtered
  }, [walletTransactions, walletTypeFilter, walletDateFilter])

  // Calculate wallet statistics from filtered transactions
  const walletStats = useMemo(() => {
    let totalIncoming = 0
    let totalOutgoing = 0
    
    filteredWalletTransactions.forEach(t => {
      const amount = parseInt(t.signedAmount.replace(/[^0-9-]/g, ''))
      if (amount > 0) {
        totalIncoming += amount
      } else {
        totalOutgoing += Math.abs(amount)
      }
    })
    
    return {
      totalIncoming,
      totalOutgoing,
      transactionCount: filteredWalletTransactions.length
    }
  }, [filteredWalletTransactions])

  // Paginated wallet transactions
  const paginatedWalletTransactions = useMemo(() => {
    const startIndex = (walletCurrentPage - 1) * walletPageSize
    const endIndex = startIndex + walletPageSize
    return filteredWalletTransactions.slice(startIndex, endIndex)
  }, [filteredWalletTransactions, walletCurrentPage, walletPageSize])

  const walletTotalPages = Math.ceil(filteredWalletTransactions.length / walletPageSize)

  // Paginated feedback groups
  const paginatedFeedbackGroups = useMemo(() => {
    const startIndex = (feedbackCurrentPage - 1) * feedbackPageSize
    const endIndex = startIndex + feedbackPageSize
    return feedbackGroups.slice(startIndex, endIndex)
  }, [feedbackGroups, feedbackCurrentPage, feedbackPageSize])

  const feedbackTotalPages = Math.ceil(feedbackGroups.length / feedbackPageSize)

  // Paginated staff history orders
  const paginatedStaffHistoryOrders = useMemo(() => {
    const startIndex = (staffHistoryCurrentPage - 1) * staffHistoryPageSize
    const endIndex = startIndex + staffHistoryPageSize
    return staffHistoryOrders.slice(startIndex, endIndex)
  }, [staffHistoryOrders, staffHistoryCurrentPage, staffHistoryPageSize])

  const staffHistoryTotalPages = Math.ceil(staffHistoryOrders.length / staffHistoryPageSize)

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
            {/* Left: My Feedback toggle within My Events tab OR Staff History toggle within Order tab */}
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
            
            {activeTab === "order" && (
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-2 rounded-md border transition-colors flex items-center gap-2 ${showStaffHistory ? "bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300" : "hover:bg-muted"}`}
                  onClick={() => setShowStaffHistory((v) => !v)}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Staff Approval History
                </button>
                {!showStaffHistory && (
                  <Select value={orderProductTypeFilter} onValueChange={setOrderProductTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Product Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="CLUB_ITEM">Club Item</SelectItem>
                      <SelectItem value="EVENT_ITEM">Event Item</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Right: Status filter (hidden when My Feedback/Staff History is active or on wallet tab) */}
            <div className="flex justify-end">
              {!(activeTab === "event" && showMyFeedback) && !(activeTab === "order" && showStaffHistory) && activeTab !== "wallet" && (
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full sm:w-60">
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

          {/* Loading State (override for My Feedback or Staff History) */}
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedFeedbackGroups.map((group, idx) => {
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
                
                {/* Feedback Pagination */}
                {feedbackGroups.length > feedbackPageSize && (
                  <Pagination
                    currentPage={feedbackCurrentPage}
                    totalPages={feedbackTotalPages}
                    pageSize={feedbackPageSize}
                    totalItems={feedbackGroups.length}
                    onPageChange={setFeedbackCurrentPage}
                    onPageSizeChange={(size) => {
                      setFeedbackPageSize(size)
                      setFeedbackCurrentPage(1)
                    }}
                    pageSizeOptions={[6, 12, 24]}
                  />
                )}
              </>
            )
          ) : (activeTab === "order" && showStaffHistory) ? (
            // Staff History Content
            staffHistoryLoading ? (
              <div className="text-center text-sm text-muted-foreground py-8">Loading staff approval history...</div>
            ) : staffHistoryError ? (
              <div className="text-center text-sm text-destructive py-8">Error: {staffHistoryError}</div>
            ) : staffHistoryOrders.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No staff approval history"
                description="You have not approved any orders as staff."
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedStaffHistoryOrders.map((order) => {
                  const statusColors = {
                    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
                    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                    REFUNDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                    PARTIALLY_REFUNDED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
                    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
                  }
                  const statusColor = statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"

                  return (
                    <Card key={order.orderId} className="border-l-4 border-l-green-500 dark:border-l-green-400 transition-all hover:shadow-md">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium truncate" title={order.productName}>
                              {order.productName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Order: {order.orderCode}
                            </p>
                          </div>
                          <Badge className={statusColor}>
                            {order.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Member:</span>
                            <span className="font-medium">{order.memberName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Club:</span>
                            <span className="font-medium">{order.clubName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium">{order.productType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="font-medium">{order.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Points:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{order.totalPoints} pts</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                          {order.completedAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Completed:</span>
                              <span>{new Date(order.completedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          {order.reasonRefund && (
                            <div className="pt-2 border-t">
                              <span className="text-muted-foreground">Refund Reason:</span>
                              <p className="mt-1 text-sm">{order.reasonRefund}</p>
                            </div>
                          )}
                          {order.errorImages && order.errorImages.length > 0 && (
                            <div className="pt-2 border-t">
                              <span className="text-muted-foreground">Error Images:</span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {order.errorImages.map((img, idx) => (
                                  <a
                                    key={idx}
                                    href={img}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    Image {idx + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                </div>
                
                {/* Staff History Pagination */}
                {staffHistoryOrders.length > staffHistoryPageSize && (
                  <Pagination
                    currentPage={staffHistoryCurrentPage}
                    totalPages={staffHistoryTotalPages}
                    pageSize={staffHistoryPageSize}
                    totalItems={staffHistoryOrders.length}
                    onPageChange={setStaffHistoryCurrentPage}
                    onPageSizeChange={(size) => {
                      setStaffHistoryPageSize(size)
                      setStaffHistoryCurrentPage(1)
                    }}
                    pageSizeOptions={[6, 12, 24]}
                  />
                )}
              </>
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Wallet Info */}
                      <div className="lg:col-span-1">
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
                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <span className="text-sm text-muted-foreground">Balance:</span>
                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {myWallet.balancePoints} pts
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                <span className="text-sm text-muted-foreground">Owner Type:</span>
                                <Badge
                                  variant="outline"
                                  className={myWallet.ownerType === 'USER' ? 'bg-blue-600 text-white border-blue-600' : ''}
                                >
                                  {myWallet.ownerType}
                                </Badge>
                              </div>
                              {myWallet.userFullName && (
                                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                  <span className="text-sm text-muted-foreground">Owner:</span>
                                  <span className="text-sm font-medium">{myWallet.userFullName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Statistics */}
                      <div className="lg:col-span-2">
                        <div>
                          <h4 className="font-medium mb-3 text-muted-foreground">Transaction Overview</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Total Incoming */}
                              <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-5 border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-green-500/10 dark:bg-green-400/20 rounded-lg">
                                      <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                  </div>
                                  <div className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-200 dark:bg-green-900 px-2 py-1 rounded-full">
                                    Income
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">Total Incoming</p>
                                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    +{walletStats.totalIncoming}
                                  </p>
                                  <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">points received</p>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-green-500/5 dark:bg-green-400/5 rounded-full"></div>
                              </div>
                              
                              {/* Total Outgoing */}
                              <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-5 border border-red-200 dark:border-red-800 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-red-500/10 dark:bg-red-400/20 rounded-lg">
                                      <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    </div>
                                  </div>
                                  <div className="text-xs font-medium text-red-700 dark:text-red-300 bg-red-200 dark:bg-red-900 px-2 py-1 rounded-full">
                                    Expense
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-1">Total Outgoing</p>
                                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                    -{walletStats.totalOutgoing}
                                  </p>
                                  <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">points spent</p>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-red-500/5 dark:bg-red-400/5 rounded-full"></div>
                              </div>
                              
                              {/* Total Transactions */}
                              <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-5 border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/10 dark:bg-blue-400/20 rounded-lg">
                                      <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                  </div>
                                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-200 dark:bg-blue-900 px-2 py-1 rounded-full">
                                    Activity
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Total Transactions</p>
                                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {walletStats.transactionCount}
                                  </p>
                                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">completed</p>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-blue-500/5 dark:bg-blue-400/5 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction History */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-lg">Transaction History</h3>
                  </div>
                  
                  {/* Filters */}
                  {walletTransactions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Select value={walletTypeFilter} onValueChange={(value) => {
                        setWalletTypeFilter(value)
                        setWalletCurrentPage(1)
                      }}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {Array.from(new Set(walletTransactions.map(t => t.type))).sort().map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={walletDateFilter} onValueChange={(value) => {
                        setWalletDateFilter(value)
                        setWalletCurrentPage(1)
                      }}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Filter by date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {(walletTypeFilter !== "all" || walletDateFilter !== "all") && (
                        <button
                          onClick={() => {
                            setWalletTypeFilter("all")
                            setWalletDateFilter("all")
                            setWalletCurrentPage(1)
                          }}
                          className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  )}
                  {filteredWalletTransactions.length === 0 && walletTransactions.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <EmptyState
                          icon={History}
                          title={filteredWalletTransactions.length === 0 && walletTransactions.length > 0 ? "No matching transactions" : "No transactions yet"}
                          description={filteredWalletTransactions.length === 0 && walletTransactions.length > 0 ? "Try adjusting your filters to see more transactions." : "Your transaction history will appear here."}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 text-sm font-semibold">Type</th>
                              <th className="text-left p-3 text-sm font-semibold">Description</th>
                              <th className="text-left p-3 text-sm font-semibold">From/To</th>
                              <th className="text-right p-3 text-sm font-semibold">Amount</th>
                              <th className="text-left p-3 text-sm font-semibold">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedWalletTransactions.map((transaction, index) => {
                              const isIncoming = transaction.signedAmount.startsWith("+")
                              return (
                                <tr
                                  key={transaction.id}
                                  className={`border-t hover:bg-muted/30 transition-colors ${
                                    index % 2 === 0 ? "bg-background" : "bg-muted/10"
                                  }`}
                                >
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isIncoming ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
                                        {isIncoming ? (
                                          <ArrowUpRight className={`h-4 w-4 ${isIncoming ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
                                        ) : (
                                          <ArrowDownLeft className={`h-4 w-4 ${isIncoming ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
                                        )}
                                      </div>
                                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                                        {transaction.type.replace(/_/g, " ")}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <p className="text-sm">{transaction.description}</p>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-xs text-muted-foreground">
                                      {transaction.senderName && (
                                        <div>From: <span className="font-medium">{transaction.senderName}</span></div>
                                      )}
                                      {transaction.receiverName && (
                                        <div>To: <span className="font-medium">{transaction.receiverName}</span></div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className={`text-base font-bold whitespace-nowrap ${isIncoming ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                      {transaction.signedAmount} pts
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                      {new Date(transaction.createdAt).toLocaleString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Wallet Pagination */}
                  {filteredWalletTransactions.length > walletPageSize && (
                    <Pagination
                      currentPage={walletCurrentPage}
                      totalPages={walletTotalPages}
                      pageSize={walletPageSize}
                      totalItems={filteredWalletTransactions.length}
                      onPageChange={setWalletCurrentPage}
                      onPageSizeChange={(size) => {
                        setWalletPageSize(size)
                        setWalletCurrentPage(1)
                      }}
                      pageSizeOptions={[6, 12, 24]}
                    />
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
                  <Card 
                    key={index} 
                    className={`border-l-4 ${getBorderColor()} transition-all hover:shadow-md ${
                      activity.type === "redeemOrder" ? "cursor-pointer hover:border-l-8" : ""
                    }`}
                    title={activity.type === "redeemOrder" ? "Click to see detail order" : undefined}
                    onClick={() => {
                      if (activity.type === "redeemOrder") {
                        setSelectedOrderForLogs(activity.data)
                        setIsOrderLogsModalOpen(true)
                      }
                    }}
                  >
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
                                    📍 {activity.data.locationName} | 🕒 {formatEventDateTime(activity.data)}
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
                                        : activity.data.status === "COMPLETE" || activity.data.status === "COMPLETED"
                                          ? "default"
                                          : activity.data.status === "PENDING"
                                            ? "secondary"
                                            : "destructive"
                                    }
                                    className={
                                      activity.data.status === "APPROVED"
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                                        : activity.data.status === "COMPLETE" || activity.data.status === "COMPLETED"
                                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
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

          {/* Pagination - only show when there's data and not on wallet tab, staff history, or my feedback */}
          {!loading && !error && activitiesToDisplay.length > 0 && activeTab !== "wallet" && !(activeTab === "order" && showStaffHistory) && !(activeTab === "event" && showMyFeedback) && (
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
              pageSizeOptions={[6, 12, 24]}
            />
          )}
        </div>
      </AppShell>

      {/* Order Logs Modal */}
      <Dialog open={isOrderLogsModalOpen} onOpenChange={setIsOrderLogsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Logs</DialogTitle>
            <DialogDescription>
              View all logs for this order
            </DialogDescription>
          </DialogHeader>

          {orderLogsLoading ? (
            <div className="flex flex-col gap-2 py-8">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : orderLogsError ? (
            <div className="text-center py-8 text-red-500">
              Error loading order logs
            </div>
          ) : orderLogs && orderLogs.length > 0 ? (
            <div className="space-y-4">
              {orderLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Action and Date */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            log.action === "CREATE" || log.action === "COMPLETED"
                              ? "default"
                              : log.action === "REFUND" || log.action === "PARTIAL_REFUND"
                              ? "destructive"
                              : "outline"
                          }
                          className={
                            log.action === "COMPLETED"
                              ? "bg-green-500 hover:bg-green-600"
                              : ""
                          }
                        >
                          {log.action}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Actor Information */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Actor:</span>
                          <p className="font-medium">{log.actorName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target User:</span>
                          <p className="font-medium">{log.targetUserName}</p>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2">
                        <div>
                          <span className="text-muted-foreground text-xs">Quantity</span>
                          <p className="font-medium">{log.quantity}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Points Change</span>
                          <p className={`font-medium ${log.pointsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {log.pointsChange > 0 ? '+' : ''}{log.pointsChange}
                          </p>
                        </div>
                      </div>

                      {/* Reason (if exists) */}
                      {log.reason && (
                        <div className="text-sm border-t pt-2">
                          <span className="text-muted-foreground">Reason:</span>
                          <p className="mt-1">{log.reason}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No logs found for this order
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
