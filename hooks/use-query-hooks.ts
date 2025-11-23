"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchClub, getClubById, getClubMemberCount } from "@/service/clubApi"
import { fetchEvent, getEventById, getEventByClubId, getEventCoHost, getMyEventRegistrations, getMyEvents } from "@/service/eventApi"
import { fetchUser, fetchUserById, fetchProfile } from "@/service/userApi"
import { getMembersByClubId, ApiMembership, getMyClubs, } from "@/service/membershipApi"
import { fetchMajors } from "@/service/majorApi"
import { getProducts, Product, getEventProductsOnTime, getEventProductsCompleted } from "@/service/productApi"
import { getTags, Tag as ProductTag } from "@/service/tagApi"
import { fetchPolicies, fetchPolicyById } from "@/service/policyApi"
import { fetchAttendanceByDate, fetchMemberAttendanceHistory } from "@/service/attendanceApi"
import { getMemberApplyByClubId, getMyMemApply, fetchAllMemberApplications } from "@/service/memberApplicationApi"
import { getClubApplications, getClubApplyById, getMyClubApply } from "@/service/clubApplicationAPI"
import { fetchUniversityPoints, fetchAttendanceSummary, fetchAttendanceRanking } from "@/service/universityApi"
import { getWallet, ApiMembershipWallet } from "@/service/walletApi"
import { getMemberRedeemOrders } from "@/service/redeemApi"
import { getAllPenaltyRules, PenaltyRule } from "@/service/disciplineApi";

// ============================================
// INTERFACES
// ============================================
interface ProfileWallet {
    walletId: number;
    balancePoints: number;
    ownerType: string;
    clubId: number;
    clubName: string;
    userId?: number;
    userFullName?: string;
}

// (Interface này mô tả object 'club' bên trong mảng 'clubs' (dựa trên image_131d0f.png))
interface ProfileClub {
    clubId: number;
    clubName: string;
}

// (Interface 'Profile' đã sửa)
interface Profile {
    needCompleteProfile: boolean
    id: number;
    email: string;
    fullName: string;
    phone: string | null;
    roleName: string;
    status: string;
    studentCode: string;
    majorName: string;
    bio: string | null;
    avatarUrl: string | null;
    backgroundUrl: string | null;
    clubs: ProfileClub[];
    wallet: ProfileWallet;
    wallets?: ProfileWallet[];
}

interface AttendanceRecord {
  date: string;
  note: string | null;
  clubName: string;
  status: string;
  // (Thêm các thuộc tính khác nếu có)
}

