"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (rating: number, comment: string) => Promise<void>
  eventName: string
  isSubmitting?: boolean
}

export function FeedbackModal({
  open,
  onOpenChange,
  onSubmit,
  eventName,
  isSubmitting = false
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [comment, setComment] = useState<string>("")
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({})

  const handleSubmit = async () => {
    // Validation
    const newErrors: { rating?: string; comment?: string } = {}
    
    if (rating === 0) {
      newErrors.rating = "Please select a rating"
    }
    
    if (!comment.trim()) {
      newErrors.comment = "Please provide a comment"
    } else if (comment.trim().length < 10) {
      newErrors.comment = "Comment must be at least 10 characters"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit(rating, comment)
      // Reset form on success
      setRating(0)
      setComment("")
      setErrors({})
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleCancel = () => {
    setRating(0)
    setComment("")
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Submit Event Feedback</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Share your experience about <span className="font-medium text-foreground">{eventName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Rating <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star)
                    setErrors(prev => ({ ...prev, rating: undefined }))
                  }}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-gray-400"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
            {errors.rating && (
              <p className="text-sm text-red-500">{errors.rating}</p>
            )}
          </div>

          {/* Comment Section */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Comment <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="comment"
              placeholder="Share your thoughts about this event..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                setErrors(prev => ({ ...prev, comment: undefined }))
              }}
              rows={5}
              className="resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters
              </p>
              <p className="text-xs text-muted-foreground">
                {comment.length} characters
              </p>
            </div>
            {errors.comment && (
              <p className="text-sm text-red-500">{errors.comment}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

