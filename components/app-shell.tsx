"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Sidebar } from "@/components/sidebar"
import { UserProfileWidget } from "@/components/user-profile-widget"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { Menu, PanelLeftOpen, PanelLeftClose, AlertTriangle, X, Eye, EyeOff } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { forceResetPassword } from "@/service/userApi"
import { ChangePasswordModal } from "@/components/change-password"
import { useDataLoader } from "@/hooks/use-data-loader"

interface AppShellProps {
  children: React.ReactNode
}

interface SidebarContextType {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export const useSidebarContext = () => {
  const context = useContext(SidebarContext)
  if (!context) throw new Error("useSidebarContext must be used within SidebarProvider")
  return context
}

export function AppShell({ children }: AppShellProps) {
  const { auth, logout } = useAuth()
  const pathname = usePathname()
  const { toast } = useToast()

  // Load data into DataContext after login
  useDataLoader()

  // Mobile: drawer open
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Desktop: collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Password reset banner and modal states
  const [showPasswordResetBanner, setShowPasswordResetBanner] = useState(false)
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoadingPasswordReset, setIsLoadingPasswordReset] = useState(false)

  // Persist desktop collapsed state
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed")
    if (saved) setSidebarCollapsed(saved === "true")
  }, [])
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed))
  }, [sidebarCollapsed])

  // Check if password reset is required
  useEffect(() => {
    const requireReset = sessionStorage.getItem("requirePasswordReset")
    const email = sessionStorage.getItem("resetEmail")
    const userId = sessionStorage.getItem("resetUserId")
    
    if (requireReset === "true" && email && userId) {
      setResetEmail(email)
      setResetUserId(userId)
      setShowPasswordResetBanner(true)
      // Don't clear the flags here - keep them until user dismisses or resets password
    }
  }, [])

  // Handle password reset
  const handlePasswordReset = async () => {
    // Validate inputs
    if (!resetUserId) {
      toast({
        title: "Error",
        description: "User ID is missing",
        variant: "destructive",
      })
      return
    }

    if (!newPassword) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      })
      return
    }

    // if (newPassword.length < 6) {
    //   toast({
    //     title: "Error",
    //     description: "Password must be at least 6 characters long",
    //     variant: "destructive",
    //   })
    //   return
    // }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setIsLoadingPasswordReset(true)

    try {
      const response = await forceResetPassword(resetUserId, newPassword)
      
      toast({
        title: "Password Reset Successful",
        description: response.message || "Your password has been successfully reset. Please login with your new password.",
      })

      // Clear session storage flags and close modal
      sessionStorage.removeItem("requirePasswordReset")
      sessionStorage.removeItem("resetEmail")
      sessionStorage.removeItem("resetUserId")
      setShowPasswordResetModal(false)
      setShowPasswordResetBanner(false)
      setNewPassword("")
      setConfirmPassword("")
      
      // Wait a moment for the toast to show, then logout
      setTimeout(() => {
        logout()
      }, 1500)
    } catch (error: any) {
      toast({
        title: "Failed to Reset Password",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPasswordReset(false)
    }
  }

  const handleBannerClick = () => {
    // Check if user is CLUB_LEADER to show change password modal
    const userRole = auth.role
    if (userRole === "CLUB_LEADER" || userRole === "club_leader") {
      setShowChangePasswordModal(true)
    } else {
      // For other roles (admin-forced reset), use the force reset modal
      setShowPasswordResetModal(true)
    }
  }

  const handleCloseBanner = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowPasswordResetBanner(false)
    // Clear session storage when user dismisses the banner
    sessionStorage.removeItem("requirePasswordReset")
    sessionStorage.removeItem("resetEmail")
    sessionStorage.removeItem("resetUserId")
  }

  const handleChangePasswordClose = (open: boolean) => {
    setShowChangePasswordModal(open)
    if (!open) {
      // When change password modal closes, also hide the banner
      setShowPasswordResetBanner(false)
    }
  }

  if (!auth.user) return null

  return (
    <SidebarContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      <div className="min-h-screen bg-background">
        <div className="flex">

          {/* ===================== MOBILE TOGGLE (luôn hiển thị) ===================== */}
          <div className="md:hidden fixed top-4 left-4 z-50">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-background shadow-lg"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* ===================== DESKTOP TOGGLE (luôn hiển thị) ===================== */}
          <div
            className={cn(
              "hidden md:block fixed top-11 left-10 z-50 transition-all duration-300 ease-out",
            )}
          >
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-background shadow-lg"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
          </div>

          {/* ===================== DESKTOP SIDEBAR ===================== */}
          <div
            className={cn(
              "hidden md:flex md:flex-col md:fixed md:top-4 md:left-4 z-40 bg-background",
              "md:h-auto", // THAY ĐỔI 2: Chiều cao tự động co giãn theo nội dung
              "rounded-2xl border shadow-lg overflow-hidden",
              "transition-[width] duration-300 ease-out",
              sidebarCollapsed ? "md:w-0 border-none" : "md:w-64"
            )}
          >
            <div
              className={cn(
                "transition-transform duration-300 ease-out",
                sidebarCollapsed ? "-translate-x-full" : "translate-x-0",
                "w-64"
              )}
            >
              {/* THAY ĐỔI 3: Bỏ wrapper và padding-top để logo lên sát cạnh trên */}
              <Sidebar onNavigate={() => {}} />
            </div>
          </div>

          {/* ===================== MAIN CONTENT ===================== */}
          <main
            className={cn(
              "flex-1 overflow-hidden transition-[padding-left] duration-300 ease-out",
              sidebarCollapsed ? "md:pl-20" : "md:pl-72" // Padding được giữ nguyên để có khoảng trống hợp lý
            )}
          >
            {/* Giữ pt-16 cho mobile để nội dung không bị nút toggle che, bỏ pt cho desktop */}
            <div className="h-full p-3 sm:p-4 md:p-6 pt-16 md:pt-6">
              {/* Password Reset Banner - Shows on all pages */}
              {showPasswordResetBanner && (
                <Alert
                  className="mb-6 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors relative"
                  onClick={handleBannerClick}
                >
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                  <div className="flex-1">
                    <AlertTitle className="text-yellow-800 dark:text-yellow-300 font-bold">
                      Security Warning: Default Password Detected
                    </AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                      You are using a default password. Click here to reset your password for better security.
                    </AlertDescription>
                  </div>
                  <button
                    onClick={handleCloseBanner}
                    className="absolute top-3 right-3 text-yellow-600 dark:text-yellow-500 hover:text-yellow-800 dark:hover:text-yellow-300 transition-colors"
                    aria-label="Dismiss banner"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Alert>
              )}

              {children}
            </div>
          </main>
        </div>


        {/* ===================== MOBILE DRAWER ===================== */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="p-0 w-72"
          // Khi click bên trong sidebar để điều hướng -> đóng sheet
          >
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Widgets luôn nằm cuối để không che nút toggle */}
        <UserProfileWidget />
        <ChatbotWidget />

        {/* Password Reset Modal */}
        <Dialog open={showPasswordResetModal} onOpenChange={setShowPasswordResetModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Password Reset Required</DialogTitle>
                  <DialogDescription className="mt-1">
                    You are using a default password. Please reset your password for security.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  className="w-full"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Your account email address
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordResetModal(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePasswordReset}
                disabled={isLoadingPasswordReset || !newPassword || !confirmPassword}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isLoadingPasswordReset ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Modal (for CLUB_LEADER) */}
        <ChangePasswordModal 
          open={showChangePasswordModal} 
          onOpenChange={handleChangePasswordClose}
        />
      </div>
    </SidebarContext.Provider>
  )
}
