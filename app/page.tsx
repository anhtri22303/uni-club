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

import users from "@/src/data/users.json"
import roles from "@/src/data/roles.json"

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
  const [role, setRole] = useState("")
  const [selectedDemoUser, setSelectedDemoUser] = useState("")
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [fullName, setFullName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isSignUpMode) {
      if (!fullName || !email || !password || !confirmPassword || !role) {
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

    if (!email || !password || !role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const success = login(email, password, role)
    if (!success) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials or role not allowed for this user",
        variant: "destructive",
      })
    }
  }

  const handleQuickPick = (user: (typeof users)[0]) => {
    setEmail(user.email)
    setRole(user.defaultRole)
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
      setRole("")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-4 sm:gap-8 relative">
        {/* LEFT: Logo / Info panel — làm trong suốt + animation */}
        <div
          className={`swap-smooth ${isAnimating ? (isSignUpMode ? "slide-out-left" : "slide-in-left") : ""} ${isSignUpMode ? "lg:order-2" : "lg:order-1"}`}
        >
          <Card className="w-full h-full bg-transparent border-0 shadow-none">
            <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center h-full text-center space-y-4 sm:space-y-6">
              <div className="inline-flex flex-col items-center bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-lg border border-white/20">
                <div className="relative w-12 h-10 sm:w-14 sm:h-11 lg:w-16 lg:h-12 bg-gradient-to-br from-primary to-accent rounded-lg shadow-lg flex items-center justify-center mb-3 sm:mb-4 transform rotate-3">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-primary-foreground" />
                  <Star className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-300 absolute -top-1 -right-1" />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">UniClub</h1>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadApp}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Download App
                  </Button>
                </div>
                <p className="text-base sm:text-lg text-muted-foreground font-medium hidden sm:block">
                  Club life, made easy.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 w-full max-w-sm hidden sm:block">
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-primary/10">
                  <h3 className="font-semibold text-card-foreground mb-2 text-sm sm:text-base">Join the Community</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Connect with clubs, earn points, and unlock exclusive offers across your university.
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                  <span>Trusted by 50,000+ students</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Form panel — animation + có thể giữ nền hoặc làm trong suốt nếu muốn */}
        <div
          className={`swap-smooth ${isAnimating ? (isSignUpMode ? "slide-out-right" : "slide-in-right") : ""} ${isSignUpMode ? "lg:order-1" : "lg:order-2"}`}
        >
          {/* Nếu muốn cũng trong suốt: đổi bg-card/95 ... thành bg-transparent backdrop-blur-0 shadow-none */}
          <Card className="w-full shadow-xl border-0 bg-card/95 backdrop-blur-sm">
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

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">
                    Role
                  </Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-10 sm:h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                ({roles.find((r) => r.id === user.defaultRole)?.name})
                              </span>
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
