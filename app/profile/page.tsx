"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  User,
  Mail,
  Phone,
  Save,
  Calendar,
  MapPin,
  Award,
  Star,
  Edit3,
  Shield,
  Clock,
  Users,
  Trophy,
  Crown,
  Gem,
  Target,
  TrendingUp,
  Zap,
  Building2,
  Settings,
  UserCheck,
  FileText,
  BarChart3,
  Globe,
} from "lucide-react"

export default function ProfilePage() {
  const { auth } = useAuth()
  const { toast } = useToast()
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")

  const [userPoints, setUserPoints] = useState(2450)
  const [userTier, setUserTier] = useState("Gold")
  const [nextTierPoints, setNextTierPoints] = useState(3000)
  const [progressPercentage, setProgressPercentage] = useState(82)

  useEffect(() => {
    if (auth.user) {
      setFullName(auth.user.fullName)
      const savedProfile = localStorage.getItem(`clubly-profile-${auth.userId}`)
      if (savedProfile) {
        const profile = JSON.parse(savedProfile)
        setPhone(profile.phone || "")
        setBio(profile.bio || "")
        setLocation(profile.location || "")
      }
    }
  }, [auth.user, auth.userId])

  const handleSave = () => {
    const profile = {
      fullName,
      phone,
      bio,
      location,
    }

    localStorage.setItem(`clubly-profile-${auth.userId}`, JSON.stringify(profile))

    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return {
          color: "from-amber-600 to-orange-600",
          icon: Award,
          bgColor: "bg-gradient-to-br from-amber-500 to-orange-600",
          textColor: "text-white",
        }
      case "Silver":
        return {
          color: "from-gray-400 to-gray-600",
          icon: Shield,
          bgColor: "bg-gradient-to-br from-gray-400 to-gray-600",
          textColor: "text-white",
        }
      case "Gold":
        return {
          color: "from-yellow-400 to-yellow-600",
          icon: Crown,
          bgColor: "bg-gradient-to-br from-yellow-400 to-yellow-600",
          textColor: "text-white",
        }
      case "Platinum":
        return {
          color: "from-blue-400 to-indigo-600",
          icon: Gem,
          bgColor: "bg-gradient-to-br from-blue-400 to-indigo-600",
          textColor: "text-white",
        }
      case "Diamond":
        return {
          color: "from-purple-400 to-pink-600",
          icon: Trophy,
          bgColor: "bg-gradient-to-br from-purple-400 to-pink-600",
          textColor: "text-white",
        }
      default:
        return {
          color: "from-gray-400 to-gray-600",
          icon: Award,
          bgColor: "bg-gradient-to-br from-gray-400 to-gray-600",
          textColor: "text-white",
        }
    }
  }

  const tierInfo = getTierInfo(userTier)
  const TierIcon = tierInfo.icon

  // Use auth.role instead of auth.user?.role
  const isAdminRole = ["uni_admin", "admin", "staff"].includes(auth.role || "")

  if (isAdminRole) {
    return (
      <ProtectedRoute allowedRoles={["student", "club_lead", "uni_admin", "admin", "staff"]}>
        <AppShell>
          <div className="min-h-screen bg-background">
            {/* Professional Header */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center space-x-6">
                  <Avatar className="w-24 h-24 border-4 border-white/20">
                    <AvatarImage src="/placeholder-user.jpg" alt={fullName} />
                    <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">
                      {getInitials(fullName || auth.user?.email || "A")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold">{fullName || "Administrator"}</h1>
                    <p className="text-xl text-white/80 capitalize">{auth.role?.replace("_", " ")}</p>
                    <p className="text-white/70">{auth.user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        Profile Information
                      </CardTitle>
                      <CardDescription>Manage your account details and preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="email" value={auth.user?.email || ""} disabled className="pl-10 bg-muted" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="fullName"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Enter your full name"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Enter your phone number"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="location"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="Enter your location"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-md focus:border-primary focus:ring-primary resize-none"
                        />
                      </div>

                      <Button onClick={handleSave} className="w-full">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Role Responsibilities */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-secondary rounded-lg">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        Role & Responsibilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {auth.role === "uni_admin" && (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <Building2 className="h-5 w-5 text-primary" />
                              <span>University Management</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <Users className="h-5 w-5 text-primary" />
                              <span>User Administration</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <BarChart3 className="h-5 w-5 text-primary" />
                              <span>Analytics & Reports</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <Settings className="h-5 w-5 text-primary" />
                              <span>System Configuration</span>
                            </div>
                          </>
                        )}
                        {(auth.role === "admin" || auth.role === "staff") && (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <Globe className="h-5 w-5 text-primary" />
                              <span>Partner Management</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <FileText className="h-5 w-5 text-primary" />
                              <span>Offer Management</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <UserCheck className="h-5 w-5 text-primary" />
                              <span>Customer Support</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <BarChart3 className="h-5 w-5 text-primary" />
                              <span>Performance Analytics</span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Quick Stats */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-accent rounded-lg">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">1,247</div>
                          <div className="text-sm text-gray-600">Total Users</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                          <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">89</div>
                          <div className="text-sm text-gray-600">Active Events</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                          <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-purple-600">156</div>
                          <div className="text-sm text-gray-600">Reports Generated</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-lg">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Updated system settings</span>
                        <span className="text-muted-foreground ml-auto">2h ago</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Generated monthly report</span>
                        <span className="text-muted-foreground ml-auto">5h ago</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Approved new partner</span>
                        <span className="text-muted-foreground ml-auto">1d ago</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student", "club_lead", "uni_admin", "admin", "staff"]}>
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 pb-20">
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              <div className="text-center">
                <div className="profile-float inline-block">
                  <Avatar className="w-28 h-28 mx-auto border-4 border-white/40 shadow-2xl">
                    <AvatarImage src="/placeholder-user.jpg" alt={fullName} />
                    <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">
                      {getInitials(fullName || auth.user?.email || "U")}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <h1 className="mt-4 text-3xl font-bold text-white text-balance">{fullName || "Welcome Back"}</h1>
                <p className="mt-2 text-lg text-white/80">{auth.user?.email}</p>
              </div>
            </div>
          </div>

          <div className="relative -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Tier Status Card */}
              <Card className={`tier-card border-0 shadow-2xl text-white overflow-hidden ${tierInfo.bgColor}`}>
                <CardContent className="p-8 relative">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Current Tier</h3>
                      <div className="flex items-center gap-3">
                        <TierIcon className="h-8 w-8" />
                        <span className="text-3xl font-bold">{userTier}</span>
                      </div>
                    </div>
                    <div className="tier-glow">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                        <TierIcon className="h-10 w-10" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress to Platinum</span>
                      <span>
                        {userPoints}/{nextTierPoints} points
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-3 bg-white/20" />
                    <p className="text-sm text-white/80">{nextTierPoints - userPoints} points until next tier</p>
                  </div>
                </CardContent>
              </Card>

              {/* Points Card */}
              <Card className="points-card border-0 shadow-2xl text-white overflow-hidden">
                <CardContent className="p-8 relative">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Loyalty Points</h3>
                      <div className="flex items-center gap-3">
                        <Star className="h-8 w-8" />
                        <span className="text-4xl font-bold points-pulse">{userPoints.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                      <Zap className="h-10 w-10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/20 rounded-lg p-3">
                      <TrendingUp className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-lg font-bold">+125</div>
                      <div className="text-xs text-white/80">This Month</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <Target className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-lg font-bold">850</div>
                      <div className="text-xs text-white/80">Redeemed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Personal Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="profile-card-hover border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                        <Edit3 className="h-5 w-5 text-white" />
                      </div>
                      Personal Information
                    </CardTitle>
                    <CardDescription>Update your profile details and preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            value={auth.user?.email || ""}
                            disabled
                            className="pl-10 bg-gray-50 border-gray-200 text-gray-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
                          Full Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            className="pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter your phone number"
                            className="pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm font-semibold text-gray-700">
                          Location
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter your location"
                            className="pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">
                        Bio
                      </Label>
                      <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                      />
                    </div>

                    <Button
                      onClick={handleSave}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Activity Stats only */}
              <div className="space-y-6">
                <Card className="profile-card-hover border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      Activity Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-blue-600">5</div>
                        <div className="text-xs text-gray-600">Clubs Joined</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                        <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-green-600">12</div>
                        <div className="text-xs text-gray-600">Events Attended</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                        <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-purple-600">6</div>
                        <div className="text-xs text-gray-600">Months Active</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-100">
                        <Trophy className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-orange-600">3</div>
                        <div className="text-xs text-gray-600">Achievements</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}