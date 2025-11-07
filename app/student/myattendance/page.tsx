// app/student/attendance/page.tsx
"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePagination } from "@/hooks/use-pagination"
import { useState, useEffect, useMemo } from "react" // <-- Thêm useMemo
import { Layers, History, Clock } from "lucide-react"
import { safeSessionStorage } from "@/lib/browser-utils"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useClubs, useClubMembers, useMemberAttendanceHistory } from "@/hooks/use-query-hooks"
// import { TimeObject } from "@/service/attendanceApi" // Import kiểu TimeObject nếu nó được export

// SAO CHÉP HELPER timeObjectToString
const timeObjectToString = (timeObj: any): string => {
  if (!timeObj) return "N/A";
  if (typeof timeObj === 'string') return timeObj;
  const hour = String(timeObj.hour).padStart(2, '0');
  const minute = String(timeObj.minute).padStart(2, '0');
  return `${hour}:${minute}`;
};

// Tạo badge dựa trên trạng thái điểm danh
const AttendanceStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "PRESENT":
      return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-500 font-semibold">PRESENT</Badge>
    case "LATE":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-500 font-semibold">LATE</Badge>
    case "ABSENT":
      return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-500 font-semibold">ABSENT</Badge>
    case "EXCUSED":
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-500 font-semibold">EXCUSED</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

// Kiểu dữ liệu đơn giản cho CLB (từ hook useClubs)
interface SimpleClub {
  id: number;
  name: string;
}

interface AttendanceRecord {
  date: string;
  note: string | null;
  clubName: string;
  status: string;
  // (Thêm các thuộc tính khác nếu có)
}

interface MemberHistoryResponse {
  success: boolean;
  message: string;
  data: {
    clubName: string;
    membershipId: number;
    attendanceHistory: AttendanceRecord[];
  };
}

