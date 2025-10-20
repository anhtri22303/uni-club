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
import { getClubIdFromToken } from "@/service/clubApi"
import { fetchUserById, fetchProfile } from "@/service/userApi"
import { Users, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useClub, useClubMembers } from "@/hooks/use-query-hooks"

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
  const [clubId, setClubId] = useState<number | null>(null)
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const today = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const [currentDate, setCurrentDate] = useState("")
  const [userId, setUserId] = useState<string | number | null>(null)

  // Get clubId from token on mount
  useEffect(() => {
    const id = getClubIdFromToken()
    setClubId(id)
  }, [])

  // Use React Query hooks
  const { data: managedClub, isLoading: loading } = useClub(clubId || 0, !!clubId)
  const { data: apiMembers = [], isLoading: membersLoading, error: membersError } = useClubMembers(clubId || 0, !!clubId)

  // Initialize attendance when members are loaded
  useEffect(() => {
    if (apiMembers.length > 0) {
      const initialAttendance: Record<string, boolean> = {}
      apiMembers.forEach((m: any) => {
        const id = m.membershipId ?? `m-${m.userId}`
        initialAttendance[id] = false
      })
      setAttendance(initialAttendance)
    }
  }, [apiMembers])

  // Set current date
  useEffect(() => {
    const today = new Date()
    const formatted = today.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    setCurrentDate(formatted)
  }, [])

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchProfile()
        console.log("Current user profile:", profile)
        setUserId((profile as any)?.userId)
      } catch (error) {
        console.error("Failed to load profile:", error)
      }
    }
    loadProfile()
  }, [])

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
      description: `${attended.length} members marked as present (${today}).`,
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
        <div className="flex items-start justify-between mb-10">

          <div>
            <h1 className="text-3xl font-bold">Club Member Attendance</h1>
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
          <div className="text-right">
            <span className="text-sm font-medium text-muted-foreground">Attendance Date</span>
            <div className="text-lg font-semibold text-primary">{currentDate}</div>
          </div>
        </div>

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
                {(membersError as any)?.message || "Error loading members"}
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
                    <Button
                      variant={attendance[member.id] ? "default" : "destructive"}
                      onClick={() => handleToggleAttendance(member.id)}
                      className="w-28"
                    >
                      {attendance[member.id] ? "Present" : "Absent"}
                    </Button>
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
    </ProtectedRoute >
  )
}
