"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
// Remove Button import (no add club modal)
import { DataTable } from "@/components/data-table"
import { useToast } from "@/hooks/use-toast"
import { Users, Trash, Plus } from "lucide-react"
import { fetchClub } from "@/service/clubApi"
// Thêm import useRef nếu cần
// Remove useRef import (not needed)

type ClubApiItem = {
  id: number
  name: string
  description?: string
  majorPolicyName?: string
  majorName?: string
  major?: { name?: string }
  leaderName?: string
}
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

export default function UniStaffClubsPage() {
  const { toast } = useToast()
  const [clubs, setClubs] = useState<ClubApiItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Remove add club modal and related states

  // Fetch club list
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res: any = await fetchClub({ page: 0, size: 10, sort: ["name"] })
        if (mounted) setClubs(res?.content ?? [])
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

  // Map API data to match admin/clubs
  const enhancedClubs = clubs.map((club) => ({
    id: String(club.id),
    name: club.name,
    category: club.majorName ?? "-",
    leaderName: club.leaderName ?? "-",
    members: 0,
    policy: club.majorPolicyName ?? "-",
    events: 0,
  }))

  // Delete logic matches admin/clubs
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete club '${name}'?`)) return;
    try {
      await (await import("@/service/clubApi")).deleteClub(id);
      toast({ title: "Club Deleted", description: `Club '${name}' has been deleted.` });
      // Reload club list
      try {
        const res: any = await fetchClub({ page: 0, size: 10, sort: ["name"] });
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
  }

  // Dynamic filters based on actual data (like admin/clubs)
  const uniqueCategories = Array.from(new Set(clubs.map((c) => c.majorName).filter((v): v is string => !!v)));
  const uniqueLeaders = Array.from(new Set(clubs.map((c) => c.leaderName).filter((v): v is string => !!v)));
  const uniquePolicies = Array.from(new Set(clubs.map((c) => c.majorPolicyName).filter((v): v is string => !!v)));

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
  ];

  const columns = [
    {
      key: "name" as const,
      label: "Club Name",
      render: (value: string, club: any) => (
        <div>
          <div className="font-medium">{value}</div>
        </div>
      ),
    },
    {
      key: "category" as const,
      label: "Category",
      render: (value: string) => {
        const color = categoryColors[value] || "#E2E8F0"
        return (
          <Badge
            variant="secondary"
            className="max-w-[160px] truncate"
            style={{ backgroundColor: color, color: "#fff" }}
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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
          onClick={() => handleDelete(club.id, club.name)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      ),
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Club Management</h1>
            <p className="text-muted-foreground">View and manage all student clubs</p>
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
