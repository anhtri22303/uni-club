"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchMajors, Major } from "@/service/majorApi"
import { editProfile } from "@/service/userApi"
import { useToast } from "@/hooks/use-toast"

interface CompleteProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileData: {
    fullName?: string
    phone?: string
    bio?: string
    avatarUrl?: string
    backgroundUrl?: string
  }
  onComplete: () => void
}

export function CompleteProfileModal({
  open,
  onOpenChange,
  profileData,
  onComplete
}: CompleteProfileModalProps) {
  const { toast } = useToast()
  const [studentCode, setStudentCode] = useState("")
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null)
  const [majors, setMajors] = useState<Major[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMajors, setLoadingMajors] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentCodeError, setStudentCodeError] = useState<string | null>(null)

  // Load majors when modal opens
  useEffect(() => {
    if (open) {
      loadMajors()
    }
  }, [open])

  const loadMajors = async () => {
    try {
      setLoadingMajors(true)
      const majorsList = await fetchMajors()
      // Filter only active majors
      const activeMajors = majorsList.filter(m => m.active)
      setMajors(activeMajors)
    } catch (err) {
      console.error("Failed to load majors:", err)
      setError("Failed to load majors. Please try again.")
    } finally {
      setLoadingMajors(false)
    }
  }

  // Validation function for studentCode
  const validateStudentCode = (code: string): string | null => {
    if (!code || code.trim() === "") {
      return "Student code is required"
    }
    
    // Format: 2 letters followed by 6 numbers (e.g., SE000001)
    const pattern = /^[A-Za-z]{2}\d{6}$/
    
    if (code.length !== 8) {
      return "Student code must be exactly 8 characters (2 letters + 6 numbers)"
    }
    
    if (!pattern.test(code)) {
      return "Student code must start with 2 letters followed by 6 numbers (e.g., SE000001)"
    }
    
    return null // Valid
  }

  const handleStudentCodeChange = (value: string) => {
    setStudentCode(value)
    // Validate on change
    const error = validateStudentCode(value)
    setStudentCodeError(error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate before submit
    const codeError = validateStudentCode(studentCode)
    if (codeError) {
      setStudentCodeError(codeError)
      toast({
        title: "Validation Error",
        description: codeError,
        variant: "destructive"
      })
      return
    }

    if (!selectedMajorId) {
      setError("Please select a major")
      toast({
        title: "Validation Error",
        description: "Please select a major",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Build the request payload
      const payload: any = {
        studentCode: studentCode.trim(),
        majorId: selectedMajorId
      }

      // Add other existing data from profile if available
      if (profileData.fullName) {
        payload.fullName = profileData.fullName
      }
      if (profileData.phone) {
        payload.phone = profileData.phone
      }
      if (profileData.bio) {
        payload.bio = profileData.bio
      }
      // Note: avatarUrl and backgroundUrl are handled by separate upload endpoints
      // so we don't include them in the editProfile payload

      console.log("Submitting complete profile payload:", payload)

      const response = await editProfile(payload)

      if (response && response.success) {
        toast({
          title: "Profile Completed",
          description: "Your profile has been successfully completed.",
        })
        
        // Reset form
        setStudentCode("")
        setSelectedMajorId(null)
        setStudentCodeError(null)
        
        // Close modal and trigger callback
        onOpenChange(false)
        onComplete()
      } else {
        throw new Error(response?.message || "Failed to complete profile")
      }
    } catch (err: any) {
      console.error("Complete profile failed:", err)
      
      let errorMessage = "Failed to complete profile. Please try again."
      
      // Extract error message from API response
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data) {
        try {
          const errorData = err.response.data
          const firstErrorKey = Object.keys(errorData)[0]
          const firstError = errorData[firstErrorKey]
          
          if (typeof firstError === 'string') {
            errorMessage = firstError
          } else if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0]
          }
        } catch (e) {
          // Use default message
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing the modal by clicking outside or pressing escape
      // since profile completion is mandatory
      if (!newOpen && !loading) {
        // Only allow closing after successful completion or if not loading
        return
      }
    }}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please complete your profile information to continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Student Code Input */}
          <div className="space-y-2">
            <Label htmlFor="studentCode">
              Student Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="studentCode"
              type="text"
              placeholder="e.g., SE000001"
              value={studentCode}
              onChange={(e) => handleStudentCodeChange(e.target.value.toUpperCase())}
              disabled={loading}
              maxLength={8}
              className={studentCodeError ? "border-red-500" : ""}
              required
            />
            {studentCodeError && (
              <p className="text-sm text-red-500">{studentCodeError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Format: 2 letters + 6 numbers (e.g., SE000001)
            </p>
          </div>

          {/* Major Selection */}
          <div className="space-y-2">
            <Label htmlFor="major">
              Major <span className="text-red-500">*</span>
            </Label>
            {loadingMajors ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Select
                value={selectedMajorId?.toString()}
                onValueChange={(value) => setSelectedMajorId(parseInt(value))}
                disabled={loading}
                required
              >
                <SelectTrigger id="major">
                  <SelectValue placeholder="Select your major" />
                </SelectTrigger>
                <SelectContent>
                  {majors.map((major) => (
                    <SelectItem key={major.id} value={major.id.toString()}>
                      {major.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || loadingMajors || !!studentCodeError}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
