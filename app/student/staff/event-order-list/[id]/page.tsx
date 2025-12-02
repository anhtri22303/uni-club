"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    CheckCircle, XCircle, ArrowLeft, Clock, Package, DollarSign, ShoppingCart, User, Hash, Calendar, Undo2, Loader2, Info, WalletCards,
    Image as ImageIcon, ChevronLeft, ChevronRight, X, UploadCloud
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMyStaffEvents } from "@/hooks/use-query-hooks"
import {
     RedeemOrder, completeRedeemOrder, refundRedeemOrder, refundPartialRedeemOrder, RefundPayload,
    uploadRefundImages, getRefundImages, RefundImage, getRedeemOrderById,
    getOrderLogsByMembershipAndOrder, OrderLog,
} from "@/service/redeemApi"
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
    // [MỚI] State cho hình ảnh hoàn trả (Upload)
    const [refundImages, setRefundImages] = useState<File[]>([]);

    // [MỚI] State để xem ảnh phóng to (Preview Gallery)
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    // [MỚI] State cho Order Logs Modal
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);

    // 1. Lấy clubId từ staff event của user
    const { data: staffEvents = [], isLoading: staffEventsLoading } = useMyStaffEvents();

    useEffect(() => {
        if (staffEvents.length > 0 && staffEvents[0].state === "ACTIVE") {
            const activeEvent = staffEvents[0];
            const id = activeEvent.clubId;
            console.log("🔍 [Staff Event Order Detail] Active staff event:", activeEvent);
            console.log("🔍 [Staff Event Order Detail] Using clubId:", id);
            
            setClubId(id);
        } else if (staffEvents.length === 0 && !staffEventsLoading) {
            toast({
                title: "Error",
                description: "You are not assigned as staff to any active event.",
                variant: "destructive",
            });
            router.back();
        }
    }, [staffEvents, staffEventsLoading, router, toast]);

    // Lấy chi tiết đơn hàng theo orderId
    const {
        data: order,
        isLoading: loading,
        error,
    } = useQuery<UiOrder, Error>({
        queryKey: ["eventOrderDetail", params.id],
        queryFn: () => getRedeemOrderById(params.id),
        enabled: !!params.id,
    })

    // === Query lấy danh sách ảnh lỗi từ Server ===
    const { data: serverRefundImages } = useQuery<RefundImage[]>({
        queryKey: ["refundImages", order?.orderId],
        queryFn: () => getRefundImages(order!.orderId),
        enabled: !!order?.orderId && (order.status === "REFUNDED" || order.status === "PARTIALLY_REFUNDED"),
    });

    // Query lấy order logs
    const { data: orderLogs = [], error: logsError } = useQuery<OrderLog[]>({
        queryKey: ["orderLogs", order?.orderId, order?.membershipId],
        queryFn: async () => {
            if (!order?.orderId || !order?.membershipId) {
                console.log("⚠️ Order ID or Membership ID not available yet", { orderId: order?.orderId, membershipId: order?.membershipId });
                return [];
            }
            console.log("🔍 Fetching order logs for:", { membershipId: order.membershipId, orderId: order.orderId });
            try {
                const logs = await getOrderLogsByMembershipAndOrder(order.membershipId, order.orderId);
                console.log("✅ Order logs fetched successfully:", logs);
                return logs;
            } catch (error: any) {
                console.error("❌ Failed to fetch order logs:", {
                    membershipId: order.membershipId,
                    orderId: order.orderId,
                    error: error,
                    response: error?.response?.data,
                    status: error?.response?.status
                });
                return [];
            }
        },
        enabled: !!order?.orderId && !!order?.membershipId,
        retry: 1,
    });
    console.log("Check Order Logs:", orderLogs);
    console.log("Order Data:", order);

    // Các hàm xử lý ảnh
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            if (refundImages.length + filesArray.length > 5) {
                toast({ title: "Limit Exceeded", description: "Max 5 images allowed.", variant: "destructive" });
                return;
            }
            setRefundImages((prev) => [...prev, ...filesArray]);
        }
    };

    const removeImage = (index: number) => {
        setRefundImages((prev) => prev.filter((_, i) => i !== index));
    };

    const showNextImage = () => {
        if (serverRefundImages && previewIndex !== null) {
            setPreviewIndex((prev) => (prev! + 1) % serverRefundImages.length);
        }
    };

    const showPrevImage = () => {
        if (serverRefundImages && previewIndex !== null) {
            setPreviewIndex((prev) => (prev! - 1 + serverRefundImages.length) % serverRefundImages.length);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (previewIndex === null) return;
            if (e.key === "ArrowRight") showNextImage();
            if (e.key === "ArrowLeft") showPrevImage();
            if (e.key === "Escape") setPreviewIndex(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [previewIndex, serverRefundImages]);

    // Xử lý "Delivered"
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

            await queryClient.invalidateQueries({ queryKey: ["eventOrderDetail", params.id] });
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

    // Xử lý Refund
    const handleRefund = async () => {
        if (!order || !clubId) return

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
            // Bước 1: Upload ảnh
            if (refundImages.length > 0) {
                try {
                    await uploadRefundImages(order.orderId, refundImages);
                } catch (uploadError) {
                    console.error("Image upload failed:", uploadError);
                    toast({
                        title: "Warning",
                        description: "Failed to upload refund images, but proceeding with refund.",
                        variant: "destructive",
                    });
                }
            }

            // Bước 2: Refund
            if (refundType === "full") {
                const payload: RefundPayload = {
                    orderId: order.orderId,
                    quantityToRefund: order.quantity,
                    reason: refundReason,
                };
                await refundRedeemOrder(payload)
                toast({
                    title: "Success",
                    description: "Order has been successfully cancelled and refunded.",
                    variant: "success",
                })
            } else {
                const qty = parseInt(partialQuantity);
                if (!qty || qty <= 0) throw new Error("Quantity to refund must be greater than 0.");
                if (qty >= order.quantity) throw new Error("Quantity is too high. Use 'Full Refund' instead.");

                const payload: RefundPayload = {
                    orderId: order.orderId,
                    quantityToRefund: qty,
                    reason: refundReason,
                };
                await refundPartialRedeemOrder(payload)
                toast({
                    title: "Success",
                    description: `Successfully refunded ${qty} item(s).`,
                    variant: "success",
                })
            }

            setIsRefundModalOpen(false)
            setRefundType("full")
            setPartialQuantity("1")
            setRefundReason("")
            setRefundImages([])

            await queryClient.invalidateQueries({ queryKey: ["eventOrderDetail", params.id] })
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
    
    // Xử lý thay đổi số lượng partial
    const handlePartialQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPartialQuantity(value);
    };

    // Helper functions để lấy logs theo action
    const getLogsByAction = (action: string) => {
        return orderLogs.filter(log => log.action === action).sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    };

    const getLatestLogDate = (action: string) => {
        const logs = getLogsByAction(action);
        return logs.length > 0 ? logs[0].createdAt : null;
    };

    const handleStepClick = (action: string) => {
        const logs = getLogsByAction(action);
        if (logs.length > 0) {
            setSelectedAction(action);
            setIsLogModalOpen(true);
        } else if (action === 'CREATE') {
            // Hiển thị toast thông báo khi click vào Pending nhưng không có logs
            toast({
                title: "No Logs Available",
                description: "Order was created and confirmed as Completed at the same time, please check the Completed logs instead.",
                variant: "default",
            });
        }
    };

    // Determine status color theme
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
                    <Badge className="px-4 py-2 bg-gradient-to-r from-red-400 to-rose-500 text-white border-0 shadow-lg font-semibold text-sm">
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

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={["student"]}>
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

    if (error || !order) {
        return (
            <ProtectedRoute allowedRoles={["student"]}>
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
                                <Link href="/student/staff/event-order-list">
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

    // Theme colors
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
        <ProtectedRoute allowedRoles={["student"]}>
            <AppShell>
                <div className="space-y-6">
                    {/* Order Progress Bar */}
                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg">
                        {/* Back Button */}
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                            <Link href="/student/staff/event-order-list">
                                <Button variant="ghost" size="sm" className="gap-2 hover:bg-gray-100 dark:hover:bg-slate-700">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Event Order List
                                </Button>
                            </Link>
                        </div>

                        {/* Order Header */}
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                                    <Package className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Order #{order.orderCode}
                                    </h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                            year: 'numeric', month: 'long', day: 'numeric' 
                                        })}
                                    </p>
                                </div>
                            </div>
                            {getStatusBadge(order.status)}
                        </div>

                        {/* Progress Bar */}
                        <div className="px-6 pb-6">
                            <div className="relative">
                                {/* Progress Line */}
                                <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 dark:bg-slate-700" style={{ marginLeft: '2rem', marginRight: '2rem' }} />
                                <div 
                                    className="absolute top-6 left-0 h-1 transition-all duration-500 ease-in-out"
                                    style={{
                                        marginLeft: '2rem',
                                        width: order.status === 'PENDING' ? '0%' : 
                                               order.status === 'COMPLETED' ? 'calc(50% - 2rem)' : 
                                               'calc(100% - 4rem)',
                                        background: order.status === 'PENDING' ? 'transparent' :
                                                   order.status === 'COMPLETED' ? 'linear-gradient(to right, #10b981, #14b8a6)' :
                                                   'linear-gradient(to right, #10b981, #14b8a6, #f87171)'
                                    }}
                                />

                                {/* Progress Steps */}
                                <div className="relative flex justify-between items-start">
                                    {/* Step 1: PENDING */}
                                    <div className="flex flex-col items-center" style={{ flex: 1 }}>
                                        <div 
                                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                                                order.status === 'PENDING' || order.status === 'COMPLETED' || order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED'
                                                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 shadow-lg shadow-yellow-500/50 cursor-pointer hover:scale-110'
                                                    : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600'
                                            }`}
                                            onClick={() => handleStepClick('CREATE')}
                                        >
                                            <Clock className={`h-6 w-6 ${
                                                order.status === 'PENDING' || order.status === 'COMPLETED' || order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED'
                                                    ? 'text-white'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`} />
                                        </div>
                                        <div className="mt-3 text-center">
                                            <p className={`text-sm font-semibold ${
                                                order.status === 'PENDING' || order.status === 'COMPLETED' || order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED'
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                                Pending
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Order placed
                                            </p>
                                            {(() => {
                                                const latestDate = getLatestLogDate('CREATE');
                                                if (latestDate) {
                                                    const date = new Date(latestDate);
                                                    return (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-1">
                                                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            <br />
                                                            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        </p>
                                                    );
                                                }
                                                return (
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-1">
                                                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        <br />
                                                        {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                    </p>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Step 2: DELIVERED */}
                                    <div className="flex flex-col items-center" style={{ flex: 1 }}>
                                        <div 
                                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                                                order.status === 'COMPLETED'
                                                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-300 shadow-lg shadow-green-500/50 cursor-pointer hover:scale-110'
                                                    : (order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED')
                                                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-300 shadow-lg shadow-green-500/50 cursor-pointer hover:scale-110'
                                                    : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600'
                                            }`}
                                            onClick={() => handleStepClick('COMPLETED')}
                                        >
                                            <CheckCircle className={`h-6 w-6 ${
                                                order.status === 'COMPLETED' || order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED'
                                                    ? 'text-white'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`} />
                                        </div>
                                        <div className="mt-3 text-center">
                                            <p className={`text-sm font-semibold ${
                                                order.status === 'COMPLETED' || order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED'
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                                Delivered
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Order completed
                                            </p>
                                            {(() => {
                                                // 1. Ưu tiên tìm trong Log (nếu API sửa xong sau này)
                                                // Lưu ý: Backend thường lưu action là "COMPLETED" chứ không phải "DELIVER"
                                                let timestamp = getLatestLogDate('COMPLETED') || getLatestLogDate('DELIVER');

                                                // 2. Nếu Log rỗng, dùng completedAt từ thông tin đơn hàng
                                                if (!timestamp && order.status === 'COMPLETED' && order.completedAt) {
                                                    timestamp = order.completedAt;
                                                }

                                                if (timestamp) {
                                                    const date = new Date(timestamp);
                                                    return (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-1">
                                                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            <br />
                                                            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        </p>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>

                                    {/* Step 3: REFUNDED */}
                                    <div className="flex flex-col items-center" style={{ flex: 1 }}>
                                        <div 
                                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                                                order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED'
                                                    ? 'bg-gradient-to-br from-red-400 to-rose-500 border-red-300 shadow-lg shadow-red-500/50 cursor-pointer hover:scale-110'
                                                    : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600'
                                            }`}
                                            onClick={() => handleStepClick('REFUND')}
                                        >
                                            <Undo2 className={`h-6 w-6 ${
                                                order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED'
                                                    ? 'text-white'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`} />
                                        </div>
                                        <div className="mt-3 text-center">
                                            <p className={`text-sm font-semibold ${
                                                order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED'
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                                {order.status === 'PARTIALLY_REFUNDED' ? 'Partial Refund' : 'Refunded'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED' ? 'Refund processed' : 'If needed'}
                                            </p>
                                            {(() => {
                                                const latestDate = getLatestLogDate('REFUND');
                                                if (latestDate) {
                                                    const date = new Date(latestDate);
                                                    return (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-1">
                                                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            <br />
                                                            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        </p>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Product Information Card */}
                            <Card className="border-0 shadow-xl overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                                <div className="h-2 w-full bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400" />
                                <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
                                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                                            <Package className="h-5 w-5 text-white" />
                                        </div>
                                        Product Information
                                    </CardTitle>
                                </CardHeader>
                                
                                <CardContent className="space-y-6 pt-6">
                                    {/* Product Name - Styled like Club Order */}
                                    <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800 shadow-sm">
                                        <label className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-2 block">
                                            Product Name
                                        </label>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{order.productName}</p>
                                    </div>

                                    {/* Stats Grid - Styled like Club Order */}
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

                                    {/* Points calculation footer */}
                                    <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <DollarSign className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                                        <span className="text-sm text-gray-600 dark:text-slate-300">
                                            <span className="font-semibold">{(order.totalPoints / order.quantity).toLocaleString('en-US')}</span> points per item
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Status Log Card */}
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
                                                            <span>{new Date(order.completedAt).toLocaleString('en-US')}</span>
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
                                                            <span>{new Date(order.completedAt).toLocaleString('en-US')}</span>
                                                        </div>

                                                        {serverRefundImages && serverRefundImages.length > 0 && (
                                                            <div className="mt-5 pt-4 border-t border-orange-200/60 dark:border-orange-700/50">
                                                                <label className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide flex items-center gap-2 mb-3">
                                                                    <ImageIcon className="h-4 w-4" />
                                                                    Proof of Defect
                                                                </label>
                                                                <div className="flex flex-wrap gap-3">
                                                                    {serverRefundImages.map((imgItem, index) => (
                                                                        <div 
                                                                            key={imgItem.id}
                                                                            className="relative group w-20 h-20 rounded-lg overflow-hidden border border-orange-200 dark:border-orange-700 shadow-sm cursor-zoom-in bg-white"
                                                                            onClick={() => setPreviewIndex(index)}
                                                                        >
                                                                            <img 
                                                                                src={imgItem.imageUrl} 
                                                                                alt={`Proof ${imgItem.id}`} 
                                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {order.status === "REFUNDED" && (
                                        <>
                                            <div className="h-2 bg-gradient-to-r from-red-400 via-rose-500 to-pink-500" />
                                            <div className="bg-gradient-to-br from-red-50 via-rose-50/50 to-white dark:from-red-900/20 dark:via-rose-900/20 dark:to-slate-800 p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 shadow-lg flex-shrink-0">
                                                        <Undo2 className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-1">Fully Refunded</h3>
                                                        <p className="text-sm text-red-700 dark:text-red-300">
                                                            This order has been completely cancelled and all points refunded.
                                                        </p>
                                                        <div className="mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            <span>{new Date(order.completedAt).toLocaleString('en-US')}</span>
                                                        </div>

                                                        {serverRefundImages && serverRefundImages.length > 0 && (
                                                            <div className="mt-5 pt-4 border-t border-red-200/60 dark:border-red-700/50">
                                                                <label className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wide flex items-center gap-2 mb-3">
                                                                    <ImageIcon className="h-4 w-4" />
                                                                    Proof of Defect
                                                                </label>
                                                                <div className="flex flex-wrap gap-3">
                                                                    {serverRefundImages.map((imgItem, index) => (
                                                                        <div 
                                                                            key={imgItem.id}
                                                                            className="relative group w-20 h-20 rounded-lg overflow-hidden border border-red-200 dark:border-red-700 shadow-sm cursor-zoom-in bg-white"
                                                                            onClick={() => setPreviewIndex(index)}
                                                                        >
                                                                            <img 
                                                                                src={imgItem.imageUrl} 
                                                                                alt={`Proof ${imgItem.id}`} 
                                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </Card>
                            )}
                        </div>

                        {/* Sidebar Information */}
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

                            {/* Action Buttons */}
                            {order.status === "PENDING" && (
                                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-emerald-50/50 to-white dark:from-green-900/20 dark:via-emerald-900/20 dark:to-slate-800 dark:border-slate-700">
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
                                            
                                            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col dark:bg-slate-800 dark:border-slate-700">
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

                                                <div className="flex-1 overflow-y-auto p-1 pr-2 space-y-6">
                                                    {/* Order Summary */}
                                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-2">Order Summary</p>
                                                        <div className="space-y-1">
                                                            <p className="text-sm dark:text-slate-300"><span className="font-semibold">Product:</span> {order.productName}</p>
                                                            <p className="text-sm dark:text-slate-300"><span className="font-semibold">Total Quantity:</span> {order.quantity.toLocaleString('en-US')} item(s)</p>
                                                            <p className="text-sm dark:text-slate-300"><span className="font-semibold">Total Points:</span> {order.totalPoints.toLocaleString('en-US')} points</p>
                                                        </div>
                                                    </div>

                                                    {/* Refund Type */}
                                                    <div className="space-y-3">
                                                        <Label className="text-sm font-semibold mb-3 block dark:text-white">Select Refund Type</Label>
                                                        <RadioGroup value={refundType} onValueChange={(v) => setRefundType(v as any)} className="space-y-3">
                                                            <div>
                                                                <RadioGroupItem value="full" id="r-full" className="peer sr-only" />
                                                                <Label htmlFor="r-full" className="flex items-start gap-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 peer-data-[state=checked]:border-blue-500 dark:peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-900/30 [&:has([data-state=checked])]:border-blue-500 cursor-pointer transition-all shadow-sm hover:shadow-md">
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
                                                                <Label htmlFor="r-partial" className={`flex items-start gap-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4 transition-all shadow-sm ${order.quantity > 1 ? 'cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600 peer-data-[state=checked]:border-orange-500 dark:peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50 dark:peer-data-[state=checked]:bg-orange-900/30 [&:has([data-state=checked])]:border-orange-500 hover:shadow-md' : 'cursor-not-allowed opacity-50'}`}>
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

                                                    {/* Partial Quantity Input */}
                                                    {refundType === "partial" && (() => {
                                                        const pointsPerItem = order.totalPoints / order.quantity;
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
                                                                    onChange={handlePartialQuantityChange}
                                                                    min={1}
                                                                    max={order.quantity - 1}
                                                                    className="text-lg font-semibold h-12 dark:bg-slate-700 dark:text-white dark:border-slate-600"
                                                                />
                                                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-orange-200 dark:border-orange-800">
                                                                    <span className="text-sm text-gray-600 dark:text-slate-300">Points to be refunded:</span>
                                                                    <span className="font-bold text-lg text-orange-600 dark:text-orange-400">{partialPoints} pts</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600 dark:text-slate-400">
                                                                    Enter a value between 1 and {order.quantity - 1}
                                                                </p>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Image Upload */}
                                                    <div className="space-y-3">
                                                        <Label className="text-sm font-semibold flex items-center gap-2 dark:text-white">
                                                            <ImageIcon className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                                                            Product Defects / Proof Images <span className="text-xs font-normal text-muted-foreground ml-auto">(Max 5 images)</span>
                                                        </Label>
                                                        <div className="grid w-full gap-4">
                                                            <div className="flex items-center justify-center w-full">
                                                                <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${refundImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 dark:border-slate-600'}`}>
                                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                                                        <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                                                                        <p className="mb-1 text-sm text-gray-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                                        <p className="text-xs text-gray-400 dark:text-slate-500">PNG, JPG or JPEG</p>
                                                                    </div>
                                                                    <Input id="dropzone-file" type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} disabled={refundImages.length >= 5} />
                                                                </label>
                                                            </div>
                                                            {refundImages.length > 0 && (
                                                                <div className="grid grid-cols-5 gap-2 mt-2">
                                                                    {refundImages.map((file, index) => (
                                                                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
                                                                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                                                            <button type="button" onClick={() => removeImage(index)} aria-label="Remove image" className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><XCircle className="h-3 w-3" /></button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Refund Reason */}
                                                    <div className="space-y-3">
                                                        <Label htmlFor="refundReason" className="text-sm font-semibold flex items-center gap-2 dark:text-white">
                                                            <Info className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                                                            Reason for Refund <span className="text-red-500 dark:text-red-400">*</span>
                                                        </Label>
                                                        <Textarea 
                                                            id="refundReason" 
                                                            value={refundReason} 
                                                            onChange={(e) => setRefundReason(e.target.value)} 
                                                            placeholder="e.g., Product unavailable, member request, event cancelled..." 
                                                            className="min-h-[100px] resize-none dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder:text-slate-400" 
                                                        />
                                                        <p className="text-xs text-gray-500 dark:text-slate-400">Please provide a clear reason for this refund. This will be recorded in the order history.</p>
                                                    </div>
                                                </div>

                                                <DialogFooter className="gap-3 pt-4">
                                                    <Button 
                                                        type="button" 
                                                        variant="outline" 
                                                        onClick={() => setIsRefundModalOpen(false)}
                                                        disabled={isProcessing}
                                                        className="flex-1 h-11 border-2 hover:bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Cancel
                                                    </Button>
                                                    <Button 
                                                        type="submit" 
                                                        onClick={handleRefund}
                                                        disabled={isProcessing || !refundReason.trim() || (refundType === 'partial' && (parseInt(partialQuantity) <= 0 || parseInt(partialQuantity) >= order.quantity))}
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

                    {/* Order Logs Modal */}
                    <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Order Logs - {selectedAction}
                                </DialogTitle>
                                <DialogDescription>
                                    Detailed history of all {selectedAction} actions for this order
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {selectedAction && getLogsByAction(selectedAction).length > 0 ? (
                                    getLogsByAction(selectedAction).map((log, index) => (
                                        <Card key={log.id} className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-all">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <Badge className={`px-3 py-1 font-semibold ${
                                                        log.action === 'CREATE' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                                        log.action === 'DELIVER' ? 'bg-green-500 hover:bg-green-600' :
                                                        log.action === 'REFUND' ? 'bg-red-500 hover:bg-red-600' :
                                                        'bg-blue-500 hover:bg-blue-600'
                                                    }`}>
                                                        {log.action}
                                                    </Badge>
                                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                        <Calendar className="h-4 w-4 mr-1" />
                                                        {new Date(log.createdAt).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Actor</p>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            {log.actorName}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Target User</p>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            {log.targetUserName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Quantity</p>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{log.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                            <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Points Change</p>
                                                            <p className={`text-sm font-bold ${
                                                                log.pointsChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                            }`}>
                                                                {log.pointsChange > 0 ? '+' : ''}{log.pointsChange}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {log.reason && (
                                                    <>
                                                        <Separator />
                                                        <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Reason</p>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">{log.reason}</p>
                                                        </div>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        No logs found for this action
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Gallery Modal */}
                    <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
                        <DialogContent className="max-w-none w-auto h-auto bg-transparent border-none shadow-none p-0 flex items-center justify-center outline-none focus:outline-none [&>button]:hidden">
                            {serverRefundImages && previewIndex !== null && (
                                <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col w-[95vw] h-[70vh] md:w-[1200px] md:h-[800px] p-4">
                                    <div className="absolute top-4 right-4 z-50">
                                        <button onClick={() => setPreviewIndex(null)} aria-label="Close image preview" className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full text-gray-600 dark:text-gray-300 transition-all">
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>
                                    <div className="relative flex-1 w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden mt-10 md:mt-0">
                                        {serverRefundImages.length > 1 && (
                                            <button onClick={(e) => { e.stopPropagation(); showPrevImage(); }} aria-label="Previous image" className="absolute left-4 p-3 bg-black/30 hover:bg-black/50 rounded-full text-white transition-all z-40 group backdrop-blur-sm"><ChevronLeft className="h-8 w-8 group-hover:-translate-x-0.5 transition-transform" /></button>
                                        )}
                                        <img src={serverRefundImages[previewIndex].imageUrl} alt="Refund Proof Fullsize" className="w-full h-full object-contain" />
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-xs font-medium rounded-full backdrop-blur-md border border-white/10">{previewIndex + 1} / {serverRefundImages.length}</div>
                                        {serverRefundImages.length > 1 && (
                                            <button onClick={(e) => { e.stopPropagation(); showNextImage(); }} aria-label="Next image" className="absolute right-4 p-3 bg-black/30 hover:bg-black/50 rounded-full text-white transition-all z-40 group backdrop-blur-sm"><ChevronRight className="h-8 w-8 group-hover:translate-x-0.5 transition-transform" /></button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </AppShell>
        </ProtectedRoute>
    )
}
