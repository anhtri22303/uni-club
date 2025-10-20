"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WalletHistory } from "@/components/wallet-history"
import { TopupModal } from "@/components/topup-modal"
import { useWallet, useProfile } from "@/hooks/use-query-hooks"
import { ShoppingBag, ArrowLeft, Wallet, CreditCard, History, Sparkles, TrendingUp, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function MemberWalletPage() {
  // ✅ USE REACT QUERY HOOKS
  const { data: walletData, isLoading: walletLoading } = useWallet()
  const { data: profile } = useProfile()
  const userBalance = Number(walletData?.points ?? 0)
  
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<"shop" | "history">("shop")
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false)
  const [selectedAmountVND, setSelectedAmountVND] = useState<number | null>(null)

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
        title: `${points.toLocaleString()} Points Package`,
        description: `Top up ${vnd.toLocaleString()} VND → Get ${points.toLocaleString()} Points`,
        points,
        vnd,
        badge: idx === MULTIPLIERS.length - 1 ? "HOT DEAL" : idx === 2 ? "POPULAR" : undefined,
        gradient: [
          "from-slate-600 via-blue-600 to-gray-700",
          "from-blue-700 via-slate-700 to-indigo-700", 
          "from-teal-700 via-cyan-700 to-blue-800",
          "from-indigo-700 via-purple-700 to-slate-800",
          "from-gray-800 via-blue-800 to-black"
        ][idx],
        pointsColor: [
          "text-emerald-500",
          "text-blue-500",
          "text-purple-500", 
          "text-orange-500",
          "text-red-500"
        ][idx],
        icon: [CreditCard, Wallet, TrendingUp, Sparkles, Shield][idx],
      }
    })
  }, [])



  const handleSelectPackage = (amountVND: number) => {
    setSelectedAmountVND(amountVND)
    setIsTopupModalOpen(true)
    toast({
      title: "Package Selected",
      description: `Transfer amount: ${amountVND.toLocaleString()} VND`,
    })
  }

  if (currentView === "history") {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <AppShell>
          <div className="min-h-screen bg-gradient-to-br from-gray-100 via-slate-100 to-blue-100">
            <div className="space-y-8 p-6">
              {/* Enhanced Header with Blue Theme */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 via-blue-800 to-gray-800 p-6 shadow-2xl">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                <div className="relative flex items-center gap-6">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setCurrentView("shop")}
                    className="flex items-center gap-3 text-white hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-300"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Shop
                  </Button>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur">
                      <History className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">Transaction History</h1>
                      <p className="text-white/90">Track your vouchers and transactions</p>
                    </div>
                  </div>
                </div>
              </div>

              <WalletHistory />
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-slate-100 to-blue-100">
          <div className="space-y-8 p-6">
            {/* Enhanced Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-700 via-blue-800 to-gray-800 rounded-2xl text-white shadow-lg">
                <Wallet className="h-8 w-8" />
                <h1 className="text-3xl font-bold">UniClub Wallet</h1>
              </div>
              <p className="text-lg text-gray-800 font-medium">Smart financial management for students</p>
            </div>

            {/* Compact Premium Wallet Card */}
            <Card className="relative overflow-hidden bg-gradient-to-r from-slate-700 via-blue-800 to-gray-800 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left: User Info */}
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <span className="text-2xl font-bold text-white">
                        {((profile as any)?.fullName?.charAt(0) || "U").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white">
                        {(profile as any)?.fullName || "UniClub Member"}
                      </h2>
                      <Badge className="bg-white/15 text-white border-0 mt-1">
                        {(profile as any)?.email || "UniClub Member"}
                      </Badge>
                    </div>
                  </div>

                  {/* Right: Balance & Actions */}
                  <div className="text-center md:text-right">
                    <p className="text-white/80 text-sm font-medium mb-1">Current Balance</p>
                    <div className="text-4xl font-black text-white mb-1">
                      {userBalance.toLocaleString()}
                    </div>
                    <p className="text-white/90 text-sm mb-3">UniClub Points</p>
                    
                    <Button
                      onClick={() => setCurrentView("history")}
                      className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm transition-all duration-300"
                    >
                      <History className="h-4 w-4 mr-2" />
                      History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Top-up Packages */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-800">
                  Points Packages
                </h2>
                <p className="text-lg text-gray-700">Choose the package that fits your needs</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {topupPackages.map((pkg, index) => {
                  const IconComponent = pkg.icon
                  return (
                    <Card key={pkg.id} className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                      {/* Pastel blue panel for large header */}
                      <div className="relative h-32 bg-blue-900 flex items-center justify-center">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-3 right-3 w-12 h-12 border-2 border-white/30 rounded-full"></div>
                          <div className="absolute bottom-3 left-3 w-8 h-8 border-2 border-white/20 rounded-full"></div>
                        </div>

                        {/* Badge */}
                        {pkg.badge && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg font-bold text-xs px-2 py-1">
                              {pkg.badge}
                            </Badge>
                          </div>
                        )}

                        {/* Points Only (no icon) */}
                        <div className="text-center text-white z-10">
                          <div className="space-y-1">
                            <div className="text-xs font-medium opacity-90">UNICLUB POINTS</div>
                            <div
                              className={`text-3xl font-extrabold tracking-tight px-5 py-2 rounded-2xl mx-auto text-white drop-shadow-2xl border-4 border-white shadow-2xl ${[
                                "bg-blue-700",
                                "bg-blue-800",
                                "bg-blue-900",
                                "bg-sky-900",
                                "bg-cyan-900"
                              ][index]}`}
                            >
                              {pkg.points.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-gray-800 leading-tight">{pkg.title}</CardTitle>
                        <CardDescription className="text-sm text-gray-600 font-medium">{pkg.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Pricing Display - unified pastel panel */}
                        <div className="relative p-4 bg-gradient-to-r from-blue-100 via-sky-100 to-cyan-100 rounded-xl border border-blue-200 shadow-inner">
                          <div className="text-center space-y-1">
                            <div className="text-3xl font-black text-gray-800">
                              {pkg.vnd.toLocaleString()}
                              <span className="text-base font-bold ml-1">VND</span>
                            </div>
                            <div className={`text-sm font-medium ${pkg.pointsColor}`}>
                              {pkg.points.toLocaleString()} points • {VND_PER_POINT} VND/point
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button 
                          className="w-full h-12 text-base font-bold bg-gradient-to-r from-slate-700 via-blue-800 to-gray-800 hover:from-slate-800 hover:via-blue-900 hover:to-gray-900 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105" 
                          onClick={() => handleSelectPackage(pkg.vnd)}
                        >
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Buy Now
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Trust & Security Footer */}
            <Card className="border-0 bg-gray-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-8 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">100% Secure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Safe Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold">24/7 Support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Modal */}
        <TopupModal
          isOpen={isTopupModalOpen}
          onClose={() => setIsTopupModalOpen(false)}
          selectedAmountVND={selectedAmountVND ?? undefined}
        />
      </AppShell>
    </ProtectedRoute>
  )
}
