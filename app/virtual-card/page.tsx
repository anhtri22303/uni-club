"use client"

import { useState, useEffect, useRef } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Share2, Loader2 } from "lucide-react"
import { fetchProfile } from "@/service/userApi"
import { getCardByClubId, type CardDesign } from "@/service/cardApi"
import QRCode from 'qrcode'
import { CardPreview, type CardData, downloadCardAsImage, shareCardAsImage } from "@/app/club-leader/card/cardComponents"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SafeProfileData {
  userId: string
  email: string
  fullName: string
  phone: string
  status: string
  avatarUrl: string
  studentCode: string
  majorName: string
  bio: string
  role: string
  memberships?: Array<{
    membershipId: number
    clubId: number
    clubName: string
    level: string
    state: string
  }>
}

export default function VirtualCardPage() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  
  const [profileData, setProfileData] = useState<SafeProfileData | null>(null)
  const [cardDesign, setCardDesign] = useState<CardDesign | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Club selection state
  const [availableClubIds, setAvailableClubIds] = useState<number[]>([])
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)
  const [loadingCard, setLoadingCard] = useState(false)

  // Load profile data and initialize clubIds
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        console.log('Starting profile load...')
        
        // Fetch profile data
        const profile = await fetchProfile()
        console.log('Raw profile data:', profile)
        
        if (!profile) {
          throw new Error('No profile data received')
        }
        
        // Helper function to sanitize strings
        const sanitizeString = (value: any): string => {
          if (!value) return ''
          return String(value)
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .trim()
        }
        
        const profileAny = profile as any
        
        // Extract memberships and clubIds
        const memberships: Array<{
          membershipId: number
          clubId: number
          clubName: string
          level: string
          state: string
        }> = []
        
        const clubIdsFromProfile: number[] = []
        
        if (profileAny.memberships && profileAny.memberships.length > 0) {
          profileAny.memberships.forEach((membership: any) => {
            if (membership.club?.clubId) {
              memberships.push({
                membershipId: membership.membershipId || 0,
                clubId: membership.club.clubId,
                clubName: sanitizeString(membership.club.name) || 'Unknown Club',
                level: sanitizeString(membership.level) || 'Member',
                state: sanitizeString(membership.state) || 'Active',
              })
              clubIdsFromProfile.push(membership.club.clubId)
            }
          })
        }
        
        // Create safe profile object
        const safeProfile: SafeProfileData = {
          userId: sanitizeString(profileAny.userId),
          email: sanitizeString(profileAny.email),
          fullName: sanitizeString(profileAny.fullName) || 'Unknown User',
          phone: sanitizeString(profileAny.phone),
          status: sanitizeString(profileAny.status) || 'Active',
          avatarUrl: sanitizeString(profileAny.avatarUrl),
          studentCode: sanitizeString(profileAny.studentCode),
          majorName: sanitizeString(profileAny.majorName),
          bio: sanitizeString(profileAny.bio),
          role: sanitizeString(profileAny.role?.roleName || profileAny.role) || 'Member',
          memberships,
        }
        
        console.log('Safe profile created:', safeProfile)
        console.log('Memberships:', memberships)
        setProfileData(safeProfile)
        
        // Load clubIds from sessionStorage (priority) or use profile memberships
        let clubIds: number[] = []
        try {
          const authDataString = sessionStorage.getItem("uniclub-auth")
          if (authDataString) {
            const authData = JSON.parse(authDataString)
            if (authData.clubIds && Array.isArray(authData.clubIds) && authData.clubIds.length > 0) {
              clubIds = authData.clubIds
              console.log('Loaded clubIds from sessionStorage:', clubIds)
            } else if (authData.clubId) {
              // Single clubId in sessionStorage
              clubIds = [authData.clubId]
              console.log('Loaded single clubId from sessionStorage:', clubIds)
            }
          }
        } catch (error) {
          console.error("Error loading clubIds from sessionStorage:", error)
        }
        
        // Fallback to profile memberships if no clubIds in sessionStorage
        if (clubIds.length === 0) {
          clubIds = clubIdsFromProfile
          console.log('Using clubIds from profile memberships:', clubIds)
        }
        
        setAvailableClubIds(clubIds)
        
        // Auto-select first club if available
        if (clubIds.length > 0) {
          setSelectedClubId(clubIds[0])
        }
        
        // Generate QR code with profile data
        const qrData = JSON.stringify({
          studentCode: safeProfile.studentCode,
          email: safeProfile.email,
          memberId: safeProfile.userId,
        })
        
        console.log('Generating QR code with data:', qrData)
        
        const qrUrl = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
        })
        
        console.log('QR code generated successfully')
        setQrCodeUrl(qrUrl)
      } catch (err) {
        console.error("Error loading data:", err)
        setError(err instanceof Error ? err.message : "Failed to load card data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Fetch card design when selectedClubId changes
  useEffect(() => {
    const fetchCardDesign = async () => {
      if (!selectedClubId) {
        setCardDesign(null)
        return
      }

      try {
        setLoadingCard(true)
        console.log('Fetching card design for clubId:', selectedClubId)
        const design = await getCardByClubId(selectedClubId)
        console.log('Card design fetched:', design)
        setCardDesign(design)
        
        toast({
          title: "✅ Card Loaded",
          description: `Card design for ${design.clubName} loaded successfully!`,
        })
      } catch (cardError) {
        console.error('Failed to fetch card design:', cardError)
        setCardDesign(null)
        toast({
          title: "⚠ Using Default Design",
          description: "Unable to load club's card design. Using default template.",
          variant: "default",
        })
      } finally {
        setLoadingCard(false)
      }
    }

    fetchCardDesign()
  }, [selectedClubId, toast])

  const handleDownloadCard = () => {
    if (!profileData) return
    
    downloadCardAsImage(
      cardRef,
      cardDesign?.clubName || "UniClub",
      profileData.studentCode,
      () => {
        toast({
          title: "✅ Downloaded!",
          description: "Your card has been downloaded successfully!",
        })
      },
      (error) => {
        console.error('Error downloading card:', error)
        toast({
          title: "Error",
          description: "Failed to download card. Please try again.",
          variant: "destructive"
        })
      }
    )
  }

  const handleShareCard = () => {
    if (!profileData) return
    
    shareCardAsImage(
      cardRef,
      cardDesign?.clubName || "UniClub",
      profileData.studentCode,
      () => {
        toast({
          title: "✅ Shared!",
          description: "Card shared successfully!",
        })
      },
      (blob) => {
        // Fallback: Try to copy to clipboard or download
        if (navigator.clipboard && ClipboardItem) {
          try {
            const item = new ClipboardItem({ 'image/png': blob })
            navigator.clipboard.write([item]).then(() => {
              toast({
                title: "📋 Copied to Clipboard!",
                description: "Card image copied. You can paste it anywhere!",
              })
            }).catch(() => {
              downloadBlob(blob)
            })
          } catch {
            downloadBlob(blob)
          }
        } else {
          downloadBlob(blob)
        }
      },
      (error) => {
        console.error('Error sharing card:', error)
        toast({
          title: "Error",
          description: "Failed to share card. Please try downloading instead.",
          variant: "destructive"
        })
      }
    )
  }

  const downloadBlob = (blob: Blob) => {
    if (!profileData) return
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${(cardDesign?.clubName || 'UniClub').replace(/\s+/g, '-')}-${profileData.studentCode}-card.png`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "📥 Downloaded!",
      description: "Sharing not supported. Card downloaded instead!",
    })
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["member", "student", "club_leader", "uni_staff", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center">
            <Card className="p-8">
              <CardContent className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-lg font-medium">Generating Virtual Card...</p>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (error || !profileData) {
    return (
      <ProtectedRoute allowedRoles={["member", "student", "club_leader", "uni_staff", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center">
            <Card className="p-8 max-w-md">
              <CardContent className="text-center space-y-4">
                <div className="text-red-500 text-6xl">⚠</div>
                <h2 className="text-xl font-semibold text-gray-800">Unable to Load Card</h2>
                <p className="text-gray-600">{error || "Card data not available"}</p>
                <Button onClick={() => router.back()} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // Find current club membership info
  const currentMembership = profileData.memberships?.find(m => m.clubId === selectedClubId)
  
  // Debug: Log membership and role info
  console.log('Current membership:', currentMembership)
  console.log('Role being used:', currentMembership?.level || profileData.role || "Member")
  
  // Map profile data to CardData format
  const cardData: CardData = {
    clubName: cardDesign?.clubName || currentMembership?.clubName || "UniClub System",
    studentName: profileData.fullName,
    studentCode: profileData.studentCode,
    email: profileData.email,
    major: profileData.majorName,
    role: currentMembership?.level || profileData.role || "Member",
    memberId: profileData.userId,
  }

  // Use card design from API or fallback to defaults
  const colorType = cardDesign?.colorType || "gradient"
  const gradient = cardDesign?.gradient || "from-blue-600 via-purple-600 to-indigo-700"
  const cardColorClass = cardDesign?.cardColorClass || "bg-gradient-to-r"
  const pattern = cardDesign?.pattern || "circles"
  const borderRadius = cardDesign?.borderRadius || "rounded-2xl"
  const logoUrl = cardDesign?.logoUrl || "/images/Logo.png"
  const qrSize = cardDesign?.qrSize || 100
  const qrStyle = cardDesign?.qrStyle || "default"
  const showLogo = cardDesign?.showLogo ?? true
  const patternOpacity = cardDesign?.patternOpacity || 10
  const cardOpacity = cardDesign?.cardOpacity || 100

  return (
    <ProtectedRoute allowedRoles={["member", "student", "club_leader", "uni_staff", "admin", "staff"]}>
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-2 sm:p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header - Mobile Responsive */}
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={() => router.back()} 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-600 hover:text-gray-800 dark:text-slate-300 dark:hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Back to Profile</span>
                    <span className="sm:hidden">Back</span>
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={handleShareCard} variant="outline" size="sm" disabled={loadingCard}>
                    <Share2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                  <Button onClick={handleDownloadCard} size="sm" disabled={loadingCard}>
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </div>
              </div>

              {/* Club Selection - Only show if multiple clubs */}
              {availableClubIds.length > 1 && (
                <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-blue-200 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label htmlFor="club-select" className="text-sm font-medium text-gray-700 dark:text-slate-200 whitespace-nowrap">
                      🏛️ Select Club:
                    </label>
                    <Select
                      value={selectedClubId?.toString()}
                      onValueChange={(value) => setSelectedClubId(Number(value))}
                      disabled={loadingCard}
                    >
                      <SelectTrigger id="club-select" className="w-full sm:max-w-md">
                        <SelectValue placeholder="Choose a club to display card" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClubIds.map((clubId) => {
                          const membership = profileData?.memberships?.find(m => m.clubId === clubId)
                          return (
                            <SelectItem key={clubId} value={clubId.toString()}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{membership?.clubName || `Club ${clubId}`}</span>
                                {membership?.level && (
                                  <span className="text-xs text-gray-500">({membership.level})</span>
                                )}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {loadingCard && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Card Display */}
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex items-center justify-center">
                <CardPreview
                  ref={cardRef}
                  cardData={cardData}
                  colorType={colorType}
                  gradient={gradient}
                  cardColorClass={cardColorClass}
                  pattern={pattern}
                  borderRadius={borderRadius}
                  logoUrl={logoUrl}
                  qrCodeUrl={qrCodeUrl}
                  qrSize={qrSize}
                  qrStyle={qrStyle}
                  showLogo={showLogo}
                  patternOpacity={patternOpacity}
                  cardOpacity={cardOpacity}
                  showFrame={false}
                />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
