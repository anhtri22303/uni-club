"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { eventCheckin } from '@/service/eventApi'

export default function MemberCheckinByCodePage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const [isCheckinLoading, setIsCheckinLoading] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  // Get token from URL
  const checkInCode = (params as any)?.code || null

  useEffect(() => {
    console.debug('Check-in token from URL:', checkInCode)
  }, [checkInCode])

  const handleCheckin = async () => {
    if (!checkInCode || typeof checkInCode !== 'string') {
      toast({ 
        title: "Invalid Token", 
        description: "Check-in token is missing or invalid",
        variant: "destructive"
      })
      return
    }

    if (isCheckinLoading || isCheckedIn) return

    setIsCheckinLoading(true)
    
    try {
      console.log('Starting event check-in with token:', checkInCode)
      // Call new event check-in API with eventJwtToken and level="NONE"
      const response = await eventCheckin(checkInCode, "NONE")
      
      console.log('Event check-in response:', response)
      
      // Response structure: { success: true, message: "Check-in success for event co club", data: null }
      toast({ 
        title: "Check-in Successful! 🎉", 
        description: response?.message || "You've successfully checked in to the event!",
        duration: 5000
      })
      
      setIsCheckedIn(true)
      
      // Redirect after successful check-in
      setTimeout(() => {
        router.push('/student/events')
      }, 2000)
    } catch (error: any) {
      console.error('Event check-in error:', error)
      
      // Extract error message from response
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred during check-in. Please try again.'
      
      toast({ 
        title: "Check-in Failed", 
        description: String(errorMessage),
        variant: "destructive",
        duration: 4000
      })
    } finally {
      setIsCheckinLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="w-full max-w-md">
            <h1 className="text-4xl font-extrabold text-center mb-4 text-primary">Event Check-in</h1>
            <p className="text-lg text-center text-muted-foreground mb-8">Tap the button below to check in</p>

            <Card className="shadow-lg border-2 border-primary/20">
              <CardContent className="pt-8 pb-8">
                <Button
                  size="lg"
                  className="w-full py-12 text-2xl font-bold flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all transform hover:scale-105 shadow-xl"
                  onClick={handleCheckin}
                  disabled={isCheckinLoading || isCheckedIn}
                >
                  {isCheckinLoading ? (
                    <>
                      <Clock className="h-8 w-8 animate-spin" />
                      Processing...
                    </>
                  ) : isCheckedIn ? (
                    <>
                      <CheckCircle className="h-8 w-8" />
                      Checked In!
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-8 w-8" /> 
                      Check In
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
