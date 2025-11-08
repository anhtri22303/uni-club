"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Gift } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface ProductStatusChartProps {
  activeProducts: number
  inactiveProducts: number
  totalProducts: number
  additionalDataLoading: boolean
}

export function ProductStatusChart({
  activeProducts,
  inactiveProducts,
  totalProducts,
  additionalDataLoading
}: ProductStatusChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Gift className="h-5 w-5 text-purple-600" />
          Products Status
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">{totalProducts} total products</CardDescription>
      </CardHeader>
      <CardContent>
        {additionalDataLoading ? (
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        ) : totalProducts === 0 ? (
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No product data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Active", value: activeProducts, color: "#22c55e" },
                  { name: "Inactive", value: inactiveProducts, color: "#94a3b8" },
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
                  { name: "Active", value: activeProducts, color: "#22c55e" },
                  { name: "Inactive", value: inactiveProducts, color: "#94a3b8" },
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

