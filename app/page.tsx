"use client"

import { signUp, forgotPassword } from "@/service/authApi"
import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, UserPlus, Smartphone, Eye, EyeOff } from "lucide-react"
import { GoogleSignInButton } from "@/components/GoogleSignInButton"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [fullName, setFullName] = useState("")
  const [studentCode, setStudentCode] = useState("")
  const [majorName, setMajorName] = useState("")
  const roleName = "STUDENT"
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showLoginError, setShowLoginError] = useState(false)
  const [isLoadingForgotPassword, setIsLoadingForgotPassword] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [phone, setPhone] = useState("")

  // nextParam này chỉ dùng cho mục đích hiển thị trên UI
  const nextParamForDisplay = searchParams.get('next')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSignUpMode) {
      // Validate từng trường
      if (!fullName) {
        toast({ title: "Missing Full Name", description: "Please enter your full name.", variant: "destructive" });
        return;
      }
      if (!studentCode) {
        toast({ title: "Missing Student ID", description: "Please enter your student ID.", variant: "destructive" });
        return;
      }
      // Mã số sinh viên: 2 chữ cái đầu (in hoa), 6 số liền kề
      if (!/^[A-Z]{2}\d{6}$/.test(studentCode)) {
        toast({ title: "Invalid Student ID", description: "Student ID must start with 2 letters followed by 6 digits (e.g. SE123456).", variant: "destructive" });
        return;
      }
      if (!majorName) {
        toast({ title: "Missing Major", description: "Please enter your major name.", variant: "destructive" });
        return;
      }
      if (!email) {
        toast({ title: "Missing Email", description: "Please enter your email.", variant: "destructive" });
        return;
      }
      // Email hợp lệ
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
        return;
      }
      if (!phone) {
        toast({ title: "Missing Phone", description: "Please enter your phone number.", variant: "destructive" });
        return;
      }
      // Số điện thoại: chỉ cho phép số, đúng 10 số
      if (!/^\d{10}$/.test(phone)) {
        toast({ title: "Invalid Phone Number", description: "Phone number must be exactly 10 digits.", variant: "destructive" });
        return;
      }
      if (!password) {
        toast({ title: "Missing Password", description: "Please enter your password.", variant: "destructive" });
        return;
      }
      if (!confirmPassword) {
        toast({ title: "Missing Confirm Password", description: "Please confirm your password.", variant: "destructive" });
        return;
      }
      if (password !== confirmPassword) {
        toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
        return;
      }

      try {
        const res = await signUp({
          email,
          password,
          fullName,
          phone,
          studentCode,
          majorName,
          roleName,
        })

        toast({
          title: "Registration Successful",
          description: `Welcome ${res.fullName}! You can now sign in.`,
        })

        // Reset form and switch to login mode
        setIsSignUpMode(false)
        setFullName("")
        setStudentCode("")
        setMajorName("")
        setPhone("")
        setConfirmPassword("")
        setEmail("")
        setPassword("")
      } catch (error: any) {
        toast({
          title: "Sign Up Failed",
          description: error.response?.data?.message || "Something went wrong",
          variant: "destructive",
        })
      }
      return;
    }

    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // ⭐ SỬA LỖI TẠI ĐÂY: Lấy giá trị 'next' ngay trước khi gọi login
    // để đảm bảo luôn có giá trị mới nhất, tránh lỗi stale state.
    // Thêm decode để đảm bảo path đúng (ví dụ: %2F thành /)
    const nextRaw = searchParams.get('next')
    const next = nextRaw ? decodeURIComponent(nextRaw) : undefined
    const success = await login(email, password, next)

    if (success) {
      setShowLoginError(false) // Reset error state on success
      toast({
        title: "Login Successful",
        description: "Redirecting...",
      })
    } else {
      setShowLoginError(true) // Show forgot password option
      toast({
        title: "Login Failed",
        description: "Invalid credentials or server error",
        variant: "destructive",
      })
    }
  }

  const toggleMode = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsSignUpMode((v) => !v)
      setIsAnimating(false)
      setEmail("")
      setPhone("")
      setPassword("")
      setFullName("")
      setStudentCode("")
      setMajorName("")
      setConfirmPassword("")
      setShowLoginError(false) // Reset error state when switching modes
    }, 250)
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first",
        variant: "destructive",
      })
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    setIsLoadingForgotPassword(true)
    
    try {
      const response = await forgotPassword(email)
      if (response.success) {
        toast({
          title: "Password Reset Email Sent",
          description: response.message,
        })
        setShowLoginError(false) // Hide forgot password button after success
      }
    } catch (error: any) {
      toast({
        title: "Failed to Send Reset Email",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoadingForgotPassword(false)
    }
  }

  const handleDownloadApp = () => {
    toast({
      title: "Download App",
      description: "App download will be available soon!",
    })
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-4 sm:gap-8 relative">
        {/* LEFT: Only big logo */}
        <div
          className={`swap-smooth ${isAnimating ? (isSignUpMode ? "slide-out-left" : "slide-in-left") : ""} ${isSignUpMode ? "lg:order-2" : "lg:order-1"}`}
        >
          <Card className="w-full h-full bg-transparent border-0 shadow-none flex items-center justify-center">
            <CardContent className="flex flex-col items-center justify-center h-full p-0">
              <div className="p-4 sm:p-6 lg:p-8 bg-white rounded-2xl border border-white shadow-lg flex items-center justify-center">
                <img
                  src="/images/Logo.png"
                  alt="UniClub Logo"
                  className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] lg:w-[260px] lg:h-[260px] object-contain"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadApp}
                className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 border-0 text-xs sm:text-sm h-9 px-4 shadow-md"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Download App
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Form panel — animation + có thể giữ nền hoặc làm trong suốt nếu muốn */}
        <div
          className={`swap-smooth ${isAnimating ? (isSignUpMode ? "slide-out-right" : "slide-in-right") : ""} ${isSignUpMode ? "lg:order-1" : "lg:order-2"}`}
        >
          {/* Nếu muốn cũng trong suốt: đổi bg-card/95 ... thành bg-transparent backdrop-blur-0 shadow-none */}
          <Card className="w-full shadow-xl border-0 bg-card/95 backdrop-blur-sm relative">
            {/* Nút đổi theme ở góc trái trên */}
            <div className="absolute left-3 top-3 z-10">
              {/* @ts-ignore-next-line */}
              {require("@/components/theme-toggle").ThemeToggle()}
            </div>
            <CardHeader className="text-center space-y-2 pb-4 sm:pb-6 px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
                {isSignUpMode ? "Create Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {isSignUpMode ? "Join UniClub and start your journey" : "Sign in to your UniClub account"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">

                {nextParamForDisplay && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Returning to: {(() => {
                      try {
                        return decodeURIComponent(nextParamForDisplay)
                      } catch (e) {
                        return nextParamForDisplay
                      }
                    })()}
                  </div>
                )}

                {isSignUpMode && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}

                {isSignUpMode && (
                  <div className="space-y-2">
                    <Label htmlFor="studentCode" className="text-sm font-medium">
                      Student ID
                    </Label>
                    <Input
                      id="studentCode"
                      type="text"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                      placeholder="Enter your student ID (e.g. SE123456)"
                      className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      maxLength={8}
                    />
                  </div>
                )}

                {isSignUpMode && (
                  <div className="space-y-2">
                    <Label htmlFor="majorName" className="text-sm font-medium">
                      Major Name
                    </Label>
                    <select
                      id="majorName"
                      aria-label="Select your major"
                      value={majorName}
                      onChange={e => setMajorName(e.target.value)}
                      className="h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    >
                      <option value="" disabled>Select your major</option>
                      <option value="Software Engineering">Software Engineering - Kỹ thuật phần mềm</option>
                      <option value="Artificial Intelligence">Artificial Intelligence - Trí tuệ nhân tạo</option>
                      <option value="Information Assurance">Information Assurance - Đảm bảo thông tin</option>
                      <option value="Data Science">Data Science - Khoa học dữ liệu</option>
                      <option value="Business Administration">Business Administration - Quản lý doanh nghiệp</option>
                      <option value="Digital Marketing">Digital Marketing - Tiếp thị số</option>
                      <option value="Graphic Design">Graphic Design - Thiết kế đồ hoạ</option>
                      <option value="Multimedia Communication">Multimedia Communication - Truyền thông đa phương tiện</option>
                      <option value="Hospitality Management">Hospitality Management - Quản trị khách sạn</option>
                      <option value="International Business">International Business - Kinh doanh quốc tế</option>
                      <option value="Finance and Banking">Finance and Banking - Tài chính và ngân hàng</option>
                      <option value="Japanese Language">Japanese Language - Ngôn ngữ Nhật</option>
                      <option value="Korean Language">Korean Language - Ngôn ngữ Hàn</option>
                    </select>
                  </div>
                )}

                {isSignUpMode && (
                  <div className="space-y-2">
                    <Label htmlFor="roleName" className="text-sm font-medium">
                      Role
                    </Label>
                    <Input
                      id="roleName"
                      type="text"
                      value="STUDENT"
                      readOnly
                      className="h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                )}

                {isSignUpMode && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter yours email"
                    className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-10 sm:h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isSignUpMode && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="h-10 sm:h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-primary"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 font-medium transition-all duration-200 hover:shadow-lg"
                >
                  {isSignUpMode ? (
                    <>
                      Sign Up
                      <UserPlus className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Forgot Password Button - Only show after login error in sign-in mode */}
                {!isSignUpMode && showLoginError && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleForgotPassword}
                    disabled={isLoadingForgotPassword}
                    className="w-full h-9 text-sm transition-all duration-200 border-primary/20 hover:bg-primary/5"
                  >
                    {isLoadingForgotPassword ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                        Sending...
                      </>
                    ) : (
                      "Forgot Password?"
                    )}
                  </Button>
                )}
              </form>

              {/* Google Sign-In Button */}
              <GoogleSignInButton
                mode={isSignUpMode ? "sign-up" : "sign-in"}
              />

              <div className="text-center pt-3 sm:pt-4 border-t border-border/50">
                <button
                  onClick={toggleMode}
                  className="text-sm text-primary hover:text-accent transition-colors duration-200 underline underline-offset-4 hover:underline-offset-2"
                >
                  {isSignUpMode ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}