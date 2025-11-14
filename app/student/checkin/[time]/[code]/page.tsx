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
import { Badge } from "@/components/ui/badge"

export default function MemberCheckinByTimeAndCodePage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const [isCheckinLoading, setIsCheckinLoading] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  // Get time (phase) and token from URL
  const checkInTime = (params as any)?.time || null
  const checkInCode = (params as any)?.code || null

  useEffect(() => {
    console.debug('Check-in phase from URL:', checkInTime)
    console.debug('Check-in token from URL:', checkInCode)
  }, [checkInTime, checkInCode])

  // Get phase display information
  const getPhaseInfo = (phase: string) => {
    const phaseUpper = phase?.toUpperCase()
    switch (phaseUpper) {
      case 'START':
        return {
          label: 'START',
          description: 'Beginning of event',
          color: 'bg-green-100 text-green-700 border-green-500'
        }
      case 'MID':
        return {
          label: 'MID',
          description: 'Middle of event',
          color: 'bg-blue-100 text-blue-700 border-blue-500'
        }
      case 'END':
        return {
          label: 'END',
          description: 'End of event',
          color: 'bg-purple-100 text-purple-700 border-purple-500'
        }
      default:
        return {
          label: phase || 'UNKNOWN',
          description: 'Event check-in',
          color: 'bg-gray-100 text-gray-700 border-gray-500'
        }
    }
  }

  const phaseInfo = getPhaseInfo(checkInTime)

  const handleCheckin = async () => {
    if (!checkInCode || typeof checkInCode !== 'string') {
      toast({ 
        title: "Invalid Token", 
        description: "Check-in token is missing or invalid",
        variant: "destructive"
      })
      return
    }

    if (!checkInTime || typeof checkInTime !== 'string') {
      toast({ 
        title: "Invalid Phase", 
        description: "Check-in phase is missing or invalid",
        variant: "destructive"
      })
      return
    }

    if (isCheckinLoading || isCheckedIn) return

    setIsCheckinLoading(true)
    
    try {
      console.log('Starting event check-in with token:', checkInCode, 'and phase:', checkInTime)
      // Call event check-in API with eventJwtToken and phase from URL
      const response = await eventCheckin(checkInCode, checkInTime.toUpperCase())
      
      console.log('Event check-in response:', response)
      
      // Response structure: { success: true, message: "Check-in success for event co club", data: null }
      toast({ 
        title: "Check-in Successful! 🎉", 
        description: response?.message || "You've successfully checked in to the event!",
        duration: 3000
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
        duration: 3000
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
              <CardContent className="pt-8 pb-8 space-y-6">
                {/* Phase Display Badge */}
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Check-in Phase</p>
                    <Badge 
                      variant="outline" 
                      className={`text-lg py-2 px-4 font-semibold ${phaseInfo.color}`}
                    >
                      <Clock className="h-5 w-5 mr-2" />
                      <div className="flex flex-col items-start">
                        <span>{phaseInfo.label}</span>
                        <span className="text-xs font-normal">{phaseInfo.description}</span>
                      </div>
                    </Badge>
                  </div>
                </div>

                {/* Check-in Button */}
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

                {/* Info Note */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>This QR code is valid for a limited time</p>
                  <p className="text-xs mt-1">Phase: {phaseInfo.label}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

