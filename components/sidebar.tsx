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
import { getClubStats, getClubIdFromToken } from "@/service/clubApi"
import { getEventByClubId, timeObjectToString, type Event } from "@/service/eventApi"
import { getLeaveReq, type LeaveRequest } from "@/service/membershipApi"
import { usePrefetchClubs, usePrefetchEvents, usePrefetchUsers, useMyMemberApplications, useMyClubApplications, useMyRedeemOrders } from "@/hooks/use-query-hooks"
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
    // { href: "/student/checkin", label: "Check In", icon: CheckCircle },
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
    { href: "/admin/products", label: "Products", icon: Gift },
    { href: "/admin/policies", label: "Policies", icon: FileText },
    { href: "/admin/locations", label: "Locations", icon: MapPin },

  ],
} as const

// Helper function to check if event has expired
const isEventExpired = (event: Event): boolean => {
  // COMPLETED status is always considered expired
  if (event.status === "COMPLETED") return true

  // Check if date and endTime are present
  if (!event.date || !event.endTime) return false

  try {
    // Get current date/time
    const now = new Date()

    // Parse event date (format: YYYY-MM-DD)
    const [year, month, day] = event.date.split('-').map(Number)

    // Convert endTime to string if it's an object
    const endTimeStr = timeObjectToString(event.endTime)

    // Parse endTime (format: HH:MM:SS or HH:MM)
    const [hours, minutes] = endTimeStr.split(':').map(Number)

    // Create event end datetime (using local timezone consistently)
    const eventEndDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)

    // Event is expired if current time is past the end time
    return now > eventEndDateTime
  } catch (error) {
    console.error('Error checking event expiration:', error)
    return false
  }
}

