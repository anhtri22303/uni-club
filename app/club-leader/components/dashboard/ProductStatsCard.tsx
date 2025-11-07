"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gift } from "lucide-react"

interface ProductStatsCardProps {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  totalStock: number
  totalProductValue: number
  additionalDataLoading: boolean
}

export function ProductStatsCard({
  totalProducts,
  activeProducts,
  inactiveProducts,
  totalStock,
  totalProductValue,
  additionalDataLoading
}: ProductStatsCardProps) {
  return (
    <Card className="border-4 border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50 transition-all shadow-lg hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-purple-600">
              {additionalDataLoading ? "..." : totalProducts}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base font-medium mt-1">Products/Gifts</CardDescription>
          </div>
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Active Products:</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {activeProducts}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Inactive Products:</span>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              {inactiveProducts}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Stock:</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {totalStock.toLocaleString()}
            </Badge>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-muted-foreground font-medium">Total Value:</span>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {totalProductValue.toLocaleString()} pts
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

