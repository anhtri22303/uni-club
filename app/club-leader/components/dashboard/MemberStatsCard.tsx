"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface MemberStatsCardProps {
  totalMembers: number
  leaderCount: number
  viceLeaderCount: number
  regularMembers: number
  staffMembers: number
  recentlyJoined: number
  membersLoading: boolean
}

export function MemberStatsCard({
  totalMembers,
  leaderCount,
  viceLeaderCount,
  regularMembers,
  staffMembers,
  recentlyJoined,
  membersLoading
}: MemberStatsCardProps) {
  return (
    <Card className="border-4 border-primary/30 bg-primary/5 hover:border-primary/50 transition-all shadow-lg hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
              {membersLoading ? "..." : totalMembers}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base font-medium mt-1">Total Members</CardDescription>
          </div>
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Leaders:</span>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {leaderCount + viceLeaderCount}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Regular Members:</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {regularMembers}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Staff Members:</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {staffMembers}
            </Badge>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-muted-foreground">Recently Joined (30d):</span>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              +{recentlyJoined}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

