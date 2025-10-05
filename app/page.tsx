"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  GraduationCap,
  Users,
  Shield,
  Building,
  UserCheck,
  CreditCard,
  Star,
  ArrowRight,
  UserPlus,
  Smartphone,
} from "lucide-react"
import { GoogleSignInButton } from "@/components/GoogleSignInButton"

import users from "@/src/data/users.json"

const formatRoleName = (roleId: string) => {
  const map: Record<string, string> = {
    student: "STUDENT",
    club_manager: "CLUB MANAGER",
    uni_admin: "UNIVERSITY ADMIN",
    admin: "ADMIN",
    staff: "STAFF",
  }
  return map[roleId] || roleId.replace(/_/g, " ").toUpperCase()
}

const quickPickUsers = [
  { user: users[0], icon: GraduationCap, color: "text-blue-600" },
  { user: users[1], icon: Users, color: "text-green-600" },
  { user: users[2], icon: Shield, color: "text-purple-600" },
  { user: users[3], icon: Building, color: "text-orange-600" },
  { user: users[4], icon: UserCheck, color: "text-cyan-600" },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedDemoUser, setSelectedDemoUser] = useState("")
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [fullName, setFullName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSignUpMode) {
      if (!fullName || !email || !password || !confirmPassword) {
        toast({
          title: "Missing Information",
          description: "Please fill in all fields",
          variant: "destructive",
        })
        return
      }

      if (password !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Registration Successful",
        description: "Your account has been created! You can now sign in.",
      })

      setIsSignUpMode(false)
      setFullName("")
      setConfirmPassword("")
      return
    }

    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // call login which now performs an API request and persists the response
    const success = await login(email, password)
    if (!success) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials or server error",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Login Successful",
        description: "Redirecting...",
      })
    }
  }

  const handleQuickPick = (user: (typeof users)[0]) => {
    setEmail(user.email)
    setPassword("demo123")
    setSelectedDemoUser(user.id)
  }

  const toggleMode = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsSignUpMode((v) => !v)
      setIsAnimating(false)
      // Clear form fields when switching modes
      setEmail("")
      setPassword("")
      setFullName("")
      setConfirmPassword("")
      setSelectedDemoUser("")
    }, 250) // khớp với thời lượng animation ~0.22–0.28s
  }

  const handleDownloadApp = () => {
    toast({
      title: "Download App",
      description: "App download will be available soon!",
    })
  }

  // Dummy handler for Google sign-in (replace with real logic if needed)
  const handleGoogleSignIn = () => {
    toast({
      title: "Google Sign-In",
      description: "Google sign-in will be available soon!",
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

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {isSignUpMode && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}

                {/* role selection removed - login no longer requires selecting a role */}

                {!isSignUpMode && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quick Demo Login</Label>
                    <Select
                      value={selectedDemoUser}
                      onValueChange={(userId) => {
                        const user = users.find((u) => u.id === userId)
                        if (user) handleQuickPick(user)
                      }}
                    >
                      <SelectTrigger className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Choose a demo account" />
                      </SelectTrigger>
                      <SelectContent>
                        {quickPickUsers.map(({ user, icon: Icon, color }) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center space-x-2">
                              <Icon className={`h-4 w-4 ${color}`} />
                              <span className="truncate">{user.fullName}</span>
                                (<span className="text-xs text-muted-foreground hidden sm:inline">({formatRoleName(user.defaultRole)})</span>)
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              </form>

              {/* Google Sign-In Button */}
              <GoogleSignInButton
                mode={isSignUpMode ? "sign-up" : "sign-in"}
                onClick={handleGoogleSignIn}
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
