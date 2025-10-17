"use client"

import { useState, useEffect } from "react"
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
import { fetchUserById } from "@/service/userApi"
import { Users, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"

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

export default function ClubAttendancePage() {
  const { toast } = useToast()
  const [managedClub, setManagedClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiMembers, setApiMembers] = useState<ApiMembership[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [attendance, setAttendance] = useState<Record<string, boolean>>({}) // ✅ trạng thái điểm danh

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const clubId = getClubIdFromToken()
        if (!clubId) throw new Error("Không tìm thấy thông tin câu lạc bộ.")

        const clubResponse = (await getClubById(clubId)) as ClubApiResponse
        if (!clubResponse?.success) throw new Error("Không thể tải thông tin câu lạc bộ.")
        setManagedClub(clubResponse.data)

        setMembersLoading(true)
        setMembersError(null)

        const memberData = await membershipApi.getMembersByClubId(clubId)
        const membersWithUserData = await Promise.all(
          memberData.map(async (m: any) => {
            try {
              const userInfo = await fetchUserById(m.userId)
              return { ...m, userInfo }
            } catch {
              return { ...m, userInfo: null }
            }
          })
        )

        setApiMembers(membersWithUserData)

        // ✅ Khởi tạo attendance = false cho toàn bộ thành viên
        const initialAttendance: Record<string, boolean> = {}
        membersWithUserData.forEach((m: any) => {
          const id = m.membershipId ?? `m-${m.userId}`
          initialAttendance[id] = false
        })
        setAttendance(initialAttendance)
      } catch (err: any) {
        setMembersError(err?.message || "Lỗi tải danh sách thành viên")
      } finally {
        setMembersLoading(false)
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Lọc thành viên active
  const clubMembers = managedClub
    ? apiMembers
        .filter((m: any) => String(m.clubId) === String(managedClub.id) && m.state === "ACTIVE")
        .map((m: any) => {
          const u = m.userInfo || {}
          return {
            id: m.membershipId ?? `m-${m.userId}`,
            fullName: u.fullName ?? m.fullName ?? `User ${m.userId}`,
            role: m.clubRole ?? "MEMBER",
          }
        })
    : []

  const {
    currentPage: membersPage,
    totalPages: membersPages,
    paginatedData: paginatedMembers,
    setCurrentPage: setMembersPage,
  } = usePagination({ data: clubMembers, initialPageSize: 6 })

  const handleToggleAttendance = (memberId: string) => {
    setAttendance((prev) => ({ ...prev, [memberId]: !prev[memberId] }))
  }

  const handleSaveAttendance = async () => {
    const attended = Object.entries(attendance)
      .filter(([_, present]) => present)
      .map(([id]) => id)

    // 🔥 Sau này bạn có thể gọi API ở đây, ví dụ:
    // await attendanceApi.saveAttendance({ clubId: managedClub.id, attendedMembers: attended })

    toast({
      title: "Attendance Saved",
      description: `${attended.length} members marked as present.`,
    })
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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Attendance</h1>
            {managedClub ? (
              <p className="text-muted-foreground">
                Members of "{managedClub.name}"
              </p>
            ) : (
              <p className="text-destructive">
                Could not load club details. Please try again.
              </p>
            )}
          </div>

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
                      <input
                        type="checkbox"
                        checked={attendance[member.id] || false}
                        onChange={() => handleToggleAttendance(member.id)}
                        className="w-5 h-5 accent-green-500 cursor-pointer"
                      />
                      <span className="font-medium">{member.fullName}</span>
                    </div>
                    <Badge variant="secondary">{member.role}</Badge>
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
                <Button onClick={handleSaveAttendance} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Save Attendance
                </Button>
              </div>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
