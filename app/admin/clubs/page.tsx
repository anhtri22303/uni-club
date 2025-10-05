"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePagination } from "@/hooks/use-pagination"
import { useData } from "@/contexts/data-context"
import { Building, Users, Calendar, TrendingUp, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useMemo, useState } from "react"

// Import data
import clubs from "@/src/data/clubs.json"
import events from "@/src/data/events.json"

type ActivityLevel = "High" | "Medium" | "Low"

// Kiểu bản ghi club gốc từ JSON
interface ClubRecord {
  id: string
  name: string
  category: string
  members: number
  description?: string // optional: JSON có thể có hoặc không
}

// Kiểu club sau khi enrich
type EnhancedClub = ClubRecord & {
  memberCount: number
  pendingCount: number
  eventCount: number
  activityLevel: ActivityLevel
}

export default function AdminClubsPage() {
  const { clubMemberships, membershipApplications } = useData()

  const getClubStats = (clubId: string) => {
    const members = clubMemberships.filter((m) => m.clubId === clubId && m.status === "APPROVED").length
    const pending = membershipApplications.filter((a) => a.clubId === clubId && a.status === "PENDING").length
    const clubEvents = (events as Array<{ clubId: string }>).filter((e) => e.clubId === clubId).length
    return { members, pending, events: clubEvents }
  }

  const enhancedClubs: EnhancedClub[] = useMemo(() => {
    return (clubs as ClubRecord[]).map((club) => {
      const stats = getClubStats(club.id)
      const activityScore = stats.members + stats.events
      const activityLevel: ActivityLevel = activityScore > 10 ? "High" : activityScore > 5 ? "Medium" : "Low"
      return {
        ...club,
        memberCount: stats.members,
        pendingCount: stats.pending,
        eventCount: stats.events,
        activityLevel,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubMemberships, membershipApplications])

  // ------- Search & Filters -------
  const [searchTerm, setSearchTerm] = useState("")
  // dùng "all" (không rỗng) để tránh lỗi SelectItem value="" của Radix/shadcn
  const [category, setCategory] = useState<string>("all")
  const [activityLevel, setActivityLevel] = useState<"all" | ActivityLevel>("all")

  const filteredClubs = enhancedClubs.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchCategory = category === "all" ? true : c.category === category
    const matchActivity = activityLevel === "all" ? true : c.activityLevel === activityLevel

    return matchSearch && matchCategory && matchActivity
  })

  // ------- Minimal Pagination (arrows + current page only) -------
  const { currentPage, totalPages, paginatedData, setCurrentPage } = usePagination({
    data: filteredClubs,
    initialPageSize: 6,
  })

  const goPrev = () => setCurrentPage(Math.max(1, currentPage - 1))
  const goNext = () => setCurrentPage(Math.min(totalPages, currentPage + 1))

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Club Management</h1>
            <p className="text-muted-foreground">Overview of all student clubs</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 max-w-sm w-full">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or category..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Category filter */}
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v) // v luôn khác rỗng ("all" | Category)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                </SelectContent>
              </Select>

              {/* Activity level filter */}
              <Select
                value={activityLevel}
                onValueChange={(v: "all" | ActivityLevel) => {
                  setActivityLevel(v) // v luôn khác rỗng
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Activity Levels" />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectItem value="all">All Activity Levels</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Club Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-center">Members</th>
                  <th className="px-4 py-3 font-medium text-center">Events</th>
                  <th className="px-4 py-3 font-medium">Activity Level</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No clubs found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((club) => (
                    <tr key={club.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {club.name}
                        </div>
                        {club.description ? (
                          <div className="text-xs text-muted-foreground">{club.description}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{club.category}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-center">
                          <div className="font-medium flex items-center gap-1 justify-center">
                            <Users className="h-4 w-4" />
                            {club.memberCount}
                          </div>
                          {club.pendingCount > 0 && (
                            <div className="text-xs text-muted-foreground">+{club.pendingCount} pending</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-center">
                          <div className="font-medium flex items-center gap-1 justify-center">
                            <Calendar className="h-4 w-4" />
                            {club.eventCount}
                          </div>
                          <div className="text-xs text-muted-foreground">total</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            club.activityLevel === "High"
                              ? "default"
                              : club.activityLevel === "Medium"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {club.activityLevel}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Minimal Pager: only two arrows + current page number */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                aria-label="Previous page"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-transparent"
                onClick={goPrev}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-[2rem] text-center text-sm font-medium">{currentPage}</div>

              <Button
                aria-label="Next page"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-transparent"
                onClick={goNext}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
