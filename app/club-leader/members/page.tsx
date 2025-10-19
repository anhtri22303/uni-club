"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/contexts/data-context"
import membershipApi, { type ApiMembership } from "@/service/membershipApi"
import { getClubById, getClubIdFromToken } from "@/service/clubApi"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import {
  Users,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  GraduationCap,
  Calendar,
  UserCircle,
  Filter,
  X,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Define a type for the club (có thể đặt trong một file dùng chung)
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

export default function ClubLeaderMembersPage() {
  const { clubMemberships } = useData()
  const { toast } = useToast()
  // State để lưu thông tin club và quản lý loading
  const [managedClub, setManagedClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiMembers, setApiMembers] = useState<ApiMembership[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)

  // useEffect để lấy thông tin club và thành viên
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        // 1. Lấy clubId từ token
        const clubId = getClubIdFromToken()
        if (!clubId) {
          throw new Error("Không tìm thấy thông tin câu lạc bộ của bạn.")
        }
        // 2. Lấy thông tin chi tiết của club
        const clubResponse = (await getClubById(clubId)) as ClubApiResponse
        if (clubResponse && clubResponse.success) {
          setManagedClub(clubResponse.data)
          // 3. Sau khi có club, tải danh sách thành viên
          setMembersLoading(true)
          setMembersError(null)
          // try {
          //   // Gọi đúng API để lấy danh sách member theo clubId
          //   const memberData = await membershipApi.getMembersByClubId(clubId)
          //   // Dùng Promise.all để fetch chi tiết từng user
          //   const membersWithUserData = await Promise.all(
          //     memberData.map(async (m: any) => {
          //       try {
          //         const userInfo = await fetchUserById(m.userId)
          //         console.log(`User info for ${m.userId}:`, userInfo)
          //         console.log("fetchUserById raw:", userInfo)
          //         return { ...m, userInfo }
          //       } catch (err) {
          //         console.warn(`Không thể lấy thông tin user ${m.userId}`, err)
          //         return { ...m, userInfo: null }
          //       }
          //     })
          //   )
          //   // setApiMembers(memberData)
          //   setApiMembers(membersWithUserData)
          //   console.log("MEMBER DATA:", membersWithUserData);
          //   console.table(membersWithUserData.map(m => ({
          //     userId: m.userId,
          //     fullName: m.userInfo?.fullName,
          //     email: m.userInfo?.email,
          //     avatarUrl: m.userInfo?.avatarUrl
          //   })))

          // } catch (err: any) {
          //   setMembersError(err?.message || "Failed to load members")
          // } finally {
          //   setMembersLoading(false)
          // }
          try {
            const memberData = await membershipApi.getMembersByClubId(clubId)
            console.log("MEMBER DATA FROM API:", memberData)

            setApiMembers(memberData)
          } catch (err: any) {
            setMembersError(err?.message || "Failed to load members")
          } finally {
            setMembersLoading(false)
          }
        } else {
          // throw new Error(clubResponse?.message || "Không thể tải thông tin câu lạc bộ.")
          throw new Error("Không thể tải thông tin câu lạc bộ.")
        }
      } catch (error: any) {
        setMembersError(error.message)
        console.error("Lỗi khi tải dữ liệu:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])
  console.log("CLUB ĐỂ LỌC (managedClub):", managedClub)
  console.log("DANH SÁCH MEMBER TỪ API (apiMembers):", apiMembers)

  // Filters state
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)

  // Lọc thành viên dựa trên managedClub đã được tải về
  const allClubMembers = managedClub
    ? apiMembers
        .filter((m: any) => String(m.clubId) === String(managedClub.id) && m.state === "ACTIVE")
        .map((m: any) => ({
          id: m.membershipId ?? `m-${m.userId}`,
          userId: m.userId,
          clubId: m.clubId,
          fullName: m.fullName ?? `User ${m.userId}`,
          email: m.email ?? "N/A",
          phone: m.phone ?? "N/A",
          studentCode: m.studentCode ?? "N/A",
          majorName: m.major ?? "N/A",
          avatarUrl: m.avatarUrl ?? "/placeholder-user.jpg",
          role: m.clubRole ?? "MEMBER",
          isStaff: m.staff ?? false,
          status: m.state,
          joinedAt: m.joinedDate ? new Date(m.joinedDate).toLocaleDateString() : "N/A",
          joinedDate: m.joinedDate,
        }))
    : []

  // Apply filters
  const filteredMembers = allClubMembers.filter((member) => {
    // Search by name, email, or student code
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchName = member.fullName.toLowerCase().includes(searchLower)
      const matchEmail = member.email.toLowerCase().includes(searchLower)
      const matchStudentCode = member.studentCode.toLowerCase().includes(searchLower)
      if (!matchName && !matchEmail && !matchStudentCode) return false
    }

    // Filter by role
    const roleFilter = activeFilters["role"]
    if (roleFilter && roleFilter !== "all") {
      if (member.role !== roleFilter) return false
    }

    // Filter by staff status
    const staffFilter = activeFilters["staff"]
    if (staffFilter && staffFilter !== "all") {
      const isStaff = staffFilter === "true"
      if (member.isStaff !== isStaff) return false
    }

    // Filter by major
    const majorFilter = activeFilters["major"]
    if (majorFilter && majorFilter !== "all") {
      if (member.majorName !== majorFilter) return false
    }

    // Filter by join date (month and year)
    const joinMonthFilter = activeFilters["joinMonth"]
    if (joinMonthFilter && joinMonthFilter !== "all") {
      if (member.joinedDate) {
        const memberDate = new Date(member.joinedDate)
        const filterDate = new Date(joinMonthFilter)
        if (memberDate.getMonth() !== filterDate.getMonth() || memberDate.getFullYear() !== filterDate.getFullYear()) {
          return false
        }
      }
    }

    return true
  })

  const {
    currentPage: membersPage,
    totalPages: membersPages,
    paginatedData: paginatedMembers,
    setCurrentPage: setMembersPage,
  } = usePagination({ data: filteredMembers, initialPageSize: 6 })

  // Get unique values for filters
  const uniqueRoles = Array.from(new Set(allClubMembers.map((m) => m.role)))
  const uniqueMajors = Array.from(new Set(allClubMembers.map((m) => m.majorName).filter((m) => m !== "N/A")))

  const handleFilterChange = (filterKey: string, value: any) => {
    setActiveFilters((prev) => ({ ...prev, [filterKey]: value }))
    setMembersPage(1)
  }

  const clearFilters = () => {
    setActiveFilters({})
    setSearchTerm("")
    setMembersPage(1)
  }

  const hasActiveFilters = Object.values(activeFilters).some((v) => v && v !== "all") || Boolean(searchTerm)

  const handleDeleteMember = (membershipId: string) => {
    const member = allClubMembers.find((m: any) => m.id === membershipId)
    if (!member) return
    toast({ title: "Member Removed", description: `${member.fullName} has been removed from the club` })
    setMembersPage(1)
  }

  const goPrev = () => setMembersPage(Math.max(1, membersPage - 1))
  const goNext = () => setMembersPage(Math.min(membersPages, membersPage + 1))

  // Giao diện khi đang tải thông tin ban đầu
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-8">
            <div>
              <Skeleton className="h-10 w-1/3 rounded-lg" />
              <Skeleton className="h-5 w-1/2 mt-3 rounded-lg" />
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                  <p className="text-sm text-muted-foreground">Loading club information...</p>
                </div>
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
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 border border-slate-700/50">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
            </div>
            <div className="relative flex items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Club Members</h1>
                {managedClub ? (
                  <p className="text-slate-300">
                    Managing membership of <span className="font-semibold text-blue-400">"{managedClub.name}"</span>
                  </p>
                ) : (
                  <p className="text-red-400">Could not load club details. Please try again.</p>
                )}
              </div>
              {!membersLoading && allClubMembers.length > 0 && (
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Total Members</p>
                    <p className="text-3xl font-bold text-white">{allClubMembers.length}</p>
                  </div>
                  <div className="h-14 w-14 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Users className="h-7 w-7 text-blue-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {!membersLoading && allClubMembers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search by name, email, or student code..."
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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                    {/* Major Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Major</label>
                      <Select
                        value={activeFilters["major"] || "all"}
                        onValueChange={(v) => handleFilterChange("major", v)}
                      >
                        <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 bg-white hover:border-slate-300 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Majors</SelectItem>
                          {uniqueMajors.map((major) => (
                            <SelectItem key={major} value={major}>
                              {major}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Join Month Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Join Month</label>
                      <Input
                        type="month"
                        value={activeFilters["joinMonth"] || ""}
                        onChange={(e) => handleFilterChange("joinMonth", e.target.value)}
                        className="h-9 text-sm rounded-lg border-slate-200 bg-white hover:border-slate-300 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {membersLoading ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-white">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 animate-pulse">
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading members...</h3>
                  <p className="text-sm text-slate-500">Please wait while we fetch the latest members</p>
                </CardContent>
              </Card>
            ) : membersError ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-white">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load members</h3>
                  <p className="text-sm text-red-700">{membersError}</p>
                </CardContent>
              </Card>
            ) : allClubMembers.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-white">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Members Yet</h3>
                  <p className="text-sm text-slate-500">Your club currently has no active members.</p>
                </CardContent>
              </Card>
            ) : filteredMembers.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-white">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Filter className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Members Found</h3>
                  <p className="text-sm text-slate-500 mb-4">No members match your current filters.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="rounded-lg border-slate-200 hover:bg-slate-50 bg-transparent"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {paginatedMembers.map((member) => {
                  // Determine border color based on role and staff status
                  let borderColor = ""
                  if (member.role === "LEADER") {
                    borderColor = "border-l-4 border-l-red-500" // LEADER: Red border
                  } else if (member.role === "MEMBER" && member.isStaff) {
                    borderColor = "border-l-4 border-l-blue-500" // MEMBER + Staff: Blue border
                  } else if (member.role === "MEMBER") {
                    borderColor = "border-l-4 border-l-green-500" // MEMBER: Green border
                  }

                  return (
                    <Card
                      key={member.id}
                      className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 group ${borderColor}`}
                    >
                      <CardContent className="px-6 py-0.3">
                      <div className="flex items-start justify-between gap-6">
                        {/* Left: Avatar + Basic Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-16 w-16 border-2 border-slate-200 ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all">
                            <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt={member.fullName} />
                            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                              {member.fullName
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="space-y-3 flex-1">
                            {/* Name and Role */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-bold text-slate-900">{member.fullName}</h3>
                              <Badge
                                className={`font-semibold text-xs rounded-full ${
                                  member.role === "LEADER"
                                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                                    : "bg-green-100 text-green-700 border border-green-200"
                                }`}
                              >
                                {member.role}
                              </Badge>
                              {member.isStaff && (
                                <Badge className="font-semibold text-xs rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                  Staff
                                </Badge>
                              )}
                            </div>

                            {/* Contact and Academic Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                                <Mail className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                <span className="truncate">{member.email}</span>
                              </div>

                              <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                                <UserCircle className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                <span>Student: {member.studentCode}</span>
                              </div>

                              <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                                <GraduationCap className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                <span className="truncate">{member.majorName}</span>
                              </div>

                              <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                                <Calendar className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                <span>Joined: {member.joinedAt}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            size="sm"
                            className="rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 border border-red-200"
                            onClick={() => handleDeleteMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  )
                })}

                {membersPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8 pt-4">
                    <Button
                      aria-label="Previous page"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg border-slate-200 hover:bg-slate-100 transition-colors bg-transparent"
                      onClick={goPrev}
                      disabled={membersPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="min-w-[6rem] text-center text-sm font-semibold text-slate-700">
                      Page {membersPage} of {membersPages}
                    </div>

                    <Button
                      aria-label="Next page"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg border-slate-200 hover:bg-slate-100 transition-colors bg-transparent"
                      onClick={goNext}
                      disabled={membersPage === membersPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
