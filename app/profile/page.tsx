"use client"

import { useState, useEffect, useRef } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  User, Mail, Phone, Save, Calendar, MapPin, Edit3, Clock, Users, Settings, UserCheck, FileText, BarChart3, Globe, Flame,
  Zap, Building2, Trophy, Loader2, AlertCircle, Camera, Lock,
} from "lucide-react"
import { editProfile, fetchProfile, uploadAvatar, uploadBackground, getProfileStats, ProfileStats } from "@/service/userApi"
import { AvatarCropModal } from "@/components/avatar-crop-modal"
import { ChangePasswordModal } from "@/components/change-password"
import { ApiMembershipWallet } from "@/service/walletApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Major, fetchMajors } from "@/service/majorApi" // Import từ majorApi

// Types for profile data
interface ProfileData {
  fullName: string
  email: string
  phone: string
  majorName: string
  studentCode: string
  bio: string
  avatarUrl: string
  backgroundUrl: string
  userPoints: number
}

interface ProfileState {
  data: ProfileData | null
  loading: boolean
  error: string | null
  saving: boolean
}

export default function ProfilePage() {
  const { auth } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backgroundFileInputRef = useRef<HTMLInputElement>(null)

  // State management for profile data
  const [profileState, setProfileState] = useState<ProfileState>({
    data: null,
    loading: true,
    error: null,
    saving: false,
  })

  // State for temporary avatar preview (before saving)
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // States for crop modal
  const [showCropModal, setShowCropModal] = useState<boolean>(false)
  const [imageToCrop, setImageToCrop] = useState<string>("")
  const [croppedFile, setCroppedFile] = useState<File | null>(null)

  // States for background image
  const [previewBackgroundUrl, setPreviewBackgroundUrl] = useState<string>("")
  const [selectedBackgroundFile, setSelectedBackgroundFile] = useState<File | null>(null)
  const [showBackgroundCropModal, setShowBackgroundCropModal] = useState<boolean>(false)
  const [backgroundImageToCrop, setBackgroundImageToCrop] = useState<string>("")
  const [croppedBackgroundFile, setCroppedBackgroundFile] = useState<File | null>(null)

  // States for wallet memberships
  const [memberships, setMemberships] = useState<ApiMembershipWallet[]>([])

  //--- THÊM STATE CHO MAJORS ---
  const [allMajors, setAllMajors] = useState<Major[]>([])

  // State for change password modal
  const [showChangePassword, setShowChangePassword] = useState(false)

  // State for user profile statistics (real data from API)
  const [userStats, setUserStats] = useState<ProfileStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Static data for administrators
  const adminStats = {
    totalUsers: "1,247",
    activeEvents: "89",
    reportsGenerated: "156",
  }

  const formatRoleName = (roleId?: string | null) => {
    if (!roleId) return ""
    const map: Record<string, string> = {
      student: "STUDENT",
      club_leader: "CLUB LEADER",
      uni_admin: "UNIVERSITY ADMIN",
      uni_staff: "UNIVERSITY STAFF",
      admin: "ADMIN",
      staff: "STAFF",
    }
    return map[String(roleId).toLowerCase()] || String(roleId).replace(/_/g, " ").toUpperCase()
  }

  // Load profile data from API
  const loadProfile = async () => {
    if (!auth.userId) {
      setProfileState(prev => ({
        ...prev,
        loading: false,
        error: "User not authenticated"
      }))
      return
    }

    try {
      setProfileState(prev => ({ ...prev, loading: true, error: null }))

      // Chạy song song fetchProfile và fetchMajors
      const [profile, majorsList] = await Promise.all([
        fetchProfile() as any,
        fetchMajors() // <-- THAY ĐỔI 3: GỌI fetchMajors
      ])

      if (!profile) {
        throw new Error("Profile not found")
      }

      const profileData: ProfileData = {
        fullName: profile?.fullName || profile?.full_name || profile?.name || auth.user?.fullName || "",
        email: profile?.email || auth.user?.email || "",
        phone: profile?.phone || profile?.mobile || "",
        majorName: profile?.majorName ?? profile?.major_name ?? "",
        studentCode: profile?.studentCode ?? profile?.student_code ?? "",
        bio: profile?.bio ?? "",
        avatarUrl: profile?.avatarUrl ?? "",
        backgroundUrl: profile?.backgroundUrl ?? "",
        userPoints: Number(profile?.wallet?.balancePoints ?? 0),
      }

      // Xử lý danh sách majors
      const currentMajorName = profileData.majorName
      const activeMajors = majorsList.filter(m => m.active)

      // Kiểm tra xem major hiện tại của user có active không
      const isCurrentMajorActive = activeMajors.some(m => m.name === currentMajorName)

      if (!isCurrentMajorActive && currentMajorName) {
        // Nếu major hiện tại không active, tìm nó trong list gốc và thêm vào
        const currentInactiveMajor = majorsList.find(m => m.name === currentMajorName)
        if (currentInactiveMajor) {
          // Hiển thị major (inactive) của user lên đầu danh sách
          setAllMajors([currentInactiveMajor, ...activeMajors])
        } else {
          setAllMajors(activeMajors)
        }
      } else {
        // Nếu major hiện tại active, hoặc user chưa có major
        setAllMajors(activeMajors)
      }

      setProfileState({
        data: profileData,
        loading: false,
        error: null,
        saving: false,
      })

      // Load wallet memberships for students and club leaders from profile response
      if (auth.role === "student" || auth.role === "club_leader") {
        // Handle both singular wallet and plural wallets formats
        let walletsList = profile?.wallets || []

        // If API returns singular wallet, convert to array
        if (!walletsList || walletsList.length === 0) {
          if (profile?.wallet) {
            // For singular wallet, create entry with club name from clubs array
            const clubName = profile?.clubs?.[0]?.clubName || "My Wallet"
            const clubId = profile?.clubs?.[0]?.clubId || null

            walletsList = [{
              walletId: profile.wallet.walletId,
              balancePoints: profile.wallet.balancePoints,
              ownerType: profile.wallet.ownerType,
              clubId: clubId,
              clubName: clubName,
              userId: profile.wallet.userId,
              userFullName: profile.wallet.userFullName
            }]
          }
        }

        console.log("Wallets from profile:", walletsList)
        setMemberships(walletsList)
      }

      // Clear file selection when profile loads
      setSelectedFile(null)
      setPreviewAvatarUrl("")

      // Load profile statistics for students and club leaders
      if (auth.role === "student" || auth.role === "club_leader") {
        try {
          setStatsLoading(true)
          const stats = await getProfileStats()
          if (stats) {
            setUserStats(stats)
          }
        } catch (statsErr) {
          console.error("Failed to load profile stats:", statsErr)
          // Don't show error toast for stats - just keep loading state or show 0s
        } finally {
          setStatsLoading(false)
        }
      } else {
        // For non-student/club_leader roles, set loading to false
        setStatsLoading(false)
      }

      // } catch (err) {
      //   console.error("Failed to load profile:", err)
      //   setProfileState(prev => ({
      //     ...prev,
      //     loading: false,
      //     error: err instanceof Error ? err.message : "Failed to load profile"
      //   }))
    } catch (err) {
      console.error("Failed to load profile or majors:", err)
      setProfileState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load data"
      }))
      if (err instanceof Error && !(err.message.includes("Profile"))) {
        toast({
          title: "Warning",
          description: "Could not load list of majors.",
          variant: "destructive"
        })
      }
    }
  }

  // Load profile when component mounts or auth.userId changes
  useEffect(() => {
    loadProfile()
  }, [auth.userId])

  // Handle profile update (không bao gồm avatar)
  // const handleSave = async () => {
  //   if (!profileState.data) return

  //   try {
  //     setProfileState(prev => ({ ...prev, saving: true }))

  //     // Chỉ cập nhật thông tin profile (không bao gồm avatar)
  //     const { fullName, email, phone, majorName, bio } = profileState.data
  //     const payload: Record<string, any> = {
  //       email,
  //       fullName,
  //       phone,
  //       majorName,
  //       bio
  //     }

  //     const res = (await editProfile(payload)) as any

  //     if (res && res.success) {
  //       toast({
  //         title: "Update Successful",
  //         description: "Your profile information has been saved.",
  //       })
  //       // Reload profile data after successful update
  //       await loadProfile()
  //     } else {
  //       throw new Error(res?.message || "Unable to update profile")
  //     }
  //   } catch (err) {
  //     console.error("Edit profile failed:", err)
  //     toast({
  //       title: "Error",
  //       description: err instanceof Error ? err.message : "An error occurred while updating profile"
  //     })
  //   } finally {
  //     setProfileState(prev => ({ ...prev, saving: false }))
  //   }
  // }
  // Handle profile update (không bao gồm avatar)
  const handleSave = async () => {
    if (!profileState.data) return

    try {
      setProfileState(prev => ({ ...prev, saving: true }))

      // Lấy thông tin cần thiết từ state
      const { fullName, phone, majorName, bio } = profileState.data

      // --- BƯỚC QUAN TRỌNG: Chuyển đổi majorName thành majorId ---
      // Tìm majorId từ danh sách allMajors (đã được fetch trong loadProfile)
      const selectedMajor = allMajors.find(m => m.name === majorName)

      // Lấy ID của major, nếu không tìm thấy thì gửi undefined
      const majorId = selectedMajor ? selectedMajor.id : undefined

      if (majorName && !selectedMajor) {
        console.warn(`Không thể tìm thấy majorId cho majorName: ${majorName}`)
      }

      // --- XÂY DỰNG PAYLOAD CHÍNH XÁC ---
      // Dựa trên Swagger (image_30c2e3.png) VÀ các trường có thể sửa đổi trong UI
      const payload = {
        fullName: fullName,
        phone: phone,
        bio: bio,
        majorId: majorId, // Gửi majorId (số) thay vì majorName (chuỗi)

        // KHÔNG GỬI: email, studentCode (vì chúng bị 'disabled' và không nên cập nhật)
        // KHÔNG GỬI: avatarUrl, backgroundUrl (chúng được xử lý bằng endpoint upload file riêng)
      }

      console.log("Đang gửi payload để cập nhật profile:", payload)

      const res = (await editProfile(payload)) as any

      if (res && res.success) {
        toast({
          title: "Update Successful",
          description: "Your profile information has been saved.",
        })
        // Tải lại profile để hiển thị thông tin mới nhất từ server
        await loadProfile()
      } else {
        // Xử lý trường hợp res.success = false
        throw new Error(res?.message || "Unable to update profile")
      }
    } catch (err: any) { // Thêm kiểu 'any' để truy cập 'err.response'
      console.error("Edit profile failed:", err)

      // --- Xử lý lỗi từ API (VD: 400 Bad Request) ---
      let errorMessage = "An error occurred while updating profile"

      // Thử lấy thông báo lỗi cụ thể từ response của API
      if (err.response && err.response.data && err.response.data.message) {
        // Nếu API trả về { success: false, message: "..." }
        errorMessage = err.response.data.message
      } else if (err.response && err.response.data) {
        // Nếu API trả về lỗi validation (thường là một object)
        // Ví dụ: { "phone": "Invalid phone number" }
        try {
          // Lấy thông báo lỗi đầu tiên từ object
          const errorData = err.response.data
          const firstErrorKey = Object.keys(errorData)[0]
          const firstError = errorData[firstErrorKey]

          if (typeof firstError === 'string') {
            errorMessage = firstError
          } else if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0] // Lấy lỗi đầu tiên trong mảng
          }
        } catch (e) {
          // Bỏ qua, dùng message mặc định
        }
      } else if (err.message) {
        // Lỗi mạng hoặc lỗi JavaScript
        errorMessage = err.message
      }

      toast({
        title: "Error",
        description: errorMessage, // Hiển thị lỗi cụ thể cho user
        variant: "destructive"
      })
    } finally {
      setProfileState(prev => ({ ...prev, saving: false }))
    }
  }

  
  // Update profile data handlers
  const updateProfileData = (field: keyof ProfileData, value: string | number) => {
    if (!profileState.data) return

    setProfileState(prev => ({
      ...prev,
      data: prev.data ? { ...prev.data, [field]: value } : null
    }))
  }

  // Handle avatar click to open file picker
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  // Handle file selection and preview
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file (jpg, png, gif, etc.)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    // Create preview URL và mở modal crop
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImageToCrop(result)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  // Reset preview when component mounts or profile loads
  useEffect(() => {
    if (profileState.data?.avatarUrl && !previewAvatarUrl) {
      setPreviewAvatarUrl(profileState.data.avatarUrl)
    }
  }, [profileState.data?.avatarUrl, previewAvatarUrl])

  // Handle crop complete - convert blob to file and upload immediately
  const handleCropComplete = async (croppedBlob: Blob) => {
    // Convert blob to file
    const croppedFile = new File([croppedBlob], 'cropped-avatar.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    })

    // Upload avatar immediately
    try {
      toast({
        title: "Uploading...",
        description: "Uploading image, please wait...",
      })

      // Call API to upload avatar directly with cropped file
      const avatarRes = await uploadAvatar(croppedFile)
      if (avatarRes && avatarRes.success) {
        // Clear all avatar upload states
        setSelectedFile(null)
        setCroppedFile(null)
        setPreviewAvatarUrl("")
        setImageToCrop("")

        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        toast({
          title: "Avatar Updated Successfully",
          description: "Your profile picture has been changed.",
        })

        // Reload profile data to get updated avatar
        await loadProfile()
      } else {
        throw new Error(avatarRes?.message || "Unable to update avatar")
      }
    } catch (err) {
      console.error("Upload avatar failed:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred while updating profile picture",
        variant: "destructive"
      })
      throw err // Re-throw to let modal know upload failed
    }
  }

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropModal(false)
    setImageToCrop("")
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle background image click to open file picker
  const handleBackgroundClick = () => {
    backgroundFileInputRef.current?.click()
  }

  // Handle background file selection and preview
  const handleBackgroundFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file (jpg, png, gif, etc.)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    // Create preview URL and open crop modal
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setBackgroundImageToCrop(result)
      setShowBackgroundCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  // Handle background crop complete - convert blob to file and upload immediately
  const handleBackgroundCropComplete = async (croppedBlob: Blob) => {
    // Convert blob to file
    const croppedFile = new File([croppedBlob], 'cropped-background.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    })

    // Upload background immediately
    try {
      toast({
        title: "Uploading...",
        description: "Uploading background image, please wait...",
      })

      // Call API to upload background directly with cropped file
      const backgroundRes = await uploadBackground(croppedFile)
      if (backgroundRes && backgroundRes.success) {
        // Clear all background upload states
        setSelectedBackgroundFile(null)
        setCroppedBackgroundFile(null)
        setPreviewBackgroundUrl("")
        setBackgroundImageToCrop("")

        // Clear file input
        if (backgroundFileInputRef.current) {
          backgroundFileInputRef.current.value = ""
        }

        toast({
          title: "Background Updated Successfully",
          description: "Your profile background has been changed.",
        })

        // Reload profile data to get updated background
        await loadProfile()
      } else {
        throw new Error(backgroundRes?.message || "Unable to update background")
      }
    } catch (err) {
      console.error("Upload background failed:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred while updating background image",
        variant: "destructive"
      })
      throw err // Re-throw to let modal know upload failed
    }
  }

  // Handle background crop cancel
  const handleBackgroundCropCancel = () => {
    setShowBackgroundCropModal(false)
    setBackgroundImageToCrop("")
    // Reset file input
    if (backgroundFileInputRef.current) {
      backgroundFileInputRef.current.value = ""
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Show loading state
  if (profileState.loading) {
    return (
      <ProtectedRoute allowedRoles={["student", "club_leader", "uni_staff", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center space-y-4 p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">Loading Profile...</p>
                <p className="text-sm text-muted-foreground text-center">
                  Please wait a moment
                </p>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // Show error state
  if (profileState.error) {
    return (
      <ProtectedRoute allowedRoles={["student", "club_leader", "uni_staff", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center space-y-4 p-8">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Unable to Load Profile</h3>
                  <p className="text-sm text-muted-foreground">{profileState.error}</p>
                </div>
                <Button onClick={loadProfile} className="w-full">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // Return early if no profile data
  if (!profileState.data) {
    return (
      <ProtectedRoute allowedRoles={["student", "club_leader", "uni_staff", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center space-y-4 p-8">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <p className="text-lg font-medium">No profile information found</p>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // Destructure profile data for easier access
  const { fullName, email, phone, majorName, studentCode, bio, avatarUrl, backgroundUrl, userPoints } = profileState.data

  // --- HÀM ĐÃ CẬP NHẬT: Thêm logic trả về lớp animation ---
  const getPointsCardStyle = (points: number) => {
    if (points >= 5000) {
      return {
        cardClassName: "bg-gradient-to-r from-purple-600 to-pink-600",
        textColorClassName: "text-white",
        subtitleColorClassName: "text-white/80",
        iconBgClassName: "bg-white/20",
        iconColorClassName: "text-white",
        animationClassName: "animate-pulse-strong", // Animation tỏa sáng mạnh
      }
    }
    if (points >= 3000) {
      return {
        cardClassName: "bg-gradient-to-r from-sky-500 to-indigo-500",
        textColorClassName: "text-white",
        subtitleColorClassName: "text-white/80",
        iconBgClassName: "bg-white/20",
        iconColorClassName: "text-white",
        animationClassName: "animate-flicker", // Animation cháy vừa
      }
    }
    if (points >= 1000) {
      return {
        cardClassName: "bg-amber-50 dark:bg-amber-900/20",
        textColorClassName: "text-amber-900 dark:text-amber-300",
        subtitleColorClassName: "text-amber-700 dark:text-amber-400",
        iconBgClassName: "bg-amber-200 dark:bg-amber-800/50",
        iconColorClassName: "text-amber-600 dark:text-amber-400",
        // Dùng class của Tailwind để làm animation chậm lại
        animationClassName: "animate-flicker [animation-duration:3s]", // Animation cháy nhẹ
      }
    }
    // Mặc định cho 0-999 điểm
    return {
      cardClassName: "!bg-slate-100 dark:!bg-slate-800",
      textColorClassName: "text-slate-800 dark:text-slate-200",
      subtitleColorClassName: "text-slate-500 dark:text-slate-400",
      iconBgClassName: "bg-slate-200 dark:bg-slate-700",
      iconColorClassName: "text-slate-600 dark:text-slate-300",
      animationClassName: "", // Không có animation
    }
  }

  const isAdminRole = ["uni_staff", "uni_admin", "admin", "staff"].includes(auth.role || "")

  // =================================================================
  // GIAO DIỆN DÀNH CHO ADMIN
  // =================================================================
  if (isAdminRole) {
    return (
      <ProtectedRoute allowedRoles={["student", "club_leader", "uni_staff", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header chuyên nghiệp */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white relative overflow-hidden">
              {/* Background Image - Full Header Background */}
              {(previewBackgroundUrl || backgroundUrl) && (
                <div
                  className="absolute inset-0 bg-cover bg-center z-0"
                  style={{
                    backgroundImage: `url(${previewBackgroundUrl || backgroundUrl || "/placeholder.jpg"})`,
                  }}
                />
              )}
              {/* Dark overlay to ensure text readability over bright backgrounds */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-0" />

              {/* Hidden file input for background */}
              <input
                ref={backgroundFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackgroundFileChange}
                className="hidden"
                aria-label="Upload background image"
              />

              {/* Change Background Button - Upper Right Corner */}
              <div className="absolute top-4 right-4 z-20">
                <Button
                  onClick={handleBackgroundClick}
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200 font-medium shadow-lg"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Background
                </Button>
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar
                      className="w-24 h-24 border-4 border-white/30 shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={handleAvatarClick}
                    >
                      <AvatarImage src={previewAvatarUrl || avatarUrl || "/placeholder-user.jpg"} alt={fullName} />
                      <AvatarFallback className="text-3xl bg-white/20">{getInitials(fullName || "A")}</AvatarFallback>
                    </Avatar>
                    {/* <div
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/80 transition-colors shadow-lg"
                      onClick={handleAvatarClick}
                    >
                      <Camera className="h-3 w-3" />
                    </div> */}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] [-webkit-text-stroke:1px_black]">
                      {fullName || "Administrator"}
                    </h1>
                    <p className="text-xl text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      {formatRoleName(auth.role)}
                    </p>
                    <p className="text-md text-white mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] [-webkit-text-stroke:0.4px_black]">
                      {auth.user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột trái - Thông tin và vai trò */}
                <div className="lg:col-span-2 space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <User className="h-5 w-5 text-primary" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>Manage your account details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label htmlFor="admin-email">Email Address</Label>
                          <Input id="admin-email" value={auth.user?.email || ""} disabled className="bg-slate-100 border-slate-300" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-fullName">Full Name</Label>
                          <Input
                            id="admin-fullName"
                            value={fullName}
                            onChange={(e) => updateProfileData('fullName', e.target.value)}
                            className="border-slate-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-studentCode">Student Code</Label>
                          <Input id="admin-studentCode" value={studentCode} disabled className="bg-slate-100 border-slate-300" />
                        </div>

                        {/* --- THAY ĐỔI 4 (ADMIN): THAY THẾ INPUT BẰNG SELECT --- */}
                        <div className="space-y-1">
                          <Label htmlFor="admin-majorName">Major</Label>
                          <Select
                            value={majorName}
                            onValueChange={(value) => updateProfileData('majorName', value)}
                          >
                            <SelectTrigger id="admin-majorName" className="w-full border-slate-300">
                              <SelectValue placeholder="Select a major" className="truncate" />
                            </SelectTrigger>
                            <SelectContent>
                              {allMajors.map((major) => (
                                <SelectItem key={major.id} value={major.name}>
                                  {major.name}
                                  {!major.active && " (Inactive)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="admin-phone">Phone Number</Label>
                          <Input
                            id="admin-phone"
                            value={phone}
                            onChange={(e) => updateProfileData('phone', e.target.value)}
                            className="border-slate-300"
                          />
                        </div>
                        {/* location removed */}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="admin-bio">Biography / Bio</Label>
                        <Textarea
                          id="admin-bio"
                          value={bio}
                          onChange={(e) => updateProfileData('bio', e.target.value)}
                          className="min-h-[80px] border-slate-300"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={handleSave} disabled={profileState.saving} className="w-fit">
                          {profileState.saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {profileState.saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          onClick={() => setShowChangePassword(true)}
                          variant="outline"
                          className="w-fit"
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <UserCheck className="h-5 w-5 text-primary" />
                        Role & Responsibilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {auth.role === "uni_staff" && (
                        <>
                          <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"><Building2 className="h-5 w-5 text-primary" /><span>University Management</span></div>
                          <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"><Users className="h-5 w-5 text-primary" /><span>User Administration</span></div>
                          <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"><BarChart3 className="h-5 w-5 text-primary" /><span>Analytics & Reports</span></div>
                          <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"><Settings className="h-5 w-5 text-primary" /><span>System Configuration</span></div>
                        </>
                      )}
                      {(auth.role === "admin" || auth.role === "staff") && (
                        <>
                          <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"><Globe className="h-5 w-5 text-primary" /><span>Partner Management</span></div>
                          <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"><FileText className="h-5 w-5 text-primary" /><span>Offer Management</span></div>
                          <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"><UserCheck className="h-5 w-5 text-primary" /><span>Customer Support</span></div>
                          <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"><BarChart3 className="h-5 w-5 text-primary" /><span>Performance Analytics</span></div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Cột phải - Thống kê nhanh và Hoạt động */}
                <div className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Quick Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-6 w-6 text-blue-600" />
                          <span className="text-gray-700">Total Users</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">{adminStats.totalUsers}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-6 w-6 text-green-600" />
                          <span className="text-gray-700">Active Events</span>
                        </div>
                        <span className="text-xl font-bold text-green-600">{adminStats.activeEvents}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-6 w-6 text-purple-600" />
                          <span className="text-gray-700">Reports Generated</span>
                        </div>
                        <span className="text-xl font-bold text-purple-600">{adminStats.reportsGenerated}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <Clock className="h-5 w-5 text-primary" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3 text-sm">
                        <Settings className="h-5 w-5 text-slate-500 mt-0.5" />
                        <div>
                          <p>Updated <span className="font-semibold">System Settings</span>.</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <FileText className="h-5 w-5 text-slate-500 mt-0.5" />
                        <div>
                          <p>Created <span className="font-semibold">September Report</span>.</p>
                          <p className="text-xs text-muted-foreground">5 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <UserCheck className="h-5 w-5 text-slate-500 mt-0.5" />
                        <div>
                          <p>Approved new partner: <span className="font-semibold">ABC Corp</span>.</p>
                          <p className="text-xs text-muted-foreground">1 day ago</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </AppShell>

        {/* Avatar Crop Modal */}
        <AvatarCropModal
          isOpen={showCropModal}
          onClose={handleCropCancel}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
        />

        {/* Background Crop Modal */}
        <AvatarCropModal
          isOpen={showBackgroundCropModal}
          onClose={handleBackgroundCropCancel}
          imageSrc={backgroundImageToCrop}
          onCropComplete={handleBackgroundCropComplete}
          aspectRatio={3} // 3:1 aspect ratio for wide background
          minOutputWidth={1800}
          title="Crop Background Image"
        />

        {/* Change Password Modal */}
        <ChangePasswordModal
          open={showChangePassword}
          onOpenChange={setShowChangePassword}
        />
      </ProtectedRoute>
    )
  }

  // =================================================================
  // GIAO DIỆN DÀNH CHO NGƯỜI DÙNG THƯỜNG (STUDENT, CLUB_LEADER)
  // =================================================================
  return (
    <ProtectedRoute allowedRoles={["student", "club_leader", "uni_staff", "admin", "staff"]}>
      <AppShell>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          {/* Header với ảnh đại diện */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 pb-20 relative overflow-hidden">
            {/* Background Image - Full Header Background */}
            {(previewBackgroundUrl || backgroundUrl) && (
              <div
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{
                  backgroundImage: `url(${previewBackgroundUrl || backgroundUrl || "/placeholder.jpg"})`,
                }}
              />
            )}
            {/* Dark overlay to ensure text readability over bright backgrounds */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-0" />

            {/* Hidden file input for background */}
            <input
              ref={backgroundFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundFileChange}
              className="hidden"
              aria-label="Upload background image"
            />

            {/* Buttons - Upper Right Corner */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <Button
                onClick={handleBackgroundClick}
                variant="secondary"
                size="sm"
                className="bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-medium shadow-lg"
              >
                <Camera className="h-4 w-4 mr-2" />
                Change Background
              </Button>
              <Button
                onClick={() => router.push('/virtual-card')}
                className="bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:bg-white/90 dark:hover:bg-gray-800/90 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                </svg>
                View Card
              </Button>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 text-center relative z-10">
              <div className="relative">
                <Avatar
                  className="w-28 h-28 mx-auto border-4 border-white/50 shadow-xl cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleAvatarClick}
                >
                  <AvatarImage src={previewAvatarUrl || avatarUrl || "/placeholder-user.jpg"} alt={fullName} />
                  <AvatarFallback className="text-4xl bg-white/30 text-white">{getInitials(fullName)}</AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload avatar image"
                />
              </div>
              <h1 className="mt-4 text-3xl font-bold text-white tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] [-webkit-text-stroke:1px_black]">
                {fullName}
              </h1>
              <p className="mt-1 text-lg text-white/85 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] [-webkit-text-stroke:0.4px_black]">
                {auth.user?.email}
              </p>
            </div>
          </div>

          {/* Phần nội dung chính */}
          <div className="relative -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Personal Information */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Edit3 className="h-5 w-5 text-primary" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Update your profile and related information.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <Label htmlFor="user-email">Email Address</Label>
                        <Input id="user-email" value={auth.user?.email || ""} disabled className="bg-slate-100 border-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="user-fullName">Full Name</Label>
                        <Input
                          id="user-fullName"
                          value={fullName}
                          onChange={(e) => updateProfileData('fullName', e.target.value)}
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="user-phone">Phone Number</Label>
                        <Input
                          id="user-phone"
                          value={phone}
                          onChange={(e) => updateProfileData('phone', e.target.value)}
                          className="border-slate-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="user-studentCode">Student Code</Label>
                        <Input id="user-studentCode" value={studentCode} disabled className="bg-slate-100 border-slate-300" />
                      </div>
                      {/* --- THAY ĐỔI 5 (USER): THAY THẾ INPUT BẰNG SELECT --- */}
                      <div className="space-y-1">
                        <Label htmlFor="user-majorName">Major</Label>
                        <Select
                          value={majorName}
                          onValueChange={(value) => updateProfileData('majorName', value)}
                        >
                          <SelectTrigger id="user-majorName" className="w-full border-slate-300">
                            <SelectValue placeholder="Select a major" className="truncate" />
                          </SelectTrigger>
                          <SelectContent>
                            {allMajors.map((major) => (
                              <SelectItem key={major.id} value={major.name}>
                                {major.name}
                                {!major.active && " (Inactive)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="user-bio">Biography / Bio</Label>
                      <Textarea
                        id="user-bio"
                        value={bio}
                        onChange={(e) => updateProfileData('bio', e.target.value)}
                        className="min-h-[80px] border-slate-300"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSave}
                        disabled={profileState.saving}
                        className="w-fit bg-primary hover:bg-primary/90"
                      >
                        {profileState.saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {profileState.saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        onClick={() => setShowChangePassword(true)}
                        variant="outline"
                        className="w-fit"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Points and Statistics */}
              <div className="space-y-6">
                {/* --- WALLET CARDS - Display all wallets as separate cards --- */}
                {memberships.length > 0 ? (
                  memberships.map((membership) => {
                    const pointsCardStyle = getPointsCardStyle(membership.balancePoints)
                    return (
                      <Card
                        key={membership.walletId}
                        className={`shadow-lg border-0 transition-all duration-300 ${pointsCardStyle.cardClassName}`}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium transition-colors duration-300 ${pointsCardStyle.subtitleColorClassName} truncate`}>
                              {membership.clubName}
                            </p>
                            <p className={`text-3xl font-bold transition-colors duration-300 ${pointsCardStyle.textColorClassName}`}>
                              {membership.balancePoints.toLocaleString()}
                            </p>
                          </div>
                          <div className={`p-3 rounded-full transition-colors duration-300 ${pointsCardStyle.iconBgClassName}`}>
                            <Flame className={
                              `h-6 w-6 transition-colors duration-300 
                              ${pointsCardStyle.iconColorClassName} 
                              ${pointsCardStyle.animationClassName}`
                            } />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  // Show empty state when no wallets
                  <Card className="shadow-lg border-0 bg-slate-100 dark:bg-slate-800">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                          No Club Memberships
                        </p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                          0
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-slate-200 dark:bg-slate-700">
                        <Flame className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Zap className="h-5 w-5 text-primary" />
                      Activity Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {statsLoading ? (
                      // Loading state for stats
                      <>
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse">
                            <div className="h-7 w-7 bg-slate-300 dark:bg-slate-600 rounded mx-auto mb-1" />
                            <div className="h-6 w-12 bg-slate-300 dark:bg-slate-600 rounded mx-auto mb-1" />
                            <div className="h-3 w-20 bg-slate-300 dark:bg-slate-600 rounded mx-auto" />
                          </div>
                        ))}
                      </>
                    ) : userStats ? (
                      // Real data from API
                      <>
                        <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <Users className="h-7 w-7 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{userStats.totalClubsJoined}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Clubs Joined</div>
                        </div>
                        <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <Calendar className="h-7 w-7 text-green-600 dark:text-green-400 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-green-800 dark:text-green-300">{userStats.totalEventsJoined}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Events Joined</div>
                        </div>
                        <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <Zap className="h-7 w-7 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">{userStats.totalPointsEarned.toLocaleString()}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Points Earned</div>
                        </div>
                        <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">{userStats.totalAttendanceDays}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Attendance Days</div>
                        </div>
                      </>
                    ) : (
                      // Empty state if no stats available
                      <>
                        <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <Users className="h-7 w-7 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">0</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Clubs Joined</div>
                        </div>
                        <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <Calendar className="h-7 w-7 text-green-600 dark:text-green-400 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-green-800 dark:text-green-300">0</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Events Joined</div>
                        </div>
                        <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <Zap className="h-7 w-7 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">0</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Points Earned</div>
                        </div>
                        <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">0</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Attendance Days</div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </AppShell>

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={showCropModal}
        onClose={handleCropCancel}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />

      {/* Background Crop Modal */}
      <AvatarCropModal
        isOpen={showBackgroundCropModal}
        onClose={handleBackgroundCropCancel}
        imageSrc={backgroundImageToCrop}
        onCropComplete={handleBackgroundCropComplete}
        aspectRatio={3} // 3:1 aspect ratio for wide background
        minOutputWidth={1800}
        title="Crop Background Image"
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </ProtectedRoute>
  )
}