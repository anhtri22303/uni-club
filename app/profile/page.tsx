"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
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
  Flame, // Thay thế Star bằng Flame
  Zap,
  Building2,
  Trophy,
} from "lucide-react"

export default function ProfilePage() {
  const { auth } = useAuth()
  const { toast } = useToast()

  // --- Dữ liệu tĩnh cho giao diện ---
  const [fullName, setFullName] = useState("Nguyễn Văn An")
  const [phone, setPhone] = useState("0901234567")
  const [bio, setBio] = useState("Sinh viên đam mê công nghệ và các hoạt động ngoại khóa. Thích tham gia các CLB để học hỏi và kết nối.")
  const [location, setLocation] = useState("TP. Hồ Chí Minh, Việt Nam")
  const [userPoints, setUserPoints] = useState(2450)

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

  // --- Logic xử lý ---

  useEffect(() => {
    if (auth.user) {
      const savedProfile = localStorage.getItem(`clubly-profile-${auth.userId}`)
      if (savedProfile) {
        const profile = JSON.parse(savedProfile)
        setPhone(profile.phone || "0901234567")
        setBio(profile.bio || "Sinh viên đam mê công nghệ...")
        setLocation(profile.location || "TP. Hồ Chí Minh, Việt Nam")
      }
    }
  }, [auth.user, auth.userId])

  const handleSave = () => {
    const profile = { fullName, phone, bio, location }
    localStorage.setItem(`clubly-profile-${auth.userId}`, JSON.stringify(profile))
    toast({
      title: "Cập nhật thành công",
      description: "Thông tin hồ sơ của bạn đã được lưu lại.",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  
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

  const isAdminRole = ["uni_admin", "admin", "staff"].includes(auth.role || "")
  
  const pointsCardStyle = getPointsCardStyle(userPoints)

  // =================================================================
  // GIAO DIỆN DÀNH CHO ADMIN
  // =================================================================
  if (isAdminRole) {
    return (
      <ProtectedRoute allowedRoles={["student", "club_lead", "uni_admin", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-slate-50">
            {/* Header chuyên nghiệp */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center space-x-6">
                  <Avatar className="w-24 h-24 border-4 border-white/30 shadow-lg">
                    <AvatarImage src="/placeholder-user.jpg" alt={fullName} />
                    <AvatarFallback className="text-3xl bg-white/20">{getInitials(fullName || "A")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">{fullName || "Administrator"}</h1>
                    <p className="text-xl text-white/80 capitalize">{auth.role?.replace("_", " ")}</p>
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
                        Thông tin cá nhân
                      </CardTitle>
                      <CardDescription>Quản lý chi tiết tài khoản của bạn.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label htmlFor="admin-email">Địa chỉ Email</Label>
                          <Input id="admin-email" value={auth.user?.email || ""} disabled className="bg-slate-100" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-fullName">Họ và Tên</Label>
                          <Input id="admin-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-phone">Số điện thoại</Label>
                          <Input id="admin-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-location">Vị trí</Label>
                          <Input id="admin-location" value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="admin-bio">Giới thiệu</Label>
                        <textarea
                          id="admin-bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Giới thiệu đôi chút về vai trò của bạn..."
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-primary resize-none text-sm"
                        />
                      </div>
                      <Button onClick={handleSave} className="w-fit">
                        <Save className="h-4 w-4 mr-2" /> Lưu thay đổi
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
                        {auth.role === "uni_admin" && (
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
  // GIAO DIỆN DÀNH CHO NGƯỜI DÙNG THƯỜNG (STUDENT, CLUB_LEAD)
  // =================================================================
  return (
    <ProtectedRoute allowedRoles={["student", "club_lead", "uni_admin", "admin", "staff"]}>
      <AppShell>
        <div className="min-h-screen bg-slate-50">
          {/* Header với ảnh đại diện */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 text-center">
              <Avatar className="w-28 h-28 mx-auto border-4 border-white/50 shadow-xl">
                <AvatarImage src="/placeholder-user.jpg" alt={fullName} />
                <AvatarFallback className="text-4xl bg-white/30 text-white">{getInitials(fullName)}</AvatarFallback>
              </Avatar>
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
                        <Input id="user-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="user-phone">Số điện thoại</Label>
                        <Input id="user-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="user-location">Vị trí</Label>
                        <Input id="user-location" value={location} onChange={(e) => setLocation(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="user-bio">Giới thiệu bản thân</Label>
                      <textarea
                        id="user-bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Giới thiệu đôi chút về bạn..."
                        rows={4}
                        className="w-full px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-primary resize-none text-sm"
                      />
                    </div>
                    <Button onClick={handleSave} className="w-fit bg-primary hover:bg-primary/90">
                      <Save className="h-4 w-4 mr-2" />
                      Lưu thay đổi
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
    </ProtectedRoute>
  )
}