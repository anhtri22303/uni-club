// ============================================================================
// 📘 REACT QUERY MIGRATION EXAMPLES
// File này chứa các ví dụ cụ thể để bạn áp dụng cho các pages còn lại
// ============================================================================

// ============================================================================
// EXAMPLE 1: Student Wallet Page (GET wallet data)
// ============================================================================

// ❌ BEFORE (Old way with useState + useEffect)
/*
"use client"
import { useState, useEffect } from "react"
import { getWallet } from "@/service/walletApi"

export default function StudentWalletPage() {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadWallet = async () => {
      try {
        setLoading(true)
        const data = await getWallet()
        setWallet(data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    loadWallet()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>My Wallet</h1>
      <p>Points: {wallet?.points}</p>
    </div>
  )
}
*/

// ✅ AFTER (New way with React Query)
"use client"
import { useWallet } from "@/hooks/use-query-hooks"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentWalletPage() {
  const { data: wallet, isLoading, error } = useWallet()

  if (isLoading) return <Skeleton className="h-32 w-full" />
  if (error) return <div>Error loading wallet</div>

  return (
    <div>
      <h1>My Wallet</h1>
      <p>Points: {wallet?.points}</p>
    </div>
  )
}

// ============================================================================
// EXAMPLE 2: Club Leader Members Page (GET members of a club)
// ============================================================================

// ✅ WITH REACT QUERY
/*
"use client"
import { useClubMembers } from "@/hooks/use-query-hooks"
import { getClubIdFromToken } from "@/service/clubApi"
import { useEffect, useState } from "react"

export default function ClubLeaderMembersPage() {
  const [clubId, setClubId] = useState<number | null>(null)

  useEffect(() => {
    const id = getClubIdFromToken()
    setClubId(id)
  }, [])

  // Only fetch when clubId is available
  const { data: members = [], isLoading } = useClubMembers(clubId || 0, !!clubId)

  if (!clubId) return <div>No club found</div>
  if (isLoading) return <div>Loading members...</div>

  return (
    <div>
      <h1>Club Members ({members.length})</h1>
      {members.map(member => (
        <div key={member.id}>{member.name}</div>
      ))}
    </div>
  )
}
*/

// ============================================================================
// EXAMPLE 3: Admin Users Page (GET all users)
// ============================================================================

// ✅ WITH REACT QUERY + PAGINATION
/*
"use client"
import { useUsers } from "@/hooks/use-query-hooks"
import { DataTable } from "@/components/data-table"
import { usePagination } from "@/hooks/use-pagination"

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useUsers()

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages
  } = usePagination({
    data: users,
    initialPageSize: 10
  })

  const columns = [
    { key: "fullName", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" }
  ]

  return (
    <div>
      <h1>Users Management</h1>
      <DataTable
        data={paginatedData}
        columns={columns}
        loading={isLoading}
      />
    </div>
  )
}
*/

// ============================================================================
// EXAMPLE 4: Uni Staff Policies Page (GET + CREATE/UPDATE/DELETE)
// ============================================================================

// ✅ READ with React Query + WRITE with mutations
/*
"use client"
import { usePolicies } from "@/hooks/use-query-hooks"
import { createPolicy, updatePolicyById, deletePolicyById } from "@/service/policyApi"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

export default function UniStaffPoliciesPage() {
  // READ: Use React Query
  const { data: policies = [], isLoading, refetch } = usePolicies()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // WRITE: Use regular async functions
  const handleCreate = async (policyData) => {
    try {
      await createPolicy(policyData)
      
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ["policies"] })
      
      toast({ title: "Success", description: "Policy created" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to create policy", variant: "destructive" })
    }
  }

  const handleUpdate = async (id, updates) => {
    try {
      await updatePolicyById(id, updates)
      queryClient.invalidateQueries({ queryKey: ["policies"] })
      toast({ title: "Success", description: "Policy updated" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to update policy", variant: "destructive" })
    }
  }

  const handleDelete = async (id) => {
    try {
      await deletePolicyById(id)
      queryClient.invalidateQueries({ queryKey: ["policies"] })
      toast({ title: "Success", description: "Policy deleted" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete policy", variant: "destructive" })
    }
  }

  if (isLoading) return <div>Loading policies...</div>

  return (
    <div>
      <h1>Policies Management</h1>
      <button onClick={() => handleCreate({ name: "New Policy" })}>
        Create Policy
      </button>
      {policies.map(policy => (
        <div key={policy.id}>
          <span>{policy.policyName}</span>
          <button onClick={() => handleUpdate(policy.id, { name: "Updated" })}>
            Update
          </button>
          <button onClick={() => handleDelete(policy.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
*/

// ============================================================================
// EXAMPLE 5: Multiple Data Sources (Events + Clubs + Users)
// ============================================================================

// ✅ FETCH MULTIPLE DATA with React Query
/*
"use client"
import { useEvents, useClubs, useUsers } from "@/hooks/use-query-hooks"

export default function DashboardPage() {
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const { data: clubs = [], isLoading: clubsLoading } = useClubs()
  const { data: users = [], isLoading: usersLoading } = useUsers()

  // Combined loading state
  const isLoading = eventsLoading || clubsLoading || usersLoading

  if (isLoading) return <div>Loading dashboard...</div>

  return (
    <div>
      <h1>Dashboard</h1>
      <div>Total Events: {events.length}</div>
      <div>Total Clubs: {clubs.length}</div>
      <div>Total Users: {users.length}</div>
    </div>
  )
}
*/

// ============================================================================
// EXAMPLE 6: Filtered Data (Events by Club)
// ============================================================================

