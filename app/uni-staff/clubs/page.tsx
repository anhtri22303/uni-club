"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { useToast } from "@/hooks/use-toast"
import { Users, Trash, Plus } from "lucide-react"
import { fetchClub, deleteClub, createClub } from "@/service/clubApi"
// Thêm import useRef nếu cần
import { useRef } from "react"

type ClubApiItem = {
  id: number
  name: string
  description?: string
  majorPolicyName?: string
  majorName?: string
  major?: { name?: string }
}

export default function UniStaffClubsPage() {
  const { toast } = useToast()
  const [clubs, setClubs] = useState<ClubApiItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addForm, setAddForm] = useState({ name: "", description: "", majorPolicy: "" })

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

  const enhancedClubs = clubs.map((club) => ({
    id: String(club.id),
    name: club.name,
    category: club.majorName ?? (club as any).major?.name ?? "",
    description: club.description,
    members: 0, // placeholder, chưa có dữ liệu số thành viên
    founded: 0,
    location: "",
    policy: club.majorPolicyName ?? "",
    actions: undefined, // dummy field for actions column
  }))

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteClub(id)
      setClubs((prev) => prev.filter((c) => String(c.id) !== id))
      toast({ title: "Deleted", description: "Club deleted successfully" })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to delete club" })
    } finally {
      setDeletingId(null)
    }
  }

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
    {
      key: "members",
      label: "Member Count",
      type: "range" as const,
    },
    {
      key: "founded",
      label: "Founded Year",
      type: "range" as const,
    },
    {
      key: "location",
      label: "Location",
      type: "select" as const,
      options: [
        { value: "Campus A", label: "Campus A" },
        { value: "Field B", label: "Field B" },
        { value: "Studio C", label: "Studio C" },
        { value: "Online", label: "Online" },
        { value: "Hall D", label: "Hall D" },
        { value: "Auditorium", label: "Auditorium" },
        { value: "Lab E", label: "Lab E" },
        { value: "Gym F", label: "Gym F" },
        { value: "Studio G", label: "Studio G" },
        { value: "Lab H", label: "Lab H" },
        { value: "Campus I", label: "Campus I" },
        { value: "Hall J", label: "Hall J" },
        { value: "Court K", label: "Court K" },
        { value: "Library L", label: "Library L" },
        { value: "Community Center M", label: "Community Center M" },
        { value: "Theater N", label: "Theater N" },
        { value: "Lab O", label: "Lab O" },
      ],
    },
  ]

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
      render: (value: string) => (
        <Badge title={value || ""} variant={value ? "secondary" : "outline"} className="max-w-[160px] truncate">
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
        <div className="max-w-[220px]">
          <Badge title={value || ""} variant={"outline"} className="truncate max-w-full">
            {value || "-"}
          </Badge>
        </div>
      ),
    },
    {
      key: "actions" as const,
      label: "Actions",
        render: (_: any, club: any) => (
          <Button
            variant="destructive"
            size="sm"
            disabled={deletingId === club.id}
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this club?")) {
                handleDelete(club.id)
              }
            }}
            aria-label={`Delete ${club.name}`}
            title="Delete"
          >
            {deletingId === club.id ? (
              "Deleting..."
            ) : (
              <Trash className="h-4 w-4" />
            )}
          </Button>
        ),
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Club Management</h1>
              <p className="text-muted-foreground">View and manage all clubs in the university</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} variant="default" title="Add club" aria-label="Add club">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Modal thêm club mới */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-lg shadow-lg p-6 min-w-[340px] w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Add New Club</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setAddLoading(true)
                    setAddError(null)
                    try {
                      // Gọi API tạo club mới (giả lập, cần implement thực tế ở service/clubApi)
                      // Giả lập createClub trả về club mới
                      const newClub = {
                        id: Date.now(),
                        name: addForm.name,
                        description: addForm.description,
                        majorPolicyName: addForm.majorPolicy,
                      }
                      // TODO: Thay bằng await createClub(addForm)
                      setClubs((prev) => [newClub, ...prev])
                      setShowAddModal(false)
                      setAddForm({ name: "", description: "", majorPolicy: "" })
                      toast({ title: "Success", description: "Club created successfully" })
                    } catch (err: any) {
                      setAddError(err?.message || "Failed to create club")
                    } finally {
                      setAddLoading(false)
                    }
                  }}
                >
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Club Name</label>
                    <input
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                      value={addForm.name}
                      onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Enter club name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      className="w-full border rounded px-3 py-2 text-sm"
                      rows={2}
                      value={addForm.description}
                      onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Enter description"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Major Policy</label>
                    <input
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={addForm.majorPolicy}
                      onChange={e => setAddForm(f => ({ ...f, majorPolicy: e.target.value }))}
                      placeholder="Enter major policy"
                    />
                  </div>
                  {addError && <div className="text-sm text-destructive mb-2">{addError}</div>}
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={addLoading}>
                      Close
                    </Button>
                    <Button type="submit" disabled={addLoading || !addForm.name.trim()}>
                      {addLoading ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

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

          {loading && <div className="text-center text-sm text-muted-foreground">Loading clubs...</div>}

          {error && <div className="text-center text-sm text-destructive">Error: {error}</div>}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
