"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Users, Crown, Shield, User, Mail, Phone, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { safeLocalStorage } from "@/lib/browser-utils"
import { getMembersByClubId, type ApiMembership } from "@/service/membershipApi"
import { fetchUserById } from "@/service/userApi"
import { getClubById } from "@/service/clubApi"

// Import club data for club name lookup
import clubs from "@/src/data/clubs.json"

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
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [apiMembers, setApiMembers] = useState<ApiMembership[]>([])
  const [loading, setLoading] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Get user's club IDs from localStorage
  useEffect(() => {
    try {
      const saved = safeLocalStorage.getItem("uniclub-auth")
      console.log("MyClub - Raw localStorage data:", saved)
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log("MyClub - Parsed localStorage data:", parsed)
        
        if (parsed.clubIds && Array.isArray(parsed.clubIds)) {
          const clubIdNumbers = parsed.clubIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
          console.log("MyClub - Setting userClubIds to:", clubIdNumbers)
          setUserClubIds(clubIdNumbers)
          // Set first club as default selected
          if (clubIdNumbers.length > 0) {
            setSelectedClubId(clubIdNumbers[0])
          }
        } else if (parsed.clubId) {
          const clubIdNumber = Number(parsed.clubId)
          console.log("MyClub - Setting userClubIds from single clubId to:", [clubIdNumber])
          setUserClubIds([clubIdNumber])
          setSelectedClubId(clubIdNumber)
        }
      }
    } catch (error) {
      console.error("Failed to get clubIds from localStorage:", error)
    }
  }, [])

  // Load club info and members when selectedClubId changes
  useEffect(() => {
    if (!selectedClubId) return

    let mounted = true
    const loadClubData = async () => {
      setLoading(true)
      setMembersLoading(true)
      setError(null)
      try {
        console.log("Loading club data for:", selectedClubId)
        
        // Load club details
        const clubResponse = (await getClubById(selectedClubId)) as ClubApiResponse
        if (clubResponse && clubResponse.success && mounted) {
          setSelectedClub(clubResponse.data)
        }
        
        // Load members
        const membersData = await getMembersByClubId(selectedClubId)
        console.log("Loaded members:", membersData)
        
        // Fetch user info for each member
        const membersWithUserData = await Promise.all(
          membersData.map(async (m: any) => {
            try {
              const userInfo = await fetchUserById(m.userId)
              console.log(`User info for ${m.userId}:`, userInfo)
              return { ...m, userInfo }
            } catch (err) {
              console.warn(`Cannot fetch user ${m.userId}`, err)
              return { ...m, userInfo: null }
            }
          })
        )
        
        if (mounted) {
          setApiMembers(membersWithUserData)
          console.log("Members with user data:", membersWithUserData)
        }
      } catch (err: any) {
        console.error("Failed to load club data:", err)
        if (mounted) {
          setError(err?.message ?? "Failed to load club data")
          toast({
            title: "Error loading club",
            description: err?.message ?? "Could not load club information",
            variant: "destructive"
          })
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setMembersLoading(false)
        }
      }
    }

    loadClubData()
    return () => { mounted = false }
  }, [selectedClubId, toast])

  // Get all user's clubs for dropdown
  const userClubs = userClubIds.map(clubId => 
    clubs.find(club => Number(club.id) === clubId)
  ).filter(Boolean)

  // Format members with user info
  const clubMembers = selectedClubId
    ? apiMembers
        .filter((m: any) => String(m.clubId) === String(selectedClubId) && m.state === "ACTIVE")
        .map((m: any) => {
          const u = m.userInfo || {}
          return {
            id: m.membershipId ?? `m-${m.userId}`,
            userId: m.userId,
            clubId: m.clubId,
            fullName: u.fullName ?? m.fullName ?? `User ${m.userId}`,
            email: u.email ?? "N/A",
            phone: u.phone ?? "N/A",
            studentCode: u.studentCode ?? "N/A",
            majorName: u.majorName ?? "N/A",
            avatarUrl: u.avatarUrl ?? "/placeholder-user.jpg",
            role: m.clubRole ?? "MEMBER",
            status: m.state,
            joinedAt: m.joinedDate ? new Date(m.joinedDate).toLocaleDateString() : "N/A",
          }
        })
    : []

  // Pagination
  const {
    currentPage: membersPage,
    totalPages: membersPages,
    paginatedData: paginatedMembers,
    setCurrentPage: setMembersPage,
  } = usePagination({ data: clubMembers, initialPageSize: 5 })

  const MinimalPager = ({ current, total, onPrev, onNext }: { current: number; total: number; onPrev: () => void; onNext: () => void }) =>
    total > 1 ? (
      <div className="flex items-center justify-center gap-3 mt-4">
        <Button aria-label="Previous page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev} disabled={current === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[2rem] text-center text-sm font-medium">
          Page {current} of {total}
        </div>
        <Button aria-label="Next page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onNext} disabled={current === total}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    ) : null

  // Stats for the header cards
  const totalMembers = clubMembers.length
  const activeMembers = clubMembers.filter(m => m.status === "ACTIVE").length
  const leaderMembers = clubMembers.filter(m => m.role === "LEADER").length

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">My Club</h1>
                <p className="text-muted-foreground">
                  {selectedClub ? `Members of "${selectedClub.name}"` : "Select a club to view members"}
                  {selectedClubId && (
                    <span className="text-xs text-muted-foreground/70 ml-2">
                      (Club ID: {selectedClubId})
                    </span>
                  )}
                </p>
              </div>
              
              {/* Club Selector Dropdown */}
              {userClubIds.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Select Club:</span>
                  <Select
                    value={selectedClubId ? String(selectedClubId) : ""}
                    onValueChange={(value) => setSelectedClubId(Number(value))}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Choose a club" />
                    </SelectTrigger>
                    <SelectContent>
                      {userClubs.map((club: any) => (
                        <SelectItem key={club.id} value={String(club.id)}>
                          <div className="flex items-center gap-2">
                            <span>{club.name}</span>
                            <Badge variant="outline" className="text-xs">
                              ID: {club.id}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {/* Show club selector for single club too, but as info */}
            {userClubIds.length === 1 && selectedClub && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-sm">
                  Current Club: {selectedClub.name} (ID: {selectedClubId})
                </Badge>
              </div>
            )}

            {/* Show total clubs info */}
            {userClubIds.length > 1 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  You are a member of {userClubIds.length} clubs. Use the dropdown above to switch between them.
                </p>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMembers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Club Leaders</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaderMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {totalMembers > 0 ? Math.round((leaderMembers / totalMembers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Club</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate">{selectedClub?.name || "N/A"}</div>
                <p className="text-xs text-muted-foreground">
                  {selectedClub?.majorName || "Loading..."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Members List */}
          <div className="space-y-4">
            {membersLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Loading members...</h3>
                  <p className="text-muted-foreground">Please wait while we fetch the latest members</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-destructive">Failed to load members</h3>
                  <p className="text-muted-foreground">{error}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* No Club Message */}
          {userClubIds.length === 0 && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Club Membership</h3>
                <p className="text-muted-foreground mb-4">You need to join a club first to view members</p>
                <Button onClick={() => window.location.href = '/student/clubs'}>
                  Browse Clubs
                </Button>
              </CardContent>
            </Card>
          )}

          {/* No Selected Club Message */}
          {userClubIds.length > 0 && !selectedClubId && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Club</h3>
                <p className="text-muted-foreground mb-4">
                  You have {userClubIds.length} club{userClubIds.length > 1 ? 's' : ''}. 
                  Please select one to view its members.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Members Cards */}
          {selectedClubId && !membersLoading && !error && (
            <div className="space-y-4">
              {clubMembers.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Members Yet</h3>
                    <p className="text-muted-foreground">This club currently has no active members.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {paginatedMembers.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          {/* Avatar + info */}
                          <div className="flex items-center gap-4">
                            <img
                              src={member.avatarUrl}
                              alt={member.fullName}
                              className="w-12 h-12 rounded-full object-cover border border-gray-700"
                            />
                            <div>
                              <h3 className="font-semibold">{member.fullName}</h3>
                              <p className="text-xs text-muted-foreground">Joined: {member.joinedAt}</p>
                              <p className="text-xs text-muted-foreground">Email: {member.email}</p>
                              <p className="text-xs text-muted-foreground">Phone: {member.phone}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.studentCode} • {member.majorName}
                              </p>
                            </div>
                          </div>

                          {/* Role badge */}
                          <div className="flex items-center gap-3">
                            <Badge variant={member.role === "LEADER" ? "default" : "secondary"}>
                              {member.role}
                            </Badge>
                          </div>
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
                </>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}