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
  User,
  Mail,
  Phone,
  Save,
  Calendar,
  MapPin,
  Edit3,
  Clock,
  Users,
  Settings,
  UserCheck,
  FileText,
  BarChart3,
  Globe,
  Flame,
  Zap,
  Building2,
  Trophy,
  Loader2,
  AlertCircle,
  Camera,
} from "lucide-react"
import { editProfile, fetchProfile, uploadAvatar } from "@/service/userApi"
import { AvatarCropModal } from "@/components/avatar-crop-modal"

// Types for profile data
interface ProfileData {
  fullName: string
  email: string
  phone: string
  majorName: string
  studentCode: string
  bio: string
  avatarUrl: string
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
  const [savingAvatar, setSavingAvatar] = useState<boolean>(false)
  
  // States for crop modal
  const [showCropModal, setShowCropModal] = useState<boolean>(false)
  const [imageToCrop, setImageToCrop] = useState<string>("")
  const [croppedFile, setCroppedFile] = useState<File | null>(null)

  // Dữ liệu tĩnh cho hoạt động người dùng
  const userStats = {
    clubsJoined: 5,
    eventsAttended: 12,
    monthsActive: 6,
    achievements: 3,
  }

  // Dữ liệu tĩnh cho quản trị viên
  const adminStats = {
    totalUsers: "1,247",
    activeEvents: "89",
    reportsGenerated: "156",
  }

