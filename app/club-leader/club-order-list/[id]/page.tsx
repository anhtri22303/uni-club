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
    const [partialQuantity, setPartialQuantity] = useState<string>("1");
    const [partialQuantityError, setPartialQuantityError] = useState<string | null>(null)


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

            toast({
                title: "Success",
                description: "Order marked as 'Delivered' successfully!",
                variant: "success",
            })

            // Tải lại danh sách orders và refresh page
            await queryClient.invalidateQueries({ queryKey: queryKeys.clubOrders(clubId) });
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
            await queryClient.invalidateQueries({ queryKey: queryKeys.clubOrders(clubId) })
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

    // Xử lý validate khi nhập số lượng partial
    const handlePartialQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPartialQuantity(value); // Cập nhật state
        setPartialQuantityError(null); // Reset lỗi

        if (!value) {
            setPartialQuantityError("Quantity is required.");
            return;
        }

        const qty = parseInt(value);
        if (isNaN(qty)) {
            setPartialQuantityError("Invalid number.");
            return;
        }

        if (qty <= 0) {
            setPartialQuantityError("Quantity must be at least 1.");
        } else if (order && qty === order.quantity) {
            // Yêu cầu của bạn: Nếu nhập BẰNG số lượng tổng
            setPartialQuantityError(`Use 'Full Refund' to refund all ${order.quantity} items.`);
        } else if (order && qty > order.quantity) {
            // Yêu cầu của bạn: Nếu nhập LỚN HƠN số lượng tổng
            setPartialQuantityError(`Quantity cannot exceed the total ${order.quantity} items.`);
        }
    };

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
                                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mx-auto" />
                                <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-600 dark:text-slate-300">Loading order details...</p>
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
                        <Card className="max-w-md border-0 shadow-2xl dark:bg-slate-800 dark:border-slate-700">
                            <CardContent className="pt-8 pb-8 text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="p-4 rounded-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30">
                                        <XCircle className="h-16 w-16 text-red-500 dark:text-red-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Not Found</h1>
                                    <p className="text-gray-600 dark:text-slate-400">
                                        {error ? String(error) : "The requested order could not be found or you don't have permission to view it."}
                                    </p>
                                </div>
                                <Link href="/club-leader/club-order-list">
                                    <Button className="h-12 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 text-white font-semibold shadow-lg">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Order List
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
            gradient: "from-yellow-50 via-yellow-50/50 to-transparent dark:from-yellow-900/20 dark:via-slate-800/50 dark:to-transparent",
            border: "border-yellow-200 dark:border-yellow-800",
            icon: "from-yellow-400 to-yellow-500",
            text: "text-yellow-700 dark:text-yellow-300"
        } :
            order.status === "COMPLETED" ? {
                gradient: "from-green-50 via-green-50/50 to-transparent dark:from-green-900/20 dark:via-slate-800/50 dark:to-transparent",
                border: "border-green-200 dark:border-green-800",
                icon: "from-green-400 to-green-500",
                text: "text-green-700 dark:text-green-300"
            } :
                order.status === "PARTIALLY_REFUNDED" ? {
                    gradient: "from-orange-50 via-orange-50/50 to-transparent dark:from-orange-900/20 dark:via-slate-800/50 dark:to-transparent",
                    border: "border-orange-200 dark:border-orange-800",
                    icon: "from-orange-400 to-orange-500",
                    text: "text-orange-700 dark:text-orange-300"
                } : {
                    gradient: "from-blue-50 via-blue-50/50 to-transparent dark:from-blue-900/20 dark:via-slate-800/50 dark:to-transparent",
                    border: "border-blue-200 dark:border-blue-800",
                    icon: "from-blue-400 to-blue-500",
                    text: "text-blue-700 dark:text-blue-300"
                }

    return (
        <ProtectedRoute allowedRoles={["club_leader"]}>
            <AppShell>
                <div className="space-y-6">
                    {/* Enhanced Header with Background */}
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${statusTheme.gradient} border ${statusTheme.border} p-6 shadow-lg dark:bg-slate-800/50`}>
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 dark:bg-slate-700/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/20 dark:bg-slate-700/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10">
                            {/* Back button */}
                            <Link href="/club-leader/club-order-list">
                                <Button variant="ghost" size="sm" className="mb-4 hover:bg-white/50 dark:hover:bg-slate-700/50 dark:text-white">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Order List
                                </Button>
                            </Link>

                            {/* Title section */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${statusTheme.icon} shadow-xl`}>
                                        <Package className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Order #{order.orderCode}</h1>
                                        <p className="text-muted-foreground dark:text-slate-400 mt-1 flex items-center gap-2">
                                            <Hash className="h-4 w-4" />
                                            Order ID: {order.orderId}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    {getStatusBadge(order.status)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Information */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Enhanced Product Card */}
                            <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-gray-50/30 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 dark:border-slate-700 overflow-hidden">
                                <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                                            <Package className="h-5 w-5 text-white" />
                                        </div>
                                        Product Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Product Name - Featured */}
                                    <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800 shadow-sm">
                                        <label className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-2 block">Product Name</label>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{order.productName}</p>
                                    </div>

                                    {/* Order Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500 shadow-md">
                                                    <ShoppingCart className="h-4 w-4 text-white" />
                                                </div>
                                                <label className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Quantity</label>
                                            </div>
                                            <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-200">{order.quantity.toLocaleString('en-US')}</p>
                                            <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">Item(s) ordered</p>
                                        </div>

                                        <div className="p-5 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl border border-cyan-100 dark:border-cyan-800 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 shadow-md">
                                                    <WalletCards className="h-4 w-4 text-white" />
                                                </div>
                                                <label className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">Total Points</label>
                                            </div>
                                            <p className="text-3xl font-bold text-cyan-900 dark:text-cyan-200">{order.totalPoints.toLocaleString('en-US')}</p>
                                            <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">Points redeemed</p>
                                        </div>
                                    </div>

                                    {/* Points per item calculation */}
                                    <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <DollarSign className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                                        <span className="text-sm text-gray-600 dark:text-slate-300">
                                            <span className="font-semibold">{(order.totalPoints / order.quantity).toLocaleString('en-US')}</span> points per item
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                            {/* Enhanced Status Log */}
                            {order.status !== "PENDING" && (
                                <Card className="border-0 shadow-xl overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                                    {order.status === "COMPLETED" && (
                                        <>
                                            <div className="h-2 bg-gradient-to-r from-green-400 via-green-500 to-emerald-500" />
                                            <div className="bg-gradient-to-br from-green-50 via-emerald-50/50 to-white dark:from-green-900/20 dark:via-emerald-900/20 dark:to-slate-800 p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg flex-shrink-0">
                                                        <CheckCircle className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-green-900 dark:text-green-200 mb-1">Successfully Delivered</h3>
                                                        <p className="text-sm text-green-700 dark:text-green-300">
                                                            This order was completed and delivered to the member.
                                                        </p>
                                                        <div className="mt-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            <span>{new Date(order.completedAt).toLocaleString('en-US', {
                                                                dateStyle: 'full',
                                                                timeStyle: 'short'
                                                            })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {order.status === "PARTIALLY_REFUNDED" && (
                                        <>
                                            <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500" />
                                            <div className="bg-gradient-to-br from-orange-50 via-amber-50/50 to-white dark:from-orange-900/20 dark:via-amber-900/20 dark:to-slate-800 p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg flex-shrink-0">
                                                        <Undo2 className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200 mb-1">Partially Refunded</h3>
                                                        <p className="text-sm text-orange-700 dark:text-orange-300">
                                                            A portion of this order has been refunded to the member.
                                                        </p>
                                                        <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            <span>{new Date(order.completedAt).toLocaleString('en-US', {
                                                                dateStyle: 'full',
                                                                timeStyle: 'short'
                                                            })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {order.status === "REFUNDED" && (
                                        <>
                                            <div className="h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500" />
                                            <div className="bg-gradient-to-br from-blue-50 via-cyan-50/50 to-white dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-slate-800 p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg flex-shrink-0">
                                                        <Undo2 className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-1">Fully Refunded</h3>
                                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                                            This order has been completely cancelled and all points refunded.
                                                        </p>
                                                        <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            <span>{new Date(order.completedAt).toLocaleString('en-US', {
                                                                dateStyle: 'full',
                                                                timeStyle: 'short'
                                                            })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </Card>
                            )}

                        </div>

                        {/* Enhanced Sidebar Information */}
                        <div className="space-y-6">
                            {/* Member & Order Details Card */}
                            <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/20 to-white dark:from-slate-800 dark:via-blue-900/10 dark:to-slate-800 dark:border-slate-700 overflow-hidden">
                                <div className="h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" />
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-lg dark:text-white">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                        Order Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Member Name - Highlighted */}
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <label className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-2 block">Member Name</label>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 shadow-md">
                                                <User className="h-4 w-4 text-white" />
                                            </div>
                                            <p className="font-bold text-lg text-gray-900 dark:text-white">{order.memberName}</p>
                                        </div>
                                    </div>

                                    <Separator className="my-4 dark:bg-slate-700" />

                                    {/* Order Code */}
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground dark:text-slate-400 uppercase tracking-wide mb-2 block">Order Code</label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                                            <Hash className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                                            <span className="font-mono font-semibold text-gray-900 dark:text-white">{order.orderCode}</span>
                                        </div>
                                    </div>

                                    {/* Order Date */}
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground dark:text-slate-400 uppercase tracking-wide mb-2 block">Order Date</label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                                            <Calendar className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                <span className="text-xs text-muted-foreground dark:text-slate-400">
                                                    {new Date(order.createdAt).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="my-4 dark:bg-slate-700" />

                                    {/* Current Status */}
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground dark:text-slate-400 uppercase tracking-wide mb-3 block">Current Status</label>
                                        <div className="flex justify-center">{getStatusBadge(order.status)}</div>
                                    </div>

                                    {/* Refund Reason */}
                                    {(order.status === "REFUNDED" || order.status === "PARTIALLY_REFUNDED") && order.reasonRefund && (
                                        <>
                                            <Separator className="my-4 dark:bg-slate-700" />
                                            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                                <label className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                    <Info className="h-3.5 w-3.5" />
                                                    Refund Reason
                                                </label>
                                                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed italic">&quot;{order.reasonRefund}&quot;</p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Enhanced Action Cards */}
                            {/* Deliver Action - For PENDING orders */}
                            {order.status === "PENDING" && (
                                <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50/50 to-white dark:from-green-900/20 dark:via-emerald-900/20 dark:to-slate-800 dark:border-slate-700">
                                    <div className="h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-3 text-lg dark:text-white">
                                            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                                <CheckCircle className="h-5 w-5 text-white" />
                                            </div>
                                            Quick Actions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
                                            Mark this order as delivered once the member has received their product.
                                        </p>
                                        <Button
                                            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 dark:from-green-600 dark:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-base"
                                            onClick={handleDeliver}
                                            disabled={isProcessing}
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

                            {/* Refund Action - For COMPLETED or PARTIALLY_REFUNDED orders */}
                            {(order.status === "COMPLETED" || order.status === "PARTIALLY_REFUNDED") && (
                                <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-red-50 via-rose-50/50 to-white dark:from-red-900/20 dark:via-rose-900/20 dark:to-slate-800 dark:border-slate-700">
                                    <div className="h-2 bg-gradient-to-r from-red-400 via-rose-500 to-pink-500" />
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-3 text-lg dark:text-white">
                                            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-lg">
                                                <Undo2 className="h-5 w-5 text-white" />
                                            </div>
                                            Refund Options
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
                                            Process a refund for this order if needed. You can refund the entire order or just a portion.
                                        </p>
                                        <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    className="w-full h-12 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 dark:from-red-600 dark:to-rose-700 dark:hover:from-red-700 dark:hover:to-rose-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-base"
                                                    disabled={isProcessing}
                                                >
                                                    <Undo2 className="h-5 w-5 mr-2" />
                                                    Process Refund
                                                </Button>
                                            </DialogTrigger>

                                            {/* Enhanced Refund Dialog */}
                                            <DialogContent className="sm:max-w-lg dark:bg-slate-800 dark:border-slate-700">
                                                <DialogHeader className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg">
                                                            <Undo2 className="h-6 w-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <DialogTitle className="text-2xl dark:text-white">Process Refund</DialogTitle>
                                                            <DialogDescription className="text-base mt-1 dark:text-slate-300">
                                                                Refund order for <span className="font-semibold text-gray-900 dark:text-white">{order.memberName}</span>
                                                            </DialogDescription>
                                                        </div>
                                                    </div>
                                                </DialogHeader>

                                                {/* <div className="space-y-6 py-4"> */}
                                                <div className="space-y-6 py-4 max-h-[65vh] overflow-y-auto pr-4">
                                                    {/* Order Summary */}
                                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-2">Order Summary</p>
                                                        <div className="space-y-1">
                                                            <p className="text-sm dark:text-slate-300"><span className="font-semibold">Product:</span> {order.productName}</p>
                                                            <p className="text-sm dark:text-slate-300"><span className="font-semibold">Total Quantity:</span> {order.quantity.toLocaleString('en-US')} item(s)</p>
                                                            <p className="text-sm dark:text-slate-300"><span className="font-semibold">Total Points:</span> {order.totalPoints.toLocaleString('en-US')} points</p>
                                                        </div>
                                                    </div>

                                                    {/* Refund Type Selection */}
                                                    <div>
                                                        <Label className="text-sm font-semibold mb-3 block dark:text-white">Select Refund Type</Label>
                                                        <RadioGroup value={refundType} onValueChange={(v) => {
                                                            setRefundType(v as any);
                                                            setPartialQuantityError(null);
                                                        }}
                                                            className="space-y-3"
                                                        >
                                                            <div>
                                                                <RadioGroupItem value="full" id="r-full" className="peer sr-only" />
                                                                <Label
                                                                    htmlFor="r-full"
                                                                    className="flex items-start gap-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 peer-data-[state=checked]:border-blue-500 dark:peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-900/30 [&:has([data-state=checked])]:border-blue-500 cursor-pointer transition-all shadow-sm hover:shadow-md"
                                                                >
                                                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 mt-0.5">
                                                                        <Undo2 className="h-5 w-5 text-white" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span className="font-bold text-base block mb-1 dark:text-white">Full Refund</span>
                                                                        <span className="text-sm text-gray-600 dark:text-slate-300">
                                                                            Cancel the entire order and refund all <span className="font-semibold text-blue-600 dark:text-blue-400">{order.totalPoints.toLocaleString('en-US')} points</span> for <span className="font-semibold">{order.quantity.toLocaleString('en-US')} item(s)</span>.
                                                                        </span>
                                                                    </div>
                                                                </Label>
                                                            </div>
                                                            <div>
                                                                <RadioGroupItem value="partial" id="r-partial" className="peer sr-only" disabled={order.quantity <= 1} />
                                                                <Label
                                                                    htmlFor="r-partial"
                                                                    className={`flex items-start gap-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4 transition-all shadow-sm ${order.quantity > 1 ? 'cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600 peer-data-[state=checked]:border-orange-500 dark:peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50 dark:peer-data-[state=checked]:bg-orange-900/30 [&:has([data-state=checked])]:border-orange-500 hover:shadow-md' : 'cursor-not-allowed opacity-50'}`}
                                                                >
                                                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0 mt-0.5">
                                                                        <Undo2 className="h-5 w-5 text-white" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span className="font-bold text-base block mb-1 dark:text-white">Partial Refund</span>
                                                                        <span className="text-sm text-gray-600 dark:text-slate-300">
                                                                            Refund a specific quantity. {order.quantity <= 1 ? 'Not available for single-item orders.' : 'Choose how many items to refund.'}
                                                                        </span>
                                                                    </div>
                                                                </Label>
                                                            </div>
                                                        </RadioGroup>
                                                    </div>

                                                    {/* Partial Refund Quantity Input */}
                                                    {refundType === "partial" && (() => {
                                                        const pointsPerItem = order!.totalPoints / order!.quantity;
                                                        const partialPoints = (pointsPerItem * (parseInt(partialQuantity) || 0)).toFixed(0);

                                                        return (
                                                            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800 space-y-3">
                                                                <Label htmlFor="partialQuantity" className="text-sm font-semibold flex items-center gap-2 dark:text-orange-300">
                                                                    <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                                    Quantity to Refund
                                                                </Label>
                                                                <Input
                                                                    id="partialQuantity"
                                                                    type="number"
                                                                    value={partialQuantity}
                                                                    // onChange={(e) => setPartialQuantity(e.target.value)}
                                                                    onChange={handlePartialQuantityChange}
                                                                    min={1}
                                                                    max={order!.quantity - 1}
                                                                    // className="text-lg font-semibold h-12"
                                                                    className={`text-lg font-semibold h-12 dark:bg-slate-700 dark:text-white dark:border-slate-600 ${partialQuantityError ? 'border-red-500 focus-visible:ring-red-500 dark:border-red-500' : ''}`}
                                                                />
                                                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-orange-200 dark:border-orange-800">
                                                                    <span className="text-sm text-gray-600 dark:text-slate-300">Points to be refunded:</span>
                                                                    <span className="font-bold text-lg text-orange-600 dark:text-orange-400">{partialPoints} pts</span>
                                                                </div>
                                                                {/* hiển thị lỗi */}
                                                                {partialQuantityError && (
                                                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium px-1">{partialQuantityError}</p>
                                                                )}
                                                                <p className="text-xs text-gray-600 dark:text-slate-400">
                                                                    Enter a value between 1 and {order!.quantity - 1}
                                                                </p>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Refund Reason Input */}
                                                    <div className="space-y-3">
                                                        <Label htmlFor="refundReason" className="text-sm font-semibold flex items-center gap-2 dark:text-white">
                                                            <Info className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                                                            Reason for Refund <span className="text-red-500 dark:text-red-400">*</span>
                                                        </Label>
                                                        <Textarea
                                                            id="refundReason"
                                                            value={refundReason}
                                                            onChange={(e) => setRefundReason(e.target.value)}
                                                            placeholder="e.g., Product out of stock, member request, quality issue..."
                                                            className="min-h-[100px] resize-none dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder:text-slate-400"
                                                        />
                                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                                            Please provide a clear reason for this refund. This will be recorded in the order history.
                                                        </p>
                                                    </div>
                                                </div>

                                                <DialogFooter className="gap-3 pt-4">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setIsRefundModalOpen(false)
                                                            setRefundReason("")
                                                            setRefundType("full")
                                                            setPartialQuantity("1")
                                                            setPartialQuantityError(null)
                                                        }}
                                                        disabled={isProcessing}
                                                        className="flex-1 h-11 border-2 hover:bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        onClick={handleRefund}
                                                        // disabled={isProcessing || !refundReason.trim()}
                                                        disabled={
                                                            isProcessing ||
                                                            !refundReason.trim() ||
                                                            (refundType === 'partial' && !!partialQuantityError) // Logic này ngăn submit khi có lỗi
                                                        }
                                                        className="flex-1 h-11 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 dark:from-red-600 dark:to-rose-700 dark:hover:from-red-700 dark:hover:to-rose-800 text-white font-semibold shadow-lg"
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