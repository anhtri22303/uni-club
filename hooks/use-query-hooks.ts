"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchClub, getClubById, getClubMemberCount } from "@/service/clubApi"
import { fetchEvent, getEventById } from "@/service/eventApi"
import { fetchUser, fetchUserById, fetchProfile } from "@/service/userApi"
import { getMembersByClubId } from "@/service/membershipApi"
import { fetchMajors } from "@/service/majorApi"
import { getProduct } from "@/service/productApi"
import { getWallet } from "@/service/walletApi"
import { fetchPolicies } from "@/service/policyApi"
import { getMemberApplyByClubId, getMyMemApply } from "@/service/memberApplicationApi"
import { getMyClubApply } from "@/service/clubApplicationAPI"

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

  // Users
  users: ["users"] as const,
  usersList: () => [...queryKeys.users, "list"] as const,
  userDetail: (id: number | string) => [...queryKeys.users, "detail", id] as const,

  // Majors
  majors: ["majors"] as const,
  majorsList: () => [...queryKeys.majors, "list"] as const,

  // Products
  products: ["products"] as const,
  productsList: (params?: any) => [...queryKeys.products, "list", params] as const,

  // Wallet
  wallet: ["wallet"] as const,
  walletDetail: () => [...queryKeys.wallet, "detail"] as const,

  // Policies
  policies: ["policies"] as const,
  policiesList: () => [...queryKeys.policies, "list"] as const,

  // Profile
  profile: ["profile"] as const,
  profileDetail: () => [...queryKeys.profile, "detail"] as const,

  // Member Applications
  memberApplications: ["member-applications"] as const,
  memberApplicationsList: (clubId?: number) => 
    clubId ? [...queryKeys.memberApplications, "club", clubId] as const : [...queryKeys.memberApplications, "list"] as const,
  myMemberApplications: () => [...queryKeys.memberApplications, "my"] as const,
  
  // Club Applications
  clubApplications: ["club-applications"] as const,
  myClubApplications: () => [...queryKeys.clubApplications, "my"] as const,
}

// ============================================
// CLUBS QUERIES
// ============================================

/**
 * Hook to fetch list of clubs with pagination
 * @param params - Pagination parameters (page, size, sort)
 */
export function useClubs(params = { page: 0, size: 20, sort: ["name"] }) {
  return useQuery({
    queryKey: queryKeys.clubsList(params),
    queryFn: async () => {
      const res: any = await fetchClub(params)
      return res?.content ?? []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
 */
export function useClubMemberCounts(clubIds: number[]) {
  return useQuery({
    queryKey: ["clubs", "member-counts", clubIds],
    queryFn: async () => {
      const counts = await Promise.all(
        clubIds.map(async (id) => {
          try {
            const count = await getClubMemberCount(id)
            return { clubId: id, count }
          } catch {
            return { clubId: id, count: 0 }
          }
        })
      )
      return counts.reduce((acc, { clubId, count }) => {
        acc[clubId] = count
        return acc
      }, {} as Record<number, number>)
    },
    enabled: clubIds.length > 0,
    staleTime: 5 * 60 * 1000,
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
      return raw.map((e: any) => ({ ...e, title: e.title ?? e.name }))
    },
    staleTime: 3 * 60 * 1000, // 3 minutes (events change frequently)
  })
}

/**
 * Hook to fetch single event by ID
 * @param eventId - Event ID
 */
export function useEvent(eventId: number | string, enabled = true) {
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
      const normalized = raw.map((e: any) => ({ ...e, title: e.title ?? e.name }))
      
      // Filter by clubIds
      return normalized.filter((event: any) => {
        const eventClubId = Number(event.clubId)
        return clubIds.includes(eventClubId)
      })
    },
    enabled: clubIds.length > 0,
    staleTime: 3 * 60 * 1000,
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
      const users = await fetchUser()
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
// PRODUCTS QUERIES
// ============================================

/**
 * Hook to fetch list of products with pagination
 * @param params - Pagination parameters (page, size, sort)
 */
export function useProducts(params = { page: 0, size: 10, sort: "name" }) {
  return useQuery({
    queryKey: queryKeys.productsList(params),
    queryFn: async () => {
      const products = await getProduct(params)
      return products
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// ============================================
// WALLET QUERIES
// ============================================

/**
 * Hook to fetch user's wallet information
 */
export function useWallet() {
  return useQuery({
    queryKey: queryKeys.walletDetail(),
    queryFn: async () => {
      const wallet = await getWallet()
      return wallet
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (wallet changes frequently)
  })
}

// ============================================
// POLICIES QUERIES
// ============================================

/**
 * Hook to fetch all university policies
 */
export function usePolicies() {
  return useQuery({
    queryKey: queryKeys.policiesList(),
    queryFn: async () => {
      const policies = await fetchPolicies()
      return policies
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (policies change rarely)
  })
}

// ============================================
// PROFILE QUERIES
// ============================================

/**
 * Hook to fetch current user's profile
 */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.profileDetail(),
    queryFn: async () => {
      const profile = await fetchProfile()
      return profile
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ============================================
// MEMBER APPLICATIONS QUERIES
// ============================================

/**
 * Hook to fetch member applications by club ID
 * @param clubId - Club ID to filter applications
 */
export function useMemberApplications(clubId?: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.memberApplicationsList(clubId),
    queryFn: async () => {
      if (!clubId) return []
      const applications = await getMemberApplyByClubId(clubId)
      return applications
    },
    enabled: !!clubId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes (applications change frequently)
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
      return applications
    },
    enabled,
    staleTime: 2 * 60 * 1000,
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
    staleTime: 2 * 60 * 1000,
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
      queryKey: queryKeys.clubsList({ page: 0, size: 20, sort: ["name"] }),
      queryFn: async () => {
        const res: any = await fetchClub({ page: 0, size: 20, sort: ["name"] })
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