export default function MemberAttendancePage() {
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null)
  const [userClubIds, setUserClubIds] = useState<number[]>([])
  const [userClubsDetails, setUserClubsDetails] = useState<SimpleClub[]>([])
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)

  const { toast } = useToast()

  // LẤY DỮ LIỆU TỪ SESSIONSTORAGE (userId VÀ clubIds)
  useEffect(() => {
    try {
      const saved = safeSessionStorage.getItem("uniclub-auth")
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log("Attendance page - Parsed sessionStorage data:", parsed)

        // Lấy userId của người dùng
        // const userId = parsed.user?.id
        const userId = parsed.userId
        if (userId) {
          setLoggedInUserId(Number(userId))
        } else {
          console.error("Không tìm thấy user.id trong sessionStorage!")
          toast({
            title: "Lỗi",
            description: "Không thể xác định người dùng. Vui lòng đăng nhập lại.",
            variant: "destructive"
          })
        }

        // Lấy clubIds
        let clubIdNumbers: number[] = []
        if (parsed.clubIds && Array.isArray(parsed.clubIds)) {
          clubIdNumbers = parsed.clubIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
        } else if (parsed.clubId) {
          clubIdNumbers = [Number(parsed.clubId)]
        }

        setUserClubIds(clubIdNumbers)

      }
    } catch (error) {
      console.error("Failed to get data from sessionStorage:", error)
    }
  }, [toast])

  // GỌI useClubs() ĐỂ LẤY TÊN CLB CHO DROPDOWN
  const { data: allClubsData = [], isLoading: isLoadingClubs } = useClubs()

  // XỬ LÝ DROPDOWN KHI CÓ DỮ LIỆU
  useEffect(() => {
    if (userClubIds.length > 0 && allClubsData.length > 0) {
      // Lọc danh sách 'all clubs' để chỉ lấy những club mà user tham gia
      const details = userClubIds
        .map((id) => allClubsData.find((club: any) => club.id === id))
        .filter(Boolean) as SimpleClub[] // Loại bỏ (filter out) bất kỳ club nào không tìm thấy

      setUserClubsDetails(details)

      // Tự động chọn club đầu tiên làm default
      if (details.length > 0 && selectedClubId === null) {
        setSelectedClubId(details[0].id)
      }
    }
  }, [userClubIds, allClubsData, selectedClubId])

  // LOGIC TRUNG TÂM: QUERY CHỒNG
  //    Query 1: Lấy danh sách members của CLB đã chọn
  const {
    data: apiMembers = [],
    isLoading: isLoadingMembers,
    error: membersError
  } = useClubMembers(
    selectedClubId ?? 0,
    !!selectedClubId // Chỉ chạy khi selectedClubId có giá trị
  );

  //    Xử lý: Tìm 'membershipId' của BẠN từ danh sách members
  const foundMembershipId = useMemo(() => {
    if (!apiMembers || apiMembers.length === 0 || !loggedInUserId) {
      return null
    }
    // Tìm bản ghi member khớp với userId đang đăng nhập
    const self = apiMembers.find(m => m.userId === loggedInUserId)
    if (self) {
      console.log(`Tìm thấy membershipId: ${self.membershipId} cho userId: ${loggedInUserId}`)
      return self.membershipId
    }
    console.warn(`Không tìm thấy member với userId: ${loggedInUserId} trong CLB ${selectedClubId}`)
    return null
  }, [apiMembers, loggedInUserId, selectedClubId])

  //    Query 2: Lấy lịch sử điểm danh (chỉ chạy khi đã tìm thấy 'foundMembershipId')
  const {
    data: rawHistoryResponse,
    isLoading: isLoadingHistory
  } = useMemberAttendanceHistory(foundMembershipId)

  // LỌC DỮ LIỆU (SEARCH TERM)
  const filteredHistory = useMemo(() => {
    // Chỉ cần trả về dữ liệu, hoặc mảng rỗng nếu chưa có
    return rawHistoryResponse?.data?.attendanceHistory || []
  }, [rawHistoryResponse])

  // PHÂN TRANG
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedHistory,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: filteredHistory,
    initialPageSize: 10,
  })

  // TÍNH TOÁN TRẠNG THÁI LOADING TỔNG
  // Loading khi: Đang tải clubs, HOẶC đang tải members, HOẶC đang tải history
  const isLoading = isLoadingClubs || isLoadingMembers || isLoadingHistory;

  // RENDER JSX
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="space-y-6">
          {/* --- Header --- */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Attendance History</h1>
              <p className="text-muted-foreground">
                View your personal attendance record for each club
              </p>
            </div>
          </div>

          {/* --- Filters --- */}
          <div className="flex flex-wrap gap-4">
            {/* Dropdown chọn Club */}
            {userClubsDetails.length > 0 ? (
              <Select
                value={selectedClubId ? String(selectedClubId) : ""}
                onValueChange={(value) => {
                  setSelectedClubId(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[240px]">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a club" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {userClubsDetails.map((club) => (
                    <SelectItem
                      key={club.id}
                      value={String(club.id)}
                    >
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              // Skeleton cho dropdown
              <Skeleton className="h-10 w-full sm:w-[240px]" />
            )}
          </div>

          {/* --- Content List --- */}
          <div className="space-y-4">
            {isLoading && paginatedHistory.length === 0 ? (
              // Trạng thái loading (khi đang fetch và chưa có data)
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ) : membersError ? (
              // Báo lỗi nếu không tải được member (ví dụ: student không có quyền)
              <div className="col-span-full text-center py-12">
                <History className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-red-700">Error loading members</h3>
                <p className="text-muted-foreground">
                  {(membersError as Error)?.message || "You may not have permission to view members of this club."}
                </p>
              </div>
            ) : userClubIds.length === 0 ? (
              // Trường hợp không ở CLB nào
              <div className="col-span-full text-center py-12">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No club membership found</h3>
                <p className="text-muted-foreground">
                  Your attendance history will appear here once you join a club.
                </p>
              </div>
            ) : paginatedHistory.length === 0 ? (
              // Trường hợp không có data
              <div className="col-span-full text-center py-12">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No attendance records found</h3>
                <p className="text-muted-foreground">
                  "There are no attendance records for this club yet."
                </p>
              </div>
            ) : (
              // Render danh sách
              paginatedHistory.map((record: any) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>

                        <CardTitle className="text-lg">
                          {record.date ? new Date(record.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }) : "Unknown Date"}
                        </CardTitle>
                        {/* Hiển thị 'record.clubName' thay vì thời gian N/A */}
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Layers className="h-4 w-4" />
                          {record.clubName || "Unknown Club"}
                        </CardDescription>
                      </div>
                      <div className="flex-shrink-0 mt-2 sm:mt-0">
                        <AttendanceStatusBadge status={record.status} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* {record.session?.note && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Session Note: </span>
                        {record.session.note}
                      </p>
                    )} */}
                    {/* Đọc từ 'record.note' */}
                    {/* {record.note && (
                      <p className="text-sm">
                        <span className="font-semibold">Note: </span>
                        {record.note}
                      </p>
                    )} */}
                    {/* Thêm dòng này nếu không có ghi chú */}
                    {/* {!record.note && (
                      <p className="text-sm text-muted-foreground italic">
                        No note for this session.
                      </p>
                    )} */}
                    {/* Đọc từ 'record.note' */}
                    {record.note ? ( // Kiểm tra nếu 'record.note' có giá trị (không null hoặc rỗng)
                      <p className="text-sm">
                        <span className="font-semibold">Note: </span>
                        {record.note}
                      </p>
                    ) : (
                      // Thêm dòng này nếu không có ghi chú (note là null hoặc rỗng)
                      <p className="text-sm text-muted-foreground italic">
                        No note for this attendance.
                      </p>
                    )}

                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* --- Pagination --- */}
          {paginatedHistory.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
              pageSizeOptions={[5, 10, 20]}
            />
          )}

        </div>
      </AppShell>
    </ProtectedRoute>
  )
}