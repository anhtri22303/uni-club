"use client"

import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { safeSessionStorage } from "@/lib/browser-utils"
import { getUserStats } from "@/service/userApi"
import { getClubStats } from "@/service/clubApi"
import { usePrefetchClubs, usePrefetchEvents, usePrefetchUsers } from "@/hooks/use-query-hooks"
import {
  LayoutDashboard, Users, Calendar, Gift, Wallet, History, BarChart3,
  Building, Home, CheckCircle, FileText, FileUser, HandCoins, CalendarDays,
  CreditCard, LibraryBig, MessageCircle, MapPin, Percent, ChevronDown, ChevronRight, ListOrdered,
  FileBarChart
} from "lucide-react"

interface SidebarProps {
  onNavigate?: () => void
  open?: boolean
}

type NavItem = {
  href?: string;
  label: string;
  icon: any;
  isStaff?: boolean;
  children?: NavItem[];
}

const navigationConfig = {
  student: [
    // { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/clubs", label: "Clubs", icon: Users },
    { href: "/student/myclub", label: "My Club", icon: Building },
    { href: "/student/events", label: "Events", icon: Calendar },
    { href: "/student/checkin", label: "Check In", icon: CheckCircle },
    { href: "/student/gift", label: "Gift", icon: Gift },
    // { href: "/student/wallet", label: "Wallet", icon: Wallet },
    { href: "/student/history", label: "History", icon: History },
    { href: "/student/myattendance", label: "My Attendance", icon: CalendarDays },
    { href: "/student/chat", label: "Chat", icon: MessageCircle },
  ],
  club_leader: [
    { href: "/club-leader", label: "Dashboard", icon: LayoutDashboard },
    { href: "/club-leader/applications", label: "Applications", icon: FileUser },
    { href: "/club-leader/members", label: "Members", icon: Users },
    { href: "/club-leader/events", label: "Events", icon: Calendar },
    { href: "/club-leader/attendances", label: "Attendances", icon: CalendarDays },
    {
      label: "Gifts",
      icon: LayoutDashboard,
      children: [
        { href: "/club-leader/gift", label: "Gift list", icon: Gift },
        { href: "/club-leader/club-order-list", label: "Club orders list", icon: ListOrdered },
        { href: "/club-leader/event-order-list", label: "Event orders list", icon: ListOrdered },
      ]
    },
    {
      label: "Others",
      icon: LayoutDashboard,
      children: [
        // { href: "/club-leader/gift", label: "Gift", icon: Gift },
        { href: "/club-leader/card", label: "Card", icon: CreditCard },
        { href: "/club-leader/points", label: "Points Club", icon: HandCoins },
        { href: "/club-leader/report", label: "Report", icon: FileBarChart },
        { href: "/club-leader/chat", label: "Chat", icon: MessageCircle },
      ]
    },
  ],
  uni_staff: [
    { href: "/uni-staff", label: "Dashboard", icon: LayoutDashboard },
    { href: "/uni-staff/clubs", label: "Clubs", icon: Building },
    { href: "/uni-staff/locations", label: "Locations", icon: MapPin },
    {
      label: "Policy Management",
      icon: FileText,
      children: [
        { href: "/uni-staff/multiplier-policy", label: "Multiplier Policy", icon: Percent },
        { href: "/uni-staff/policies", label: "Policies", icon: FileText },
      ]
    },
    { href: "/uni-staff/majors", label: "Majors", icon: LibraryBig },
    {
      label: "Requests",
      icon: CheckCircle,
      children: [
        { href: "/uni-staff/clubs-req", label: "Club Requests", icon: Building },
        { href: "/uni-staff/points-req", label: "Points Requests", icon: HandCoins },
        { href: "/uni-staff/events-req", label: "Event Requests", icon: Calendar },
      ]
    },
    { href: "/uni-staff/points", label: "Points Staff", icon: HandCoins },
    // { href: "/uni-staff/reports", label: "Reports", icon: BarChart3 },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/clubs", label: "Clubs", icon: Building },
    // { href: "/admin/attendances", label: "Attendances", icon: FileText },
    { href: "/admin/events", label: "Events", icon: Calendar },
  ],
} as const