  const formatRoleName = (roleId?: string | null) => {
    if (!roleId) return ""
    const map: Record<string, string> = {
      member: "MEMBER",
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
      
      const profile = await fetchProfile() as any
      
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
        userPoints: Number(profile?.wallet?.balancePoints ?? 0),
      }

      setProfileState({
        data: profileData,
        loading: false,
        error: null,
        saving: false,
      })
      
      // Clear file selection when profile loads
      setSelectedFile(null)
      setPreviewAvatarUrl("")

    } catch (err) {
      console.error("Failed to load profile:", err)
      setProfileState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load profile"
      }))
    }
  }

  // Load profile when component mounts or auth.userId changes
  useEffect(() => {
    loadProfile()
  }, [auth.userId])

  // Handle profile update (không bao gồm avatar)
  const handleSave = async () => {
    if (!profileState.data) return

    try {
      setProfileState(prev => ({ ...prev, saving: true }))

      // Chỉ cập nhật thông tin profile (không bao gồm avatar)
      const { fullName, email, phone, majorName, bio } = profileState.data
      const payload: Record<string, any> = { 
        email, 
        fullName, 
        phone, 
        majorName, 
        bio
      }

      const res = (await editProfile(payload)) as any
      
      if (res && res.success) {
        toast({
          title: "Update Successful",
          description: "Your profile information has been saved.",
        })
        // Reload profile data after successful update
        await loadProfile()
      } else {
        throw new Error(res?.message || "Unable to update profile")
      }
    } catch (err) {
      console.error("Edit profile failed:", err)
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "An error occurred while updating profile" 
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

  // Handle save avatar separately - upload trực tiếp file
  const handleSaveAvatar = async () => {
    if (!selectedFile) return

    try {
      setSavingAvatar(true)

      toast({
        title: "Uploading...",
        description: "Uploading image, please wait...",
      })

      // Gọi API upload avatar trực tiếp với file đã được crop
      const avatarRes = await uploadAvatar(selectedFile)
      if (avatarRes && avatarRes.success) {
        // Clear all avatar upload states
        setSelectedFile(null)
        setCroppedFile(null)
        setPreviewAvatarUrl("") 
        
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
      console.error("Save avatar failed:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred while updating profile picture"
      })
    } finally {
      setSavingAvatar(false)
    }
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

  // Handle crop complete - convert blob to file and set for upload
  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert blob to file
    const croppedFile = new File([croppedBlob], 'cropped-avatar.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    })
    
    setCroppedFile(croppedFile)
    setSelectedFile(croppedFile)
    
    // Create preview URL từ blob
    const previewUrl = URL.createObjectURL(croppedBlob)
    setPreviewAvatarUrl(previewUrl)
    
    // Close modal
    setShowCropModal(false)
    setImageToCrop("")
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
      <ProtectedRoute allowedRoles={["member", "student", "club_leader", "uni_staff", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
      <ProtectedRoute allowedRoles={["member", "student", "club_leader", "uni_staff", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
      <ProtectedRoute allowedRoles={["member", "student", "club_leader", "uni_staff", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center space-y-4 p-8">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <p className="text-lg font-medium">Không tìm thấy thông tin hồ sơ</p>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // Destructure profile data for easier access
  const { fullName, email, phone, majorName, studentCode, bio, avatarUrl, userPoints } = profileState.data
  
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
        cardClassName: "bg-amber-50",
        textColorClassName: "text-amber-900",
        subtitleColorClassName: "text-amber-700",
        iconBgClassName: "bg-amber-200",
        iconColorClassName: "text-amber-600",
        // Dùng class của Tailwind để làm animation chậm lại
        animationClassName: "animate-flicker [animation-duration:3s]", // Animation cháy nhẹ
      }
    }
    // Mặc định cho 0-999 điểm
    return {
      cardClassName: "bg-slate-100",
      textColorClassName: "text-slate-800",
      subtitleColorClassName: "text-slate-500",
      iconBgClassName: "bg-slate-200",
      iconColorClassName: "text-slate-600",
      animationClassName: "", // Không có animation
    }
  }

  const isAdminRole = ["uni_staff", "uni_admin", "admin", "staff"].includes(auth.role || "")
  
  const pointsCardStyle = getPointsCardStyle(userPoints)

  // =================================================================
  // GIAO DIỆN DÀNH CHO ADMIN
  // =================================================================
  if (isAdminRole) {
    return (
      <ProtectedRoute allowedRoles={["member", "student", "club_leader", "uni_staff", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-slate-50">
            {/* Header chuyên nghiệp */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center space-x-6">
                  <div className="relative flex flex-col items-center">
                    <div className="relative">
                      <Avatar 
                        className="w-24 h-24 border-4 border-white/30 shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={handleAvatarClick}
                      >
                        <AvatarImage src={previewAvatarUrl || avatarUrl || "/placeholder-user.jpg"} alt={fullName} />
                        <AvatarFallback className="text-3xl bg-white/20">{getInitials(fullName || "A")}</AvatarFallback>
                      </Avatar>
                      <div 
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/80 transition-colors shadow-lg"
                        onClick={handleAvatarClick}
                      >
                        <Camera className="h-3 w-3" />
                      </div>
                    </div>
                    
                    {/* Nút Save Avatar cho admin - chỉ hiện khi có file được chọn */}
                    {selectedFile && (
                      <Button
                        onClick={handleSaveAvatar}
                        disabled={savingAvatar}
                        size="sm"
                        className="mt-2 bg-white/20 text-white hover:bg-white/30 border border-white/30"
                      >
                        {savingAvatar ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        {savingAvatar ? "Lưu..." : "Lưu"}
                      </Button>
                    )}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">{fullName || "Administrator"}</h1>
                    <p className="text-xl text-white/80">{formatRoleName(auth.role)}</p>
                    <p className="text-md text-white/70 mt-1">{auth.user?.email}</p>
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
                          <Input id="admin-email" value={auth.user?.email || ""} disabled className="bg-slate-100" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-fullName">Full Name</Label>
                          <Input 
                            id="admin-fullName" 
                            value={fullName} 
                            onChange={(e) => updateProfileData('fullName', e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-studentCode">Student Code</Label>
                          <Input id="admin-studentCode" value={studentCode} disabled className="bg-slate-100" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-majorName">Major</Label>
                          <Input 
                            id="admin-majorName" 
                            value={majorName} 
                            onChange={(e) => updateProfileData('majorName', e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-phone">Phone Number</Label>
                          <Input 
                            id="admin-phone" 
                            value={phone} 
                            onChange={(e) => updateProfileData('phone', e.target.value)} 
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
                          className="min-h-[80px]" 
                        />
                      </div>
                      <Button onClick={handleSave} disabled={profileState.saving} className="w-fit">
                        {profileState.saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {profileState.saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <UserCheck className="h-5 w-5 text-primary" />
                        Vai trò & Trách nhiệm
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {auth.role === "uni_staff" && (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg"><Building2 className="h-5 w-5 text-primary" /><span>Quản lý trường</span></div>
                            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg"><Users className="h-5 w-5 text-primary" /><span>Quản trị người dùng</span></div>
                            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg"><BarChart3 className="h-5 w-5 text-primary" /><span>Phân tích & Báo cáo</span></div>
                            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg"><Settings className="h-5 w-5 text-primary" /><span>Cấu hình hệ thống</span></div>
                          </>
                        )}
                        {(auth.role === "admin" || auth.role === "staff") && (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg"><Globe className="h-5 w-5 text-primary" /><span>Quản lý đối tác</span></div>
                            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg"><FileText className="h-5 w-5 text-primary" /><span>Quản lý ưu đãi</span></div>
                            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg"><UserCheck className="h-5 w-5 text-primary" /><span>Hỗ trợ khách hàng</span></div>
                            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg"><BarChart3 className="h-5 w-5 text-primary" /><span>Phân tích hiệu suất</span></div>
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
                        Thống kê nhanh
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Users className="h-6 w-6 text-blue-600" />
                            <span className="text-gray-700">Tổng người dùng</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">{adminStats.totalUsers}</span>
                      </div>
                       <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-6 w-6 text-green-600" />
                            <span className="text-gray-700">Sự kiện đang diễn ra</span>
                        </div>
                        <span className="text-xl font-bold text-green-600">{adminStats.activeEvents}</span>
                      </div>
                       <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-purple-600" />
                            <span className="text-gray-700">Báo cáo đã tạo</span>
                        </div>
                        <span className="text-xl font-bold text-purple-600">{adminStats.reportsGenerated}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-3 text-xl">
                        <Clock className="h-5 w-5 text-primary" />
                        Hoạt động gần đây
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 text-sm">
                            <Settings className="h-5 w-5 text-slate-500 mt-0.5" />
                            <div>
                                <p>Đã cập nhật <span className="font-semibold">Cài đặt hệ thống</span>.</p>
                                <p className="text-xs text-muted-foreground">2 giờ trước</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                            <FileText className="h-5 w-5 text-slate-500 mt-0.5" />
                            <div>
                                <p>Đã tạo <span className="font-semibold">Báo cáo tháng 9</span>.</p>
                                <p className="text-xs text-muted-foreground">5 giờ trước</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                            <UserCheck className="h-5 w-5 text-slate-500 mt-0.5" />
                            <div>
                                <p>Phê duyệt đối tác mới: <span className="font-semibold">ABC Corp</span>.</p>
                                <p className="text-xs text-muted-foreground">1 ngày trước</p>
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // =================================================================
  // GIAO DIỆN DÀNH CHO NGƯỜI DÙNG THƯỜNG (STUDENT, CLUB_LEADER)
  // =================================================================
  return (
  <ProtectedRoute allowedRoles={["member", "student", "club_leader", "uni_staff", "admin", "staff"]}>
      <AppShell>
        <div className="min-h-screen bg-slate-50">
          {/* Header với ảnh đại diện */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 text-center">
              <div className="relative flex flex-col items-center">
                <div className="relative">
                  <Avatar 
                    className="w-28 h-28 mx-auto border-4 border-white/50 shadow-xl cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage src={previewAvatarUrl || avatarUrl || "/placeholder-user.jpg"} alt={fullName} />
                    <AvatarFallback className="text-4xl bg-white/30 text-white">{getInitials(fullName)}</AvatarFallback>
                  </Avatar>
                  <div 
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/80 transition-colors shadow-lg"
                    onClick={handleAvatarClick}
                  >
                    <Camera className="h-4 w-4" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Upload avatar image"
                  />
                </div>
                
                {/* Nút Save Avatar - chỉ hiện khi có file được chọn */}
                {selectedFile && (
                  <Button
                    onClick={handleSaveAvatar}
                    disabled={savingAvatar}
                    size="sm"
                    className="mt-3 bg-white/20 text-white hover:bg-white/30 border border-white/30"
                  >
                    {savingAvatar ? (
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-2" />
                    )}
                    {savingAvatar ? "Đang lưu..." : "Lưu Avatar"}
                  </Button>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-bold text-white tracking-tight">{fullName}</h1>
              <p className="mt-1 text-lg text-white/80">{auth.user?.email}</p>
            </div>
          </div>

          {/* Phần nội dung chính */}
          <div className="relative -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cột trái - Thông tin cá nhân */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Edit3 className="h-5 w-5 text-primary" />
                      Thông tin cá nhân
                    </CardTitle>
                    <CardDescription>Cập nhật hồ sơ và các thông tin liên quan của bạn.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <Label htmlFor="user-email">Địa chỉ Email</Label>
                        <Input id="user-email" value={auth.user?.email || ""} disabled className="bg-slate-100" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="user-fullName">Họ và Tên</Label>
                        <Input 
                          id="user-fullName" 
                          value={fullName} 
                          onChange={(e) => updateProfileData('fullName', e.target.value)} 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="user-phone">Số điện thoại</Label>
                        <Input 
                          id="user-phone" 
                          value={phone} 
                          onChange={(e) => updateProfileData('phone', e.target.value)} 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="user-studentCode">Mã sinh viên</Label>
                        <Input id="user-studentCode" value={studentCode} disabled className="bg-slate-100" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="user-majorName">Ngành</Label>
                        <Input 
                          id="user-majorName" 
                          value={majorName} 
                          onChange={(e) => updateProfileData('majorName', e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="user-bio">Tiểu sử / Bio</Label>
                      <Textarea 
                        id="user-bio" 
                        value={bio} 
                        onChange={(e) => updateProfileData('bio', e.target.value)} 
                        className="min-h-[80px]" 
                      />
                    </div>
                    
                    {/* Preview notification */}
                    {selectedFile && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700 flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Ảnh đại diện mới đã được chọn: <strong>{selectedFile.name}</strong>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Nhấn nút "Lưu Avatar" bên trên để cập nhật ảnh đại diện.
                        </p>
                      </div>
                    )}

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
                      {profileState.saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Cột phải - Điểm và Thống kê */}
              <div className="space-y-6">
                {/* --- KHUNG ĐIỂM TÍCH LŨY VỚI ICON LỬA VÀ ANIMATION --- */}
                <Card className={`shadow-lg border-0 transition-all duration-300 ${pointsCardStyle.cardClassName}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium transition-colors duration-300 ${pointsCardStyle.subtitleColorClassName}`}>
                        Điểm Tích Lũy
                      </p>
                      <p className={`text-3xl font-bold transition-colors duration-300 ${pointsCardStyle.textColorClassName}`}>
                        {userPoints.toLocaleString()}
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

                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Zap className="h-5 w-5 text-primary" />
                      Thống kê hoạt động
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-100 rounded-lg">
                      <Users className="h-7 w-7 text-blue-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-blue-800">{userStats.clubsJoined}</div>
                      <div className="text-xs text-slate-600">CLB đã tham gia</div>
                    </div>
                    <div className="text-center p-4 bg-slate-100 rounded-lg">
                      <Calendar className="h-7 w-7 text-green-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-green-800">{userStats.eventsAttended}</div>
                      <div className="text-xs text-slate-600">Sự kiện tham dự</div>
                    </div>
                    <div className="text-center p-4 bg-slate-100 rounded-lg">
                      <Clock className="h-7 w-7 text-purple-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-purple-800">{userStats.monthsActive}</div>
                      <div className="text-xs text-slate-600">Tháng hoạt động</div>
                    </div>
                     <div className="text-center p-4 bg-slate-100 rounded-lg">
                      <Trophy className="h-7 w-7 text-amber-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-amber-800">{userStats.achievements}</div>
                      <div className="text-xs text-slate-600">Thành tích</div>
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
    </ProtectedRoute>
  )
}