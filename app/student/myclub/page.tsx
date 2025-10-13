"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Users, Crown, Shield, User, Mail, Phone } from "lucide-react"
import { safeLocalStorage } from "@/lib/browser-utils"
import { getClubMemberById, type ApiMembership } from "@/service/membershipApi"

// Import club data for club name lookup
import clubs from "@/src/data/clubs.json"

export default function MyClubPage() {
  const [userClubIds, setUserClubIds] = useState<number[]>([])
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)
  const [members, setMembers] = useState<ApiMembership[]>([])
  const [loading, setLoading] = useState(false)
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

  // Load club members when selectedClubId changes
  useEffect(() => {
    if (!selectedClubId) return

    let mounted = true
    const loadMembers = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log("Loading members for club:", selectedClubId)
        
        const membersData = await getClubMemberById(selectedClubId)
        console.log("Loaded members:", membersData)
        
        if (mounted) {
          setMembers(membersData)
        }
      } catch (err: any) {
        console.error("Failed to load club members:", err)
        if (mounted) {
          setError(err?.message ?? "Failed to load club members")
          toast({
            title: "Error loading members",
            description: err?.message ?? "Could not load club members",
            variant: "destructive"
          })
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadMembers()
    return () => { mounted = false }
  }, [selectedClubId, toast])

  // Get club information for selected club
  const currentClub = selectedClubId 
    ? clubs.find(club => Number(club.id) === selectedClubId) 
    : null

  // Get all user's clubs for dropdown
  const userClubs = userClubIds.map(clubId => 
    clubs.find(club => Number(club.id) === clubId)
  ).filter(Boolean)

  // Filter members based on search term
  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      String(member.userId).includes(searchLower) ||
      member.level.toLowerCase().includes(searchLower) ||
      member.state.toLowerCase().includes(searchLower)
    )
  })

  // DataTable columns
  const columns = [
    {
      key: "userId" as const,
      label: "User ID",
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "level" as const,
      label: "Level",
      render: (value: string) => (
        <Badge 
          variant={value === "PREMIUM" ? "default" : value === "BASIC" ? "secondary" : "outline"}
          className="flex items-center gap-1"
        >
          {value === "PREMIUM" && <Crown className="h-3 w-3" />}
          {value}
        </Badge>
      ),
    },
    {
      key: "state" as const,
      label: "Status",
      render: (value: string) => (
        <Badge variant={value === "ACTIVE" ? "default" : "destructive"}>
          {value}
        </Badge>
      ),
    },
    {
      key: "staff" as const,
      label: "Role",
      render: (value: boolean) => (
        <div className="flex items-center gap-1">
          {value ? (
            <>
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600 font-medium">Staff</span>
            </>
          ) : (
            <>
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-gray-500">Member</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: "membershipId" as const,
      label: "Membership ID",
      render: (value: number) => (
        <span className="text-sm text-muted-foreground">#{value}</span>
      ),
    },
  ]

  const filters = [
    {
      key: "level",
      label: "Level",
      type: "select" as const,
      options: [
        { value: "BASIC", label: "Basic" },
        { value: "PREMIUM", label: "Premium" },
      ],
    },
    {
      key: "state",
      label: "Status", 
      type: "select" as const,
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
      ],
    },
    {
      key: "staff",
      label: "Role",
      type: "select" as const,
      options: [
        { value: "true", label: "Staff" },
        { value: "false", label: "Member" },
      ],
    },
  ]

  // Stats for the header cards
  const totalMembers = members.length
  const activeMembers = members.filter(m => m.state === "ACTIVE").length
  const staffMembers = members.filter(m => m.staff).length
  const premiumMembers = members.filter(m => m.level === "PREMIUM").length

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
                  {currentClub ? `Members of ${currentClub.name}` : "Select a club to view members"}
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
            {userClubIds.length === 1 && currentClub && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-sm">
                  Current Club: {currentClub.name} (ID: {selectedClubId})
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
                <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {totalMembers > 0 ? Math.round((staffMembers / totalMembers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Premium Members</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{premiumMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {totalMembers > 0 ? Math.round((premiumMembers / totalMembers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Loading club members...
            </div>
          )}

          {error && (
            <div className="text-center text-sm text-destructive py-8">
              Error: {error}
            </div>
          )}

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

          {/* Members Table */}
          {selectedClubId && !loading && !error && (
            <DataTable
              title="Club Members"
              data={filteredMembers}
              columns={columns}
              searchKey="userId"
              searchPlaceholder="Search members..."
              filters={filters}
              initialPageSize={10}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}