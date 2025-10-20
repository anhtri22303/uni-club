"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import {
  Users,
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
import { safeLocalStorage } from "@/lib/browser-utils"
import { type ApiMembership } from "@/service/membershipApi"
import { getClubById } from "@/service/clubApi"
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

export default function MyClubPage() {
  const [userClubIds, setUserClubIds] = useState<number[]>([])
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()

  // ✅ REACT QUERY: Load club and members data
  const { data: selectedClub, isLoading: loading } = useClub(selectedClubId || 0, !!selectedClubId)
  const { data: apiMembers = [], isLoading: membersLoading, error: membersQueryError } = useClubMembers(selectedClubId || 0, !!selectedClubId)
  const membersError = membersQueryError ? String(membersQueryError) : null

  // Get user's club IDs from localStorage
  useEffect(() => {
    const loadUserClubs = async () => {
      try {
        const saved = safeLocalStorage.getItem("uniclub-auth")
        console.log("MyClub - Raw localStorage data:", saved)
        if (saved) {
          const parsed = JSON.parse(saved)
          console.log("MyClub - Parsed localStorage data:", parsed)
          
          let clubIdNumbers: number[] = []
          
          if (parsed.clubIds && Array.isArray(parsed.clubIds)) {
            clubIdNumbers = parsed.clubIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
          } else if (parsed.clubId) {
            clubIdNumbers = [Number(parsed.clubId)]
          }
          
          console.log("MyClub - Setting userClubIds to:", clubIdNumbers)
          setUserClubIds(clubIdNumbers)
          
          // Set first club as default selected
          if (clubIdNumbers.length > 0) {
            setSelectedClubId(clubIdNumbers[0])
          }
        }
      } catch (error) {
        console.error("Failed to get clubIds from localStorage:", error)
      }
    }
    
    loadUserClubs()
  }, [])

  // ✅ REMOVED: useEffect for loading club and members - React Query handles this automatically

  // State to store fetched club details for dropdown
  const [userClubsDetails, setUserClubsDetails] = useState<Club[]>([])
  
  // Load club details for dropdown when userClubIds change
  useEffect(() => {
    if (userClubIds.length === 0) return
    
    const loadClubsDetails = async () => {
      try {
        const clubsPromises = userClubIds.map(clubId => getClubById(clubId))
        const clubsResponses = await Promise.all(clubsPromises)
        
        const validClubs = clubsResponses
          .filter((res: any) => res?.success && res?.data)
          .map((res: any) => res.data)
        
        console.log("Loaded clubs details for dropdown:", validClubs)
        setUserClubsDetails(validClubs)
      } catch (err) {
        console.error("Failed to load clubs details:", err)
      }
    }
    
    loadClubsDetails()
  }, [userClubIds])

  // Format members with user info
  const allClubMembers = selectedClubId
    ? apiMembers
        .filter((m: any) => String(m.clubId) === String(selectedClubId) && m.state === "ACTIVE")
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

  // Pagination
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

  const goPrev = () => setMembersPage(Math.max(1, membersPage - 1))
  const goNext = () => setMembersPage(Math.min(membersPages, membersPage + 1))

  // Loading state
  if (loading && userClubIds.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
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
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 border border-slate-700/50">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
            </div>
            <div className="relative space-y-4">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold tracking-tight text-white mb-2">My Club Members</h1>
                  {selectedClub ? (
                    <p className="text-slate-300">
                      Viewing members of <span className="font-semibold text-blue-400">"{selectedClub.name}"</span>
                    </p>
                  ) : (
                    <p className="text-slate-300">Select a club to view its members</p>
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

              {/* Club Selector Dropdown */}
              {userClubIds.length > 0 && (
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10">
                  <span className="text-sm font-medium text-white">Select Club:</span>
                  <Select
                    value={selectedClubId ? String(selectedClubId) : ""}
                    onValueChange={(value) => setSelectedClubId(Number(value))}
                  >
                    <SelectTrigger className="w-[300px] bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Choose a club" />
                    </SelectTrigger>
                    <SelectContent>
                      {userClubsDetails.map((club) => (
                        <SelectItem key={club.id} value={String(club.id)}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{club.name}</span>
                            <Badge variant="secondary" className="text-xs font-semibold bg-slate-200 text-slate-900 border-slate-300">
                              ID: {club.id}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {userClubIds.length > 1 && (
                    <span className="text-xs text-slate-400">
                      ({userClubIds.length} clubs available)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search + Filters */}
          {!membersLoading && allClubMembers.length > 0 && selectedClubId && (
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

          {/* Members List */}
          <div className="space-y-4">
            {userClubIds.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-white">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Club Membership</h3>
                  <p className="text-sm text-slate-500 mb-4">You need to join a club first to view members</p>
                  <Button onClick={() => (window.location.href = "/student/clubs")}>Browse Clubs</Button>
                </CardContent>
              </Card>
            ) : !selectedClubId ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-white">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Club</h3>
                  <p className="text-sm text-slate-500">
                    You have {userClubIds.length} club{userClubIds.length > 1 ? "s" : ""}. Please select one to view its
                    members.
                  </p>
                </CardContent>
              </Card>
            ) : membersLoading ? (
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
                  <p className="text-sm text-slate-500">This club currently has no active members.</p>
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
                    borderColor = "border-l-4 border-l-red-500"
                  } else if (member.role === "MEMBER" && member.isStaff) {
                    borderColor = "border-l-4 border-l-blue-500"
                  } else if (member.role === "MEMBER") {
                    borderColor = "border-l-4 border-l-green-500"
                  }

                  return (
                    <Card
                      key={member.id}
                      className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 group ${borderColor}`}
                    >
                      <CardContent className="px-6 py-1.5">
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