"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { CheckCircle, History, Scan, TrendingUp, Clock, Award, Users, Activity } from "lucide-react"
import { useRouter } from "next/navigation"

// Import data
import offers from "@/src/data/offers.json"

export default function StaffHomePage() {
  const { auth } = useAuth()
  const { vouchers, staffHistory } = useData()
  const router = useRouter()

  // For demo purposes, assume this staff works for CoffeeLab
  const partnerName = "CoffeeLab"
  const partnerOffers = offers.filter((o) => o.partner === partnerName)
  const partnerOfferIds = partnerOffers.map((o) => o.id)

  // Get staff's validation history
  const myValidations = staffHistory.filter((h) => h.staffUserId === auth.userId)

  // Get partner vouchers that could be validated
  const partnerVouchers = vouchers.filter((v) => partnerOfferIds.includes(v.offerId))
  const activeVouchers = partnerVouchers.filter((v) => !v.used)
  const validatedVouchers = partnerVouchers.filter((v) => v.used)

  // Recent validations (last 5)
  const recentValidations = myValidations
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, 5)

  // Today's validations
  const todayValidations = myValidations.filter(
    (v) => new Date(v.when).toDateString() === new Date().toDateString(),
  ).length

  return (
    <ProtectedRoute allowedRoles={["staff"]}>
      <AppShell>
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-balance mb-2">Staff Portal</h1>
                  <p className="text-emerald-100 text-lg">Welcome back, {auth.user?.fullName}</p>
                  <Badge variant="secondary" className="mt-3 bg-white/20 text-white border-white/30">
                    {partnerName} Staff
                  </Badge>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{myValidations.length}</p>
                    <p className="text-emerald-100 text-sm">Total Validations</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="staff-card-hover border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-blue-700">Active Vouchers</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Scan className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-1">{activeVouchers.length}</div>
                <p className="text-xs text-blue-600/70 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Ready to validate
                </p>
              </CardContent>
            </Card>

            <Card className="staff-card-hover border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-700">My Validations</CardTitle>
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600 mb-1">{myValidations.length}</div>
                <p className="text-xs text-emerald-600/70 flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  Total processed
                </p>
              </CardContent>
            </Card>

            <Card className="staff-card-hover border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-orange-700">Today's Activity</CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-1">{todayValidations}</div>
                <p className="text-xs text-orange-600/70 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Validations today
                </p>
              </CardContent>
            </Card>

            <Card className="staff-card-hover border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-purple-700">Partner Info</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-purple-600 mb-1">{partnerName}</div>
                <p className="text-xs text-purple-600/70 flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  {partnerOffers.length} active offers
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card
              className="staff-card-hover border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white cursor-pointer overflow-hidden relative group"
              onClick={() => router.push("/staff/validate")}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Scan className="h-6 w-6" />
                  </div>
                  Validate Voucher
                </CardTitle>
                <CardDescription className="text-emerald-100">
                  Scan or enter voucher codes to validate customer redemptions
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-100">Ready for validation</span>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {activeVouchers.length} vouchers
                    </Badge>
                  </div>
                  <Button className="w-full bg-white text-emerald-600 hover:bg-white/90 font-semibold">
                    <Scan className="h-4 w-4 mr-2" />
                    Start Validation
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card
              className="staff-card-hover border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white cursor-pointer overflow-hidden relative group"
              onClick={() => router.push("/staff/history")}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <History className="h-6 w-6" />
                  </div>
                  My History
                </CardTitle>
                <CardDescription className="text-blue-100">
                  View your validation history and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-100">Total completed</span>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {myValidations.length} validations
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold"
                  >
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {recentValidations.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  Recent Validations
                </CardTitle>
                <CardDescription>Your latest voucher validations and activity</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentValidations.map((validation, index) => {
                    const offer = offers.find((o) => o.id === validation.offerId)
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow bg-gradient-to-r from-white to-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Code: {validation.code}</p>
                            <p className="text-sm text-gray-600">{offer?.title}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                            Validated
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{new Date(validation.when).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
