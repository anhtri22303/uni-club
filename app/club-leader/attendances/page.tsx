"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import membershipApi, { ApiMembership } from "@/service/membershipApi"
import { getClubById, getClubIdFromToken } from "@/service/clubApi"
import { fetchUserById, fetchProfile } from "@/service/userApi"
import {
  Users, ChevronLeft, ChevronRight, CheckCircle, Filter, X, Calendar as CalendarIcon,
  MessageSquare, Check, XCircle, Clock, AlertCircle,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar" // ✅ MỚI
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog" // ✅ MỚI
import { Textarea } from "@/components/ui/textarea" // ✅ MỚI
import { cn } from "@/lib/utils" // ✅ MỚI
import { format } from "date-fns" // ✅ MỚI
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type AttendanceStatus = "present" | "absent" | "late" | "excused"
interface Club {
  id: number
  name: string
  description: string
  majorPolicyName: string
  majorName: string
  leaderId: number
  leaderName: string
}
interface ClubApiResponse {
  success: boolean
  message: string
  data: Club
}
interface Member {
  id: string
  fullName: string
  studentCode: string
  avatarUrl: string | null
  role: string
  isStaff: boolean
}
export default function ClubAttendancePage() {
  const { toast } = useToast()
  const [managedClub, setManagedClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiMembers, setApiMembers] = useState<ApiMembership[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  // const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const today = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const [currentDate, setCurrentDate] = useState("")
  const [userId, setUserId] = useState<string | number | null>(null)
  // --- ✅ MỚI: State cho tính năng nâng cao ---
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [editingNoteMember, setEditingNoteMember] = useState<Member | null>(null)
  const [currentNote, setCurrentNote] = useState("")
  // State search và filter
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)
  // ✅ MỚI: Tách useEffect
  // useEffect này chỉ chạy 1 lần để lấy thông tin cơ bản
  useEffect(() => {
    const loadBaseData = async () => {
      setLoading(true)
      try {
        const profile = await fetchProfile()
        setUserId((profile as any)?.userId)

        const clubId = getClubIdFromToken()
        if (!clubId) throw new Error("No club information found.")

        const clubResponse = (await getClubById(clubId)) as ClubApiResponse
        if (!clubResponse?.success) throw new Error("Unable to load club information.")
        setManagedClub(clubResponse.data)
      } catch (err: any) {
        setMembersError(err?.message || "Error loading initial data")
      } finally {
        setLoading(false)
      }
    }
    loadBaseData()
  }, [])

  // ✅ MỚI: useEffect này chạy mỗi khi clubId hoặc selectedDate thay đổi
  useEffect(() => {
    if (!managedClub?.id) return

    // 1. Kiểm tra xem có phải ngày hôm nay không
    const today = new Date()
    const isToday =
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()

    setIsReadOnly(!isToday)

    const loadMembersAndAttendance = async () => {
      setMembersLoading(true)
      setMembersError(null)

      try {
        // 2. Fetch danh sách thành viên (giả sử không đổi)
        // Nếu danh sách thành viên đã load rồi thì không cần load lại
        let membersData: ApiMembership[] = apiMembers
        if (membersData.length === 0) {
          membersData = await membershipApi.getMembersByClubId(managedClub.id)
          const membersWithUserData = await Promise.all(
            membersData.map(async (m: any) => {
              try {
                const userInfo = await fetchUserById(m.userId)
                return { ...m, userInfo }
              } catch {
                return { ...m, userInfo: null }
              }
            }),
          )
          setApiMembers(membersWithUserData)
          membersData = membersWithUserData // Dùng data mới fetch
        }

        // 3. ✅ Fetch dữ liệu điểm danh cho ngày đã chọn
        // BẠN SẼ CẦN API MỚI Ở ĐÂY, ví dụ:
        const attendanceData: any = null // Giả lập là chưa có dữ liệu

        const initialAttendance: Record<string, AttendanceStatus> = {}
        const initialNotes: Record<string, string> = {}

        if (attendanceData && attendanceData.records) {
          // Nếu có dữ liệu từ API
          attendanceData.records.forEach((record: any) => {
            initialAttendance[record.memberId] = record.status
            initialNotes[record.memberId] = record.note || ""
          })
        } else {
          // Nếu không có dữ liệu (hoặc là ngày hôm nay, chưa điểm danh)
          membersData.forEach((m: any) => {
            const id = m.membershipId ?? `m-${m.userId}`
            initialAttendance[id] = "absent" // Mặc định là vắng mặt
            initialNotes[id] = ""
          })
        }
        setAttendance(initialAttendance)
        setNotes(initialNotes)
      } catch (err: any) {
        setMembersError(err?.message || "Error loading member list")
      } finally {
        setMembersLoading(false)
      }
    }

    loadMembersAndAttendance()
  }, [managedClub, selectedDate]) // ✅ Chạy lại khi đổi ngày

  // Lọc thành viên active
  const clubMembers = managedClub
    ? apiMembers
      .filter((m: any) => String(m.clubId) === String(managedClub.id) && m.state === "ACTIVE" && m.userId !== userId)
      .map((m: any) => {
        const u = m.userInfo || {}
        return {
          id: m.membershipId ?? `m-${m.userId}`,
          fullName: u.fullName ?? m.fullName ?? `User ${m.userId}`,
          studentCode: m.studentCode ?? "—",
          avatarUrl: m.avatarUrl ?? null,
          role: m.clubRole ?? "MEMBER",
          isStaff: m.staff ?? false,
        }
      })
    : []
  const filteredMembers = clubMembers.filter((member) => {
    // 1. Lọc tìm kiếm
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchName = member.fullName.toLowerCase().includes(searchLower)
      const matchStudentCode = member.studentCode.toLowerCase().includes(searchLower)
      if (!matchName && !matchStudentCode) return false
    }

    // 2. Lọc theo Role
    const roleFilter = activeFilters["role"]
    if (roleFilter && roleFilter !== "all") {
      if (member.role !== roleFilter) return false
    }

    // 3. Lọc theo Staff
    const staffFilter = activeFilters["staff"]
    if (staffFilter && staffFilter !== "all") {
      const isStaff = staffFilter === "true"
      if (member.isStaff !== isStaff) return false
    }

    return true
  })
  const handleFilterChange = (filterKey: string, value: any) => {
    setActiveFilters((prev) => ({ ...prev, [filterKey]: value }))
    setMembersPage(1)
  }
  const hasActiveFilters = Object.values(activeFilters).some((v) => v && v !== "all") || Boolean(searchTerm)

  const clearFilters = () => {
    setSearchTerm("")
    setActiveFilters({})
    setMembersPage(1)
  }

  const uniqueRoles = Array.from(new Set(clubMembers.map((m) => m.role)))
  const {
    currentPage: membersPage,
    totalPages: membersPages,
    paginatedData: paginatedMembers,
    setCurrentPage: setMembersPage,
  } = usePagination({ data: filteredMembers, initialPageSize: 6 })

  // const handleToggleAttendance = (memberId: string) => {
  //   setAttendance((prev) => ({ ...prev, [memberId]: !prev[memberId] }))
  // }
  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    if (isReadOnly) return
    setAttendance((prev) => ({ ...prev, [memberId]: status }))
  }
  // const handleSaveAttendance = async () => {
  //   const attended = Object.entries(attendance)
  //     .filter(([_, present]) => present)
  //     .map(([id]) => id)
  //   // 🔥 Sau này bạn có thể gọi API ở đây, ví dụ:
  //   // await attendanceApi.saveAttendance({ clubId: managedClub.id, attendedMefmbers: attended })
  //   toast({
  //     title: "Attendance Saved",
  //     description: `${attended.length} members marked as present (${today}).`,
  //   })
  // }
  const handleSaveAttendance = async () => {
    if (isReadOnly) return
    // Tạo payload gửi đi
    const records = Object.entries(attendance).map(([memberId, status]) => ({
      memberId,
      status,
      note: notes[memberId] || "",
    }))

    // 🔥 Sau này bạn có thể gọi API ở đây, ví dụ:
    // await attendanceApi.saveAttendance({
    //   clubId: managedClub.id,
    //   date: selectedDate,
    //   records: records
    // })

    toast({
      title: "Attendance Saved",
      description: `Attendance for ${format(selectedDate, "PPP")} has been saved.`,
    })
  }

  // ✅ MỚI: Thống kê nhanh
  const stats = useMemo(() => {
    const total = filteredMembers.length
    let present = 0
    let absent = 0
    let late = 0
    let excused = 0
    filteredMembers.forEach((member) => {
      const status = attendance[member.id]
      switch (status) {
        case "present":
          present++
          break
        case "late":
          late++
          break
        case "excused":
          excused++
          break
        case "absent":
        default:
          absent++
          break
      }
    })
    return { total, present, absent, late, excused }
  }, [attendance, filteredMembers])

  // ✅ MỚI: Hành động hàng loạt
  const handleBulkAction = (status: "present" | "absent") => {
    if (isReadOnly) return
    const newAttendance = { ...attendance }
    filteredMembers.forEach((member) => {
      newAttendance[member.id] = status
    })
    setAttendance(newAttendance)
  }
  // ✅ MỚI: Xử lý lưu ghi chú
  const handleSaveNote = () => {
    if (isReadOnly || !editingNoteMember) return
    setNotes((prev) => ({ ...prev, [editingNoteMember.id]: currentNote }))
    setEditingNoteMember(null)
    setCurrentNote("")
  }
  const MinimalPager = ({ current, total, onPrev, onNext }: any) =>
    total > 1 ? (
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={onPrev}
          disabled={current === 1}
          className="text-sm border rounded-md px-2 py-1"
        >
          <ChevronLeft className="inline h-4 w-4" /> Prev
        </button>
        <span className="text-sm">
          Page {current} of {total}
        </span>
        <button
          onClick={onNext}
          disabled={current === total}
          className="text-sm border rounded-md px-2 py-1"
        >
          Next <ChevronRight className="inline h-4 w-4" />
        </button>
      </div>
    ) : null

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <Card>
              <CardContent className="py-12 text-center">
                <p>Loading club and members...</p>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="flex items-start justify-between mb-10">

          <div>
            <h1 className="text-3xl font-bold">Club Member Attendance</h1>
            {managedClub ? (
              <p className="text-muted-foreground">
                Members of "<span className="font-semibold text-primary">{managedClub.name}</span>"
              </p>
            ) : (
              <p className="text-destructive">
                Could not load club details. Please try again.
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-muted-foreground mr-5">Attendance Date</span>
            {/* ✅ MỚI: Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-norma mt-4",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* ✅ THÊM MỚI: Thanh tìm kiếm và bộ lọc */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Search by name or student code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setMembersPage(1)
                }}
                className="pl-4 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-1 h-5 w-5 p-0 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center">
                  {Object.values(activeFilters).filter((v) => v && v !== "all").length + (searchTerm ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4 p-6 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Advanced Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Role</label>
                  <Select
                    value={activeFilters["role"] || "all"}
                    onValueChange={(v) => handleFilterChange("role", v)}
                  >
                    <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 bg-white hover:border-slate-300 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {uniqueRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Staff Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Staff</label>
                  <Select
                    value={activeFilters["staff"] || "all"}
                    onValueChange={(v) => handleFilterChange("staff", v)}
                  >
                    <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 bg-white hover:border-slate-300 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Staff Only</SelectItem>
                      <SelectItem value="false">Non-Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ MỚI: Thống kê nhanh và Hành động hàng loạt */}
        {!membersLoading && filteredMembers.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold">Total: {stats.total}</span>
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Present: {stats.present}
                </span>
                <span className="text-orange-500 font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Late: {stats.late}
                </span>
                <span className="text-gray-500 font-medium flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Excused: {stats.excused}
                </span>
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> Absent: {stats.absent}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkAction("present")} disabled={isReadOnly}>
                  Mark All Present
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction("absent")} disabled={isReadOnly}>
                  Mark All Absent
                </Button>
              </div>
            </CardContent>
          </Card>
        )}


        <div className="space-y-6">
          {membersLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">Loading members...</h3>
              </CardContent>
            </Card>
          ) : membersError ? (
            <Card>
              <CardContent className="py-12 text-center text-destructive">
                {membersError}
              </CardContent>
            </Card>
          ) : clubMembers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No active members in your club.
              </CardContent>
            </Card>
          ) : (
            <>
              {paginatedMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div> */}
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={member.avatarUrl || ""}
                          alt={member.fullName}
                        />
                        <AvatarFallback>
                          {member.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="font-medium">{member.fullName}
                          <span className="text-muted-foreground text-sm ml-2">
                            ({member.studentCode})
                          </span>
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>

                    {/* ✅ MỚI: Select Trạng thái và Nút Ghi chú */}
                    <div className="flex items-center gap-2">
                      {/* Nút Ghi chú */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingNoteMember(member)
                          setCurrentNote(notes[member.id] || "")
                        }}
                        disabled={isReadOnly}
                        className={cn(
                          "relative text-muted-foreground hover:text-primary",
                          notes[member.id] && "text-blue-500 hover:text-blue-600",
                        )}
                      >
                        <MessageSquare className="h-5 w-5" />
                        {notes[member.id] && (
                          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </Button>

                      {/* Select Trạng thái */}
                      <Select
                        value={attendance[member.id] || "absent"}
                        onValueChange={(value: AttendanceStatus) => handleStatusChange(member.id, value)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-[120px]",
                            attendance[member.id] === "present" && "bg-green-100 text-green-800",
                            attendance[member.id] === "absent" && "bg-red-100 text-red-800",
                            attendance[member.id] === "late" && "bg-orange-100 text-orange-800",
                            attendance[member.id] === "excused" && "bg-gray-100 text-gray-800",
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">
                            <span className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" /> Present
                            </span>
                          </SelectItem>
                          <SelectItem value="late">
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-orange-500" /> Late
                            </span>
                          </SelectItem>
                          <SelectItem value="excused">
                            <span className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-gray-500" /> Excused
                            </span>
                          </SelectItem>
                          <SelectItem value="absent">
                            <span className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" /> Absent
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

              ))}

              <MinimalPager
                current={membersPage}
                total={membersPages}
                onPrev={() => setMembersPage(Math.max(1, membersPage - 1))}
                onNext={() => setMembersPage(Math.min(membersPages, membersPage + 1))}
              />

              {/* ✅ Nút lưu điểm danh */}
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveAttendance} className="flex items-center gap-2 mr-10 mb-5">
                  <CheckCircle className="h-4 w-4" />
                  Save Attendance
                </Button>
              </div>
            </>
          )}
        </div>
        {/* ✅ MỚI: Dialog để chỉnh sửa Ghi chú (chỉ 1 dialog, tái sử dụng) */}
        <Dialog
          open={!!editingNoteMember}
          onOpenChange={(open) => {
            if (!open) {
              setEditingNoteMember(null)
              setCurrentNote("")
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note for {editingNoteMember?.fullName}</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="E.g., Excused (sick), Late (traffic)..."
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              rows={4}
              disabled={isReadOnly}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveNote} disabled={isReadOnly}>
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppShell>
    </ProtectedRoute >
  )
}
