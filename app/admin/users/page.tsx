"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Shield, Users, Plus, Star, Activity, Edit, Trash, Filter, X, CheckCircle } from "lucide-react"
import React from "react"
import { useUsers } from "@/hooks/use-query-hooks"
import { fetchUserById, updateUserById } from "@/service/userApi"
import { useState } from "react"
import { Modal } from "@/components/modal"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { fetchAdminUsers, fetchAdminUserDetails, banUser, unbanUser, AdminUser, AdminUserPaginationResponse, updateUserRole } from "@/service/adminUserApi"
import { useAuth } from "@/contexts/auth-context" // <-- THÊM MỚI


// Role display formatter (produce uppercase readable labels)
const formatRoleName = (roleId: string) => {
  const map: Record<string, string> = {
    student: "STUDENT",
    club_leader: "CLUB LEADER",
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
  roleName: string // Tên vai trò đã được chuẩn hóa (vd: 'student')
  majorName?: string | null
  studentCode?: string | null
  status?: string // 'ACTIVE' hoặc 'INACTIVE'
  avatarUrl?: string
  active: boolean // để xử lý logic ban/unban
}

type EnhancedUser = UserRecord & {
  membershipCount: number
  primaryRoleName: string
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  // --- Filter UI giống admin/events ---
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({ status: "ACTIVE" })
  const [showFilters, setShowFilters] = useState(false)
  const { auth } = useAuth()
  const { user: currentUser } = auth
  const { data: pagedData, isLoading: loading, error: queryError, } = useQuery<AdminUserPaginationResponse, Error>({
    queryKey: ["adminUsers", searchTerm], // Key query phụ thuộc vào searchTerm
    queryFn: () =>
      fetchAdminUsers({
        keyword: searchTerm || undefined,
        page: 0,
        size: 9999, // Lấy tất cả để filter phía client
      }),
  })

  console.log("📊 AdminUsersPage - isLoading:", loading)
  console.log("📊 AdminUsersPage - error:", queryError)

  const getRoleName = (roleId: string) => formatRoleName(roleId)

  // Map API data to UserRecord shape
  const users: UserRecord[] = (pagedData?.content || []).map((u: AdminUser) => {
    // Log first user to verify mapping
    if (pagedData?.content.indexOf(u) === 0) {
      console.log("📋 First user object from API:", u)
    }
    return {
      id: u.id,
      fullName: u.fullName || "",
      email: u.email,
      phone: u.phone ?? null,
      roleName: u.role?.toLowerCase() || "unknown",
      majorName: u.majorName || "",
      studentCode: (u as any).studentCode || null,
      status: u.active ? "ACTIVE" : "INACTIVE",
      avatarUrl: (u as any).avatarUrl || "",
      active: u.active,
    }
  }).sort((a: any, b: any) => {
    if (a.roleName < b.roleName) return -1
    if (a.roleName > b.roleName) return 1
    if (a.majorName < b.majorName) return -1
    if (a.majorName > b.majorName) return 1
    if (a.fullName < b.fullName) return -1
    if (a.fullName > b.fullName) return 1
    return 0
  })

  console.log("📋 Mapped users (total:", users.length, "):", users.slice(0, 2))

  const error = queryError ? String(queryError) : null

  // Modal / edit user state
  const [editingUserId, setEditingUserId] = useState<number | string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Form state for edit modal
  const [editFullName, setEditFullName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState<string | null>(null)
  const [editStudentCode, setEditStudentCode] = useState<string | null>(null) // <-- THÊM MỚI
  const [editMajorName, setEditMajorName] = useState<string | null>(null) // <-- THÊM MỚI
  const [editRoleName, setEditRoleName] = useState("STUDENT") // <-- THÊM MỚI
  const [originalEditRoleName, setOriginalEditRoleName] = useState("STUDENT") // <-- THÊM MỚI
  const [editLoading, setEditLoading] = useState(false) // <-- THÊM MỚI

  // --- Create User Modal State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createFullName, setCreateFullName] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createPhone, setCreatePhone] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [createStudentCode, setCreateStudentCode] = useState("")
  const [createMajorName, setCreateMajorName] = useState("")
  const [createRoleName, setCreateRoleName] = useState("STUDENT")
  const [createLoading, setCreateLoading] = useState(false)

  // --- Create User Handler ---
  const handleCreateUser = async () => {
    // Validate fields
    if (!createFullName) {
      toast({ title: "Missing Full Name", description: "Please enter full name.", variant: "destructive" });
      return;
    }
    if (!createStudentCode) {
      toast({ title: "Missing Student ID", description: "Please enter student ID.", variant: "destructive" });
      return;
    }
    if (!/^[A-Z]{2}\d{6}$/.test(createStudentCode)) {
      toast({ title: "Invalid Student ID", description: "Student ID must start with 2 letters followed by 6 digits.", variant: "destructive" });
      return;
    }
    if (!createMajorName) {
      toast({ title: "Missing Major", description: "Please enter major name.", variant: "destructive" });
      return;
    }
    if (!createEmail) {
      toast({ title: "Missing Email", description: "Please enter email.", variant: "destructive" });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(createEmail)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (!createPhone) {
      toast({ title: "Missing Phone", description: "Please enter phone number.", variant: "destructive" });
      return;
    }
    if (!/^\d{10}$/.test(createPhone)) {
      toast({ title: "Invalid Phone Number", description: "Phone number must be exactly 10 digits.", variant: "destructive" });
      return;
    }
    if (!createPassword) {
      toast({ title: "Missing Password", description: "Please enter password.", variant: "destructive" });
      return;
    }
    setCreateLoading(true);
    try {
      const res = await (await import("@/service/authApi")).signUp({
        email: createEmail,
        password: createPassword,
        fullName: createFullName,
        phone: createPhone,
        studentCode: createStudentCode,
        majorName: createMajorName,
        roleName: createRoleName,
      });
      toast({ title: "User Created", description: `Created user ${res.fullName} (${res.email})` });
      setIsCreateModalOpen(false);
      setCreateFullName("");
      setCreateEmail("");
      setCreatePhone("");
      setCreatePassword("");
      setCreateStudentCode("");
      setCreateMajorName("");
      setCreateRoleName("STUDENT");
      await reloadUsers();
    } catch (error: any) {
      toast({ title: "Create Failed", description: error.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setCreateLoading(false);
    }
  }

  // helper to reload users with React Query
  const reloadUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] })
  }

  const handleFilterChange = (filterKey: string, value: any) => {
    setActiveFilters((prev) => ({ ...prev, [filterKey]: value }))
  }
  const clearFilters = () => {
    setActiveFilters({ status: "ACTIVE" })
    setSearchTerm("")
  }
  const hasActiveFilters =
    Object.entries(activeFilters).some(
      ([k, v]) => v && v !== "all" && !(k === "status" && v === "ACTIVE")
    ) || Boolean(searchTerm)

  // Filtered users logic
  const filteredUsers = users.filter((u) => {
    // Search
    if (searchTerm) {
      const v = String(u.fullName || "").toLowerCase()
      if (!v.includes(searchTerm.toLowerCase())) return false
    }
    // Status
    const statusFilter = activeFilters["status"]
    if (statusFilter && statusFilter !== "all") {
      if ((u.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false
    }
    // Role
    const roleFilter = activeFilters["role"]
    if (roleFilter && roleFilter !== "all") {
      if ((u.roleName || "").toLowerCase() !== roleFilter.toLowerCase()) return false
    }
    // Major
    const majorFilter = activeFilters["major"]
    if (majorFilter && majorFilter !== "all") {
      if ((u.majorName || "") !== majorFilter) return false
    }
    return true
  })

  const enhancedUsers: EnhancedUser[] = filteredUsers.map((u) => ({
    ...u,
    // membershipCount: getUserMembershipCount(u.id), // <-- THAY ĐỔI
    membershipCount: (u as any).joinedClubs ?? 0, // <-- THAY ĐỔI (Sử dụng 'joinedClubs' từ API)
    primaryRoleName: getRoleName((u.roleName || "").toLowerCase()),
  }))

  const totalUsers = filteredUsers.length
  const activeStudents = filteredUsers.filter((u) => (u.roleName || "").toLowerCase() === "student").length
  const clubLeaders = filteredUsers.filter((u) => (u.roleName || "").toLowerCase() === "club_leader").length

  // Role → color mapping
  const roleColors: Record<string, string> = {
    student: "bg-green-100 text-green-700 border-green-300",
    club_leader: "bg-purple-100 text-purple-700 border-purple-300",
    uni_admin: "bg-blue-100 text-blue-700 border-blue-300",
    admin: "bg-orange-100 text-orange-700 border-orange-300",
    staff: "bg-gray-100 text-gray-700 border-gray-300",
  }

  // Build role/major options from data
  const uniqueRoles = Array.from(new Set(users.map((u) => (u.roleName || "").toLowerCase()))).filter(Boolean)
  const uniqueMajors = Array.from(new Set(users.map((u) => u.majorName || ""))).filter((m) => m && m !== "")

  // ===== Columns: keys must match EnhancedUser/UserRecord =====
  const columns = [
    {
      key: "fullName" as const,
      label: "User Information",
      render: (value: EnhancedUser["fullName"], user: EnhancedUser): JSX.Element => (
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={value}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
              {value
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
          )}
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
      key: "studentCode" as const,
      label: "Student Code",
      render: (studentCode: string | null): JSX.Element => (
        <div className="text-sm text-muted-foreground">{studentCode || "-"}</div>
      ),
    },
    {
      key: "majorName" as const,
      label: "Major Name",
      render: (majorName: string | null): JSX.Element => (
        <div className="text-sm text-muted-foreground">{majorName || "-"}</div>
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
                // Dùng 'any' để lấy cả studentCode (nếu có)
                const details: any = await fetchAdminUserDetails(user.id as number)
                setEditFullName(details?.fullName || "")
                setEditEmail(details?.email || "")
                setEditPhone(details?.phone ?? null)
                setEditStudentCode(details?.studentCode || null) // 
                setEditMajorName(details?.majorName || null) // 
                const role = details?.role?.toUpperCase() || "STUDENT" // 
                setEditRoleName(role) //
                setOriginalEditRoleName(role) //
              } catch (err) {
                console.error("Failed to fetch user details:", err)
                toast({
                  title: "Error",
                  description: "Unable to load user information.",
                  variant: "destructive",
                })
                setIsEditModalOpen(false)
              }
            }}
            title="Update user"
          >
            <Edit className="h-4 w-4" />
          </Button>

          {/* --- Logic Ban / Unban --- */}
          {user.active ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Ban user ${user.id}`}
              onClick={async () => {
                // --- VALIDATE: KHÔNG TỰ BAN ---
                if (currentUser?.userId === user.id) {
                  toast({
                    title: "Invalid Action",
                    description: "You cannot ban yourself.",
                    variant: "destructive",
                  })
                  return // Dừng hàm tại đây
                }
                const ok = confirm("Are you sure you want to ban this user?")
                if (!ok) return
                try {
                  await banUser(user.id as number)
                  toast({
                    title: "User Banned",
                    description: "User account has been locked.",
                  })
                  await reloadUsers()
                } catch (err) {
                  console.error("Ban user failed:", err)
                  toast({
                    title: "Error",
                    description: "An error occurred while banning user.",
                    variant: "destructive",
                  })
                }
              }}
              title="Ban user"
            >
              <Trash className="h-4 w-4 text-destructive" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Unban user ${user.id}`}
              onClick={async () => {
                const ok = confirm("Are you sure you want to unban this user?")
                if (!ok) return
                try {
                  await unbanUser(user.id as number)
                  toast({
                    title: "User Unbanned",
                    description: "User account has been activated.",
                  })
                  await reloadUsers()
                } catch (err) {
                  console.error("Unban user failed:", err)
                  toast({
                    title: "Error",
                    description: "An error occurred while unbanning user.",
                    variant: "destructive",
                  })
                }
              }}
              title="Unban user"
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  // --- Xử lý lưu cho cả Profile và Role ---
  const handleModalSave = async () => {
    if (!editingUserId) return
    setEditLoading(true)

    let updateProfileSuccess = false
    let updateRoleSuccess = false
    let profileError: string | null = null
    let roleError: string | null = null

    // --- 1. Cập nhật thông tin Profile (dùng userApi) ---
    try {
      const payload = {
        fullName: editFullName,
        email: editEmail,
        phone: editPhone,
        studentCode: editStudentCode || null,
        majorName: editMajorName || null,
      }
      // Giả sử updateUserById (từ userApi) chấp nhận các trường mới
      const res = await updateUserById(editingUserId, payload)
      if (res && (res.success || res.updated)) {
        updateProfileSuccess = true
      } else {
        profileError = (res as any)?.message || "Update profile failed"
      }
    } catch (err: any) {
      console.error("Update profile failed:", err)
      profileError = (err as Error).message || "An error occurred while updating profile."
    }

    // --- 2. Cập nhật Role (dùng adminUserApi) (Chỉ khi có thay đổi) ---
    if (editRoleName !== originalEditRoleName) {
      if (originalEditRoleName === "ADMIN" && editRoleName !== "ADMIN") {
        roleError = "An ADMIN user cannot be demoted."
        updateRoleSuccess = false // Đánh dấu là lỗi
      } else {
        try {
          await updateUserRole({
            id: editingUserId as number,
            roleName: editRoleName,
          })
          updateRoleSuccess = true
        } catch (err: any) {
          console.error("Update role failed:", err)
          roleError = (err as Error).message || "An error occurred while updating role."
        }
      }
    } else {
      // Vai trò không đổi, coi như thành công
      updateRoleSuccess = true
    }

    setEditLoading(false)

    // --- 3. Báo cáo kết quả ---
    if (updateProfileSuccess && updateRoleSuccess) {
      toast({ title: "Update Successful", description: "User information has been updated." })
      setIsEditModalOpen(false)
      setEditingUserId(null)
      await reloadUsers()
    } else {
      // Xử lý lỗi (toàn bộ hoặc một phần)
      let title = "Update Failed"
      let description = ""
      if (profileError) description += `Profile: ${profileError}. `
      if (roleError) description += `Role: ${roleError}.`
      if (!description) description = "An unknown error occurred."

      if (updateProfileSuccess && !updateRoleSuccess)
        title = "Partial Success (Profile OK, Role Failed)"
      if (!updateProfileSuccess && updateRoleSuccess)
        title = "Partial Success (Profile Failed, Role OK)"

      toast({ title, description, variant: "destructive" })

      // Tải lại dữ liệu để hiển thị bất kỳ cập nhật thành công một phần nào
      if (updateProfileSuccess || updateRoleSuccess) {
        await reloadUsers()
      }
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
                  <CardTitle className="text-xs font-medium text-green-700 dark:text-green-300">Members</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-500 rounded-md">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-900 dark:text-green-100">{activeStudents}</div>
                      <p className="text-xs text-green-600 dark:text-green-400">Member accounts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <CardHeader className="pb-1 px-4 pt-3">
                  <CardTitle className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    Club Leaders
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
              variant="default"
              size="lg"
              className="bg-primary text-white hover:bg-primary/90 shadow-lg self-start md:self-start flex items-center gap-2"
              aria-label="Add user"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-5 w-5" />Add User
            </Button>

            {/* Create User Modal */}
            {isCreateModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 w-full max-w-md relative">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    ×
                  </button>
                  <h2 className="text-xl font-bold mb-4">Create User</h2>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full border rounded px-3 py-2"
                      value={createFullName}
                      onChange={e => setCreateFullName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Student Code (e.g. SE123456)"
                      className="w-full border rounded px-3 py-2"
                      value={createStudentCode}
                      onChange={e => setCreateStudentCode(e.target.value.toUpperCase())}
                    />
                    <input
                      type="text"
                      placeholder="Major Name"
                      className="w-full border rounded px-3 py-2"
                      value={createMajorName}
                      onChange={e => setCreateMajorName(e.target.value)}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full border rounded px-3 py-2"
                      value={createEmail}
                      onChange={e => setCreateEmail(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Phone (10 digits)"
                      className="w-full border rounded px-3 py-2"
                      value={createPhone}
                      onChange={e => setCreatePhone(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full border rounded px-3 py-2"
                      value={createPassword}
                      onChange={e => setCreatePassword(e.target.value)}
                    />
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={createRoleName}
                      onChange={e => setCreateRoleName(e.target.value)}
                      title="Role Name"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="CLUB_LEADER">CLUB LEADER</option>
                      <option value="UNI_ADMIN">UNIVERSITY ADMIN</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="STAFF">STAFF</option>
                    </select>
                  </div>
                  <Button
                    className="mt-5 w-full"
                    onClick={handleCreateUser}
                    disabled={createLoading}
                  >
                    {createLoading ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Filter UI giống admin/events */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search by name"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    {Object.values(activeFilters).filter((v, i) => v && v !== "all" && !(Object.keys(activeFilters)[i] === "status" && v === "ACTIVE")).length + (searchTerm ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>
            {showFilters && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Filters</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select value={activeFilters["status"] || "all"} onValueChange={v => handleFilterChange("status", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Role</label>
                    <Select value={activeFilters["role"] || "all"} onValueChange={v => handleFilterChange("role", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {uniqueRoles.map((role) => (
                          <SelectItem key={role} value={role}>{getRoleName(role)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Major</label>
                    <Select value={activeFilters["major"] || "all"} onValueChange={v => handleFilterChange("major", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {uniqueMajors.map((major) => (
                          <SelectItem key={major} value={major}>{major}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
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
              />
            </CardContent>
          </Card>
          {/* --- JSX cho Edit user modal --- */}
          <Modal
            open={isEditModalOpen}
            onOpenChange={(open) => {
              setIsEditModalOpen(open)
              if (!open) {
                setEditingUserId(null)
              }
            }}
            title="Update User"
            description="Update user information"
          >
            <div className="space-y-4 p-2">
              <div>
                <Label htmlFor="edit-fullName">Fullname</Label>
                <Input
                  id="edit-fullName"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="mt-2 border-slate-300"
                />
              </div>

              {/* Student Code */}
              <div>
                <Label htmlFor="edit-studentCode">Student Code</Label>
                <Input
                  id="edit-studentCode"
                  value={editStudentCode || ""}
                  onChange={(e) => setEditStudentCode(e.target.value.toUpperCase() || null)}
                  className="mt-2 border-slate-300"
                />
              </div>

              {/* Major Name */}
              <div>
                <Label htmlFor="edit-majorName">Major Name</Label>
                <Input
                  id="edit-majorName"
                  value={editMajorName || ""}
                  onChange={(e) => setEditMajorName(e.target.value || null)}
                  className="mt-2 border-slate-300"
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editPhone || ""}
                  onChange={(e) => setEditPhone(e.target.value || null)}
                  className="mt-2 border-slate-300"
                />
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="edit-roleName">Role</Label>
                <Select value={editRoleName} onValueChange={setEditRoleName}>
                  <SelectTrigger id="edit-roleName" className="mt-2 border-slate-300">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">STUDENT</SelectItem>
                    <SelectItem value="CLUB_LEADER">CLUB LEADER</SelectItem>
                    <SelectItem value="UNI_ADMIN">UNIVERSITY ADMIN</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="STAFF">STAFF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingUserId(null)
                  }}
                  disabled={editLoading} // <-- THÊM MỚI
                >
                  Cancel
                </Button>
                <Button onClick={handleModalSave} disabled={editLoading}> {/* <-- THÊM MỚI */}
                  {editLoading ? "Updating..." : "Update"} {/* <-- THÊM MỚI */}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
