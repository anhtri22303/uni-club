"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Users, Calendar, TrendingUp } from "lucide-react"
import { fetchClub } from "@/service/clubApi"

// Bảng màu theo ngành học
const categoryColors: Record<string, string> = {
  "Software Engineering": "#0052CC",
  "Artificial Intelligence": "#6A00FF",
  "Information Assurance": "#243447",
  "Data Science": "#00B8A9",
  "Business Administration": "#1E2A78",
  "Digital Marketing": "#FF3366",
  "Graphic Design": "#FFC300",
  "Multimedia Communication": "#FF6B00",
  "Hospitality Management": "#E1B382",
  "International Business": "#007F73",
  "Finance and Banking": "#006B3C",
  "Japanese Language": "#D80032",
  "Korean Language": "#5DADEC",
}

// Kiểu dữ liệu từ API
type ClubApiItem = {
  id: number
  name: string
  majorName?: string
  leaderName?: string
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
    return {
      id: String(club.id),
      name: club.name,
      category: club.majorName ?? "-",
      leaderName: club.leaderName ?? "-",
      // members: memberCount,
      members: 0,
      policy: club.majorPolicyName ?? "-",
      // events: eventCount,
      events: 0,
    }
  })

  // Filter động dựa trên dữ liệu thực tế
  const uniqueCategories = Array.from(new Set(clubs.map((c) => c.majorName).filter((v): v is string => !!v)))
  const uniqueLeaders = Array.from(new Set(clubs.map((c) => c.leaderName).filter((v): v is string => !!v)))
  const uniquePolicies = Array.from(new Set(clubs.map((c) => c.majorPolicyName).filter((v): v is string => !!v)))

  const filters = [
    {
      key: "category",
      label: "Category",
      type: "select" as const,
      options: uniqueCategories.map((cat) => ({ value: cat, label: cat })),
    },
    {
      key: "leaderName",
      label: "Leader",
      type: "select" as const,
      options: uniqueLeaders.map((l) => ({ value: l, label: l })),
    },
    {
      key: "policy",
      label: "Policy",
      type: "select" as const,
      options: uniquePolicies.map((p) => ({ value: p, label: p })),
    },
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
      render: (value: string) => {
        const color = categoryColors[value] || "#E2E8F0" // fallback nếu không có
        return (
          <Badge
            variant="secondary"
            className="max-w-[160px] truncate"
            style={{
              backgroundColor: color,
              color: "#fff", // chữ trắng cho rõ
            }}
          >
            {value || "-"}
          </Badge>
        )
      },
    },
    {
      key: "leaderName" as const,
      label: "Leader",
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
    {
      key: "id" as const,
      label: "Actions",
      render: (id: string, club: any) => (
        <button
          className="p-2 rounded hover:bg-red-100"
          title="Delete club"
          onClick={async () => {
            if (!window.confirm(`Are you sure you want to delete club '${club.name}'?`)) return;
            try {
              await (await import("@/service/clubApi")).deleteClub(club.id);
              toast({ title: "Club Deleted", description: `Club '${club.name}' has been deleted.` });
              // Reload danh sách club từ backend
              try {
                const res: any = await (await import("@/service/clubApi")).fetchClub({ page: 0, size: 20, sort: ["name"] });
                setClubs(res?.content ?? []);
              } catch (err) {
                toast({ title: "Reload Error", description: "Failed to reload club list.", variant: "destructive" });
              }
            } catch (err) {
              toast({
                title: "Delete Failed",
                description: "Cannot delete this club. Please remove all related members and events before deleting.",
                variant: "destructive"
              });
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
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
            initialPageSize={12}
            pageSizeOptions={[12, 24, 48]}
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
