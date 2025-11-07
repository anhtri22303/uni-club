"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet } from "lucide-react"

interface WalletStatsCardProps {
  walletBalance: number
  totalTransactions: number
  totalPointsGiven: number
  avgTransaction: number
  totalAttendanceRecords: number
  additionalDataLoading: boolean
}

export function WalletStatsCard({
  walletBalance,
  totalTransactions,
  totalPointsGiven,
  avgTransaction,
  totalAttendanceRecords,
  additionalDataLoading
}: WalletStatsCardProps) {
  return (
    <Card className="border-4 border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50 transition-all shadow-lg hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-cyan-600">
              {additionalDataLoading ? "..." : walletBalance.toLocaleString()}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base font-medium mt-1">Wallet Balance (pts)</CardDescription>
          </div>
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-cyan-500/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Transactions:</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {totalTransactions}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Points Given:</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {totalPointsGiven.toLocaleString()}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Avg Transaction:</span>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {avgTransaction.toLocaleString()} pts
            </Badge>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-muted-foreground font-medium">Attendance Records:</span>
            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
              {totalAttendanceRecords}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

