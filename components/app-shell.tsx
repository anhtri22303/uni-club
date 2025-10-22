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
