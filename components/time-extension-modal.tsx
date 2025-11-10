"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Loader2 } from "lucide-react"

interface TimeExtensionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (newDate: string, newStartTime: string, newEndTime: string, reason: string) => Promise<void>
  currentDate: string
  currentStartTime: string
  currentEndTime: string
  eventName: string
  isSubmitting?: boolean
}

export function TimeExtensionModal({
  open,
  onOpenChange,
  onSubmit,
  currentDate,
  currentStartTime,
  currentEndTime,
  eventName,
  isSubmitting = false
}: TimeExtensionModalProps) {
  const [newDate, setNewDate] = useState(currentDate)
  const [newEndTime, setNewEndTime] = useState(currentEndTime)
  const [reason, setReason] = useState("")
  const [errors, setErrors] = useState<{ date?: string; endTime?: string; reason?: string }>({})

  const validateForm = () => {
    const newErrors: { date?: string; endTime?: string; reason?: string } = {}

    // Validate date
    if (!newDate) {
      newErrors.date = "Date is required"
    } else {
      const selectedDate = new Date(newDate)
      const currDate = new Date(currentDate)
      if (selectedDate < currDate) {
        newErrors.date = "New date must be after or equal to current date"
      }
    }

    // Validate end time
    if (!newEndTime) {
      newErrors.endTime = "End time is required"
    } else if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(newEndTime)) {
      newErrors.endTime = "Invalid time format (HH:mm)"
    }

    // Validate time range (end time should be after start time if on same date)
    if (newDate === currentDate && newEndTime <= currentStartTime) {
      newErrors.endTime = "End time must be after current start time on the same date"
    }

    // Validate reason
    if (!reason.trim()) {
      newErrors.reason = "Reason is required"
    } else if (reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters"
    } else if (reason.trim().length > 500) {
      newErrors.reason = "Reason must not exceed 500 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      // Always use current start time (no change)
      await onSubmit(newDate, currentStartTime, newEndTime, reason.trim())
      // Reset form on success
      setReason("")
      setErrors({})
    } catch (error) {
      // Error is handled by parent component
      console.error("Failed to extend event time:", error)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      // Reset form when closing
      setNewDate(currentDate)
      setNewEndTime(currentEndTime)
      setReason("")
      setErrors({})
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Extend Event Time</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Extend the end time for <span className="font-semibold text-foreground">{eventName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Time Display */}
          <div className="p-4 bg-muted/50 rounded-lg border border-muted">
            <div className="text-sm font-medium text-muted-foreground mb-2">Current Event Time</div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">{currentDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">{currentStartTime} - {currentEndTime}</span>
              </div>
            </div>
          </div>

          {/* New Date */}
          <div className="space-y-2">
            <Label htmlFor="newDate" className="text-sm font-medium">
              New Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newDate"
              type="date"
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value)
                setErrors({ ...errors, date: undefined })
              }}
              min={currentDate}
              disabled={isSubmitting}
              className={errors.date ? "border-destructive" : ""}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
          </div>

          {/* New Start Time - DISABLED (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="newStartTime" className="text-sm font-medium">
              Start Time <span className="text-muted-foreground text-xs">(unchanged)</span>
            </Label>
            <Input
              id="newStartTime"
              type="time"
              value={currentStartTime}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Start time cannot be changed. Only date and end time can be extended.
            </p>
          </div>

          {/* New End Time */}
          <div className="space-y-2">
            <Label htmlFor="newEndTime" className="text-sm font-medium">
              New End Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newEndTime"
              type="time"
              value={newEndTime}
              onChange={(e) => {
                setNewEndTime(e.target.value)
                setErrors({ ...errors, endTime: undefined })
              }}
              disabled={isSubmitting}
              className={errors.endTime ? "border-destructive" : ""}
            />
            {errors.endTime && (
              <p className="text-sm text-destructive">{errors.endTime}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason for Extension <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for extending the event time..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setErrors({ ...errors, reason: undefined })
              }}
              disabled={isSubmitting}
              className={`min-h-[100px] resize-none ${errors.reason ? "border-destructive" : ""}`}
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              {errors.reason ? (
                <p className="text-sm text-destructive">{errors.reason}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Minimum 10 characters required
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {reason.length}/500
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Extension"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

