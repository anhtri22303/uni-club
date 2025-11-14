"use client"

import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { safeSessionStorage } from "@/lib/browser-utils"
import { getUserStats, fetchProfile, type UserProfile } from "@/service/userApi"
import { getClubStats, getClubIdFromToken } from "@/service/clubApi"
import { getEventByClubId, timeObjectToString, type Event } from "@/service/eventApi"
import { getLeaveReq, type LeaveRequest } from "@/service/membershipApi"
import { getClubRedeemOrders, type RedeemOrder } from "@/service/redeemApi"
import { usePointRequests } from "@/service/pointRequestsApi"
import { usePrefetchClubs, usePrefetchEvents, usePrefetchUsers, useMyMemberApplications, useMyClubApplications, useMyRedeemOrders, useClubApplications, useEvents } from "@/hooks/use-query-hooks"
import {
  LayoutDashboard, Users, Calendar, Gift, Wallet, History, BarChart3,
  Building, Home, CheckCircle, FileText, FileUser, HandCoins, CalendarDays,
  CreditCard, LibraryBig, MessageCircle, MapPin, Percent, ChevronDown, ChevronRight, ListOrdered,
  FileBarChart,
  TicketCheck,
  Tags
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
    { href: "/student/events-public", label: "Events Public", icon: Calendar },
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
    { href: "/club-leader/feedbacks", label: "Feedbacks", icon: MessageCircle },
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
    { href: "/uni-staff/tags", label: "Tags", icon: Tags },
    { href: "/uni-staff/feedbacks", label: "Feedbacks", icon: MessageCircle },
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
    { href: "/uni-staff/report", label: "Report", icon: FileBarChart },
    // { href: "/uni-staff/reports", label: "Reports", icon: BarChart3 },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/clubs", label: "Clubs", icon: Building },
    // { href: "/admin/attendances", label: "Attendances", icon: FileText },
    { href: "/admin/events", label: "Events", icon: Calendar },
    { href: "/admin/products", label: "Products", icon: Gift },
    { href: "/admin/redeems", label: "Redeems", icon: TicketCheck },
    { href: "/admin/policies", label: "Policies", icon: FileText },
    { href: "/admin/locations", label: "Locations", icon: MapPin },
    { href: "/admin/wallets", label: "Wallets", icon: Wallet },

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
  // Cache profile data for fast access
  const [cachedProfile, setCachedProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false)
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

  // State for Club Leader pending club orders (from getClubRedeemOrders)
  const [pendingClubOrdersCount, setPendingClubOrdersCount] = useState<number>(0) // PENDING orders

  // State for Uni Staff pending club applications (from useClubApplications)
  const [pendingUniStaffClubApplicationsCount, setPendingUniStaffClubApplicationsCount] = useState<number>(0) // PENDING club applications

  // State for Uni Staff pending event requests (from useEvents)
  const [pendingUniStaffEventRequestsCount, setPendingUniStaffEventRequestsCount] = useState<number>(0) // PENDING_COCLUB + PENDING_UNISTAFF events

  // State for Uni Staff pending point requests (from usePointRequests)
  const [pendingUniStaffPointRequestsCount, setPendingUniStaffPointRequestsCount] = useState<number>(0) // PENDING point requests

  // Prefetch hooks for instant navigation
  const prefetchClubs = usePrefetchClubs()
  const prefetchEvents = usePrefetchEvents()
  const prefetchUsers = usePrefetchUsers()

  // Call APIs for STUDENT role to get pending counts
  const { data: memberAppsData } = useMyMemberApplications(auth.role === "student")
  const { data: clubAppsData } = useMyClubApplications(auth.role === "student")
  const { data: ordersData } = useMyRedeemOrders(auth.role === "student")

  // Call API for UNI_STAFF role to get club applications
  const { data: uniStaffClubApplicationsData } = useClubApplications(auth.role === "uni_staff")

  // Call API for UNI_STAFF role to get events
  const { data: uniStaffEventsData } = useEvents()

  // Call API for UNI_STAFF role to get point requests
  const { data: uniStaffPointRequestsData } = usePointRequests(auth.role === "uni_staff")

  // Helper function to fetch and cache profile
  const fetchAndCacheProfile = async () => {
    if (isLoadingProfile) return cachedProfile // Prevent duplicate requests

    setIsLoadingProfile(true)
    try {
      // const profile = await fetchProfile()
      const profile: UserProfile | null = await fetchProfile()

      // Thêm kiểm tra null để an toàn
      if (!profile) {
        console.error("Failed to fetch profile: Profile data is null")
        setHasClubs(false)
        return null
      }

      setCachedProfile(profile)
      setCachedProfile(profile)
      const clubs = profile?.clubs || []
      const studentHasClubs = clubs && Array.isArray(clubs) && clubs.length > 0
      setHasClubs(studentHasClubs)

      console.log("Sidebar - Profile fetched:", { clubs, hasClubs: studentHasClubs })
      return profile
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      setHasClubs(false)
      return null
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Initial fetch and polling for STUDENT role to detect club changes
  useEffect(() => {
    if (auth.role === "student") {
      // Initial fetch
      fetchAndCacheProfile()

      // Poll every 30 seconds to detect if user was kicked from club
      const interval = setInterval(() => {
        fetchAndCacheProfile()
      }, 30000)

      return () => clearInterval(interval)
    } else {
      // Reset when not student
      setHasClubs(false)
      setCachedProfile(null)
    }
  }, [auth.role])

  // Prefetch profile on route change for instant feedback
  useEffect(() => {
    if (auth.role === "student" && pathname) {
      // Silently prefetch in background without blocking UI
      fetchAndCacheProfile()
    }
  }, [pathname])

  // Fetch events using cached profile for STUDENT role
  useEffect(() => {
    if (auth.role === "student") {
      const fetchEventsForStudent = async () => {
        try {
          // Use cached profile if available, otherwise fetch
          const profile = cachedProfile || await fetchAndCacheProfile()
          const clubs = profile?.clubs || []

          if (!clubs || !Array.isArray(clubs) || clubs.length === 0) {
            setApprovedEventsCount(0)
            setOngoingEventsCount(0)
            return
          }

          // Extract clubIds from clubs array
          const clubIds = clubs.map((club: any) => club.clubId)

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
  }, [auth.role, cachedProfile])

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

  // Fetch club redeem orders for CLUB_LEADER role and count PENDING orders
  useEffect(() => {
    if (auth.role === "club_leader") {
      const fetchClubOrders = async () => {
        try {
          const clubId = getClubIdFromToken()
          if (!clubId) {
            setPendingClubOrdersCount(0)
            return
          }

          const orders = await getClubRedeemOrders(clubId)

          // Count PENDING orders
          const pendingCount = orders.filter(
            (order: RedeemOrder) => order.status === "PENDING"
          ).length

          setPendingClubOrdersCount(pendingCount)

          console.log("Club Leader sidebar - Pending club orders:", pendingCount)
        } catch (error) {
          console.error("Failed to fetch club orders for sidebar:", error)
          setPendingClubOrdersCount(0)
        }
      }

      fetchClubOrders()
      // Refresh every 30 seconds to keep badge updated
      const interval = setInterval(fetchClubOrders, 30000)
      return () => clearInterval(interval)
    } else {
      setPendingClubOrdersCount(0)
    }
  }, [auth.role, pathname])

  // Calculate pending club applications count for UNI_STAFF role
  useEffect(() => {
    if (auth.role === "uni_staff") {
      // Process club applications
      const applications: any[] = Array.isArray(uniStaffClubApplicationsData)
        ? uniStaffClubApplicationsData
        : ((uniStaffClubApplicationsData as any)?.data || [])
      const pendingCount = applications.filter((app: any) => app.status === "PENDING").length
      setPendingUniStaffClubApplicationsCount(pendingCount)

      console.log("Uni Staff sidebar - Pending club applications:", pendingCount)
    } else {
      setPendingUniStaffClubApplicationsCount(0)
    }
  }, [auth.role, uniStaffClubApplicationsData])

  // Calculate pending event requests count for UNI_STAFF role
  useEffect(() => {
    if (auth.role === "uni_staff" && uniStaffEventsData) {
      // Process events
      const events: Event[] = Array.isArray(uniStaffEventsData)
        ? uniStaffEventsData
        : ((uniStaffEventsData as any)?.data || [])

      // Filter events that:
      // 1. Have valid date and endTime
      // 2. Are not expired (still in current time or future)
      // 3. Have status PENDING_COCLUB or PENDING_UNISTAFF
      const pendingEvents = events.filter((event: Event) => {
        // Check status first
        const isPending = event.status === "PENDING_COCLUB" || event.status === "PENDING_UNISTAFF"
        if (!isPending) return false

        // Check if event has valid date and endTime
        if (!event.date || !event.endTime) {
          console.warn("Event missing date or endTime:", event)
          return false
        }

        // Check if event is not expired (still in current time or future)
        const notExpired = !isEventExpired(event)
        if (!notExpired) return false

        // Additional validation: ensure event end time is in the future or current
        try {
          const now = new Date()
          const [year, month, day] = event.date.split('-').map(Number)
          const endTimeStr = timeObjectToString(event.endTime)
          const [hours, minutes] = endTimeStr.split(':').map(Number)
          const eventEndDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)

          // Event is valid if end time is in the future or current (not past)
          return now <= eventEndDateTime
        } catch (error) {
          console.error('Error validating event time:', error, event)
          return false
        }
      })

      setPendingUniStaffEventRequestsCount(pendingEvents.length)

      console.log("Uni Staff sidebar - Pending event requests (not expired):", pendingEvents.length)
    } else {
      setPendingUniStaffEventRequestsCount(0)
    }
  }, [auth.role, uniStaffEventsData])

  // Calculate pending point requests count for UNI_STAFF role
  useEffect(() => {
    if (auth.role === "uni_staff" && uniStaffPointRequestsData) {
      // Process point requests
      const pointRequests: any[] = Array.isArray(uniStaffPointRequestsData)
        ? uniStaffPointRequestsData
        : ((uniStaffPointRequestsData as any)?.data || [])

      // Filter point requests with status PENDING
      const pendingPointRequests = pointRequests.filter((request: any) => request.status === "PENDING")

      setPendingUniStaffPointRequestsCount(pendingPointRequests.length)

      console.log("Uni Staff sidebar - Pending point requests:", pendingPointRequests.length)
    } else {
      setPendingUniStaffPointRequestsCount(0)
    }
  }, [auth.role, uniStaffPointRequestsData])

  if (!auth.role || !auth.user) return null

  // Default navigation per role (cast to a mutable, wide type to avoid readonly tuple issues)
  let navigation = (navigationConfig[auth.role as keyof typeof navigationConfig] || []) as unknown as NavItem[]

  // For STUDENT role, show limited or full navigation based on hasClubs state
  if (auth.role === "student") {
    if (!hasClubs) {
      // Student has no clubs - show limited navigation with Events Public
      console.log("Student has no clubs, showing limited navigation with Events Public")
      navigation = [
        { href: "/student/clubs", label: "Clubs", icon: Users },
        { href: "/student/events-public", label: "Events Public", icon: Calendar },
        { href: "/student/history", label: "History", icon: History },
      ]
    } else {
      // Student has clubs - show full navigation but filter out Events Public
      console.log("Student has clubs, showing full navigation without Events Public")
      navigation = navigation.filter(item => item.href !== "/student/events-public")
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

  // const handleNavigation = (href: string) => {
  //   if (pathname === href) {
  //     // Nếu đang ở trang student/clubs và click lại, reload trang
  //     if (href === "/student/clubs") {
  //       window.location.reload()
  //       return
  //     }
  //     return
  //   }
  //   setLoadingPath(href)

  //   // Nếu điều hướng đến student/clubs, reload trang sau khi push
  //   if (href === "/student/clubs") {
  //     router.push(href)
  //     onNavigate?.()
  //     // Reload trang sau một khoảng thời gian ngắn để đảm bảo navigation đã hoàn tất
  //     setTimeout(() => {
  //       window.location.reload()
  //     }, 100)
  //   } else {
  //     router.push(href)
  //     onNavigate?.()
  //     // Clear loading state after a short delay to show visual feedback
  //     setTimeout(() => setLoadingPath(null), 150)
  //   }
  // }
  const handleNavigation = async (href: string) => {
    // 1. Nếu bấm vào link của trang hiện tại, không làm gì cả
    if (pathname === href) {
      return
    }

    // 2. For STUDENT role, check club access before navigation
    if (auth.role === "student") {
      // Events Public page is only for students WITHOUT clubs
      if (href.startsWith("/student/events-public")) {
        const profile = cachedProfile || await fetchAndCacheProfile()
        const clubs = profile?.clubs || []
        const hasAccess = clubs && Array.isArray(clubs) && clubs.length > 0

        if (hasAccess) {
          // User has club access - redirect to regular events page
          console.warn("Access denied to Events Public - User has club membership. Redirecting to regular events.")
          router.push("/student/events")
          onNavigate?.()
          return
        }
        // Allow access to Events Public for students without clubs
        // Continue to navigation below
      } else {
        // Club-restricted pages (excluding Events Public)
        const clubPages = ["/student/myclub", "/student/events", "/student/gift", "/student/myattendance", "/student/chat"]
        const isClubPage = clubPages.some(page => href.startsWith(page))

        if (isClubPage) {
          // Use cached profile for instant check
          let profile = cachedProfile

          // If no cache, fetch immediately (this should be rare due to polling)
          if (!profile) {
            setLoadingPath(href) // Show loading only when fetching
            profile = await fetchAndCacheProfile()
            setLoadingPath(null)
          }

          const clubs = profile?.clubs || []
          const hasAccess = clubs && Array.isArray(clubs) && clubs.length > 0

          if (!hasAccess) {
            // User doesn't have club access - redirect to clubs page
            console.warn("Access denied - No club membership. Redirecting to clubs page.")
            router.push("/student/clubs")
            onNavigate?.()
            return
          }
        }
      }
    }

    // 3. Đặt trạng thái loading
    setLoadingPath(href)

    // 4. Sử dụng router.push cho TẤT CẢ các link
    router.push(href)
    onNavigate?.()

    // 5. Xóa trạng thái loading sau một chút
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
              const isGiftsItem = item.label === "Gifts" // Parent dropdown item for club_leader
              const isMembersItem = item.label === "Members"
              const isRequestsItem = item.label === "Requests" // Parent dropdown item for uni_staff
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
                  if (child.label === "Club Requests") {
                    // For uni_staff, use pendingUniStaffClubApplicationsCount, otherwise use clubApplicationsCount
                    if (auth.role === "uni_staff") {
                      dropdownBadgeCount += pendingUniStaffClubApplicationsCount
                    } else {
                      dropdownBadgeCount += clubApplicationsCount
                    }
                  }
                  if (child.label === "Points Requests") {
                    // For uni_staff, use pendingUniStaffPointRequestsCount
                    if (auth.role === "uni_staff") {
                      dropdownBadgeCount += pendingUniStaffPointRequestsCount
                    }
                  }
                  if (child.label === "Event Requests") {
                    // For uni_staff, use pendingUniStaffEventRequestsCount, otherwise use eventRequestsCount
                    if (auth.role === "uni_staff") {
                      dropdownBadgeCount += pendingUniStaffEventRequestsCount
                    } else {
                      dropdownBadgeCount += eventRequestsCount
                    }
                  }
                })
              }

              // Check if this is the "Gifts" dropdown for club_leader
              const isGiftsDropdown = auth.role === "club_leader" && isGiftsItem
              // Check if this is the "Requests" dropdown for uni_staff
              const isRequestsDropdown = auth.role === "uni_staff" && isRequestsItem

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
                    {/* Show red badge for dropdown groups (exclude Gifts and Requests which have their own yellow badges) */}
                    {showBadges && hasChildren && dropdownBadgeCount > 0 && !isGiftsDropdown && !isRequestsDropdown && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                        {dropdownBadgeCount}
                      </span>
                    )}
                    {/* Club Leader role: Show badge for Gifts item (Pending Club Orders) when dropdown is closed */}
                    {showBadges && isGiftsDropdown && !isDropdownOpen && pendingClubOrdersCount > 0 && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-yellow-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Pending Club Orders">
                        {pendingClubOrdersCount}
                      </span>
                    )}
                    {/* Uni Staff role: Show badge for Requests item (Pending Event Requests + Point Requests) when dropdown is closed */}
                    {showBadges && isRequestsDropdown && !isDropdownOpen && (pendingUniStaffEventRequestsCount > 0 || pendingUniStaffPointRequestsCount > 0) && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-orange-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Pending Requests (Event Requests + Point Requests)">
                        {pendingUniStaffEventRequestsCount + pendingUniStaffPointRequestsCount}
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
                        const isChildPointsRequests = child.label === "Points Requests"
                        const isChildClubOrdersList = child.label === "Club orders list"

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
                            {showBadges && isChildClubRequests && (
                              <>
                                {/* Uni Staff role: Show yellow badge for Club Requests (Pending Club Applications) */}
                                {auth.role === "uni_staff" && pendingUniStaffClubApplicationsCount > 0 && (
                                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-yellow-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Pending Club Applications">
                                    {pendingUniStaffClubApplicationsCount}
                                  </span>
                                )}
                                {/* Other roles: Show red badge for Club Requests */}
                                {auth.role !== "uni_staff" && clubApplicationsCount > 0 && (
                                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                                    {clubApplicationsCount}
                                  </span>
                                )}
                              </>
                            )}
                            {showBadges && isChildEventRequests && (
                              <>
                                {/* Uni Staff role: Show orange badge for Event Requests (Pending Event Requests) */}
                                {auth.role === "uni_staff" && pendingUniStaffEventRequestsCount > 0 && (
                                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-orange-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Pending Event Requests (PENDING_COCLUB + PENDING_UNISTAFF)">
                                    {pendingUniStaffEventRequestsCount}
                                  </span>
                                )}
                                {/* Other roles: Show red badge for Event Requests */}
                                {auth.role !== "uni_staff" && eventRequestsCount > 0 && (
                                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                                    {eventRequestsCount}
                                  </span>
                                )}
                              </>
                            )}
                            {showBadges && isChildPointsRequests && (
                              <>
                                {/* Uni Staff role: Show orange badge for Points Requests (Pending Point Requests) */}
                                {auth.role === "uni_staff" && pendingUniStaffPointRequestsCount > 0 && (
                                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-orange-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Pending Point Requests">
                                    {pendingUniStaffPointRequestsCount}
                                  </span>
                                )}
                              </>
                            )}
                            {/* Club Leader role: Show badge for Club orders list (Pending Club Orders) when dropdown is open */}
                            {showBadges && isChildClubOrdersList && auth.role === "club_leader" && pendingClubOrdersCount > 0 && (
                              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-yellow-500 text-white font-bold min-w-[1.25rem] h-5 flex items-center justify-center" title="Pending Club Orders">
                                {pendingClubOrdersCount}
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