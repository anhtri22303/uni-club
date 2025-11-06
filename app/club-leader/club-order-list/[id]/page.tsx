"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    CheckCircle, XCircle, ArrowLeft, Clock, Package, DollarSign, ShoppingCart, User, Hash, Calendar, Undo2, Loader2, Info, WalletCards 
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getClubIdFromToken } from "@/service/clubApi"
import { getClubRedeemOrders, RedeemOrder, completeRedeemOrder, refundRedeemOrder, refundPartialRedeemOrder, RefundPayload } from "@/service/redeemApi"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Props cho trang chi tiết
interface OrderDetailPageProps {
    params: {
        id: string // Đây sẽ là orderId
    }
}

// Đặt key cho react-query
export const queryKeys = {
    clubOrders: (clubId: number) => ["clubOrders", clubId] as const,
}

type UiOrder = RedeemOrder

export default function ClubOrderDetailPage({ params }: OrderDetailPageProps) {
    const router = useRouter()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const [clubId, setClubId] = useState<number | null>(null)
    const [isProcessing, setIsProcessing] = useState<boolean>(false)

    // CHO LOGIC REFUND
    const [isRefundModalOpen, setIsRefundModalOpen] = useState<boolean>(false)
    const [refundReason, setRefundReason] = useState<string>("")
    const [refundType, setRefundType] = useState<"full" | "partial">("full")
    const [partialQuantity, setPartialQuantity] = useState<string>("1")


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

    // Lấy TẤT CẢ đơn hàng (giống logic trang chi tiết CLB)
    const {
        data: orders = [],
        isLoading: loading,
        error,
    } = useQuery<UiOrder[], Error>({
        queryKey: queryKeys.clubOrders(clubId!),
        queryFn: () => getClubRedeemOrders(clubId!),
        enabled: !!clubId,
    })

    // Tìm đơn hàng cụ thể
    const order: UiOrder | undefined = useMemo(() => {
        if (loading || !params.id) return undefined
        // params.id là string, orderId là number
        return orders.find(o => String(o.orderId) === params.id)
    }, [orders, loading, params.id])


    //: Xử lý "Delivered"
    const handleDeliver = async () => {
        if (!order || !clubId) return;

        setIsProcessing(true);
        try {
            await completeRedeemOrder(order.orderId);
            // Tải lại danh sách orders
            queryClient.invalidateQueries({ queryKey: queryKeys.clubOrders(clubId) });
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

    // Xử lý "Cancel/Refund"
    const handleRefund = async () => {
        if (!order || !clubId) return

        // Kiểm tra Reason
        if (!refundReason.trim()) {
            toast({
                title: "Validation Error",
                description: "Please provide a reason for the refund.",
                variant: "destructive",
            })
            return;
        }

        setIsProcessing(true)
        try {
            if (refundType === "full") {
                // --- Logic Full Refund ---
                const payload: RefundPayload = {
                    orderId: order.orderId,
                    quantityToRefund: order.quantity, // Hoàn trả toàn bộ
                    reason: refundReason,
                };
                await refundRedeemOrder(payload) // Gửi payload

                toast({
                    title: "Success",
                    description: "Order has been successfully cancelled and refunded.",
                    variant: "success",
                })
            } else {
                // --- Logic Partial Refund ---
                const qty = parseInt(partialQuantity);

                if (!qty || qty <= 0) {
                    throw new Error("Quantity to refund must be greater than 0.");
                }
                if (qty >= order.quantity) {
                    throw new Error("Quantity is too high. Use 'Full Refund' instead.");
                }

                // 👈 Tạo payload mới
                const payload: RefundPayload = {
                    orderId: order.orderId,
                    quantityToRefund: qty,
                    reason: refundReason,
                };
                await refundPartialRedeemOrder(payload) // Gửi payload

                toast({
                    title: "Success",
                    description: `Successfully refunded ${qty} item(s).`,
                    variant: "success",
                })
            }

            queryClient.invalidateQueries({ queryKey: queryKeys.clubOrders(clubId) })
            // Đóng modal và reset state
            setIsRefundModalOpen(false)
            setRefundType("full")
            setPartialQuantity("1")
            setRefundReason("") // Reset reason

        } catch (error: any) {
            console.error("Failed to refund order:", error)
            toast({
                title: "Error",
                description: error.response?.data?.message || error.message || "Failed to refund order",
                variant: "destructive",
            })
        } finally {
            setIsProcessing(false)
        }
    }

    // Hàm hiển thị Badge (ĐÃ CẬP NHẬT)
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                )
            case "COMPLETED":
                return (
                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Delivered
                    </Badge>
                )
            case "REFUNDED": // Hoàn tiền toàn bộ
                return (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                        <Undo2 className="h-3 w-3 mr-1" />
                        Refunded
                    </Badge>
                )
            case "PARTIALLY_REFUNDED": // Hoàn tiền 1 phần
                return (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                        <Undo2 className="h-3 w-3 mr-1" />
                        Partially Refunded
                    </Badge>
                )
            default: // Bao gồm cả CANCELLED (nếu có)
                return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
                    <XCircle className="h-3 w-3 mr-1" />
                    {status}
                </Badge>
        }
    }

    // Loading / Error States
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
                        <Link href="/club-leader/club-order-list">
                            <Button>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Club Order List
                            </Button>
                        </Link>
                    </div>
                </AppShell>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute allowedRoles={["club_leader"]}>
            <AppShell>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        {/* link back */}
                        <Link href="/club-leader/club-order-list">
                            <Button variant="ghost" size="sm" className="mb-2">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Club Order List
                            </Button>
                        </Link>
                        {/* tiêu đề */}
                        <h1 className="text-3xl font-bold">Order #{order.orderCode}</h1>
                        <p className="text-muted-foreground">Order Details & Actions</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Information */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Card thông tin đơn hàng */}
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
                            {/* HIỂN THỊ LOG TRẠNG THÁI */}
                            {order.status !== "PENDING" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Info className="h-5 w-5" />
                                            Order Status Log
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {/* Chỉ hiển thị khi đã Giao hàng */}
                                        {order.status === "COMPLETED" && (
                                            <div className="text-sm text-green-700 font-medium flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4" />
                                                This order was successfully delivered on {new Date(order.completedAt).toLocaleString()}.
                                            </div>
                                        )}

                                        {/* Chỉ hiển thị khi đã Hoàn tiền 1 phần */}
                                        {order.status === "PARTIALLY_REFUNDED" && (
                                            <div className="text-sm text-orange-700 font-medium flex items-center gap-2">
                                                <Undo2 className="h-4 w-4" />
                                                This order was partially refunded on {new Date(order.completedAt).toLocaleString()}.
                                            </div>
                                        )}

                                        {/* Chỉ hiển thị khi đã Hoàn tiền Toàn bộ */}
                                        {order.status === "REFUNDED" && (
                                            <div className="text-sm text-blue-700 font-medium flex items-center gap-2">
                                                <Undo2 className="h-4 w-4" />
                                                This order was fully refunded on {new Date(order.completedAt).toLocaleString()}.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                        </div>

                        {/* Sidebar Information */}
                        <div className="space-y-6">
                            {/* Card chi tiết đơn hàng */}
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

                                    {/* Hiển thị lý do refund */}
                                    {(order.status === "REFUNDED" || order.status === "PARTIALLY_REFUNDED") && order.reasonRefund && (
                                        <>
                                            <Separator />
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Refund Reason</label>
                                                <p className="mt-1 text-sm text-gray-700">{order.reasonRefund}</p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* CARD ACTIONS */}
                            {/* Chỉ hiển thị nút "Delivered" khi đang PENDING */}
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
                                        {/* Nút refund sẽ được hiển thị ở card dưới */}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Hiển thị nút "Refund" khi COMPLETED */}
                            {(order.status === "COMPLETED" || order.status === "PARTIALLY_REFUNDED") && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    className="w-full"
                                                    variant="destructive"
                                                    disabled={isProcessing}
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Refund Order
                                                </Button>
                                            </DialogTrigger>

                                            {/* DIALOG REFUND */}
                                            <DialogContent className="sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle>Refund Order</DialogTitle>
                                                    <DialogDescription>
                                                        Select a refund type for {order.memberName}'s order.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <RadioGroup value={refundType} onValueChange={(v) => setRefundType(v as any)} className="py-4 space-y-3">
                                                    <div>
                                                        <RadioGroupItem value="full" id="r-full" className="peer sr-only" />
                                                        <Label
                                                            htmlFor="r-full"
                                                            className="flex flex-col items-start gap-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                        >
                                                            <span className="font-semibold">Full Refund</span>
                                                            <span className="text-sm text-muted-foreground">
                                                                Cancel the entire order and refund all {order.totalPoints} points for {order.quantity} item(s).
                                                            </span>
                                                        </Label>
                                                    </div>
                                                    <div>
                                                        <RadioGroupItem value="partial" id="r-partial" className="peer sr-only" disabled={order.quantity <= 1} />
                                                        <Label
                                                            htmlFor="r-partial"
                                                            className={`flex flex-col items-start gap-1 rounded-md border-2 border-muted bg-popover p-4 ${order.quantity > 1 ? 'cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary' : 'cursor-not-allowed opacity-50'}`}
                                                        >
                                                            <span className="font-semibold">Partial Refund</span>
                                                            <span className="text-sm text-muted-foreground">
                                                                Refund a specific quantity. Only available for orders with more than 1 item.
                                                            </span>
                                                        </Label>
                                                    </div>
                                                </RadioGroup>

                                                {/* Hiển thị ô nhập số lượng khi chọn Partial */}
                                                {refundType === "partial" && (() => {
                                                    // Tính toán an toàn bên trong JSX
                                                    // 'order' chắc chắn tồn tại vì Dialog chỉ mở khi order có
                                                    const pointsPerItem = order!.totalPoints / order!.quantity;
                                                    const partialPoints = (pointsPerItem * (parseInt(partialQuantity) || 0)).toFixed(0);

                                                    return (
                                                        <div className="space-y-2 pt-2">
                                                            <Label htmlFor="partialQuantity">Quantity to Refund</Label>
                                                            <Input
                                                                id="partialQuantity"
                                                                type="number"
                                                                value={partialQuantity}
                                                                onChange={(e) => setPartialQuantity(e.target.value)}
                                                                min={1}
                                                                max={order!.quantity - 1} // '!' an toàn ở đây
                                                            />
                                                            <p className="text-sm text-muted-foreground">
                                                                This will refund approx. <span className="font-bold text-blue-600">{partialPoints} points</span>.
                                                            </p>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Ô nhập Reason */}
                                                <div className="space-y-2 pt-2">
                                                    <Label htmlFor="refundReason">
                                                        Reason for Refund <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Textarea
                                                        id="refundReason"
                                                        value={refundReason}
                                                        onChange={(e) => setRefundReason(e.target.value)}
                                                        placeholder="e.g., Product out of stock, member request..."
                                                    />
                                                </div>

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
                                                        onClick={handleRefund}
                                                        disabled={isProcessing || !refundReason.trim()}
                                                    >
                                                        {isProcessing ? "Refunding..." : "Confirm Refund"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
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