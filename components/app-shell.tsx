"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Sidebar } from "@/components/sidebar"
import { UserProfileWidget } from "@/components/user-profile-widget"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { Menu, PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

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
  const { auth } = useAuth()
  const pathname = usePathname()

  // Mobile: drawer open
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Desktop: collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Persist desktop collapsed state
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed")
    if (saved) setSidebarCollapsed(saved === "true")
  }, [])
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed))
  }, [sidebarCollapsed])

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
          <div className="hidden md:block fixed top-4 left-4 z-50">
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
              "hidden md:flex md:flex-col md:relative transition-[width] duration-300 ease-out",
              sidebarCollapsed ? "md:w-0" : "md:w-64"
            )}
          >
            {/* Dùng wrapper để trượt nội dung sidebar, không unmount */}
            <div
              className={cn(
                "absolute md:static inset-y-0 left-0 overflow-hidden transition-transform duration-300 ease-out",
                sidebarCollapsed ? "-translate-x-full" : "translate-x-0",
                "w-64"
              )}
            >
              <Sidebar onNavigate={() => { /* không đóng desktop khi navigate */ }} />
            </div>
          </div>

          {/* ===================== MAIN CONTENT ===================== */}
          <main className="flex-1 overflow-hidden relative">
            {/* Padding top để tránh nút nổi chồng lên nội dung trên mobile */}
            <div className="h-full p-3 sm:p-4 md:p-6 pt-16 md:pt-6">{children}</div>
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
      </div>
    </SidebarContext.Provider>
  )
}
