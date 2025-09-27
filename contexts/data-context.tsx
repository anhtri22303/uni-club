"use client"

import type React from "react"
import { createContext, useContext } from "react"
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
  updateClubMemberships: (data: any[]) => void
  updateMembershipApplications: (data: any[]) => void
  updateVouchers: (data: any[]) => void
  updateStaffHistory: (data: any[]) => void
  updateClubGiftProducts: (data: any[]) => void
  updateShopProducts: (data: any[]) => void
  updateUserBalances: (data: any[]) => void
  addMembershipApplication: (application: any) => void
  addVoucher: (voucher: any) => void
  addStaffHistoryEntry: (entry: any) => void
  removeVoucher: (voucherCode: string) => void
  getUserBalance: (userId: string) => number
  updateUserBalance: (userId: string, newBalance: number) => void
  purchaseProduct: (userId: string, productId: string, quantity?: number) => boolean
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [clubMemberships, setClubMemberships] = useLocalStorage("clubly-club-memberships", initialClubMemberships)
  const [membershipApplications, setMembershipApplications] = useLocalStorage(
    "clubly-membership-applications",
    initialMembershipApplications,
  )
  const [vouchers, setVouchers] = useLocalStorage("clubly-vouchers", initialVouchers)
  const [staffHistory, setStaffHistory] = useLocalStorage("clubly-staff-history", initialStaffHistory)
  const [clubGiftProducts, setClubGiftProducts] = useLocalStorage("clubly-club-gift-products", initialClubGiftProducts)
  const [shopProducts, setShopProducts] = useLocalStorage("clubly-shop-products", initialShopProducts)
  const [userBalances, setUserBalances] = useLocalStorage("clubly-user-balances", initialUserBalances)

  const addMembershipApplication = (application: any) => {
    setMembershipApplications((prev) => [...prev, { ...application, id: `a-${Date.now()}` }])
  }

  const addVoucher = (voucher: any) => {
    setVouchers((prev) => [...prev, voucher])
  }

  const addStaffHistoryEntry = (entry: any) => {
    setStaffHistory((prev) => [...prev, entry])
  }

  const removeVoucher = (voucherCode: string) => {
    setVouchers((prev) => prev.filter((v) => v.code !== voucherCode))
  }

  const getUserBalance = (userId: string): number => {
    const userBalance = userBalances.find((b) => b.userId === userId)
    return userBalance?.balance || 0
  }

  const updateUserBalance = (userId: string, newBalance: number) => {
    setUserBalances((prev) =>
      prev.map((b) => (b.userId === userId ? { ...b, balance: newBalance, lastUpdated: new Date().toISOString() } : b)),
    )
  }

  const purchaseProduct = (userId: string, productId: string, quantity = 1): boolean => {
    const product = shopProducts.find((p) => p.id === productId)
    const userBalance = getUserBalance(userId)

    if (!product || !product.available || product.stock < quantity) {
      return false
    }

    const totalCost = product.price * quantity
    if (userBalance < totalCost) {
      return false
    }

    // Update user balance
    updateUserBalance(userId, userBalance - totalCost)

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
  }

  return (
    <DataContext.Provider
      value={{
        clubMemberships,
        membershipApplications,
        vouchers,
        staffHistory,
        clubGiftProducts,
        shopProducts,
        userBalances,
        updateClubMemberships: setClubMemberships,
        updateMembershipApplications: setMembershipApplications,
        updateVouchers: setVouchers,
        updateStaffHistory: setStaffHistory,
        updateClubGiftProducts: setClubGiftProducts,
        updateShopProducts: setShopProducts,
        updateUserBalances: setUserBalances,
        addMembershipApplication,
        addVoucher,
        addStaffHistoryEntry,
        removeVoucher,
        getUserBalance,
        updateUserBalance,
        purchaseProduct,
      }}
    >
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
