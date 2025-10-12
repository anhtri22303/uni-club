"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { LoadingSpinner } from "@/components/loading-spinner"
import {
  LayoutDashboard, Users, Calendar, Gift, Wallet, History, BarChart3,
  Building, Home, CheckCircle, FileText, FileUser,
} from "lucide-react"

interface SidebarProps {
  onNavigate?: () => void
  open?: boolean
}

type NavItem = { href: string; label: string; icon: any }

const navigationConfig = {
  member: [
    { href: "/member", label: "Dashboard", icon: LayoutDashboard },
    { href: "/member/clubs", label: "Clubs", icon: Users },
    { href: "/member/events", label: "Events", icon: Calendar },
    { href: "/member/checkin", label: "Check In", icon: CheckCircle },
    { href: "/member/gift", label: "Gift", icon: Gift },
    { href: "/member/wallet", label: "Wallet", icon: Wallet },
    { href: "/member/history", label: "History", icon: History },
  ],
  // Student role: limited view — only Clubs (per new requirement)
  student: [
    { href: "/student/clubs", label: "Clubs", icon: Users },
    { href: "/student/history", label: "History", icon: History },
  ],
  club_leader: [
    { href: "/club-leader", label: "Dashboard", icon: LayoutDashboard },
        { href: "/club-leader/applications", label: "Applications", icon: FileUser },
    { href: "/club-leader/members", label: "Members", icon: Users },
    { href: "/club-leader/events", label: "Events", icon: Calendar },
    { href: "/club-leader/gift", label: "Gift", icon: Gift },
  ],
  uni_staff: [
    { href: "/uni-staff", label: "Dashboard", icon: LayoutDashboard },
    { href: "/uni-staff/clubs", label: "Clubs", icon: Building },
    { href: "/uni-staff/policies", label: "Policies", icon: FileText },
    { href: "/uni-staff/clubs-req", label: "Club Requests", icon: FileText },
    { href: "/uni-staff/events-req", label: "Event Requests", icon: Calendar },
    { href: "/uni-staff/reports", label: "Reports", icon: BarChart3 },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/clubs", label: "Clubs", icon: Building },
    { href: "/admin/attendances", label: "Attendances", icon: FileText },
      { href: "/admin/events", label: "Events", icon: Calendar },
  ],
  // staff: [
  //   { href: "/staff", label: "Home", icon: Home },
  //   { href: "/staff/validate", label: "Validate", icon: CheckCircle },
  //   { href: "/staff/history", label: "History", icon: History },
  //   { href: "/staff/gift", label: "Gift", icon: Gift },
  // ],
} as const

export function Sidebar({ onNavigate, open = true }: SidebarProps) {
  const { auth } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [loadingPath, setLoadingPath] = useState<string | null>(null)

  if (!auth.role || !auth.user) return null
  // Default navigation per role (cast to a mutable, wide type to avoid readonly tuple issues)
  let navigation = (navigationConfig[auth.role as keyof typeof navigationConfig] || []) as unknown as NavItem[]

  // If the user is a MEMBER and auth indicates they are also staff,
  // show additional staff functionality
  if (auth.role === "member" && auth.staff) {
    // Add staff-specific navigation items for members
    const staffItems = [
      { href: "/staff/validate", label: "Validate", icon: CheckCircle },
      { href: "/staff/history", label: "Staff History", icon: History },
      { href: "/staff/gift", label: "Staff Gift", icon: Gift },
    ]
    
    // Add staff items that don't already exist
    staffItems.forEach(staffItem => {
      const exists = navigation.some((i) => i.href === staffItem.href)
      if (!exists) {
        navigation.push(staffItem)
      }
    })
  }

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
      {/* Overlay for mobile when open */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!open}
        onClick={() => onNavigate?.()}
      />

      {/* Sidebar: translate-x to hide/show instead of unmounting */}
      <aside
        className={cn(
          "fixed z-40 inset-y-0 left-0 w-64 border-r bg-sidebar border-sidebar-border transition-transform",
          "md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Sidebar"
      >
        {/* Logo section above navigation */}
        <div className="relative flex items-center h-24 border-b border-sidebar-border bg-sidebar px-4">
          {/* Logo căn giữa header, xích qua phải */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <img
              src="/images/Logo.png"
              alt="UniClub Logo"
              className="h-16 w-auto object-contain drop-shadow"
            />
          </div>
          {/* Nút đổi theme sát mép phải */}
          <div className="ml-auto z-10">
            {/* @ts-ignore-next-line */}
            {require("@/components/theme-toggle").ThemeToggle()}
          </div>
        </div>
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