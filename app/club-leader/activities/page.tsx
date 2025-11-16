"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    getClubMemberActivity,
    MemberActivityScore,
    ActivityLevel,
} from "@/service/activityApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { LineChart, Users, Calendar, BarChart2, TrendingUp, TrendingDown, Minus, Check, X, ShieldAlert, Star } from "lucide-react"
import { useAuth } from "@/contexts/auth-context" // Giả sử bạn có hook này để lấy clubId
import { Label } from "@/components/ui/label"
import { getClubIdFromToken } from "@/service/clubApi"
// --- Tiện ích (Helpers) ---

// Tạo danh sách tháng/năm
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
        { value: 1, label: "Tháng 1" },
        { value: 2, label: "Tháng 2" },
        { value: 3, label: "Tháng 3" },
        { value: 4, label: "Tháng 4" },
        { value: 5, label: "Tháng 5" },
        { value: 6, label: "Tháng 6" },
        { value: 7, label: "Tháng 7" },
        { value: 8, label: "Tháng 8" },
        { value: 9, label: "Tháng 9" },
        { value: 10, label: "Tháng 10" },
        { value: 11, label: "Tháng 11" },
        { value: 12, label: "Tháng 12" },
    ]
}

// Định dạng màu cho Activity Level
const getLevelBadgeColor = (level: ActivityLevel | string) => {
    switch (level) {
        case "HIGH":
            return "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
        case "MEDIUM":
            return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
        case "LOW":
            return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700"
        default: // UNKNOWN
            return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-700"
    }
}

// Định dạng màu cho Multiplier
const getMultiplierBadgeColor = (multiplier: number) => {
    if (multiplier > 1) return "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
    if (multiplier < 1) return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700"
    return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
}

// Icon cho Multiplier
const getMultiplierIcon = (multiplier: number) => {
    if (multiplier > 1) return <TrendingUp className="h-4 w-4 mr-1" />
    if (multiplier < 1) return <TrendingDown className="h-4 w-4 mr-1" />
    return <Minus className="h-4 w-4 mr-1" />
}

