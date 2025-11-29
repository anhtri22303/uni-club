"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ShoppingCart, Search, CheckCircle, XCircle, Clock, Eye, Filter, DollarSign, Package, User, Hash, Calendar, Undo2,
  WalletCards, ChevronLeft, ChevronRight, ScanLine, X
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getClubIdFromToken } from "@/service/clubApi"
import { getEventRedeemOrders, RedeemOrder } from "@/service/redeemApi"
import { Skeleton } from "@/components/ui/skeleton"
import { EventRedeemScanner } from "@/components/event-redeem-scanner"

export const queryKeys = {
  eventOrders: (clubId: number) => ["eventOrders", clubId] as const,
}

type UiOrder = RedeemOrder

export default function ClubLeaderEventOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<string>("completed")
  const [clubId, setClubId] = useState<number | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // Pagination states separated for tabs
  const [pendingPage, setPendingPage] = useState(0)
  const [completedPage, setCompletedPage] = useState(0)
  const [cancelledPage, setCancelledPage] = useState(0)
  const [pageSize, setPageSize] = useState(6)

  // Filter states
  const [dateFromFilter, setDateFromFilter] = useState<string>("")
  const [dateToFilter, setDateToFilter] = useState<string>("")

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 1. Lấy clubId
  useEffect(() => {
    const id = getClubIdFromToken()
    if (id) {
      setClubId(id)
    } else {
      toast({
        title: "Error",
        description: "Can't find your Club ID.",
        variant: "destructive",
      })
    }
  }, [toast])

  // 2. Lấy dữ liệu đơn hàng Event
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery<UiOrder[], Error>({
    queryKey: queryKeys.eventOrders(clubId!),
    queryFn: () => getEventRedeemOrders(clubId!),
    enabled: !!clubId,
    staleTime: 3 * 60 * 1000,
  })

  // 3. Hàm lọc (Updated logic similar to Club Orders)
  const getFilteredOrders = (
    tabType: "pending" | "completed" | "cancelled"
  ) => {
    return orders.filter((order) => {
      // Search filter
      const matchSearch =
        searchTerm === "" ||
        order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderCode.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      let matchStatus = false
      if (tabType === "pending") {
        matchStatus = order.status === "PENDING"
      } else if (tabType === "completed") {
        matchStatus = order.status === "COMPLETED"
      } else {
        matchStatus = order.status === "CANCELLED" || order.status === "REFUNDED" || order.status === "PARTIALLY_REFUNDED"
      }

      // Date range filter
      let matchDateRange = true
      if (dateFromFilter || dateToFilter) {
        const orderDate = new Date(order.createdAt)
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter)
          fromDate.setHours(0, 0, 0, 0)
          matchDateRange = matchDateRange && orderDate >= fromDate
        }
        if (dateToFilter) {
          const toDate = new Date(dateToFilter)
          toDate.setHours(23, 59, 59, 999)
          matchDateRange = matchDateRange && orderDate <= toDate
        }
      }

      return matchSearch && matchStatus && matchDateRange
    })
  }

  // 4. Phân loại đơn hàng
  const pendingOrders = useMemo(
    () => getFilteredOrders("pending").sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [orders, searchTerm, dateFromFilter, dateToFilter]
  )
  const completedOrders = useMemo(
    () => getFilteredOrders("completed").sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.createdAt).getTime()
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.createdAt).getTime()
      return dateB - dateA
    }),
    [orders, searchTerm, dateFromFilter, dateToFilter]
  )
  const cancelledOrders = useMemo(
    () => getFilteredOrders("cancelled").sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.createdAt).getTime()
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.createdAt).getTime()
      return dateB - dateA
    }),
    [orders, searchTerm, dateFromFilter, dateToFilter]
  )

  // 5. Logic cho Stats Cards
  const completedCount = isLoading ? "-" : completedOrders.length
  const cancelledCount = isLoading ? "-" : cancelledOrders.length
  const totalPointsCompleted = isLoading
    ? "-"
    : completedOrders
      .reduce((sum, order) => sum + order.totalPoints, 0)
      .toLocaleString()

  // 6. Logic phân trang
  const [prevPendingLength, setPrevPendingLength] = useState(0)
  const [prevCompletedLength, setPrevCompletedLength] = useState(0)
  const [prevCancelledLength, setPrevCancelledLength] = useState(0)

  if (pendingOrders.length !== prevPendingLength) {
    setPrevPendingLength(pendingOrders.length)
    const lastPage = Math.max(0, Math.ceil(pendingOrders.length / pageSize) - 1)
    if (pendingPage > lastPage) setPendingPage(lastPage)
  }
  if (completedOrders.length !== prevCompletedLength) {
    setPrevCompletedLength(completedOrders.length)
    const lastPage = Math.max(0, Math.ceil(completedOrders.length / pageSize) - 1)
    if (completedPage > lastPage) setCompletedPage(lastPage)
  }
  if (cancelledOrders.length !== prevCancelledLength) {
    setPrevCancelledLength(cancelledOrders.length)
    const lastPage = Math.max(0, Math.ceil(cancelledOrders.length / pageSize) - 1)
    if (cancelledPage > lastPage) setCancelledPage(lastPage)
  }

  const paginatedPending = pendingOrders.slice(
    pendingPage * pageSize,
    pendingPage * pageSize + pageSize
  )
  const paginatedCompleted = completedOrders.slice(
    completedPage * pageSize,
    completedPage * pageSize + pageSize
  )
  const paginatedCancelled = cancelledOrders.slice(
    cancelledPage * pageSize,
    cancelledPage * pageSize + pageSize
  )

  // Callback khi scan thành công
  const handleScanSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.eventOrders(clubId!) })
  }

  // 8. Render JSX
  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold dark:text-white">Redeem Orders in Event</h1>
                <p className="text-muted-foreground dark:text-slate-400">
                  Manage event product redemption orders from members
                </p>
              </div>
              <Button
                size="default" // Match size with Club Page
                onClick={() => setIsScannerOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                disabled={!clubId}
              >
                <ScanLine className="h-5 w-5 mr-2" />
                Scan Redeem
              </Button>
            </div>
          </div>

          {/* Stats Cards (Updated to 3-grid without Pending) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 dark:border-slate-700">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-green-700 dark:text-green-300">
                  Completed Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-500 dark:bg-green-600 rounded-md">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-200">
                    {isLoading ? <Skeleton className="h-6 w-10 dark:bg-slate-700" /> : completedCount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 dark:border-slate-700">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-red-700 dark:text-red-300">
                  Cancelled/Refunded
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-500 dark:bg-red-600 rounded-md">
                    <XCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-red-900 dark:text-red-200">
                    {isLoading ? <Skeleton className="h-6 w-10 dark:bg-slate-700" /> : cancelledCount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 dark:border-slate-700">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Points Redeemed
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500 dark:bg-blue-600 rounded-md">
                    <WalletCards className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-200">
                    {isLoading ? <Skeleton className="h-6 w-16 dark:bg-slate-700" /> : totalPointsCompleted}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters (Updated to match Club Page - Open Filters) */}
          <Card className="border-muted dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2 dark:text-white">
                <Filter className="h-4 w-4" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Search className="h-4 w-4 text-muted-foreground dark:text-slate-400" />

                  <div className="relative w-full">
                    <Input
                      placeholder="Search by product, member, or code..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        // Reset phân trang cho cả 3 tab khi search thay đổi
                        setPendingPage(0)
                        setCompletedPage(0)
                        setCancelledPage(0)
                      }}
                      // Cập nhật: Thêm pr-10
                      className="pr-10 dark:bg-slate-700 dark:text-white dark:border-slate-600 
                      dark:placeholder:text-slate-400 border-slate-300"
                    />

                    {/* Nút Clear Search */}
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => {
                          setSearchTerm("")
                          // Reset phân trang về 0 khi clear
                          setPendingPage(0)
                          setCompletedPage(0)
                          setCancelledPage(0)
                        }}
                        // Style: Tuyệt đối bên phải, hover chuyển màu Primary
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-400 hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap dark:text-white">
                    From:
                  </label>
                  <Input
                    type="date"
                    className="w-auto dark:bg-slate-700 dark:text-white dark:border-slate-600"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap dark:text-white">
                    To:
                  </label>
                  <Input
                    type="date"
                    className="w-auto dark:bg-slate-700 dark:text-white dark:border-slate-600"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                  />
                </div>
                {(dateFromFilter || dateToFilter) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateFromFilter("")
                      setDateToFilter("")
                    }}
                    className="dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                  >
                    Clear Dates
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs (New addition for Event Page) */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 gap-3">
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed ({completedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Cancelled/Refunded ({cancelledOrders.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab Content: COMPLETED */}
            <TabsContent value="completed" className="space-y-4 mt-6">
              <RenderOrderList
                isLoading={isLoading}
                error={error}
                orders={paginatedCompleted}
                emptyMessage="No completed orders found."
              />
              <PaginationControls
                currentPage={completedPage}
                setPage={setCompletedPage}
                totalItems={completedOrders.length}
                pageSize={pageSize}
                setPageSize={setPageSize}
              />
            </TabsContent>

            {/* Tab Content: CANCELLED */}
            <TabsContent value="cancelled" className="space-y-4 mt-6">
              <RenderOrderList
                isLoading={isLoading}
                error={error}
                orders={paginatedCancelled}
                emptyMessage="No cancelled or refunded orders found."
              />
              <PaginationControls
                currentPage={cancelledPage}
                setPage={setCancelledPage}
                totalItems={cancelledOrders.length}
                pageSize={pageSize}
                setPageSize={setPageSize}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Event Redeem Scanner Modal */}
        <EventRedeemScanner
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onSuccess={handleScanSuccess}
        />
      </AppShell>
    </ProtectedRoute>
  )
}

