"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts"

interface WalletOverviewChartProps {
  walletBalance: number
  totalPointsGiven: number
  totalPointsRedeemed: number
  additionalDataLoading: boolean
}

export function WalletOverviewChart({
  walletBalance,
  totalPointsGiven,
  totalPointsRedeemed,
  additionalDataLoading
}: WalletOverviewChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Wallet className="h-5 w-5 text-cyan-600" />
          Wallet Overview
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Points distribution</CardDescription>
      </CardHeader>
      <CardContent>
        {additionalDataLoading ? (
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
            <BarChart
              data={[
                {
                  name: "Balance",
                  points: walletBalance,
                  fill: "#06b6d4"
                },
                {
                  name: "Given",
                  points: totalPointsGiven,
                  fill: "#22c55e"
                },
                {
                  name: "Redeemed",
                  points: totalPointsRedeemed,
                  fill: "#f97316"
                },
              ]}
              margin={{ 
                top: 20, 
                right: window.innerWidth < 640 ? 10 : 30, 
                left: window.innerWidth < 640 ? 0 : 20, 
                bottom: 5 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: window.innerWidth < 640 ? 11 : 14 }}
              />
              <YAxis tick={{ fontSize: window.innerWidth < 640 ? 11 : 14 }} />
              <Tooltip />
              <Bar dataKey="points" fill="#8884d8" radius={[8, 8, 0, 0]}>
                {[
                  { fill: "#06b6d4" },
                  { fill: "#22c55e" },
                  { fill: "#f97316" },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

