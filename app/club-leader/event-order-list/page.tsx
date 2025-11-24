"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  ShoppingCart, Search, CheckCircle, XCircle, Clock, Eye, Filter, DollarSign, Package, User, Hash, Calendar, Undo2,
  WalletCards, ChevronLeft, ChevronRight, ScanLine,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getClubIdFromToken } from "@/service/clubApi"
import { getAllEventOrdersByClub, RedeemOrder } from "@/service/redeemApi"
import { Skeleton } from "@/components/ui/skeleton"
import { EventRedeemScanner } from "@/components/event-redeem-scanner"

// 👈 Đổi tên Key
export const queryKeys = {
  eventOrders: (clubId: number) => ["eventOrders", clubId] as const,
}

// Định nghĩa kiểu dữ liệu cho UI (dùng trực tiếp từ API)
type UiOrder = RedeemOrder

// 👈 Đổi tên Component
export default function ClubLeaderEventOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [clubId, setClubId] = useState<number | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(4)

  // Filter states
  const [dateFromFilter, setDateFromFilter] = useState<string>("")
  const [dateToFilter, setDateToFilter] = useState<string>("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)

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

  // 2. Lấy dữ liệu đơn hàng Event của Club
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery<UiOrder[], Error>({
    queryKey: queryKeys.eventOrders(clubId!),
    queryFn: () => getAllEventOrdersByClub(clubId!),
    enabled: !!clubId,
    staleTime: 3 * 60 * 1000,
  })

  // 3. Hàm lọc đơn hàng
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter (Tên sản phẩm, Tên thành viên, Mã đơn)
      const matchSearch =
        searchTerm === "" ||
        order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderCode.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchStatus =
        statusFilter === "ALL" ||
        order.status === statusFilter

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
  }, [orders, searchTerm, statusFilter, dateFromFilter, dateToFilter])

  // 4. Tính toán số liệu thống kê
  const totalOrders = isLoading ? "-" : filteredOrders.length
  const totalPointsUsed = isLoading
    ? "-"
    : filteredOrders
      .reduce((sum, order) => sum + order.totalPoints, 0)
      .toLocaleString()

  // 5. Logic phân trang
  const [prevFilteredLength, setPrevFilteredLength] = useState(0)

  if (filteredOrders.length !== prevFilteredLength) {
    setPrevFilteredLength(filteredOrders.length)
    const lastPage = Math.max(0, Math.ceil(filteredOrders.length / pageSize) - 1)
    if (currentPage > lastPage) setCurrentPage(lastPage)
  }

  const paginatedOrders = filteredOrders.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize
  )



  // Callback khi scan thành công
  const handleScanSuccess = () => {
    // Reload data
    queryClient.invalidateQueries({ queryKey: queryKeys.eventOrders(clubId!) })
  }

  // 8. Render JSX
  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Redeem Orders in Event</h1>
                <p className="text-muted-foreground">
                  Manage event product redemption orders from members
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setIsScannerOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={!clubId}
              >
                <ScanLine className="h-5 w-5 mr-2" />
                Scan Redeem
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 dark:from-purple-900/30 dark:via-purple-800/20 dark:to-pink-900/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />
                      Total Orders
                    </p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {isLoading ? <Skeleton className="h-7 w-12" /> : totalOrders}
                    </p>
                  </div>
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-100 dark:from-blue-900/30 dark:via-blue-800/20 dark:to-cyan-900/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                      <WalletCards className="h-3.5 w-3.5" />
                      Total Points Used
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {isLoading ? <Skeleton className="h-7 w-16" /> : totalPointsUsed}
                    </p>
                  </div>
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-muted">
            <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters & Search
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isFilterOpen ? (
                    <ChevronLeft className="h-4 w-4 rotate-90" />
                  ) : (
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {isFilterOpen && (
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
                <div className="flex items-center gap-2">
                  <label htmlFor="status-filter" className="text-sm font-medium whitespace-nowrap">
                    Status:
                  </label>
                  <select
                    id="status-filter"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                    <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                  </select>
                </div>
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
            )}
          </Card>

          {/* Order List */}
          <div className="space-y-4">
            <RenderOrderList
              isLoading={isLoading}
              error={error}
              orders={paginatedOrders}
              emptyMessage="No event orders found."
            />
            <PaginationControls
              currentPage={currentPage}
              setPage={setCurrentPage}
              totalItems={filteredOrders.length}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
          </div>
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
    <div className="grid md:grid-cols-2 gap-4">
      {orders.map((order) => {
        const borderColor = 
          order.status === "PENDING" ? "border-l-yellow-500" :
          order.status === "COMPLETED" ? "border-l-green-500" :
          order.status === "CANCELLED" ? "border-l-red-500" : "border-l-blue-500"

        return (
          <Link 
            key={order.orderId} 
            href={`/club-leader/event-order-list/${order.orderId}`}
            className="group"
          >
            <Card className={`border-0 border-l-4 ${borderColor} shadow-md hover:shadow-lg transition-all duration-200 bg-card`}>
              <CardContent className="p-4">
                {/* Header: Product Name + Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      order.status === "PENDING" ? "bg-yellow-100 dark:bg-yellow-900/30" :
                      order.status === "COMPLETED" ? "bg-green-100 dark:bg-green-900/30" :
                      order.status === "CANCELLED" ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-100 dark:bg-blue-900/30"
                    }`}>
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {order.productName}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {order.orderCode}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Member + Order Info in one row */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium line-clamp-1">{order.memberName}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                      <ShoppingCart className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="text-sm font-bold">{order.quantity}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <WalletCards className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Points</p>
                        <p className="text-sm font-bold">{order.totalPoints}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date + View Details */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-primary">
                    <span>View Details</span>
                    <Eye className="h-3 w-3" />
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