"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// modal and application inputs removed since pending/reviewed lists are removed
// removed useAuth (not used)
import { useData } from "@/contexts/data-context"
import membershipApi, { ApiMembership } from "@/service/membershipApi"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import {
  Users,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

// Import data
import clubs from "@/src/data/clubs.json"
import users from "@/src/data/users.json"

export default function ClubLeaderMembersPage() {
  const { clubMemberships } = useData()
  const { toast } = useToast()

  // application-related states removed (pending/reviewed lists removed)

  // For demo purposes, assume managing the first club
  const managedClub = clubs[0]

  

  // Get club-specific data
  const [apiMembers, setApiMembers] = useState<ApiMembership[] | null>(null)
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setMembersLoading(true)
      setMembersError(null)
      try {
        const data = await membershipApi.getClubMembers()
        if (!mounted) return
        setApiMembers(data)
      } catch (err: any) {
        setMembersError(err?.message || "Failed to load members")
      } finally {
        setMembersLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  // Map API members to the shape used by the UI (membership.id, userId, clubId, role, status, joinedAt)
  // If apiMembers is present, show all returned members (no clubId filtering) so developer sees backend response directly.
  const clubMembers = apiMembers
    ? apiMembers.map((m: any) => ({
        id: m.membershipId ?? m.id ?? `m-${m.userId}`,
        userId: String(m.userId),
        clubId: String(m.clubId),
        role: m.level ? m.level : m.role ?? "MEMBER",
        status: m.state ? (m.state === "ACTIVE" ? "APPROVED" : m.state) : m.status ?? "APPROVED",
        joinedAt: m.joinedAt ?? null,
      }))
    : clubMemberships
        .filter((m: any) => String(m.clubId) === String(managedClub.id) && (m.state ? m.state === "ACTIVE" : m.status === "APPROVED"))
        .map((m: any) => ({
          id: m.membershipId ?? m.id ?? `m-${m.userId}`,
          userId: String(m.userId),
          clubId: String(m.clubId),
          role: m.level ? m.level : m.role ?? "MEMBER",
          status: m.state ? (m.state === "ACTIVE" ? "APPROVED" : m.state) : m.status ?? "APPROVED",
          joinedAt: m.joinedAt ?? null,
        }))
  const {
    currentPage: membersPage,
    totalPages: membersPages,
    paginatedData: paginatedMembers,
    setCurrentPage: setMembersPage,
  } = usePagination({ data: clubMembers, initialPageSize: 3 })
  // pending/reviewed handlers removed

  const handleDeleteMember = (membershipId: string) => {
    const member = clubMembers.find((m: any) => m.id === membershipId)
    if (!member) return
    const user = getUserDetails(member.userId)
    toast({ title: "Member Removed", description: `${user?.fullName} has been removed from the club` })
    setMembersPage(1)
  }

  // approve/reject handlers removed

  const getUserDetails = (userId: string) => {
    const found = users.find((u) => u.id === userId)
    if (found) return found
    // fallback minimal user when not available in local data
    return { id: userId, fullName: String(userId), email: "" }
  }

  const MinimalPager = ({ current, total, onPrev, onNext }: { current: number; total: number; onPrev: () => void; onNext: () => void }) =>
    total > 1 ? (
      <div className="flex items-center justify-center gap-3">
        <Button aria-label="Previous page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev} disabled={current === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[2rem] text-center text-sm font-medium">{current}</div>
        <Button aria-label="Next page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onNext} disabled={current === total}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    ) : null

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Members</h1>
            <p className="text-muted-foreground">Manage {managedClub.name} membership</p>
          </div>

          <div className="space-y-4">
            {membersLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Loading members...</h3>
                  <p className="text-muted-foreground">Please wait while we fetch the latest members</p>
                </CardContent>
              </Card>
            ) : membersError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Failed to load members</h3>
                  <p className="text-muted-foreground">{membersError}</p>
                </CardContent>
              </Card>
            ) : clubMembers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Members Yet</h3>
                  <p className="text-muted-foreground">Approve applications to add members</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {paginatedMembers.map((membership) => {
                  const user = getUserDetails(membership.userId)
                  return (
                    <Card key={membership.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{user?.fullName ?? membership.userId}</h3>
                            <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Joined: {membership.joinedAt ? new Date(membership.joinedAt).toLocaleDateString() : "Recently"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="default">{membership.role}</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                              onClick={() => handleDeleteMember(membership.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                <MinimalPager
                  current={membersPage}
                  total={membersPages}
                  onPrev={() => setMembersPage(Math.max(1, membersPage - 1))}
                  onNext={() => setMembersPage(Math.min(membersPages, membersPage + 1))}
                />
              </>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
