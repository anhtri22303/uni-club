"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { resetPassword } from "@/service/authApi"
import { Eye, EyeOff, Lock, Mail, Key, CheckCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")

  useEffect(() => {
    // Get email and token from URL params
    const emailParam = searchParams.get("email")
    const tokenParam = searchParams.get("token")

    if (emailParam) setEmail(emailParam)
    if (tokenParam) setToken(tokenParam)

    // Validate params
    if (!emailParam || !tokenParam) {
      toast({
        title: "Invalid Link",
        description: "The password reset link is invalid or expired.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  const validatePassword = (pwd: string) => {
    if (!pwd) {
      setPasswordError("Please enter your new password.")
      return false
    }
    if (pwd.length < 6) {
      setPasswordError("Password must be at least 6 characters long.")
      return false
    }
    setPasswordError("")
    return true
  }

  const validateConfirmPassword = (pwd: string) => {
    if (!pwd) {
      setConfirmPasswordError("Please confirm your password.")
      return false
    }
    if (pwd !== newPassword) {
      setConfirmPasswordError("Passwords do not match.")
      return false
    }
    setConfirmPasswordError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const isPasswordValid = validatePassword(newPassword)
    const isConfirmValid = validateConfirmPassword(confirmPassword)

    if (!isPasswordValid || !isConfirmValid) {
      return
    }

    if (!email || !token) {
      toast({
        title: "Missing Information",
        description: "Email or token is missing. Please use the link from your email.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await resetPassword(email, token, newPassword)

      if (response.success) {
        toast({
          title: "Password Reset Successful",
          description: response.message || "Your password has been successfully reset.",
        })

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (error: any) {
      console.error("Reset password error:", error)
      toast({
        title: "Reset Failed",
        description:
          error.response?.data?.message ||
          "Failed to reset password. The link may be expired or invalid.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm relative">
          {/* Theme toggle button */}
          <div className="absolute left-3 top-3 z-10">
            <ThemeToggle />
          </div>

          <CardHeader className="text-center space-y-2 pb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">Reset Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field (disabled) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="h-11 bg-muted cursor-not-allowed"
                />
              </div>

              {/* Token field (disabled) */}
              <div className="space-y-2">
                <Label htmlFor="token" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Reset Token
                </Label>
                <Input
                  id="token"
                  type="text"
                  value={token}
                  disabled
                  className="h-11 bg-muted cursor-not-allowed font-mono text-sm"
                />
              </div>

              {/* New Password field */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={(e) => validatePassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
              </div>

              {/* Confirm Password field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={(e) => validateConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="text-sm text-destructive">{confirmPasswordError}</p>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-11 font-medium transition-all duration-200 hover:shadow-lg"
                disabled={isLoading || !!passwordError || !!confirmPasswordError}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-border/50">
              <button
                onClick={() => router.push("/")}
                className="text-sm text-primary hover:text-accent transition-colors duration-200 underline underline-offset-4 hover:underline-offset-2"
              >
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