interface MemberHistoryResponse {
  success: boolean;
  message: string;
  data: {
    clubName: string;
    membershipId: number;
    attendanceHistory: AttendanceRecord[];
  };
}
// ============================================
// QUERY KEYS - Centralized for consistency
// ============================================
export const queryKeys = {
    // Clubs
    clubs: ["clubs"] as const,
    clubsList: (params?: any) => [...queryKeys.clubs, "list", params] as const,
    clubDetail: (id: number) => [...queryKeys.clubs, "detail", id] as const,
    clubMembers: (clubId: number) => [...queryKeys.clubs, clubId, "members"] as const,
    clubMemberCount: (clubId: number) => [...queryKeys.clubs, clubId, "member-count"] as const,

    // Events
    events: ["events"] as const,
    eventsList: () => [...queryKeys.events, "list"] as const,
    eventDetail: (id: number) => [...queryKeys.events, "detail", id] as const,
    eventsByClubId: (clubId: number) => [...queryKeys.events, "club", clubId] as const,
    eventsCoHostByClubId: (clubId: number) => [...queryKeys.events, "club", clubId, "cohost"] as const,
    myEventRegistrations: () => [...queryKeys.events, "my-registrations"] as const,
    myEvents: () => [...queryKeys.events, "my"] as const,

    // Users
    users: ["users"] as const,
    usersList: () => [...queryKeys.users, "list"] as const,
    userDetail: (id: number | string) => [...queryKeys.users, "detail", id] as const,

    // Majors
    majors: ["majors"] as const,
    majorsList: () => [...queryKeys.majors, "list"] as const,

    // Products
    // products: ["products"] as const,
    // productsList: (params?: any) => [...queryKeys.products, "list", params] as const,
    products: ["products"] as const,
    // productsList đã bị xóa vì getProducts giờ cần clubId
    productsByClubId: (clubId: number) => [...queryKeys.products, "club", clubId] as const,
    eventProductsOnTime: (clubId: number) => [...queryKeys.products, "event-ontime", clubId] as const,
    eventProductsCompleted: (clubId: number) => [...queryKeys.products, "event-completed", clubId] as const,
    tags: () => ["tags"] as const, 

    // Wallet
    wallet: ["wallet"] as const,
    walletDetail: (userId?: string | number) => [...queryKeys.wallet, "detail", userId] as const,

    // Policies
    policies: ["policies"] as const,
    policiesList: () => [...queryKeys.policies, "list"] as const,
    policyDetail: (id: number) => [...queryKeys.policies, "detail", id] as const,

    // Member Applications
    memberApplications: ["member-applications"] as const,
    memberApplicationsList: () => [...queryKeys.memberApplications, "list"] as const,
    memberApplicationsByClub: (clubId: number) => [...queryKeys.memberApplications, "club", clubId] as const,
    myMemberApplications: () => [...queryKeys.memberApplications, "my"] as const,

    // Club Applications
    clubApplications: ["club-applications"] as const,
    clubApplicationsList: () => [...queryKeys.clubApplications, "list"] as const,
    clubApplicationDetail: (id: number) => [...queryKeys.clubApplications, "detail", id] as const,
    myClubApplications: () => [...queryKeys.clubApplications, "my"] as const,

    // Redeem Orders
    redeemOrders: ["redeem-orders"] as const,
    myRedeemOrders: () => [...queryKeys.redeemOrders, "my"] as const,
    // Attendances
    attendances: ["attendances"] as const,
    attendancesByDate: (date: string) => [...queryKeys.attendances, "date", date] as const,
    memberAttendanceHistory: (clubId: number | null) => [...queryKeys.attendances, "club", clubId, "member-history"] as const,
    // Profile
    profile: ["profile"] as const,
    fullProfile: ["fullProfile"] as const, // Dùng cho `fetchProfile`, trả về object Profile
    // University Analytics
    university: ["university"] as const,
    universityPoints: () => [...queryKeys.university, "points"] as const,
    attendanceSummary: (year: number) => [...queryKeys.university, "attendance-summary", year] as const,
    attendanceRanking: () => [...queryKeys.university, "attendance-ranking"] as const,
    
    // Discipline
    discipline: ["discipline"] as const,
    penaltyRulesList: () => [...queryKeys.discipline, "penalty-rules"] as const,
}

// ============================================
// CLUBS QUERIES
// ============================================

/**
 * Hook to fetch list of clubs with pagination
 * @param params - Pagination parameters (page, size, sort)
 *    OPTIMIZED: Increased default size to reduce pagination requests
 */
