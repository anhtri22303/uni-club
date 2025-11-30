"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Calendar, FileText } from "lucide-react"

interface AnalyticsTabProps {
  clubsWithMemberCount: any[]
  totalClubApplications: number
  completedClubApplications: number
  pendingClubApplications: number
  rejectedClubApplications: number
  totalEventRequests: number
  pendingCoClubEvents: number
  pendingUniStaffEvents: number
  approvedEventsCount: number
  ongoingEventsCount: number
  completedEventsCount: number
  rejectedEventsCount: number
  cancelledEventsCount: number
}

export function AnalyticsTab({
  clubsWithMemberCount,
  totalClubApplications,
  completedClubApplications,
  pendingClubApplications,
  rejectedClubApplications,
  totalEventRequests,
  pendingCoClubEvents,
  pendingUniStaffEvents,
  approvedEventsCount,
  ongoingEventsCount,
  completedEventsCount,
  rejectedEventsCount,
  cancelledEventsCount
}: AnalyticsTabProps) {
  const [hoveredClub, setHoveredClub] = useState<{ name: string; members: number; x: number; y: number } | null>(null)
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Analytics Dashboard with Charts */}
      
      {/* Row 1: Club Applications and Event Requests Donut Charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Club Applications Donut Chart */}
        <Card className="border-2 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <div className="p-1 sm:p-1.5 bg-green-500 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="truncate">Club Applications Status</span>
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">Distribution of club application statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row lg:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
              {/* Donut Chart */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {totalClubApplications > 0 ? (
                    <>
                      {/* Pending Arc */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="20"
                        strokeDasharray={`${(pendingClubApplications / totalClubApplications) * 251.2} 251.2`}
                        className="transition-all duration-500"
                      />
                      {/* Completed Arc */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="20"
                        strokeDasharray={`${(completedClubApplications / totalClubApplications) * 251.2} 251.2`}
                        strokeDashoffset={`-${(pendingClubApplications / totalClubApplications) * 251.2}`}
                        className="transition-all duration-500"
                      />
                      {/* Rejected Arc */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeDasharray={`${(rejectedClubApplications / totalClubApplications) * 251.2} 251.2`}
                        strokeDashoffset={`-${((pendingClubApplications + completedClubApplications) / totalClubApplications) * 251.2}`}
                        className="transition-all duration-500"
                      />
                    </>
                  ) : (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl sm:text-3xl font-bold">{totalClubApplications}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Total</div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex-1 space-y-2 sm:space-y-3 w-full">
                <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-500 flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm">Pending</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{pendingClubApplications}</span>
                    <span className="text-[10px] sm:text-xs md:text-sm text-yellow-600">
                      ({totalClubApplications > 0 ? Math.round((pendingClubApplications / totalClubApplications) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm">Completed</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{completedClubApplications}</span>
                    <span className="text-[10px] sm:text-xs md:text-sm text-green-600">
                      ({totalClubApplications > 0 ? Math.round((completedClubApplications / totalClubApplications) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm">Rejected</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{rejectedClubApplications}</span>
                    <span className="text-[10px] sm:text-xs md:text-sm text-red-600">
                      ({totalClubApplications > 0 ? Math.round((rejectedClubApplications / totalClubApplications) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clubs by Member Count */}
      <Card className="border-2 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
            <div className="p-1 sm:p-1.5 bg-blue-500 rounded-lg flex-shrink-0">
              <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="truncate">Top 10 Clubs by Members</span>
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">Most popular clubs based on member count</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const topClubs = clubsWithMemberCount.slice(0, 10)
            const maxMembers = Math.max(...topClubs.map((c: any) => c.memberCount || 0), 1)
            
            // Chart dimensions - increased height for better spacing
            const chartHeight = 350
            const chartWidth = 900
            const padding = { top: 40, right: 40, bottom: 60, left: 60 }
            const graphHeight = chartHeight - padding.top - padding.bottom
            const graphWidth = chartWidth - padding.left - padding.right
            
            // Calculate points for the line
            const points = topClubs.map((club: any, index: number) => {
              const x = padding.left + (index * graphWidth) / Math.max(topClubs.length - 1, 1)
              const y = padding.top + graphHeight - ((club.memberCount || 0) / maxMembers) * graphHeight
              return { x, y, club, index }
            })
            
            // Create smooth curve path using quadratic bezier curves
            const linePath = points.map((p, i) => {
              if (i === 0) return `M ${p.x} ${p.y}`
              const prevPoint = points[i - 1]
              const midX = (prevPoint.x + p.x) / 2
              return `Q ${prevPoint.x} ${prevPoint.y} ${midX} ${(prevPoint.y + p.y) / 2} Q ${p.x} ${p.y} ${p.x} ${p.y}`
            }).join(' ')
            
            // Create area path (fill under the line)
            const areaPath = points.length > 0 
              ? `M ${points[0].x} ${padding.top + graphHeight} L ${points[0].x} ${points[0].y} ${points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')} L ${points[points.length - 1].x} ${padding.top + graphHeight} Z`
              : ''
              
            return (
              <div className="w-full overflow-x-auto pb-2 relative">
                <svg 
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                  className="w-full" 
                  style={{ minWidth: '600px' }}
                >
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
                    const y = padding.top + graphHeight * (1 - percent)
                    return (
                      <g key={percent}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={padding.left + graphWidth}
                          y2={y}
                          stroke="currentColor"
                          strokeOpacity="0.08"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={padding.left - 15}
                          y={y + 5}
                          textAnchor="end"
                          fontSize="11"
                          fill="currentColor"
                          opacity="0.5"
                          fontWeight="500"
                        >
                          {Math.round(maxMembers * percent)}
                        </text>
                      </g>
                    )
                  })}
                  
                  {/* Area fill under the line */}
                  <path
                    d={areaPath}
                    fill="url(#areaGradient)"
                  />
                  
                  {/* Line with gradient */}
                  <path
                    d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Points and labels */}
                  {points.map((point, i) => (
                    <g key={i}>
                      {/* Rank label below x-axis */}
                      <text
                        x={point.x}
                        y={padding.top + graphHeight + 20}
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight="bold"
                        fill="currentColor"
                        opacity="0.7"
                      >
                        #{i + 1}
                      </text>
                      
                      {/* Point circle with glow effect */}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="8"
                        fill="#3b82f6"
                        fillOpacity="0.2"
                        className="transition-all"
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        className="cursor-pointer transition-all hover:r-7"
                        onMouseEnter={(e) => {
                          const svg = e.currentTarget.ownerSVGElement
                          if (svg) {
                            const pt = svg.createSVGPoint()
                            pt.x = e.clientX
                            pt.y = e.clientY
                            const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
                            setHoveredClub({
                              name: point.club.clubName || 'Unknown',
                              members: point.club.memberCount || 0,
                              x: svgP.x,
                              y: svgP.y
                            })
                          }
                        }}
                        onMouseLeave={() => setHoveredClub(null)}
                      />
                      
                      {/* Member count label above point with background */}
                      <g>
                        <rect
                          x={point.x - 18}
                          y={point.y - 30}
                          width="36"
                          height="18"
                          rx="9"
                          fill="#3b82f6"
                          opacity="0.9"
                        />
                        <text
                          x={point.x}
                          y={point.y - 18}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="bold"
                          fill="white"
                        >
                          {point.club.memberCount || 0}
                        </text>
                      </g>
                    </g>
                  ))}
                  
                  {/* Y-axis label */}
                  <text
                    x={15}
                    y={padding.top + graphHeight / 2}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="currentColor"
                    opacity="0.6"
                    transform={`rotate(-90 15 ${padding.top + graphHeight / 2})`}
                  >
                    Number of Members
                  </text>
                  
                  {/* Title */}

                </svg>
                
                {/* Hover Tooltip */}
                {hoveredClub && (
                  <div 
                    className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium z-10 pointer-events-none whitespace-nowrap"
                    style={{
                      left: `${(hoveredClub.x / 900) * 100}%`,
                      top: `${(hoveredClub.y / 350) * 100 - 10}%`,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <div className="font-bold text-blue-300">{hoveredClub.name}</div>
                    <div className="text-xs text-gray-300">{hoveredClub.members} members</div>
                  </div>
                )}
                
                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30">
                    <div className="w-3 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded" />
                    <span className="text-muted-foreground font-medium">Member Trend</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30">
                    <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500" />
                    <span className="text-muted-foreground font-medium">Hover for club details</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}