export function Sidebar({ onNavigate, open = true }: SidebarProps) {
  const { auth } = useAuth()
  const { events, clubs, users, policies, clubApplications, eventRequests, clubLeaderApplications } = useData()
  const pathname = usePathname()
  const router = useRouter()
  const [loadingPath, setLoadingPath] = useState<string | null>(null)
  const [userStatsTotal, setUserStatsTotal] = useState<number>(0)
  const [clubStatsTotal, setClubStatsTotal] = useState<number>(0)
  const [hasClubs, setHasClubs] = useState<boolean>(false)
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})
  // State for profile page event counts (APPROVED and ONGOING)
  const [approvedEventsCount, setApprovedEventsCount] = useState<number>(0)
  const [ongoingEventsCount, setOngoingEventsCount] = useState<number>(0)

  // State for History page pending counts (from 3 APIs)
  const [pendingMemberAppsCount, setPendingMemberAppsCount] = useState<number>(0)
  const [pendingClubAppsCount, setPendingClubAppsCount] = useState<number>(0)
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0)

  // State for Club Leader pending leave requests
  const [pendingLeaveRequestsCount, setPendingLeaveRequestsCount] = useState<number>(0)

  // State for Club Leader event counts (from getEventByClubId)
  const [clubLeaderPendingEventsCount, setClubLeaderPendingEventsCount] = useState<number>(0) // PENDING_COCLUB + PENDING_UNISTAFF
  const [clubLeaderApprovedEventsCount, setClubLeaderApprovedEventsCount] = useState<number>(0) // APPROVED
  const [clubLeaderOngoingEventsCount, setClubLeaderOngoingEventsCount] = useState<number>(0) // ONGOING

  // Prefetch hooks for instant navigation
  const prefetchClubs = usePrefetchClubs()
  const prefetchEvents = usePrefetchEvents()
  const prefetchUsers = usePrefetchUsers()

  // Call APIs for STUDENT role to get pending counts
  const { data: memberAppsData } = useMyMemberApplications(auth.role === "student")
  const { data: clubAppsData } = useMyClubApplications(auth.role === "student")
  const { data: ordersData } = useMyRedeemOrders(auth.role === "student")

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

  // Fetch events by clubIds for STUDENT role (always, not just on profile page)
  useEffect(() => {
    if (auth.role === "student") {
      const fetchEventsForStudent = async () => {
        try {
          const storedAuth = safeSessionStorage.getItem("uniclub-auth")
          if (!storedAuth) {
            setApprovedEventsCount(0)
            setOngoingEventsCount(0)
            return
          }

          const parsedAuth = JSON.parse(storedAuth)
          const clubIds = parsedAuth.clubIds

          if (!clubIds || !Array.isArray(clubIds) || clubIds.length === 0) {
            setApprovedEventsCount(0)
            setOngoingEventsCount(0)
            return
          }

          // Fetch events for all clubIds
          const allEventsPromises = clubIds.map((clubId: number) => 
            getEventByClubId(clubId).catch((err) => {
              console.error(`Failed to fetch events for club ${clubId}:`, err)
              return [] // Return empty array on error
            })
          )

          const allEventsArrays = await Promise.all(allEventsPromises)
          const allEvents = allEventsArrays.flat()

          // Filter events that are not expired
          const nonExpiredEvents = allEvents.filter((event: Event) => !isEventExpired(event))

          // Count APPROVED and ONGOING events
          const approvedCount = nonExpiredEvents.filter(
            (event: Event) => event.status === "APPROVED"
          ).length
          const ongoingCount = nonExpiredEvents.filter(
            (event: Event) => event.status === "ONGOING"
          ).length

          setApprovedEventsCount(approvedCount)
          setOngoingEventsCount(ongoingCount)

          console.log("Student sidebar - Approved events:", approvedCount, "Ongoing events:", ongoingCount)
        } catch (error) {
          console.error("Failed to fetch events for student sidebar:", error)
          setApprovedEventsCount(0)
          setOngoingEventsCount(0)
        }
      }

      fetchEventsForStudent()
    } else {
      // Reset counts when not student role
      setApprovedEventsCount(0)
      setOngoingEventsCount(0)
    }
  }, [auth.role, pathname])

  // Calculate pending counts from 3 APIs for STUDENT role
  useEffect(() => {
    if (auth.role === "student") {
      // Process member applications
      const memberApps: any[] = Array.isArray(memberAppsData) 
        ? memberAppsData 
        : ((memberAppsData as any)?.data || [])
      const pendingMemberApps = memberApps.filter((app: any) => app.status === "PENDING")
      setPendingMemberAppsCount(pendingMemberApps.length)

      // Process club applications
      const clubApps: any[] = Array.isArray(clubAppsData) 
        ? clubAppsData 
        : ((clubAppsData as any)?.data || [])
      const pendingClubApps = clubApps.filter((app: any) => app.status === "PENDING")
      setPendingClubAppsCount(pendingClubApps.length)

      // Process orders
      const orders: any[] = Array.isArray(ordersData) 
        ? ordersData 
        : ((ordersData as any)?.data || [])
      const pendingOrders = orders.filter((order: any) => order.status === "PENDING")
      setPendingOrdersCount(pendingOrders.length)

      console.log("History sidebar - Pending counts:", {
        memberApps: pendingMemberApps.length,
        clubApps: pendingClubApps.length,
        orders: pendingOrders.length
      })
    } else {
      // Reset counts when not student role
      setPendingMemberAppsCount(0)
      setPendingClubAppsCount(0)
      setPendingOrdersCount(0)
    }
  }, [auth.role, memberAppsData, clubAppsData, ordersData])

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

  // Fetch leave requests for CLUB_LEADER role
  useEffect(() => {
    if (auth.role === "club_leader") {
      const fetchLeaveRequests = async () => {
        try {
          const clubId = getClubIdFromToken()
          if (!clubId) {
            setPendingLeaveRequestsCount(0)
            return
          }

          const requests = await getLeaveReq(clubId)
          const pendingCount = requests.filter((req: LeaveRequest) => req.status === "PENDING").length
          setPendingLeaveRequestsCount(pendingCount)

          console.log("Club Leader sidebar - Pending leave requests:", pendingCount)
        } catch (error) {
          console.error("Failed to fetch leave requests for sidebar:", error)
          setPendingLeaveRequestsCount(0)
        }
      }

      fetchLeaveRequests()
      // Refresh every 30 seconds to keep badge updated
      const interval = setInterval(fetchLeaveRequests, 30000)
      return () => clearInterval(interval)
    } else {
      setPendingLeaveRequestsCount(0)
    }
  }, [auth.role, pathname])

  // Fetch events for CLUB_LEADER role and calculate badges
  useEffect(() => {
    if (auth.role === "club_leader") {
      const fetchClubLeaderEvents = async () => {
        try {
          const clubId = getClubIdFromToken()
          if (!clubId) {
            setClubLeaderPendingEventsCount(0)
            setClubLeaderApprovedEventsCount(0)
            setClubLeaderOngoingEventsCount(0)
            return
          }

          const events = await getEventByClubId(clubId)
          
          // Filter events that are not expired
          const nonExpiredEvents = events.filter((event: Event) => !isEventExpired(event))

          // Count PENDING_COCLUB + PENDING_UNISTAFF (yellow badge)
          const pendingCount = nonExpiredEvents.filter(
            (event: Event) => event.status === "PENDING_COCLUB" || event.status === "PENDING_UNISTAFF"
          ).length

          // Count APPROVED (green badge)
          const approvedCount = nonExpiredEvents.filter(
            (event: Event) => event.status === "APPROVED"
          ).length

          // Count ONGOING (purple badge)
          const ongoingCount = nonExpiredEvents.filter(
            (event: Event) => event.status === "ONGOING"
          ).length

          setClubLeaderPendingEventsCount(pendingCount)
          setClubLeaderApprovedEventsCount(approvedCount)
          setClubLeaderOngoingEventsCount(ongoingCount)

          console.log("Club Leader sidebar - Event counts:", {
            pending: pendingCount,
            approved: approvedCount,
            ongoing: ongoingCount
          })
        } catch (error) {
          console.error("Failed to fetch events for club leader sidebar:", error)
          setClubLeaderPendingEventsCount(0)
          setClubLeaderApprovedEventsCount(0)
          setClubLeaderOngoingEventsCount(0)
        }
      }

      fetchClubLeaderEvents()
      // Refresh every 30 seconds to keep badges updated
      const interval = setInterval(fetchClubLeaderEvents, 30000)
      return () => clearInterval(interval)
    } else {
      setClubLeaderPendingEventsCount(0)
      setClubLeaderApprovedEventsCount(0)
      setClubLeaderOngoingEventsCount(0)
    }
  }, [auth.role, pathname])

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
    if (pathname === href) {
      // Nếu đang ở trang student/clubs và click lại, reload trang
      if (href === "/student/clubs") {
        window.location.reload()
        return
      }
      return
    }
    setLoadingPath(href)
    
    // Nếu điều hướng đến student/clubs, reload trang sau khi push
    if (href === "/student/clubs") {
      router.push(href)
      onNavigate?.()
      // Reload trang sau một khoảng thời gian ngắn để đảm bảo navigation đã hoàn tất
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } else {
      router.push(href)
      onNavigate?.()
      // Clear loading state after a short delay to show visual feedback
      setTimeout(() => setLoadingPath(null), 150)
    }
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
              src="/images/LogoSidebar.png"
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
              const isApplicationsItem = item.label === "Applications"
              const isHistoryItem = item.label === "History"
              const isGiftItem = item.label === "Gift"
              const isMembersItem = item.label === "Members"
              const eventsCount = events.length
              const clubsCount = auth.role === "admin" ? clubStatsTotal : clubs.length
              const usersCount = auth.role === "admin" ? userStatsTotal : users.length
              const policiesCount = policies.length
              const clubApplicationsCount = clubApplications.length
              const eventRequestsCount = eventRequests.length
              const clubLeaderApplicationsCount = clubLeaderApplications.length
              const showBadges = auth.role !== "admin"

              // Club Leader Event Counts (3 separate badges)
              const isClubLeaderEventsItem = auth.role === "club_leader" && isEventsItem

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
                    {/* Club Leader Events - 3 separate badges with different colors */}
                    {isClubLeaderEventsItem && (
                      <div className="ml-auto flex gap-1">
                        {clubLeaderPendingEventsCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Pending Events (PENDING_COCLUB + PENDING_UNISTAFF)">
                            {clubLeaderPendingEventsCount}
                          </span>
                        )}
                        {clubLeaderApprovedEventsCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Approved Events">
                            {clubLeaderApprovedEventsCount}
                          </span>
                        )}
                        {clubLeaderOngoingEventsCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Ongoing Events">
                            {clubLeaderOngoingEventsCount}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Student role: Show APPROVED and ONGOING event badges on Events item */}
                    {showBadges && isEventsItem && auth.role === "student" && (
                      <div className="ml-auto flex gap-1">
                        {approvedEventsCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Approved Events">
                            {approvedEventsCount}
                          </span>
                        )}
                        {ongoingEventsCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Ongoing Events">
                            {ongoingEventsCount}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Other roles Events badge - exclude student and club_leader */}
                    {showBadges && isEventsItem && !isClubLeaderEventsItem && auth.role !== "student" && eventsCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                        {eventsCount}
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
                    {showBadges && isApplicationsItem && clubLeaderApplicationsCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                        {clubLeaderApplicationsCount}
                      </span>
                    )}
                    {/* Club Leader role: Show badge for Members item (Pending Leave Requests) */}
                    {showBadges && isMembersItem && auth.role === "club_leader" && pendingLeaveRequestsCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-yellow-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Pending Leave Requests">
                        {pendingLeaveRequestsCount}
                      </span>
                    )}
                    {showBadges && hasChildren && dropdownBadgeCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                        {dropdownBadgeCount}
                      </span>
                    )}
                    {/* Student role: Show 3 separate badges for History item (Member Apps, Club Apps, Orders) */}
                    {showBadges && isHistoryItem && auth.role === "student" && (
                      <div className="ml-auto flex gap-1">
                        {pendingMemberAppsCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Pending Member Applications">
                            {pendingMemberAppsCount}
                          </span>
                        )}
                        {pendingClubAppsCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Pending Club Applications">
                            {pendingClubAppsCount}
                          </span>
                        )}
                        {pendingOrdersCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Pending Orders">
                            {pendingOrdersCount}
                          </span>
                        )}
                      </div>
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