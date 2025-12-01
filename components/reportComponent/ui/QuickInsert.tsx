"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Calendar, Gift, ShoppingCart, UserCheck, Wallet, ClipboardList, BarChart3, CheckCircle } from "lucide-react"

type Props = {
  onMembers: () => void
  onEvents: () => void
  onGifts: () => void
  onOrders: () => void
  onApplications: () => void
  onWallet: () => void
  onFeedback?: () => void
  onLeaveRequests?: () => void
  onActivityScores?: () => void
  onCoHostEvents?: () => void
  onAttendance?: () => void
  onEventStaff?: () => void
}

export function QuickInsert({ onMembers, onEvents, onGifts, onOrders, onApplications, onWallet, onFeedback, onLeaveRequests, onActivityScores, onCoHostEvents, onAttendance, onEventStaff }: Props) {
  return (
    <div className="lg:hidden mb-3">
      <Card className="p-3 shadow-sm">
        <h3 className="font-semibold mb-2 text-sm">Quick Insert</h3>
        <div className="flex gap-2 overflow-x-scroll pb-1 whitespace-nowrap min-w-0" style={{ WebkitOverflowScrolling: "touch" }}>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMembers() }}>
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Members
          </Button>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEvents() }}>
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Events
          </Button>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGifts() }}>
            <Gift className="h-3.5 w-3.5 mr-1.5" />
            Products
          </Button>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOrders() }}>
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            Orders
          </Button>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onApplications() }}>
            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
            Applications
          </Button>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWallet() }}>
            <Wallet className="h-3.5 w-3.5 mr-1.5" />
            Wallet
          </Button>
          {onFeedback && (
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFeedback() }}>
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
              Feedbacks
            </Button>
          )}
          {onActivityScores && (
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onActivityScores() }}>
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Activity
            </Button>
          )}
          {onLeaveRequests && (
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLeaveRequests() }}>
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Leave Req
            </Button>
          )}
          {onCoHostEvents && (
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCoHostEvents() }}>
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Co-Host
            </Button>
          )}
          {onAttendance && (
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAttendance() }}>
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Attendance
            </Button>
          )}
          {onEventStaff && (
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEventStaff() }}>
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Staff
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}


