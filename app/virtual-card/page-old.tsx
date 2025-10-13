"use client"

import { useState, useEffect, useRef } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Share2, Loader2 } from "lucide-react"
import { fetchProfile } from "@/service/userApi"
import QRCode from 'qrcode'

interface ProfileData {
  userId: string | number
  email: string
  fullName: string
  phone: string
  status: string
  avatarUrl: string
  studentCode: string
  majorName: string
  bio: string
  role: string
  wallet?: any
  memberships?: any[]
}

export default function VirtualCardPage() {
  const { auth } = useAuth()
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load profile data and generate QR code
  useEffect(() => {
    const loadProfileAndGenerateQR = async () => {
      try {
        setLoading(true)
        
        // Fetch profile data
        const profile = await fetchProfile()
        console.log('Virtual card profile data:', profile)
        console.log('Profile type:', typeof profile)
        console.log('Profile keys:', profile ? Object.keys(profile) : 'null')
        
        if (profile && typeof profile === 'object') {
          // Ensure all required fields exist and are strings
          const profileAny = profile as any
          const safeProfile: ProfileData = {
            userId: profileAny.userId || '',
            email: profileAny.email || '',
            fullName: profileAny.fullName || 'Unknown',
            phone: profileAny.phone || '',
            status: profileAny.status || 'Active',
            avatarUrl: profileAny.avatarUrl || '',
            studentCode: profileAny.studentCode || '',
            majorName: profileAny.majorName || '',
            bio: profileAny.bio || '',
            role: profileAny.role || '',
            wallet: profileAny.wallet || null,
            memberships: profileAny.memberships || []
          }
          console.log('Safe profile:', safeProfile)
          setProfileData(safeProfile)
        } else {
          throw new Error('Invalid profile data received')
        }
        
        // Generate QR code with profile data
        if (profile) {
          const profileTyped = profile as ProfileData
          const qrData = JSON.stringify({
            userId: profileTyped.userId,
            fullName: profileTyped.fullName,
            email: profileTyped.email,
            studentCode: profileTyped.studentCode,
            majorName: profileTyped.majorName,
            role: profileTyped.role,
            phone: profileTyped.phone,
            avatarUrl: profileTyped.avatarUrl,
            timestamp: new Date().toISOString()
          })
          
          const qrUrl = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
          
          setQrCodeUrl(qrUrl)
        }
      } catch (err) {
        console.error("Error loading profile or generating QR:", err)
        setError("Failed to load card data")
      } finally {
        setLoading(false)
      }
    }

    loadProfileAndGenerateQR()
  }, [])

  const handleDownloadCard = async () => {
    if (!cardRef.current) return
    
    try {
      // Use html2canvas to capture the card
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      })
      
      // Create download link
      const link = document.createElement('a')
      link.download = `student-card-${profileData?.studentCode || 'unknown'}.png`
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
          text: `${profileData.fullName || 'Student'} - ${profileData.studentCode || 'N/A'}`,
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
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => router.back()} 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Profile
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button onClick={handleDownloadCard} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Virtual Card */}
            <div className="flex justify-center">
              {profileData ? (
              <div 
                ref={cardRef}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-8 w-full max-w-2xl text-white relative overflow-hidden"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-24 translate-y-24"></div>
                  <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white rounded-full"></div>
                </div>

                <div className="relative z-10">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h1 className="text-2xl font-bold mb-1">UniClub Digital ID</h1>
                      <p className="text-white/80 text-sm">Student Identification Card</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/70">Valid Until</div>
                      <div className="text-sm font-semibold">{new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).getFullYear()}</div>
                    </div>
                  </div>

                  {/* Profile Section */}
                  <div className="flex items-start gap-6 mb-8">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center overflow-hidden">
                        {profileData.avatarUrl ? (
                          <img 
                            src={profileData.avatarUrl} 
                            alt={profileData.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-2xl font-bold text-white">
                            {(profileData.fullName || 'User').split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">{profileData.fullName || 'N/A'}</h2>
                      <div className="space-y-1 text-white/90">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-white/20 px-2 py-1 rounded text-white/80">ID</span>
                          <span className="font-mono text-lg font-semibold">{profileData.studentCode || 'N/A'}</span>
                        </div>
                        <div className="text-sm">{profileData.majorName || 'N/A'}</div>
                        <div className="text-sm text-white/80">{profileData.email || 'N/A'}</div>
                        {profileData.phone && (
                          <div className="text-sm text-white/80">{profileData.phone}</div>
                        )}
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex-shrink-0">
                      <div className="bg-white p-3 rounded-xl">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code"
                          className="w-24 h-24"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                    <div>
                      <div className="text-xs text-white/70 mb-1">Status</div>
                      <div className="text-sm font-medium">{profileData.status || 'Active'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/70 mb-1">Role</div>
                      <div className="text-sm font-medium capitalize">{profileData.role || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/70 mb-1">Member Since</div>
                      <div className="text-sm font-medium">{new Date().getFullYear()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/70 mb-1">Card ID</div>
                      <div className="text-sm font-medium font-mono">#UC{String(profileData.userId || '0').padStart(6, '0')}</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-4 border-t border-white/20 text-center">
                    <p className="text-xs text-white/70">
                      This digital card is issued by UniClub System and is valid for identification purposes.
                    </p>
                  </div>
                </div>
              </div>
              ) : (
                <div className="text-center text-gray-500 p-8">
                  <p>No profile data available</p>
                </div>
              )}
            </div>

            {/* Card Info */}
            <div className="mt-8 text-center">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Digital Student Card</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This virtual card contains all your profile information encoded in the QR code. 
                    You can download or share this card for identification purposes.
                  </p>
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date().toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}