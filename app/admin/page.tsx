"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/contexts/data-context"
import { Gift, TrendingUp, CheckCircle, Clock } from "lucide-react"

// Removed static `src/data` imports — use empty fallbacks. Replace with real data from API/context later.
const offers: any[] = []
const redemptions: any[] = []
const users: any[] = []

export default function PartnerDashboard() {
  const { vouchers } = useData()

  // For demo purposes, assume this admin manages CoffeeLab offers
  const partnerName = "CoffeeLab"
  const partnerOffers = offers.filter((o) => o.partner === partnerName)
  const partnerRedemptions = redemptions.filter((r) => {
    const offer = offers.find((o) => o.id === r.offerId)
    return offer?.partner === partnerName
  })

  const partnerVouchers = vouchers.filter((v) => {
    const offer = offers.find((o) => o.id === v.offerId)
    return offer?.partner === partnerName
  })

  const totalOffers = partnerOffers.length
  const totalRedemptions = partnerRedemptions.length + partnerVouchers.length
  const usedVouchers = partnerVouchers.filter((v) => v.used).length + partnerRedemptions.length
  const activeVouchers = partnerVouchers.filter((v) => !v.used).length

  // Recent activity (combine redemptions and vouchers)
  const recentActivity = [
    ...partnerRedemptions.map((r) => ({ ...r, type: "historical" })),
    ...partnerVouchers.filter((v) => v.used).map((v) => ({ ...v, type: "recent" })),
  ].slice(0, 5)

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Admin Dashboard</h1>
            <p className="text-muted-foreground">Managing {partnerName} offers and redemptions</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Offers"
              value={totalOffers}
              description="Active offers"
              icon={Gift}
              variant="primary"
            />
            <StatsCard
              title="Total Redemptions"
              value={totalRedemptions}
              description="All time"
              icon={TrendingUp}
              trend={{ value: 12, label: "from last month" }}
              variant="success"
            />
            <StatsCard
              title="Used Vouchers"
              value={usedVouchers}
              description="Completed transactions"
              icon={CheckCircle}
              variant="info"
            />
            <StatsCard
              title="Active Vouchers"
              value={activeVouchers}
              description="Pending redemption"
              icon={Clock}
              variant="warning"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Offer Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Offer Performance</CardTitle>
                <CardDescription>Your most popular offers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partnerOffers.map((offer) => {
                    const offerRedemptions = [
                      ...partnerRedemptions.filter((r) => r.offerId === offer.id),
                      ...partnerVouchers.filter((v) => v.offerId === offer.id),
                    ]
                    return (
                      <div key={offer.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{offer.title}</p>
                          <p className="text-sm text-muted-foreground">{offer.costPoints} points</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{offerRedemptions.length} redemptions</p>
                          <p className="text-xs text-muted-foreground">
                            {partnerOffers.length > 0 ? Math.round(offerRedemptions.length / partnerOffers.length) : 0}{" "}
                            avg
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest voucher redemptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  ) : (
                    recentActivity.map((activity, index) => {
                      const user = users.find((u) => u.id === activity.userId)
                      const offer = offers.find((o) => o.id === activity.offerId)
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {user?.fullName || "Unknown User"} redeemed {offer?.title || "Unknown Offer"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.date || activity.redeemedAt
                                ? new Date(activity.date || activity.redeemedAt).toLocaleDateString()
                                : "Recently"}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Key metrics for {partnerName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalOffers}</div>
                  <div className="text-sm text-muted-foreground">Total Offers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{totalRedemptions}</div>
                  <div className="text-sm text-muted-foreground">Total Redemptions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {partnerOffers.length > 0 ? Math.round(totalRedemptions / partnerOffers.length) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg per Offer</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {totalRedemptions > 0 ? Math.round((usedVouchers / totalRedemptions) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
