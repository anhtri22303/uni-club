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
  onSubmit: (newEndDate: string, newEndTime: string, reason: string) => Promise<void>
  currentEndDate: string
  currentEndTime: string
  eventName: string
  isSubmitting?: boolean
}

export function TimeExtensionModal({
  open,
  onOpenChange,
  onSubmit,
  currentEndDate,
  currentEndTime,
  eventName,
  isSubmitting = false
}: TimeExtensionModalProps) {
  const [newEndDate, setNewEndDate] = useState(currentEndDate)
  const [newEndTime, setNewEndTime] = useState(currentEndTime)
  const [reason, setReason] = useState("")
  const [errors, setErrors] = useState<{ date?: string; time?: string; reason?: string }>({})

  const validateForm = () => {
    const newErrors: { date?: string; time?: string; reason?: string } = {}

    // Validate date
    if (!newEndDate) {
      newErrors.date = "End date is required"
    } else {
      const selectedDate = new Date(newEndDate)
      const currentDate = new Date(currentEndDate)
      if (selectedDate < currentDate) {
        newErrors.date = "New end date must be after or equal to current end date"
      }
    }

    // Validate time
    if (!newEndTime) {
      newErrors.time = "End time is required"
    } else if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(newEndTime)) {
      newErrors.time = "Invalid time format (HH:MM)"
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
      await onSubmit(newEndDate, newEndTime, reason.trim())
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
      setNewEndDate(currentEndDate)
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
          {/* Current End Time Display */}
          <div className="p-4 bg-muted/50 rounded-lg border border-muted">
            <div className="text-sm font-medium text-muted-foreground mb-2">Current End Time</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">{currentEndDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">{currentEndTime}</span>
              </div>
            </div>
          </div>

          {/* New End Date */}
          <div className="space-y-2">
            <Label htmlFor="newEndDate" className="text-sm font-medium">
              New End Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newEndDate"
              type="date"
              value={newEndDate}
              onChange={(e) => {
                setNewEndDate(e.target.value)
                setErrors({ ...errors, date: undefined })
              }}
              min={currentEndDate}
              disabled={isSubmitting}
              className={errors.date ? "border-destructive" : ""}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
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
                setErrors({ ...errors, time: undefined })
              }}
              disabled={isSubmitting}
              className={errors.time ? "border-destructive" : ""}
            />
            {errors.time && (
              <p className="text-sm text-destructive">{errors.time}</p>
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

