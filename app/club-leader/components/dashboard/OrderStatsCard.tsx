"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"

interface OrderStatsCardProps {
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  cancelledOrders: number
  totalPointsRedeemed: number
  additionalDataLoading: boolean
}

export function OrderStatsCard({
  totalOrders,
  completedOrders,
  pendingOrders,
  cancelledOrders,
  totalPointsRedeemed,
  additionalDataLoading
}: OrderStatsCardProps) {
  return (
    <Card className="border-4 border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50 transition-all shadow-lg hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-orange-600">
              {additionalDataLoading ? "..." : totalOrders}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base font-medium mt-1">Redeem Orders</CardDescription>
          </div>
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-orange-500/10 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Completed:</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {completedOrders}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pending:</span>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {pendingOrders}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cancelled:</span>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {cancelledOrders}
            </Badge>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-muted-foreground font-medium">Points Redeemed:</span>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {totalPointsRedeemed.toLocaleString()} pts
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

