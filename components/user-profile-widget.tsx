"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { User, LogOut, Award, Trophy, Gem, Star, Flame, Check, ChevronDown, ChevronUp } from "lucide-react"
import { useSidebarContext } from "@/components/app-shell"
import { ApiMembershipWallet, getClubWallet, ApiClubWallet } from "@/service/walletApi"
import { getClubIdFromToken } from "@/service/clubApi"
// import { fetchProfile } from "@/service/userApi"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

import { useFullProfile } from "@/hooks/use-query-hooks"
import { LoadingSpinner } from "@/components/loading-spinner"
import { CompleteProfileModal } from "@/components/complete-profile-modal"
import { useQueryClient } from "@tanstack/react-query"

function getTierInfo(points: number, role: string) {
  // Keep a minimal tier fallback for accessory data, but primary UI is points card.
  if (role === "student") {
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

// Point levels configuration for tooltip
const pointLevels = [
  { min: 10000, label: "10,000+", gradient: "from-yellow-400 via-pink-500 to-purple-600", name: "🏆 Legendary", desc: "Rainbow flame" },
  { min: 7000, label: "7,000+", gradient: "from-rose-500 via-red-500 to-rose-600", name: "💎 Epic", desc: "Crimson flame" },
  { min: 5000, label: "5,000+", gradient: "from-orange-500 via-red-500 to-pink-500", name: "👑 Master", desc: "Hot flame" },
  { min: 3000, label: "3,000+", gradient: "from-orange-400 to-orange-600", name: "⭐ Expert", desc: "Orange flame" },
  { min: 2000, label: "2,000+", gradient: "from-yellow-400 to-orange-500", name: "🌟 Advanced", desc: "Yellow flame" },
  { min: 1500, label: "1,500+", gradient: "from-yellow-300 to-yellow-500", name: "✨ Skilled", desc: "Bright flame" },
  { min: 1000, label: "1,000+", gradient: "from-lime-400 to-yellow-500", name: "📈 Intermediate", desc: "Warming up" },
  { min: 500, label: "500+", gradient: "from-green-400 to-lime-500", name: "🌱 Beginner", desc: "Green flame" },
  { min: 200, label: "200+", gradient: "from-cyan-400 to-green-500", name: "🔰 Novice", desc: "Cool flame" },
  { min: 50, label: "50+", gradient: "from-blue-400 to-cyan-500", name: "🌿 Starter", desc: "Blue flame" },
  { min: 0, label: "0-49", gradient: "from-slate-300 to-slate-400", name: "💤 Inactive", desc: "No flame" },
]

// Fixed style for Club Wallet (blue gradient)
const clubWalletStyle = {
  cardClassName: "bg-gradient-to-r from-blue-500 to-cyan-500",
  textColorClassName: "text-white",
  subtitleColorClassName: "text-white/90",
  iconBgClassName: "bg-white/20",
  iconColorClassName: "text-white",
  animationClassName: "",
}

// Points card style helper (copied/adapted from profile page)
function getPointsCardStyle(points: number) {
  if (points >= 10000) {
    return {
      cardClassName: "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600",
      textColorClassName: "text-white",
      subtitleColorClassName: "text-white/90",
      iconBgClassName: "bg-white/30",
      iconColorClassName: "text-white",
      animationClassName: "animate-pulse-strong",
    }
  }
  if (points >= 7000) {
    return {
      cardClassName: "bg-gradient-to-r from-rose-500 via-red-500 to-rose-600",
      textColorClassName: "text-white",
      subtitleColorClassName: "text-white/85",
      iconBgClassName: "bg-white/25",
      iconColorClassName: "text-white",
      animationClassName: "animate-pulse-strong [animation-duration:2s]",
    }
  }
  if (points >= 5000) {
    return {
      cardClassName: "bg-gradient-to-r from-orange-500 via-red-500 to-pink-500",
      textColorClassName: "text-white",
      subtitleColorClassName: "text-white/80",
      iconBgClassName: "bg-white/20",
      iconColorClassName: "text-white",
      animationClassName: "animate-flicker",
    }
  }
  if (points >= 3000) {
    return {
      cardClassName: "bg-gradient-to-r from-orange-400 to-orange-600",
      textColorClassName: "text-white",
      subtitleColorClassName: "text-white/80",
      iconBgClassName: "bg-white/20",
      iconColorClassName: "text-white",
      animationClassName: "animate-flicker [animation-duration:2s]",
    }
  }
  if (points >= 2000) {
    return {
      cardClassName: "bg-gradient-to-r from-yellow-400 to-orange-500",
      textColorClassName: "text-white",
      subtitleColorClassName: "text-white/80",
      iconBgClassName: "bg-white/20",
      iconColorClassName: "text-white",
      animationClassName: "animate-flicker [animation-duration:2.5s]",
    }
  }
  if (points >= 1500) {
    return {
      cardClassName: "bg-gradient-to-r from-yellow-300 to-yellow-500",
      textColorClassName: "text-white",
      subtitleColorClassName: "text-white/75",
      iconBgClassName: "bg-white/20",
      iconColorClassName: "text-white",
      animationClassName: "animate-flicker [animation-duration:3s]",
    }
  }
  if (points >= 1000) {
    return {
      cardClassName: "bg-gradient-to-r from-lime-400 to-yellow-500",
      textColorClassName: "text-white",
      subtitleColorClassName: "text-white/80",
      iconBgClassName: "bg-white/20",
      iconColorClassName: "text-white",
      animationClassName: "animate-flicker [animation-duration:3s]",
    }
  }
  if (points >= 500) {
    return {
      cardClassName: "bg-gradient-to-r from-green-400 to-lime-500",
      textColorClassName: "text-white",
      subtitleColorClassName: "text-white/75",
      iconBgClassName: "bg-white/20",
      iconColorClassName: "text-white",
      animationClassName: "animate-flicker [animation-duration:3.5s]",
    }
  }
  if (points >= 200) {
    return {
      cardClassName: "bg-gradient-to-r from-cyan-400 to-green-500",
      textColorClassName: "text-white",
      subtitleColorClassName: "text-white/80",
      iconBgClassName: "bg-white/20",
      iconColorClassName: "text-white",
      animationClassName: "",
    }
  }
  if (points >= 50) {
    return {
      cardClassName: "bg-gradient-to-r from-blue-400 to-cyan-500",
      textColorClassName: "text-white",
      subtitleColorClassName: "text-white/80",
      iconBgClassName: "bg-white/20",
      iconColorClassName: "text-white",
      animationClassName: "",
    }
  }
  return {
    cardClassName: "!bg-slate-100 dark:!bg-slate-800",
    textColorClassName: "text-slate-800 dark:text-slate-200",
    subtitleColorClassName: "text-slate-500 dark:text-slate-400",
    iconBgClassName: "bg-slate-200 dark:bg-slate-700",
    iconColorClassName: "text-slate-600 dark:text-slate-300",
    animationClassName: "",
  }
}

export function UserProfileWidget() {
  const { auth, logout } = useAuth()
  const router = useRouter()
  const { sidebarCollapsed, sidebarOpen } = useSidebarContext()
  const queryClient = useQueryClient()

  // GỌI HOOK `useFullProfile`
  const { data: profile, isLoading: profileLoading } = useFullProfile(true);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("")
  const [clubWallet, setClubWallet] = useState<ApiClubWallet | null>(null)
  const [clubWalletLoading, setClubWalletLoading] = useState(false)
  const widgetCollapsed = false; // Luôn hiển thị
  // const [widgetCollapsed, setWidgetCollapsed] = useState<boolean>(true)

  // State for Complete Profile Modal
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false)

  // Check if profile is incomplete for Club Leader
  useEffect(() => {
    if (!profileLoading && profile) {
      // Check API response: needCompleteProfile = true AND roleName = "CLUB_LEADER"
      const shouldShowModal = profile.needCompleteProfile === true && profile.roleName === "CLUB_LEADER"

      if (shouldShowModal) {
        setShowCompleteProfileModal(true)
      }
    }
  }, [profile, profileLoading])

  // Load club wallet for club leaders
  useEffect(() => {
    const loadClubWallet = async () => {
      if (auth.role === "club_leader" && !profileLoading) {
        setClubWalletLoading(true)
        try {
          const clubId = getClubIdFromToken()
          if (clubId) {
            const wallet = await getClubWallet(clubId)
            setClubWallet(wallet)
          }
        } catch (error) {
          console.error("Failed to load club wallet:", error)
        } finally {
          setClubWalletLoading(false)
        }
      }
    }
    loadClubWallet()
  }, [auth.role, profileLoading])

  if (!auth.role || !auth.user) return null
  // DÙNG useMemo ĐỂ LẤY DỮ LIỆU TỪ `profile` (thay thế cho useEffect)
  const memberships = useMemo((): ApiMembershipWallet[] => {
    if (!profile) return []; // Nếu chưa có profile (đang tải hoặc lỗi), trả về mảng rỗng

    // Hỗ trợ cả API mới (wallets) và API cũ (wallet)
    let walletsList = profile?.wallets || [];

    if (!walletsList || walletsList.length === 0) {
      if (profile?.wallet) {
        // Tạo một mảng chứa 1 wallet - ví cá nhân của user
        walletsList = [{
          walletId: profile.wallet.walletId,
          balancePoints: profile.wallet.balancePoints,
          ownerType: profile.wallet.ownerType,
          clubId: 0,
          clubName: "My Point",
          userId: profile.wallet.userId,
          userFullName: profile.wallet.userFullName
        }];
      }
    }

    // For club leaders, filter out USER wallet and add club wallet
    if (auth.role === "club_leader") {
      // Remove USER wallet from list
      walletsList = walletsList.filter((w: any) => w.ownerType !== "USER");
      
      // Add club wallet at the beginning if available
      if (clubWallet) {
        const clubWalletEntry: ApiMembershipWallet = {
          walletId: clubWallet.walletId,
          balancePoints: clubWallet.balancePoints,
          ownerType: clubWallet.ownerType,
          clubId: clubWallet.clubId,
          clubName: clubWallet.clubName || "Club Wallet",
          userId: clubWallet.userId || 0,
          userFullName: clubWallet.userFullName || ""
        };
        
        // Add club wallet at the beginning
        walletsList = [clubWalletEntry, ...walletsList];
      }
    }

    // Map data - đổi tên wallet cá nhân thành "My Point"
    return walletsList.map((w: any) => ({
      walletId: w.walletId,
      balancePoints: w.balancePoints,
      ownerType: w.ownerType === "USER" ? "USER" : w.ownerType,
      clubId: w.clubId,
      clubName: w.ownerType === "USER" ? "My Point" : w.clubName,
      userId: w.userId,
      userFullName: w.userFullName
    }));
  }, [profile, auth.role, clubWallet]); // Chỉ tính toán lại khi `profile`, `auth.role`, hoặc `clubWallet` thay đổi

  // Update displayed points when wallet selection changes
  //  DÙNG useEffect ĐỂ CHỌN WALLET MẶC ĐỊNH KHI `memberships` THAY ĐỔI
  useEffect(() => {
    if (memberships.length === 0) {
      // Nếu profile update và không còn wallet nào, reset
      setSelectedWalletId("")
      return;
    }

    // Ưu tiên chọn Club Wallet (ownerType = "CLUB") làm mặc định cho club leader
    if (auth.role === "club_leader" && clubWallet) {
      const clubWalletInList = memberships.find(m => m.ownerType === "CLUB");
      if (clubWalletInList) {
        setSelectedWalletId(clubWalletInList.walletId.toString());
        return;
      }
    }

    // Nếu chưa chọn wallet NÀO, chọn wallet đầu tiên
    if (!selectedWalletId && memberships.length > 0) {
      setSelectedWalletId(memberships[0].walletId.toString())
    }
  }, [memberships, selectedWalletId, auth.role, clubWallet]) // Chạy khi `memberships` thay đổi

  // 10. DÙNG useMemo ĐỂ TÍNH ĐIỂM (thay thế cho useEffect)
  const userPoints = useMemo(() => {
    if (profileLoading || memberships.length === 0) return 0; // Đang tải hoặc ko có wallet

    // Tìm wallet đang được chọn
    const selectedMembership = memberships.find(m => m.walletId.toString() === selectedWalletId)
    if (selectedMembership) {
      return Number(selectedMembership.balancePoints) || 0
    }

    // Fallback về 0 nếu không tìm thấy
    return 0;
  }, [selectedWalletId, memberships, profileLoading]); //  Tính lại khi 1 trong 3 thay đổi

  // 11. LẤY DATA TRỰC TIẾP TỪ `profile`
  const avatarUrl = profile?.avatarUrl || ""
  const userName = profile?.fullName || auth.user?.fullName || "User"
  const userEmail = profile?.email || auth.user?.email || ""

  const userInitials = (auth.user?.fullName || "User")
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()

  const handleProfile = () => { router.push("/profile") }
  // Ẩn khi sidebar đang collapsed (desktop) hoặc đang mở Sheet (mobile)
  const isHidden = sidebarCollapsed || sidebarOpen
  const shouldShowPoints = auth.role === "student" || auth.role === "club_leader"
  const tierInfo = getTierInfo(userPoints, auth.role)
  const TierIcon = tierInfo.icon
  
  // Use fixed blue color for Club Wallet, otherwise use points-based color
  const selectedMembership = memberships.find(m => m.walletId.toString() === selectedWalletId)
  const isClubWallet = selectedMembership?.ownerType === "CLUB"
  const pointsStyle = isClubWallet ? clubWalletStyle : getPointsCardStyle(userPoints)

  return (
    <div
      id="profile-widget-container" // <-- THÊM ID NÀY
      className={`fixed bottom-4 left-4 z-50 bg-white dark:bg-gray-900 border border-border rounded-2xl shadow-lg transition-all duration-300

      ${isHidden ? "opacity-0 -translate-x-full pointer-events-none" : "opacity-100 translate-x-0"}
      pt-0 pb-4 px-4 space-y-3 ${widgetCollapsed ? "w-auto" : "w-[255px] max-w-[255px]"} block`
      }
    >
      {/* Toggle Button */}
      {/* <div className="flex justify-end pt-2 pb-0 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWidgetCollapsed(!widgetCollapsed)}
          className="h-8 w-8 p-0 hover:bg-primary"
          title={widgetCollapsed ? "Show profile" : "Hide profile"}
        >
          {widgetCollapsed ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div> */}

      {!widgetCollapsed && (
        <>
          {shouldShowPoints && (
            profileLoading ? (
              <div className="flex items-center justify-center h-[76px]">
                <LoadingSpinner />
              </div>
            ) : (
              // Points card - clickable when 2+ memberships
              memberships.length >= 2 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div 
                      className={`rounded-lg p-0 overflow-hidden shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 mt-4 ${pointsStyle.cardClassName} ring-2 ring-transparent hover:ring-white/20`}
                      onClick={() => {
                        if (auth.role === "club_leader") {
                          router.push("/club-leader/points")
                        } else if (auth.role === "student") {
                          router.push("/student/history?tab=wallet")
                        }
                      }}
                    >
                      <div className="p-3 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className={`text-xs font-medium transition-colors duration-300 ${pointsStyle.subtitleColorClassName} flex items-center gap-1`}>
                            <span className="truncate">
                              {memberships.find(m => m.walletId.toString() === selectedWalletId)?.clubName || "Club Points"}
                            </span>
                            <ChevronDown className={`h-3 w-3 flex-shrink-0 ${pointsStyle.subtitleColorClassName}`} />
                          </div>
                          <p className={`text-2xl font-bold transition-colors duration-300 ${pointsStyle.textColorClassName} truncate`}>{userPoints.toLocaleString()}</p>
                        </div>
                        <div className={`p-2 rounded-full transition-all duration-300 flex-shrink-0 ${pointsStyle.iconBgClassName}`}>
                          <Flame className={`h-5 w-5 transition-colors duration-300 ${pointsStyle.iconColorClassName} ${pointsStyle.animationClassName}`} />
                        </div>
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[280px] max-w-[280px] p-3">
                    {memberships.map((membership, index) => {
                      const colors = [
                        { from: "from-blue-500", to: "to-cyan-500", hoverFrom: "hover:from-blue-600", hoverTo: "hover:to-cyan-600", check: "text-blue-600" },
                        { from: "from-emerald-500", to: "to-teal-500", hoverFrom: "hover:from-emerald-600", hoverTo: "hover:to-teal-600", check: "text-emerald-600" },
                        { from: "from-orange-500", to: "to-amber-500", hoverFrom: "hover:from-orange-600", hoverTo: "hover:to-amber-600", check: "text-orange-600" },
                        { from: "from-rose-500", to: "to-red-500", hoverFrom: "hover:from-rose-600", hoverTo: "hover:to-red-600", check: "text-rose-600" },
                        { from: "from-indigo-500", to: "to-purple-500", hoverFrom: "hover:from-indigo-600", hoverTo: "hover:to-purple-600", check: "text-indigo-600" },
                        { from: "from-green-500", to: "to-lime-500", hoverFrom: "hover:from-green-600", hoverTo: "hover:to-lime-600", check: "text-green-600" },
                      ]
                      const colorScheme = colors[index % colors.length]
                      const isSelected = selectedWalletId === membership.walletId.toString()

                      return (
                        <DropdownMenuItem
                          key={membership.walletId}
                          onClick={() => setSelectedWalletId(membership.walletId.toString())}
                          className="cursor-pointer rounded-lg p-0 mb-2 overflow-hidden hover:shadow-md transition-all duration-200"
                        >
                          <div className={`flex items-center gap-3 w-full p-3 bg-gradient-to-r ${colorScheme.from} ${colorScheme.to} ${colorScheme.hoverFrom} ${colorScheme.hoverTo} transition-all overflow-hidden`}>
                            <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg text-white flex-shrink-0">
                              {membership.clubName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="font-bold text-sm text-white truncate">{membership.clubName}</div>
                              <div className="text-xs font-medium text-white/90 truncate">
                                {membership.balancePoints.toLocaleString()} pts
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                                <Check className={`h-4 w-4 ${colorScheme.check} font-bold`} />
                              </div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Static points card when 0 or 1 membership
                <div 
                  className="cursor-pointer"
                  onClick={() => {
                    if (auth.role === "club_leader") {
                      router.push("/club-leader/points")
                    } else if (auth.role === "student") {
                      router.push("/student/history?tab=wallet")
                    }
                  }}
                >
                  <div className={`rounded-lg p-0 overflow-hidden shadow-sm mt-4 ${pointsStyle.cardClassName}`}>
                    <div className="p-3 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className={`text-xs font-medium transition-colors duration-300 ${pointsStyle.subtitleColorClassName} truncate`}>
                          {memberships.length > 0 ? "Points" : "No Wallet"}
                        </p>
                        <p className={`text-2xl font-bold transition-colors duration-300 ${pointsStyle.textColorClassName} truncate`}>{userPoints.toLocaleString()}</p>
                      </div>
                      <div className={`p-2 rounded-full transition-colors duration-300 flex-shrink-0 ${pointsStyle.iconBgClassName}`}>
                        <Flame className={`h-5 w-5 transition-colors duration-300 ${pointsStyle.iconColorClassName} ${pointsStyle.animationClassName}`} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            )
          )}
          {/* hiển thị thông tin user lấy từ API */}
          {/* <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors overflow-hidden"> */}
          <div className="flex items-center mt-4 gap-3 p-2 border border-primary/50 rounded-lg hover:bg-primary/30 transition-colors overflow-hidden">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={avatarUrl || "/placeholder-user.jpg"} alt={userName || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">{userName || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail || "-"}</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-hidden">
            <Button variant="outline" size="sm" className="flex-1 gap-2 bg-transparent overflow-hidden" onClick={handleProfile}>
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Profile</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              // className="flex-1 gap-2 text-destructive hover:text-destructive bg-transparent overflow-hidden"
              className="flex-1 gap-2 text-destructive hover:text-white hover:bg-destructive bg-transparent overflow-hidden"
              onClick={logout}
            >
              <LogOut className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </Button>
          </div>
        </>
      )}

      {/* Collapsed state: Show only icon buttons */}
      {widgetCollapsed && (
        <div className="flex gap-2 overflow-hidden">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 bg-transparent overflow-hidden"
            onClick={handleProfile}
            title="Profile"
          >
            <User className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            // className="h-9 w-9 p-0 text-destructive hover:text-destructive bg-transparent overflow-hidden"
            className="h-9 w-9 p-0 text-destructive hover:text-white hover:bg-destructive bg-transparent overflow-hidden"
            onClick={logout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Complete Profile Modal */}
      {(auth.role === "club_leader" || profile?.roleName === "CLUB_LEADER") && (
        <CompleteProfileModal
          open={showCompleteProfileModal}
          onOpenChange={setShowCompleteProfileModal}
          profileData={{
            fullName: profile?.fullName,
            phone: profile?.phone || undefined,
            bio: profile?.bio || undefined,
            avatarUrl: profile?.avatarUrl || undefined,
            backgroundUrl: profile?.backgroundUrl || undefined
          }}
          onComplete={async () => {
            // Invalidate and refetch profile data
            await queryClient.invalidateQueries({ queryKey: ['fullProfile'] })
            setShowCompleteProfileModal(false)
          }}
        />
      )}
    </div>
  )
}
