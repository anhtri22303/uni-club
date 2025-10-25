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
import { fetchUserById, fetchProfile } from "@/service/userApi"
import { Users, ChevronLeft, ChevronRight, CheckCircle, Filter, X } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const today = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const [currentDate, setCurrentDate] = useState("")
  const [userId, setUserId] = useState<string | number | null>(null)
  // State search và filter
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const clubId = getClubIdFromToken()
        if (!clubId) throw new Error("No club information found.")

        const clubResponse = (await getClubById(clubId)) as ClubApiResponse
        if (!clubResponse?.success) throw new Error("Unable to load club information.")
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
        setMembersError(err?.message || "Error loading member list")
      } finally {
        setMembersLoading(false)
        setLoading(false)
      }
    }
    const today = new Date()
    const formatted = today.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    const loadProfile = async () => {
      try {
        const profile = await fetchProfile()
        console.log("Current user profile:", profile)
        setUserId((profile as any)?.userId) // Lưu userId
      } catch (error) {
        console.error("Failed to load profile:", error)
      }
    }

    setCurrentDate(formatted)
    loadInitialData()
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

  const handleToggleAttendance = (memberId: string) => {
    setAttendance((prev) => ({ ...prev, [memberId]: !prev[memberId] }))
  }

  const handleSaveAttendance = async () => {
    const attended = Object.entries(attendance)
      .filter(([_, present]) => present)
      .map(([id]) => id)
    // 🔥 Sau này bạn có thể gọi API ở đây, ví dụ:
    // await attendanceApi.saveAttendance({ clubId: managedClub.id, attendedMefmbers: attended })
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
                Members of "<span className="font-semibold text-primary">{managedClub.name}</span>"
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
