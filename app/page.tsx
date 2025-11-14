"use client"

import { signUp, forgotPassword } from "@/service/authApi"
import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, UserPlus, Smartphone, Eye, EyeOff } from "lucide-react"
import { GoogleSignInButton } from "@/components/GoogleSignInButton"
import Image from "next/image"
import { fetchMajors, Major } from "@/service/majorApi"
import { useQuery } from "@tanstack/react-query"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [fullName, setFullName] = useState("")
  const [fullNameError, setFullNameError] = useState("")
  const [studentCode, setStudentCode] = useState("")
  const [studentCodeError, setStudentCodeError] = useState("")
  const [majorName, setMajorName] = useState("")
  const [majorNameError, setMajorNameError] = useState("")
  const roleName = "STUDENT"
  const [confirmPassword, setConfirmPassword] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showLoginError, setShowLoginError] = useState(false)
  const [isLoadingForgotPassword, setIsLoadingForgotPassword] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [btnPosition, setBtnPosition] = useState("")
  const positions = ["shift-left", "shift-right", "shift-top", "shift-bottom"]

  // 3D and animation states
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [logoHover, setLogoHover] = useState(false)
  const [floatingIcons, setFloatingIcons] = useState<Array<{ id: number; icon: string; x: number; y: number; rotation: number; scale: number; delay: number }>>([])
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  // ---  Query để lấy danh sách Majors ---
  const { data: majorsData, isLoading: majorsLoading } = useQuery<Major[], Error>({
    queryKey: ["majors"], // Key cho query
    queryFn: fetchMajors, // Hàm fetch
    // Sắp xếp danh sách theo tên để hiển thị trong dropdown
    select: (data) => data.sort((a, b) => a.name.localeCompare(b.name)),
    staleTime: 1000 * 60 * 5, // Cache danh sách này trong 5 phút
  })

  // Initialize floating university-themed icons
  useEffect(() => {
    const universityIcons = ['📚', '🎓', '✏️', '📖', '🎒', '🏫', '🔬', '🎨', '🎭', '⚽', '🎵', '💡', '🌟', '🏆', '📝']
    const newIcons = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      icon: universityIcons[Math.floor(Math.random() * universityIcons.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      scale: 0.6 + Math.random() * 0.6,
      delay: Math.random() * 8,
    }))
    setFloatingIcons(newIcons)

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      })
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  function shiftButton() {
    const currentIndex = positions.indexOf(btnPosition)
    const nextPosition = positions[(currentIndex + 1) % positions.length]
    setBtnPosition(nextPosition)
  }
  function validateEmail(val: string) {
    if (!val.trim()) {
      setEmailError("Please enter your email."); shiftButton(); return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(val.trim().toLowerCase())) {
      setEmailError("Please enter a valid email address."); shiftButton(); return false;
    }
    setEmailError(""); return true;
  }
  function validatePassword(val: string) {
    if (!val.trim()) {
      setPasswordError("Please enter your password."); shiftButton(); return false;
    }
    setPasswordError(""); return true;
  }
  function validateFullName(val: string) {
    if (!val.trim()) {
      setFullNameError("Please enter your full name."); shiftButton(); return false;
    }
    setFullNameError(""); return true;
  }
  function validateStudentCode(val: string) {
    if (!val.trim()) {
      setStudentCodeError("Please enter your student ID."); shiftButton(); return false;
    }
    if (!/^[A-Z]{2}\d{6}$/.test(val)) {
      setStudentCodeError("Student ID must start with 2 letters followed by 6 digits (e.g. SE123456).")
      shiftButton(); return false;
    }
    setStudentCodeError(""); return true;
  }
  function validateMajorName(val: string) {
    if (!val.trim()) {
      setMajorNameError("Please enter your major name."); shiftButton(); return false;
    }
    setMajorNameError(""); return true;
  }
  function validatePhone(val: string) {
    if (!val.trim()) {
      setPhoneError("Please enter your phone number."); shiftButton(); return false;
    }
    if (!/^\d{10}$/.test(val)) {
      setPhoneError("Phone number must be exactly 10 digits."); shiftButton(); return false;
    }
    setPhoneError(""); return true;
  }
  function validateConfirmPassword(val: string) {
    if (!val.trim()) {
      setConfirmPasswordError("Please confirm your password."); shiftButton(); return false;
    }
    if (val !== password) {
      setConfirmPasswordError("Passwords do not match."); shiftButton(); return false;
    }
    setConfirmPasswordError(""); return true;
  }

  // nextParam is only used for display purposes on the UI
  const nextParamForDisplay = searchParams.get('next')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedEmail = email.trim().toLowerCase();

    if (isSignUpMode) {
      // Validate each field
      if (!fullName) {
        toast({ title: "Missing Full Name", description: "Please enter your full name.", variant: "destructive" });
        return;
      }
      // Student ID: 2 uppercase letters followed by 6 digits
      if (!studentCode) {
        toast({ title: "Missing Student ID", description: "Please enter your student ID.", variant: "destructive" });
        return;
      }
      if (!/^[A-Z]{2}\d{6}$/.test(studentCode)) {
        toast({ title: "Invalid Student ID", description: "Student ID must start with 2 letters followed by 6 digits (e.g. SE123456).", variant: "destructive" });
        return;
      }
      // Major
      if (!majorName) {
        toast({ title: "Missing Major", description: "Please enter your major name.", variant: "destructive" });
        return;
      }
      if (!normalizedEmail) {
        toast({ title: "Missing Email", description: "Please enter your email.", variant: "destructive" });
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
        return;
      }
      // Phone number: only digits, exactly 10 digits
      if (!phone) {
        toast({ title: "Missing Phone", description: "Please enter your phone number.", variant: "destructive" });
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        toast({ title: "Invalid Phone Number", description: "Phone number must be exactly 10 digits.", variant: "destructive" });
        return;
      }
      // Password and confirm password
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

    const nextRaw = searchParams.get('next')
    const next = nextRaw ? decodeURIComponent(nextRaw) : undefined
    // const success = await login(email, password, next)
    const success = await login(normalizedEmail, password, next)

    if (success) {
      setShowLoginError(false) // Reset error state on success

      // Check if CLUB_LEADER logged in with default password "123"
      const userRole = sessionStorage.getItem("userRole")
      if (userRole === "CLUB_LEADER" && password === "123") {
        // Get userId from auth data
        const authData = sessionStorage.getItem("uniclub-auth")
        let userId = null
        if (authData) {
          try {
            const auth = JSON.parse(authData)
            userId = auth.userId
          } catch (e) {
            console.error("Failed to parse auth data:", e)
          }
        }

        sessionStorage.setItem("requirePasswordReset", "true")
        sessionStorage.setItem("resetEmail", normalizedEmail)
        if (userId) {
          sessionStorage.setItem("resetUserId", String(userId))
        }
      }

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
      const normalizedEmail = email.trim().toLowerCase()
      // const response = await forgotPassword(email)
      const response = await forgotPassword(normalizedEmail);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 flex items-center justify-center p-3 sm:p-4 overflow-hidden relative">
      {/* Floating university-themed icons background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingIcons.map((item) => (
          <div
            key={item.id}
            className="absolute text-4xl sm:text-5xl md:text-6xl animate-float-uni opacity-20 dark:opacity-10"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `perspective(1000px) rotateX(${item.rotation}deg) rotateY(${item.rotation}deg) scale(${item.scale})`,
              animationDelay: `${item.delay}s`,
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))',
            }}
          >
            {item.icon}
          </div>
        ))}
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse-uni"></div>
      <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-emerald-400/15 to-cyan-500/15 rounded-full blur-3xl animate-pulse-uni-slow"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl animate-rotate-uni"></div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-4 sm:gap-8 relative z-10">
        {/* LEFT: 3D Animated Logo Panel */}
        <div
          className={`swap-smooth ${isAnimating ? (isSignUpMode ? "slide-out-left" : "slide-in-left") : ""} ${isSignUpMode ? "lg:order-2" : "lg:order-1"}`}
        >
          <Card className="w-full h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-blue-200/50 dark:border-blue-500/30 shadow-2xl flex items-center justify-center overflow-hidden relative">
            {/* Decorative corner elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-br-full"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-cyan-500/20 to-transparent rounded-tl-full"></div>

            <CardContent className="flex flex-col items-center justify-center h-full p-6 sm:p-8 lg:p-12 relative z-10">
              {/* 3D Interactive Logo */}
              <div
                className="relative group cursor-pointer"
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
                style={{
                  transform: `perspective(1500px) rotateX(${mousePosition.y * 10}deg) rotateY(${mousePosition.x * 10}deg) scale(${logoHover ? 1.1 : 1})`,
                  transition: "transform 0.3s ease-out",
                }}
              >
                {/* Glow effect behind logo */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 scale-110"></div>

                <div className="relative p-6 sm:p-8 lg:p-10 bg-white dark:bg-slate-800 rounded-3xl border-4 border-white dark:border-slate-700 shadow-2xl">
                  <Image
                    src="/images/Logo.png"
                    alt="UniClub Logo"
                    width={260}
                    height={260}
                    className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] lg:w-[260px] lg:h-[260px] object-contain animate-logo-float"
                    priority
                  />

                  {/* Animated rings around logo */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-blue-500/30 animate-ping-slow"></div>
                  <div className="absolute inset-0 rounded-3xl border-2 border-cyan-500/30 animate-ping-slower"></div>
                </div>

                {/* Floating university elements around logo */}
                <div className="absolute -top-6 -right-6 text-4xl animate-bounce-gentle">🎓</div>
                <div className="absolute -bottom-6 -left-6 text-4xl animate-bounce-gentle" style={{ animationDelay: "0.5s" }}>📚</div>
                <div className="absolute -top-6 -left-6 text-3xl animate-spin-gentle">✨</div>
                <div className="absolute -bottom-6 -right-6 text-3xl animate-spin-gentle" style={{ animationDelay: "1s" }}>🌟</div>
              </div>

              {/* University tagline */}
              <div className="mt-8 text-center space-y-2 animate-fade-in-up">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                  UniClub
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
                  Where Students Connect & Thrive 🚀
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadApp}
                className="mt-8 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:from-blue-700 hover:via-cyan-600 hover:to-emerald-600 text-white border-0 text-xs sm:text-sm h-10 px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-bold"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Download Mobile App
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Enhanced Form Panel with 3D Effects */}
        <div
          className={`swap-smooth ${isAnimating ? (isSignUpMode ? "slide-out-right" : "slide-in-right") : ""} ${isSignUpMode ? "lg:order-1" : "lg:order-2"}`}
        >
          <Card className="w-full shadow-2xl border-2 border-blue-200/50 dark:border-blue-500/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl relative overflow-hidden">
            {/* Animated gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-emerald-500/10 pointer-events-none"></div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-tr-full"></div>

            {/* Theme toggle button */}
            <div className="absolute left-3 top-3 z-10">
              {/* @ts-ignore-next-line */}
              {require("@/components/theme-toggle").ThemeToggle()}
            </div>

            <CardHeader className="text-center space-y-3 pb-4 sm:pb-6 px-4 sm:px-6 relative z-10">
              {/* Animated header icon */}
              <div className="flex justify-center mb-2">
                <div className="text-5xl sm:text-6xl animate-bounce-gentle">
                  {isSignUpMode ? "🎓" : "👋"}
                </div>
              </div>

              <CardTitle className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent animate-fade-in-up">
                {isSignUpMode ? "Join UniClub!" : "Welcome Back!"}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                {isSignUpMode ? "Start your amazing university journey 🚀" : "Continue your university adventure ✨"}
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
                      onBlur={(e) => validateFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                    {fullNameError && <div className="text-xs text-red-500 mt-1">{fullNameError}</div>}
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
                      onBlur={(e) => validateStudentCode(e.target.value)}
                      placeholder="Enter your student ID (e.g. SE123456)"
                      className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      maxLength={8}
                    />
                    {studentCodeError && <div className="text-xs text-red-500 mt-1">{studentCodeError}</div>}
                  </div>
                )}

                {isSignUpMode && (
                  <div className="space-y-2">
                    <Label htmlFor="majorName" className="text-sm font-medium">
                      Major Name
                    </Label>
                    {/* <select
                      id="majorName"
                      aria-label="Select your major"
                      value={majorName}
                      onChange={e => setMajorName(e.target.value)}
                      onBlur={e => validateMajorName(e.target.value)}
                      className="h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    >
                      <option value="" disabled>Select your major</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Information Assurance">Information Assurance</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Business Administration">Business Administration</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Graphic Design">Graphic Design</option>
                      <option value="Multimedia Communication">Multimedia Communication</option>
                      <option value="Hospitality Management">Hospitality Management</option>
                      <option value="International Business">International Business</option>
                      <option value="Finance and Banking">Finance and Banking</option>
                      <option value="Japanese Language">Japanese Language</option>
                      <option value="Korean Language">Korean Language</option>
                    </select> */}
                    <select
                      id="majorName"
                      aria-label="Select your major"
                      value={majorName}
                      onChange={e => setMajorName(e.target.value)}
                      onBlur={e => validateMajorName(e.target.value)}
                      className="h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                      disabled={majorsLoading} // Vô hiệu hóa khi đang tải
                    >
                      <option value="" disabled>
                        {majorsLoading ? "Loading majors..." : "Select your major"}
                      </option>
                      {/* Tự động tạo danh sách từ API */}
                      {(majorsData || []).map((major) => (
                        <option key={major.id} value={major.name}>
                          {major.name}
                        </option>
                      ))}
                    </select>
                    {majorNameError && <div className="text-xs text-red-500 mt-1">{majorNameError}</div>}
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
                      onBlur={(e) => validatePhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                    {phoneError && <div className="text-xs text-red-500 mt-1">{phoneError}</div>}
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
                    onBlur={(e) => validateEmail(e.target.value)}
                    placeholder="Enter yours email"
                    className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  {emailError && <div className="text-xs text-red-500 mt-1">{emailError}</div>}
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
                      onBlur={(e) => validatePassword(e.target.value)}
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
                  {passwordError && <div className="text-xs text-red-500 mt-1">{passwordError}</div>}
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
                        onBlur={(e) => validateConfirmPassword(e.target.value)}
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
                    {confirmPasswordError && <div className="text-xs text-red-500 mt-1">{confirmPasswordError}</div>}
                  </div>
                )}

                <Button
                  type="submit"
                  className={`w-full h-11 sm:h-12 font-bold text-base transition-all duration-300 hover:shadow-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:from-blue-700 hover:via-cyan-600 hover:to-emerald-600 text-white border-0 hover:scale-105 relative overflow-hidden group ${btnPosition}`}
                  id="login-btn"
                  disabled={!!emailError || !!passwordError || (isSignUpMode && (!!fullNameError || !!studentCodeError || !!majorNameError || !!phoneError || !!confirmPasswordError))}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                  <span className="relative flex items-center justify-center">
                    {isSignUpMode ? (
                      <>
                        Create Account
                        <UserPlus className="ml-2 h-5 w-5" />
                      </>
                    ) : (
                      <>
                        Sign In Now
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
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

              {/* Toggle mode section with gradient border */}
              <div className="relative text-center pt-4 sm:pt-6 mt-4 sm:mt-6">
                {/* Gradient border line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

                <button
                  onClick={toggleMode}
                  className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 dark:from-blue-950/50 dark:via-cyan-950/50 dark:to-emerald-950/50 hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-500/50"
                >
                  <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                    {isSignUpMode ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                  </span>
                  <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">✨</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes float-uni {
          0%, 100% { 
            transform: perspective(1000px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg);
          }
          25% { 
            transform: perspective(1000px) translateY(-40px) translateZ(60px) rotateX(20deg) rotateY(20deg);
          }
          50% { 
            transform: perspective(1000px) translateY(-60px) translateZ(120px) rotateX(0deg) rotateY(40deg);
          }
          75% { 
            transform: perspective(1000px) translateY(-40px) translateZ(60px) rotateX(-20deg) rotateY(20deg);
          }
        }

        @keyframes pulse-uni {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }

        @keyframes pulse-uni-slow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.15); }
        }

        @keyframes rotate-uni {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes logo-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes spin-gentle {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        @keyframes ping-slower {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float-uni {
          animation: float-uni 10s ease-in-out infinite;
        }

        .animate-pulse-uni {
          animation: pulse-uni 4s ease-in-out infinite;
        }

        .animate-pulse-uni-slow {
          animation: pulse-uni-slow 6s ease-in-out infinite;
        }

        .animate-rotate-uni {
          animation: rotate-uni 40s linear infinite;
        }

        .animate-logo-float {
          animation: logo-float 3s ease-in-out infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }

        .animate-spin-gentle {
          animation: spin-gentle 8s linear infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-ping-slower {
          animation: ping-slower 4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        /* Smooth transitions for mode switching */
        .swap-smooth {
          transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .slide-out-left {
          opacity: 0;
          transform: translateX(-100px) scale(0.9);
        }

        .slide-in-left {
          opacity: 0;
          transform: translateX(100px) scale(0.9);
        }

        .slide-out-right {
          opacity: 0;
          transform: translateX(100px) scale(0.9);
        }

        .slide-in-right {
          opacity: 0;
          transform: translateX(-100px) scale(0.9);
        }
      `}</style>
    </div>
  )
}