"use client"

import { useState } from "react"
import { X, Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { evaluateEventStaff, EventStaff } from "@/service/eventStaffApi"
import { useToast } from "@/hooks/use-toast"

interface EvaluateStaffModalProps {
  isOpen: boolean
  onClose: () => void
  staff: EventStaff
  onSuccess: () => void
}

type Performance = "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT"

const performanceOptions: { value: Performance; label: string; color: string }[] = [
  { value: "POOR", label: "Poor", color: "bg-red-100 text-red-700 border-red-500" },
  { value: "AVERAGE", label: "Average", color: "bg-yellow-100 text-yellow-700 border-yellow-500" },
  { value: "GOOD", label: "Good", color: "bg-blue-100 text-blue-700 border-blue-500" },
  { value: "EXCELLENT", label: "Excellent", color: "bg-green-100 text-green-700 border-green-500" },
]

export default function EvaluateStaffModal({
  isOpen,
  onClose,
  staff,
  onSuccess,
}: EvaluateStaffModalProps) {
  const { toast } = useToast()
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null)
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedPerformance) {
      toast({
        title: "Error",
        description: "Please select a performance rating",
        variant: "destructive",
      })
      return
    }

    if (!note.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await evaluateEventStaff(staff.eventId, {
        membershipId: staff.membershipId,
        eventId: staff.eventId,
        performance: selectedPerformance,
        note: note.trim(),
      })
      
      toast({
        title: "Success",
        description: "Staff evaluation saved successfully",
      })
      
      onSuccess()
      onClose()
      
      // Reset form
      setSelectedPerformance(null)
      setNote("")
    } catch (error: any) {
      console.error("Failed to evaluate staff:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save evaluation",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Evaluate Staff Performance
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Staff Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                <span className="text-white font-semibold">
                  {staff.memberName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {staff.memberName}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {staff.duty}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Performance Rating <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {performanceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedPerformance(option.value)}
                  disabled={isSubmitting}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPerformance === option.value
                      ? `${option.color} border-opacity-100 shadow-md`
                      : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold">{option.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Note <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Enter evaluation note..."
              value={note}
              onChange={(e) => {
                if (e.target.value.length <= 150) {
                  setNote(e.target.value)
                }
              }}
              disabled={isSubmitting}
              className="w-full min-h-[100px] resize-none"
              maxLength={150}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {note.length} / 150 characters
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedPerformance || !note.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Save Evaluation
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
