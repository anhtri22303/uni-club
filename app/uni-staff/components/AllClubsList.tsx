"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePagination } from "@/hooks/use-pagination"
import { ArrowDown, ArrowUp, Award, Building, ChevronLeft, ChevronRight, Filter, Trophy } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

interface AllClubsListProps {
  clubsWithMemberCountUnsorted: any[]
  clubsLoading: boolean
  universityPointsData: any
}

export function AllClubsList({ clubsWithMemberCountUnsorted, clubsLoading, universityPointsData }: AllClubsListProps) {
  const [clubSortField, setClubSortField] = useState<"rank" | "points" | "members">("rank")
  const [clubSortOrder, setClubSortOrder] = useState<"asc" | "desc">("asc")

  // Sort clubs using useMemo to avoid infinite loops
  const clubsWithMemberCount = useMemo(() => {
    console.log('🔄 clubsWithMemberCount useMemo - unsorted length:', clubsWithMemberCountUnsorted.length)
    console.log('🔄 Sort field:', clubSortField, 'Sort order:', clubSortOrder)
    
    if (clubsWithMemberCountUnsorted.length === 0) {
      console.log('⚠️ clubsWithMemberCountUnsorted is empty, returning empty array')
      return []
    }
    
    // Create a copy to avoid mutating state directly
    const clubsCopy = [...clubsWithMemberCountUnsorted]
    
    // Sort clubs based on selected field and order
    const sorted = clubsCopy.sort((a, b) => {
      let comparison = 0

      if (clubSortField === "rank") {
        // Sort by rank
        const rankA = a.rank !== undefined ? a.rank : Infinity
        const rankB = b.rank !== undefined ? b.rank : Infinity
        comparison = rankA - rankB
      } else if (clubSortField === "points") {
        // Sort by total points
        comparison = (a.totalPoints || 0) - (b.totalPoints || 0)
      } else if (clubSortField === "members") {
        // Sort by member count
        comparison = (a.memberCount || 0) - (b.memberCount || 0)
      }

      // Apply sort order (asc or desc)
      return clubSortOrder === "desc" ? -comparison : comparison
    })
    
    console.log('✅ Sorted clubs:', sorted.length, 'clubs')
    return sorted
  }, [clubsWithMemberCountUnsorted, clubSortField, clubSortOrder])

  // Pagination for Clubs List
  const {
    currentPage: clubsCurrentPage,
    totalPages: clubsTotalPages,
    paginatedData: paginatedClubsList,
    setCurrentPage: setClubsCurrentPage,
  } = usePagination({
    data: clubsWithMemberCount,
    initialPageSize: 5,
  })
  
  // Debug pagination
  useEffect(() => {
    console.log('📄 Pagination Debug:')
    console.log('  - clubsWithMemberCount.length:', clubsWithMemberCount.length)
    console.log('  - paginatedClubsList.length:', paginatedClubsList.length)
    console.log('  - clubsCurrentPage:', clubsCurrentPage)
    console.log('  - clubsTotalPages:', clubsTotalPages)
    console.log('  - clubsLoading:', clubsLoading)
  }, [clubsWithMemberCount, paginatedClubsList, clubsCurrentPage, clubsTotalPages, clubsLoading])

  const goClubsPrev = () => setClubsCurrentPage(Math.max(1, clubsCurrentPage - 1))
  const goClubsNext = () => setClubsCurrentPage(Math.min(clubsTotalPages, clubsCurrentPage + 1))

  return (
    <Card className="border-2 dark:border-slate-700">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
          <div className="p-1 sm:p-1.5 bg-blue-500 rounded-lg flex-shrink-0">
            <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="truncate">All Clubs List</span>
        </CardTitle>
        <CardDescription className="text-[10px] sm:text-xs flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span>Sort and filter clubs</span>
          {universityPointsData && (
            <span className="flex items-center gap-1 font-semibold text-purple-600">
              <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Total University Points: {universityPointsData.totalUniversityPoints.toLocaleString()}
            </span>
          )}
        </CardDescription>
        
        {/* Sorting Controls */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Select value={clubSortField} onValueChange={(value: any) => setClubSortField(value)}>
              <SelectTrigger className="h-8 text-xs sm:text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Sort by Rank</SelectItem>
                <SelectItem value="points">Sort by Points</SelectItem>
                <SelectItem value="members">Sort by Members</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={clubSortOrder === "asc" ? "default" : "outline"}
              size="sm"
              onClick={() => setClubSortOrder("asc")}
              className="h-8 text-xs sm:text-sm flex items-center gap-1.5"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ascending</span>
              <span className="sm:hidden">Asc</span>
            </Button>
            <Button
              variant={clubSortOrder === "desc" ? "default" : "outline"}
              size="sm"
              onClick={() => setClubSortOrder("desc")}
              className="h-8 text-xs sm:text-sm flex items-center gap-1.5"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Descending</span>
              <span className="sm:hidden">Desc</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {clubsLoading || clubsWithMemberCountUnsorted.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">Loading...</div>
          ) : paginatedClubsList.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">No clubs found</div>
          ) : (
            paginatedClubsList.map((club: any, index: number) => (
              <div
                key={club.id}
                className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 dark:border-slate-700 dark:hover:bg-slate-800/50 transition-colors gap-2 sm:gap-3"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  {/* Rank Badge */}
                  {club.rank !== undefined && (
                    <div className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0
                      ${club.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 text-white shadow-lg' : 
                        club.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 dark:from-gray-400 dark:to-gray-600 text-white shadow-md' :
                        club.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 text-white shadow-md' :
                        'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 text-blue-800 dark:text-blue-200'}
                    `}>
                      #{club.rank}
                    </div>
                  )}
                  
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                    {club.name?.charAt(0) || "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{club.name}</p>
                    <div className="flex flex-col gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="truncate">Leader: {club.leaderName || "Not assigned"}</span>
                      <span className="truncate">Major: {club.majorName || "Not assigned"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  {/* Points Display */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 dark:text-purple-400" />
                      <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">{club.totalPoints?.toLocaleString() || 0}</p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Points</p>
                  </div>
                  
                  {/* Members Display */}
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">{club.memberCount || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Members</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {clubsTotalPages > 1 && (
          <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2">
            <button
              onClick={goClubsPrev}
              disabled={clubsCurrentPage === 1}
              className={`
                flex items-center gap-1 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium
                transition-colors
                ${clubsCurrentPage === 1 
                  ? 'text-muted-foreground/50 cursor-not-allowed' 
                  : 'text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer'
                }
              `}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <span className="text-[10px] sm:text-xs font-medium text-cyan-500 dark:text-cyan-400 px-1 sm:px-2">
              {clubsCurrentPage}/{clubsTotalPages}
            </span>
            <button
              onClick={goClubsNext}
              disabled={clubsCurrentPage === clubsTotalPages}
              className={`
                flex items-center gap-1 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium
                transition-colors
                ${clubsCurrentPage === clubsTotalPages 
                  ? 'text-muted-foreground/50 cursor-not-allowed' 
                  : 'text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer'
                }
              `}
              aria-label="Next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

