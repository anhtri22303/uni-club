"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    getClubMemberActivity, MemberActivityScore, ActivityLevel, calculateFinalScore, updateMemberBaseScore,
} from "@/service/activityApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { LineChart, Users, Calendar, BarChart2, TrendingUp, TrendingDown, Minus, Check, X, ShieldAlert, Star, RotateCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context" // Giả sử bạn có hook này để lấy clubId
import { Label } from "@/components/ui/label"
import { getClubIdFromToken } from "@/service/clubApi"
import { Input } from "@/components/ui/input" // Component Input
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
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
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
                        <CardDescription className="flex items-center gap-2 text-sm"><LineChart className="h-4 w-4" /> Base Score</CardDescription>
                        <CardTitle className="text-3xl">{score.baseScore.toFixed(0)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            {/* {score.baseScorePercent.toFixed(0)}% of maximum score */}
                            {(score.baseScorePercent ?? 0).toFixed(0)}% of maximum score
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-sm"><BarChart2 className="h-4 w-4" /> Multiplier</CardDescription>
                        <CardTitle className="text-3xl flex items-center">
                            {getMultiplierIcon(score.appliedMultiplier)}
                            {score.appliedMultiplier.toFixed(1)}x
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline" className={getMultiplierBadgeColor(score.appliedMultiplier)}>
                            {score.appliedMultiplier > 1 ? `+${((score.appliedMultiplier - 1) * 100).toFixed(0)}% bonus` :
                                score.appliedMultiplier < 1 ? `${((1 - score.appliedMultiplier) * 100).toFixed(0)}% penalty` :
                                    "No change"}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Raw Data Details</CardTitle>
                    <CardDescription>Data used to calculate monthly score.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Session Attendance Rate:</span>
                        <span className="font-bold text-lg">{(score.sessionAttendanceRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground ml-4"> (Sessions attended / Total sessions)</span>
                        <span>{score.totalClubPresent} / {score.totalClubSessions}</span>
                    </div>
                    <hr className="my-2 dark:border-gray-700" />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Event Participation Rate:</span>
                        <span className="font-bold text-lg">{(score.eventAttendanceRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground ml-4"> (Events attended / Total events registered)</span>
                        <span>{score.totalEventAttended} / {score.totalEventRegistered}</span>
                    </div>
                    <hr className="my-2 dark:border-gray-700" />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Staff Performance Score:</span>
                        <span className="font-bold text-lg">{score.avgStaffPerformance.toFixed(1)} / 5 <Star className="h-4 w-4 inline text-yellow-500" /></span>
                    </div>
                    <hr className="my-2 dark:border-gray-700" />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-red-600 dark:text-red-400">Penalty Points:</span>
                        <span className="font-bold text-lg text-red-600 dark:text-red-400">-{score.totalPenaltyPoints}</span>
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
    const [newBaseScore, setNewBaseScore] = useState<string>("") // State cho Base Score mới
    const [isCalculating, setIsCalculating] = useState(false)
    const [isUpdatingBaseScore, setIsUpdatingBaseScore] = useState(false)

    // Hàm tải dữ liệu
    const loadActivities = useCallback(async () => {
        if (!clubId) {
            toast({ title: "Error", description: "Club information not found.", variant: "destructive" })
            return
        }

        console.log(`Loading data for Club ID: ${clubId}, Year: ${selectedYear}, Month: ${selectedMonth}`)
        setIsLoading(true)
        try {
            const data = await getClubMemberActivity({
                clubId: clubId,
                year: selectedYear,
                month: selectedMonth,
            })
            setActivities(data)
            // Cập nhật Base Score hiện tại của member đầu tiên làm giá trị mặc định cho ô input
            if (data.length > 0) {
                setNewBaseScore(String(data[0].baseScore.toFixed(0)));
            }
        } catch (error: any) {
            console.error("Error loading activity report:", error)
            toast({
                title: "Error",
                description: error.message || "Unable to load report. Please try again.",
                variant: "destructive",
            })
            setActivities([]) // Xóa dữ liệu cũ nếu có lỗi
        } finally {
            setIsLoading(false)
        }
    }, [clubId, selectedYear, selectedMonth, toast])

    // Hàm gửi yêu cầu tính toán Final Score
    const handleCalculateScores = async () => {
        if (!clubId) return
        setIsCalculating(true)
        try {
            await calculateFinalScore({
                clubId: clubId,
                year: selectedYear,
                month: selectedMonth,
            })
            toast({
                title: "Success",
                description: "Final scores calculation requested. Data will refresh shortly.",
                variant: "default",
            })
            // Tải lại dữ liệu sau khi tính toán
            // Dùng setTimeout để đảm bảo BE có thời gian xử lý
            setTimeout(loadActivities, 2000);
        } catch (error: any) {
            console.error("Error calculating scores:", error)
            toast({
                title: "Calculation Failed",
                description: error.message || "An error occurred while calculating final scores.",
                variant: "destructive",
            })
        } finally {
            setIsCalculating(false)
        }
    }

    // Hàm cập nhật Base Score đồng loạt (gọi API update cho từng member)
    const handleUpdateAllBaseScores = async () => {
        if (!clubId || activities.length === 0) return

        const score = Number(newBaseScore);
        if (isNaN(score) || score < 0) {
            toast({ title: "Error", description: "Base Score must be a non-negative number.", variant: "destructive" });
            return;
        }

        setIsUpdatingBaseScore(true);

        try {
            // Lặp và gọi API cho từng member
            // Lưu ý: Cần tối ưu bằng cách gọi API bulk nếu BE hỗ trợ
            const updatePromises = activities.map(member =>
                updateMemberBaseScore({
                    clubId: clubId,
                    year: selectedYear,
                    month: selectedMonth,
                    body: {
                        membershipId: member.membershipId,
                        baseScore: score,
                    }
                })
            );

            // Chờ tất cả các lời gọi API hoàn thành
            await Promise.allSettled(updatePromises);

            toast({
                title: "Success",
                description: `Updated Base Score to ${score.toFixed(0)} for all ${activities.length} members. Now calculate Final Scores.`,
                variant: "default",
            });

        } catch (error: any) {
            console.error("Error updating base scores:", error);
            toast({
                title: "Update Failed",
                description: "Some or all base scores failed to update. Check console for details.",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingBaseScore(false);
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
                                <span className="truncate">Member Activity Report</span>
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
                                Review member activity scores by month.
                            </p>
                        </div>
                        {/* Approve Button (Suggestion) */}
                        <Button className="gap-2 w-full sm:w-auto flex-shrink-0" disabled={isLoading || activities.length === 0}>
                            <Check className="h-4 w-4" />
                            <span className="truncate">Approve Report for Month {selectedMonth}</span>
                        </Button>
                    </div>

                    {/* Controls Card: Filter, Base Score Input, and Calculate Button */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Score Management</CardTitle>
                            <CardDescription>Adjust Base Score and calculate final scores for the selected month.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Filter Block */}
                            <div className="space-y-2">
                                <Label htmlFor="year-select">Select Year</Label>
                                <Select
                                    value={String(selectedYear)}
                                    onValueChange={(value) => setSelectedYear(Number(value))}
                                    disabled={isLoading || isCalculating || isUpdatingBaseScore}
                                >
                                    <SelectTrigger id="year-select"><SelectValue placeholder="Select year" /></SelectTrigger>
                                    <SelectContent>
                                        {yearOptions.map(year => (
                                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="month-select">Select Month</Label>
                                <Select
                                    value={String(selectedMonth)}
                                    onValueChange={(value) => setSelectedMonth(Number(value))}
                                    disabled={isLoading || isCalculating || isUpdatingBaseScore}
                                >
                                    <SelectTrigger id="month-select"><SelectValue placeholder="Select month" /></SelectTrigger>
                                    <SelectContent>
                                        {monthOptions.map(month => (
                                            <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Base Score Input */}
                            <div className="space-y-2">
                                <Label htmlFor="base-score-input">Bulk Base Score</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="base-score-input"
                                        type="number"
                                        placeholder="E.g., 100"
                                        value={newBaseScore}
                                        onChange={(e) => setNewBaseScore(e.target.value)}
                                        disabled={isLoading || activities.length === 0 || isUpdatingBaseScore}
                                        min="0"
                                    />
                                    <Button
                                        onClick={handleUpdateAllBaseScores}
                                        disabled={isLoading || isUpdatingBaseScore || activities.length === 0 || !newBaseScore}
                                    >
                                        {isUpdatingBaseScore ? <RotateCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Applies to all members. Must update before calculating final score.</p>
                            </div>
                        </CardContent>
                        <CardContent className="border-t pt-4">
                            {/* Calculate Button */}
                            <Button
                                onClick={handleCalculateScores}
                                disabled={isLoading || isCalculating || activities.length === 0}
                                className="w-full gap-2"
                            >
                                {isCalculating ? (
                                    <RotateCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <BarChart2 className="h-4 w-4" />
                                )}
                                Calculate Final Scores for {selectedMonth}/{selectedYear}
                            </Button>
                        </CardContent>
                    </Card>


                    {/* Data Table */}
                    {/* <Card>
                        <CardHeader>
                            <CardTitle>Score Report for {selectedMonth}/{selectedYear}</CardTitle>
                            <CardDescription>
                                Total of {activities.length} members recorded. Click on a row to view details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Full Name</TableHead>
                                        <TableHead>Student ID</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead>Multiplier</TableHead>
                                        <TableHead className="text-right">Final Score</TableHead>
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
                                        // No data
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                No data found for {selectedMonth}/{selectedYear}.
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
                    </Card> */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Score Report for {selectedMonth}/{selectedYear}</CardTitle>
                            <CardDescription>
                                Total of **{activities.length}** members recorded. Click on a row to view details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Full Name</TableHead>
                                        <TableHead>Student ID</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead>Multiplier</TableHead>
                                        <TableHead className="text-right">Final Score</TableHead>
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
                                        // No data
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                No data found for {selectedMonth}/{selectedYear}.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        // Hiển thị dữ liệu
                                        activities.map(member => (
                                            <TableRow key={member.membershipId} onClick={() => setSelectedMember(member)} className="cursor-pointer hover:bg-muted/50">
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
                                                <TableCell className="text-right font-bold text-lg text-primary">{member.finalScore.toFixed(0)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>




                    {/* Suggestion: Error reporting card */}
                    <Card className="border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-600">
                        <CardHeader className="flex-row items-center gap-4 space-y-0">
                            <ShieldAlert className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                            <div>
                                <CardTitle className="text-orange-700 dark:text-orange-400">Found an Error?</CardTitle>
                                <CardDescription className="text-orange-600 dark:text-orange-300">
                                    If you find errors in raw data (attendance, event participation), please contact UniStaff for corrections.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>

                </div>

                {/* Member Details Modal */}
                <Dialog open={!!selectedMember} onOpenChange={(isOpen) => !isOpen && setSelectedMember(null)}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Score Details: {selectedMember?.fullName}</DialogTitle>
                            <DialogDescription>
                                Score analysis for {selectedMember?.month}/{selectedMember?.year}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedMember && <ActivityScoreDetail score={selectedMember} />}
                    </DialogContent>
                </Dialog>

            </AppShell>
        </ProtectedRoute>
    )
}