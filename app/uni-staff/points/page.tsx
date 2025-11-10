"use client"

import React, { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Users, ShieldCheck, ChevronLeft, ChevronRight, Send, UserCircle, History, Search } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group" // ✨ THÊM DÒNG NÀY
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
// ✨ --- IMPORT API THẬT --- ✨
import { fetchClub } from "@/service/clubApi"
import { pointsToClubs, getUniToClubTransactions, ApiUniToClubTransaction } from "@/service/walletApi"
import { usePointRequests, PointRequest } from "@/service/pointRequestsApi"

// Định nghĩa một kiểu dữ liệu cơ bản cho Club
interface Club {
    id: number | string;
    name: string;
    logoUrl?: string | null;
    memberCount?: number;
    leaderName?: string | null;
}

export default function UniversityStaffRewardPage() {
    const { toast } = useToast()
    const [allClubs, setAllClubs] = useState<Club[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [selectedClubs, setSelectedClubs] = useState<Record<string, boolean>>({})
    const [rewardAmount, setRewardAmount] = useState<number | ''>('')
    const [isDistributing, setIsDistributing] = useState(false)

    // History modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [transactions, setTransactions] = useState<ApiUniToClubTransaction[]>([])
    const [transactionsLoading, setTransactionsLoading] = useState(false)
    const [reasonType, setReasonType] = useState<"monthly" | "other" | "fromRequest">("monthly") // Mặc định là 'monthly'
    const [customReason, setCustomReason] = useState<string>("")
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState<string>("")
    
    // Fetch approved point requests
    const { data: pointRequestsResponse } = usePointRequests()
    const allPointRequests: PointRequest[] = pointRequestsResponse?.data || []
    const approvedRequests = useMemo(() => 
        allPointRequests.filter(req => req.status === "APPROVED"),
        [allPointRequests]
    )

    // Tải danh sách tất cả các CLB khi component được mount bằng API thật
    useEffect(() => {
        const loadClubs = async () => {
            setLoading(true);
            try {
                // response bây giờ sẽ có dạng { content: [...] }
                const response = await fetchClub({ page: 0, size: 70, sort: ["name"] });

                // ✨ THAY ĐỔI QUAN TRỌNG: Truy cập trực tiếp vào response.content ✨
                if (response && (response as any).data && (response as any).data.content) {
                    setAllClubs((response as any).data.content);
                } else {
                    setAllClubs([]);
                }
            } catch (err: any) {
                setError(err.message || "Error loading club list");
            } finally {
                setLoading(false);
            }
        };
        loadClubs();
    }, []);

    // Initialize selection state for all clubs
    useEffect(() => {
        if (allClubs && allClubs.length > 0) {
            setSelectedClubs((prevSelected) => {
                const currentClubIds = Object.keys(prevSelected)
                const newClubIds = allClubs.map((c) => String(c.id))

                // If we already have selections and the IDs match, don't update
                if (currentClubIds.length === newClubIds.length &&
                    newClubIds.every(id => id in prevSelected)) {
                    return prevSelected
                }

                // Otherwise, create new selection state
                const initialSelected: Record<string, boolean> = {}
                allClubs.forEach((c) => {
                    initialSelected[String(c.id)] = false
                })
                return initialSelected
            })
        }
    }, [allClubs])

    const handleToggleSelectClub = (clubId: string | number) => {
        setSelectedClubs((prev) => ({ ...prev, [String(clubId)]: !prev[String(clubId)] }))
    }

    const handleRewardAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (value === '' || /^\d+$/.test(value)) {
            setRewardAmount(value === '' ? '' : parseInt(value, 10))
        }
    }
    const handleToggleSelectAll = () => {
        const newSelectionState = !allSelected
        setSelectedClubs((prevSelected) => {
            const newSelected = { ...prevSelected }
            // allClubs.forEach((club) => {
            //     newSelected[String(club.id)] = newSelectionState
            // })
            filteredClubs.forEach((club) => { // ✨ THAY ĐỔI
                newSelected[String(club.id)] = newSelectionState
            })
            return newSelected
        })
    }

    const selectedCount = useMemo(() => {
        return Object.values(selectedClubs).filter(v => v === true).length
    }, [selectedClubs])

    // ✨ --- TẠO DANH SÁCH CLB ĐÃ LỌC --- ✨
    const filteredClubs = useMemo(() => {
        if (!searchQuery) {
            return allClubs // Trả về tất cả nếu không tìm kiếm
        }
        return allClubs.filter(club =>
            club.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [allClubs, searchQuery])
    // ✨ --------------------------------- ✨

    // const allSelected = useMemo(() => {
    //     if (allClubs.length === 0) {
    //         return false
    //     }
    //     return allClubs.every((club) => selectedClubs[String(club.id)] === true)
    // }, [allClubs, selectedClubs])
    const allSelected = useMemo(() => {
        if (filteredClubs.length === 0) { // ✨ THAY ĐỔI
            return false
        }
        return filteredClubs.every((club) => selectedClubs[String(club.id)] === true) // ✨ THAY ĐỔI
    }, [filteredClubs, selectedClubs]) // ✨ THAY ĐỔI



    const {
        currentPage,
        totalPages,
        paginatedData: paginatedClubs,
        setCurrentPage,
    } = usePagination({ data: filteredClubs, initialPageSize: 8 })

    const handleDistributeRewards = async () => {
        if (rewardAmount === '' || rewardAmount <= 0) {
            toast({
                title: "Error",
                description: "Please enter a valid reward amount.",
                variant: "destructive"
            })
            return
        }

        // Get selected clubs
        const selectedClubsList = allClubs.filter(club => selectedClubs[String(club.id)])
        if (selectedClubsList.length === 0) {
            toast({
                title: "No clubs selected",
                description: "Please select at least one club to distribute rewards.",
                variant: "destructive"
            })
            return
        }

        // ✨ --- KIỂM TRA LÝ DO --- ✨
        let finalReason = ""
        if (reasonType === "monthly") {
            finalReason = "Monthly club points" // Lý do theo yêu cầu
        } else if (reasonType === "fromRequest") {
            if (!selectedRequestId) {
                toast({
                    title: "Reason Required",
                    description: "Please select a point request to use its reason.",
                    variant: "destructive"
                })
                return
            }
            const selectedRequest = approvedRequests.find(req => req.id === selectedRequestId)
            if (!selectedRequest || !selectedRequest.reason) {
                toast({
                    title: "Invalid Request",
                    description: "Selected point request not found or has no reason.",
                    variant: "destructive"
                })
                return
            }
            finalReason = selectedRequest.reason
        } else {
            finalReason = customReason.trim()
        }

        if (!finalReason) {
            toast({
                title: "Reason Required",
                description: "Please select a reason or enter a custom reason for the distribution.",
                variant: "destructive"
            })
            return
        }
        // ✨ ------------------------- ✨

        setIsDistributing(true)
        try {
            // Collect all club IDs as numbers
            const targetIds = selectedClubsList.map(club => Number(club.id))

            // Call the new batch API
            const response = await pointsToClubs(
                targetIds,
                rewardAmount as number,
                //"Giving Point Month"
                finalReason // ✨ THAY ĐỔI: Sử dụng lý do động
            )

            if (response.success) {
                toast({
                    title: "Success",
                    description: response.message || `Distributed ${rewardAmount} points to ${selectedClubsList.length} club(s).`,
                    variant: "default"
                })
                setRewardAmount('')
                setCustomReason('')
                setSelectedRequestId(null)
                setReasonType("monthly")
            } else {
                throw new Error(response.message || "Failed to distribute points")
            }
        } catch (err: any) {
            toast({
                title: "Distribution Error",
                description: err?.response?.data?.message || err.message || "An error occurred.",
                variant: "destructive"
            })
        } finally {
            setIsDistributing(false)
        }
    }

    const loadTransactionHistory = async () => {
        setTransactionsLoading(true)
        try {
            const data = await getUniToClubTransactions()
            setTransactions(data)
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.response?.data?.message || "Failed to load transaction history",
                variant: "destructive"
            })
        } finally {
            setTransactionsLoading(false)
        }
    }

    const handleOpenHistoryModal = () => {
        setShowHistoryModal(true)
        loadTransactionHistory()
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const MinimalPager = ({ current, total, onPrev, onNext }: { current: number; total: number; onPrev: () => void; onNext: () => void }) =>
        total > 1 ? (
            <div className="flex items-center justify-center gap-3 mt-4">
                <Button aria-label="Previous page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev} disabled={current === 1}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[2rem] text-center text-sm font-medium">Page {current} / {total}</div>
                <Button aria-label="Next page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onNext} disabled={current === total}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        ) : null

    const isReasonInvalid = 
        (reasonType === 'other' && !customReason.trim()) ||
        (reasonType === 'fromRequest' && !selectedRequestId)

    return (
        <ProtectedRoute allowedRoles={["uni_staff"]}>
            <AppShell>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <ShieldCheck className="h-8 w-8 text-blue-600" /> Club Reward Distribution
                            </h1>
                            <p className="text-muted-foreground">Distribute reward points to university clubs.</p>
                        </div>
                        <Button
                            variant="outline"
                            size="default"
                            onClick={handleOpenHistoryModal}
                            className="flex items-center gap-2"
                        >
                            <History className="h-4 w-4" />
                            History
                        </Button>
                    </div>

                    {/* Transaction History Modal */}
                    <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
                        <DialogContent
                            className="
                                !max-w-none
                                w-[72vw]
                                lg:w-[68vw]
                                md:w-[78vw]
                                sm:w-[92vw]
                                h-[85vh]
                                overflow-y-auto p-8 rounded-xl shadow-2xl
                            "
                        >
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3 text-3xl font-bold">
                                    <History className="h-8 w-8" />
                                    University to Club Transaction History
                                </DialogTitle>
                            </DialogHeader>

                            <div className="mt-4">
                                {transactionsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <p className="text-muted-foreground">Loading transaction history...</p>
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <History className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                                        <p className="text-muted-foreground">No university-to-club transactions found.</p>
                                    </div>
                                ) : (
                                    <TooltipProvider>
                                        <div className="rounded-md border overflow-x-auto">
                                            <Table className="min-w-full">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[80px]">ID</TableHead>
                                                        <TableHead>Type</TableHead>
                                                        <TableHead>Amount</TableHead>
                                                        <TableHead className="w-[20%]">Sender</TableHead>
                                                        <TableHead className="w-[20%]">Receiver Club</TableHead>
                                                        <TableHead className="w-[15%] pr-2">Description</TableHead>
                                                        <TableHead className="w-[180px] pl-2">Date</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {transactions.map((t) => (
                                                        <TableRow key={t.id}>
                                                            <TableCell className="font-medium">#{t.id}</TableCell>
                                                            <TableCell><Badge variant="secondary">{t.type}</Badge></TableCell>
                                                            <TableCell className="font-semibold text-green-600">+{t.amount} pts</TableCell>
                                                            <TableCell className="font-medium text-slate-800 dark:text-blue-300">
                                                                {t.senderName || "—"}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-slate-800 dark:text-purple-300">
                                                                {t.receiverName || "—"}
                                                            </TableCell>
                                                            <TableCell className="max-w-[200px] pr-2">
                                                                {t.description && t.description.length > 50 ? (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="truncate cursor-help">
                                                                                {t.description}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="max-w-[400px] break-words" side="top">
                                                                            <p className="whitespace-normal">{t.description}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <div className="truncate">{t.description || "—"}</div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap pl-2">
                                                                {formatDate(t.createdAt)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </TooltipProvider>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Card>
                        <CardHeader>
                            <CardTitle>Set Reward Parameters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Grid 2 cột */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Cột 1: Số điểm */}
                                <div className="space-y-2">
                                    <Label htmlFor="reward-amount">Reward Points (per club)</Label>
                                    <Input
                                        id="reward-amount"
                                        type="number"
                                        placeholder="Enter reward points..."
                                        value={rewardAmount}
                                        onChange={handleRewardAmountChange}
                                        disabled={isDistributing}
                                        min="1"
                                        className="mt-2 border-slate-300"
                                    />
                                </div>
                                {/* Cột 2: Lý do */}
                                <div className="space-y-2">
                                    <Label>Reason for Distribution (Required)</Label>
                                    <RadioGroup
                                        value={reasonType}
                                        onValueChange={(value) => {
                                            setReasonType(value as "monthly" | "other" | "fromRequest")
                                            if (value !== "fromRequest") {
                                                setSelectedRequestId(null)
                                            }
                                        }}
                                        disabled={isDistributing}
                                        className="mt-2 space-y-2" // Thêm space-y-2
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="monthly" id="r-monthly" />
                                            <Label htmlFor="r-monthly" className="font-normal cursor-pointer">
                                                Monthly club points
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="fromRequest" id="r-fromRequest" />
                                            <Label htmlFor="r-fromRequest" className="font-normal cursor-pointer">
                                                From approved point request
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="other" id="r-other" />
                                            <Label htmlFor="r-other" className="font-normal cursor-pointer">
                                                Khác
                                            </Label>
                                        </div>
                                    </RadioGroup>

                                    {/* Dropdown chọn point request */}
                                    {reasonType === 'fromRequest' && (
                                        <div className="mt-2 space-y-2">
                                            <Label htmlFor="point-request-select" className="text-sm text-muted-foreground">
                                                Select approved point request:
                                            </Label>
                                            {approvedRequests.length === 0 ? (
                                                <p className="text-sm text-muted-foreground italic">
                                                    No approved point requests available.
                                                </p>
                                            ) : (
                                                <Select
                                                    value={selectedRequestId?.toString() || ""}
                                                    onValueChange={(value) => setSelectedRequestId(parseInt(value, 10))}
                                                    disabled={isDistributing}
                                                >
                                                    <SelectTrigger id="point-request-select" className="border-slate-300">
                                                        <SelectValue placeholder="Select a point request..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {approvedRequests.map((req) => (
                                                            <SelectItem key={req.id} value={req.id.toString()}>
                                                                {req.clubName} - {req.requestedPoints.toLocaleString()} pts
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            {selectedRequestId && (
                                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                                    <p className="text-sm text-blue-900">
                                                        <strong>Selected reason:</strong> {
                                                            approvedRequests.find(req => req.id === selectedRequestId)?.reason
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Ô nhập lý do "Khác" */}
                                    {reasonType === 'other' && (
                                        <Input
                                            id="custom-reason"
                                            placeholder="Enter specific reason..."
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                            disabled={isDistributing}
                                            className="mt-2 border-slate-300" // Thêm margin top
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Số CLB đã chọn */}
                            <p className="text-sm text-muted-foreground pt-2">
                                Selected clubs: <strong>{selectedCount} club(s)</strong>
                            </p>
                        </CardContent>
                        <CardFooter className="pt-0 justify-end ">
                            <Button
                                onClick={handleDistributeRewards}
                                disabled={
                                    isDistributing ||
                                    rewardAmount === '' ||
                                    rewardAmount <= 0 ||
                                    selectedCount === 0 ||
                                    isReasonInvalid // ✨ THÊM ĐIỀU KIỆN VÔ HIỆU HÓA
                                }
                            >
                                {isDistributing ? "Distributing..." : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Distribute {rewardAmount || 0} points to {selectedCount} club(s)
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Select Clubs ({allClubs.length})</h2>
                        {allClubs.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToggleSelectAll}
                                className="rounded-lg"
                            >
                                {allSelected ? "Deselect All" : "Select All"}
                            </Button>
                        )}
                    </div>

                    {/* ✨ --- THÊM THANH SEARCH --- ✨ */}
                    {allClubs.length > 0 && ( // Chỉ hiển thị search nếu có CLB
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by club name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10" // Thêm padding trái cho icon
                            />
                        </div>
                    )}
                    {/* ✨ ------------------------- ✨ */}

                    <div className="space-y-4">
                        {loading ? (
                            <p>Loading clubs...</p>
                            // ) : error ? (
                            //     <p className="text-red-500">{error}</p>
                            // ) : allClubs.length === 0 ? (
                            //     <p>No active clubs found.</p>
                            // ) : (
                        ) : error ? (
                            <p className="text-red-500">{error}</p>
                        ) : allClubs.length === 0 ? ( // ✨ Cập nhật logic hiển thị
                            <p>No active clubs found.</p>
                        ) : filteredClubs.length === 0 ? ( // ✨ Thêm trường hợp không có kết quả search
                            <p>No clubs match your search.</p>
                        ) : (
                            <>
                                {paginatedClubs.map((club) => {
                                    const isSelected = selectedClubs[String(club.id)] || false
                                    return (
                                        <Card
                                            key={club.id}
                                            className={`transition-all duration-200 border-2 ${isSelected
                                                ? "border-primary/70 bg-primary/5 shadow-sm"
                                                : "border-transparent hover:border-muted"
                                                }`}
                                        >
                                            <CardContent className="py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="w-12 h-12">
                                                        <AvatarImage src={club.logoUrl || ""} alt={club.name} />
                                                        <AvatarFallback>{club.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-lg">{club.name}</p>
                                                        {club.leaderName && (
                                                            <p className="text-sm text-muted-foreground flex items-center">
                                                                <UserCircle className="mr-1.5 h-4 w-4" />
                                                                {club.leaderName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelectClub(club.id)}
                                                        className="w-5 h-5 accent-primary cursor-pointer transition-all duration-150"
                                                        style={{ transform: "scale(1.2)" }}
                                                        aria-label={`Select ${club.name}`}
                                                        title={`Select ${club.name}`}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={isSelected ? "border-primary text-primary" : ""}
                                                    >
                                                        + {rewardAmount || 0} pts
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                                <MinimalPager
                                    current={currentPage}
                                    total={totalPages}
                                    onPrev={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    onNext={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                />
                            </>
                        )}
                    </div>
                </div>
            </AppShell>
        </ProtectedRoute>
    )
}