// Component hiển thị chi tiết điểm
const ActivityScoreDetail = ({ score }: { score: MemberActivityScore }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-sm"><LineChart className="h-4 w-4" /> Điểm gốc (Base Score)</CardDescription>
                        <CardTitle className="text-3xl">{score.baseScore.toFixed(0)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            {score.baseScorePercent.toFixed(0)}% so với điểm tối đa
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-sm"><BarChart2 className="h-4 w-4" /> Hệ số (Multiplier)</CardDescription>
                        <CardTitle className="text-3xl flex items-center">
                            {getMultiplierIcon(score.appliedMultiplier)}
                            {score.appliedMultiplier.toFixed(1)}x
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline" className={getMultiplierBadgeColor(score.appliedMultiplier)}>
                            {score.appliedMultiplier > 1 ? `+${((score.appliedMultiplier - 1) * 100).toFixed(0)}% điểm` :
                                score.appliedMultiplier < 1 ? `${((1 - score.appliedMultiplier) * 100).toFixed(0)}% giảm trừ` :
                                    "Không thay đổi"}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Chi tiết dữ liệu thô (Raw Data)</CardTitle>
                    <CardDescription>Dữ liệu dùng để tính toán điểm số trong tháng.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tỉ lệ điểm danh (Session):</span>
                        <span className="font-bold text-lg">{(score.sessionAttendanceRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground ml-4"> (Số buổi có mặt / Tổng số buổi)</span>
                        <span>{score.totalClubPresent} / {score.totalClubSessions}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tỉ lệ tham gia Event:</span>
                        <span className="font-bold text-lg">{(score.eventAttendanceRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground ml-4"> (Số event tham gia / Tổng số event đã đăng ký)</span>
                        <span>{score.totalEventAttended} / {score.totalEventRegistered}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Điểm hỗ trợ (Staff):</span>
                        <span className="font-bold text-lg">{score.avgStaffPerformance.toFixed(1)} / 5 <Star className="h-4 w-4 inline text-yellow-500" /></span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-red-600">Điểm phạt (Penalty):</span>
                        <span className="font-bold text-lg text-red-600">-{score.totalPenaltyPoints}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


export default function ActivityReportPage() {
    const { toast } = useToast()
    //   const { user } = useAuth() // Lấy thông tin user (giả sử có clubId trong đó)

    const [yearOptions] = useState(generateYearOptions())
    const [monthOptions] = useState(generateMonthOptions())
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1) // Tháng (1-12)
    const [activities, setActivities] = useState<MemberActivityScore[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedMember, setSelectedMember] = useState<MemberActivityScore | null>(null)
    const [clubId] = useState(() => getClubIdFromToken())

    // Hàm tải dữ liệu
    const loadActivities = async () => {
        if (!clubId) {
            toast({ title: "Lỗi", description: "Không tìm thấy thông tin câu lạc bộ của bạn.", variant: "destructive" })
            return
        }

        console.log(`Đang tải dữ liệu cho Club ID: ${clubId}, Năm: ${selectedYear}, Tháng: ${selectedMonth}`)
        setIsLoading(true)
        try {
            const data = await getClubMemberActivity({
                clubId: clubId,
                year: selectedYear,
                month: selectedMonth,
            })
            setActivities(data)
        } catch (error: any) {
            console.error("Lỗi khi tải báo cáo hoạt động:", error)
            toast({
                title: "Lỗi",
                description: error.message || "Không thể tải báo cáo. Vui lòng thử lại.",
                variant: "destructive",
            })
            setActivities([]) // Xóa dữ liệu cũ nếu có lỗi
        } finally {
            setIsLoading(false)
        }
    }

    // Tải dữ liệu khi component mount hoặc khi đổi tháng/năm
    useEffect(() => {
        loadActivities()
    }, [selectedYear, selectedMonth, clubId])

    return (
        <ProtectedRoute allowedRoles={["club_leader", "club_vice_leader"]}>
            <AppShell>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                                <BarChart2 className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
                                <span className="truncate">Báo cáo Hoạt động Thành viên</span>
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
                                Xem lại điểm hoạt động của thành viên theo tháng.
                            </p>
                        </div>
                        {/* Nút Phê duyệt (Gợi ý) */}
                        <Button className="gap-2 w-full sm:w-auto flex-shrink-0" disabled={isLoading || activities.length === 0}>
                            <Check className="h-4 w-4" />
                            <span className="truncate">Phê duyệt Báo cáo Tháng {selectedMonth}</span>
                        </Button>
                    </div>

                    {/* Bộ lọc Tháng/Năm */}
                    <Card>
                        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="year-select">Chọn Năm</Label>
                                <Select
                                    value={String(selectedYear)}
                                    onValueChange={(value) => setSelectedYear(Number(value))}
                                >
                                    <SelectTrigger id="year-select">
                                        <SelectValue placeholder="Chọn năm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearOptions.map(year => (
                                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="month-select">Chọn Tháng</Label>
                                <Select
                                    value={String(selectedMonth)}
                                    onValueChange={(value) => setSelectedMonth(Number(value))}
                                >
                                    <SelectTrigger id="month-select">
                                        <SelectValue placeholder="Chọn tháng" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {monthOptions.map(month => (
                                            <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bảng Dữ liệu */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Báo cáo điểm tháng {selectedMonth}/{selectedYear}</CardTitle>
                            <CardDescription>
                                Tổng cộng có {activities.length} thành viên được ghi nhận. Nhấn vào một hàng để xem chi tiết.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Họ và Tên</TableHead>
                                        <TableHead>Mã SV</TableHead>
                                        <TableHead>Mức độ</TableHead>
                                        <TableHead>Hệ số (Multiplier)</TableHead>
                                        <TableHead className="text-right">Điểm cuối (Final)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        // Skeleton loading
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                                <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : activities.length === 0 ? (
                                        // Không có dữ liệu
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                Không tìm thấy dữ liệu cho tháng {selectedMonth}/{selectedYear}.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        // Hiển thị dữ liệu
                                        activities.map(member => (
                                            <TableRow key={member.membershipId} onClick={() => setSelectedMember(member)} className="cursor-pointer">
                                                <TableCell className="font-medium">{member.fullName}</TableCell>
                                                <TableCell>{member.studentCode}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={getLevelBadgeColor(member.activityLevel)}>
                                                        {member.activityLevel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={getMultiplierBadgeColor(member.appliedMultiplier)}>
                                                        {getMultiplierIcon(member.appliedMultiplier)}
                                                        {member.appliedMultiplier.toFixed(1)}x
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-lg">{member.finalScore.toFixed(0)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Gợi ý: Thẻ báo cáo sai sót */}
                    <Card className="border-orange-500 bg-orange-50/50">
                        <CardHeader className="flex-row items-center gap-4 space-y-0">
                            <ShieldAlert className="h-8 w-8 text-orange-600" />
                            <div>
                                <CardTitle className="text-orange-700">Phát hiện sai sót?</CardTitle>
                                <CardDescription className="text-orange-600">
                                    Nếu phát hiện dữ liệu thô (điểm danh, tham gia event) bị sai, vui lòng liên hệ UniStaff để điều chỉnh.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>

                </div>

                {/* Modal Chi tiết Thành viên */}
                <Dialog open={!!selectedMember} onOpenChange={(isOpen) => !isOpen && setSelectedMember(null)}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Chi tiết điểm: {selectedMember?.fullName}</DialogTitle>
                            <DialogDescription>
                                Phân tích điểm số tháng {selectedMember?.month}/{selectedMember?.year}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedMember && <ActivityScoreDetail score={selectedMember} />}
                    </DialogContent>
                </Dialog>

            </AppShell>
        </ProtectedRoute>
    )
}