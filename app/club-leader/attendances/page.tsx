"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "lucide-react"
import { getMyClubMembers } from "@/service/membershipApi"
import { saveAttendanceRecord, fetchAttendanceByDate } from "@/service/attendanceApi"

type Member = {
    userId: number
    fullName?: string
    studentCode?: string
    majorName?: string
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE"

export default function ClubLeaderAttendancePage() {
    const { toast } = useToast()
    const [members, setMembers] = useState<Member[]>([])
    const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({})
    const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Lấy danh sách thành viên trong CLB mà leader quản lý
    useEffect(() => {
        const loadMembers = async () => {
            try {
                const data = await getMyClubMembers()
                const mapped = data.map((m) => ({
                    userId: m.userId,
                    // fullName: m.user?.fullName ?? "Unknown",
                    // studentCode: m.user?.studentCode ?? "",
                    // majorName: m.user?.majorName ?? "",
                }))

                setMembers(data)
            } catch (error) {
                console.error("Failed to load members:", error)
                toast({
                    title: "Lỗi tải danh sách",
                    description: "Không thể tải danh sách thành viên trong CLB.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }
        loadMembers()
    }, [toast])

    // Khi đổi ngày -> load lại dữ liệu điểm danh cũ
    //   useEffect(() => {
    //     const loadAttendance = async () => {
    //       try {
    //         const existing = await fetchAttendanceByDate(selectedDate)
    //         const mapped = Object.fromEntries(existing.map((r: any) => [r.userId, r.status]))
    //         setAttendance(mapped)
    //       } catch {
    //         setAttendance({})
    //       }
    //     }
    //     loadAttendance()
    //   }, [selectedDate])

    const handleStatusChange = (userId: number, status: AttendanceStatus) => {
        setAttendance((prev) => ({ ...prev, [userId]: status }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const records = Object.entries(attendance).map(([userId, status]) => ({
                userId: Number(userId),
                status,
                date: selectedDate,
            }))
            await saveAttendanceRecord(records)
            toast({
                title: "Đã lưu điểm danh",
                description: `Điểm danh ngày ${selectedDate} đã được lưu thành công.`,
            })
        } catch (error) {
            toast({
                title: "Lỗi lưu điểm danh",
                description: "Không thể lưu kết quả điểm danh.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
                    Đang tải danh sách thành viên...
                </div>
            </AppShell>
        )
    }

    return (
        <ProtectedRoute allowedRoles={["club_leader"]}>
            <AppShell>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold">Attendance Management</h1>
                        <p className="text-muted-foreground">Mark attendance for your club members</p>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <Label>Attendance Date:</Label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border rounded-md px-2 py-1 text-sm bg-background"
                                />
                            </div>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save Attendance"}
                            </Button>
                        </CardHeader>

                        <CardContent className="divide-y">
                            {members.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground">
                                    Không có thành viên nào trong CLB.
                                </div>
                            ) : (
                                members.map((m) => (
                                    <div key={m.userId} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                                        <div>
                                            <p className="font-medium">{m.fullName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {m.studentCode ?? "No code"} · {m.majorName ?? "Unknown major"}
                                            </p>
                                        </div>

                                        <Select
                                            value={attendance[m.userId] ?? ""}
                                            onValueChange={(val) => handleStatusChange(m.userId, val as AttendanceStatus)}
                                        >
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PRESENT">✅ Present</SelectItem>
                                                <SelectItem value="ABSENT">❌ Absent</SelectItem>
                                                <SelectItem value="LATE">⏰ Late</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </AppShell>
        </ProtectedRoute>
    )
}
