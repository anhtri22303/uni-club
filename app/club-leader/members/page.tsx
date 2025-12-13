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
import { type ApiMembership, deleteMember, getLeaveReq, putLeaveReq, type LeaveRequest, removeMember } from "@/service/membershipApi"
import { getClubById, getClubIdFromToken } from "@/service/clubApi"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { useClub, useClubMembers } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import {
  Users, Trash2, ChevronLeft, ChevronRight, Mail, GraduationCap, Calendar, UserCircle, Filter, X, LogOut, Check, XCircle, ClipboardList,
  AlertTriangle,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

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
  const queryClient = useQueryClient()
  const router = useRouter()
  const [clubId] = useState(() => getClubIdFromToken())
  // --- STATE CHO REMOVE MEMBER ---
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<any>(null)
  const [removeReason, setRemoveReason] = useState("")
  const [isRemoving, setIsRemoving] = useState(false)

  // Leave requests state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false)
  const [loadingLeaveRequests, setLoadingLeaveRequests] = useState(false)
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null)

  // USE REACT QUERY for club and members
  const { data: managedClub, isLoading: loading } = useClub(clubId || 0, !!clubId)
  const { data: apiMembers = [], isLoading: membersLoading, error: membersQueryError } = useClubMembers(
    clubId || 0,
    !!clubId
  )
  const membersError = membersQueryError ? String(membersQueryError) : null


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
  } = usePagination({ data: filteredMembers, initialPageSize: 10 })

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

  // --- HÀM MỞ MODAL XÓA ---
  const handleInitiateRemove = (member: any) => {
    setMemberToRemove(member)
    setRemoveReason("") // Reset lý do
    setIsRemoveDialogOpen(true)
  }

  // --- HÀM XỬ LÝ API XÓA ---
  const handleConfirmRemove = async () => {
    if (!memberToRemove) return
    if (!removeReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please enter a reason for removing this member.",
        variant: "destructive"
      })
      return
    }

    setIsRemoving(true)
    try {
      const membershipIdNum = typeof memberToRemove.id === 'string' ? parseInt(memberToRemove.id, 10) : memberToRemove.id

      // Gọi API removeMember mới (có body reason)
      await removeMember(membershipIdNum, removeReason)

      // Invalidate query để load lại list
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'members'] })

      toast({
        title: "Member Removed",
        description: `${memberToRemove.fullName} has been removed successfully.`
      })

      setIsRemoveDialogOpen(false)
      setMembersPage(1)
    } catch (error: any) {
      console.error("Remove error:", error)
      toast({
        title: "Failed to Remove Member",
        description: error?.message || "An error occurred while removing the member",
        variant: "destructive"
      })
    } finally {
      setIsRemoving(false)
    }
  }


  const handleDeleteMember = async (membershipId: string) => {
    const member = allClubMembers.find((m: any) => m.id === membershipId)
    if (!member) return

    if (!confirm(`Are you sure you want to remove ${member.fullName} from the club?`)) {
      return
    }

    try {
      const membershipIdNum = typeof membershipId === 'string' ? parseInt(membershipId, 10) : membershipId
      await deleteMember(membershipIdNum)

      // Invalidate and refetch the members list using the correct query key
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'members'] })

      toast({
        title: "Member Removed",
        description: `${member.fullName} has been removed from the club successfully`
      })

      setMembersPage(1)
    } catch (error: any) {
      toast({
        title: "Failed to Remove Member",
        description: error?.message || "An error occurred while removing the member",
        variant: "destructive"
      })
    }
  }

  const goPrev = () => setMembersPage(Math.max(1, membersPage - 1))
  const goNext = () => setMembersPage(Math.min(membersPages, membersPage + 1))

  // Load leave requests when component mounts or clubId changes
  useEffect(() => {
    if (clubId) {
      loadLeaveRequests()
    }
  }, [clubId])

  const loadLeaveRequests = async () => {
    if (!clubId) return

    setLoadingLeaveRequests(true)
    try {
      const requests = await getLeaveReq(clubId)
      setLeaveRequests(requests)
    } catch (error) {
      console.error("Failed to load leave requests:", error)
    } finally {
      setLoadingLeaveRequests(false)
    }
  }

  const handleOpenLeaveRequestModal = () => {
    loadLeaveRequests()
    setShowLeaveRequestModal(true)
  }

  const handleLeaveRequestAction = async (requestId: number, action: "APPROVED" | "REJECTED") => {
    setProcessingRequestId(requestId)
    try {
      const message = await putLeaveReq(requestId, action)
      toast({
        title: "Success",
        description: message || `The request has been ${action === "APPROVED" ? "APPROVED" : "REJECTED"}`,
      })
      // Reload leave requests
      await loadLeaveRequests()
    } catch (error: any) {
      console.error("Failed to process leave request:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.error || error?.response?.data?.message || "Unable to process request",
        variant: "destructive",
      })
    } finally {
      setProcessingRequestId(null)
    }
  }

  // Count pending requests
  const pendingRequestsCount = leaveRequests.filter(req => req.status === "PENDING").length

  // Sort requests by createdAt (latest first)
  const sortedLeaveRequests = [...leaveRequests].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

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
            <div className="relative space-y-4">
              <div className="flex items-center justify-between gap-6">
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

              {/* Request Out Button */}
              {managedClub && (
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => router.push('/club-leader/event-staff')}
                    className="relative bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                  >
                    <ClipboardList className="h-4 w-4" />
                    List Staff
                  </Button>
                  <Button
                    onClick={handleOpenLeaveRequestModal}
                    className="relative bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Request Out
                    {pendingRequestsCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold 
                      flex items-center justify-center border-2 border-white">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {!membersLoading && allClubMembers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative w-full max-w-md">
                  <Input
                    placeholder="Search by name, email, or student code..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setMembersPage(1)
                    }}
                    // Thay đổi: Tăng padding-right (pr-10) để chữ không bị nút X che mất
                    className="pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 
                    focus:ring-blue-500 focus:border-transparent transition-all border-slate-300"
                  />

                  {/* Nút Clear xuất hiện khi có nội dung tìm kiếm */}
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSearchTerm("")
                        setMembersPage(1) // Reset về trang 1 khi xóa tìm kiếm
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-400 hover:bg-primary 
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
                  className="flex items-center gap-2 rounded-lg border-slate-200 hover:bg-slate-50 transition-colors bg-white"
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
                    borderColor = "border-l-4 border-l-red-500 dark:border-l-red-400" // LEADER: Red border
                  } else if (member.role === "MEMBER" && member.isStaff) {
                    borderColor = "border-l-4 border-l-blue-500 dark:border-l-blue-400" // MEMBER + Staff: Blue border
                  } else if (member.role === "MEMBER") {
                    borderColor = "border-l-4 border-l-green-500 dark:border-l-green-400" // MEMBER: Green border
                  }

                  return (
                    <Card
                      key={member.id}
                      className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-800/90 hover:bg-gradient-to-br 
                        hover:from-white hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-700/80 group ${borderColor}`}
                    >
                      <CardContent className="px-6 py-0.3">
                        <div className="flex items-start justify-between gap-6">
                          {/* Left: Avatar + Basic Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-16 w-16 border-2 border-slate-200 dark:border-slate-700 ring-2 ring-blue-100 dark:ring-blue-900/50 
                            group-hover:ring-blue-200 dark:group-hover:ring-blue-800/70 transition-all">
                              <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt={member.fullName} />
                              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 
                              dark:to-blue-700 text-white">
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
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{member.fullName}</h3>
                                {/* Colored badge by role */}
                                {(() => {
                                  let badgeClass = "font-semibold text-xs rounded-full ";
                                  if (member.role === "LEADER") {
                                    badgeClass += "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50";
                                  } else if (member.role === "VICE_LEADER" || member.role === "VICE LEADER") {
                                    badgeClass += "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50";
                                  } else {
                                    badgeClass += "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/50";
                                  }
                                  return (
                                    <Badge className={badgeClass}>
                                      {member.role.replace(/_/g, ' ')}
                                    </Badge>
                                  );
                                })()}
                                {member.isStaff && (
                                  <Badge className="font-semibold text-xs rounded-full bg-blue-100 text-blue-700 border border-blue-200 
                                  dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50">
                                    Staff
                                  </Badge>
                                )}
                              </div>

                              {/* Contact and Academic Info Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 
                                dark:group-hover:text-slate-200 transition-colors">
                                  <Mail className="h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                                  <span className="truncate">Mail: {member.email}</span>
                                </div>

                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 
                                dark:group-hover:text-slate-200 transition-colors">
                                  <UserCircle className="h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                                  <span>Student Code: {member.studentCode}</span>
                                </div>

                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 
                                dark:group-hover:text-slate-200 transition-colors">
                                  <GraduationCap className="h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                                  <span className="truncate">Major: {member.majorName}</span>
                                </div>

                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 
                                dark:group-hover:text-slate-200 transition-colors">
                                  <Calendar className="h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                                  <span>Joined: {member.joinedAt}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex flex-col items-end gap-2">
                            {member.role !== "LEADER" && member.role !== "VICE_LEADER" && (
                              <Button
                                size="sm"
                                // className="rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/30 
                                // dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300 transition-all duration-200 border border-red-200 dark:border-red-800/50"
                                // onClick={() => handleDeleteMember(member.id)}
                                className="rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200"
                                onClick={() => handleInitiateRemove(member)} // <-- Gọi hàm mở modal
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {/* {membersPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 pt-4">
                    <button
                      onClick={goPrev}
                      disabled={membersPage === 1}
                      className={`
                        flex items-center gap-1 px-3 py-1.5 text-sm font-medium
                        transition-colors
                        ${membersPage === 1
                          ? 'text-muted-foreground/50 cursor-not-allowed'
                          : 'text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer'
                        }
                      `}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>
                    <span className="text-sm font-medium text-cyan-500 dark:text-cyan-400 px-2">
                      {membersPage}/{membersPages}
                    </span>
                    <button
                      onClick={goNext}
                      disabled={membersPage === membersPages}
                      className={`
                        flex items-center gap-1 px-3 py-1.5 text-sm font-medium
                        transition-colors
                        ${membersPage === membersPages
                          ? 'text-muted-foreground/50 cursor-not-allowed'
                          : 'text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer'
                        }
                      `}
                      aria-label="Next page"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )} */}
                {membersPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 pt-4">
                    <button onClick={goPrev} disabled={membersPage === 1} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-cyan-500 disabled:text-gray-400">
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <span className="text-sm font-medium text-cyan-500">{membersPage}/{membersPages}</span>
                    <button onClick={goNext} disabled={membersPage === membersPages} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-cyan-500 disabled:text-gray-400">
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* --- MODAL XOÁ THÀNH VIÊN (MỚI) --- */}
        <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
          <DialogContent className="sm:max-w-[500px] dark:bg-slate-900 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Confirm Removal
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-300">
                Are you sure you want to remove <span className="font-bold text-slate-900 dark:text-white">{memberToRemove?.fullName}</span> from the club?
                <br />
                This action requires a reason.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="remove-reason" className="text-sm font-medium">
                  Reason for removal <span className="text-red-500">*</span>
                </Label>
                {/* Sử dụng textarea để nhập lý do dài hơn */}
                <textarea
                  id="remove-reason"
                  placeholder="Enter reason (e.g., Violated club rules, Inactive for too long...)"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700"
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsRemoveDialogOpen(false)}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmRemove}
                disabled={isRemoving || !removeReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isRemoving ? "Removing..." : "Remove Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Leave Requests Modal */}
        <Dialog open={showLeaveRequestModal} onOpenChange={setShowLeaveRequestModal}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white dark:text-white">Leave Requests</DialogTitle>
              <DialogDescription className="text-slate-400 dark:text-slate-400">
                List of requests to leave the club from club members
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {loadingLeaveRequests ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 animate-pulse">
                    <LogOut className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải danh sách yêu cầu...</p>
                </div>
              ) : sortedLeaveRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <LogOut className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Không có yêu cầu nào</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có thành viên nào gửi yêu cầu rời câu lạc bộ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedLeaveRequests.map((request) => {
                    const statusColors = {
                      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700/50",
                      APPROVED: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/50",
                      REJECTED: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/50",
                    }

                    const statusText = {
                      PENDING: "Pending",
                      APPROVED: "Approved",
                      REJECTED: "Rejected",
                    }

                    return (
                      <Card
                        key={request.requestId}
                        className={`border shadow-sm hover:shadow-md transition-all dark:bg-slate-800/90 dark:border-slate-700 
                          ${request.status === "PENDING" ? "border-yellow-300 bg-yellow-50/30 dark:border-yellow-700/50 dark:bg-yellow-900/20" : ""
                          }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">{request.memberName}</h4>
                                <Badge className={`text-xs font-semibold rounded-full text-white ${statusColors[request.status]}`}>
                                  {statusText[request.status]}
                                </Badge>
                                <Badge variant="outline" className="text-xs dark:bg-slate-700/50 dark:text-white dark:border-slate-600">
                                  {request.memberRole}
                                </Badge>
                              </div>

                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <Mail className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                                  <span>{request.memberEmail}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <Calendar className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                                  <span>
                                    Sent at: {new Date(request.createdAt).toLocaleString("vi-VN")}
                                  </span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1">Reason:</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{request.reason}"</p>
                              </div>

                              {request.processedAt && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  Processing time: {new Date(request.processedAt).toLocaleString("vi-VN")}
                                </div>
                              )}
                            </div>

                            {/* Action buttons for PENDING requests */}
                            {request.status === "PENDING" && (
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleLeaveRequestAction(request.requestId, "APPROVED")}
                                  disabled={processingRequestId === request.requestId}
                                  className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1.5 h-8"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  {processingRequestId === request.requestId ? "..." : "Approve"}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleLeaveRequestAction(request.requestId, "REJECTED")}
                                  disabled={processingRequestId === request.requestId}
                                  className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1.5 h-8"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  {processingRequestId === request.requestId ? "..." : "Reject"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => setShowLeaveRequestModal(false)}
                className="dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Close
              </Button>
              <Button
                onClick={loadLeaveRequests}
                disabled={loadingLeaveRequests}
                className="bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
              >
                {loadingLeaveRequests ? "Loading..." : "Refesh"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AppShell>
    </ProtectedRoute>
  )
}
