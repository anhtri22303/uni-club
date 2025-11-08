"use client"

import type React from "react"
import { createContext, useContext, useMemo, useCallback } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"

// Import initial data
import initialClubMemberships from "@/src/data/club-memberships.json"
import initialMembershipApplications from "@/src/data/membership-applications.json"
import initialVouchers from "@/src/data/vouchers.json"
import initialStaffHistory from "@/src/data/staff-history.json"
import initialClubGiftProducts from "@/src/data/club-gift-products.json"
import initialShopProducts from "@/src/data/shop-products.json"
import initialUserBalances from "@/src/data/user-balances.json"

interface DataContextType {
  clubMemberships: any[]
  membershipApplications: any[]
  vouchers: any[]
  staffHistory: any[]
  clubGiftProducts: any[]
  shopProducts: any[]
  userBalances: any[]
  events: any[]
  clubs: any[]
  users: any[]
  policies: any[]
  clubApplications: any[]
  eventRequests: any[]
  clubLeaderApplications: any[]
  clubLeaderEventCounts: {
    pendingCoClub: number
    pendingUniStaff: number
    coHostPending: number
  }
  updateClubMemberships: (data: any[]) => void
  updateMembershipApplications: (data: any[]) => void
  updateVouchers: (data: any[]) => void
  updateStaffHistory: (data: any[]) => void
  updateClubGiftProducts: (data: any[]) => void
  updateShopProducts: (data: any[]) => void
  updateUserBalances: (data: any[]) => void
  updateEvents: (data: any[]) => void
  updateClubs: (data: any[]) => void
  updateUsers: (data: any[]) => void
  updatePolicies: (data: any[]) => void
  updateClubApplications: (data: any[]) => void
  updateEventRequests: (data: any[]) => void
  updateClubLeaderApplications: (data: any[]) => void
  updateClubLeaderEventCounts: (counts: { pendingCoClub: number; pendingUniStaff: number; coHostPending: number }) => void
  addMembershipApplication: (application: any) => void
  addVoucher: (voucher: any) => void
  addStaffHistoryEntry: (entry: any) => void
  removeVoucher: (voucherCode: string) => void
  getUserBalance: (userId: string) => number
  updateUserBalance: (userId: string, newBalance: number) => void
  purchaseProduct: (userId: string, productId: string, quantity?: number) => boolean
  removeMembershipApplication: (id: string) => void
  replaceMembershipApplication: (tempId: string, newApp: any) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [clubMemberships, setClubMemberships] = useLocalStorage("clubly-club-memberships", initialClubMemberships)
  const [membershipApplications, setMembershipApplications] = useLocalStorage(
    "clubly-membership-applications",
    initialMembershipApplications,
  )
  const [vouchers, setVouchers] = useLocalStorage("clubly-vouchers", initialVouchers)
  const [events, setEvents] = useLocalStorage("clubly-events", [] as any[])
  const [clubs, setClubs] = useLocalStorage("clubly-clubs", [] as any[])
  const [users, setUsers] = useLocalStorage("clubly-users", [] as any[])
  const [policies, setPolicies] = useLocalStorage("clubly-policies", [] as any[])
  const [clubApplications, setClubApplications] = useLocalStorage("clubly-club-applications", [] as any[])
  const [eventRequests, setEventRequests] = useLocalStorage("clubly-event-requests", [] as any[])
  const [clubLeaderApplications, setClubLeaderApplications] = useLocalStorage("clubly-club-leader-applications", [] as any[])
  const [clubLeaderEventCounts, setClubLeaderEventCounts] = useLocalStorage("clubly-club-leader-event-counts", {
    pendingCoClub: 0,
    pendingUniStaff: 0,
    coHostPending: 0
  })
  const [staffHistory, setStaffHistory] = useLocalStorage("clubly-staff-history", initialStaffHistory)
  const [clubGiftProducts, setClubGiftProducts] = useLocalStorage("clubly-club-gift-products", initialClubGiftProducts)
  const [shopProducts, setShopProducts] = useLocalStorage("clubly-shop-products", initialShopProducts)
  const [userBalances, setUserBalances] = useLocalStorage("clubly-user-balances", initialUserBalances)

  const addMembershipApplication = useCallback((application: any) => {
    const id = application.id ?? `a-${Date.now()}`
    setMembershipApplications((prev) => [...prev, { ...application, id }])
    return id
  }, [setMembershipApplications])

  const removeMembershipApplication = useCallback((id: string) => {
    setMembershipApplications((prev) => prev.filter((a) => String(a.id) !== String(id)))
  }, [setMembershipApplications])

