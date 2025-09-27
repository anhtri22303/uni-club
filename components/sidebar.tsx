"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { LoadingSpinner } from "@/components/loading-spinner"
import {
  LayoutDashboard, Users, Calendar, Gift, Wallet, History, BarChart3,
  Building, Home, CheckCircle, FileText,
} from "lucide-react"

interface SidebarProps {
  onNavigate?: () => void
  open?: boolean
}

const navigationConfig = {
  student: [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/clubs", label: "Clubs", icon: Users },
    { href: "/student/events", label: "Events", icon: Calendar },
    { href: "/student/checkin", label: "Check In", icon: CheckCircle },
    { href: "/student/gift", label: "Gift", icon: Gift },
    { href: "/student/wallet", label: "Wallet", icon: Wallet },
    { href: "/student/history", label: "History", icon: History },
  ],
  club_manager: [
    { href: "/club-manager", label: "Dashboard", icon: LayoutDashboard },
    { href: "/club-manager/members", label: "Members", icon: Users },
    { href: "/club-manager/events", label: "Events", icon: Calendar },
    { href: "/club-manager/gift", label: "Gift", icon: Gift },
  ],
  uni_admin: [
    { href: "/uni-admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/uni-admin/clubs", label: "Clubs", icon: Building },
    { href: "/uni-admin/clubs-req", label: "Club Requests", icon: FileText },
    { href: "/uni-admin/events-req", label: "Event Requests", icon: Calendar },
    { href: "/uni-admin/reports", label: "Reports", icon: BarChart3 },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/clubs", label: "Clubs", icon: Building },
    { href: "/admin/offers", label: "Offers", icon: Gift },
    { href: "/admin/redemptions", label: "Redemptions", icon: FileText },
  ],
  staff: [
    { href: "/staff", label: "Home", icon: Home },
    { href: "/staff/validate", label: "Validate", icon: CheckCircle },
    { href: "/staff/history", label: "History", icon: History },
    { href: "/staff/gift", label: "Gift", icon: Gift },
  ],
} as const

export function Sidebar({ onNavigate, open = true }: SidebarProps) {
  const { auth } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [loadingPath, setLoadingPath] = useState<string | null>(null)

  if (!auth.role || !auth.user) return null
  const navigation = navigationConfig[auth.role as keyof typeof navigationConfig] || []

  const handleNavigation = async (href: string) => {
    if (pathname === href) return
    setLoadingPath(href)
    await new Promise((r) => setTimeout(r, 300))
    router.push(href)
    onNavigate?.()
    setTimeout(() => setLoadingPath(null), 100)
  }

  return (
    <>
      {/* Overlay cho mobile khi mở */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!open}
        onClick={() => onNavigate?.()}
      />

      {/* Sidebar: thay vì unmount, chỉ translate-x để ẩn/hiện */}
      <aside
        className={cn(
          "fixed z-40 inset-y-0 left-0 w-64 border-r bg-sidebar border-sidebar-border transition-transform",
          "md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Sidebar"
      >
        <div className="h-16 border-b border-sidebar-border" />
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isLoading = loadingPath === item.href
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11 text-sm font-medium",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                    isLoading && "opacity-75 cursor-wait",
                  )}
                  onClick={() => handleNavigation(item.href)}
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : <Icon className="h-4 w-4 flex-shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </Button>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
