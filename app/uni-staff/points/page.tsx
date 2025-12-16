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
import { Users, ShieldCheck, ChevronLeft, ChevronRight, Send, UserCircle, History, Search, X } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { useSearchParams } from "next/navigation"
import { fetchClub } from "@/service/clubApi"
import { pointsToClubs, getUniToClubTransactions, ApiUniToClubTransaction, getUniToEventTransactions, ApiUniToEventTransaction } from "@/service/walletApi"
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
    const searchParams = useSearchParams()
    const [allClubs, setAllClubs] = useState<Club[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [selectedClubs, setSelectedClubs] = useState<Record<string, boolean>>({})
    const [targetClubIds, setTargetClubIds] = useState<number[]>([]) // State lưu danh sách clubId đã chọn
    const [rewardAmount, setRewardAmount] = useState<number | ''>('')
    const [isDistributing, setIsDistributing] = useState(false)

    // History modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [transactions, setTransactions] = useState<ApiUniToClubTransaction[]>([])
    const [transactionsLoading, setTransactionsLoading] = useState(false)
    const [historyTypeFilter, setHistoryTypeFilter] = useState<string>("all")
    const [historyDateFilter, setHistoryDateFilter] = useState<string>("all")
    const [historyTransactionTypeFilter, setHistoryTransactionTypeFilter] = useState<string>("all")
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1)
    const [historyPageSize] = useState(8)

    // Event Points modal state
    const [showEventPointsModal, setShowEventPointsModal] = useState(false)
    const [eventTransactions, setEventTransactions] = useState<ApiUniToEventTransaction[]>([])
    const [eventTransactionsLoading, setEventTransactionsLoading] = useState(false)
    const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")
    const [eventDateFilter, setEventDateFilter] = useState<string>("all")
    const [eventTransactionTypeFilter, setEventTransactionTypeFilter] = useState<string>("all")
    const [eventCurrentPage, setEventCurrentPage] = useState(1)
    const [eventPageSize] = useState(8)
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

                //  THAY ĐỔI QUAN TRỌNG: Truy cập trực tiếp vào response.content 
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

    // Preselect club and preset reason from query params
    useEffect(() => {
        const qpClubId = searchParams?.get("clubId")
        const qpReason = searchParams?.get("reason")
        if (!qpClubId && !qpReason) return

        if (qpReason) {
            setReasonType("other")
            setCustomReason(qpReason)
        }

        if (qpClubId) {
            const targetId = String(qpClubId)
            setSelectedClubs((prev) => ({ ...prev, [targetId]: true }))
        }
    }, [searchParams, allClubs])

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
        const numericId = Number(clubId)
        setSelectedClubs((prev) => {
            const newState = !prev[String(clubId)]

            //  Cập nhật targetClubIds ngay lập tức
            setTargetClubIds((prevIds) => {
                if (newState) {
                    // Thêm vào nếu chưa có
                    return prevIds.includes(numericId) ? prevIds : [...prevIds, numericId]
                } else {
                    // Xóa khỏi danh sách
                    return prevIds.filter(id => id !== numericId)
                }
            })

            return { ...prev, [String(clubId)]: newState }
        })
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
            filteredClubs.forEach((club) => {
                newSelected[String(club.id)] = newSelectionState
            })
            return newSelected
        })

        //  Cập nhật targetClubIds
        if (newSelectionState) {
            // Select all: thêm tất cả filteredClubs vào targetClubIds
            setTargetClubIds((prevIds) => {
                const newIds = filteredClubs.map(club => Number(club.id))
                const merged = [...prevIds]
                newIds.forEach(id => {
                    if (!merged.includes(id)) {
                        merged.push(id)
                    }
                })
                return merged
            })
        } else {
            // Deselect all: xóa tất cả filteredClubs khỏi targetClubIds
            setTargetClubIds((prevIds) => {
                const idsToRemove = filteredClubs.map(club => Number(club.id))
                return prevIds.filter(id => !idsToRemove.includes(id))
            })
        }
    }

    const selectedCount = useMemo(() => {
        return Object.values(selectedClubs).filter(v => v === true).length
    }, [selectedClubs])

    //  --- TẠO DANH SÁCH CLB ĐÃ LỌC --- 
    const filteredClubs = useMemo(() => {
        if (!searchQuery) {
            return allClubs // Trả về tất cả nếu không tìm kiếm
        }
        return allClubs.filter(club =>
            club.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [allClubs, searchQuery])
    //  --------------------------------- 

    // const allSelected = useMemo(() => {
    //     if (allClubs.length === 0) {
    //         return false
    //     }
    //     return allClubs.every((club) => selectedClubs[String(club.id)] === true)
    // }, [allClubs, selectedClubs])
    const allSelected = useMemo(() => {
        if (filteredClubs.length === 0) { //  THAY ĐỔI
            return false
        }
        return filteredClubs.every((club) => selectedClubs[String(club.id)] === true) //  THAY ĐỔI
    }, [filteredClubs, selectedClubs]) //  THAY ĐỔI



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

        //  Kiểm tra targetClubIds thay vì filter lại
        if (targetClubIds.length === 0) {
            toast({
                title: "No clubs selected",
                description: "Please select at least one club to distribute rewards.",
                variant: "destructive"
            })
            return
        }

        //  --- KIỂM TRA LÝ DO --- 
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
        //  ------------------------- 

        setIsDistributing(true)
        try {
            //  Sử dụng targetClubIds đã được chuẩn bị sẵn
            const response = await pointsToClubs(
                targetClubIds,
                rewardAmount as number,
                finalReason
            )

            if (response.success) {
                toast({
                    title: "Success",
                    description: response.message || `Distributed ${rewardAmount} points to ${targetClubIds.length} club(s).`
                })
                setRewardAmount('')
                setCustomReason('')
                setSelectedRequestId(null)
                setReasonType("monthly")
                //  Reset selections
                setSelectedClubs({})
                setTargetClubIds([])
            } else {
                throw new Error(response.message || "Failed to distribute points")
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err.message || "An error occurred."
            const isTimeout = err?.code === 'ECONNABORTED' || errorMessage.toLowerCase().includes('timeout')

            toast({
                title: isTimeout ? "Request Timeout" : "Distribution Error",
                description: isTimeout
                    ? `The request took too long (processing ${targetClubIds.length} clubs). The points may still be distributed successfully. 
                    Please check the transaction history.`
                    : errorMessage,
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
                description: err?.response?.data?.error || err?.response?.data?.message || "Failed to load transaction history",
                variant: "destructive"
            })
        } finally {
            setTransactionsLoading(false)
        }
    }

    const handleOpenHistoryModal = () => {
        setShowHistoryModal(true)
        setHistoryTypeFilter("all")
        setHistoryDateFilter("all")
        setHistoryTransactionTypeFilter("all")
        setHistoryCurrentPage(1)
        loadTransactionHistory()
    }

    // Get badge color for transaction type
    const getTransactionTypeBadgeColor = (type: string) => {
        const colorMap: Record<string, string> = {
            ADD: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            REDUCE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            TRANSFER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            UNI_TO_CLUB: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            CLUB_TO_MEMBER: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
            EVENT_BUDGET_GRANT: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
            EVENT_REFUND_REMAINING: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
            COMMIT_LOCK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            REFUND_COMMIT: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
            BONUS_REWARD: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            RETURN_SURPLUS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            REDEEM_PRODUCT: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
            REFUND_PRODUCT: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
            EVENT_REDEEM_PRODUCT: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
            EVENT_REFUND_PRODUCT: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
            CLUB_RECEIVE_REDEEM: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
            CLUB_REFUND: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            ADMIN_ADJUST: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
            MEMBER_PENALTY: "bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300",
            CLUB_FROM_PENALTY: "bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-300",
            EVENT_BUDGET_FORFEIT: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
            MEMBER_REWARD: "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
            CLUB_REWARD_DISTRIBUTE: "bg-teal-200 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
            PRODUCT_CREATION_COST: "bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        };
        return colorMap[type] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    };

    // Get unique transaction types from Club transactions
    const uniqueHistoryTransactionTypes = useMemo(() => {
        const types = new Set(transactions.map(t => t.type));
        return Array.from(types).sort();
    }, [transactions]);

    // Filter Club transactions
    const filteredHistoryTransactions = useMemo(() => {
        let filtered = [...transactions];
        
        if (historyTransactionTypeFilter !== "all") {
            filtered = filtered.filter(t => t.type === historyTransactionTypeFilter);
        }
        
        if (historyDateFilter !== "all") {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.createdAt);
                const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
                
                switch (historyDateFilter) {
                    case "today":
                        return transactionDay.getTime() === today.getTime();
                    case "week":
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return transactionDay >= weekAgo;
                    case "month":
                        return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
                    case "year":
                        return transactionDate.getFullYear() === now.getFullYear();
                    default:
                        return true;
                }
            });
        }
        
        return filtered;
    }, [transactions, historyDateFilter, historyTransactionTypeFilter]);

    // Paginate filtered Club transactions
    const paginatedHistoryTransactions = useMemo(() => {
        const startIndex = (historyCurrentPage - 1) * historyPageSize;
        const endIndex = startIndex + historyPageSize;
        return filteredHistoryTransactions.slice(startIndex, endIndex);
    }, [filteredHistoryTransactions, historyCurrentPage, historyPageSize]);

    const historyTotalPages = Math.ceil(filteredHistoryTransactions.length / historyPageSize);

    // Get unique transaction types from Event transactions
    const uniqueEventTransactionTypes = useMemo(() => {
        const types = new Set(eventTransactions.map(t => t.type));
        return Array.from(types).sort();
    }, [eventTransactions]);

    // Filter Event transactions
    const filteredEventTransactions = useMemo(() => {
        let filtered = [...eventTransactions];
        
        if (eventTransactionTypeFilter !== "all") {
            filtered = filtered.filter(t => t.type === eventTransactionTypeFilter);
        }
        
        if (eventDateFilter !== "all") {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.createdAt);
                const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
                
                switch (eventDateFilter) {
                    case "today":
                        return transactionDay.getTime() === today.getTime();
                    case "week":
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return transactionDay >= weekAgo;
                    case "month":
                        return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
                    case "year":
                        return transactionDate.getFullYear() === now.getFullYear();
                    default:
                        return true;
                }
            });
        }
        
        return filtered;
    }, [eventTransactions, eventDateFilter, eventTransactionTypeFilter]);

    // Paginate filtered Event transactions
    const paginatedEventTransactions = useMemo(() => {
        const startIndex = (eventCurrentPage - 1) * eventPageSize;
        const endIndex = startIndex + eventPageSize;
        return filteredEventTransactions.slice(startIndex, endIndex);
    }, [filteredEventTransactions, eventCurrentPage, eventPageSize]);

    const eventTotalPages = Math.ceil(filteredEventTransactions.length / eventPageSize);

    const loadEventTransactionHistory = async () => {
        setEventTransactionsLoading(true)
        try {
            const data = await getUniToEventTransactions()
            setEventTransactions(data)
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.response?.data?.error || err?.response?.data?.message || "Failed to load event transaction history",
                variant: "destructive"
            })
        } finally {
            setEventTransactionsLoading(false)
        }
    }

    const handleOpenEventPointsModal = () => {
        setShowEventPointsModal(true)
        setEventTypeFilter("all")
        setEventDateFilter("all")
        setEventTransactionTypeFilter("all")
        setEventCurrentPage(1)
        loadEventTransactionHistory()
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
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="default"
                                onClick={handleOpenEventPointsModal}
                                className="flex items-center gap-2"
                            >
                                <History className="h-4 w-4" />
                                Event Points
                            </Button>
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
                    </div>

                    {/* Transaction History Modal */}
                    <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
                        <DialogContent className="!w-[70vw] !max-w-[70vw] sm:!max-w-[70vw] max-h-[85vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                    <History className="h-6 w-6" />
                                    University to Club Transaction History
                                </DialogTitle>
                            </DialogHeader>
                            
                            <div className="flex-1 overflow-y-auto space-y-4">
                                {/* Filters */}
                                <div className="flex gap-3 flex-wrap">
                                    <Select value={historyTransactionTypeFilter} onValueChange={(value) => {
                                        setHistoryTransactionTypeFilter(value);
                                        setHistoryCurrentPage(1);
                                    }}>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Transaction type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Transaction Types</SelectItem>
                                            {uniqueHistoryTransactionTypes.map(type => (
                                                <SelectItem key={type} value={type}>
                                                    {type.replace(/_/g, " ")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    
                                    <Select value={historyDateFilter} onValueChange={(value) => {
                                        setHistoryDateFilter(value);
                                        setHistoryCurrentPage(1);
                                    }}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by date" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="week">This Week</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                            <SelectItem value="year">This Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    
                                    {(historyDateFilter !== "all" || historyTransactionTypeFilter !== "all") && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setHistoryDateFilter("all");
                                                setHistoryTransactionTypeFilter("all");
                                                setHistoryCurrentPage(1);
                                            }}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Clear
                                        </Button>
                                    )}
                                </div>
                                
                                {/* Statistics */}
                                {!transactionsLoading && filteredHistoryTransactions.length > 0 && (
                                    <div className="flex gap-3">
                                        <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Total Distributed</div>
                                            <div className="text-xl font-bold text-green-700 dark:text-green-300">
                                                +{filteredHistoryTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} pts
                                            </div>
                                            <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">
                                                {filteredHistoryTransactions.length} transactions
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Table */}
                                {transactionsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <p className="text-muted-foreground">Loading transaction history...</p>
                                    </div>
                                ) : filteredHistoryTransactions.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {transactions.length === 0 ? "No transactions found" : "No transactions match the selected filters"}
                                    </div>
                                ) : (
                                    <>
                                        <TooltipProvider>
                                            <div className="rounded-md border overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[80px]">#</TableHead>
                                                            <TableHead>Amount</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead className="w-[20%]">Sender</TableHead>
                                                            <TableHead className="w-[20%]">Receiver Club</TableHead>
                                                            <TableHead className="w-[15%]">Description</TableHead>
                                                            <TableHead className="w-[180px]">Date</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {paginatedHistoryTransactions.map((t, idx) => {
                                                            const displayIndex = ((historyCurrentPage - 1) * historyPageSize) + idx + 1;
                                                            return (
                                                                <TableRow key={t.id}>
                                                                    <TableCell className="font-medium">#{displayIndex}</TableCell>
                                                                    <TableCell className="font-semibold text-green-600">+{t.amount.toLocaleString()} pts</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline" className={`text-xs font-medium ${getTransactionTypeBadgeColor(t.type)}`}>
                                                                            {t.type.replace(/_/g, " ")}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="font-medium text-slate-800 dark:text-blue-300">
                                                                        {t.senderName || "—"}
                                                                    </TableCell>
                                                                    <TableCell className="font-medium text-slate-800 dark:text-purple-300">
                                                                        {t.receiverName || "—"}
                                                                    </TableCell>
                                                                    <TableCell className="max-w-[200px]">
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
                                                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                                        {formatDate(t.createdAt)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </TooltipProvider>
                                        
                                        {/* Pagination */}
                                        {historyTotalPages > 1 && (
                                            <div className="flex items-center justify-between pt-4 border-t">
                                                <div className="text-sm text-muted-foreground">
                                                    Showing {((historyCurrentPage - 1) * historyPageSize) + 1} to {Math.min(historyCurrentPage * historyPageSize, filteredHistoryTransactions.length)} of {filteredHistoryTransactions.length} transactions
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setHistoryCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={historyCurrentPage === 1}
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <div className="text-sm font-medium">
                                                        Page {historyCurrentPage} of {historyTotalPages}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setHistoryCurrentPage(prev => Math.min(historyTotalPages, prev + 1))}
                                                        disabled={historyCurrentPage === historyTotalPages}
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Event Points Transaction History Modal */}
                    <Dialog open={showEventPointsModal} onOpenChange={setShowEventPointsModal}>
                        <DialogContent className="!w-[70vw] !max-w-[70vw] sm:!max-w-[70vw] max-h-[85vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                    <History className="h-6 w-6" />
                                    University to Event Transaction History
                                </DialogTitle>
                            </DialogHeader>
                            
                            <div className="flex-1 overflow-y-auto space-y-4">
                                {/* Filters */}
                                <div className="flex gap-3 flex-wrap">
                                    <Select value={eventTransactionTypeFilter} onValueChange={(value) => {
                                        setEventTransactionTypeFilter(value);
                                        setEventCurrentPage(1);
                                    }}>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Transaction type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Transaction Types</SelectItem>
                                            {uniqueEventTransactionTypes.map(type => (
                                                <SelectItem key={type} value={type}>
                                                    {type.replace(/_/g, " ")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    
                                    <Select value={eventDateFilter} onValueChange={(value) => {
                                        setEventDateFilter(value);
                                        setEventCurrentPage(1);
                                    }}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by date" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="week">This Week</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                            <SelectItem value="year">This Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    
                                    {(eventDateFilter !== "all" || eventTransactionTypeFilter !== "all") && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEventDateFilter("all");
                                                setEventTransactionTypeFilter("all");
                                                setEventCurrentPage(1);
                                            }}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Clear
                                        </Button>
                                    )}
                                </div>
                                
                                {/* Statistics */}
                                {!eventTransactionsLoading && filteredEventTransactions.length > 0 && (
                                    <div className="flex gap-3">
                                        <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Total Distributed</div>
                                            <div className="text-xl font-bold text-green-700 dark:text-green-300">
                                                +{filteredEventTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} pts
                                            </div>
                                            <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">
                                                {filteredEventTransactions.length} transactions
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Table */}
                                {eventTransactionsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <p className="text-muted-foreground">Loading event transaction history...</p>
                                    </div>
                                ) : filteredEventTransactions.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {eventTransactions.length === 0 ? "No transactions found" : "No transactions match the selected filters"}
                                    </div>
                                ) : (
                                    <>
                                        <TooltipProvider>
                                            <div className="rounded-md border overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[80px]">#</TableHead>
                                                            <TableHead>Amount</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead className="w-[20%]">Sender</TableHead>
                                                            <TableHead className="w-[20%]">Receiver Event</TableHead>
                                                            <TableHead className="w-[15%]">Description</TableHead>
                                                            <TableHead className="w-[180px]">Date</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {paginatedEventTransactions.map((t, idx) => {
                                                            const displayIndex = ((eventCurrentPage - 1) * eventPageSize) + idx + 1;
                                                            return (
                                                                <TableRow key={t.id}>
                                                                    <TableCell className="font-medium">#{displayIndex}</TableCell>
                                                                    <TableCell className="font-semibold text-green-600">+{t.amount.toLocaleString()} pts</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline" className={`text-xs font-medium ${getTransactionTypeBadgeColor(t.type)}`}>
                                                                            {t.type.replace(/_/g, " ")}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="font-medium text-slate-800 dark:text-blue-300">
                                                                        {t.senderName || "—"}
                                                                    </TableCell>
                                                                    <TableCell className="font-medium text-slate-800 dark:text-purple-300">
                                                                        {t.receiverName || "—"}
                                                                    </TableCell>
                                                                    <TableCell className="max-w-[200px]">
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
                                                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                                        {formatDate(t.createdAt)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </TooltipProvider>
                                        
                                        {/* Pagination */}
                                        {eventTotalPages > 1 && (
                                            <div className="flex items-center justify-between pt-4 border-t">
                                                <div className="text-sm text-muted-foreground">
                                                    Showing {((eventCurrentPage - 1) * eventPageSize) + 1} to {Math.min(eventCurrentPage * eventPageSize, filteredEventTransactions.length)} of {filteredEventTransactions.length} transactions
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEventCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={eventCurrentPage === 1}
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <div className="text-sm font-medium">
                                                        Page {eventCurrentPage} of {eventTotalPages}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEventCurrentPage(prev => Math.min(eventTotalPages, prev + 1))}
                                                        disabled={eventCurrentPage === eventTotalPages}
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
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
                                                Other
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
                                    isReasonInvalid //  THÊM ĐIỀU KIỆN VÔ HIỆU HÓA
                                }
                            >
                                {isDistributing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Distributing to {selectedCount} club(s)... Please wait
                                    </div>
                                ) : (
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

                    {/*  --- THANH SEARCH ---  */}
                    {allClubs.length > 0 && ( // Chỉ hiển thị search nếu có CLB
                        <div className="relative w-full max-w-[500px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground " />
                            <Input
                                placeholder="Search by club name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                // pr-12 to prevent text overlap
                                className="pl-10 pr-12 border-slate-300 w-full mb-4 bg-white"
                            />

                            {/* Clear Button */}
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            )}
                        </div>
                    )}
                    {/*  -------------------------  */}

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
                        ) : allClubs.length === 0 ? ( //  Cập nhật logic hiển thị
                            <p>No active clubs found.</p>
                        ) : filteredClubs.length === 0 ? ( //  Thêm trường hợp không có kết quả search
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