// --- Component con để render danh sách (Cập nhật style giống trang Club) ---
function RenderOrderList({
  isLoading,
  error,
  orders,
  emptyMessage,
}: {
  isLoading: boolean
  error: Error | null
  orders: UiOrder[]
  emptyMessage: string
}) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full dark:bg-slate-700" />
        <Skeleton className="h-40 w-full dark:bg-slate-700" />
        <Skeleton className="h-40 w-full dark:bg-slate-700" />
        <Skeleton className="h-40 w-full dark:bg-slate-700" />
      </div>
    )
  }
  if (error) {
    return (
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="py-8 text-center text-destructive dark:text-red-400">
          {String(error.message)}
        </CardContent>
      </Card>
    )
  }
  if (orders.length === 0) {
    return (
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="py-8 text-center text-muted-foreground dark:text-slate-400">
          {emptyMessage}
        </CardContent>
      </Card>
    )
  }

  // Hàm render Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge
            variant="default"
            className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      case "REFUNDED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Refunded
          </Badge>
        )
      case "PARTIALLY_REFUNDED":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Partially Refunded
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {orders.map((order) => {
        // Determine status styling
        const gradientClasses =
          order.status === "PENDING" ? "from-yellow-50 via-white to-white dark:from-yellow-900/20 dark:via-slate-800 dark:to-slate-800" :
            order.status === "COMPLETED" ? "from-green-50 via-white to-white dark:from-green-900/20 dark:via-slate-800 dark:to-slate-800" :
              (order.status === "CANCELLED" || order.status.includes("REFUNDED")) ? "from-red-50 via-white to-white dark:from-red-900/20 dark:via-slate-800 dark:to-slate-800" :
                "from-blue-50 via-white to-white dark:from-blue-900/20 dark:via-slate-800 dark:to-slate-800"

        return (
          <Link
            key={order.orderId}
            href={`/club-leader/event-order-list/${order.orderId}`}
            className="group"
          >
            <Card className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br 
              ${gradientClasses} dark:border-slate-700 overflow-hidden relative`}>
              {/* Decorative top border */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${order.status === "PENDING" ? "from-yellow-400 via-yellow-500 to-yellow-600" :
                  order.status === "COMPLETED" ? "from-green-400 via-green-500 to-green-600" :
                    (order.status === "CANCELLED" || order.status.includes("REFUNDED")) ? "from-red-400 via-red-500 to-red-600" : "from-blue-400 via-blue-500 to-blue-600"
                }`} />

              <CardContent className="p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${order.status === "PENDING" ? "from-yellow-400 to-yellow-500" :
                        order.status === "COMPLETED" ? "from-green-400 to-green-500" :
                          (order.status === "CANCELLED" || order.status.includes("REFUNDED")) ? "from-red-400 to-red-500" : "from-blue-400 to-blue-500"
                      } shadow-lg flex-shrink-0`}>
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                        {order.productName}
                      </h3>
                      <p className="text-sm text-muted-foreground dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Hash className="h-3 w-3" />
                        {order.orderCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Member Information */}
                <div className="mb-4 p-3 bg-white/80 dark:bg-slate-700/50 backdrop-blur-sm rounded-lg border border-gray-100 dark:border-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-800/50 dark:to-purple-800/50 rounded-lg">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400 font-medium">Ordered by</p>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{order.memberName}</p>
                    </div>
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border 
                  border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Quantity</span>
                    </div>
                    <p className="text-xl font-bold text-purple-900 dark:text-purple-200">{order.quantity.toLocaleString('en-US')}</p>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <WalletCards className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Points</span>
                    </div>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-200">{order.totalPoints.toLocaleString('en-US')}</p>
                  </div>
                </div>

                {/* Date Footer */}
                <div className="pt-3 border-t border-gray-200/60 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 
                      hover:text-white group-hover:shadow-lg transition-all"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20 dark:to-slate-700/20 opacity-0 
              group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

// --- Component con để Phân trang (Giữ nguyên) ---
function PaginationControls({
  currentPage,
  setPage,
  totalItems,
  pageSize,
  setPageSize,
}: {
  currentPage: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  totalItems: number
  pageSize: number
  setPageSize: (size: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const isFirstPage = currentPage === 0
  const isLastPage = (currentPage + 1) * pageSize >= totalItems

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value))
    setPage(0)
  }

  return (
    <div className="flex items-center justify-center mt-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={isFirstPage}
          className={`
            flex items-center gap-1 px-3 py-1.5 text-sm font-medium
            transition-colors
            ${isFirstPage
              ? 'text-muted-foreground/50 cursor-not-allowed'
              : 'text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer'
            }
          `}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>
        <span className="text-sm font-medium text-cyan-500 dark:text-cyan-400 px-2">
          {totalItems === 0 ? 0 : currentPage + 1}/{totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
          disabled={isLastPage}
          className={`
            flex items-center gap-1 px-3 py-1.5 text-sm font-medium
            transition-colors
            ${isLastPage
              ? 'text-muted-foreground/50 cursor-not-allowed'
              : 'text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer'
            }
          `}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}