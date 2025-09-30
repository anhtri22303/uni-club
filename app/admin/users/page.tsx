"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/contexts/data-context"
import { Mail, Shield, Users, Plus, Star, Activity } from "lucide-react"
import React from "react"

// Import data
import usersJson from "@/src/data/users.json"
import roles from "@/src/data/roles.json"

// ===== Types =====
interface UserRecord {
  id: string
  fullName: string
  email: string
  password: string
  roles: string[]
  defaultRole: string
  points: number
}

type EnhancedUser = UserRecord & {
  membershipCount: number
  primaryRoleName: string
}

export default function AdminUsersPage() {
  const { clubMemberships } = useData()

  const getUserMembershipCount = (userId: string) =>
    clubMemberships.filter((m) => m.userId === userId && m.status === "APPROVED").length

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name || roleId

  const users = usersJson as UserRecord[]

  const enhancedUsers: EnhancedUser[] = users.map((u) => ({
    ...u,
    membershipCount: getUserMembershipCount(u.id),
    primaryRoleName: getRoleName(u.defaultRole),
  }))

  const totalUsers = users.length
  const activeStudents = users.filter((u) => u.defaultRole === "student").length
  const clubLeaders = users.filter((u) => u.defaultRole === "club_lead").length

  // Role → color mapping
  const roleColors: Record<string, string> = {
    student: "bg-green-100 text-green-700 border-green-300",
    club_lead: "bg-purple-100 text-purple-700 border-purple-300",
    uni_admin: "bg-blue-100 text-blue-700 border-blue-300",
    partner_admin: "bg-orange-100 text-orange-700 border-orange-300",
    guest: "bg-gray-100 text-gray-700 border-gray-300",
  }

  const filters = [
    {
      key: "defaultRole",
      label: "Primary Role",
      type: "select" as const,
      options: roles.map((role) => ({ value: role.id, label: role.name })),
    },
    {
      key: "membershipCount",
      label: "Club Memberships",
      type: "range" as const,
    },
  ]

  // ===== Columns: dùng key thuộc keyof EnhancedUser =====
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
      key: "roles" as const,
      label: "All Roles",
      render: (roleIds: EnhancedUser["roles"]): JSX.Element => (
        <div className="flex flex-wrap gap-1">
          {roleIds.map((roleId) => {
            const style = roleColors[roleId] || "bg-gray-100 text-gray-700 border-gray-300"
            return (
              <Badge key={roleId} className={`text-xs px-2 py-0.5 border ${style}`} title={getRoleName(roleId)}>
                {getRoleName(roleId)}
              </Badge>
            )
          })}
        </div>
      ),
    },
    {
      key: "points" as const,
      label: "Points",
      render: (points: EnhancedUser["points"]): JSX.Element => (
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <span className="font-semibold text-primary">{(points || 0).toLocaleString()}</span>
        </div>
      ),
    },
    // ⛳️ Sửa key từ "memberships" -> "membershipCount" (đúng với dữ liệu)
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
    // ⛳️ "status" không có trong dữ liệu → dùng key hợp lệ, ví dụ "id"
    {
      key: "id" as const,
      label: "Status",
      render: (_: EnhancedUser["id"], _user: EnhancedUser): JSX.Element => (
        <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <Activity className="h-3 w-3 mr-1" />
          Active
        </Badge>
      ),
    },
  ]

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
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
