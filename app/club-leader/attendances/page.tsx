"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
  MessageSquare, XCircle, Clock, AlertCircle, Info,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  fetchTodayClubAttendance, fetchClubAttendanceHistory, type AttendanceStatus as ApiAttendanceStatus, createClubAttendanceSession,
  CreateSessionBody, markAttendanceBulk, type MarkBulkBody, type MarkBulkRecord,
} from "@/service/attendanceApi"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// type AttendanceStatus = "present" | "absent" | "late" | "excused"
type PageAttendanceStatus = "present" | "absent" | "late" | "excused"
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
  id: number
  fullName: string
  studentCode: string
  avatarUrl: string | null
  role: string
  isStaff: boolean
}

interface AttendanceResponse {
  sessionId: number
  date?: string
  isLocked?: boolean
  records: {
    memberId: number
    status: ApiAttendanceStatus // "PRESENT", "LATE", ...
    note: string | null
    studentCode: string | null
    fullName: string
  }[]
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null) // State mới để lưu sessionId
  const [sessionError, setSessionError] = useState<string | null>(null) // State mới cho lỗi session
  const [isSaving, setIsSaving] = useState(false);
  const [attendance, setAttendance] = useState<Record<number, PageAttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [editingNoteMember, setEditingNoteMember] = useState<Member | null>(null)
  const [currentNote, setCurrentNote] = useState("")
  // Track last member whose note was edited
  const [lastEditedNoteMemberId, setLastEditedNoteMemberId] = useState<number | null>(null)
  // State search và filter
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)
  // useEffect này chỉ chạy 1 lần để lấy thông tin cơ bản
  useEffect(() => {
    const loadBaseData = async () => {
      setLoading(true)
      try {
        const profile = (await fetchProfile()) as any // Thêm (as any)
        // THÊM DÒNG DEBUG NÀY ĐỂ KIỂM TRA
        // Lấy userId chính xác từ profile.id
        const currentUserId = profile?.id;

        if (!currentUserId) {
          console.error("Failed to extract userId from profile!");
        }
        setUserId(currentUserId); // Set userId = 54 (ví dụ)

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
  // useEffect này chạy mỗi khi clubId hoặc selectedDate thay đổi
  useEffect(() => {
    if (!managedClub?.id) return;

    const today = new Date();
    const isToday =
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();

    setIsReadOnly(!isToday);

    const loadMembersAndAttendance = async () => {
      setMembersLoading(true);
      setMembersError(null);
      setSessionError(null);
      setSessionId(null);

      // Hàm trợ giúp: Lấy thành viên
      const getMembers = async (): Promise<ApiMembership[]> => {
        if (apiMembers.length > 0) return apiMembers;
        const membersData = await membershipApi.getMembersByClubId(managedClub.id);
        setApiMembers(membersData);
        return membersData;
      };

      // Hàm trợ giúp: Set state (Hàm này đã ĐÚNG, không cần sửa)
      const setAttendanceStates = (
        data: AttendanceResponse | null,
        members: ApiMembership[],
      ) => {
        const initialAttendance: Record<number, PageAttendanceStatus> = {};
        const initialNotes: Record<number, string> = {};

        if (data && data.sessionId) { // <-- Kiểm tra này là đúng
          setSessionId(data.sessionId); // <-- Sẽ nhận được số 24

          if (data.records && data.records.length > 0) {
            data.records.forEach((record) => {
              const status = (record.status?.toLowerCase() || "absent") as PageAttendanceStatus;
              initialAttendance[record.memberId] = status;
              initialNotes[record.memberId] = record.note || "";
            });
          }

          members.forEach((m: any) => {
            const memberUiId = m.membershipId;
            if (memberUiId && !initialAttendance[memberUiId]) {
              initialAttendance[memberUiId] = "absent";
              initialNotes[memberUiId] = "";
            }
          });
        }
        setAttendance(initialAttendance);
        setNotes(initialNotes);
      };

      // --- BẮT ĐẦU LOGIC CHÍNH (ĐÃ SỬA LỖI UNWRAP) ---
      try {
        const members = await getMembers();

        // *** THAY ĐỔI QUAN TRỌNG: 
        // Interface AttendanceResponse là đối tượng BÊN TRONG { data: ... }
        // apiResponse là đối tượng BÊN NGOÀI { success, message, data }
        let attendanceData: AttendanceResponse | null = null;
        let apiResponse: any = null; // Biến để giữ wrapper { success, data }

        const formattedDate = format(selectedDate, "yyyy-MM-dd");

        if (isToday) {
          // --- LOGIC MỚI CHO NGÀY HÔM NAY ---
          try {
            // Bước 1: Thử fetch /today
            apiResponse = (await fetchTodayClubAttendance(managedClub.id)) as any;
            attendanceData = apiResponse.data; // <-- SỬA LỖI: Mở gói .data

            // Bước 2: Nếu /today không trả về data, thử create
            if (!attendanceData || !attendanceData.sessionId) {
              console.warn("/today returned empty. Attempting to /create-session...");

              const now = new Date();
              const newSessionBody: CreateSessionBody = {
                date: formattedDate,
                startTime: format(now, "HH:mm"),
                endTime: format(new Date(now.getTime() + 60 * 60 * 1000), "HH:mm"),
                note: "Auto-created session by frontend (string time)",
              };

              try {
                // Bước 2a: Thử TẠO MỚI
                apiResponse = (await createClubAttendanceSession(
                  managedClub.id,
                  newSessionBody,
                )) as any;
                attendanceData = apiResponse.data; // <-- SỬA LỖI: Mở gói .data

                toast({
                  title: "New Session Created",
                  description: "An attendance session for today has been started.",
                });

              } catch (createErr: any) {
                // Bước 2b: Xử lý lỗi TẠO MỚI
                const errorMsg = createErr?.response?.data?.error || "Unknown creation error";
                console.error("create-session failed:", errorMsg);

                if (errorMsg.toLowerCase().includes("already exists")) {
                  console.warn("Creation failed (400) because session exists. Attempting to fetch via /history...");

                  // Bước 3: Dùng /history
                  apiResponse = (await fetchClubAttendanceHistory({
                    clubId: managedClub.id,
                    date: formattedDate,
                  })) as any;
                  attendanceData = apiResponse.data; // <-- SỬA LỖI: Mở gói .data


                } else {
                  throw createErr;
                }
              }
            }
          } catch (err: any) {
            console.error("Failed to fetch or create session:", err);
            const error = err?.response?.data?.error || err?.message || "An error occurred.";
            setSessionError(`Backend Error: ${error}`);
          }
        } else {
          // --- LOGIC CHO NGÀY QUÁ KHỨ ---
          try {
            apiResponse = (await fetchClubAttendanceHistory({
              clubId: managedClub.id,
              date: formattedDate,
            })) as any;
            attendanceData = apiResponse.data; // <-- SỬA LỖI: Mở gói .data
          } catch (historyErr: any) {
            console.error("Failed to fetch attendance history:", historyErr);
            setSessionError("No attendance records found for this date.");
          }
        }

        // *** ĐÃ SỬA ***
        // Bây giờ `attendanceData` là đối tượng bên trong (vd: { sessionId: 24, ... })
        // thay vì đối tượng bên ngoài (vd: { success: true, data: { ... } })
        setAttendanceStates(attendanceData, members);

      } catch (err: any) {
        setMembersError(err?.message || "Error loading member list");
      } finally {
        setMembersLoading(false);
      }
    };

    loadMembersAndAttendance();
  }, [managedClub, selectedDate]);

  // Lọc thành viên active
  const clubMembers = useMemo(
    () =>
      managedClub
        ? apiMembers
          //  Lọc member có membershipId
          .filter(
            (m: any) =>
              m.membershipId &&
              String(m.clubId) === String(managedClub.id) &&
              m.state === "ACTIVE"
            // && m.userId !== userId,
          )
          .map((m: any) => {
            return {
              id: m.membershipId, // Dùng membershipId làm ID
              fullName: m.fullName ?? m.fullName ?? `User ${m.userId}`,
              studentCode: m.studentCode ?? "—",
              avatarUrl: m.avatarUrl ?? null,
              role: m.clubRole ?? "MEMBER",
              isStaff: m.staff ?? false,
            }
          })
        : [],
    [managedClub, apiMembers, userId],
  )
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

  useEffect(() => {
    // Chúng ta cần 3 điều kiện:
    // 1. Phải có `userId` (đã login, vd: 54)
    // 2. Phải có `apiMembers` (đã tải danh sách member)
    // 3. Phải có `attendance` (đã tải danh sách điểm danh)
    if (!userId || apiMembers.length === 0 || Object.keys(attendance).length === 0) {
      return; // Nếu chưa có đủ dữ liệu, không làm gì cả
    }

    // 1. Tìm thông tin membership của leader trong `apiMembers`
    //    (Chúng ta cần `membershipId` từ `userId`)
    const leaderMembership: ApiMembership | undefined = apiMembers.find(
      (m: any) => String(m.userId) === String(userId)
    );

    // 2. Nếu tìm thấy thông tin leader...
    if (leaderMembership && leaderMembership.membershipId) {
      const leaderMembershipId = leaderMembership.membershipId; // vd: 44

      // 3. Lấy trạng thái của leader từ state `attendance`
      const leaderStatus = attendance[leaderMembershipId];

      // 4. Nếu trạng thái là 'absent' (hoặc chưa được set)
      if (leaderStatus === "absent" || !leaderStatus) {
        // 5. Hiển thị thông báo!
        toast({
          title: "Attendance Reminder 🔔",
          description: "You are currently marked as 'Absent'. Please update your own status if this is incorrect.",
          duration: 3000,
          className: "bg-yellow-50 border-yellow-300 text-yellow-800"
        });
      }
    }
    // Chúng ta thêm `toast` vào dependency vì nó là 1 hook
  }, [userId, apiMembers, attendance, toast]);

  const handleStatusChange = (memberId: number, status: PageAttendanceStatus) => {
    if (isReadOnly) return;
    setAttendance((prev) => ({ ...prev, [memberId]: status }));
  };

  // Thống kê nhanh
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

  // Tắt auto-save
  const handleBulkAction = (status: "present" | "absent") => {
    if (isReadOnly) return;
    const newAttendance = { ...attendance };
    filteredMembers.forEach((member) => {
      newAttendance[member.id] = status;
    });
    setAttendance(newAttendance);
  };

  //  Tắt auto-save
  const handleSaveNote = () => {
    if (isReadOnly || !editingNoteMember) return;

    const memberId = editingNoteMember.id;
    // Cập nhật state local
    setNotes((prev) => ({ ...prev, [memberId]: currentNote }));

    // Đánh dấu member vừa chỉnh note
    setLastEditedNoteMemberId(memberId);

    // Đóng dialog
    setEditingNoteMember(null);
    setCurrentNote("");
  };

  // Hàm Save thủ công (phiên bản MỚI, hiệu quả cao)
  const handleSaveAttendance = async () => {
    if (isReadOnly || !sessionId || isSaving) return;

    setIsSaving(true);
    toast({ title: "Saving attendance...", description: "Please wait..." });

    // 1. Gom tất cả dữ liệu từ state thành mảng
    // (Lưu tất cả thành viên, không chỉ thành viên đã lọc)
    const recordsToSave: MarkBulkRecord[] = clubMembers.map(member => {
      const memberId = member.id;
      const status = (attendance[memberId] || "absent") as PageAttendanceStatus;
      const note = notes[memberId] || "";

      return {
        membershipId: memberId,
        status: status.toUpperCase() as ApiAttendanceStatus, // Chuyển sang UPPERCASE
        note: note,
      };
    });

    // 2. Chuẩn bị body cho API
    const requestBody: MarkBulkBody = {
      records: recordsToSave
    };

    try {
      // 3. Gọi API .../mark-bulk MỘT LẦN DUY NHẤT
      await markAttendanceBulk(sessionId, requestBody);

      toast({
        title: "Attendance Saved!",
        description: `All ${recordsToSave.length} records have been saved successfully.`,
      });
    } catch (err) {
      console.error("Failed to save bulk attendance:", err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save attendance. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const MinimalPager = ({ current, total, onPrev, onNext }: any) =>
    total > 1 ? (
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={onPrev}
          disabled={current === 1}
          className="text-sm border rounded-md px-2 py-1 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:hover:bg-slate-700 
          disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="inline h-4 w-4" /> Prev
        </button>
        <span className="text-sm dark:text-white">
          Page {current} of {total}
        </span>
        <button
          onClick={onNext}
          disabled={current === total}
          className="text-sm border rounded-md px-2 py-1 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:hover:bg-slate-700 
          disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h1 className="text-3xl font-bold dark:text-white">Club Member Attendance</h1>
            {managedClub ? (
              <p className="text-muted-foreground dark:text-slate-400">
                Members of "<span className="font-semibold text-primary dark:text-blue-400">{managedClub.name}</span>"
              </p>
            ) : (
              <p className="text-destructive dark:text-red-400">
                Could not load club details. Please try again.
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-muted-foreground dark:text-slate-400 mr-5">Attendance Date</span>
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-norma mt-4 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:hover:bg-slate-700",
                    !selectedDate && "text-muted-foreground dark:text-slate-400",
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
                  disabled={(date) => date > new Date()} // Không cho chọn ngày tương lai
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative w-full max-w-sm">
              <Input
                placeholder="Search by name or student code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setMembersPage(1)
                }}
                // pr-4 -> pr-10 để chừa chỗ cho nút X
                className="pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white 
                dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
              />

              {/* Nút Clear Search */}
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchTerm("")
                    setMembersPage(1) // Reset về trang 1 khi xóa tìm kiếm
                  }}
                  // Style: Tròn, nằm bên phải, hover chuyển màu Primary
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-400 hover:bg-primary 
                  hover:text-primary-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 
              dark:bg-slate-800 dark:text-white transition-colors bg-white hover:text-black"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-1 h-5 w-5 p-0 text-xs bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full 
                flex items-center justify-center">
                  {Object.values(activeFilters).filter((v) => v && v !== "all").length + (searchTerm ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4 p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-br from-slate-50 to-white 
            dark:from-slate-800 dark:to-slate-900">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Advanced Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 
                    dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Role</label>
                  <Select
                    value={activeFilters["role"] || "all"}
                    onValueChange={(v) => handleFilterChange("role", v)}
                  >
                    <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white 
                    hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Staff</label>
                  <Select
                    value={activeFilters["staff"] || "all"}
                    onValueChange={(v) => handleFilterChange("staff", v)}
                  >
                    <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white 
                    hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
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

        {/* Thêm cảnh báo nếu không có sessionId hoặc readonly */}
        {isReadOnly && (
          <Alert variant="default" className="mb-4 bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700">
            <Info className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            <AlertTitle className="text-gray-900 dark:text-white">Read-Only Mode</AlertTitle>
            <AlertDescription className="text-gray-700 dark:text-gray-300">
              You are viewing attendance for a past date. Changes cannot be made.
            </AlertDescription>
          </Alert>
        )}
        {sessionError && (
          <Alert variant="destructive" className="mb-4 dark:bg-red-900/30 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="dark:text-red-200">Session Error</AlertTitle>
            <AlertDescription className="dark:text-red-300">{sessionError}</AlertDescription>
          </Alert>
        )}
        {!isReadOnly && sessionId && (
          <Alert variant="default" className="mb-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            <AlertTitle className="text-blue-900 dark:text-blue-200">Session is Ready</AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              Session (ID: {sessionId}) is active. Changes must be saved manually using the "Save" button.
            </AlertDescription>
          </Alert>
        )}

        {/* Thống kê nhanh và Hành động hàng loạt */}
        {!membersLoading && filteredMembers.length > 0 && (
          <Card className="mb-4 dark:bg-slate-800/90 dark:border-slate-700">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold dark:text-white">Total: {stats.total}</span>
                <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Present: {stats.present}
                </span>
                <span className="text-orange-500 dark:text-orange-400 font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Late: {stats.late}
                </span>
                <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Excused: {stats.excused}
                </span>
                <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> Absent: {stats.absent}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("present")}
                  disabled={isReadOnly || !sessionId}
                  className="dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                >
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("absent")}
                  disabled={isReadOnly || !sessionId}
                  className="dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                >
                  Mark All Absent
                </Button>
              </div>
            </CardContent>
          </Card>
        )}


        <div className="space-y-6">
          {membersLoading ? (
            <Card className="dark:bg-slate-800/90 dark:border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground dark:text-slate-400 mb-3" />
                <h3 className="text-lg font-semibold mb-2 dark:text-white">Loading members...</h3>
              </CardContent>
            </Card>
          ) : membersError ? (
            <Card className="dark:bg-slate-800/90 dark:border-slate-700">
              <CardContent className="py-12 text-center text-destructive dark:text-red-400">
                {membersError}
              </CardContent>
            </Card>
          ) : clubMembers.length === 0 ? (
            <Card className="dark:bg-slate-800/90 dark:border-slate-700">
              <CardContent className="py-12 text-center text-muted-foreground dark:text-slate-400">
                No active members in your club.
              </CardContent>
            </Card>
          ) : (
            <>
              {paginatedMembers.map((member) => (
                <Card key={member.id} className="dark:bg-slate-800/90 dark:border-slate-700">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={member.avatarUrl || ""}
                          alt={member.fullName}
                        />
                        <AvatarFallback className="dark:bg-slate-700 dark:text-white">
                          {member.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="font-medium dark:text-white">{member.fullName}
                          <span className="text-muted-foreground dark:text-slate-400 text-sm ml-2">
                            ({member.studentCode})
                          </span>
                        </p>
                        {/* Colored badge by role */}
                        {(() => {
                          let badgeClass = "text-xs px-2 py-0.5 font-semibold border ";
                          if (member.role === "LEADER") {
                            badgeClass += "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700";
                          } else if (member.role === "VICE_LEADER" || member.role === "VICE LEADER") {
                            badgeClass += "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700";
                          } else {
                            badgeClass += "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700";
                          }
                          return (
                            <Badge className={badgeClass}>
                              {member.role.replace(/_/g, ' ')}
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Select Trạng thái và Nút Ghi chú */}
                    <div className="flex flex-col items-end gap-1 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        {/* Nút Ghi chú */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingNoteMember(member)
                            setCurrentNote(notes[member.id] || "")
                          }}
                          disabled={isReadOnly || !sessionId}
                          className={cn(
                            "relative text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400",
                            notes[member.id] && "text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300",
                          )}
                        >
                          <MessageSquare className="h-5 w-5" />
                          {notes[member.id] && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                          )}
                        </Button>

                        {/* Select Trạng thái */}
                        <Select
                          value={attendance[member.id] || "absent"}
                          onValueChange={(value: PageAttendanceStatus) => handleStatusChange(member.id, value)}
                          disabled={isReadOnly || !sessionId}
                        >
                          <SelectTrigger
                            className={cn(
                              "w-[130px] dark:bg-slate-700 dark:text-white dark:border-slate-600",
                              attendance[member.id] === "present" && 
                              "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700",
                              attendance[member.id] === "absent" && 
                              "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700",
                              attendance[member.id] === "late" && 
                              "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700",
                              attendance[member.id] === "excused" && 
                              "bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
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
                      {/* Inline note prompt */}
                      {!isReadOnly && sessionId && (
                        <div className="min-h-[18px]">
                          {(!notes[member.id] || notes[member.id].trim() === "") && lastEditedNoteMemberId !== member.id && (
                            <span className="text-xs text-blue-600 dark:text-blue-300">No note yet. Would you like to add a note for this member?</span>
                          )}
                          {lastEditedNoteMemberId === member.id && notes[member.id] && notes[member.id].trim() !== "" && (
                            <span className="text-xs text-green-600 dark:text-green-300">Note added. Don't forget to click "Save Attendance" to save!</span>
                          )}
                        </div>
                      )}
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

              {/* Nút lưu điểm danh */}
              {/* Kích hoạt Nút lưu điểm danh thủ công */}
              {!isReadOnly && sessionId && (
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleSaveAttendance}
                    disabled={isSaving || !sessionId} // Disable khi đang lưu hoặc không có session
                    className="flex items-center gap-2 mr-10 mb-5 w-[180px] bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 
                    dark:hover:bg-green-700" // Thêm độ rộng cố định
                  >
                    {isSaving ? (
                      // Thêm icon spinner đơn giản
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {isSaving ? "Saving..." : "Save Attendance"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        {/* Dialog để chỉnh sửa Ghi chú (chỉ 1 dialog, tái sử dụng) */}
        <Dialog
          open={!!editingNoteMember}
          onOpenChange={(open) => {
            if (!open) {
              setEditingNoteMember(null)
              setCurrentNote("")
            }
          }}
        >
          <DialogContent className="dark:bg-slate-900 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Add Note for {editingNoteMember?.fullName}</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="E.g., Excused (sick), Late (traffic)..."
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              rows={4}
              disabled={isReadOnly || !sessionId} // Disable
              className="dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:placeholder:text-slate-400"
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveNote} disabled={isReadOnly} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppShell>
    </ProtectedRoute >
  )
}
