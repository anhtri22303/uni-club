"use client"

import { useState, useEffect, useRef } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Share2, Loader2 } from "lucide-react"
import { useProfile } from "@/hooks/use-query-hooks"
import QRCode from 'qrcode'

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
}

// Complete profile data interface to match the API response
interface CompleteProfileData {
  userId: number | string
  email: string
  passwordHash?: string
  fullName: string
  phone: string
  status: string
  avatarUrl: string
  role?: {
    roleId: number
    roleName: string
    description: string
  }
  wallet?: {
    walletId: number
    ownerType: string
    balancePoints: number
    club?: any
  }
  studentCode: string
  majorName: string
  bio: string
  memberships?: Array<{
    membershipId: number
    club: {
      clubId: number
      name: string
      description: string
      leader: string
      majorPolicy?: any
      major?: any
      createdBy: string
      wallet: string
    }
    level: string
    state: string
    staff: boolean
    joinedAt: string
  }>
}

export default function VirtualCardPage() {
  const { auth } = useAuth()
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Use React Query hook
  const { data: profile, isLoading: loading, error: fetchError } = useProfile()
  
  const [profileData, setProfileData] = useState<SafeProfileData | null>(null)
  const [completeProfileData, setCompleteProfileData] = useState<CompleteProfileData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Generate QR code when profile data changes
  useEffect(() => {
    const generateQR = async () => {
      if (!profile) return
      
      try {
        console.log('Starting QR code generation with profile:', profile)
        
        if (!profile) {
          throw new Error('No profile data received')
        }
        
        // Create safe profile object - ensuring all values are clean strings
        const profileAny = profile as any
        
        // Helper function to sanitize strings
        const sanitizeString = (value: any): string => {
          if (!value) return ''
          return String(value)
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .trim()
        }
        
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
          role: sanitizeString(profileAny.role),
        }
        
        // Create complete profile data for QR code (includes all API response data)
        const completeProfile: CompleteProfileData = {
          userId: profileAny.userId || 0,
          email: sanitizeString(profileAny.email),
          fullName: sanitizeString(profileAny.fullName) || 'Unknown User',
          phone: sanitizeString(profileAny.phone),
          status: sanitizeString(profileAny.status) || 'Active',
          avatarUrl: sanitizeString(profileAny.avatarUrl),
          studentCode: sanitizeString(profileAny.studentCode),
          majorName: sanitizeString(profileAny.majorName),
          bio: sanitizeString(profileAny.bio),
          role: profileAny.role ? {
            roleId: profileAny.role.roleId || 0,
            roleName: sanitizeString(profileAny.role.roleName) || "string",
            description: sanitizeString(profileAny.role.description) || "string"
          } : {
            roleId: 0,
            roleName: "string", 
            description: "string"
          },
          wallet: profileAny.wallet ? {
            walletId: profileAny.wallet.walletId || 0,
            ownerType: sanitizeString(profileAny.wallet.ownerType) || 'USER',
            balancePoints: profileAny.wallet.balancePoints || 0,
            club: profileAny.wallet.club ? {
              clubId: profileAny.wallet.club.clubId || 0,
              name: sanitizeString(profileAny.wallet.club.name) || "string",
              description: sanitizeString(profileAny.wallet.club.description) || "string",
              leader: sanitizeString(profileAny.wallet.club.leader) || "string",
              majorPolicy: profileAny.wallet.club.majorPolicy || {
                id: 0,
                policyName: "string",
                description: "string", 
                majorId: 0,
                majorName: "string",
                maxClubJoin: 0,
                rewardMultiplier: 0,
                active: true,
                name: "string"
              },
              major: profileAny.wallet.club.major || {
                id: 0,
                name: "string",
                description: "string",
                active: true
              },
              createdBy: sanitizeString(profileAny.wallet.club.createdBy) || "string",
              wallet: sanitizeString(profileAny.wallet.club.wallet) || "string"
            } : {
              clubId: 0,
              name: "string",
              description: "string",
              leader: "string",
              majorPolicy: {
                id: 0,
                policyName: "string",
                description: "string",
                majorId: 0,
                majorName: "string", 
                maxClubJoin: 0,
                rewardMultiplier: 0,
                active: true,
                name: "string"
              },
              major: {
                id: 0,
                name: "string",
                description: "string",
                active: true
              },
              createdBy: "string",
              wallet: "string"
            }
          } : {
            walletId: 0,
            ownerType: "USER",
            club: {
              clubId: 0,
              name: "string",
              description: "string",
              leader: "string",
              majorPolicy: {
                id: 0,
                policyName: "string",
                description: "string",
                majorId: 0,
                majorName: "string",
                maxClubJoin: 0,
                rewardMultiplier: 0,
                active: true,
                name: "string"
              },
              major: {
                id: 0,
                name: "string",
                description: "string", 
                active: true
              },
              createdBy: "string",
              wallet: "string"
            },
            balancePoints: 0
          },
          memberships: profileAny.memberships ? profileAny.memberships.map((membership: any) => ({
            membershipId: membership.membershipId || 0,
            club: {
              clubId: membership.club?.clubId || 0,
              name: sanitizeString(membership.club?.name) || "string",
              description: sanitizeString(membership.club?.description) || "string",
              leader: sanitizeString(membership.club?.leader) || "string",
              majorPolicy: membership.club?.majorPolicy || {
                id: 0,
                policyName: "string",
                description: "string",
                majorId: 0,
                majorName: "string",
                maxClubJoin: 0,
                rewardMultiplier: 0,
                active: true,
                name: "string"
              },
              major: membership.club?.major || {
                id: 0,
                name: "string", 
                description: "string",
                active: true
              },
              createdBy: sanitizeString(membership.club?.createdBy) || "string",
              wallet: sanitizeString(membership.club?.wallet) || "string"
            },
            level: sanitizeString(membership.level) || "string",
            state: sanitizeString(membership.state) || "string", 
            staff: Boolean(membership.staff),
            joinedAt: sanitizeString(membership.joinedAt) || new Date().toISOString()
          })) : [{
            membershipId: 0,
            club: {
              clubId: 0,
              name: "string",
              description: "string",
              leader: "string",
              majorPolicy: {
                id: 0,
                policyName: "string",
                description: "string",
                majorId: 0,
                majorName: "string",
                maxClubJoin: 0,
                rewardMultiplier: 0,
                active: true,
                name: "string"
              },
              major: {
                id: 0,
                name: "string",
                description: "string", 
                active: true
              },
              createdBy: "string",
              wallet: "string"
            },
            level: "string",
            state: "string",
            staff: true,
            joinedAt: new Date().toISOString()
          }]
        }
        
        console.log('Safe profile created:', safeProfile)
        console.log('Complete profile for QR:', completeProfile)
        setProfileData(safeProfile)
        setCompleteProfileData(completeProfile)
        
        // Generate QR code with simple data - only email and studentCode
        const qrData = JSON.stringify({
          email: safeProfile.email || "",
          studentCode: safeProfile.studentCode || ""
        })
        
        console.log('Generating QR code with data:', qrData)
        
        const qrUrl = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'L' // Giảm error correction để QR đơn giản hơn
        })
        
        console.log('QR code generated successfully')
        setQrCodeUrl(qrUrl)
      } catch (err) {
        console.error("Error generating QR:", err)
        setError(err instanceof Error ? err.message : "Failed to load card data")
      }
    }

    generateQR()
  }, [profile])

  const handleDownloadCard = async () => {
    if (!cardRef.current) return
    
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      })
      
      const link = document.createElement('a')
      link.download = `uniclub-virtualcard-${profileData?.studentCode || profileData?.userId || 'unknown'}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Error downloading card:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share && profileData) {
      try {
        await navigator.share({
          title: 'My Student Card',
          text: `${profileData.fullName} - ${profileData.studentCode}`,
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["member", "student", "club_leader", "uni_staff", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
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
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
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

  return (
    <ProtectedRoute allowedRoles={["member", "student", "club_leader", "uni_staff", "admin", "staff"]}>
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => router.back()} 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Profile</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  onClick={() => {
                    if (completeProfileData) {
                      console.log('Complete Profile Data in QR:', completeProfileData)
                      alert('QR data logged to console. Press F12 to view.')
                    }
                  }} 
                  variant="ghost" 
                  size="sm"
                  className="hidden sm:flex"
                >
                  View QR Data
                </Button>
                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button onClick={handleDownloadCard} size="sm">
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </div>

            {/* Virtual Card - Mobile Responsive */}
            <div className="flex justify-center px-2 sm:px-0">
              <div 
                ref={cardRef}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-2xl text-white relative overflow-hidden"
              >
                {/* Background Pattern - Adjusted for mobile */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-20 sm:w-32 h-20 sm:h-32 bg-white rounded-full -translate-x-10 sm:-translate-x-16 -translate-y-10 sm:-translate-y-16"></div>
                  <div className="absolute bottom-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-white rounded-full translate-x-16 sm:translate-x-24 translate-y-16 sm:translate-y-24"></div>
                  <div className="absolute top-1/2 left-1/3 w-12 sm:w-20 h-12 sm:h-20 bg-white rounded-full"></div>
                </div>

                <div className="relative z-10">
                  {/* Card Header - Mobile Responsive */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
                    <div className="mb-4 sm:mb-0">
                      <h1 className="text-xl sm:text-2xl font-bold mb-1">UniClub Digital ID</h1>
                      <p className="text-white/80 text-xs sm:text-sm">Student Identification Card</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-white/70">Valid Until</div>
                      <div className="text-sm font-semibold">{new Date().getFullYear() + 1}</div>
                    </div>
                  </div>

                  {/* Profile Section - Mobile Responsive */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Avatar */}
                    <div className="flex-shrink-0 self-center sm:self-start">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center overflow-hidden">
                        {profileData.avatarUrl ? (
                          <img 
                            src={profileData.avatarUrl} 
                            alt={profileData.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-lg sm:text-2xl font-bold text-white">
                            {profileData.fullName.split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Profile Info - Mobile Responsive */}
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-lg sm:text-2xl font-bold mb-2">{profileData.fullName}</h2>
                      <div className="space-y-1 text-white/90">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="text-xs bg-white/20 px-2 py-1 rounded text-white/80">ID</span>
                          <span className="font-mono text-sm sm:text-lg font-semibold">{profileData.studentCode}</span>
                        </div>
                        <div className="text-xs sm:text-sm">{profileData.majorName}</div>
                        <div className="text-xs sm:text-sm text-white/80 break-all">{profileData.email}</div>
                        {profileData.phone && (
                          <div className="text-xs sm:text-sm text-white/80">{profileData.phone}</div>
                        )}
                      </div>
                    </div>

                    {/* QR Code - Mobile Responsive */}
                    <div className="flex-shrink-0 self-center sm:self-start">
                      <div className="bg-white p-2 sm:p-3 rounded-xl">
                        {qrCodeUrl && (
                          <img 
                            src={qrCodeUrl} 
                            alt="QR Code with Email and Student Code"
                            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24"
                            title="Scan for email and student code"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info - Mobile Responsive Grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-white/20">
                    <div>
                      <div className="text-xs text-white/70 mb-1">Status</div>
                      <div className="text-xs sm:text-sm font-medium">{profileData.status}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/70 mb-1">Role</div>
                      <div className="text-xs sm:text-sm font-medium capitalize">{profileData.role}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/70 mb-1">Member Since</div>
                      <div className="text-xs sm:text-sm font-medium">{new Date().getFullYear()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/70 mb-1">Card ID</div>
                      <div className="text-xs sm:text-sm font-medium font-mono">#UC{profileData.userId.padStart(6, '0')}</div>
                    </div>
                  </div>

                  {/* Footer - Mobile Responsive */}
                  <div className="mt-4 sm:mt-8 pt-3 sm:pt-4 border-t border-white/20 text-center">
                    <p className="text-xs text-white/70 leading-relaxed">
                      This digital card contains complete profile data and is issued by UniClub System for identification purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}