"use client"

import { useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/contexts/protected-route"
import { AppShell } from "@/components/app-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
// --- IMPORT ĐÃ SỬA ---
// Nhập component Pagination tùy chỉnh của bạn
import { Pagination } from "@/components/pagination" 
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingBag, AlertCircle, QrCode } from "lucide-react"
import {
  getAdminAllRedeemOrders,
  AdminRedeemOrderItem,
  PaginationResponse,
} from "@/service/redeemApi"
import { format } from "date-fns"

export default function AdminRedeemsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated, initialized } = useAuth()

  // --- State Phân Trang ---
  const page = useMemo(() => {
    return Number(searchParams.get("page")) || 0 // API bắt đầu từ 0
  }, [searchParams])

  const size = useMemo(() => {
    return Number(searchParams.get("size")) || 10 // Mặc định 10
  }, [searchParams])

  // --- Lấy Dữ Liệu Đơn Hàng ---
  const {
    data: pagedData,
    isLoading,
    isError,
    error,
  } = useQuery<PaginationResponse<AdminRedeemOrderItem>, Error>({
    queryKey: ["adminRedeemOrders", page, size, initialized, isAuthenticated],
    queryFn: () => getAdminAllRedeemOrders({ page, size }),
    enabled: initialized && isAuthenticated,
    placeholderData: keepPreviousData,
  })

  const orders = pagedData?.content || []
  const totalPages = pagedData?.totalPages || 0
  const totalItems = pagedData?.totalElements || 0
  const currentPageFromApi = pagedData?.number || 0 // 0-indexed
  const pageSizeFromApi = pagedData?.size || size

  // --- Hàm xử lý thay đổi trang (nhận trang 0-indexed) ---
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  // --- Hàm xử lý thay đổi kích thước trang ---
  const handlePageSizeChange = (newSize: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("size", String(newSize))
    params.set("page", "0") // Quay về trang đầu tiên khi đổi size
    router.push(`${pathname}?${params.toString()}`)
  }

  // --- Hàm helper để hiển thị Badge Status ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-600 text-white">COMPLETED</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-500 text-white">PENDING</Badge>
      case "REFUNDED":
        return <Badge variant="destructive">REFUNDED</Badge>
      case "PARTIALLY_REFUNDED":
        return <Badge variant="outline">PARTIAL</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-balance">Redeem Orders</h1>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                All Redeem Orders
              </CardTitle>
              <CardDescription>
                View and manage all product redemptions across the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Code</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: size }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={9}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : isError ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center text-red-500"
                        >
                          <AlertCircle className="h-4 w-4 inline-block mr-2" />
                          Failed to load orders: {error.message}
                        </TableCell>
                      </TableRow>
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center text-muted-foreground"
                        >
                          No redeem orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">
                            {order.orderCode}
                          </TableCell>
                          <TableCell className="font-medium">
                            {order.productName}
                          </TableCell>
                          <TableCell>{order.buyerName}</TableCell>
                          <TableCell>{order.clubName}</TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell className="text-right text-orange-500 font-bold">
                            {order.totalPoints}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {format(
                              new Date(order.createdAt),
                              "dd MMM yyyy, HH:mm"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" title="View QR">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* --- KHỐI PHÂN TRANG ĐÃ CẬP NHẬT --- */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    // Component của bạn dùng trang 1-based,
                    // API trả về 0-based (pagedData.number)
                    currentPage={currentPageFromApi + 1}
                    totalPages={totalPages}
                    pageSize={pageSizeFromApi}
                    totalItems={totalItems}
                    // onPageChange của component trả về 1-based,
                    // ta cần trừ 1 để đưa về 0-based cho hàm handler
                    onPageChange={(page) => handlePageChange(page - 1)}
                    onPageSizeChange={handlePageSizeChange}
                    // Bạn có thể chọn true hoặc false
                    // false: Hiển thị đầy đủ (Rows per page, 1 to 10 of 100)
                    // true: Chỉ hiển thị (Previous 1/10 Next)
                    simple={false} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}