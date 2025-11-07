"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users } from "lucide-react"

interface ClubInfoCardProps {
  managedClub: any
  clubLoading: boolean
  policyName?: string | null
}

export function ClubInfoCard({ managedClub, clubLoading, policyName }: ClubInfoCardProps) {
  return (
    <Card className="border-l-4 border-l-primary shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          Club Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clubLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !managedClub ? (
          <div className="text-center py-8">
            <p className="text-destructive font-medium">Could not load club information</p>
            <p className="text-sm text-muted-foreground mt-2">Please check your permissions or contact support</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Club Name - Featured */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Club Name</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{managedClub.name}</p>
            </div>

            {/* Grid for Major and Policy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Major</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900">
                    {managedClub.majorName}
                  </Badge>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Policy</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900">
                    {policyName || managedClub.majorPolicyName || "No policy"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm leading-relaxed text-foreground">
                {managedClub.description || "No description available"}
              </p>
            </div>

            {/* Club Leader Info */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Club Leader:</span>
              <span className="text-sm font-medium truncate">{managedClub.leaderName}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

