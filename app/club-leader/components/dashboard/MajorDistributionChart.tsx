"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface MajorDistributionChartProps {
  membersByMajor: Record<string, number>
  membersLoading: boolean
}

export function MajorDistributionChart({ membersByMajor, membersLoading }: MajorDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Users className="h-5 w-5 text-primary" />
          Top Majors by Member Count
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm truncate">
          Top {window.innerWidth < 640 ? '5' : '8'} majors with most members
        </CardDescription>
      </CardHeader>
      <CardContent>
        {membersLoading ? (
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        ) : Object.keys(membersByMajor).length === 0 ? (
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No major data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
            <BarChart
              data={Object.entries(membersByMajor)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, window.innerWidth < 640 ? 5 : 8)
                .map(([major, count]) => {
                  const maxLength = window.innerWidth < 640 ? 12 : 20
                  return {
                    major: major.length > maxLength ? major.substring(0, maxLength) + "..." : major,
                    count: count,
                  }
                })}
              layout="horizontal"
              margin={{ 
                top: 5, 
                right: window.innerWidth < 640 ? 10 : 30, 
                left: window.innerWidth < 640 ? 0 : 20, 
                bottom: window.innerWidth < 640 ? 70 : 60 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="major" 
                angle={-45} 
                textAnchor="end" 
                height={window.innerWidth < 640 ? 70 : 80}
                tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
              />
              <YAxis tick={{ fontSize: window.innerWidth < 640 ? 11 : 14 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

