"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { User, LogOut, Award, Trophy, Gem, Star } from "lucide-react"
import { useSidebarContext } from "@/components/app-shell"
import { getWallet } from "@/service/walletApi"

function getTierInfo(points: number, role: string) {
  if (role === "member") {
    if (points >= 2000)
      return { tier: "Gold", color: "from-yellow-400 to-yellow-600", textColor: "text-yellow-900", icon: Trophy }
    if (points >= 1000)
      return { tier: "Silver", color: "from-gray-300 to-gray-500", textColor: "text-gray-900", icon: Award }
    return { tier: "Bronze", color: "from-amber-600 to-amber-800", textColor: "text-amber-100", icon: Star }
  } else if (role === "club_leader") {
    if (points >= 3000)
      return { tier: "Platinum", color: "from-purple-400 to-purple-600", textColor: "text-purple-100", icon: Gem }
    if (points >= 2000)
      return { tier: "Gold", color: "from-yellow-400 to-yellow-600", textColor: "text-yellow-900", icon: Trophy }
    if (points >= 1000)
      return { tier: "Silver", color: "from-gray-300 to-gray-500", textColor: "text-gray-900", icon: Award }
    return { tier: "Bronze", color: "from-amber-600 to-amber-800", textColor: "text-amber-100", icon: Star }
  }
  return { tier: "Member", color: "from-blue-400 to-blue-600", textColor: "text-blue-100", icon: Star }
}

export function UserProfileWidget() {
  const { auth, logout } = useAuth()
  const router = useRouter()
  const { sidebarCollapsed, sidebarOpen } = useSidebarContext()
  const [userPoints, setUserPoints] = useState<number>(0)

  if (!auth.role || !auth.user) return null

  // Load wallet points from API
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data: any = await getWallet()
        console.debug("UserProfileWidget.getWallet ->", data)
        if (!mounted) return
        const pts = Number(data?.points ?? data?.balance ?? 0)
        setUserPoints(pts)
        console.debug("UserProfileWidget setUserPoints ->", pts)
      } catch (err) {
        console.error("Failed to load wallet in UserProfileWidget", err)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [auth?.userId])

  const userInitials = auth.user.fullName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()

  const handleProfile = () => {
    router.push("/profile")
  }

  // Ẩn khi sidebar đang collapsed (desktop) hoặc đang mở Sheet (mobile)
  const isHidden = sidebarCollapsed || sidebarOpen

  const shouldShowPoints = auth.role === "member" || auth.role === "club_leader"
  const tierInfo = getTierInfo(userPoints, auth.role)
  const TierIcon = tierInfo.icon

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 bg-background border border-border rounded-lg shadow-lg transition-all duration-300
      ${isHidden ? "opacity-0 -translate-x-full pointer-events-none" : "opacity-100 translate-x-0"}
      p-4 space-y-3 min-w-[240px] block`}
    >
      {shouldShowPoints && (
        <div className={`bg-gradient-to-r ${tierInfo.color} rounded-lg p-3 shadow-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TierIcon className={`h-4 w-4 ${tierInfo.textColor}`} />
              <span className={`text-sm font-semibold ${tierInfo.textColor}`}>{tierInfo.tier}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className={`h-3 w-3 ${tierInfo.textColor}`} />
              <span className={`text-sm font-bold ${tierInfo.textColor}`}>{userPoints.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{auth.user.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{auth.user.email}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-2 bg-transparent" onClick={handleProfile}>
          <User className="h-3 w-3" />
          Profile
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2 text-destructive hover:text-destructive bg-transparent"
          onClick={logout}
        >
          <LogOut className="h-3 w-3" />
          Logout
        </Button>
      </div>
    </div>
  )
}
