"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    CheckCircle, XCircle, ArrowLeft, Clock, Package, ShoppingCart, User, Hash, Calendar, Undo2, Loader2, Info, WalletCards 
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
    eventOrders: (clubId: number) => ["eventOrders", clubId] as const,
}

type UiOrder = RedeemOrder

export default function EventOrderDetailPage({ params }: OrderDetailPageProps) {
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
        queryKey: queryKeys.eventOrders(clubId!),
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
            
            toast({
                title: "Success",
                description: "Order marked as 'Delivered' successfully!",
                variant: "success",
            })
            
            // Tải lại danh sách orders và refresh page
            await queryClient.invalidateQueries({ queryKey: queryKeys.eventOrders(clubId) });
            router.refresh();
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

            // Đóng modal và reset state
            setIsRefundModalOpen(false)
            setRefundType("full")
            setPartialQuantity("1")
            setRefundReason("") // Reset reason
            
            // Tải lại danh sách orders và refresh page
            await queryClient.invalidateQueries({ queryKey: queryKeys.eventOrders(clubId) })
            router.refresh();

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

    // Enhanced Status Badge Function
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <Badge className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 shadow-lg font-semibold text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        Pending
                    </Badge>
                )
            case "COMPLETED":
                return (
                    <Badge className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-lg font-semibold text-sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Delivered
                    </Badge>
                )
            case "REFUNDED":
                return (
                    <Badge className="px-4 py-2 bg-gradient-to-r from-blue-400 to-cyan-500 text-white border-0 shadow-lg font-semibold text-sm">
                        <Undo2 className="h-4 w-4 mr-2" />
                        Refunded
                    </Badge>
                )
            case "PARTIALLY_REFUNDED":
                return (
                    <Badge className="px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-500 text-white border-0 shadow-lg font-semibold text-sm">
                        <Undo2 className="h-4 w-4 mr-2" />
                        Partially Refunded
                    </Badge>
                )
            default:
                return (
                    <Badge className="px-4 py-2 bg-gradient-to-r from-red-400 to-rose-500 text-white border-0 shadow-lg font-semibold text-sm">
                        <XCircle className="h-4 w-4 mr-2" />
                        {status}
                    </Badge>
                )
        }
    }

    // Enhanced Loading State
    if (loading) {
        return (
            <ProtectedRoute allowedRoles={["club_leader"]}>
                <AppShell>
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                                <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-600">Loading order details...</p>
                        </div>
                    </div>
                </AppShell>
            </ProtectedRoute>
        )
    }

    // Enhanced Error/Not Found State
    if (error || !order) {
        return (
            <ProtectedRoute allowedRoles={["club_leader"]}>
                <AppShell>
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <Card className="max-w-md border-0 shadow-2xl">
                            <CardContent className="pt-8 pb-8 text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="p-4 rounded-full bg-gradient-to-br from-red-50 to-rose-100">
                                        <XCircle className="h-16 w-16 text-red-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold text-gray-900">Order Not Found</h1>
                                    <p className="text-gray-600">
                                        {error ? String(error) : "The requested order could not be found or you don't have permission to view it."}
                                    </p>
                                </div>
                                <Link href="/club-leader/event-order-list">
                                    <Button className="h-12 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Event Order List
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </AppShell>
            </ProtectedRoute>
        )
    }

    // Determine status color theme
    const statusTheme = 
        order.status === "PENDING" ? {
            gradient: "from-yellow-50 via-yellow-50/50 to-transparent",
            border: "border-yellow-200",
            icon: "from-yellow-400 to-yellow-500",
            text: "text-yellow-700"
        } :
        order.status === "COMPLETED" ? {
            gradient: "from-green-50 via-green-50/50 to-transparent",
            border: "border-green-200",
            icon: "from-green-400 to-green-500",
            text: "text-green-700"
        } :
        order.status === "PARTIALLY_REFUNDED" ? {
            gradient: "from-orange-50 via-orange-50/50 to-transparent",
            border: "border-orange-200",
            icon: "from-orange-400 to-orange-500",
            text: "text-orange-700"
        } : {
            gradient: "from-blue-50 via-blue-50/50 to-transparent",
            border: "border-blue-200",
            icon: "from-blue-400 to-blue-500",
            text: "text-blue-700"
        }

    return (
        <ProtectedRoute allowedRoles={["club_leader"]}>
            <AppShell>
                <div className="space-y-6">
                    {/* Enhanced Header with Background */}
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${statusTheme.gradient} border ${statusTheme.border} p-6 shadow-lg`}>
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                        
                        <div className="relative z-10">
                            {/* Back button */}
                            <Link href="/club-leader/event-order-list">
                                <Button variant="ghost" size="sm" className="mb-4 hover:bg-white/50">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Event Order List
                                </Button>
                            </Link>
                            
                            {/* Title section */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${statusTheme.icon} shadow-xl`}>
                                        <Package className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold text-gray-900 mb-1">Event Order Details</h1>
                                        <p className="text-lg text-gray-600">Order #{order.orderCode}</p>
                                    </div>
                                </div>
                                <div>
                                    {getStatusBadge(order.status)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Information */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Product Information Card */}
                            <Card className="border-0 shadow-xl overflow-hidden">
                                {/* Colorful top border */}
                                <div className="h-2 w-full bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400" />
                                
                                <CardHeader className="bg-gradient-to-br from-gray-50 to-white">
                                    <CardTitle className="flex items-center gap-3 text-2xl">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                                            <Package className="h-6 w-6 text-purple-600" />
                                        </div>
                                        Product Information
                                    </CardTitle>
                                </CardHeader>
                                
                                <CardContent className="space-y-6 pt-6">
                                    {/* Product Name - Featured */}
                                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                        <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2 block">
                                            Event Product Name
                                        </label>
                                        <p className="text-2xl font-bold text-gray-900">{order.productName}</p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Quantity Card */}
                                        <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-500 shadow-md">
                                                    <ShoppingCart className="h-5 w-5 text-white" />
                                                </div>
                                                <label className="text-sm font-semibold text-indigo-700">Quantity</label>
                                            </div>
                                            <p className="text-3xl font-bold text-indigo-900">{order.quantity.toLocaleString('en-US')}</p>
                                        </div>
                                        
                                        {/* Total Points Card */}
                                        <div className="p-5 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl border border-cyan-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 shadow-md">
                                                    <WalletCards className="h-5 w-5 text-white" />
                                                </div>
                                                <label className="text-sm font-semibold text-cyan-700">Total Points</label>
                                            </div>
                                            <p className="text-3xl font-bold text-cyan-900">{order.totalPoints.toLocaleString('en-US')}</p>
                                        </div>
                                    </div>

                                    {/* Points calculation footer */}
                                    <div className="pt-4 border-t border-gray-200">
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            <span>Price per item: <span className="font-semibold text-gray-900">{(order.totalPoints / order.quantity).toLocaleString('en-US')} points</span></span>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Status Log Card */}
                            {order.status !== "PENDING" && (
                                <Card className="border-0 shadow-xl">
                                    <CardHeader className={`bg-gradient-to-br ${
                                        order.status === "COMPLETED" ? "from-green-50 to-emerald-50" :
                                        order.status === "PARTIALLY_REFUNDED" ? "from-orange-50 to-amber-50" :
                                        "from-blue-50 to-cyan-50"
                                    }`}>
                                        <CardTitle className="flex items-center gap-3 text-xl">
                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${
                                                order.status === "COMPLETED" ? "from-green-400 to-emerald-500" :
                                                order.status === "PARTIALLY_REFUNDED" ? "from-orange-400 to-amber-500" :
                                                "from-blue-400 to-cyan-500"
                                            } shadow-md`}>
                                                <Info className="h-5 w-5 text-white" />
                                            </div>
                                            Order Status Log
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-6">
                                        {/* Completed Status */}
                                        {order.status === "COMPLETED" && (
                                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 shadow-md mt-1">
                                                        <CheckCircle className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-green-700 mb-1">Order Delivered Successfully</p>
                                                        <p className="text-sm text-green-600">
                                                            This order was successfully delivered and completed.
                                                        </p>
                                                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {new Date(order.completedAt).toLocaleDateString('en-US', { 
                                                                weekday: 'long', 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Partially Refunded Status */}
                                        {order.status === "PARTIALLY_REFUNDED" && (
                                            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 shadow-md mt-1">
                                                        <Undo2 className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-orange-700 mb-1">Partial Refund Processed</p>
                                                        <p className="text-sm text-orange-600">
                                                            A portion of this order has been refunded to the member.
                                                        </p>
                                                        <p className="text-xs text-orange-600 mt-2 flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {new Date(order.completedAt).toLocaleDateString('en-US', { 
                                                                weekday: 'long', 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Fully Refunded Status */}
                                        {order.status === "REFUNDED" && (
                                            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 shadow-md mt-1">
                                                        <Undo2 className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-blue-700 mb-1">Full Refund Completed</p>
                                                        <p className="text-sm text-blue-600">
                                                            This order has been fully refunded and cancelled.
                                                        </p>
                                                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {new Date(order.completedAt).toLocaleDateString('en-US', { 
                                                                weekday: 'long', 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar Information */}
                        <div className="space-y-6">
                            {/* Member & Order Details Card */}
                            <Card className="border-0 shadow-xl">
                                <CardHeader className="bg-gradient-to-br from-gray-50 to-white">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-gray-600" />
                                        Order Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-6">
                                    {/* Member Name - Highlighted */}
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                        <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" />
                                            Member Name
                                        </label>
                                        <p className="text-lg font-bold text-gray-900">{order.memberName}</p>
                                    </div>

                                    <Separator />

                                    {/* Order Code */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <Hash className="h-3.5 w-3.5" />
                                            Order Code
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm">
                                            {order.orderCode}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Order Date */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Order Date
                                        </label>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(order.createdAt).toLocaleTimeString('en-US')}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Current Status - Centered */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block text-center">
                                            Current Status
                                        </label>
                                        <div className="flex justify-center">
                                            {getStatusBadge(order.status)}
                                        </div>
                                    </div>

                                    {/* Refund Reason */}
                                    {(order.status === "REFUNDED" || order.status === "PARTIALLY_REFUNDED") && order.reasonRefund && (
                                        <>
                                            <Separator className="my-4" />
                                            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                                                <label className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                    <Info className="h-3.5 w-3.5" />
                                                    Refund Reason
                                                </label>
                                                <p className="text-sm text-gray-700 leading-relaxed italic">&quot;{order.reasonRefund}&quot;</p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            {/* Deliver Button - Only for PENDING orders */}
                            {order.status === "PENDING" && (
                                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="text-center space-y-2">
                                            <div className="flex justify-center">
                                                <div className="p-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                                                    <CheckCircle className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-900">Ready to Deliver?</h3>
                                            <p className="text-sm text-gray-600">Mark this order as delivered when the event product has been given to the member</p>
                                        </div>
                                        <Button
                                            onClick={handleDeliver}
                                            disabled={isProcessing}
                                            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-base shadow-lg"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-5 w-5 mr-2" />
                                                    Mark as Delivered
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Refund Button - Only for COMPLETED or PARTIALLY_REFUNDED orders */}
                            {(order.status === "COMPLETED" || order.status === "PARTIALLY_REFUNDED") && (
                                <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-rose-50">
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="text-center space-y-2">
                                            <div className="flex justify-center">
                                                <div className="p-3 rounded-full bg-gradient-to-br from-red-400 to-rose-500 shadow-lg">
                                                    <Undo2 className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-900">Need to Refund?</h3>
                                            <p className="text-sm text-gray-600">Process a full or partial refund if there&apos;s an issue with this order</p>
                                        </div>

                                        <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    className="w-full h-12 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold text-base shadow-lg"
                                                    disabled={isProcessing}
                                                >
                                                    <Undo2 className="h-5 w-5 mr-2" />
                                                    Process Refund
                                                </Button>
                                            </DialogTrigger>

                                            <DialogContent className="sm:max-w-lg">
                                                <DialogHeader className="space-y-3">
                                                    <div className="flex justify-center">
                                                        <div className="p-3 rounded-full bg-gradient-to-br from-red-100 to-rose-100">
                                                            <Undo2 className="h-8 w-8 text-red-600" />
                                                        </div>
                                                    </div>
                                                    <DialogTitle className="text-2xl text-center">Process Refund</DialogTitle>
                                                    <DialogDescription className="text-center">
                                                        Select refund type and provide a reason for <span className="font-semibold">{order.memberName}&apos;s</span> order
                                                    </DialogDescription>
                                                </DialogHeader>

                                                {/* Order Summary */}
                                                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                                    <p className="text-sm font-semibold text-blue-900 mb-2">Order Summary</p>
                                                    <div className="space-y-1 text-sm text-blue-800">
                                                        <p><span className="font-medium">Product:</span> {order.productName}</p>
                                                        <p><span className="font-medium">Quantity:</span> {order.quantity} items</p>
                                                        <p><span className="font-medium">Total Points:</span> {order.totalPoints.toLocaleString('en-US')} points</p>
                                                    </div>
                                                </div>

                                                {/* Refund Type Selection */}
                                                <RadioGroup value={refundType} onValueChange={(v) => setRefundType(v as any)} className="space-y-3">
                                                    <div>
                                                        <RadioGroupItem value="full" id="r-full" className="peer sr-only" />
                                                        <Label
                                                            htmlFor="r-full"
                                                            className="flex flex-col gap-2 rounded-xl border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                                                                    <Undo2 className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span className="font-bold text-base text-gray-900">Full Refund</span>
                                                                    <p className="text-sm text-gray-600 mt-1">
                                                                        Cancel entire order and refund all {order.totalPoints.toLocaleString('en-US')} points for {order.quantity} item(s)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </Label>
                                                    </div>
                                                    
                                                    <div>
                                                        <RadioGroupItem value="partial" id="r-partial" className="peer sr-only" disabled={order.quantity <= 1} />
                                                        <Label
                                                            htmlFor="r-partial"
                                                            className={`flex flex-col gap-2 rounded-xl border-2 border-gray-200 bg-white p-4 ${
                                                                order.quantity > 1 
                                                                    ? 'cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50' 
                                                                    : 'cursor-not-allowed opacity-50'
                                                            } transition-all`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200">
                                                                    <Undo2 className="h-5 w-5 text-orange-600" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span className="font-bold text-base text-gray-900">Partial Refund</span>
                                                                    <p className="text-sm text-gray-600 mt-1">
                                                                        {order.quantity > 1 
                                                                            ? "Refund specific quantity while keeping order active"
                                                                            : "Only available for orders with more than 1 item"
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </Label>
                                                    </div>
                                                </RadioGroup>

                                                {/* Partial Quantity Input */}
                                                {refundType === "partial" && (() => {
                                                    const pointsPerItem = order.totalPoints / order.quantity;
                                                    const partialPoints = (pointsPerItem * (parseInt(partialQuantity) || 0)).toFixed(0);

                                                    return (
                                                        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 space-y-3">
                                                            <Label htmlFor="partialQuantity" className="text-sm font-semibold text-orange-900">
                                                                Quantity to Refund
                                                            </Label>
                                                            <Input
                                                                id="partialQuantity"
                                                                type="number"
                                                                value={partialQuantity}
                                                                onChange={(e) => setPartialQuantity(e.target.value)}
                                                                min={1}
                                                                max={order.quantity - 1}
                                                                className="text-base h-11"
                                                            />
                                                            <p className="text-sm text-orange-700 flex items-center gap-1.5">
                                                                <Info className="h-4 w-4" />
                                                                This will refund <span className="font-bold">{partialPoints} points</span>
                                                            </p>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Refund Reason */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="refundReason" className="text-sm font-semibold">
                                                        Reason for Refund <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Textarea
                                                        id="refundReason"
                                                        value={refundReason}
                                                        onChange={(e) => setRefundReason(e.target.value)}
                                                        placeholder="e.g., Product unavailable, member request, event cancelled..."
                                                        className="min-h-[100px] resize-none"
                                                    />
                                                    <p className="text-xs text-gray-500">Please provide a clear reason for this refund</p>
                                                </div>

                                                <DialogFooter className="gap-2 sm:gap-0">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setIsRefundModalOpen(false)}
                                                        disabled={isProcessing}
                                                        className="flex-1 h-11"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        onClick={handleRefund}
                                                        disabled={isProcessing || !refundReason.trim()}
                                                        className="flex-1 h-11 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold shadow-lg"
                                                    >
                                                        {isProcessing ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Undo2 className="h-4 w-4 mr-2" />
                                                                Confirm Refund
                                                            </>
                                                        )}
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
