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
  WalletCards,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getClubIdFromToken } from "@/service/clubApi"
import { getClubRedeemOrders, RedeemOrder } from "@/service/redeemApi"
import { Skeleton } from "@/components/ui/skeleton"

// Đặt key cho react-query
export const queryKeys = {
  clubOrders: (clubId: number) => ["clubOrders", clubId] as const,
}

// Định nghĩa kiểu dữ liệu cho UI (dùng trực tiếp từ API)
type UiOrder = RedeemOrder

export default function ClubLeaderOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<string>("pending")
  const [clubId, setClubId] = useState<number | null>(null)

  // Pagination states
  const [pendingPage, setPendingPage] = useState(0)
  const [completedPage, setCompletedPage] = useState(0)
  const [cancelledPage, setCancelledPage] = useState(0)
  const [pageSize, setPageSize] = useState(6) // Giảm xuống 6 cho đẹp hơn

  // Filter states
  const [dateFromFilter, setDateFromFilter] = useState<string>("")
  const [dateToFilter, setDateToFilter] = useState<string>("")

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 1. Lấy clubId của leader
  useEffect(() => {
    const id = getClubIdFromToken()
    if (id) {
      setClubId(id)
    } else {
      toast({
        title: "Error",
        description: "Can't find your Club ID?.",
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
    queryKey: queryKeys.clubOrders(clubId!),
    queryFn: () => getClubRedeemOrders(clubId!),
    enabled: !!clubId, // Chỉ chạy khi clubId đã được set
    staleTime: 3 * 60 * 1000, // 3 phút
  })

  // 3. Hàm lọc (Đã cập nhật cho đơn hàng)
  const getFilteredOrders = (
    tabType: "pending" | "completed" | "cancelled"
  ) => {
    return orders.filter((order) => {
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

  // 4. Phân loại đơn hàng
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

  // 5. Logic cho Stats Cards (Thẻ thống kê)
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

  // 7. Hàm hiển thị Badge (Huy hiệu) theo trạng thái
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-300"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-700 border-green-300"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-700 border-red-300"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      case "REFUNDED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-300"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Refunded
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
        {/* Xóa nút + (floating button) */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Redeem Orders in Club</h1>
            </div>
            <p className="text-muted-foreground">
              Manage product redemption orders from members
            </p>
          </div>

          {/* Xóa Modal (vì đã xóa nút +) */}

          {/* Stats Cards (Đã cập nhật) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-yellow-700">
                  Pending Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-yellow-500 rounded-md">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-yellow-900">
                    {isLoading ? <Skeleton className="h-6 w-10" /> : pendingCount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-green-700">
                  Completed Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-500 rounded-md">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {isLoading ? <Skeleton className="h-6 w-10" /> : completedCount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-red-700">
                  Cancelled/Refunded
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-500 rounded-md">
                    <XCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-red-900">
                    {isLoading ? <Skeleton className="h-6 w-10" /> : cancelledCount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-blue-700">
                  Points Redeemed
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500 rounded-md">
                    <WalletCards className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {isLoading ? <Skeleton className="h-6 w-16" /> : totalPointsCompleted}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters (Đã cập nhật - Bỏ Major) */}
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

          {/* Tabs (Đã cập nhật) */}
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
                emptyMessage="No pending orders found."
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
      </AppShell>
    </ProtectedRoute>
  )
}

// --- Component con để render danh sách (cho gọn) ---
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

  // Hàm render Badge (sao chép từ trên xuống)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-300"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-700 border-green-300"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-700 border-red-300"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      case "REFUNDED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-300"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Refunded
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {orders.map((order) => (
        <Card
          key={order.orderId}
          className="hover:shadow-md transition-shadow"
        >
          {/* Link to detail page */}
          <Link href={`/club-leader/club-order-list/${order.orderId}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                {/* Chi tiết đơn hàng */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {order.productName}
                    </h3>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5" title="Order Code">
                      <Hash className="h-4 w-4" />
                      <span>{order.orderCode}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Member">
                      <User className="h-4 w-4" />
                      <span className="line-clamp-1">{order.memberName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5" title="Quantity">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Quantity: {order.quantity.toLocaleString('en-US')}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Total Points">
                      <WalletCards className="h-4 w-4" />
                      <span>{order.totalPoints.toLocaleString('en-US')} points</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Ordered: {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Nút View (để căn phải) */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 bg-transparent"
                    asChild // Để Button hoạt động như Link
                  >
                    <span>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
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

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value))
    setPage(0) // Reset về trang đầu khi đổi page size
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Showing {totalItems === 0 ? 0 : currentPage * pageSize + 1} to{" "}
        {Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems}{" "}
        orders
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage(0)}
          disabled={isFirstPage}
        >
          First
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={isFirstPage}
        >
          Prev
        </Button>
        <div className="px-2 text-sm">
          Page {totalItems === 0 ? 0 : currentPage + 1} / {totalPages}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
          disabled={isLastPage}
        >
          Next
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage(totalPages - 1)}
          disabled={isLastPage}
        >
          Last
        </Button>
        <select
          aria-label="Items per page"
          className="ml-2 rounded border px-2 py-1 text-sm h-9 bg-transparent"
          value={pageSize}
          onChange={handlePageSizeChange}
        >
          <option value={6}>6 / page</option>
          <option value={12}>12 / page</option>
          <option value={24}>24 / page</option>
        </select>
      </div>
    </div>
  )
}