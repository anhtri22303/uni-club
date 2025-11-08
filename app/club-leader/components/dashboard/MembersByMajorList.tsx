"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users } from "lucide-react"

interface MembersByMajorListProps {
  membersByMajor: Record<string, number>
  totalMembers: number
  membersLoading: boolean
}

export function MembersByMajorList({ membersByMajor, totalMembers, membersLoading }: MembersByMajorListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          Members by Major
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Distribution across majors</CardDescription>
      </CardHeader>
      <CardContent>
        {membersLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : Object.keys(membersByMajor).length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-sm">No major data available</p>
        ) : (
          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {Object.entries(membersByMajor)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 10)
              .map(([major, count]) => (
                <div key={major} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate">{major}</p>
                    <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                        style={{ width: `${Math.round(((count as number) / totalMembers) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-3 min-w-[3rem] justify-center">
                    {count as number}
                  </Badge>
                </div>
              ))}
            {Object.keys(membersByMajor).length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                Showing top 10 of {Object.keys(membersByMajor).length} majors
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

