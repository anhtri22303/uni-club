"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    CheckCircle, XCircle, ArrowLeft, Clock,
    Package, DollarSign, ShoppingCart, User, Hash, Calendar, Undo2, Loader2, WalletCards
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getClubIdFromToken } from "@/service/clubApi"
import { getClubRedeemOrders, RedeemOrder, completeRedeemOrder, refundRedeemOrder } from "@/service/redeemApi"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

// Props cho trang chi tiết
interface OrderDetailPageProps {
    params: {
        id: string // Đây sẽ là orderId
    }
}

// Đặt key cho react-query
export const queryKeys = {
    eventOrders: (clubId: number) => ["clubOrders", clubId] as const,
}

// Định nghĩa kiểu dữ liệu cho UI
type UiOrder = RedeemOrder

// 👈 ĐỔI TÊN COMPONENT
export default function EventOrderDetailPage({ params }: OrderDetailPageProps) {
    const router = useRouter()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const [clubId, setClubId] = useState<number | null>(null)
    const [isProcessing, setIsProcessing] = useState<boolean>(false)

    // State cho modal (Giống trang mẫu)
    const [isRefundModalOpen, setIsRefundModalOpen] = useState<boolean>(false)
    const [refundReason, setRefundReason] = useState<string>("") // Mặc dù API ko cần, nhưng nên có

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

    // 2. 👈 Lấy TẤT CẢ đơn hàng (giống logic trang chi tiết CLB)
    const {
        data: orders = [],
        isLoading: loading,
        error,
    } = useQuery<UiOrder[], Error>({
        queryKey: queryKeys.eventOrders(clubId!),
        queryFn: () => getClubRedeemOrders(clubId!),
        enabled: !!clubId,
    })

    // 3. 👈 Tìm đơn hàng cụ thể
    const order: UiOrder | undefined = useMemo(() => {
        if (loading || !params.id) return undefined
        // params.id là string, orderId là number
        return orders.find(o => String(o.orderId) === params.id)
    }, [orders, loading, params.id])


    // 4. 👈 Xử lý "Delivered"
    const handleDeliver = async () => {
        if (!order || !clubId) return;

        setIsProcessing(true);
        try {
            await completeRedeemOrder(order.orderId);
            // Tải lại danh sách orders
            queryClient.invalidateQueries({ queryKey: queryKeys.eventOrders(clubId) });
            toast({
                title: "Success",
                description: "Order marked as 'Delivered' successfully!",
                variant: "success",
            })
        } catch (error) {
            console.error("Failed to complete order:", error);
            toast({
                title: "Error",
                description: (error as Error).message || "Failed to mark order as delivered",
                variant: "destructive",
            })
        } finally {
            setIsProcessing(false);
        }
    };

    // 5. 👈 HÀM MỚI: Xử lý "Cancel/Refund"
    const handleCancel = async () => {
        if (!order || !clubId) return

        // (Tùy chọn: Bắt buộc nhập lý do)
        // if (!refundReason.trim()) {
        //   toast({ title: "Validation Error", ... });
        //   return
        // }

        setIsProcessing(true)
        try {
            // API của bạn dùng 'refundRedeemOrder'
            await refundRedeemOrder(order.orderId)
            queryClient.invalidateQueries({ queryKey: queryKeys.eventOrders(clubId) })
            toast({
                title: "Success",
                description: "Order has been successfully cancelled and refunded.",
                variant: "success",
            })
            setIsRefundModalOpen(false)
            setRefundReason("")
        } catch (error) {
            console.error("Failed to refund order:", error)
            toast({
                title: "Error",
                description: (error as Error).message || "Failed to refund order",
                variant: "destructive",
            })
        } finally {
            setIsProcessing(false)
        }
    }

    // 6. Hàm hiển thị Badge (Giữ nguyên từ file order-list)
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending (Paid)
                    </Badge>
                )
            case "COMPLETED":
                return (
                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Delivered
                    </Badge>
                )
            case "CANCELLED":
                return (
                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelled
                    </Badge>
                )
            case "REFUNDED":
                return (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                        <Undo2 className="h-3 w-3 mr-1" />
                        Refunded
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    // 7. Loading / Error States (Giữ nguyên)
    if (loading) {
        return (
            <ProtectedRoute allowedRoles={["club_leader"]}>
                <AppShell>
                    <div className="py-8 text-center">Loading...</div>
                </AppShell>
            </ProtectedRoute>
        )
    }

    if (error || !order) {
        return (
            <ProtectedRoute allowedRoles={["club_leader"]}>
                <AppShell>
                    <div className="text-center py-8">
                        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
                        <p className="text-muted-foreground mb-4">
                            {error ? String(error) : "The requested order could not be found."}
                        </p>
                        <Link href="/club-leader/event-order-list">
                            <Button>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Event Order List
                            </Button>
                        </Link>
                    </div>
                </AppShell>
            </ProtectedRoute>
        )
    }

    // 8. JSX (Đã cập nhật)
    return (
        <ProtectedRoute allowedRoles={["club_leader"]}>
            <AppShell>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        {/* 👈 Đổi link back */}
                        <Link href="/club-leader/event-order-list">
                            <Button variant="ghost" size="sm" className="mb-2">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Event Order List
                            </Button>
                        </Link>
                        {/* 👈 Đổi tiêu đề */}
                        <h1 className="text-3xl font-bold">Order #{order.orderCode}</h1>
                        <p className="text-muted-foreground">Order Details & Actions</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Information */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* 👈 THAY THẾ: Card thông tin đơn hàng */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Order Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                                        <p className="text-lg font-semibold">{order.productName}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">{order.quantity}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Total Points</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <WalletCards className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold text-blue-600">{order.totalPoints} points</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 👈 XÓA Card "Proposer Reason" */}
                        </div>

                        {/* Sidebar Information */}
                        <div className="space-y-6">
                            {/* 👈 THAY THẾ: Card chi tiết đơn hàng */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Member Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Member Name</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <p className="font-semibold">{order.memberName}</p>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Order Code</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Hash className="h-4 w-4 text-muted-foreground" />
                                            <span>{order.orderCode}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Order Date</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{new Date(order.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                                        <div className="mt-2">{getStatusBadge(order.status)}</div>
                                    </div>
                                    {/* (Hiển thị lý do refund nếu có) */}
                                    {order.status === "REFUNDED" && (
                                        <p className="text-sm text-muted-foreground">This order has been refunded.</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 👈 THAY THẾ: Card Actions */}
                            {order.status === "PENDING" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700"
                                            variant="default"
                                            onClick={handleDeliver}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                            {isProcessing ? "Processing..." : "Mark as Delivered"}
                                        </Button>

                                        <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    className="w-full"
                                                    variant="destructive"
                                                    disabled={isProcessing}
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Cancel / Refund Order
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Cancel / Refund Order</DialogTitle>
                                                    <DialogDescription>
                                                        Are you sure you want to cancel this order? This action will refund {order.totalPoints} points to {order.memberName}.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                {/* (Bạn có thể thêm ô nhập lý do ở đây nếu cần) */}
                                                <DialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setIsRefundModalOpen(false)}
                                                        disabled={isProcessing}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        variant="destructive"
                                                        onClick={handleCancel}
                                                        disabled={isProcessing}
                                                    >
                                                        {isProcessing ? "Refunding..." : "Confirm Refund"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Hiển thị khi đã hoàn thành */}
                            {order.status === "COMPLETED" && (
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-green-700 font-medium text-center">
                                            This order was successfully delivered on {new Date(order.completedAt).toLocaleString()}.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </AppShell>
        </ProtectedRoute>
    )
}