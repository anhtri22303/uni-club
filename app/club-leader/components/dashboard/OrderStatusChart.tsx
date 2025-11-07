"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingCart } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface OrderStatusChartProps {
  completedOrders: number
  pendingOrders: number
  cancelledOrders: number
  totalOrders: number
  additionalDataLoading: boolean
}

export function OrderStatusChart({
  completedOrders,
  pendingOrders,
  cancelledOrders,
  totalOrders,
  additionalDataLoading
}: OrderStatusChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <ShoppingCart className="h-5 w-5 text-orange-600" />
          Order Status
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">{totalOrders} total orders</CardDescription>
      </CardHeader>
      <CardContent>
        {additionalDataLoading ? (
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        ) : totalOrders === 0 ? (
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No order data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Completed", value: completedOrders, color: "#22c55e" },
                  { name: "Pending", value: pendingOrders, color: "#eab308" },
                  { name: "Cancelled", value: cancelledOrders, color: "#ef4444" },
                ].filter(item => item.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => {
                  const isMobile = window.innerWidth < 640
                  return isMobile ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(0)}%`
                }}
                outerRadius={window.innerWidth < 640 ? 60 : 80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: "Completed", value: completedOrders, color: "#22c55e" },
                  { name: "Pending", value: pendingOrders, color: "#eab308" },
                  { name: "Cancelled", value: cancelledOrders, color: "#ef4444" },
                ].filter(item => item.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