export function Sidebar({ onNavigate, open = true }: SidebarProps) {
  const { auth } = useAuth()
  const { events, clubs, users, policies, clubApplications, eventRequests } = useData()
  const pathname = usePathname()
  const router = useRouter()
  const [loadingPath, setLoadingPath] = useState<string | null>(null)
  const [userStatsTotal, setUserStatsTotal] = useState<number>(0)
  const [clubStatsTotal, setClubStatsTotal] = useState<number>(0)
  const [hasClubs, setHasClubs] = useState<boolean>(false)
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})

  // Prefetch hooks for instant navigation
  const prefetchClubs = usePrefetchClubs()
  const prefetchEvents = usePrefetchEvents()
  const prefetchUsers = usePrefetchUsers()

  // Check clubIds for STUDENT role on every component mount/auth change
  useEffect(() => {
    if (auth.role === "student") {
      try {
        const storedAuth = safeSessionStorage.getItem("uniclub-auth")
        if (storedAuth) {
          const parsedAuth = JSON.parse(storedAuth)
          const clubIds = parsedAuth.clubIds

          // Check if student has clubs
          const studentHasClubs = clubIds && Array.isArray(clubIds) && clubIds.length > 0
          setHasClubs(studentHasClubs)

          console.log("Sidebar check - Student clubIds:", clubIds, "hasClubs:", studentHasClubs)
        } else {
          setHasClubs(false)
          console.log("Sidebar check - No auth data found, hasClubs: false")
        }
      } catch (error) {
        console.warn("Failed to parse sessionStorage auth data:", error)
        setHasClubs(false)
      }
    }
  }, [auth.role, pathname]) // Re-check on route changes

  // Fetch user stats and club stats for admin role
  useEffect(() => {
    if (auth.role === "admin") {
      const fetchStats = async () => {
        try {
          const stats = await getUserStats()
          if (stats?.total) {
            setUserStatsTotal(stats.total)
          }

          const clubStats = await getClubStats()
          if (clubStats?.totalClubs) {
            setClubStatsTotal(clubStats.totalClubs)
          }
        } catch (error) {
          console.error("Failed to fetch stats:", error)
        }
      }
      fetchStats()
    }
  }, [auth.role])

  if (!auth.role || !auth.user) return null

  // Default navigation per role (cast to a mutable, wide type to avoid readonly tuple issues)
  let navigation = (navigationConfig[auth.role as keyof typeof navigationConfig] || []) as unknown as NavItem[]

  // For STUDENT role, show limited or full navigation based on hasClubs state
  if (auth.role === "student") {
    if (!hasClubs) {
      // Student has no clubs - show limited navigation
      console.log("Student has no clubs, showing limited navigation")
      navigation = [
        { href: "/student/clubs", label: "Clubs", icon: Users },
        { href: "/student/history", label: "History", icon: History },
      ]
    } else {
      // Student has clubs - show full navigation from config
      console.log("Student has clubs, showing full navigation")
      // Keep the full navigation from navigationConfig
    }
  }

  // If the user is a STUDENT and auth indicates they are also staff,
  // show additional staff functionality
  if (auth.role === "student" && auth.staff) {
    // Add staff-specific navigation items for students
    const staffItems = [
      // { href: "/staff/validate", label: "Validate", icon: CheckCircle, isStaff: true },
      { href: "/staff/history", label: "Staff History", icon: History, isStaff: true },
      { href: "/staff/gift", label: "Staff Gift", icon: Gift, isStaff: true },
    ]

    // Add staff items that don't already exist
    staffItems.forEach(staffItem => {
      const exists = navigation.some((i) => i.href === staffItem.href)
      if (!exists) {
        navigation.push(staffItem)
      }
    })
  }

  const handleNavigation = (href: string) => {
    if (pathname === href) return
    setLoadingPath(href)
    router.push(href)
    onNavigate?.()
    // Clear loading state after a short delay to show visual feedback
    setTimeout(() => setLoadingPath(null), 150)
  }

  // Prefetch data on hover for instant navigation
  const handleMouseEnter = (href: string) => {
    // Determine which data to prefetch based on route
    if (href.includes("/clubs")) {
      prefetchClubs()
    } else if (href.includes("/events")) {
      prefetchEvents()
    } else if (href.includes("/users")) {
      prefetchUsers()
    }
  }

  // Toggle dropdown open/close
  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  // Check if any child item is active
  const isAnyChildActive = (children?: NavItem[]) => {
    if (!children) return false
    return children.some(child => child.href === pathname)
  }

  // Auto-open dropdowns if a child is active
  useEffect(() => {
    navigation.forEach(item => {
      if (item.children && isAnyChildActive(item.children)) {
        setOpenDropdowns(prev => ({
          ...prev,
          [item.label]: true
        }))
      }
    })
  }, [pathname])

  return (
    <>
      {/* Overlay for mobile when open */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden opacity-100 pointer-events-auto"
          aria-hidden="false"
          onClick={() => onNavigate?.()}
        />
      )}
      {!open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden opacity-0 pointer-events-none"
          aria-hidden="true"
        />
      )}

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
              // className="h-16 w-auto object-contain drop-shadow"
              className="h-16 w-16 object-cover drop-shadow border-1 border-primary rounded" // <-- THAY ĐỔI Ở ĐÂY
            />
          </div>
          {/* Nút đổi theme sát mép phải */}
          <div className="ml-auto z-10">
            {/* @ts-ignore-next-line */}
            {require("@/components/theme-toggle").ThemeToggle()}
          </div>
        </div>
        {/* <div className="flex-1 overflow-auto py-4 pb-72"> */}
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-2">
            {navigation.map((item, index) => {
              const Icon = item.icon
              const isActive = item.href ? pathname === item.href : false
              const isLoading = item.href ? loadingPath === item.href : false
              const isStaffItem = item.isStaff
              const hasChildren = item.children && item.children.length > 0
              const isDropdownOpen = openDropdowns[item.label]
              const hasActiveChild = isAnyChildActive(item.children)

              // Badge logic
              const isEventsItem = item.label === "Events"
              const isClubsItem = item.label === "Clubs"
              const isUsersItem = item.label === "Users"
              const isPoliciesItem = item.label === "Policies"
              const isClubRequestsItem = item.label === "Club Requests"
              const isEventRequestsItem = item.label === "Event Requests"
              const eventsCount = events.length
              const clubsCount = auth.role === "admin" ? clubStatsTotal : clubs.length
              const usersCount = auth.role === "admin" ? userStatsTotal : users.length
              const policiesCount = policies.length
              const clubApplicationsCount = clubApplications.length
              const eventRequestsCount = eventRequests.length
              const showBadges = auth.role !== "admin"

              // Calculate total badge count for dropdown groups
              let dropdownBadgeCount = 0
              if (hasChildren && showBadges) {
                item.children?.forEach(child => {
                  if (child.label === "Club Requests") dropdownBadgeCount += clubApplicationsCount
                  if (child.label === "Points Requests") dropdownBadgeCount += 0 // Add if needed
                  if (child.label === "Event Requests") dropdownBadgeCount += eventRequestsCount
                })
              }

              return (
                <div key={item.href || item.label}>
                  {/* Parent Item */}
                  <Button
                    variant={isActive || hasActiveChild ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-11 text-sm font-medium relative",
                      (isActive || hasActiveChild) && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                      isLoading && "opacity-75 cursor-wait",
                      isStaffItem && "text-muted-foreground bg-muted/30",
                      isStaffItem && isActive && "bg-muted text-muted-foreground"
                    )}
                    onClick={() => {
                      if (hasChildren) {
                        toggleDropdown(item.label)
                      } else if (item.href) {
                        handleNavigation(item.href)
                      }
                    }}
                    onMouseEnter={() => item.href && handleMouseEnter(item.href)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Icon className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isStaffItem && "text-white"
                      )} />
                    )}
                    <span className="truncate">{item.label}</span>

                    {/* Dropdown indicator */}
                    {hasChildren && (
                      <div className="ml-auto">
                        {isDropdownOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    )}

                    {/* Badges */}
                    {isStaffItem && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-muted-foreground/20 text-muted-foreground">
                        Staff
                      </span>
                    )}
                    {showBadges && isEventsItem && eventsCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                        {eventsCount}
                      </span>
                    )}
                    {showBadges && isClubsItem && clubsCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                        {clubsCount}
                      </span>
                    )}
                    {showBadges && isUsersItem && usersCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                        {usersCount}
                      </span>
                    )}
                    {showBadges && isPoliciesItem && policiesCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                        {policiesCount}
                      </span>
                    )}
                    {showBadges && isClubRequestsItem && clubApplicationsCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                        {clubApplicationsCount}
                      </span>
                    )}
                    {showBadges && isEventRequestsItem && eventRequestsCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                        {eventRequestsCount}
                      </span>
                    )}
                    {showBadges && hasChildren && dropdownBadgeCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                        {dropdownBadgeCount}
                      </span>
                    )}
                  </Button>

                  {/* Child Items (Dropdown) */}
                  {hasChildren && isDropdownOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon
                        const isChildActive = child.href === pathname
                        const isChildLoading = child.href ? loadingPath === child.href : false

                        // Child badges
                        const isChildClubRequests = child.label === "Club Requests"
                        const isChildEventRequests = child.label === "Event Requests"

                        return (
                          <Button
                            key={child.href}
                            variant={isChildActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start gap-3 h-10 text-sm font-medium",
                              isChildActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                              isChildLoading && "opacity-75 cursor-wait"
                            )}
                            onClick={() => child.href && handleNavigation(child.href)}
                            onMouseEnter={() => child.href && handleMouseEnter(child.href)}
                            disabled={isChildLoading}
                          >
                            {isChildLoading ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            )}
                            <span className="truncate text-xs">{child.label}</span>

                            {/* Child badges */}
                            {showBadges && isChildClubRequests && clubApplicationsCount > 0 && (
                              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                                {clubApplicationsCount}
                              </span>
                            )}
                            {showBadges && isChildEventRequests && eventRequestsCount > 0 && (
                              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                                {eventRequestsCount}
                              </span>
                            )}
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}