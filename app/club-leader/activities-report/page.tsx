"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    getClubMemberActivity, getClubMemberActivityLive, updateBulkMonthlyActivity, MemberActivityFullScore, MemberActivityShortItem,
    UpdateBulkMonthlyActivityBody, MonthlyActivityItem, ActivityLevel, autoGenerateMonthlyReport,
} from "@/service/memberActivityReportApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, BarChart2, Star, RotateCw, Calculator, Save, AlertCircle, Calendar, Info, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { getClubIdFromToken } from "@/service/clubApi"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 3; i--) {
        years.push(i)
    }
    return years
}

const generateMonthOptions = () => {
    return [
        { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
        { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
        { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
        { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
    ]
}

const getLevelBadgeColor = (level: string) => {
    switch (level) {
        case "HIGH": return "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
        case "MEDIUM": return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
        case "LOW": return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700"
        default: return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-700"
    }
}

const formatNumberInput = (value: string) => {
    // 1. Loại bỏ tất cả ký tự KHÔNG phải là số (a-z, ký tự đặc biệt, khoảng trắng...), Chỉ giữ lại các chữ số từ 0 đến 9
    const rawValue = value.replace(/[^0-9]/g, '');
    // 2. Nếu rỗng (do xóa hết hoặc chưa nhập) thì trả về rỗng
    if (rawValue === '') return '';
    // 3. Chuyển thành số và format có dấu phẩy (Ví dụ: 1000 -> 1,000)
    // Number() sẽ tự động loại bỏ số 0 ở đầu (ví dụ 05 -> 5)
    return Number(rawValue).toLocaleString('en-US');
}

// Type mở rộng: Kết hợp dữ liệu Short (có sẵn) và Full (có sau khi calculate)
type DisplayActivityItem = MemberActivityShortItem & Partial<MemberActivityFullScore>;

// Component Modal Chi tiết (Chỉ hiện khi đã có điểm)
const ActivityScoreDetail = ({ score }: { score: DisplayActivityItem }) => {
    if (score.finalScore === undefined) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Score details are not available yet.</p>
                <p className="text-sm">Please run "Calculate Live Preview" to view scores.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/50">
                <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2 text-primary font-semibold">
                        <BarChart2 className="h-5 w-5" /> FINAL SCORE
                    </CardDescription>
                    <CardTitle className="text-5xl text-primary">
                        {score.finalScore?.toFixed(0) ?? 0}
                    </CardTitle>
                    <CardDescription>
                        = Attendance ({(score.attendanceTotalScore ?? 0).toFixed(0)}) + Staff ({(score.staffTotalScore ?? 0).toFixed(0)})
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Attendance Details */}
                <Card>
                    <CardHeader className="pb-3 bg-muted/30">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" /> Attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Base Score:</span>
                            <span className="font-mono font-medium">{score.attendanceBaseScore ?? 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Multiplier:</span>
                            <Badge variant="outline" className="font-mono">
                                {(score.attendanceMultiplier ?? 0).toFixed(1)}x
                            </Badge>
                        </div>
                        <div className="bg-muted p-2 rounded text-xs space-y-1 mt-2">
                            <div className="flex justify-between">
                                <span>Sessions:</span>
                                <span>{score.totalClubPresent}/{score.totalClubSessions}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Events:</span>
                                <span>{score.totalEventAttended}/{score.totalEventRegistered}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Staff Details */}
                <Card>
                    <CardHeader className="pb-3 bg-muted/30">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-600" /> Staff
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Base Score:</span>
                            <span className="font-mono font-medium">{score.staffBaseScore ?? 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Evaluation:</span>
                            <Badge variant="secondary" className="text-[10px]">
                                {score.staffEvaluation ?? 'NONE'}
                            </Badge>
                        </div>
                        <div className="bg-muted p-2 rounded text-xs space-y-1 mt-2">
                            <div className="flex justify-between">
                                <span>Tasks Count:</span>
                                <span>{score.totalStaffCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Multiplier:</span>
                                <span>{(score.staffMultiplier ?? 0).toFixed(1)}x</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function ActivityReportPage() {
    const { toast } = useToast()
    // Time State
    const [yearOptions] = useState(generateYearOptions())
    const [monthOptions] = useState(generateMonthOptions())
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    // Data State
    const [activities, setActivities] = useState<DisplayActivityItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedMember, setSelectedMember] = useState<DisplayActivityItem | null>(null)
    // Logic State
    // const [attendanceBaseInput, setAttendanceBaseInput] = useState<string>("")
    // const [staffBaseInput, setStaffBaseInput] = useState<string>("")
    const [isCalculating, setIsCalculating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    // Flag: Đã tính điểm chưa? Nếu true -> Hiện cột điểm. Nếu false -> Ẩn cột điểm.
    const [showScores, setShowScores] = useState(false)
    const [clubId] = useState(() => getClubIdFromToken())
    // 1. Load Data (Mặc định chỉ tải thông tin hoạt động - Short API)
    const loadActivities = useCallback(async () => {
        if (!clubId) return
        setIsLoading(true)
        setShowScores(false) // Reset về chế độ chỉ xem Stats khi đổi tháng/năm/load lại
        // Reset inputs để người dùng nhập mới nếu muốn tính toán
        // setAttendanceBaseInput("")
        // setStaffBaseInput("")

        try {
            // Gọi API Short (Chỉ lấy Stats: Event, Session, Penalty...)
            const data = await getClubMemberActivity({
                clubId: clubId,
                year: selectedYear,
                month: selectedMonth,
            })
            setActivities(data)
        } catch (error: any) {
            console.error("Error loading activity report:", error)
            toast({
                title: "Error",
                description: "Failed to load member activities.",
                variant: "destructive",
            })
            setActivities([])
        } finally {
            setIsLoading(false)
        }
    }, [clubId, selectedYear, selectedMonth, toast])

    // 2. Calculate Live Score (Gọi API Full và Merge)
    const handleLiveCalculation = async () => {
        if (!clubId) return
        // const attBase = Number(attendanceBaseInput.replace(/,/g, ''))
        // const stfBase = Number(staffBaseInput.replace(/,/g, ''))
        const attBase = 0
        const stfBase = 0

        if (isNaN(attBase) || attBase < 0 || isNaN(stfBase) || stfBase < 0) {
            toast({ title: "Invalid Input", description: "Base scores must be valid positive numbers.", variant: "destructive" })
            return
        }

        setIsCalculating(true)
        try {
            // Gọi API Live (Trả về Full Info + Scores)
            const liveData: MemberActivityFullScore[] = await getClubMemberActivityLive({
                clubId: clubId,
                attendanceBase: attBase,
                staffBase: stfBase
            })
            setActivities(liveData)
            setShowScores(true) // Bật cờ để hiển thị các cột điểm số

            toast({
                title: "Calculation Complete",
                description: "Scores have been calculated based on current data.",
            })
        } catch (error: any) {
            console.error("Error calculating live scores:", error)
            toast({ title: "Calculation Failed", description: error.message, variant: "destructive" })
        } finally {
            setIsCalculating(false)
        }
    }

    // 3. Save Report (Gửi dữ liệu đã tính toán lên server)
    const handleSaveReport = async () => {
        if (!clubId || activities.length === 0) return;
        // Chỉ cho phép lưu khi đang ở chế độ đã tính điểm
        if (!showScores) {
            //  toast({ title: "No Scores", description: "Please calculate scores before saving.", variant: "warning" })
            toast({
                title: "No Scores",
                description: "Please calculate scores before saving.",
                variant: "destructive" // Dùng màu đỏ để cảnh báo
            })
            return;
        }

        setIsSaving(true);
        try {
            const itemsToUpdate: MonthlyActivityItem[] = activities.map(item => {
                // Ép kiểu an toàn vì khi showScores = true, các trường này chắc chắn tồn tại từ API Live
                const fullItem = item as MemberActivityFullScore;

                return {
                    membershipId: fullItem.membershipId,
                    year: selectedYear,
                    month: selectedMonth,
                    totalEventRegistered: fullItem.totalEventRegistered,
                    totalEventAttended: fullItem.totalEventAttended,
                    eventAttendanceRate: fullItem.eventAttendanceRate,
                    totalPenaltyPoints: fullItem.totalPenaltyPoints,
                    activityLevel: fullItem.activityLevel,
                    attendanceBaseScore: fullItem.attendanceBaseScore,
                    attendanceMultiplier: fullItem.attendanceMultiplier,
                    attendanceTotalScore: fullItem.attendanceTotalScore,
                    staffBaseScore: fullItem.staffBaseScore,
                    totalStaffCount: fullItem.totalStaffCount,
                    staffEvaluation: fullItem.staffEvaluation || "NONE",
                    staffMultiplier: fullItem.staffMultiplier,
                    staffScore: fullItem.staffScore,
                    staffTotalScore: fullItem.staffTotalScore,
                    totalClubSessions: fullItem.totalClubSessions,
                    totalClubPresent: fullItem.totalClubPresent,
                    sessionAttendanceRate: fullItem.sessionAttendanceRate,
                    finalScore: fullItem.finalScore
                }
            });

            const payload: UpdateBulkMonthlyActivityBody = {
                year: selectedYear,
                month: selectedMonth,
                items: itemsToUpdate
            };

            await updateBulkMonthlyActivity({ clubId, body: payload });

            toast({
                title: "Report Saved",
                description: "Monthly activity report has been updated successfully.",
                variant: "default",
            });

            // Sau khi save, giữ nguyên hiển thị
        } catch (error: any) {
            console.error("Error saving report:", error);
            toast({ title: "Save Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!clubId) return;

        setIsGenerating(true);
        try {
            const message = await autoGenerateMonthlyReport({
                clubId,
                year: selectedYear,
                month: selectedMonth
            });

            toast({
                title: "Report Initialized",
                description: message || `Successfully generated report for ${selectedMonth}/${selectedYear}.`,
                variant: "default",
                className: "bg-blue-600 text-white border-none"
            });

            // Quan trọng: Load lại danh sách để hiện data vừa tạo (mặc dù điểm có thể = 0)
            loadActivities();

        } catch (error: any) {
            console.error("Error generating report:", error);
            toast({
                title: "Initialization Failed",
                description: error.message || "Could not generate monthly report.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };
    useEffect(() => {
        loadActivities()
    }, [selectedYear, selectedMonth, clubId, loadActivities])

    return (
        <ProtectedRoute allowedRoles={["club_leader", "club_vice_leader"]}>
            <AppShell>
                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Calendar className="h-6 w-6 text-primary" />
                                Activity & Scoring Manager
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Viewing activity details for <strong>{selectedMonth}/{selectedYear}</strong>.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Nút Save chỉ hiện khi đã tính điểm */}
                            {showScores && (
                                <Button
                                    className="gap-2 bg-green-600 hover:bg-green-700"
                                    disabled={isSaving}
                                    onClick={handleSaveReport}
                                >
                                    {isSaving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Confirm & Save Report
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Configuration Panel */}
                    <Card className="border-primary/20 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calculator className="h-5 w-5" /> Configuration & Calculation
                            </CardTitle>
                            <CardDescription>
                                {/* Set base scores and click calculate to preview member points. */}
                                Select time period and click calculate to preview member points.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                                {/* Time Selection */}
                                <div className="space-y-2">
                                    <Label>Year</Label>
                                    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))} disabled={isLoading || isCalculating}>
                                        <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Month</Label>
                                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))} disabled={isLoading || isCalculating}>
                                        <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {monthOptions.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Scoring Inputs */}
                                {/* <div className="space-y-2">
                                    <Label className="text-blue-600">Attendance Base Score</Label>
                                    <div className="relative">
                                        <Input
                                            type="text" // <--- Đổi thành text để hiện dấu phẩy
                                            placeholder="e.g. 100"
                                            // Giá trị hiển thị
                                            value={attendanceBaseInput}
                                            // Khi nhập: format rồi mới set state
                                            onChange={(e) => setAttendanceBaseInput(formatNumberInput(e.target.value))}
                                            className="pl-8 pr-10 border-slate-300"
                                        />
                                        <Users className="h-4 w-4 absolute left-2.5 top-3 text-muted-foreground" /> */}
                                {/* Nút Clear bên phải - Chỉ hiện khi có dữ liệu */}
                                {/* {attendanceBaseInput && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setAttendanceBaseInput("")}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full 
                                                text-slate-400 hover:bg-primary hover:text-primary-foreground transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Clear</span>
                                            </Button>
                                        )}
                                    </div>
                                </div> */}
                                {/* <div className="space-y-2">
                                    <Label className="text-yellow-600">Staff Base Score</Label>
                                    <div className="relative">
                                        <Input
                                            type="text" // <--- Đổi thành text
                                            placeholder="e.g. 100"
                                            value={staffBaseInput}
                                            onChange={(e) => setStaffBaseInput(formatNumberInput(e.target.value))}
                                            className="pl-8 pr-10 border-slate-300"
                                        />
                                        <Star className="h-4 w-4 absolute left-2.5 top-3 text-muted-foreground" /> */}
                                {/* Nút Clear bên phải - Chỉ hiện khi có dữ liệu */}
                                {/* {staffBaseInput && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setStaffBaseInput("")}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-400 hover:bg-primary 
                                                hover:text-primary-foreground transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Clear</span>
                                            </Button>
                                        )}
                                    </div>
                                </div> */}
                                {/* Calculate Button */}
                                <Button
                                    onClick={handleLiveCalculation}
                                    // disabled={isLoading || isCalculating || !attendanceBaseInput || !staffBaseInput}
                                    disabled={isLoading || isCalculating}
                                    className="w-full"
                                >
                                    {isCalculating ? <RotateCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
                                    Calculate Live Preview
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Warning Alert if showing recalculated scores */}
                    {showScores && (
                        <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Preview Mode Active</AlertTitle>
                            <AlertDescription>
                                You are viewing recalculated live scores. These changes are <strong>not saved</strong> yet. Click "Confirm & Save Report" to apply them.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Data Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <CardTitle>Member Score Report</CardTitle>
                                    {showScores && <Badge variant="destructive" className="animate-pulse">PREVIEW</Badge>}
                                </div>
                                <Badge variant="secondary">{activities.length} Members</Badge>
                            </div>
                            <CardDescription>
                                {showScores
                                    ? "Click on any row to see detailed score breakdown."
                                    : "Showing activity stats only. Calculate to view scores."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[250px] pl-10">Full Name</TableHead>
                                        <TableHead className="w-[100px] text-center">Student ID</TableHead>

                                        {/* --- NHÓM CHÍNH (Attendance & Staff) --- */}
                                        {/* <TableHead className="w-[120px] text-center font-semibold text-foreground">Sessions (P/T)</TableHead>
                                        <TableHead className="w-[100px] text-center font-semibold text-foreground">Staff Count</TableHead> */}
                                        <TableHead className="w-[120px] text-center font-semibold text-foreground">
                                            <div className="flex items-center justify-center gap-2">
                                                <span>Sessions</span>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Present / Total Sessions (P/T)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableHead>
                                        <TableHead className="w-[100px] text-center font-semibold text-foreground">
                                            <div className="flex items-center justify-center gap-2">
                                                <span>Staff Count</span>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Total times assigned as Staff</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableHead>

                                        {/* --- NHÓM PHỤ (Events & Penalty) --- */}
                                        {/* <TableHead className="w-[120px] text-center text-muted-foreground">Events (A/R)</TableHead>
                                        <TableHead className="w-[80px] text-center text-red-500">Penalty</TableHead> */}
                                        {/* <TableHead className="w-[120px] text-center text-muted-foreground">
                                            <div className="flex items-center justify-center gap-2">
                                                <span>Events</span>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Attended / Registered Events (A/R)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableHead> */}

                                        <TableHead className="w-[80px] text-center text-red-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <span>Penalty</span>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-3.5 w-3.5 text-red-400 hover:text-red-600 transition-colors" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Accumulated Penalty Points</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableHead>

                                        {/* --- NHÓM ĐIỂM SỐ (Chỉ hiện khi Calculate) --- */}

                                        {showScores && (
                                            <>
                                                {/* Cột Level */}
                                                <TableHead className="text-center text-blue-600 bg-blue-50/50">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span>Level</span>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Info className="h-3.5 w-3.5 text-blue-400 hover:text-blue-600 transition-colors" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Activity classification based on score</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableHead>

                                                {/* Cột Attendance Score */}
                                                <TableHead className="text-center text-blue-600 bg-blue-50/50">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span>Attendance Score</span>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Info className="h-3.5 w-3.5 text-blue-400 hover:text-blue-600 transition-colors" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Total score derived from Sessions in club</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableHead>

                                                {/* Cột Staff Score */}
                                                <TableHead className="text-center text-yellow-600 bg-yellow-50/50">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span>Staff Score</span>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Info className="h-3.5 w-3.5 text-yellow-500 hover:text-yellow-700 transition-colors" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Total score derived from Staff contributions</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableHead>

                                                {/* Cột Final Score */}
                                                <TableHead className="text-right font-bold bg-muted/30">
                                                    {/* Lưu ý: justify-end vì cột này căn phải */}
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span>Final Score</span>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Total = Attendance Score + Staff Score</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableHead>
                                            </>
                                        )}
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                                                {/* <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell> */}
                                                <TableCell><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                                                {showScores && (
                                                    <>
                                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                                        <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                                                        <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                                                        <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        ))
                                    ) : activities.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={showScores ? 10 : 6} className="text-center h-32 text-muted-foreground">
                                                No activity data found for this period.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activities.map((member) => (
                                            <TableRow
                                                key={member.membershipId}
                                                className={showScores ? "cursor-pointer hover:bg-muted/60" : ""}
                                                onClick={() => showScores && setSelectedMember(member)}
                                            >
                                                <TableCell className="font-medium pl-5">{member.fullName}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm text-center">{member.studentCode}</TableCell>
                                                {/* 1. Sessions (Attendance) - CHÍNH */}
                                                <TableCell className="text-center font-medium">
                                                    {member.totalClubPresent ?? 0}/{member.totalClubSessions ?? 0}
                                                </TableCell>
                                                {/* 2. Staff Count - CHÍNH */}
                                                <TableCell className="text-center font-medium">
                                                    {member.totalStaffCount ?? 0}
                                                </TableCell>
                                                {/* 3. Events - PHỤ */}
                                                {/* <TableCell className="text-center text-muted-foreground">
                                                    {member.totalEventAttended ?? 0}/{member.totalEventRegistered ?? 0}
                                                </TableCell> */}
                                                {/* 4. Penalty - PHỤ */}
                                                <TableCell className="text-center font-bold text-red-500">
                                                    {member.totalPenaltyPoints > 0 ? `-${member.totalPenaltyPoints}` : "0"}
                                                </TableCell>
                                                {/* 5. Score Columns - Hiện khi showScores = true */}
                                                {showScores && (
                                                    <>
                                                        <TableCell className="text-center bg-blue-50/30">
                                                            <Badge variant="outline" className={getLevelBadgeColor(member.activityLevel as ActivityLevel || "UNKNOWN")}>
                                                                {member.activityLevel || "UNKNOWN"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center font-mono text-blue-600 bg-blue-50/30">
                                                            {member.attendanceTotalScore?.toFixed(0) ?? 0}
                                                        </TableCell>
                                                        <TableCell className="text-center font-mono text-yellow-600 bg-yellow-50/30">
                                                            {member.staffTotalScore?.toFixed(0) ?? 0}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-lg bg-muted/20 pr-10">
                                                            {member.finalScore?.toFixed(0) ?? 0}
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    {/* Detail Modal (Chỉ mở được khi showScores = true) */}
                    <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Member Score Breakdown</DialogTitle>
                                <DialogDescription>
                                    Details for {selectedMember?.fullName}
                                </DialogDescription>
                            </DialogHeader>
                            {selectedMember && <ActivityScoreDetail score={selectedMember} />}
                        </DialogContent>
                    </Dialog>
                </div>
            </AppShell>
        </ProtectedRoute>
    )
}