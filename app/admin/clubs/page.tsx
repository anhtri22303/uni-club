"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useClubs } from "@/hooks/use-query-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAdminClubs, approveAdminClub, suspendAdminClub, AdminClub } from "@/service/adminApi/adminClubApi"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { Users, Calendar, MoreHorizontal, CheckCircle, Ban } from "lucide-react"
import { fetchMajors, Major } from "@/service/majorApi"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function AdminClubsPage() {
  const { toast } = useToast()
  const [clubs, setClubs] = useState<AdminClub[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  //State để lưu danh sách majors
  const [majors, setMajors] = useState<Major[]>([])

  // Hàm load/refetch data
  const loadClubs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Chạy song song 2 API call
      const [clubsData, majorsData] = await Promise.all([
        fetchAdminClubs({ page: 0, size: 200 }),
        fetchMajors()
      ])

      setClubs(clubsData.content)
      setMajors(majorsData)

    } catch (err: any) {
      const errMsg = err.message || "Failed to fetch data"
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

  // Cập nhật `enhancedClubs` để tìm màu từ state `majors`
  const enhancedClubs = clubs.map((club) => {
    // Tìm major tương ứng trong danh sách majors đã fetch
    const major = majors.find(m => m.name === club.majorName)

    return {
      id: String(club.id),
      name: club.name,
      category: club.majorName ?? "-",
      leaderName: club.leaderName ?? "-",
      members: club.memberCount ?? 0,
      events: club.eventCount ?? 0,
      active: club.active,
      // Thêm màu đã tìm thấy (hoặc màu fallback)
      majorColor: major ? major.colorHex : "#E2E8F0"
    }
  })

  const uniqueCategories: string[] = Array.from(new Set(clubs.map((c) => c.majorName).filter((v): v is string => !!v)))
  const uniqueLeaders: string[] = Array.from(new Set(clubs.map((c) => c.leaderName).filter((v): v is string => !!v)))

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
      render: (value: string, club: any) => { // 'club' là một item từ enhancedClubs
        const color = club.majorColor // Lấy màu động đã map
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
    // Cột Status
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
    // Cột Actions
    {
      key: "id" as const,
      label: "Actions",
      render: (id: string, club: any) => (
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
              // --- Nút Tạm dừng (SUSPEND) ---
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  {/* Thêm onSelect để ngăn Dropdown tự đóng */}
                  <DropdownMenuItem
                    className="text-yellow-600 focus:text-yellow-600"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Club suspension?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to suspend the '{club.name}' club?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-yellow-600 hover:bg-yellow-700"
                      onClick={async () => {
                        try {
                          await suspendAdminClub(Number(id));
                          toast({ title: "Club Suspended", description: `${club.name} has been suspended.` });
                          loadClubs(); // Refetch
                        } catch (err) {
                          toast({ title: "Error", description: "Cannot suspend the club.", variant: "destructive" });
                        }
                      }}
                    >
                      Suspend
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              // --- BUTTON APPROVE ---
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-green-600 focus:text-green-600"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>club approval?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to browse and activate the '{club.name}' club?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                        try {
                          await approveAdminClub(Number(id));
                          toast({ title: "Club Approved", description: `${club.name} has been activated.` });
                          loadClubs(); // Refetch
                        } catch (err) {
                          toast({ title: "Error", description: "Club cannot be approved.", variant: "destructive" });
                        }
                      }}
                    >
                      Approve
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
