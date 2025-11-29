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
    getClubMemberActivity,
    getClubMemberActivityLive,
    updateBulkMonthlyActivity,
    MemberActivityScore,
    MemberLiveActivityScore,
    ActivityLevel,
    UpdateBulkMonthlyActivityBody,
    MonthlyActivityItem
} from "@/service/activityApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, BarChart2, Star, RotateCw, Calculator, Check, Save, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { getClubIdFromToken } from "@/service/clubApi"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// --- Tiện ích (Helpers) ---

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

// Định dạng màu cho Activity Level
const getLevelBadgeColor = (level: ActivityLevel | string) => {
    switch (level) {
        case "HIGH": return "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
        case "MEDIUM": return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
        case "LOW": return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700"
        default: return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-700"
    }
}

// Component hiển thị chi tiết điểm trong Modal
const ActivityScoreDetail = ({ score }: { score: MemberActivityScore }) => {
    // Sử dụng ?? 0 để an toàn với dữ liệu null/undefined
    const attendanceScore = score.attendanceTotalScore ?? 0;
    const staffTotalScore = score.staffTotalScore ?? 0;
    const finalScore = score.finalScore ?? 0;

    return (
        <div className="space-y-6">
            {/* Tổng điểm */}
            <Card className="bg-primary/5 border-primary/50">
                <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2 text-primary font-semibold">
                        <BarChart2 className="h-5 w-5" /> FINAL SCORE
                    </CardDescription>
                    <CardTitle className="text-5xl text-primary">
                        {finalScore.toFixed(0)}
                    </CardTitle>
                    <CardDescription>
                        = Attendance ({attendanceScore.toFixed(0)}) + Staff ({staffTotalScore.toFixed(0)})
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phần Attendance */}
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
                        <div className="border-t pt-2 flex justify-between items-center">
                            <span className="font-semibold text-sm">Total Attendance:</span>
                            <span className="text-xl font-bold text-blue-600">{attendanceScore.toFixed(0)}</span>
                        </div>
                        
                        <div className="bg-muted p-2 rounded text-xs space-y-1 mt-2">
                            <div className="flex justify-between">
                                <span>Rate:</span>
                                <span>{((score.sessionAttendanceRate ?? 0) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Sessions:</span>
                                <span>{score.totalClubPresent ?? 0}/{score.totalClubSessions ?? 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Phần Staff */}
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
                            <Badge variant={(score.staffEvaluation === 'GOOD' || score.staffEvaluation === 'EXCELLENT') ? 'default' : 'secondary'} className="text-[10px]">
                                {score.staffEvaluation ?? 'NONE'}
                            </Badge>
                        </div>
                        <div className="border-t pt-2 flex justify-between items-center">
                            <span className="font-semibold text-sm">Total Staff:</span>
                            <span className="text-xl font-bold text-yellow-600">{staffTotalScore.toFixed(0)}</span>
                        </div>

                        <div className="bg-muted p-2 rounded text-xs space-y-1 mt-2">
                            <div className="flex justify-between">
                                <span>Times Participated:</span>
                                <span>{score.totalStaffCount ?? 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Last Multiplier:</span>
                                <span>{(score.staffMultiplier ?? 0).toFixed(1)}x</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Các chỉ số phụ */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4" /> Penalty Points
                        </div>
                        <span className="text-red-600 font-bold">-{score.totalPenaltyPoints ?? 0}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ActivityReportPage() {
    const { toast } = useToast()
    
    // State quản lý thời gian
    const [yearOptions] = useState(generateYearOptions())
    const [monthOptions] = useState(generateMonthOptions())
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

    // State dữ liệu
    const [activities, setActivities] = useState<MemberActivityScore[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedMember, setSelectedMember] = useState<MemberActivityScore | null>(null)
    
    // State Base Score & Chế độ
    // [CẬP NHẬT] Mặc định là "0"
    const [attendanceBaseInput, setAttendanceBaseInput] = useState<string>("0")
    const [staffBaseInput, setStaffBaseInput] = useState<string>("0")
    const [isCalculating, setIsCalculating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isPreviewMode, setIsPreviewMode] = useState(false) // Đánh dấu đang xem Live Preview

    const [clubId] = useState(() => getClubIdFromToken())

    // Hàm tải dữ liệu lịch sử (ban đầu)
    const loadActivities = useCallback(async () => {
        if (!clubId) {
            toast({ title: "Error", description: "Club information not found.", variant: "destructive" })
            return
        }

        console.log(`Loading historical data for Club ID: ${clubId}, ${selectedMonth}/${selectedYear}`)
        setIsLoading(true)
        setIsPreviewMode(false) // Reset preview mode khi load lại trang
        
        // [CẬP NHẬT] Reset input về 0 mỗi khi load lại dữ liệu (chuyển tháng/năm)
        setAttendanceBaseInput("0");
        setStaffBaseInput("0");

        try {
            // Vẫn gọi API để lấy dữ liệu hoạt động mới nhất của member trong tháng
            const data = await getClubMemberActivity({
                clubId: clubId,
                year: selectedYear,
                month: selectedMonth,
            })
            setActivities(data)
            // [QUAN TRỌNG] Đã bỏ đoạn code tự động điền base score cũ vào input
        } catch (error: any) {
            console.error("Error loading activity report:", error)
            toast({
                title: "Error",
                description: error.message || "Unable to load report.",
                variant: "destructive",
            })
            setActivities([])
        } finally {
            setIsLoading(false)
        }
    }, [clubId, selectedYear, selectedMonth, toast])

    // Hàm tính toán LIVE
    const handleLiveCalculation = async () => {
        if (!clubId) return

        const attBase = Number(attendanceBaseInput)
        const stfBase = Number(staffBaseInput)

        if (isNaN(attBase) || attBase < 0 || isNaN(stfBase) || stfBase < 0) {
            toast({ 
                title: "Invalid Input", 
                description: "Base scores must be valid positive numbers.", 
                variant: "destructive" 
            })
            return
        }

        setIsCalculating(true)
        try {
            // 1. Gọi API Live để lấy dữ liệu tính toán real-time
            const liveData: MemberLiveActivityScore[] = await getClubMemberActivityLive({
                clubId: clubId,
                attendanceBase: attBase,
                staffBase: stfBase
            })
            
            // 2. MERGE Logic: Kết hợp dữ liệu Live vào dữ liệu hiện tại
            // Lý do: Live Data chỉ có Score, thiếu Stats (Level, Events...).
            // Ta cần giữ lại Stats từ `activities` cũ (nếu có) và cập nhật Score từ `liveData`.
            
            const mergedActivities: MemberActivityScore[] = liveData.map(liveItem => {
                // Tìm member tương ứng trong danh sách hiện tại
                const existingMember = activities.find(a => a.membershipId === liveItem.membershipId);

                if (existingMember) {
                    // Nếu có dữ liệu cũ, ghi đè Score mới vào, giữ nguyên Stats cũ
                    return {
                        ...existingMember,
                        attendanceBaseScore: liveItem.attendanceBaseScore,
                        attendanceMultiplier: liveItem.attendanceMultiplier,
                        attendanceTotalScore: liveItem.attendanceTotalScore,
                        staffBaseScore: liveItem.staffBaseScore,
                        staffMultiplier: liveItem.staffMultiplier,
                        staffTotalScore: liveItem.staffTotalScore,
                        finalScore: liveItem.finalScore
                    };
                } else {
                    // Nếu là tháng mới tinh chưa có dữ liệu, tạo mới object với default stats
                    return {
                        ...liveItem,
                        // Default stats cho các trường thiếu
                        clubId: clubId,
                        clubName: "", // Live không trả về cái này, có thể để trống
                        year: selectedYear,
                        month: selectedMonth,
                        totalEventRegistered: 0,
                        totalEventAttended: 0,
                        eventAttendanceRate: 0,
                        totalPenaltyPoints: 0,
                        activityLevel: "UNKNOWN",
                        totalClubSessions: 0,
                        totalClubPresent: 0,
                        sessionAttendanceRate: 0,
                        totalStaffCount: 0,
                        staffEvaluation: "UNKNOWN",
                        staffScore: 0
                    } as MemberActivityScore;
                }
            });

            setActivities(mergedActivities)
            setIsPreviewMode(true) // Bật chế độ Preview
            
            toast({
                title: "Live Preview Ready",
                description: `Scores recalculated based on Att: ${attBase}, Staff: ${stfBase}. Don't forget to SAVE.`,
                variant: "default",
            })
        } catch (error: any) {
            console.error("Error calculating live scores:", error)
            toast({
                title: "Calculation Failed",
                description: error.message || "Failed to fetch live data.",
                variant: "destructive",
            })
        } finally {
            setIsCalculating(false)
        }
    }

    // Hàm Lưu Báo Cáo (Bulk Update)
    const handleSaveReport = async () => {
        if (!clubId || activities.length === 0) return;

        setIsSaving(true);
        try {
            // Map dữ liệu hiện tại sang format Body của API Bulk Update
            const itemsToUpdate: MonthlyActivityItem[] = activities.map(item => ({
                membershipId: item.membershipId,
                year: selectedYear, // Đảm bảo dùng năm đang chọn
                month: selectedMonth, // Đảm bảo dùng tháng đang chọn
                totalEventRegistered: item.totalEventRegistered ?? 0,
                totalEventAttended: item.totalEventAttended ?? 0,
                eventAttendanceRate: item.eventAttendanceRate ?? 0,
                totalPenaltyPoints: item.totalPenaltyPoints ?? 0,
                activityLevel: item.activityLevel || "UNKNOWN",
                attendanceBaseScore: item.attendanceBaseScore,
                attendanceMultiplier: item.attendanceMultiplier,
                attendanceTotalScore: item.attendanceTotalScore,
                staffBaseScore: item.staffBaseScore,
                totalStaffCount: item.totalStaffCount ?? 0,
                staffEvaluation: item.staffEvaluation || "UNKNOWN",
                staffMultiplier: item.staffMultiplier,
                staffScore: item.staffScore ?? 0,
                staffTotalScore: item.staffTotalScore,
                totalClubSessions: item.totalClubSessions ?? 0,
                totalClubPresent: item.totalClubPresent ?? 0,
                sessionAttendanceRate: item.sessionAttendanceRate ?? 0,
                finalScore: item.finalScore
            }));

            const payload: UpdateBulkMonthlyActivityBody = {
                year: selectedYear,
                month: selectedMonth,
                items: itemsToUpdate
            };

            await updateBulkMonthlyActivity({
                clubId: clubId,
                body: payload
            });

            toast({
                title: "Report Saved",
                description: "All member scores have been successfully updated.",
                variant: "default",
            });
            
            // Sau khi save thành công, tắt chế độ Preview và reload lại dữ liệu sạch
            setIsPreviewMode(false);
            loadActivities();

        } catch (error: any) {
            console.error("Error saving report:", error);
            toast({
                title: "Save Failed",
                description: error.message || "Could not save the report.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Tải dữ liệu khi component mount hoặc filter thay đổi
    useEffect(() => {
        loadActivities()
    }, [selectedYear, selectedMonth, clubId, loadActivities])

    return (
        <ProtectedRoute allowedRoles={["club_leader", "club_vice_leader"]}>
            <AppShell>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                                <Calculator className="h-7 w-7 text-primary" />
                                <span>Activity Scoring Manager</span>
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Manage attendance and staff points for <strong>{selectedMonth}/{selectedYear}</strong>.
                            </p>
                        </div>
                        
                        {/* Nút Save */}
                        <Button 
                            className="gap-2 bg-green-600 hover:bg-green-700" 
                            disabled={isLoading || isSaving || activities.length === 0}
                            onClick={handleSaveReport}
                        >
                            {isSaving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Confirm & Save Report
                        </Button>
                    </div>
                    
                    {/* Alert thông báo Preview Mode */}
                    {isPreviewMode && (
                        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Preview Mode Active</AlertTitle>
                            <AlertDescription>
                                You are viewing recalculated live scores. These changes are <strong>not saved</strong> yet. Click "Confirm & Save Report" to apply them.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Panel Điều khiển: Filter & Inputs */}
                    <Card className="border-primary/20 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Configuration & Calculation</CardTitle>
                            <CardDescription>Set parameters to calculate real-time scores for all members.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Cột 1: Chọn Năm */}
                                <div className="space-y-2">
                                    <Label htmlFor="year-select">Year</Label>
                                    <Select
                                        value={String(selectedYear)}
                                        onValueChange={(value) => setSelectedYear(Number(value))}
                                        disabled={isLoading || isCalculating || isSaving}
                                    >
                                        <SelectTrigger id="year-select"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Cột 2: Chọn Tháng */}
                                <div className="space-y-2">
                                    <Label htmlFor="month-select">Month</Label>
                                    <Select
                                        value={String(selectedMonth)}
                                        onValueChange={(value) => setSelectedMonth(Number(value))}
                                        disabled={isLoading || isCalculating || isSaving}
                                    >
                                        <SelectTrigger id="month-select"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {monthOptions.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Cột 3: Attendance Base Score */}
                                <div className="space-y-2">
                                    <Label htmlFor="att-base" className="text-blue-600 font-semibold">Attendance Base Score</Label>
                                    <div className="relative">
                                        <Input
                                            id="att-base"
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 30"
                                            value={attendanceBaseInput}
                                            onChange={(e) => setAttendanceBaseInput(e.target.value)}
                                            disabled={isLoading || isCalculating || isSaving}
                                            className="pl-9"
                                        />
                                        <Users className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                                    </div>
                                </div>

                                {/* Cột 4: Staff Base Score */}
                                <div className="space-y-2">
                                    <Label htmlFor="staff-base" className="text-yellow-600 font-semibold">Staff Base Score</Label>
                                    <div className="relative">
                                        <Input
                                            id="staff-base"
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 20"
                                            value={staffBaseInput}
                                            onChange={(e) => setStaffBaseInput(e.target.value)}
                                            disabled={isLoading || isCalculating || isSaving}
                                            className="pl-9"
                                        />
                                        <Star className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-4 bg-muted/20 flex justify-end">
                            <Button 
                                onClick={handleLiveCalculation}
                                disabled={isLoading || isCalculating || isSaving || !attendanceBaseInput || !staffBaseInput}
                                className="w-full sm:w-auto min-w-[200px] gap-2"
                                variant="secondary"
                            >
                                {isCalculating ? <RotateCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                                Calculate Live Preview
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Bảng Dữ liệu */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <CardTitle>Member Score Report</CardTitle>
                                    {isPreviewMode && <Badge variant="destructive" className="animate-pulse">PREVIEW</Badge>}
                                </div>
                                <Badge variant="secondary">{activities.length} Members</Badge>
                            </div>
                            <CardDescription>
                                Click on any row to see detailed score breakdown.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[250px]">Full Name</TableHead>
                                        <TableHead>Student ID</TableHead>
                                        <TableHead>Activity Level</TableHead>
                                        <TableHead className="text-center text-blue-600">Att. Score</TableHead>
                                        <TableHead className="text-center text-yellow-600">Staff Score</TableHead>
                                        <TableHead className="text-right font-bold">Final Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : activities.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                                No data found for this period. Try calculating live scores.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activities.map((member) => (
                                            <TableRow 
                                                key={member.membershipId} 
                                                onClick={() => setSelectedMember(member)}
                                                className="cursor-pointer hover:bg-muted/60 transition-colors"
                                            >
                                                <TableCell className="font-medium">{member.fullName}</TableCell>
                                                <TableCell className="text-muted-foreground">{member.studentCode}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={getLevelBadgeColor(member.activityLevel || "UNKNOWN")}>
                                                        {member.activityLevel || "UNKNOWN"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-blue-600">
                                                    {(member.attendanceTotalScore ?? 0).toFixed(0)}
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-yellow-600">
                                                    {(member.staffTotalScore ?? 0).toFixed(0)}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-lg">
                                                    {(member.finalScore ?? 0).toFixed(0)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Modal Chi tiết */}
                <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Detailed Score Breakdown</DialogTitle>
                            <DialogDescription>
                                Score analysis for <span className="font-semibold text-foreground">{selectedMember?.fullName}</span> ({selectedMember?.studentCode})
                            </DialogDescription>
                        </DialogHeader>
                        {selectedMember && <ActivityScoreDetail score={selectedMember} />}
                    </DialogContent>
                </Dialog>
            </AppShell>
        </ProtectedRoute>
    )
}