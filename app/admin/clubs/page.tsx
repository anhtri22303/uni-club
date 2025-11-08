"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useClubs } from "@/hooks/use-query-hooks"
import { getClubMemberCount } from "@/service/clubApi"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAdminClubs, approveAdminClub, suspendAdminClub, AdminClub } from "@/service/adminApi/adminClubApi"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { Users, Calendar, MoreHorizontal, CheckCircle, Ban } from "lucide-react"

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
  approvedEvents?: number
  // activityLevel?: "High" | "Medium" | "Low"
}

export default function AdminClubsPage() {
  const { toast } = useToast()
  const [clubs, setClubs] = useState<AdminClub[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hàm load/refetch data
  const loadClubs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch một danh sách lớn để cho DataTable xử lý filter/search/pagination phía client
      // (Giống logic cũ là lấy size 100)
      const data = await fetchAdminClubs({ page: 0, size: 200 })
      setClubs(data.content)
    } catch (err: any) {
      const errMsg = err.message || "Failed to fetch clubs"
      setError(errMsg)
      toast({ title: "Error", description: errMsg, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data lần đầu khi component mount
  useEffect(() => {
    loadClubs()
  }, []) // Chỉ chạy 1 lần

  const [clubsWithData, setClubsWithData] = useState<ClubApiItem[]>([])

  const enhancedClubs = clubs.map((club) => {
    return {
      id: String(club.id),
      name: club.name,
      category: club.majorName ?? "-",
      leaderName: club.leaderName ?? "-",
      members: club.memberCount ?? 0,
      events: club.eventCount ?? 0, 
      active: club.active, 
    }
  })

  const uniqueCategories: string[] = Array.from(new Set(clubsWithData.map((c: any) => c.majorName).filter((v: any): v is string => !!v)))
  const uniqueLeaders: string[] = Array.from(new Set(clubsWithData.map((c: any) => c.leaderName).filter((v: any): v is string => !!v)))

  const filters = [
    {
      key: "category",
      label: "Category",
      type: "select" as const,
      options: uniqueCategories.map((cat: string) => ({ value: cat, label: cat })),
    },
    {
      key: "leaderName",
      label: "Leader",
      type: "select" as const,
      options: uniqueLeaders.map((l: string) => ({ value: l, label: l })),
    },
    // THAY ĐỔI Ở ĐÂY: Chuyển giá trị boolean thành string
    {
      key: "active",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "true", label: "Active" },    // Đổi true -> "true"
        { value: "false", label: "Suspended" }, // Đổi false -> "false"
      ],
    },
  ]

  const columns = [
    {
      key: "name" as const,
      label: "Club Name",
      render: (value: string) => (
        <div className="font-medium">{value}</div>
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
    // THÊM: Cột Status
    {
      key: "active" as const,
      label: "Status",
      render: (value: boolean) => (
        <Badge
          variant={value ? "default" : "destructive"}
          className={value ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {value ? "Active" : "Suspended"}
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
    // CẬP NHẬT: Cột Actions
    {
      key: "id" as const,
      label: "Actions",
      render: (id: string, club: any) => ( // 'club' là từ 'enhancedClubs'
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {club.active ? (
              // Nút Tạm dừng
              <DropdownMenuItem
                className="text-yellow-600 focus:text-yellow-600"
                onClick={async () => {
                  if (!window.confirm(`Bạn có chắc muốn tạm dừng CLB '${club.name}'?`)) return;
                  try {
                    await suspendAdminClub(Number(id));
                    toast({ title: "Club Suspended", description: `${club.name} đã bị tạm dừng.` });
                    loadClubs(); // Refetch
                  } catch (err) {
                    toast({ title: "Error", description: "Không thể tạm dừng CLB.", variant: "destructive" });
                  }
                }}
              >
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </DropdownMenuItem>
            ) : (
              // Nút Duyệt
              <DropdownMenuItem
                className="text-green-600 focus:text-green-600"
                onClick={async () => {
                  if (!window.confirm(`Bạn có chắc muốn duyệt CLB '${club.name}'?`)) return;
                  try {
                    await approveAdminClub(Number(id));
                    toast({ title: "Club Approved", description: `${club.name} đã được kích hoạt.` });
                    loadClubs(); // Refetch
                  } catch (err) {
                    toast({ title: "Error", description: "Không thể duyệt CLB.", variant: "destructive" });
                  }
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
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

          {isLoading && (
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