// ✅ FILTERED QUERY
/*
"use client"
import { useClubEvents } from "@/hooks/use-query-hooks"
import { useState, useEffect } from "react"
import { safeLocalStorage } from "@/lib/browser-utils"

export default function MyClubEventsPage() {
  const [userClubIds, setUserClubIds] = useState<number[]>([])

  // Get user's club IDs
  useEffect(() => {
    const auth = JSON.parse(safeLocalStorage.getItem("uniclub-auth") || "{}")
    if (auth.clubIds) {
      setUserClubIds(auth.clubIds.map(Number))
    }
  }, [])

  // Automatically filters events by clubIds
  const { data: events = [], isLoading } = useClubEvents(userClubIds)

  if (isLoading) return <div>Loading events...</div>

  return (
    <div>
      <h1>My Club Events</h1>
      {events.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  )
}
*/

// ============================================================================
// EXAMPLE 7: Detail Page with ID from URL
// ============================================================================

// ✅ DETAIL PAGE
/*
"use client"
import { useEvent } from "@/hooks/use-query-hooks"
import { useParams } from "next/navigation"

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string

  const { data: event, isLoading, error } = useEvent(eventId)

  if (isLoading) return <div>Loading event details...</div>
  if (error) return <div>Event not found</div>

  return (
    <div>
      <h1>{event?.title}</h1>
      <p>{event?.description}</p>
      <p>Date: {event?.date}</p>
      <p>Location: {event?.locationName}</p>
    </div>
  )
}
*/

// ============================================================================
// EXAMPLE 8: Search + Filter with React Query
// ============================================================================

// ✅ CLIENT-SIDE SEARCH/FILTER
/*
"use client"
import { useClubs } from "@/hooks/use-query-hooks"
import { useState, useMemo } from "react"

export default function ClubsSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: clubs = [], isLoading } = useClubs()

  // Client-side filtering
  const filteredClubs = useMemo(() => {
    return clubs.filter(club =>
      club.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [clubs, searchTerm])

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search clubs..."
      />
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        filteredClubs.map(club => (
          <div key={club.id}>{club.name}</div>
        ))
      )}
    </div>
  )
}
*/

// ============================================================================
// EXAMPLE 9: Conditional Fetching (Only fetch when needed)
// ============================================================================

// ✅ CONDITIONAL FETCH
/*
"use client"
import { useClub } from "@/hooks/use-query-hooks"
import { useState } from "react"

export default function ClubSelectorPage() {
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)

  // Only fetch when a club is selected
  const { data: club, isLoading } = useClub(
    selectedClubId || 0,
    !!selectedClubId  // enabled = true only when selectedClubId exists
  )

  return (
    <div>
      <select onChange={(e) => setSelectedClubId(Number(e.target.value))}>
        <option value="">Select a club...</option>
        <option value="1">Club 1</option>
        <option value="2">Club 2</option>
      </select>

      {selectedClubId && (
        isLoading ? (
          <div>Loading club details...</div>
        ) : (
          <div>
            <h2>{club?.name}</h2>
            <p>{club?.description}</p>
          </div>
        )
      )}
    </div>
  )
}
*/

// ============================================================================
// EXAMPLE 10: Manual Refetch (Refresh button)
// ============================================================================

// ✅ MANUAL REFETCH
/*
"use client"
import { useEvents } from "@/hooks/use-query-hooks"
import { Button } from "@/components/ui/button"

export default function EventsWithRefreshPage() {
  const { data: events = [], isLoading, isFetching, refetch } = useEvents()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Events</h1>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {isLoading ? (
        <div>Loading events...</div>
      ) : (
        events.map(event => (
          <div key={event.id}>{event.title}</div>
        ))
      )}
    </div>
  )
}
*/

// ============================================================================
// 📝 QUICK REFERENCE
// ============================================================================

/*
┌─────────────────────────────────────────────────────────────────┐
│ AVAILABLE HOOKS IN use-query-hooks.ts                          │
├─────────────────────────────────────────────────────────────────┤
│ useClubs(params)              - Get clubs list                  │
│ useClub(id, enabled)          - Get single club                 │
│ useClubMembers(clubId)        - Get club members               │
│ useClubMemberCount(clubId)    - Get member count               │
│ useClubMemberCounts(clubIds)  - Get counts for multiple clubs  │
│                                                                 │
│ useEvents()                   - Get all events                  │
│ useEvent(id, enabled)         - Get single event                │
│ useClubEvents(clubIds)        - Get events by club IDs         │
│                                                                 │
│ useUsers()                    - Get all users                   │
│ useUser(id, enabled)          - Get single user                 │
│ useProfile()                  - Get current user profile        │
│                                                                 │
│ useMajors()                   - Get all majors                  │
│ useProducts(params)           - Get products                    │
│ useWallet()                   - Get current user wallet         │
│ usePolicies()                 - Get all policies               │
│ usePolicy(id, enabled)        - Get single policy              │
│ useAttendancesByDate(date)    - Get attendances by date        │
│                                                                 │
│ usePrefetchClubs()            - Prefetch clubs                  │
│ usePrefetchEvents()           - Prefetch events                 │
│ usePrefetchUsers()            - Prefetch users                  │
└─────────────────────────────────────────────────────────────────┘
*/

// ============================================================================
// 🎯 MIGRATION CHECKLIST FOR EACH PAGE
// ============================================================================

/*
□ 1. Import hooks from "@/hooks/use-query-hooks"
□ 2. Remove useState for data
□ 3. Remove useState for loading
□ 4. Remove useState for error
□ 5. Remove useEffect with API calls
□ 6. Replace with: const { data, isLoading, error } = useHook()
□ 7. Test loading state
□ 8. Test error state
□ 9. Test data rendering
□ 10. Remove unused imports (fetchXXX functions)
*/
