"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Calendar, FileText } from "lucide-react"

interface AnalyticsTabProps {
  clubsWithMemberCount: any[]
  totalClubApplications: number
  approvedClubApplications: number
  pendingClubApplications: number
  rejectedClubApplications: number
  totalEventRequests: number
  approvedEvents: number
  pendingEvents: number
  rejectedEvents: number
}

export function AnalyticsTab({
  clubsWithMemberCount,
  totalClubApplications,
  approvedClubApplications,
  pendingClubApplications,
  rejectedClubApplications,
  totalEventRequests,
  approvedEvents,
  pendingEvents,
  rejectedEvents
}: AnalyticsTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Analytics Dashboard with Charts */}
      
      {/* Row 1: Club Applications and Event Requests Donut Charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Club Applications Donut Chart */}
        <Card className="border-2">
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
                      {/* Approved Arc */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="20"
                        strokeDasharray={`${(approvedClubApplications / totalClubApplications) * 251.2} 251.2`}
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
                        strokeDashoffset={`-${((pendingClubApplications + approvedClubApplications) / totalClubApplications) * 251.2}`}
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
                    <span className="font-medium text-xs sm:text-sm">Approved</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{approvedClubApplications}</span>
                    <span className="text-[10px] sm:text-xs md:text-sm text-green-600">
                      ({totalClubApplications > 0 ? Math.round((approvedClubApplications / totalClubApplications) * 100) : 0}%)
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

        {/* Event Requests Bar Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <div className="p-1 sm:p-1.5 bg-purple-500 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="truncate">Event Requests Status</span>
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">Distribution of event request statuses (non-expired only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {/* Total Count Display */}
              <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-3xl sm:text-4xl font-bold text-white-600">{totalEventRequests}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Requests</div>
              </div>

              {/* Bar Chart */}
              <div className="space-y-4 sm:space-y-6">
                {/* Pending Bar */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-yellow-500 flex-shrink-0" />
                      <span className="font-semibold text-xs sm:text-sm text-yellow-700 dark:text-yellow-400">Pending</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-500">{pendingEvents}</span>
                      <span className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-500 w-10 sm:w-12 text-right">
                        {totalEventRequests > 0 ? Math.round((pendingEvents / totalEventRequests) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 sm:h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                      style={{
                        width: `${totalEventRequests > 0 ? (pendingEvents / totalEventRequests) * 100 : 0}%`,
                        backgroundColor: '#eab308',
                      }}
                    >
                      {pendingEvents > 0 && (
                        <span className="text-[10px] sm:text-xs font-bold text-white px-1 sm:px-2">
                          {pendingEvents} request{pendingEvents !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Approved Bar */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-green-500 flex-shrink-0" />
                      <span className="font-semibold text-xs sm:text-sm text-green-700 dark:text-green-400">Approved</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-500">{approvedEvents}</span>
                      <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-500 w-10 sm:w-12 text-right">
                        {totalEventRequests > 0 ? Math.round((approvedEvents / totalEventRequests) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 sm:h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                      style={{
                        width: `${totalEventRequests > 0 ? (approvedEvents / totalEventRequests) * 100 : 0}%`,
                        backgroundColor: '#22c55e',
                      }}
                    >
                      {approvedEvents > 0 && (
                        <span className="text-[10px] sm:text-xs font-bold text-white px-1 sm:px-2">
                          {approvedEvents} request{approvedEvents !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rejected Bar */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-red-500 flex-shrink-0" />
                      <span className="font-semibold text-xs sm:text-sm text-red-700 dark:text-red-400">Rejected</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 dark:text-red-500">{rejectedEvents}</span>
                      <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-500 w-10 sm:w-12 text-right">
                        {totalEventRequests > 0 ? Math.round((rejectedEvents / totalEventRequests) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 sm:h-10 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-700 ease-out flex items-center justify-center"
                      style={{
                        width: `${totalEventRequests > 0 ? (rejectedEvents / totalEventRequests) * 100 : 0}%`,
                        backgroundColor: '#ef4444',
                      }}
                    >
                      {rejectedEvents > 0 && (
                        <span className="text-[10px] sm:text-xs font-bold text-white px-1 sm:px-2">
                          {rejectedEvents} request{rejectedEvents !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clubs by Member Count */}
      <Card className="border-2">
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
            
            // Chart dimensions
            const chartHeight = 300
            const chartWidth = 800
            const padding = { top: 20, right: 60, bottom: 80, left: 60 }
            const graphHeight = chartHeight - padding.top - padding.bottom
            const graphWidth = chartWidth - padding.left - padding.right
            
            // Calculate points for the line
            const points = topClubs.map((club: any, index: number) => {
              const x = padding.left + (index * graphWidth) / Math.max(topClubs.length - 1, 1)
              const y = padding.top + graphHeight - ((club.memberCount || 0) / maxMembers) * graphHeight
              return { x, y, club, index }
            })
            
            // Create path for the line
            const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
            
            // Create area path (fill under the line)
            const areaPath = points.length > 0 
              ? `M ${points[0].x} ${padding.top + graphHeight} ${points.map((p) => `L ${p.x} ${p.y}`).join(' ')} L ${points[points.length - 1].x} ${padding.top + graphHeight} Z`
              : ''
              
            return (
              <div className="w-full overflow-x-auto pb-2">
                <svg 
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                  className="w-full" 
                  style={{ minWidth: '400px' }}
                >
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
                          strokeOpacity="0.1"
                          strokeWidth="1"
                        />
                        <text
                          x={padding.left - 10}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="12"
                          fill="currentColor"
                          opacity="0.6"
                        >
                          {Math.round(maxMembers * percent)}
                        </text>
                      </g>
                    )
                  })}
                  
                  {/* Area fill under the line */}
                  <path
                    d={areaPath}
                    fill="url(#gradient)"
                    opacity="0.2"
                  />
                  
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  
                  {/* Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Points and labels */}
                  {points.map((point, i) => (
                    <g key={i}>
                      {/* Vertical line from point to x-axis */}
                      <line
                        x1={point.x}
                        y1={point.y}
                        x2={point.x}
                        y2={padding.top + graphHeight}
                        stroke="currentColor"
                        strokeOpacity="0.1"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      
                      {/* Point circle */}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="6"
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer hover:r-8 transition-all"
                      />
                      
                      {/* Member count label above point */}
                      <text
                        x={point.x}
                        y={point.y - 15}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#3b82f6"
                      >
                        {point.club.memberCount || 0}
                      </text>
                      
                      {/* Club name label (rotated) */}
                      <text
                        x={point.x}
                        y={padding.top + graphHeight + 15}
                        textAnchor="start"
                        fontSize="11"
                        fill="currentColor"
                        opacity="0.8"
                        transform={`rotate(45 ${point.x} ${padding.top + graphHeight + 15})`}
                      >
                        #{i + 1} {point.club.clubName?.length > 15 ? point.club.clubName.substring(0, 15) + '...' : point.club.clubName}
                      </text>
                    </g>
                  ))}
                  
                  {/* Y-axis label */}
                  <text
                    x={padding.left - 40}
                    y={padding.top + graphHeight / 2}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="currentColor"
                    opacity="0.6"
                    transform={`rotate(-90 ${padding.left - 40} ${padding.top + graphHeight / 2})`}
                  >
                    Members
                  </text>
                  
                  {/* X-axis label */}
                  <text
                    x={padding.left + graphWidth / 2}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="currentColor"
                    opacity="0.6"
                  >
                    Clubs (Ranked by Member Count)
                  </text>
                </svg>
                
                {/* Legend */}
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 sm:w-4 sm:h-1 bg-blue-500 rounded flex-shrink-0" />
                    <span className="text-muted-foreground">Member Count Trend</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 border-2 border-white flex-shrink-0" />
                    <span className="text-muted-foreground">Club Position</span>
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

