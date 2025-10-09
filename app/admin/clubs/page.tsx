"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Users, Calendar, TrendingUp } from "lucide-react"
import { fetchClub } from "@/service/clubApi"

// Kiểu dữ liệu từ API
type ClubApiItem = {
  id: number
  name: string
  majorName?: string
  description?: string
  majorPolicyName?: string
  memberCount?: number
  eventCount?: number
  // activityLevel?: "High" | "Medium" | "Low"
}

export default function AdminClubsPage() {
  const { toast } = useToast()
  const [clubs, setClubs] = useState<ClubApiItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res: any = await fetchClub({ page: 0, size: 20, sort: ["name"] })
        if (mounted) {
          setClubs(res?.content ?? [])
        }
      } catch (err: any) {
        console.error(err)
        if (mounted) setError(err?.message ?? "Failed to load clubs")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  // Map dữ liệu API sang định dạng bảng
  const enhancedClubs = clubs.map((club) => {
    // const memberCount = club.memberCount ?? Math.floor(Math.random() * 50) + 10 // nếu API chưa có field
    // const eventCount = club.eventCount ?? Math.floor(Math.random() * 10)
    // const activityScore = memberCount + eventCount
    // const activityLevel =
    //   activityScore > 30 ? "High" : activityScore > 15 ? "Medium" : "Low"

    return {
      id: String(club.id),
      name: club.name,
      category: club.majorName ?? "-",
      description: club.description || "-",
      // members: memberCount,
      members: 0,
      policy: club.majorPolicyName ?? "-",
      // events: eventCount,
      events: 0,
      // activityLevel,
    }
  })

  const filters = [
    {
      key: "category",
      label: "Category",
      type: "select" as const,
      options: [
        { value: "Technology", label: "Technology" },
        { value: "Sports", label: "Sports" },
        { value: "Arts", label: "Arts" },
        { value: "Academic", label: "Academic" },
        { value: "Social", label: "Social" },
      ],
    },
    // {
    //   key: "activityLevel",
    //   label: "Activity Level",
    //   type: "select" as const,
    //   options: [
    //     { value: "High", label: "High" },
    //     { value: "Medium", label: "Medium" },
    //     { value: "Low", label: "Low" },
    //   ],
    // },
  ]

  const columns = [
    {
      key: "name" as const,
      label: "Club Name",
      render: (value: string, club: any) => (
        <div>
          <div className="font-medium">{value}</div>
          {/* <div className="text-sm text-muted-foreground">{club.category}</div> */}
        </div>
      ),
    },
    {
      key: "category" as const,
      label: "Category",
      render: (value: string) => (
        <Badge variant={value ? "secondary" : "outline"} className="max-w-[160px] truncate">
          {value || "-"}
        </Badge>
      ),
    },
    {
      key: "description" as const,
      label: "Description",
      render: (value: string) => (
        <div className="text-sm text-muted-foreground max-w-[180px] truncate" title={value}>
          {value || "-"}
        </div>
      ),
    },
    {
      key: "members" as const,
      label: "Members",
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {value}
        </div>
      ),
    },
    {
      key: "policy" as const,
      label: "Major Policy",
      render: (value: string) => (
        <Badge title={value || ""} variant={"outline"} className="truncate max-w-[200px]">
          {value || "-"}
        </Badge>
      ),
    },
    {
      key: "events" as const,
      label: "Events",
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {value}
        </div>
      ),
    },
    // {
    //   key: "activityLevel" as const,
    //   label: "Activity Level",
/*************  ✨ Windsurf Command 🌟  *************/
    //   render: (value: "High" | "Medium" | "low") => {
    //     console.log("Render activity level badge with value:", value)
    //     const variant = value === "High"
    //       ? "default"
    //       : value === "Medium"
    //       ? "secondary"
    //       : "outline"
    //     console.log("Render activity level badge with variant:", variant)
    //     return (
    //       <Badge variant={variant}>
    //         <TrendingUp className="h-3 w-3 mr-1" />
    //         {value}
    //       </Badge>
    //     )
    //   render: (value: "High" | "Medium" | "Low") => (
    //     <Badge
    //       variant={
    //         value === "High"
    //           ? "default"
    //           : value === "Medium"
    //           ? "secondary"
    //           : "outline"
    //       }
    //     >
    //       <TrendingUp className="h-3 w-3 mr-1" />
    //       {value}
    //     </Badge>
    //   ),
/*******  2c527d3a-0876-4ea2-b576-a59839ef6b4b  *******/
    // },
  ]

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Club Management</h1>
            <p className="text-muted-foreground">
              View and manage all student clubs
            </p>
          </div>

          <DataTable
            title="Club Directory"
            data={enhancedClubs}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search clubs..."
            filters={filters}
            initialPageSize={6}
            pageSizeOptions={[6, 12, 24, 48]}
          />

          {loading && (
            <div className="text-center text-sm text-muted-foreground">
              Loading clubs...
            </div>
          )}
          {error && (
            <div className="text-center text-sm text-destructive">
              Error: {error}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
