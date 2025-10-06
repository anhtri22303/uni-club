"use client"

import { signUp } from "@/service/authApi"  
import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, UserPlus, Smartphone, Eye, EyeOff } from "lucide-react"
import { GoogleSignInButton } from "@/components/GoogleSignInButton"

// Quick demo accounts removed — production flow only

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [fullName, setFullName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

      try {
      const res = await signUp({
        email,
        password,
        fullName,
        roleName: "STUDENT", // hoặc cho user chọn role
      })

      toast({
        title: "Registration Successful",
        description: `Welcome ${res.fullName}! You can now sign in.`,
      })

      // Reset form
      setIsSignUpMode(false)
      setFullName("")
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

  // Quick demo helper removed

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

                {/* role selection removed - login no longer requires selecting a role */}

                {/* Quick demo login removed */}

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
