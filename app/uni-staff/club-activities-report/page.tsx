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
    getClubRanking, recalculateAllClubs, lockClubActivity, approveClubActivity, deleteClubActivity, getClubActivityBreakdown, getClubEventContributions,
    getClubActivityHistory, getMonthlySummary, ClubActivityProcessResult, ApproveResult, ClubMonthlySummary, ClubActivityBreakdown, ClubEventContribution, ClubActivityHistoryItem
} from "@/service/clubActivityReportApi"
import { fetchClub, Club } from "@/service/clubApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Trophy, RotateCw, Lock, Unlock, CheckCircle2, Trash2, Eye, Search, FileText, History, Info, LayoutDashboard, RefreshCcw, Wallet
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// --- Helper Functions ---
const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 3; i--) {
        years.push(i)
    }
    return years
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
            {/* Card Final Score to giống club-leader */}
            <Card className="bg-primary/5 border-primary/50 border-2">
                <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2 text-primary font-bold">
                        <Trophy className="h-5 w-5" /> TOTAL CLUB SCORE
                    </CardDescription>
                    <CardTitle className="text-6xl text-primary font-black">
                        {breakdown.finalScore?.toFixed(1) || 0}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                        <Badge className={getAwardBadgeColor(breakdown.awardLevel)}>{breakdown.awardLevel}</Badge>
                        <Badge variant="secondary">Rank Score: {breakdown.awardScore?.toFixed(1)}</Badge>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3 bg-blue-50/50">
                        <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                            Member Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-blue-600">{breakdown.avgMemberActivityScore?.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Average score of all members in club</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 bg-yellow-50/50">
                        <CardTitle className="text-sm flex items-center gap-2 text-yellow-700">
                            Staff Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-yellow-600">{breakdown.staffPerformanceScore?.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Score based on event organizing quality</p>
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

    // useEffect(() => {
    //     // Chỉ load ranking khi ở tab ranking hoặc khi đổi thời gian
    //     if (activeTab === "ranking") {
    //         loadClubRanking()
    //     }
    // }, [loadClubRanking, activeTab])
    useEffect(() => {
        if (activeTab === "overview") loadMonthlySummary()
        if (activeTab === "ranking") loadClubRanking()
    }, [activeTab, loadMonthlySummary, loadClubRanking])

    // const handleSingleRecalculate = async (clubId: number) => {
    //     setIsProcessing(true)
    //     try {
    //         const updated = await recalculateClubActivity({ clubId, year: selectedYear, month: selectedMonth })
    //         setClubs(prev => prev.map(c => c.clubId === clubId ? updated : c))
    //         toast({ title: "Updated", description: `Recalculated score for ${updated.clubName}` })
    //     } catch (error: any) {
    //         toast({ title: "Error", description: error.message, variant: "destructive" })
    //     } finally {
    //         setIsProcessing(false)
    //     }
    // }

    const handleApproveExtended = async (clubId: number) => {
        setIsProcessing(true)
        try {
            const result = await approveClubActivity({ clubId, year: selectedYear, month: selectedMonth })
            // Cập nhật list ranking
            setClubs(prev => prev.map(c => c.clubId === clubId ? { ...c, locked: true } : c))

            toast({
                title: "Approved & Rewarded",
                description: (
                    <div className="flex flex-col gap-1">
                        <p>Reward: +{result.rewardPoints} points distributed.</p>
                        <p className="text-xs font-mono">New Wallet Balance: {result.walletBalance.toLocaleString()}</p>
                    </div>
                ),
                className: "bg-green-700 text-white border-none"
            })
        } catch (error: any) {
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

        try {
            const [historyRes, eventsRes] = await Promise.all([
                getClubActivityHistory({ clubId: cId, year: selectedYear }),
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

    // --- Actions ---
    const handleRecalculateAll = async () => {
        setIsProcessing(true)
        try {
            const updatedList = await recalculateAllClubs({ year: selectedYear, month: selectedMonth })
            setClubs(updatedList)
            toast({ title: "Calculation Complete", description: `Updated ${updatedList.length} clubs.`, className: "bg-green-600 text-white" })
        } catch (error: any) {
            toast({ title: "Failed", description: error.message, variant: "destructive" })
        } finally {
            setIsProcessing(false)
        }
    }

    // ... (Giữ nguyên các hàm handleLock, handleApprove, handleDelete, handleViewDetail)
    const handleLock = async (clubId: number) => {
        setIsProcessing(true)
        try {
            const updatedRecord = await lockClubActivity({ clubId, year: selectedYear, month: selectedMonth })
            setClubs(prev => prev.map(c => c.clubId === clubId ? updatedRecord : c))
            toast({ title: "Locked", description: "Club activity has been locked." })
        } catch (error: any) {
            toast({ title: "Lock Failed", description: error.message, variant: "destructive" })
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

    const handleDelete = async (clubId: number) => {
        if (!confirm("Are you sure? This will delete the monthly record.")) return;
        setIsProcessing(true)
        try {
            await deleteClubActivity({ clubId, year: selectedYear, month: selectedMonth })
            setClubs(prev => prev.filter(c => c.clubId !== clubId))
            toast({ title: "Reset", description: "Record deleted." })
        } catch (error: any) {
            toast({ title: "Reset Failed", description: error.message, variant: "destructive" })
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
            // Tìm club trong danh sách hiện tại nếu gọi breakdown lỗi
            const club = clubs.find(c => c.clubId === clubId);
            if (club) {
                // Ép kiểu hoặc map dữ liệu tương ứng
                setBreakdownData(club as unknown as ClubActivityBreakdown);
            }
        } finally {
            setIsLoadingBreakdown(false);
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
                                                        <Badge variant="secondary">{item.eventSuccessRate}%</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono">{item.totalCheckins.toLocaleString()}</TableCell>
                                                    <TableCell className="text-center text-yellow-600 font-bold">{item.avgFeedback.toFixed(1)} ⭐</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 2: RANKING LIST */}
                        <TabsContent value="ranking" className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 bg-muted/20 p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs text-muted-foreground">Year</Label>
                                        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))} disabled={isProcessing}>
                                            <SelectTrigger className="w-[100px] h-9 bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
                                            <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs text-muted-foreground">Month</Label>
                                        <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))} disabled={isProcessing}>
                                            <SelectTrigger className="w-[130px] h-9 bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
                                            <SelectContent>{monthOptions.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button onClick={handleRecalculateAll} disabled={isProcessing} size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 h-9">
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
                                                        <span>Sessions</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                                                                <TooltipContent><p>Total sessions held by club</p></TooltipContent>
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

                                                <TableHead className="text-center text-blue-600 bg-blue-50/50">Member Score</TableHead>
                                                <TableHead className="text-center text-yellow-600 bg-yellow-50/50">Staff Score</TableHead>
                                                <TableHead className="text-right font-bold bg-muted/30 pr-6">Final Score</TableHead>
                                                <TableHead className="text-center">Award</TableHead>
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
                                                            {club.eventSuccessRate?.toFixed(1)}%
                                                        </TableCell>

                                                        <TableCell className="text-center font-mono text-blue-600 bg-blue-50/30">
                                                            {club.avgFeedback.toFixed(1)}
                                                        </TableCell>

                                                        <TableCell className="text-center font-mono text-yellow-600 bg-yellow-50/30">
                                                            {club.awardScore.toFixed(0)}
                                                        </TableCell>

                                                        <TableCell className="text-right font-bold text-lg bg-muted/20 pr-6">
                                                            {club.finalScore.toFixed(0)}
                                                        </TableCell>

                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className={getAwardBadgeColor(club.awardLevel)}>
                                                                {club.awardLevel}
                                                            </Badge>
                                                        </TableCell>

                                                        {/* <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button variant="ghost" size="icon" onClick={() => handleViewDetail(club.clubId)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                {!club.locked ? (
                                                                    <Button variant="ghost" size="icon" onClick={() => handleLock(club.clubId)}>
                                                                        <Lock className="h-4 w-4 text-orange-500" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button variant="ghost" size="icon" onClick={() => handleApprove(club.clubId)}>
                                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell> */}
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button variant="ghost" size="icon" title="View Detail" onClick={() => handleViewDetail(club.clubId)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>

                                                                {!club.locked ? (
                                                                    <Button variant="ghost" size="icon" title="Lock Report" onClick={() => handleLock(club.clubId)}>
                                                                        <Lock className="h-4 w-4 text-orange-500" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button variant="ghost" size="icon" title="Approve & Reward" onClick={() => handleApproveExtended(club.clubId)}>
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
                                                <SelectTrigger className="bg-white dark:bg-slate-950">
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
                                                    <SelectTrigger className="w-[100px] bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
                                                    <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label>Month</Label>
                                                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                                                    <SelectTrigger className="w-[130px] bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
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
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Event Table */}
                                    <Card className="h-full">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-blue-500" />
                                                Event Contributions ({selectedMonth}/{selectedYear})
                                            </CardTitle>
                                            <CardDescription>How events impacted the score this month.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Event Name</TableHead>
                                                        <TableHead className="text-center">Feedback</TableHead>
                                                        <TableHead className="text-center">Check-in</TableHead>
                                                        <TableHead className="text-right">Weight</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {clubEvents.length === 0 ? (
                                                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No events found for this month.</TableCell></TableRow>
                                                    ) : (
                                                        clubEvents.map((evt, idx) => (
                                                            <TableRow key={idx}>
                                                                <TableCell className="font-medium">{evt.eventName}</TableCell>
                                                                <TableCell className="text-center">{evt.feedback.toFixed(1)}</TableCell>
                                                                <TableCell className="text-center">{evt.checkinRate}%</TableCell>
                                                                <TableCell className="text-right"><Badge variant="secondary">{evt.weight}</Badge></TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>

                                    {/* History Table */}
                                    <Card className="h-full">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <History className="h-5 w-5 text-purple-500" />
                                                Performance History ({selectedYear})
                                            </CardTitle>
                                            <CardDescription>Score tracking over the months.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Month</TableHead>
                                                        <TableHead className="text-right">Score</TableHead>
                                                        <TableHead className="text-right">Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {clubHistory.length === 0 ? (
                                                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No history recorded.</TableCell></TableRow>
                                                    ) : (
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

                </div>
            </AppShell>
        </ProtectedRoute>
    )
}