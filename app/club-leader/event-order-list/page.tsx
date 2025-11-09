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
  WalletCards, ChevronLeft, ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getClubIdFromToken } from "@/service/clubApi"
// 👈 Giả định RedeemOrder có chứa 'productType'
import { getClubRedeemOrders, RedeemOrder } from "@/service/redeemApi"
import { Skeleton } from "@/components/ui/skeleton"

// 👈 Đổi tên Key
export const queryKeys = {
  eventOrders: (clubId: number) => ["eventOrders", clubId] as const,
}

// Định nghĩa kiểu dữ liệu cho UI (dùng trực tiếp từ API)
type UiOrder = RedeemOrder

// 👈 Đổi tên Component
export default function ClubLeaderEventOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<string>("pending")
  const [clubId, setClubId] = useState<number | null>(null)

  // Pagination states
  const [pendingPage, setPendingPage] = useState(0)
  const [completedPage, setCompletedPage] = useState(0)
  const [cancelledPage, setCancelledPage] = useState(0)
  const [pageSize, setPageSize] = useState(6)

  // Filter states
  const [dateFromFilter, setDateFromFilter] = useState<string>("")
  const [dateToFilter, setDateToFilter] = useState<string>("")

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 1. Lấy clubId của leader (Giữ nguyên)
  useEffect(() => {
    const id = getClubIdFromToken()
    if (id) {
      setClubId(id)
    } else {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy Club ID của bạn.",
        variant: "destructive",
      })
    }
  }, [toast])

  // 2. Lấy dữ liệu đơn hàng cho clubId này
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery<UiOrder[], Error>({
    queryKey: queryKeys.eventOrders(clubId!), // 👈 Đổi Key
    queryFn: () => getClubRedeemOrders(clubId!), // Vẫn dùng API cũ để lấy tất cả
    enabled: !!clubId,
    staleTime: 3 * 60 * 1000,
  })

  // 3. 🛑 HÀM LỌC (ĐÃ CẬP NHẬT) 🛑
  const getFilteredOrders = (
    tabType: "pending" | "completed" | "cancelled"
  ) => {
    return orders.filter((order) => {
      // 👈 THÊM BỘ LỌC MỚI: Chỉ lấy Event Items
      const isEventItem = (order as any).productType === "EVENT_ITEM";
      if (!isEventItem) {
        return false;
      }

      // Search filter (Tên sản phẩm, Tên thành viên, Mã đơn)
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
        matchStatus = order.status === "CANCELLED" || order.status === "REFUNDED"
      }

      // Date range filter
      let matchDateRange = true
      if (dateFromFilter || dateToFilter) {
        const orderDate = new Date(order.createdAt)
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter)
          fromDate.setHours(0, 0, 0, 0) // Bắt đầu ngày
          matchDateRange = matchDateRange && orderDate >= fromDate
        }
        if (dateToFilter) {
          const toDate = new Date(dateToFilter)
          toDate.setHours(23, 59, 59, 999) // Kết thúc ngày
          matchDateRange = matchDateRange && orderDate <= toDate
        }
      }

      return matchSearch && matchStatus && matchDateRange
    })
  }

  // 4. Phân loại đơn hàng (Giữ nguyên)
  const pendingOrders = useMemo(
    () => getFilteredOrders("pending"),
    [orders, searchTerm, dateFromFilter, dateToFilter]
  )
  const completedOrders = useMemo(
    () => getFilteredOrders("completed"),
    [orders, searchTerm, dateFromFilter, dateToFilter]
  )
  const cancelledOrders = useMemo(
    () => getFilteredOrders("cancelled"),
    [orders, searchTerm, dateFromFilter, dateToFilter]
  )

  // 5. Logic cho Stats Cards (Giữ nguyên)
  const pendingCount = isLoading ? "-" : pendingOrders.length
  const completedCount = isLoading ? "-" : completedOrders.length
  const cancelledCount = isLoading ? "-" : cancelledOrders.length
  const totalPointsCompleted = isLoading
    ? "-"
    : completedOrders
      .reduce((sum, order) => sum + order.totalPoints, 0)
      .toLocaleString()

  // 6. Logic phân trang (Giữ nguyên từ file mẫu)
  // (Phần này dài, giữ logic từ file gốc, chỉ đổi tên biến)
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

  // 7. Hàm hiển thị Badge (Huy hiệu) theo trạng thái với gradient styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 shadow-lg">
            <Clock className="h-4 w-4 mr-1.5" />
            Pending
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-lg">
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Delivered
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge className="px-4 py-2 bg-gradient-to-r from-red-400 to-rose-500 text-white border-0 shadow-lg">
            <XCircle className="h-4 w-4 mr-1.5" />
            Cancelled
          </Badge>
        )
      case "REFUNDED":
        return (
          <Badge className="px-4 py-2 bg-gradient-to-r from-blue-400 to-cyan-500 text-white border-0 shadow-lg">
            <Undo2 className="h-4 w-4 mr-1.5" />
            Refunded
          </Badge>
        )
      case "PARTIALLY_REFUNDED":
        return (
          <Badge className="px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-500 text-white border-0 shadow-lg">
            <Undo2 className="h-4 w-4 mr-1.5" />
            Partially Refunded
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 8. Render JSX
  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Redeem Orders in Event</h1>
            </div>
            <p className="text-muted-foreground">
              Manage event product redemption orders from members
            </p>
          </div>

          {/* Stats Cards (Giữ nguyên) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  Pending Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-yellow-500 rounded-md">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-yellow-900 dark:text-yellow-200">
                    {isLoading ? <Skeleton className="h-6 w-10" /> : pendingCount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-green-700 dark:text-green-300">
                  Completed Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-500 rounded-md">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-200">
                    {isLoading ? <Skeleton className="h-6 w-10" /> : completedCount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-red-700 dark:text-red-300">
                  Cancelled/Refunded
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-500 rounded-md">
                    <XCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-red-900 dark:text-red-200">
                    {isLoading ? <Skeleton className="h-6 w-10" /> : cancelledCount}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Points Redeemed
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500 rounded-md">
                    <WalletCards className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-200">
                    {isLoading ? <Skeleton className="h-6 w-16" /> : totalPointsCompleted}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters (Giữ nguyên) */}
          <Card className="border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product, member, or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* <div> (Phần Major filter đã bị xóa) </div> */}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">
                    From:
                  </label>
                  <Input
                    type="date"
                    className="w-auto"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">
                    To:
                  </label>
                  <Input
                    type="date"
                    className="w-auto"
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
                  >
                    Clear Dates
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs (Giữ nguyên) */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 gap-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed ({completedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Cancelled/Refunded ({cancelledOrders.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab Content: PENDING */}
            <TabsContent value="pending" className="space-y-4 mt-6">
              <RenderOrderList
                isLoading={isLoading}
                error={error}
                orders={paginatedPending}
                emptyMessage="No pending event orders found." // 👈 Đổi text
              />
              <PaginationControls
                currentPage={pendingPage}
                setPage={setPendingPage}
                totalItems={pendingOrders.length}
                pageSize={pageSize}
                setPageSize={setPageSize}
              />
            </TabsContent>

            {/* Tab Content: COMPLETED */}
            <TabsContent value="completed" className="space-y-4 mt-6">
              <RenderOrderList
                isLoading={isLoading}
                error={error}
                orders={paginatedCompleted}
                emptyMessage="No completed event orders found." // 👈 Đổi text
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
                emptyMessage="No cancelled or refunded event orders found." // 👈 Đổi text
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
      </AppShell>
    </ProtectedRoute>
  )
}

// --- Component con để render danh sách (Giữ nguyên) ---
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
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {String(error.message)}
        </CardContent>
      </Card>
    )
  }
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    )
  }

  // Hàm render Badge (với gradient styling)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 shadow-lg">
            <Clock className="h-4 w-4 mr-1.5" />
            Pending
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-lg">
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Delivered
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge className="px-4 py-2 bg-gradient-to-r from-red-400 to-rose-500 text-white border-0 shadow-lg">
            <XCircle className="h-4 w-4 mr-1.5" />
            Cancelled
          </Badge>
        )
      case "REFUNDED":
        return (
          <Badge className="px-4 py-2 bg-gradient-to-r from-blue-400 to-cyan-500 text-white border-0 shadow-lg">
            <Undo2 className="h-4 w-4 mr-1.5" />
            Refunded
          </Badge>
        )
      case "PARTIALLY_REFUNDED":
        return (
          <Badge className="px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-500 text-white border-0 shadow-lg">
            <Undo2 className="h-4 w-4 mr-1.5" />
            Partially Refunded
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {orders.map((order) => {
        const gradientClasses = 
          order.status === "PENDING" ? "from-yellow-50 via-white to-white dark:from-yellow-900/20 dark:via-slate-800 dark:to-slate-800" :
          order.status === "COMPLETED" ? "from-green-50 via-white to-white dark:from-green-900/20 dark:via-slate-800 dark:to-slate-800" :
          order.status === "CANCELLED" ? "from-red-50 via-white to-white dark:from-red-900/20 dark:via-slate-800 dark:to-slate-800" : "from-blue-50 via-white to-white dark:from-blue-900/20 dark:via-slate-800 dark:to-slate-800"

        return (
          <Link 
            key={order.orderId} 
            href={`/club-leader/event-order-list/${order.orderId}`}
            className="group"
          >
            <Card className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${gradientClasses} overflow-hidden relative`}>
              {/* Decorative top border */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${
                order.status === "PENDING" ? "from-yellow-400 via-yellow-500 to-yellow-600" :
                order.status === "COMPLETED" ? "from-green-400 via-green-500 to-green-600" :
                order.status === "CANCELLED" ? "from-red-400 via-red-500 to-red-600" : "from-blue-400 via-blue-500 to-blue-600"
              }`} />
              
              <CardContent className="p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${
                      order.status === "PENDING" ? "from-yellow-400 to-yellow-500" :
                      order.status === "COMPLETED" ? "from-green-400 to-green-500" :
                      order.status === "CANCELLED" ? "from-red-400 to-red-500" : "from-blue-400 to-blue-500"
                    } shadow-lg flex-shrink-0`}>
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-primary transition-colors">
                        {order.productName}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
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
                <div className="mb-4 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Ordered by</p>
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{order.memberName}</p>
                    </div>
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Quantity</span>
                    </div>
                    <p className="text-xl font-bold text-purple-900 dark:text-purple-200">{order.quantity.toLocaleString('en-US')}</p>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <WalletCards className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Points</span>
                    </div>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-200">{order.totalPoints.toLocaleString('en-US')}</p>
                  </div>
                </div>

                {/* Date Footer */}
                <div className="pt-3 border-t border-gray-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                      <span>View Details</span>
                      <Eye className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

// --- Component con để Phân trang (cho gọn) ---
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