export function useClubs(params = { page: 0, size: 70, sort: ["name"] }) {
    return useQuery({
        queryKey: queryKeys.clubsList(params),
        queryFn: async () => {
            // console.log("    useClubs queryFn - calling fetchClub with params:", params)
            const res: any = await fetchClub(params)
            // console.log("    useClubs queryFn - raw response:", res)
            // console.log("    useClubs queryFn - res.data:", res?.data)
            // console.log("    useClubs queryFn - res.data.content:", res?.data?.content)
            const clubs = res?.data?.content ?? []
            // console.log("    useClubs queryFn - returning clubs:", clubs.length, "items")
            return clubs
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    })
}

/**
 * Hook to fetch single club by ID
 * @param clubId - Club ID
 */
export function useClub(clubId: number, enabled = true) {
    return useQuery({
        queryKey: queryKeys.clubDetail(clubId),
        queryFn: async () => {
            const res: any = await getClubById(clubId)
            return res?.data ?? null
        },
        enabled: !!clubId && enabled,
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook to fetch club members
 * @param clubId - Club ID
 */
export function useClubMembers(clubId: number, enabled = true) {
    return useQuery({
        queryKey: queryKeys.clubMembers(clubId),
        queryFn: async () => {
            const members = await getMembersByClubId(clubId)
            return members
        },
        enabled: !!clubId && enabled,
        staleTime: 3 * 60 * 1000, // 3 minutes (more dynamic data)
    })
}

/**
 * Hook to fetch club member count
 * @param clubId - Club ID
 */
export function useClubMemberCount(clubId: number, enabled = true) {
    return useQuery({
        queryKey: queryKeys.clubMemberCount(clubId),
        queryFn: async () => {
            const count = await getClubMemberCount(clubId)
            return count
        },
        enabled: !!clubId && enabled,
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook to prefetch multiple club member counts
 * Useful for lists where we need counts for many clubs
 *    OPTIMIZED: Returns both activeMemberCount and approvedEvents
 * @param clubIds - Array of club IDs to fetch counts for
 * @param enabled - Whether to enable the query (default: true). Should be false if parent data is still loading
 */
export function useClubMemberCounts(clubIds: number[], enabled = true) {
    return useQuery({
        queryKey: ["clubs", "member-counts", clubIds],
        queryFn: async () => {
            console.log(" useClubMemberCounts: Fetching counts for", clubIds.length, "clubs")
            // Fetch all counts in parallel for better performance
            const counts = await Promise.all(
                clubIds.map(async (id) => {
                    try {
                        const countData = await getClubMemberCount(id)
                        return {
                            clubId: id,
                            activeMemberCount: countData.activeMemberCount ?? 0,
                            approvedEvents: countData.approvedEvents ?? 0
                        }
                    } catch (error) {
                        console.error(`Failed to fetch member count for club ${id}:`, error)
                        return {
                            clubId: id,
                            activeMemberCount: 0,
                            approvedEvents: 0
                        }
                    }
                })
            )
            console.log("  useClubMemberCounts: Fetched counts successfully")
            // Convert array to object for easy lookup
            return counts.reduce((acc, data) => {
                acc[data.clubId] = {
                    activeMemberCount: data.activeMemberCount,
                    approvedEvents: data.approvedEvents
                }
                return acc
            }, {} as Record<number, { activeMemberCount: number; approvedEvents: number }>)
        },
        enabled: enabled && clubIds.length > 0,
        staleTime: 5 * 60 * 1000,
        // Don't show errors for member counts - just use 0 as fallback
        retry: 1,
    })
}

// ============================================
// EVENTS QUERIES
// ============================================

/**
 * Hook to fetch all events
 */
export function useEvents() {
    return useQuery({
        queryKey: queryKeys.eventsList(),
        queryFn: async () => {
            const data: any = await fetchEvent()
            const raw: any[] = Array.isArray(data) ? data : (data?.content ?? data?.events ?? [])
            // Normalize events - ensure backward compatibility with legacy 'title' field
            return raw.map((e: any) => ({
                ...e,
                title: e.name || e.title,
                // Add legacy fields for backward compatibility
                clubId: e.hostClub?.id || e.clubId,
                clubName: e.hostClub?.name || e.clubName,
            }))
        },
        staleTime: 3 * 60 * 1000, // 3 minutes (events change frequently)
    })
}

/**
 * Hook to fetch events filtered by club IDs
 * @param clubIds - Array of club IDs to filter by
 */
export function useClubEvents(clubIds: number[]) {
    return useQuery({
        queryKey: [...queryKeys.eventsList(), "clubs", clubIds],
        queryFn: async () => {
            const data: any = await fetchEvent()
            const raw: any[] = Array.isArray(data) ? data : (data?.content ?? data?.events ?? [])

            // Filter by clubIds - support both new (hostClub) and legacy (clubId) formats
            return raw.filter((event: any) => {
                const eventClubId = Number(event.hostClub?.id || event.clubId)
                return clubIds.includes(eventClubId)
            })
        },
        enabled: clubIds.length > 0,
        staleTime: 3 * 60 * 1000,
    })
}

/**
 * Hook to fetch events by a specific club ID
 * Uses the dedicated API endpoint /api/events/club/:clubId
 * @param clubId - Club ID to fetch events for
 * @param enabled - Whether to enable the query (default: true)
 */
export function useEventsByClubId(clubId: number, enabled = true) {
    return useQuery({
        queryKey: queryKeys.eventsByClubId(clubId),
        queryFn: async () => {
            const events = await getEventByClubId(clubId)
            // Normalize events with both new and legacy field support
            return events.map((e: any) => ({
                ...e,
                title: e.name || e.title,
                time: e.startTime || e.time, // Map startTime to time for legacy compatibility
                clubId: e.hostClub?.id || e.clubId, // Map hostClub.id to clubId for backward compatibility
                clubName: e.hostClub?.name || e.clubName, // Map hostClub.name to clubName for backward compatibility
            }))
        },
        enabled: !!clubId && enabled,
        staleTime: 3 * 60 * 1000, // 3 minutes (events change frequently)
    })
}

/**
 * Hook to fetch co-host events by a specific club ID
 * Uses the dedicated API endpoint /api/events/club/:clubId/cohost
 * @param clubId - Club ID to fetch co-host events for
 * @param enabled - Whether to enable the query (default: true)
 */
export function useEventCoHostByClubId(clubId: number, enabled = true) {
    return useQuery({
        queryKey: queryKeys.eventsCoHostByClubId(clubId),
        queryFn: async () => {
            const events = await getEventCoHost(clubId)
            // Normalize events with both new and legacy field support
            return events.map((e: any) => ({
                ...e,
                title: e.name || e.title,
                time: e.startTime || e.time, // Map startTime to time for legacy compatibility
                clubId: e.hostClub?.id || e.clubId, // Map hostClub.id to clubId for backward compatibility
                clubName: e.hostClub?.name || e.clubName, // Map hostClub.name to clubName for backward compatibility
            }))
        },
        enabled: !!clubId && enabled,
        staleTime: 3 * 60 * 1000, // 3 minutes (events change frequently)
    })
}

/**
 * Hook to fetch current user's event registrations
 * Uses the dedicated API endpoint /api/events/my-registrations
 */
export function useMyEventRegistrations(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myEventRegistrations(),
        queryFn: async () => {
            const registrations = await getMyEventRegistrations()
            return registrations
        },
        enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes (registration data changes when user registers)
    })
}

/**
 * Hook to fetch current user's events (events they've registered for)
 * Uses the dedicated API endpoint /api/events/my
 */
export function useMyEvents(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myEvents(),
        queryFn: async () => {
            const events = await getMyEvents()
            return events
        },
        enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

// ============================================
// USERS QUERIES
// ============================================

/**
 * Hook to fetch all users
 */
export function useUsers() {
    return useQuery({
        queryKey: queryKeys.usersList(),
        queryFn: async () => {
            console.log(" useUsers: Starting to fetch users...")
            const users = await fetchUser()
            console.log("  useUsers: Received users:", users)
            return users
        },
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook to fetch single user by ID
 * @param userId - User ID
 */
export function useUser(userId: number | string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.userDetail(userId),
        queryFn: async () => {
            const user = await fetchUserById(userId)
            return user
        },
        enabled: !!userId && enabled,
        staleTime: 5 * 60 * 1000,
    })
}

// ============================================
// MAJORS QUERIES
// ============================================

/**
 * Hook to fetch all majors
 */
export function useMajors() {
    return useQuery({
        queryKey: queryKeys.majorsList(),
        queryFn: async () => {
            const majors = await fetchMajors()
            return majors
        },
        staleTime: 30 * 60 * 1000, // 30 minutes (rarely changes)
    })
}

// ============================================
// PREFETCH UTILITIES
// ============================================

/**
 * Prefetch clubs data (for use in sidebar hover)
 */
export function usePrefetchClubs() {
    const queryClient = useQueryClient()

    return () => {
        queryClient.prefetchQuery({
            queryKey: queryKeys.clubsList({ page: 0, size: 70, sort: ["name"] }),
            queryFn: async () => {
                const res: any = await fetchClub({ page: 0, size: 70, sort: ["name"] })
                return res?.content ?? []
            },
            staleTime: 5 * 60 * 1000,
        })
    }
}

/**
 * Prefetch events data (for use in sidebar hover)
 */
export function usePrefetchEvents() {
    const queryClient = useQueryClient()

    return () => {
        queryClient.prefetchQuery({
            queryKey: queryKeys.eventsList(),
            queryFn: async () => {
                const data: any = await fetchEvent()
                const raw: any[] = Array.isArray(data) ? data : (data?.content ?? data?.events ?? [])
                return raw.map((e: any) => ({ ...e, title: e.title ?? e.name }))
            },
            staleTime: 3 * 60 * 1000,
        })
    }
}

/**
 * Prefetch users data (for use in sidebar hover)
 */
export function usePrefetchUsers() {
    const queryClient = useQueryClient()

    return () => {
        queryClient.prefetchQuery({
            queryKey: queryKeys.usersList(),
            queryFn: async () => {
                const users = await fetchUser()
                return users
            },
            staleTime: 5 * 60 * 1000,
        })
    }
}

/**
 * Generic prefetch for club detail by ID
 */
export function usePrefetchClub() {
    const queryClient = useQueryClient()

    return (clubId: number) => {
        queryClient.prefetchQuery({
            queryKey: queryKeys.clubDetail(clubId),
            queryFn: async () => {
                const res: any = await getClubById(clubId)
                return res?.data ?? null
            },
            staleTime: 5 * 60 * 1000,
        })
    }
}

// ============================================
// PRODUCTS QUERIES
// ============================================
/**
 * Hook để lấy danh sách sản phẩm (gifts) CỦA MỘT CLUB
 * (Thay thế cho useProducts cũ)
 */
export function useProductsByClubId(clubId: number, enabled: boolean = true) {
    return useQuery<Product[], Error>({
        // Thêm 'includeArchived' để nó là 1 query mới
        queryKey: [...queryKeys.productsByClubId(clubId), { includeInactive: true, includeArchived: true }],

        // Gửi 'includeArchived: true' để lấy TẤT CẢ sản phẩm (ACTIVE, INACTIVE, ARCHIVED)
        queryFn: () => getProducts(clubId, { includeInactive: true, includeArchived: true }),

        enabled: enabled && !!clubId,
        staleTime: 3 * 60 * 1000, // 3 phút
    });
}

/**
 * Hook để lấy danh sách EVENT_ITEM đang diễn ra (ONGOING)
 * Tự động refresh mỗi 10 giây
 */
export function useEventProductsOnTime(clubId: number, enabled: boolean = true) {
    return useQuery<Product[], Error>({
        queryKey: queryKeys.eventProductsOnTime(clubId),
        queryFn: () => getEventProductsOnTime(clubId),
        enabled: enabled && !!clubId,
        staleTime: 10 * 1000, // 10 giây
        refetchInterval: 10 * 1000, // Auto refresh mỗi 10 giây
    });
}

/**
 * Hook để lấy danh sách EVENT_ITEM đã hoàn thành (COMPLETED)
 * Chỉ fetch 1 lần khi mount
 */
export function useEventProductsCompleted(clubId: number, enabled: boolean = true) {
    return useQuery<Product[], Error>({
        queryKey: queryKeys.eventProductsCompleted(clubId),
        queryFn: () => getEventProductsCompleted(clubId),
        enabled: enabled && !!clubId,
        staleTime: Infinity, // Cache forever
        refetchOnMount: false, // Không refetch khi mount lại
        refetchOnWindowFocus: false, // Không refetch khi focus window
    });
}

/**
 * THAY BẰNG HOOK MỚI NÀY:
 * Hook để lấy danh sách TẤT CẢ tags sản phẩm (thay thế cho getProductTags)
 */
export function useProductTags(enabled: boolean = true) {
    return useQuery<ProductTag[], Error>({
        queryKey: queryKeys.tags(),     // Dùng key mới
        queryFn: getTags,               // Gọi hàm getTags mới
        enabled: enabled,
        staleTime: 5 * 60 * 1000, // 5 phút
    });
}

// ============================================
// WALLET QUERIES
// ============================================

/**
 * Hook to fetch current user's wallet
 */
export function useWallet() {
    return useQuery({
        queryKey: queryKeys.walletDetail(),
        queryFn: async () => {
            const wallet = await getWallet()
            return wallet
        },
        staleTime: 2 * 60 * 1000, // 2 minutes (wallet data changes frequently)
    })
}

// ============================================
// POLICIES QUERIES
// ============================================

/**
 * Hook to fetch all policies
 */
export function usePolicies() {
    return useQuery({
        queryKey: queryKeys.policiesList(),
        queryFn: async () => {
            const policies = await fetchPolicies()
            return policies
        },
        staleTime: 10 * 60 * 1000, // 10 minutes (policies rarely change)
    })
}

/**
 * Hook to fetch single policy by ID
 */
export function usePolicy(policyId: number, enabled = true) {
    return useQuery({
        queryKey: queryKeys.policyDetail(policyId),
        queryFn: async () => {
            const policy = await fetchPolicyById(policyId)
            return policy
        },
        enabled: !!policyId && enabled,
        staleTime: 10 * 60 * 1000,
    })
}

// ============================================
// ATTENDANCES QUERIES
// ============================================

/**
 * Hook to fetch attendances by date
 */
export function useAttendancesByDate(date: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.attendancesByDate(date),
        queryFn: async () => {
            const attendances = await fetchAttendanceByDate(date)
            return attendances
        },
        enabled: !!date && enabled,
        staleTime: 1 * 60 * 1000, // 1 minute (attendance data is time-sensitive)
    })
}

/**
 * Hook to fetch attendance history for current member in a specific club
 * @param clubId - The club ID to fetch attendance history for
 */
export function useMemberAttendanceHistory(clubId: number | null, enabled = true) {
  return useQuery<MemberHistoryResponse | null, Error>({
    queryKey: queryKeys.memberAttendanceHistory(clubId),
    queryFn: async () => {
      if (!clubId) return null 

      const responseBody = await fetchMemberAttendanceHistory(clubId)
      
      return responseBody as MemberHistoryResponse // Trả về toàn bộ object
    },
    enabled: !!clubId && enabled,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================
// PROFILE QUERIES
// ============================================

/**
 * Hook to fetch current user's profile
 */
export function useProfile(enabled = true) {
    // Sửa kiểu dữ liệu trả về: là một MẢNG ApiMembership[]
    return useQuery<ApiMembership[], Error>({
        queryKey: queryKeys.profile,
        // Sửa hàm gọi API
        queryFn: async () => {
            const myClubs = await getMyClubs(); // Gọi API có 'membershipId'
            return myClubs;
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to fetch current user's FULL profile
 * TRẢ VỀ: Profile (object) - (Dùng cho UserProfileWidget và trang Profile)
 * NOTE: This will automatically refetch when auth changes (user logs in/out)
 */
export function useFullProfile(enabled = true) {
    return useQuery<Profile, Error>({
        queryKey: queryKeys.fullProfile, // Dùng key mới
        queryFn: async () => {
            const profile = await fetchProfile()
            return profile as Profile // Gọi API fetchProfile
        },
        enabled,
        staleTime: 5 * 60 * 1000, // Cache 5 phút
        refetchOnMount: true, // Refetch when component mounts
    })
}

// ============================================
// LOCATIONS QUERIES
// ============================================

/**
* Hook to fetch all locations with pagination
*/
export function useLocations(params = { page: 0, size: 70, sort: ["name"] }, enabled = true) {
    return useQuery({
        queryKey: ["locations", "list", params],
        queryFn: async () => {
            const { fetchLocation } = await import("@/service/locationApi")
            const locations = await fetchLocation(params)
            return locations
        },
        enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes (locations rarely change)
    })
}

/**
 * Hook to fetch single location by ID
 */
export function useLocation(locationId: string | number, enabled = true) {
    return useQuery({
        queryKey: ["locations", "detail", locationId],
        queryFn: async () => {
            const { getLocationById } = await import("@/service/locationApi")
            const location = await getLocationById(locationId)
            return location
        },
        enabled: !!locationId && enabled,
        staleTime: 10 * 60 * 1000,
    })
}

// ============================================
// STATISTICS QUERIES
// ============================================

/**
 * Hook to fetch club statistics
 */
export function useClubStats(enabled = true) {
    return useQuery({
        queryKey: ["clubs", "stats"],
        queryFn: async () => {
            const { getClubStats } = await import("@/service/clubApi")
            const stats = await getClubStats()
            return stats
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook to fetch user statistics
 */
export function useUserStats(enabled = true) {
    return useQuery({
        queryKey: ["users", "stats"],
        queryFn: async () => {
            const { getUserStats } = await import("@/service/userApi")
            const stats = await getUserStats()
            return stats
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    })
}

// ============================================
// EVENT DETAIL QUERY
// ============================================

/**
 * Hook to fetch single event by ID
 */
export function useEvent(eventId: string | number, enabled = true) {
    return useQuery({
        queryKey: queryKeys.eventDetail(Number(eventId)),
        queryFn: async () => {
            const event = await getEventById(eventId)
            return event
        },
        enabled: !!eventId && enabled,
        staleTime: 3 * 60 * 1000,
    })
}

// ============================================
// MEMBER APPLICATIONS QUERIES
// ============================================

/**
 * Hook to fetch all member applications
 */
export function useMemberApplications(enabled = true) {
    return useQuery({
        queryKey: queryKeys.memberApplicationsList(),
        queryFn: async () => {
            const applications = await fetchAllMemberApplications()
            return applications
        },
        enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

/**
 * Hook to fetch member applications by club ID
 */
export function useMemberApplicationsByClub(clubId: number, enabled = true) {
    return useQuery({
        queryKey: queryKeys.memberApplicationsByClub(clubId),
        queryFn: async () => {
            const applications = await getMemberApplyByClubId(clubId)
            return applications
        },
        enabled: !!clubId && enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

/**
 * Hook to fetch current user's member applications
 */
export function useMyMemberApplications(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myMemberApplications(),
        queryFn: async () => {
            const applications = await getMyMemApply()
            // Ensure we always return an array
            if (Array.isArray(applications)) return applications
            if (applications?.data && Array.isArray(applications.data)) return applications.data
            return []
        },
        enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

// ============================================
// CLUB APPLICATIONS QUERIES
// ============================================

/**
* Hook to fetch all club applications (uni-staff)
*/
export function useClubApplications(enabled = true) {
    return useQuery({
        queryKey: queryKeys.clubApplicationsList(),
        queryFn: async () => {
            const applications = await getClubApplications()
            return applications
        },
        enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

/**
 * Hook to fetch a single club application by ID
 * @param applicationId - Club application ID
 */
export function useClubApplicationById(applicationId: number, enabled = true) {
    return useQuery({
        queryKey: queryKeys.clubApplicationDetail(applicationId),
        queryFn: async () => {
            const application = await getClubApplyById(applicationId)
            return application
        },
        enabled: !!applicationId && enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

/**
 * Hook to fetch current user's club applications
 */
export function useMyClubApplications(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myClubApplications(),
        queryFn: async () => {
            const applications = await getMyClubApply()
            return applications
        },
        enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

// ============================================
// REDEEM ORDERS QUERIES
// ============================================

/**
 * Hook to fetch current user's redeem orders
 */
export function useMyRedeemOrders(enabled = true) {
    return useQuery({
        queryKey: queryKeys.myRedeemOrders(),
        queryFn: async () => {
            const orders = await getMemberRedeemOrders()
            // Đảm bảo luôn trả về một mảng
            if (Array.isArray(orders)) return orders
            if ((orders as any)?.data && Array.isArray((orders as any).data))
                return (orders as any).data
            return []
        },
        enabled,
        staleTime: 2 * 60 * 1000, // 2 phút
    })
}

// ============================================
// UNIVERSITY ANALYTICS QUERIES
// ============================================

/**
 * Hook to fetch university points and club rankings
 */
export function useUniversityPoints(enabled = true) {
    return useQuery({
        queryKey: queryKeys.universityPoints(),
        queryFn: async () => {
            const data = await fetchUniversityPoints()
            return data
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes (changes occasionally)
        retry: 2, // Retry twice on failure
    })
}

/**
 * Hook to fetch attendance summary by year
 * @param year - Year to fetch attendance summary for
 */
export function useAttendanceSummary(year: number, enabled = true) {
    return useQuery({
        queryKey: queryKeys.attendanceSummary(year),
        queryFn: async () => {
            const data = await fetchAttendanceSummary(year)
            return data
        },
        enabled: enabled && !!year,
        staleTime: 3 * 60 * 1000, // 3 minutes
        retry: 2,
    })
}

/**
 * Hook to fetch attendance ranking (top clubs by attendance)
 */
export function useAttendanceRanking(enabled = true) {
    return useQuery({
        queryKey: queryKeys.attendanceRanking(),
        queryFn: async () => {
            const data = await fetchAttendanceRanking()
            return data
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })
}

// ============================================
// DISCIPLINE QUERIES 
// ============================================

/**
 * Hook to fetch all penalty rules (UniStaff Only)
 */
export function usePenaltyRules(enabled = true) {
    return useQuery<PenaltyRule[], Error>({
        queryKey: queryKeys.penaltyRulesList(),
        queryFn: async () => {
            const rules = await getAllPenaltyRules();
            // Hàm getAllPenaltyRules trả về PenaltyRule[]
            return rules;
        },
        enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes (rules rarely change)
    })
}