  const replaceMembershipApplication = useCallback((tempId: string, newApp: any) => {
    setMembershipApplications((prev) => prev.map((a) => (String(a.id) === String(tempId) ? newApp : a)))
  }, [setMembershipApplications])

  const addVoucher = useCallback((voucher: any) => {
    setVouchers((prev) => [...prev, voucher])
  }, [setVouchers])

  const addStaffHistoryEntry = useCallback((entry: any) => {
    setStaffHistory((prev) => [...prev, entry])
  }, [setStaffHistory])

  const removeVoucher = useCallback((voucherCode: string) => {
    setVouchers((prev) => prev.filter((v) => v.code !== voucherCode))
  }, [setVouchers])

  const getUserBalance = useCallback((userId: string): number => {
    const userBalance = userBalances.find((b) => b.userId === userId)
    return userBalance?.balance || 0
  }, [userBalances])

  const updateUserBalance = useCallback((userId: string, newBalance: number) => {
    setUserBalances((prev) =>
      prev.map((b) => (b.userId === userId ? { ...b, balance: newBalance, lastUpdated: new Date().toISOString() } : b)),
    )
  }, [setUserBalances])

  const purchaseProduct = useCallback((userId: string, productId: string, quantity = 1): boolean => {
    // Find product directly from state
    const product = shopProducts.find((p) => p.id === productId)
    
    // Get user balance directly from state
    const userBalanceObj = userBalances.find((b) => b.userId === userId)
    const userBalance = userBalanceObj?.balance || 0

    if (!product || !product.available || product.stock < quantity) {
      return false
    }

    const totalCost = product.price * quantity
    if (userBalance < totalCost) {
      return false
    }

    // Update user balance using setter function
    setUserBalances((prev) =>
      prev.map((b) => (b.userId === userId ? { ...b, balance: userBalance - totalCost, lastUpdated: new Date().toISOString() } : b)),
    )

    // Update product stock and purchase count
    setShopProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              stock: p.stock - quantity,
              purchased: p.purchased + quantity,
              available: p.stock - quantity > 0,
            }
          : p,
      ),
    )

    return true
  }, [shopProducts, userBalances, setUserBalances, setShopProducts])

  // Memoize context value to prevent infinite re-renders
  const contextValue = useMemo(
    () => ({
      clubMemberships,
      membershipApplications,
      vouchers,
      staffHistory,
      clubGiftProducts,
      shopProducts,
      userBalances,
      events,
      clubs,
      users,
      policies,
      clubApplications,
      eventRequests,
      clubLeaderApplications,
      clubLeaderEventCounts,
      updateClubMemberships: setClubMemberships,
      updateMembershipApplications: setMembershipApplications,
      updateVouchers: setVouchers,
      updateStaffHistory: setStaffHistory,
      updateClubGiftProducts: setClubGiftProducts,
      updateShopProducts: setShopProducts,
      updateUserBalances: setUserBalances,
      updateEvents: setEvents,
      updateClubs: setClubs,
      updateUsers: setUsers,
      updatePolicies: setPolicies,
      updateClubApplications: setClubApplications,
      updateEventRequests: setEventRequests,
      updateClubLeaderApplications: setClubLeaderApplications,
      updateClubLeaderEventCounts: setClubLeaderEventCounts,
      addMembershipApplication,
      removeMembershipApplication,
      replaceMembershipApplication,
      addVoucher,
      addStaffHistoryEntry,
      removeVoucher,
      getUserBalance,
      updateUserBalance,
      purchaseProduct,
    }),
    [
      clubMemberships,
      membershipApplications,
      vouchers,
      staffHistory,
      clubGiftProducts,
      shopProducts,
      userBalances,
      events,
      clubs,
      users,
      policies,
      clubApplications,
      eventRequests,
      clubLeaderApplications,
      clubLeaderEventCounts,
      setClubMemberships,
      setMembershipApplications,
      setVouchers,
      setStaffHistory,
      setClubGiftProducts,
      setShopProducts,
      setUserBalances,
      setEvents,
      setClubs,
      setUsers,
      setPolicies,
      setClubApplications,
      setEventRequests,
      setClubLeaderApplications,
      setClubLeaderEventCounts,
      addMembershipApplication,
      removeMembershipApplication,
      replaceMembershipApplication,
      addVoucher,
      addStaffHistoryEntry,
      removeVoucher,
      getUserBalance,
      updateUserBalance,
      purchaseProduct,
    ]
  )

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
