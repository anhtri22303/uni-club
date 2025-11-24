"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle, XCircle, Clock, Building, DollarSign, Loader2, Info, Eye, } from "lucide-react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    usePointRequests, // <-- Hook mới từ Bước 1
    reviewPointRequest,
    PointRequest,
    ReviewPointRequestPayload,
} from "@/service/pointRequestsApi"

export default function UniStaffPointRequestsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState<
        "PENDING" | "APPROVED" | "REJECTED"
    >("PENDING")

    // State cho modal duyệt đơn
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<PointRequest | null>(null)
    const [reviewNote, setReviewNote] = useState("")
    const [isApproving, setIsApproving] = useState(false)

    // Pagination state
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(6) // Tăng pageSize lên một chút

    const { toast } = useToast()
    const queryClient = useQueryClient()

    // 1. Fetch dữ liệu bằng React Query
    const {
        data: response,
        isLoading: loading,
        error,
    } = usePointRequests()
    const allRequests: PointRequest[] = response?.data || []

    // 2. Logic duyệt đơn (Giống như trang Table tôi gửi trước)
    const reviewMutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number
            payload: ReviewPointRequestPayload
        }) => reviewPointRequest(id, payload),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Request reviewed successfully."
            })
            queryClient.invalidateQueries({ queryKey: ["point-requests"] })
            setShowReviewModal(false)
            setSelectedRequest(null)
            setReviewNote("")
        },
        onError: (err: any) => {
            toast({
                title: "Error",
                description:
                    err?.response?.data?.error || err?.response?.data?.message || "Failed to review request.",
                variant: "destructive",
            })
        },
    })

    // 3. Handlers để mở modal và submit
    const handleOpenReviewModal = (
        request: PointRequest,
        action: "approve" | "reject"
    ) => {
        setSelectedRequest(request)
        setIsApproving(action === "approve")
        setReviewNote(request.staffNote || "") // Tải note cũ nếu có
        setShowReviewModal(true)
    }

    const handleSubmitReview = () => {
        if (!selectedRequest) return

        const payload: ReviewPointRequestPayload = {
            approve: isApproving,
            note: reviewNote.trim() || (isApproving ? "Approved" : "Rejected"),
        }
        reviewMutation.mutate({ id: selectedRequest.id, payload })
    }

    // 4. Lọc và Phân trang (Logic từ trang Event)
    const filteredRequests = allRequests
        .filter((req) => {
            // Lọc theo Tab
            const matchTab = (req.status || "PENDING") === activeTab

            // Lọc theo Search Term
            const q = searchTerm.trim().toLowerCase()
            const matchSearch =
                q === "" ||
                req.clubName?.toLowerCase().includes(q) ||
                req.reason?.toLowerCase().includes(q)

            return matchTab && matchSearch
        })
        // Sắp xếp: ID mới nhất lên đầu
        .sort((a, b) => b.id - a.id)

    // Kẹp trang khi filter thay đổi
    useEffect(() => {
        const last = Math.max(0, Math.ceil(filteredRequests.length / pageSize) - 1)
        if (page > last) setPage(last)
    }, [filteredRequests.length, pageSize, page])

    // Reset về trang 0 khi đổi tab
    useEffect(() => {
        setPage(0)
    }, [activeTab])

    const paginated = (() => {
        const start = page * pageSize
        return filteredRequests.slice(start, start + pageSize)
    })()

    // 5. Helper (Lấy từ trang Event)
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <Badge
                        variant="outline"
                        className="bg-yellow-100 text-yellow-700 border-yellow-500 font-semibold"
                    >
                        <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
                        Pending
                    </Badge>
                )
            case "APPROVED":
                return (
                    <Badge
                        variant="default"
                        className="bg-green-600 text-white border-green-600 font-semibold"
                    >
                        <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                        Approved
                    </Badge>
                )
            case "REJECTED":
                return (
                    <Badge variant="destructive" className="font-semibold">
                        <span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
                        Rejected
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    // 6. Tính toán các thẻ Stats (Lấy từ trang Event)
    const pendingCount = allRequests.filter(
        (e) => (e.status ?? "PENDING") === "PENDING"
    ).length
    const approvedCount = allRequests.filter(
        (e) => e.status === "APPROVED"
    ).length
    const rejectedCount = allRequests.filter(
        (e) => e.status === "REJECTED"
    ).length

    return (
        <ProtectedRoute allowedRoles={["uni_staff"]}>
            <AppShell>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            Club Point Requests
                        </h1>
                        <p className="text-muted-foreground">
                            Review and manage club requests for additional points
                        </p>
                    </div>

                    {/* Stats Cards (Layout từ trang Event) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                            <CardHeader className="pb-3 px-4 pt-3">
                                <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                                    Pending Requests
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-yellow-500 rounded-md">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                                            {pendingCount}
                                        </div>
                                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                            Waiting requests
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                            <CardHeader className="pb-3 px-4 pt-3">
                                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                                    Approved
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-green-500 rounded-md">
                                        <CheckCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                            {approvedCount}
                                        </div>
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            Approved requests
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
                            <CardHeader className="pb-3 px-4 pt-3">
                                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                                    Rejected
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-red-500 rounded-md">
                                        <XCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                                            {rejectedCount}
                                        </div>
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            Rejected requests
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tab Buttons (Layout từ trang Event) */}
                    <div className="flex gap-3 border-b-2 border-gray-200 dark:border-gray-700">
                        <Button
                            variant={activeTab === "PENDING" ? "default" : "ghost"}
                            size="lg"
                            className={`flex-1 rounded-b-none py-6 text-base font-semibold transition-all ${activeTab === "PENDING"
                                ? "border-b-4 border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300"
                                : "border-b-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                            onClick={() => setActiveTab("PENDING")}
                        >
                            <Clock className="h-5 w-5 mr-2" />
                            Pending ({pendingCount}) {/* <-- Đã đổi tên */}
                        </Button>
                        <Button
                            variant={activeTab === "APPROVED" ? "default" : "ghost"}
                            size="lg"
                            className={`flex-1 rounded-b-none py-6 text-base font-semibold transition-all ${activeTab === "APPROVED"
                                ? "border-b-4 border-green-500 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300"
                                : "border-b-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                            onClick={() => setActiveTab("APPROVED")}
                        >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Approved ({approvedCount})
                        </Button>
                        <Button
                            variant={activeTab === "REJECTED" ? "default" : "ghost"}
                            size="lg"
                            className={`flex-1 rounded-b-none py-6 text-base font-semibold transition-all ${activeTab === "REJECTED"
                                ? "border-b-4 border-red-500 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
                                : "border-b-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                            onClick={() => setActiveTab("REJECTED")}
                        >
                            <XCircle className="h-5 w-5 mr-2" />
                            Rejected ({rejectedCount})
                        </Button>
                    </div>

                    {/* Filters (Đã đơn giản hóa từ trang Event) */}
                    <div className="flex items-center gap-2 max-w-sm w-full">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by club name or reason..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Danh sách Card (Layout từ trang Event) */}
                    <div className="grid gap-4">
                        {loading ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    Loading requests...
                                </CardContent>
                            </Card>
                        ) : error ? (
                            <Card>
                                <CardContent className="py-12 text-center text-destructive">
                                    Error loading requests: {String(error)}
                                </CardContent>
                            </Card>
                        ) : filteredRequests.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <Info className="h-8 w-8 mx-auto mb-2" />
                                    No requests found for this tab.
                                </CardContent>
                            </Card>
                        ) : (
                            paginated.map((request) => {
                                // Border màu (Lấy từ trang Event)
                                let borderClass = ""
                                if (request.status === "APPROVED") {
                                    borderClass = "border-l-4 border-l-green-500"
                                } else if (request.status === "PENDING") {
                                    borderClass = "border-l-4 border-l-yellow-500"
                                } else if (request.status === "REJECTED") {
                                    borderClass = "border-l-4 border-l-red-500 opacity-70"
                                }

                                return (
                                    <Card
                                        key={request.id}
                                        className={`hover:shadow-md transition-shadow ${borderClass}`}
                                    >
                                        {/* Bỏ Link vì các nút action nằm ngay trên Card */}
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    {/* Dòng 1: Tên Club + Status */}
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Building className="h-5 w-5 text-muted-foreground" />
                                                        <h3 className="font-semibold text-lg">
                                                            {request.clubName}
                                                        </h3>
                                                        {getStatusBadge(request.status)}
                                                    </div>

                                                    {/* Dòng 2: Số điểm xin */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <DollarSign className="h-5 w-5 text-green-600" />
                                                        <span className="text-xl font-bold text-green-700">
                                                            {request.requestedPoints.toLocaleString()}{" "}
                                                            points
                                                        </span>
                                                    </div>

                                                    {/* Dòng 3: Lý do */}
                                                    <p className="text-muted-foreground mb-3 line-clamp-2">
                                                        <strong>Reason:</strong> {request.reason}
                                                    </p>

                                                    {/* Dòng 4: Note của Staff (nếu có) */}
                                                    {request.staffNote &&
                                                        request.status !== "PENDING" && (
                                                            <p className="text-sm text-gray-500 italic border-l-2 pl-2">
                                                                <strong>Staff Note:</strong>{" "}
                                                                {request.staffNote}
                                                            </p>
                                                        )}
                                                </div>

                                                {/* Nút Actions (Lấy từ trang Event) */}
                                                <div className="flex items-center gap-2 ml-4">
                                                    {/* Chỉ hiển thị nút khi đang ở tab PENDING */}
                                                    {request.status === "PENDING" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                className="h-8 w-8 p-0"
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    handleOpenReviewModal(request, "approve")
                                                                }}
                                                                disabled={reviewMutation.isPending}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-8 w-8 p-0"
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    handleOpenReviewModal(request, "reject")
                                                                }}
                                                                disabled={reviewMutation.isPending}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {/* Nút Edit cho các đơn đã duyệt */}
                                                    {request.status !== "PENDING" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                handleOpenReviewModal(
                                                                    request,
                                                                    request.status === "APPROVED"
                                                                        ? "approve"
                                                                        : "reject"
                                                                )
                                                            }}
                                                            disabled={reviewMutation.isPending}
                                                        >
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            View/Edit Note
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })
                        )}
                    </div>

                    {/* Pagination controls (Lấy từ trang Event) */}
                    <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-muted-foreground">
                            Showing {filteredRequests.length === 0 ? 0 : page * pageSize + 1}{" "}
                            to{" "}
                            {Math.min(
                                (page + 1) * pageSize,
                                filteredRequests.length
                            )}{" "}
                            of {filteredRequests.length} requests
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPage(0)}
                                disabled={page === 0}
                            >
                                First
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                Prev
                            </Button>
                            <div className="px-2 text-sm">
                                Page {filteredRequests.length === 0 ? 0 : page + 1} /{" "}
                                {Math.max(1, Math.ceil(filteredRequests.length / pageSize))}
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(
                                            p + 1,
                                            Math.max(
                                                0,
                                                Math.ceil(filteredRequests.length / pageSize) - 1
                                            )
                                        )
                                    )
                                }
                                disabled={
                                    (page + 1) * pageSize >= filteredRequests.length
                                }
                            >
                                Next
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    setPage(
                                        Math.max(
                                            0,
                                            Math.ceil(filteredRequests.length / pageSize) - 1
                                        )
                                    )
                                }
                                disabled={
                                    (page + 1) * pageSize >= filteredRequests.length
                                }
                            >
                                Last
                            </Button>
                            <select
                                aria-label="Items per page"
                                className="ml-2 rounded border px-2 py-1 text-sm"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value))
                                    setPage(0)
                                }}
                            >
                                <option value={3}>3</option>
                                <option value={6}>6</option>
                                <option value={12}>12</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Modal để Approve/Reject (Lấy từ trang Table) */}
                <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {/* Cho phép edit note cũ */}
                                {selectedRequest?.status === "PENDING"
                                    ? isApproving
                                        ? "Approve"
                                        : "Reject"
                                    : "View/Edit Note for"}{" "}
                                Point Request
                            </DialogTitle>
                            <DialogDescription>
                                Request from <strong>{selectedRequest?.clubName}</strong> for{" "}
                                <strong>
                                    {selectedRequest?.requestedPoints.toLocaleString()} points
                                </strong>
                                .
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            <Label htmlFor="review-note">
                                Note{" "}
                                {selectedRequest?.status === "PENDING" && !isApproving
                                    ? "(Required for rejection)"
                                    : "(Optional)"}
                            </Label>
                            <Textarea
                                id="review-note"
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                placeholder={
                                    isApproving
                                        ? "Reason for approval (e.g., event budget verified)"
                                        : "Reason for rejection (e.g., invalid reason)"
                                }
                                disabled={reviewMutation.isPending}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowReviewModal(false)}
                                disabled={reviewMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitReview}
                                disabled={
                                    reviewMutation.isPending ||
                                    (selectedRequest?.status === "PENDING" &&
                                        !isApproving &&
                                        !reviewNote.trim()) // Cần note khi reject
                                }
                                variant={
                                    isApproving || selectedRequest?.status === "APPROVED"
                                        ? "default"
                                        : "destructive"
                                }
                            >
                                {reviewMutation.isPending && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                {selectedRequest?.status === "PENDING"
                                    ? `Confirm ${isApproving ? "Approval" : "Rejection"}`
                                    : "Save Note"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AppShell>
        </ProtectedRoute>
    )
}