"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Info, Users, MapPin, Calendar, Award } from "lucide-react"
import { putEventStatus } from "@/service/eventApi"
import { useToast } from "@/hooks/use-toast"

// Chính sách cho điểm cứng
const POINT_POLICIES = [
  {
    icon: Users,
    title: "Event Scale",
    items: [
      { label: "Small (< 50 attendees)", points: "500 - 1,000 pts" },
      { label: "Medium (50-150 attendees)", points: "1,000 - 3,000 pts" },
      { label: "Large (> 150 attendees)", points: "3,000 - 5,000 pts" },
    ]
  },
  {
    icon: MapPin,
    title: "Venue Type",
    items: [
      { label: "Campus Indoor", points: "+0 pts" },
      { label: "Campus Outdoor", points: "+200 pts" },
      { label: "Off-campus Venue", points: "+500 - 1,000 pts" },
    ]
  },
  {
    icon: Award,
    title: "Event Type",
    items: [
      { label: "Workshop/Seminar", points: "Standard rate" },
      { label: "Competition/Contest", points: "+500 pts" },
      { label: "Festival/Fair", points: "+1,000 pts" },
    ]
  }
]

type ApproveBudgetModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: number
  hostClubId: number
  hostClubName?: string
  defaultRequestPoints?: number
  onApproved?: (approvedBudgetPoints: number) => void
}

export function ApproveBudgetModal(props: ApproveBudgetModalProps) {
  const { open, onOpenChange, eventId, hostClubId, hostClubName, defaultRequestPoints = 0, onApproved } = props
  const { toast } = useToast()

  const [submitting, setSubmitting] = useState(false)
  const [approvedPointsInput, setApprovedPointsInput] = useState<string>(() => String(defaultRequestPoints || 0))
  const [policyChecked, setPolicyChecked] = useState(false)

  useEffect(() => {
    if (!open) return
    setApprovedPointsInput(String(defaultRequestPoints || 0))
  }, [open, defaultRequestPoints])

  const approvedPoints = useMemo(() => {
    const n = Number(approvedPointsInput)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }, [approvedPointsInput])

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await putEventStatus(eventId, approvedPoints)
      toast({
        title: "Approved",
        description: `Approved ${approvedPoints.toLocaleString()} pts for ${hostClubName || "club"}`
      })
      onApproved?.(approvedPoints)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: "Approval failed",
        description: err?.response?.data?.message || err?.message || "Could not approve budget",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve Event Budget</DialogTitle>
          <DialogDescription>
            Set approved points for the event. Club: {hostClubName || `#${hostClubId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Approval form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approvedPoints" className="text-base font-semibold">
                Approved Budget Points
              </Label>
              <Input
                id="approvedPoints"
                value={approvedPointsInput}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === "" || /^\d+$/.test(v)) {
                    setApprovedPointsInput(v)
                  }
                }}
                inputMode="numeric"
                placeholder="0"
                className="text-lg h-12"
              />
              <p className="text-sm text-muted-foreground">
                Enter the approved budget points for this event
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={submitting || approvedPointsInput === "" || !policyChecked}>
                {submitting ? "Approving..." : "Approve Budget"}
              </Button>
            </div>
          </div>

          {/* Right side: Point allocation policy */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-base">Point Allocation Guidelines</h3>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {POINT_POLICIES.map((policy, idx) => {
                const IconComponent = policy.icon
                return (
                  <Card key={idx} className="shadow-sm">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        {policy.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <ul className="space-y-1.5">
                        {policy.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="text-xs flex justify-between items-center">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-semibold text-primary">{item.points}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )
              })}
              {/* Checkbox xác nhận đã đọc */}
              <div className="flex items-center gap-2 mt-4 p-2 border rounded bg-muted">
                <Checkbox
                  id="policyChecked"
                  checked={policyChecked}
                  onCheckedChange={val => setPolicyChecked(val === true)}
                />
                <label htmlFor="policyChecked" className="text-xs select-none cursor-pointer">
                  I confirm that I have read and understood the entire scoring policy above.
                </label>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


