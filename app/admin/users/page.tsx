"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/contexts/data-context"
import { Mail, Shield, Users, Plus, Star, Activity, Edit, Trash } from "lucide-react"
import React from "react"

// API
import { fetchUser, fetchUserById, updateUserById } from "@/service/userApi"
import { useEffect, useState } from "react"
import { Modal } from "@/components/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

// Role display formatter (produce uppercase readable labels)
const formatRoleName = (roleId: string) => {
  const map: Record<string, string> = {
    student: "STUDENT",
    club_manager: "CLUB MANAGER",
    uni_admin: "UNIVERSITY ADMIN",
    admin: "ADMIN",
    staff: "STAFF",
  }
  return map[roleId] || roleId.replace(/_/g, " ").toUpperCase()
}

// ===== Types =====
interface UserRecord {
  id: string | number
  fullName: string
  email: string
  phone?: string | null
  roleName: string
  status?: string
}

type EnhancedUser = UserRecord & {
  membershipCount: number
  primaryRoleName: string
}

export default function AdminUsersPage() {
  const { clubMemberships } = useData()

  const getUserMembershipCount = (userId: string | number) =>
    clubMemberships.filter((m) => m.userId === userId && m.status === "APPROVED").length

  const getRoleName = (roleId: string) => formatRoleName(roleId)

  // Local state for users fetched from the API
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Modal / edit user state
  const [editingUserId, setEditingUserId] = useState<number | string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Form state for edit modal
  const [editFullName, setEditFullName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchUser()
      .then((data) => {
        if (!mounted) return
        // Map API response fields to our UserRecord shape
        const mapped = (data || []).map((u: any) => ({
          id: u.id,
          fullName: u.fullName || u.name || "",
          email: u.email,
          phone: u.phone ?? null,
          roleName: u.roleName?.toLowerCase() || (u.defaultRole ?? "unknown").toLowerCase(),
          status: u.status,
        }))
        setUsers(mapped)
        setError(null)
      })
      .catch((err) => {
        console.error("Failed to fetch users for admin page:", err)
        setError(String(err))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  // helper to reload users
  const reloadUsers = async () => {
    setLoading(true)
    try {
      const data = await fetchUser()
      const mapped = (data || []).map((u: any) => ({
        id: u.id,
        fullName: u.fullName || u.name || "",
        email: u.email,
        phone: u.phone ?? null,
        roleName: u.roleName?.toLowerCase() || (u.defaultRole ?? "unknown").toLowerCase(),
        status: u.status,
      }))
      setUsers(mapped)
      setError(null)
    } catch (err) {
      console.error("Failed to reload users:", err)
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  // Only show users whose status is ACTIVE
  const visibleUsers = users.filter((u) => ((u.status || "").toLowerCase() === "active"))

  const enhancedUsers: EnhancedUser[] = visibleUsers.map((u) => ({
    ...u,
    membershipCount: getUserMembershipCount(u.id),
    primaryRoleName: getRoleName((u.roleName || "").toLowerCase()),
  }))

  const totalUsers = visibleUsers.length
  const activeStudents = visibleUsers.filter((u) => (u.roleName || "").toLowerCase() === "student").length
  const clubLeaders = visibleUsers.filter((u) => (u.roleName || "").toLowerCase() === "club_manager").length

  // Role → color mapping
  const roleColors: Record<string, string> = {
    student: "bg-green-100 text-green-700 border-green-300",
    club_manager: "bg-purple-100 text-purple-700 border-purple-300",
    uni_admin: "bg-blue-100 text-blue-700 border-blue-300",
    admin: "bg-orange-100 text-orange-700 border-orange-300",
    staff: "bg-gray-100 text-gray-700 border-gray-300",
  }

  // Build role options from data (unique defaultRole values)
  const uniqueRoles = Array.from(new Set(users.map((u) => (u.roleName || "").toLowerCase())))
  const filters = [
    {
      key: "primaryRoleName",
      label: "Primary Role",
      type: "select" as const,
      options: uniqueRoles.map((roleId) => ({ value: roleId, label: getRoleName(roleId) })),
    },
    {
      key: "membershipCount",
      label: "Club Memberships",
      type: "range" as const,
    },
  ]

  // ===== Columns: keys must match EnhancedUser/UserRecord =====
  const columns = [
    {
      key: "fullName" as const,
      label: "User Information",
      render: (value: EnhancedUser["fullName"], user: EnhancedUser): JSX.Element => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
            {value
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "primaryRoleName" as const,
      label: "Role",
      render: (role: EnhancedUser["primaryRoleName"]): JSX.Element => {
        const roleKey = (role || "").toLowerCase().replace(/ /g, "_")
        const style = roleColors[roleKey] || "bg-gray-100 text-gray-700 border-gray-300"
        return (
          <Badge className={`text-xs px-2 py-0.5 border ${style}`}>{role}</Badge>
        )
      },
    },
    {
      key: "phone" as const,
      label: "Phone",
      render: (phone: EnhancedUser["phone"]): JSX.Element => (
        <div className="text-sm text-muted-foreground">{phone || "-"}</div>
      ),
    },
    {
      key: "membershipCount" as const,
      label: "Club Memberships",
      render: (count: EnhancedUser["membershipCount"], _user: EnhancedUser): JSX.Element => (
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{count}</span>
          </div>
          <div className="text-xs text-muted-foreground">clubs</div>
        </div>
      ),
    },
    {
      key: "id" as const,
      label: "Actions",
      render: (_: EnhancedUser["id"], user: EnhancedUser): JSX.Element => (
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Update user ${user.id}`}
            onClick={async () => {
              // open modal and load details
              setEditingUserId(user.id)
              setIsEditModalOpen(true)
              try {
                const details: any = await fetchUserById(user.id)
                setEditFullName(details?.fullName || details?.name || "")
                setEditEmail(details?.email || "")
                setEditPhone(details?.phone ?? null)
              } catch (err) {
                console.error("Failed to fetch user details:", err)
                toast({ title: "Lỗi", description: "Không thể tải thông tin người dùng." })
                setIsEditModalOpen(false)
              }
            }}
            title="Update user"
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            aria-label={`Delete user ${user.id}`}
            onClick={async () => {
              // confirm before deleting
              const ok = confirm('Xác nhận xóa người dùng này?')
              if (!ok) return
              try {
                // call delete API
                const res: any = await (await import('@/service/userApi')).deleteUserById(user.id)
                // If backend returns { success: true, message: 'Deleted', data: null }
                if (res && res.success === true) {
                  toast({ title: res.message || 'Đã xóa', description: '' })
                  // refresh list
                  await reloadUsers()
                } else if (res && (res.deleted || res.success)) {
                  // fallback for other flags
                  toast({ title: res.message || 'Đã xóa', description: '' })
                  await reloadUsers()
                } else {
                  toast({ title: 'Thất bại', description: (res && res.message) || 'Xóa người dùng thất bại.' })
                }
              } catch (err) {
                console.error('Delete user failed:', err)
                toast({ title: 'Lỗi', description: 'Có lỗi khi xóa người dùng.' })
              }
            }}
            title="Delete user"
          >
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  // Save handler for modal
  const handleModalSave = async () => {
    if (!editingUserId) return
    try {
      const payload = {
        fullName: editFullName,
        email: editEmail,
        phone: editPhone,
      }
      const res = await updateUserById(editingUserId, payload)
      if (res && (res.success || res.updated)) {
        toast({ title: "Cập nhật thành công", description: "Thông tin người dùng đã được cập nhật." })
        setIsEditModalOpen(false)
        setEditingUserId(null)
        // reload users to reflect changes
        await reloadUsers()
      } else {
        toast({ title: "Thất bại", description: (res as any)?.message || "Cập nhật thất bại" })
      }
    } catch (err) {
      console.error("Update user failed:", err)
      toast({ title: "Lỗi", description: "Có lỗi khi cập nhật người dùng." })
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Row: 3 small cards + "+" button on the right */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardHeader className="pb-1 px-4 pt-3">
                  <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Users</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500 rounded-md">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{totalUsers}</div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Active accounts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                <CardHeader className="pb-1 px-4 pt-3">
                  <CardTitle className="text-xs font-medium text-green-700 dark:text-green-300">Students</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-500 rounded-md">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-900 dark:text-green-100">{activeStudents}</div>
                      <p className="text-xs text-green-600 dark:text-green-400">Student accounts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <CardHeader className="pb-1 px-4 pt-3">
                  <CardTitle className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    Club Managers
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500 rounded-md">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-900 dark:text-purple-100">{clubLeaders}</div>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Leadership roles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* "+" button */}
            <Button
              size="lg"
              className="bg-primary text-white hover:bg-primary/90 shadow-lg self-start md:self-start"
              aria-label="Add user"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Data table */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-0">
              <DataTable
                title=""
                data={enhancedUsers}
                columns={columns}
                searchKey="fullName"
                searchPlaceholder="Search users by name..."
                filters={filters}
              />
            </CardContent>
          </Card>
            {/* Edit user modal */}
            <Modal
              open={isEditModalOpen}
              onOpenChange={(open) => {
                setIsEditModalOpen(open)
                if (!open) {
                  setEditingUserId(null)
                }
              }}
              title="Update user"
              description="Cập nhật thông tin người dùng"
            >
              <div className="space-y-4 p-2">
                <div>
                  <Label htmlFor="edit-fullName">Fullname</Label>
                  <Input id="edit-fullName" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" value={editPhone || ""} onChange={(e) => setEditPhone(e.target.value || null)} />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingUserId(null); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleModalSave}>
                    Update
                  </Button>
                </div>
              </div>
            </Modal>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
