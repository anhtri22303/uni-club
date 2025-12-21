"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
    getClubRanking, recalculateAllClubs, lockClubActivity, approveClubActivity, getClubActivityBreakdown, getClubEventContributions,
    getClubActivityHistory, getMonthlySummary, ClubActivityProcessResult, ApproveResult, ClubMonthlySummary, ClubActivityBreakdown, ClubEventContribution, ClubActivityHistoryItem
} from "@/service/clubActivityReportApi"
import { fetchClub, Club } from "@/service/clubApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Trophy, RotateCw, Lock, Unlock, CheckCircle2, Trash2, Eye, Search, FileText, History, Info, LayoutDashboard, RefreshCcw, Wallet,
    Star, Filter
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// --- Helper Functions ---
const generateYearOptions = (range = 10) => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - range; i--) {
        years.push(i)
    }
    return years
}
const getFeedbackColor = (score: number | undefined) => {
    const s = score ?? 0;
    if (s === 0) return "text-muted-foreground"; // Chưa có đánh giá (Xám)
    if (s < 2.5) return "text-red-600 font-bold"; // Tệ (Đỏ)
    if (s < 3.5) return "text-orange-500 font-bold"; // Trung bình (Cam)
    if (s < 4.5) return "text-lime-600 font-bold"; // Khá (Xanh lá nhạt)
    return "text-green-600 font-bold"; // Tốt (Xanh lá đậm)
}
const generateMonthOptions = () => [
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
    { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
    { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
]

const getAwardBadgeColor = (level: string) => {
    switch (level?.toUpperCase()) {
        case "PLATINUM": return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300";
        case "GOLD": return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300";
        case "SILVER": return "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300";
        case "BRONZE": return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300";
        default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
}

// --- Detail Modal Component ---
const ClubActivityDetail = ({ breakdown, loading }: { breakdown: ClubActivityBreakdown | null, loading: boolean }) => {
    if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-40 w-full" /></div>
    if (!breakdown) return <div className="p-6 text-center">No details available.</div>;

    return (
        <div className="space-y-6">
            {/* Card Total Score */}
            <Card className="bg-primary/5 border-primary/50 border-2">
                <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2 text-primary font-bold">
                        <Trophy className="h-5 w-5" /> TOTAL CLUB SCORE
                    </CardDescription>
                    <CardTitle className="text-6xl text-primary font-black">
                        {(breakdown.finalScore ?? 0).toFixed(1)}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                        <Badge className={getAwardBadgeColor(breakdown.awardLevel)}>{breakdown.awardLevel}</Badge>
                        <Badge variant="secondary">Rank Score: {(breakdown.awardScore ?? 0).toFixed(1)}</Badge>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thẻ Reward Points mới */}
                <Card className="border-green-200 bg-green-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                            <Wallet className="h-4 w-4" /> Reward Points
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            +{breakdown.rewardPoints?.toLocaleString()}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Points to be distributed to members</p>
                    </CardContent>
                </Card>

                {/* Thẻ Feedback trung bình (Giữ lại hoặc thay thế) */}
                <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                            <Star className="h-4 w-4" /> Feedback Avg
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${getFeedbackColor(breakdown.avgFeedback)}`}>
                            {breakdown.avgFeedback?.toFixed(1)}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Based on {breakdown.totalEvents} events</p>
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
export default function UniStaffActivityReportPage() {
    const { toast } = useToast()
    // --- Global State ---
    const [yearOptions] = useState(generateYearOptions())
    const [monthOptions] = useState(generateMonthOptions())
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    // const [activeTab, setActiveTab] = useState("ranking")
    const [activeTab, setActiveTab] = useState("overview")
    // --- State cho Tab Overview (Mới) ---
    const [summaryData, setSummaryData] = useState<ClubMonthlySummary[]>([])
    const [isSummaryLoading, setIsSummaryLoading] = useState(false)
    // --- Tab 1: Ranking State ---
    const [clubs, setClubs] = useState<ClubActivityProcessResult[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [selectedClubId, setSelectedClubId] = useState<number | null>(null) // For Modal
    const [breakdownData, setBreakdownData] = useState<ClubActivityBreakdown | null>(null) // For Modal
    const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false) // For Modal
    // --- Tab 2: Inspector State ---
    const [inspectorClubId, setInspectorClubId] = useState<string>("")
    const [inspectorLoading, setInspectorLoading] = useState(false)
    const [clubHistory, setClubHistory] = useState<ClubActivityHistoryItem[]>([])
    const [clubEvents, setClubEvents] = useState<ClubEventContribution[]>([])
    const [hasSearched, setHasSearched] = useState(false)
    // List Master Club (Lấy từ API /api/clubs) dùng cho Dropdown
    const [allClubsList, setAllClubsList] = useState<Club[]>([])

    const [confirmLockId, setConfirmLockId] = useState<number | null>(null);
    const [confirmApproveId, setConfirmApproveId] = useState<number | null>(null);
    // Pagination state for Inspector tab
    const [eventsPage, setEventsPage] = useState(1)
    const [historyPage, setHistoryPage] = useState(1)
    const itemsPerPage = 10
    // State cho Filter
    const [filterFeedback, setFilterFeedback] = useState<string>("all")
    const [filterCheckin, setFilterCheckin] = useState<string>("all")
    const [filterWeight, setFilterWeight] = useState<string>("all")

    // Hàm reset filter
    const handleClearFilters = () => {
        setFilterFeedback("all")
        setFilterCheckin("all")
        setFilterWeight("all")
    }

    // Logic lọc dữ liệu
    const filteredEvents = clubEvents.filter(evt => {
        const matchFeedback = filterFeedback === "all" ||
            (filterFeedback === "high" && evt.feedback >= 4) ||
            (filterFeedback === "medium" && evt.feedback >= 2.5 && evt.feedback < 4) ||
            (filterFeedback === "low" && evt.feedback < 2.5 && evt.feedback > 0) ||
            (filterFeedback === "none" && evt.feedback === 0);

        const matchCheckin = filterCheckin === "all" ||
            (filterCheckin === "high" && Math.round(evt.checkinRate) >= 80) ||
            (filterCheckin === "medium" && Math.round(evt.checkinRate) >= 50 && Math.round(evt.checkinRate) < 80) ||
            (filterCheckin === "low" && Math.round(evt.checkinRate) < 50);

        const matchWeight = filterWeight === "all" ||
            (filterWeight === "high" && evt.weight >= 50) ||
            (filterWeight === "medium" && evt.weight >= 20 && evt.weight < 50) ||
            (filterWeight === "low" && evt.weight < 20);

        return matchFeedback && matchCheckin && matchWeight;
    });
    // Tính toán phân trang trên danh sách ĐÃ LỌC
    const paginatedEvents = filteredEvents.slice((eventsPage - 1) * itemsPerPage, eventsPage * itemsPerPage)
    const totalEventPages = Math.ceil(filteredEvents.length / itemsPerPage)


    // --- Load Master Club List (Chạy 1 lần đầu) ---
    useEffect(() => {
        const loadAllClubs = async () => {
            try {
                // Lấy số lượng lớn (ví dụ 1000) để đảm bảo hiện hết trong dropdown
                // Hoặc có thể implement lazy load search dropdown nếu list quá dài
                const response = await fetchClub({ page: 0, size: 1000, sort: ["name"] })
                if (response.success && response.data?.content) {
                    setAllClubsList(response.data.content)
                }
            } catch (error) {
                console.error("Failed to load master club list", error)
            }
        }
        loadAllClubs()
    }, [])

    // 1. Lấy dữ liệu Tổng quan (Overview)
    const loadMonthlySummary = useCallback(async () => {
        setIsSummaryLoading(true)
        try {
            const data = await getMonthlySummary({ year: selectedYear, month: selectedMonth })
            setSummaryData(data)
        } catch (error) {
            console.error("Summary error:", error)
        } finally {
            setIsSummaryLoading(false)
        }
    }, [selectedYear, selectedMonth])

    // --- 2. Fetch Data for Ranking ---
    const loadClubRanking = useCallback(async () => {
        setIsLoading(true)
        try {
            // API hiện tại trả về ClubActivityProcessResult[]
            const data = await getClubRanking({ year: selectedYear, month: selectedMonth })
            setClubs(data)
        } catch (error: any) {
            console.error("Error loading clubs:", error)
            toast({ title: "Error", description: "Failed to load club reports.", variant: "destructive" })
            setClubs([])
        } finally {
            setIsLoading(false)
        }
    }, [selectedYear, selectedMonth, toast])

    useEffect(() => {
        if (activeTab === "overview") loadMonthlySummary()
        if (activeTab === "ranking") loadClubRanking()
    }, [activeTab, loadMonthlySummary, loadClubRanking])

    const handleApproveExtended = async (clubId: number) => {
        setIsProcessing(true)
        try {
            const result = await approveClubActivity({ clubId, year: selectedYear, month: selectedMonth })

            // Cập nhật list ranking với dữ liệu mới nhất từ result
            setClubs(prev => prev.map(c => c.clubId === clubId ? { ...c, ...result, locked: true } : c))

            toast({
                title: "Approved & Rewarded",
                description: (
                    <div className="flex flex-col gap-1">
                        <p>Reward: +{result.rewardPoints} points distributed.</p>
                        <p className="text-xs font-mono">Balance: {result.walletBalance?.toLocaleString()}</p>
                    </div>
                ),
                className: "bg-green-700 text-white border-none"
            })
        } catch (error: any) {
            console.error("Approve error:", error)
            toast({ title: "Approval Failed", description: error.message, variant: "destructive" })
        } finally {
            setIsProcessing(false)
        }
    }

    // --- 3. Fetch Data for Inspector ---
    const handleInspectClub = async () => {
        if (!inspectorClubId) return;
        const cId = parseInt(inspectorClubId);
        setInspectorLoading(true);
        setHasSearched(true);
        setEventsPage(1); // Reset pagination
        setHistoryPage(1); // Reset pagination

        try {
            const [historyRes, eventsRes] = await Promise.all([
                // getClubActivityHistory({ clubId: cId, year: selectedYear }),
                getClubActivityHistory(cId, selectedYear),
                getClubEventContributions({ clubId: cId, year: selectedYear, month: selectedMonth })
            ]);
            setClubHistory(historyRes);
            setClubEvents(eventsRes);
        } catch (error) {
            toast({ title: "Fetch Failed", description: "Could not load detailed club info.", variant: "destructive" });
        } finally {
            setInspectorLoading(false);
        }
    }

    // Trigger tìm kiếm lại khi đổi tháng/năm ở Tab Inspector (nếu đã chọn club rồi)
    useEffect(() => {
        if (activeTab === "inspector" && inspectorClubId && hasSearched) {
            handleInspectClub();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedMonth])

    // // Pagination calculations
    // const paginatedEvents = clubEvents.slice(
    //     (eventsPage - 1) * itemsPerPage,
    //     eventsPage * itemsPerPage
    // )
    // const totalEventPages = Math.ceil(clubEvents.length / itemsPerPage)

    const paginatedHistory = clubHistory.slice(
        (historyPage - 1) * itemsPerPage,
        historyPage * itemsPerPage
    )
    const totalHistoryPages = Math.ceil(clubHistory.length / itemsPerPage)

    // --- Actions ---
    const handleRecalculateAll = async () => {
        setIsProcessing(true)
        try {
            const updatedList = await recalculateAllClubs({ year: selectedYear, month: selectedMonth })

            await loadClubRanking()
            toast({
                title: "Calculation Complete",
                description: `Updated ${updatedList.length} clubs.`,
                className: "bg-green-600 text-white"
            })
        } catch (error: any) {
            toast({ title: "Failed", description: error.message, variant: "destructive" })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleLock = async (clubId: number) => {
        setIsProcessing(true)
        try {
            const updatedRecord = await lockClubActivity({ clubId, year: selectedYear, month: selectedMonth })

            // Cập nhật state một cách an toàn
            setClubs(prev => prev.map(c => c.clubId === clubId ? { ...c, ...updatedRecord, locked: true } : c))

            toast({ title: "Locked", description: "Club activity has been locked." })
        } catch (error: any) {
            console.error("Lock error:", error) // Log ra để debug
            toast({ title: "Lock Failed", description: error.message || "Something went wrong", variant: "destructive" })
        } finally {
            setIsProcessing(false)
        }
    }
    const handleApprove = async (clubId: number) => {
        setIsProcessing(true)
        try {
            const result = await approveClubActivity({ clubId, year: selectedYear, month: selectedMonth })
            setClubs(prev => prev.map(c => c.clubId === clubId ? { ...c, ...result } : c))
            toast({ title: "Approved", description: "Rewards distributed.", className: "bg-blue-600 text-white" })
        } catch (error: any) {
            toast({ title: "Failed", description: error.message, variant: "destructive" })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleViewDetail = async (clubId: number) => {
        setSelectedClubId(clubId);
        setIsLoadingBreakdown(true);
        try {
            const data = await getClubActivityBreakdown({ clubId, year: selectedYear, month: selectedMonth });
            setBreakdownData(data);
        } catch (error: any) {
            const club = clubs.find(c => c.clubId === clubId);
            if (club) {
                setBreakdownData(club as unknown as ClubActivityBreakdown);
            }
        } finally {
            setIsLoadingBreakdown(false);
        }
    };

    const onConfirmLock = async () => {
        if (confirmLockId) {
            await handleLock(confirmLockId);
            setConfirmLockId(null);
        }
    };

    const onConfirmApprove = async () => {
        if (confirmApproveId) {
            await handleApproveExtended(confirmApproveId);
            setConfirmApproveId(null);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["uni_staff", "admin"]}>
            <AppShell>
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Trophy className="h-6 w-6 text-primary" />
                                University Club Activity Report
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Manage monthly scores, rankings, and reward distribution.
                            </p>
                        </div>
                    </div>

                    {/* <Tabs defaultValue="ranking" className="space-y-4" onValueChange={setActiveTab}> */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
                            {/* <TabsTrigger value="ranking">Monthly Ranking</TabsTrigger>
                            <TabsTrigger value="inspector">Club Inspector & History</TabsTrigger> */}
                            <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="h-4 w-4" />Overview</TabsTrigger>
                            <TabsTrigger value="ranking" className="gap-2"><Trophy className="h-4 w-4" />Ranking & Actions</TabsTrigger>
                            <TabsTrigger value="inspector" className="gap-2"><Search className="h-4 w-4" />Inspector</TabsTrigger>
                        </TabsList>

                        {/* TAB 1: OVERVIEW - Sử dụng API monthly-summary */}
                        <TabsContent value="overview">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Activity Summary</CardTitle>
                                    <CardDescription>Event statistics without scoring logic</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Club</TableHead>
                                                <TableHead className="text-center">Total Events</TableHead>
                                                <TableHead className="text-center">Success Rate</TableHead>
                                                <TableHead className="text-center">Total Check-ins</TableHead>
                                                <TableHead className="text-center">Avg Feedback</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isSummaryLoading ? (
                                                <TableRow><TableCell colSpan={5}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                                            ) : summaryData.map(item => (
                                                <TableRow key={item.clubId}>
                                                    <TableCell className="font-medium">{item.clubName}</TableCell>
                                                    <TableCell className="text-center">{item.totalEvents}</TableCell>
                                                    <TableCell className="text-center">
                                                        {/* <Badge variant="secondary">{item.eventSuccessRate}%</Badge> */}
                                                        {Math.round(item.eventSuccessRate * 100)}%
                                                    </TableCell>
                                                    <TableCell className="text-center">{item.totalCheckins.toLocaleString()}</TableCell>
                                                    {/* <TableCell className="text-center text-yellow-600 font-bold"> */}
                                                    <TableCell className={`text-center font-bold ${getFeedbackColor(item.avgFeedback)}`}>
                                                        {item.avgFeedback.toFixed(1)} ⭐
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 2: RANKING LIST */}
                        <TabsContent value="ranking" className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 bg-muted/20 p-3 rounded-lg border bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs text-muted-foreground">Year</Label>
                                        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))} disabled={isProcessing}>
                                            <SelectTrigger className="w-[100px] h-9 bg-white dark:bg-slate-950 border border-slate-300"><SelectValue /></SelectTrigger>
                                            <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs text-muted-foreground">Month</Label>
                                        <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))} disabled={isProcessing}>
                                            <SelectTrigger className="w-[130px] h-9 bg-white dark:bg-slate-950 border border-slate-300"><SelectValue /></SelectTrigger>
                                            <SelectContent>{monthOptions.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button onClick={handleRecalculateAll} disabled={isProcessing} size="sm" className="gap-2 bg-primary hover:bg-primary/90 h-9">
                                    {isProcessing ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
                                    Recalculate All
                                </Button>
                            </div>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Monthly Leaderboard</CardTitle>
                                    <CardDescription>Found {clubs.length} clubs for {selectedMonth}/{selectedYear}.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Table Ranking Content */}
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-[60px] text-center">#</TableHead>
                                                <TableHead className="w-[250px]">Club Name</TableHead>

                                                {/* Các cột chỉ số tương tự club-leader */}
                                                <TableHead className="text-center font-semibold text-foreground">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span>Events</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                                                                <TooltipContent><p>Total events held by club</p></TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </TableHead>

                                                <TableHead className="text-center font-semibold text-foreground">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span>Avg Staff</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                                                                <TooltipContent><p>Average staff participation per event</p></TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </TableHead>

                                                {/* <TableHead className="text-center text-blue-600 bg-blue-50/50">Feedback Score</TableHead> */}
                                                <TableHead className="text-center text-blue-600 bg-blue-50/50">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span>Feedback Score</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                                                                <TooltipContent><p>Average events feedback score from members</p></TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </TableHead>
                                                {/* <TableHead className="text-center text-yellow-600 bg-yellow-50/50">Rank Score</TableHead> */}
                                                <TableHead className="text-center text-yellow-600 bg-yellow-50/50">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span>Award Score</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                                                                <TooltipContent><p>Score based on club achievement level</p></TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </TableHead>
                                                {/* <TableHead className="text-center font-semibold text-green-600">Reward Points</TableHead> */}
                                                <TableHead className="text-center font-semibold text-green-600">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span>Reward Points</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Total points to be distributed to club members this month</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </TableHead>
                                                {/* <TableHead className="text-right font-bold bg-muted/30 pr-6">Final Score</TableHead> */}
                                                <TableHead className="text-right font-bold bg-muted/30 pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span>Final Score</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Weighted aggregate score used for monthly ranking</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center">Award Rank</TableHead>
                                                <TableHead className="text-right pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {isLoading ? (
                                                [...Array(5)].map((_, i) => (
                                                    <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                                ))
                                            ) : clubs.length === 0 ? (
                                                <TableRow><TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No data available for this month.</TableCell></TableRow>
                                            ) : (
                                                clubs.map((club, index) => (
                                                    <TableRow key={club.clubId} className="hover:bg-muted/60 transition-colors">
                                                        <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                                        <TableCell>
                                                            <div className="font-bold">{club.clubName}</div>
                                                            <div className="text-[10px] text-muted-foreground">ID: {club.clubId}</div>
                                                        </TableCell>

                                                        <TableCell className="text-center font-medium">
                                                            {club.totalEvents}
                                                        </TableCell>

                                                        {/* Hiển thị Tỉ lệ thành công sự kiện từ API mới */}
                                                        <TableCell className="text-center font-medium text-slate-600">
                                                            {/* {club.eventSuccessRate?.toFixed(1)}% */}
                                                            {/* {(club.eventSuccessRate * 100).toFixed(0)}% */}
                                                            {Math.round(club.eventSuccessRate * 100)}%
                                                        </TableCell>

                                                        {/* <TableCell className="text-center font-mono text-blue-600 bg-blue-50/30"> */}
                                                        <TableCell className={`text-center bg-blue-50/30 ${getFeedbackColor(club.avgFeedback)}`}>
                                                            {club.avgFeedback.toFixed(2)}
                                                        </TableCell>

                                                        <TableCell className="text-center text-yellow-600 bg-yellow-50/30">
                                                            {club.awardScore.toFixed(0)}
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold text-green-600 bg-green-50/30">
                                                            +{club.rewardPoints?.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-lg bg-muted/20 pr-6">
                                                            {club.finalScore.toFixed(0)}
                                                        </TableCell>

                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className={getAwardBadgeColor(club.awardLevel)}>
                                                                {club.awardLevel}
                                                            </Badge>
                                                        </TableCell>

                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button variant="ghost" size="icon" onClick={() => handleViewDetail(club.clubId)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>

                                                                {!club.locked ? (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        title="Lock Report"
                                                                        onClick={() => setConfirmLockId(club.clubId)} // Thay đổi ở đây
                                                                    >
                                                                        <Lock className="h-4 w-4 text-orange-500" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        title="Approve & Reward"
                                                                        onClick={() => setConfirmApproveId(club.clubId)} // Thay đổi ở đây
                                                                    >
                                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 2: INSPECTOR */}
                        <TabsContent value="inspector" className="space-y-6">

                            {/* Inspector Toolbar */}
                            <Card className="bg-slate-50 dark:bg-slate-900 border-dashed">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Search className="h-4 w-4" /> Club Inspector
                                    </CardTitle>
                                    <CardDescription>Select a club and time period to view detailed history.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col md:flex-row gap-4 items-end">
                                        {/* 1. Select Club - Load from Master List */}
                                        <div className="grid w-full md:w-1/3 gap-1.5">
                                            <Label>Club Name</Label>
                                            <Select value={inspectorClubId} onValueChange={setInspectorClubId}>
                                                <SelectTrigger className="bg-white dark:bg-slate-950 border border-slate-300">
                                                    <SelectValue placeholder="Select a club..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allClubsList.length > 0 ? (
                                                        allClubsList.map(c => (
                                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="0" disabled>Loading clubs...</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* 2. Select Time */}
                                        <div className="flex gap-2">
                                            <div className="grid gap-1.5">
                                                <Label>Year</Label>
                                                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                                                    <SelectTrigger className="w-[100px] bg-white dark:bg-slate-950 border border-slate-300"><SelectValue /></SelectTrigger>
                                                    <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label>Month</Label>
                                                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                                                    <SelectTrigger className="w-[130px] bg-white dark:bg-slate-950 border border-slate-300"><SelectValue /></SelectTrigger>
                                                    <SelectContent>{monthOptions.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* 3. Action Button */}
                                        <Button onClick={handleInspectClub} disabled={!inspectorClubId || inspectorLoading} className="md:ml-auto">
                                            {inspectorLoading ? <RotateCw className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                            View Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {hasSearched && (
                                <div className="grid md:grid-cols-[2fr_1fr] gap-6">
                                    {/* Event Table - Wider column (left) */}
                                    <Card className="h-full flex flex-col">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-blue-500" />
                                                    Event Contributions ({selectedMonth}/{selectedYear})
                                                </CardTitle>
                                                <CardDescription>How events impacted the score this month.</CardDescription>
                                            </div>

                                            {/* Nút Filters & Sort */}
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" size="sm" className="gap-2 bg-[#008BB1] text-white hover:bg-[#007696] hover:text-white border-none">
                                                        <Filter className="h-4 w-4" /> Filters & Sort
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[600px] p-4" align="end">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-bold leading-none text-slate-700">Filter Event Information</h4>
                                                            <Button
                                                                variant="ghost"
                                                                className="h-auto p-2 text-xs text-black hover:bg-primary hover:text-white "
                                                                onClick={handleClearFilters}
                                                            >
                                                                Clear all
                                                            </Button>
                                                        </div>

                                                        {/* Sử dụng flex để dàn hàng ngang các phần tử lọc */}
                                                        <div className="flex flex-row items-start gap-4">
                                                            <div className="flex-1 space-y-1.5">
                                                                <Label className="text-xs font-semibold text-muted-foreground">Feedback Score</Label>
                                                                <Select value={filterFeedback} onValueChange={setFilterFeedback}>
                                                                    <SelectTrigger className="h-9 border-slate-300"><SelectValue placeholder="All Levels" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="all">All Levels</SelectItem>
                                                                        <SelectItem value="high">Good (≥ 4.0)</SelectItem>
                                                                        <SelectItem value="medium">Average (2.5 - 4.0)</SelectItem>
                                                                        <SelectItem value="low">Poor (&lt; 2.5)</SelectItem>
                                                                        <SelectItem value="none">No Feedback</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="flex-1 space-y-1.5">
                                                                <Label className="text-xs font-semibold text-muted-foreground">Check-in Rate</Label>
                                                                <Select value={filterCheckin} onValueChange={setFilterCheckin}>
                                                                    <SelectTrigger className="h-9 border-slate-300"><SelectValue placeholder="All Rates" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="all">All Rates</SelectItem>
                                                                        <SelectItem value="high">High (≥ 80%)</SelectItem>
                                                                        <SelectItem value="medium">Medium (50% - 80%)</SelectItem>
                                                                        <SelectItem value="low">Low (&lt; 50%)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="flex-1 space-y-1.5">
                                                                <Label className="text-xs font-semibold text-muted-foreground">Weight (Points)</Label>
                                                                <Select value={filterWeight} onValueChange={setFilterWeight}>
                                                                    <SelectTrigger className="h-9 border-slate-300"><SelectValue placeholder="All Weights" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="all">All Weights</SelectItem>
                                                                        <SelectItem value="high">High (≥ 50pt)</SelectItem>
                                                                        <SelectItem value="medium">Medium (20pt - 50pt)</SelectItem>
                                                                        <SelectItem value="low">Low (&lt; 20pt)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </CardHeader>

                                        <CardContent className="flex-1 flex flex-col">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Event Name</TableHead>
                                                        <TableHead className="text-center w-[100px]">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span>Feedback</span>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent><p>Average attendee feedback for this specific event</p></TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="text-center w-[100px]">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span>Check-in</span>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent><p>Percentage of registered participants who attended</p></TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="text-right w-[100px]">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <span>Weight</span>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                                                                        <TooltipContent><p>Weight represents the overall success level of an event, based on participant feedback and attendance rate</p></TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {clubEvents.length === 0 ? (
                                                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No events found for this month.</TableCell></TableRow>
                                                    ) : (
                                                        paginatedEvents.map((evt, idx) => (
                                                            <TableRow key={idx}>
                                                                {/* <TableCell className="font-medium">{evt.eventName}</TableCell> */}
                                                                <TableCell className="font-medium max-w-[200px] md:max-w-none">
                                                                    <div className="truncate" title={evt.eventName}>
                                                                        {evt.eventName}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className={`text-center ${getFeedbackColor(evt.feedback)}`}>{evt.feedback.toFixed(1)}</TableCell>
                                                                {/* <TableCell className="text-center">{evt.checkinRate}%</TableCell> */}
                                                                <TableCell className="text-center">{Math.round(evt.checkinRate)}%</TableCell>
                                                                <TableCell className="text-right"><Badge variant="secondary">{evt.weight}</Badge></TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>

                                            {/* Pagination for Events */}
                                            {totalEventPages > 1 && (
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                                    <p className="text-sm text-muted-foreground">
                                                        Showing {((eventsPage - 1) * itemsPerPage) + 1} to {Math.min(eventsPage * itemsPerPage, clubEvents.length)} of {clubEvents.length} events
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                                                            disabled={eventsPage === 1}
                                                        >
                                                            Previous
                                                        </Button>
                                                        <div className="flex items-center gap-1">
                                                            {Array.from({ length: totalEventPages }, (_, i) => i + 1).map(page => (
                                                                <Button
                                                                    key={page}
                                                                    variant={page === eventsPage ? "default" : "outline"}
                                                                    size="sm"
                                                                    onClick={() => setEventsPage(page)}
                                                                    className="w-8 h-8 p-0"
                                                                >
                                                                    {page}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEventsPage(p => Math.min(totalEventPages, p + 1))}
                                                            disabled={eventsPage === totalEventPages}
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>


                                    {/* History Table - Narrower column (right) */}
                                    <Card className="h-full flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <History className="h-5 w-5 text-purple-500" />
                                                Performance History ({selectedYear})
                                            </CardTitle>
                                            <CardDescription>Score tracking over the months.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 flex flex-col">
                                            {/* Thêm max-h để table không quá dài nếu có nhiều dữ liệu, hoặc để tự nhiên */}
                                            {/* <div className="overflow-auto max-h-[400px]"> */}
                                            <div>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Month</TableHead>
                                                            <TableHead className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <span>Score</span>
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                                                                            <TooltipContent><p>Final calculated score for that month</p></TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </div>
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <span>Status</span>
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                                                                            <TooltipContent><p>Performance rating based on monthly score thresholds</p></TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </div>
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {clubHistory.length === 0 ? (
                                                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No history recorded.</TableCell></TableRow>
                                                        ) : (
                                                            /* Thay paginatedHistory bằng clubHistory để hiện toàn bộ */
                                                            clubHistory.map((item, idx) => (
                                                                <TableRow key={idx} className={item.month === selectedMonth ? "bg-muted/50 border-l-2 border-primary" : ""}>
                                                                    <TableCell className="font-medium">Month {item.month}</TableCell>
                                                                    <TableCell className="text-right font-bold">{item.score.toFixed(1)}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        {item.score >= 80 ? <span className="text-green-600 text-xs">High</span> :
                                                                            item.score >= 50 ? <span className="text-yellow-600 text-xs">Average</span> :
                                                                                <span className="text-red-500 text-xs">Low</span>}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>

                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    {/* Detail Modal */}
                    <Dialog open={!!selectedClubId} onOpenChange={(open) => !open && setSelectedClubId(null)}>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Club Activity Breakdown</DialogTitle>
                                <DialogDescription>Detailed scoring analysis for {selectedMonth}/{selectedYear}.</DialogDescription>
                            </DialogHeader>
                            <ClubActivityDetail breakdown={breakdownData} loading={isLoadingBreakdown} />
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedClubId(null)}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Confirm Lock Dialog */}
                    <AlertDialog open={!!confirmLockId} onOpenChange={(open) => !open && setConfirmLockId(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-orange-500" /> Confirm Lock Report
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to lock this club's activity report?
                                    Once locked, the club leader will no longer be able to edit event data for this month.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onConfirmLock} className="bg-orange-600 hover:bg-orange-700">
                                    Lock Report
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Confirm Approve & Reward Dialog */}
                    <AlertDialog open={!!confirmApproveId} onOpenChange={(open) => !open && setConfirmApproveId(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="h-5 w-5" /> Approve & Distribute Rewards
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will finalize the ranking and **distribute reward points** to all eligible club members.
                                    This process cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onConfirmApprove} className="bg-green-700 hover:bg-green-800">
                                    Approve & Reward
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                </div>
            </AppShell>
        </ProtectedRoute>
    )
}