"use client"

import { useState, useMemo, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WalletHistory } from "@/components/wallet-history"
import { TopupModal } from "@/components/topup-modal"
import { useAuth } from "@/contexts/auth-context"
import { getWallet } from "@/service/walletApi"
import { ShoppingBag, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function MemberWalletPage() {
  const { auth } = useAuth()
  const [userBalance, setUserBalance] = useState<number>(0)
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<"shop" | "history">("shop")
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false)
  const [selectedAmountVND, setSelectedAmountVND] = useState<number | null>(null)

  // load wallet balance from API
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data: any = await getWallet()
        console.debug("MemberWalletPage.getWallet ->", data)
        if (!mounted) return
        const pts = Number(data?.points ?? data?.balance ?? 0)
        setUserBalance(pts)
        console.debug("MemberWalletPage setUserBalance ->", pts)
      } catch (err) {
        console.error("Failed to load wallet", err)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [auth?.userId])

  // Tỷ giá: 10,000 VND = 100 points => 1 point = 100 VND
  const VND_PER_POINT = 100
  const BASE_POINTS = 100
  const MULTIPLIERS = [1, 2, 5, 10, 20] // cấp số nhân từ gói 100, 200, 500, 1000, 2000 points

  const topupPackages = useMemo(() => {
    return MULTIPLIERS.map((m, idx) => {
      const points = BASE_POINTS * m
      const vnd = points * VND_PER_POINT
      return {
        id: `pkg-${points}`,
        title: `Gói ${points.toLocaleString()} Points`,
        description: `Nạp ${vnd.toLocaleString()} VND → nhận ${points.toLocaleString()} Points`,
        points,
        vnd,
        badge: idx === MULTIPLIERS.length - 1 ? "BEST VALUE" : undefined,
        color: ["blue", "green", "red", "purple", "gray"][idx % 5] as
          | "blue"
          | "green"
          | "red"
          | "purple"
          | "gray",
      }
    })
  }, [])

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "from-blue-500 to-blue-600 text-white"
      case "green":
        return "from-green-500 to-green-600 text-white"
      case "red":
        return "from-red-500 to-red-600 text-white"
      case "purple":
        return "from-purple-500 to-purple-600 text-white"
      case "gray":
        return "from-gray-500 to-gray-600 text-white"
      default:
        return "from-primary to-primary/80 text-primary-foreground"
    }
  }

  const handleSelectPackage = (amountVND: number) => {
    setSelectedAmountVND(amountVND)
    setIsTopupModalOpen(true)
    toast({
      title: "Đã chọn gói nạp",
      description: `Số tiền cần chuyển: ${amountVND.toLocaleString()} VND`,
    })
  }

  if (currentView === "history") {
    return (
      <ProtectedRoute allowedRoles={["member"]}>
        <AppShell>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("shop")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Shop
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Voucher History</h1>
                <p className="text-muted-foreground">Your redeemed vouchers and codes</p>
              </div>
            </div>

            <WalletHistory />
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["member"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">Wallet</h1>
            </div>
          </div>

          {/* Wallet Overview (clean version) */}
          <div className="grid gap-4">
            <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white">
              {/* decorative blobs */}
              <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-black/20 blur-3xl" />

              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Left: User identity */}
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white font-bold text-2xl ring-1 ring-white/20">
                      {(auth?.user?.fullName?.charAt(0) || "U").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/80">Tài khoản</p>
                      <h3 className="text-xl md:text-2xl font-semibold leading-tight">
                        {auth?.user?.fullName || "User"}
                      </h3>
                      <p className="text-sm text-white/70">Thành viên</p>
                    </div>
                  </div>

                  {/* Right: Balance + actions */}
                  <div className="w-full md:w-auto">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-white/80">Số dư hiện tại</p>
                      <div className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight">
                        {userBalance.toLocaleString()}{" "}
                        <span className="text-base font-semibold">Points</span>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setCurrentView("history")}
                          className="bg-white text-indigo-700 hover:bg-white/90"
                        >
                          Lịch sử
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top-up Packages */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topupPackages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className={`h-32 bg-gradient-to-br ${getColorClasses(pkg.color)} relative`}>
                  {pkg.badge && (
                    <Badge className="absolute top-3 right-3 bg-red-500 text-white">{pkg.badge}</Badge>
                  )}
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="text-xs opacity-90">TOP-UP</div>
                    <div className="text-lg font-bold">{pkg.points.toLocaleString()} Points</div>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg leading-tight">{pkg.title}</CardTitle>
                  <CardDescription className="text-sm">{pkg.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                    <div className="text-2xl font-bold text-primary">{pkg.vnd.toLocaleString()} VND</div>
                    <div className="text-sm text-muted-foreground">
                      {pkg.points.toLocaleString()} points @ 1 point = {VND_PER_POINT.toLocaleString()} VND
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button className="w-full" onClick={() => handleSelectPackage(pkg.vnd)}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Mua gói
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Truyền số tiền đã chọn xuống modal */}
        <TopupModal
          isOpen={isTopupModalOpen}
          onClose={() => setIsTopupModalOpen(false)}
          selectedAmountVND={selectedAmountVND ?? undefined}
        />
      </AppShell>
    </ProtectedRoute>
  )
}
