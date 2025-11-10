"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  getMutiplierPolicy, 
  postMutiplierPolicy,
  putMutiplierPolicy,
  deleteMutiplierPolicy,
  MultiplierPolicy, 
  PolicyTargetType,
  CreateMultiplierPolicyPayload,
  UpdateMultiplierPolicyPayload
} from "@/service/mutiplierPolicyApi"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users, 
  Shield, 
  Target,
  Calendar,
  Clock,
  Award,
  Percent,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Plus,
  X
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Status/Level configuration for different target types
const CLUB_STATUSES = {
  EXCELLENT: { 
    label: "Excellent", 
    color: "bg-gradient-to-br from-purple-500 to-pink-500",
    textColor: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    icon: Sparkles
  },
  ACTIVE: { 
    label: "Active", 
    color: "bg-gradient-to-br from-green-500 to-emerald-500",
    textColor: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    icon: CheckCircle2
  },
  INACTIVE: { 
    label: "Inactive", 
    color: "bg-gradient-to-br from-orange-500 to-amber-500",
    textColor: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    icon: AlertCircle
  },
  SUSPENDED: { 
    label: "Suspended", 
    color: "bg-gradient-to-br from-red-500 to-rose-500",
    textColor: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    icon: XCircle
  }
}

const MEMBER_STATUSES = {
  LEGEND: { 
    label: "Legend", 
    color: "bg-gradient-to-br from-amber-500 to-yellow-500",
    textColor: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    icon: Award
  },
  ELITE: { 
    label: "Elite", 
    color: "bg-gradient-to-br from-purple-500 to-indigo-500",
    textColor: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    icon: Sparkles
  },
  CONTRIBUTOR: { 
    label: "Contributor", 
    color: "bg-gradient-to-br from-blue-500 to-cyan-500",
    textColor: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    icon: TrendingUp
  },
  ACTIVE: { 
    label: "Active", 
    color: "bg-gradient-to-br from-green-500 to-emerald-500",
    textColor: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    icon: CheckCircle2
  },
  BASIC: { 
    label: "Basic", 
    color: "bg-gradient-to-br from-gray-500 to-slate-500",
    textColor: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-800",
    icon: Target
  }
}

const getStatusConfig = (targetType: PolicyTargetType, status: string) => {
  if (targetType === "CLUB") {
    return CLUB_STATUSES[status as keyof typeof CLUB_STATUSES] || {
      label: status,
      color: "bg-gradient-to-br from-gray-500 to-slate-500",
      textColor: "text-gray-700 dark:text-gray-300",
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
      borderColor: "border-gray-200 dark:border-gray-800",
      icon: Target
    }
  }
  return MEMBER_STATUSES[status as keyof typeof MEMBER_STATUSES] || {
    label: status,
    color: "bg-gradient-to-br from-gray-500 to-slate-500",
    textColor: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-800",
    icon: Target
  }
}

const getMultiplierIcon = (multiplier: number) => {
  if (multiplier > 1) return TrendingUp
  if (multiplier < 1) return TrendingDown
  return Minus
}

const getMultiplierBadgeColor = (multiplier: number) => {
  if (multiplier > 1.2) return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700"
  if (multiplier > 1) return "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
  if (multiplier === 1) return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
  if (multiplier > 0) return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700"
  return "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700"
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export default function AdminMultiplierPolicyPage() {
  const { toast } = useToast()
  
  // State management
  const [clubPolicies, setClubPolicies] = useState<MultiplierPolicy[]>([])
  const [memberPolicies, setMemberPolicies] = useState<MultiplierPolicy[]>([])
  const [loadingClub, setLoadingClub] = useState(true)
  const [loadingMember, setLoadingMember] = useState(true)
  const [activeTab, setActiveTab] = useState<PolicyTargetType>("CLUB")
  
  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<CreateMultiplierPolicyPayload>({
    targetType: "CLUB",
    levelOrStatus: "",
    minEvents: 0,
    multiplier: 1,
    effectiveFrom: new Date().toISOString().split('T')[0]
  })
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<MultiplierPolicy | null>(null)
  const [editFormData, setEditFormData] = useState<UpdateMultiplierPolicyPayload>({
    id: 0,
    multiplier: 0,
    updatedBy: ""
  })
  
  // Delete state
  const [isDeleting, setIsDeleting] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<MultiplierPolicy | null>(null)

  // Load policies on mount
  useEffect(() => {
    loadAllPolicies()
  }, [])

  const loadAllPolicies = async () => {
    try {
      setLoadingClub(true)
      setLoadingMember(true)
      
      // Call the new API that returns all policies
      const allPolicies = await getMutiplierPolicy()
      
      // Filter by target type
      const clubPolicies = allPolicies.filter(policy => policy.targetType === "CLUB")
      const memberPolicies = allPolicies.filter(policy => policy.targetType === "MEMBER")
      
      setClubPolicies(clubPolicies)
      setMemberPolicies(memberPolicies)
    } catch (error) {
      console.error("Error loading multiplier policies:", error)
      toast({
        title: "Error",
        description: "Failed to load multiplier policies. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingClub(false)
      setLoadingMember(false)
    }
  }

  const handleCreatePolicy = async () => {
    // Validation
    if (!formData.levelOrStatus.trim()) {
      toast({
        title: "Validation Error",
        description: "Level or Status is required",
        variant: "destructive",
      })
      return
    }

    if (formData.minEvents < 0) {
      toast({
        title: "Validation Error",
        description: "Minimum events must be 0 or greater",
        variant: "destructive",
      })
      return
    }

    if (formData.multiplier < 0) {
      toast({
        title: "Validation Error",
        description: "Multiplier must be 0 or greater",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      
      // Format the effectiveFrom date to ISO format with time
      const formattedPayload = {
        ...formData,
        effectiveFrom: new Date(formData.effectiveFrom).toISOString()
      }
      
      const newPolicy = await postMutiplierPolicy(formattedPayload)
      
      // Reload all policies to get the latest data
      await loadAllPolicies()
      
      // Reset form and close modal
      setFormData({
        targetType: "CLUB",
        levelOrStatus: "",
        minEvents: 0,
        multiplier: 1,
        effectiveFrom: new Date().toISOString().split('T')[0]
      })
      setIsCreateModalOpen(false)
      
      toast({
        title: "Success",
        description: `Multiplier policy for ${newPolicy.levelOrStatus} created successfully`,
      })
    } catch (error: any) {
      console.error("Error creating policy:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create policy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenEditModal = (policy: MultiplierPolicy) => {
    // Get userId from sessionStorage
    const authData = sessionStorage.getItem("uniclub-auth")
    let userId = "unknown"
    
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData)
        userId = parsedAuth.userId || parsedAuth.id || parsedAuth.email || "unknown"
      } catch (error) {
        console.error("Error parsing auth data:", error)
      }
    }
    
    setSelectedPolicy(policy)
    setEditFormData({
      id: policy.id,
      multiplier: policy.multiplier,
      updatedBy: userId
    })
    setIsEditModalOpen(true)
  }

  const handleEditPolicy = async () => {
    // Validation
    if (editFormData.multiplier < 0) {
      toast({
        title: "Validation Error",
        description: "Multiplier must be 0 or greater",
        variant: "destructive",
      })
      return
    }

    try {
      setIsEditing(true)
      
      await putMutiplierPolicy(editFormData.id, editFormData)
      
      // Reload all policies to get the latest data
      await loadAllPolicies()
      
      // Close modal
      setIsEditModalOpen(false)
      
      toast({
        title: "Success",
        description: `Multiplier policy updated successfully`,
      })
    } catch (error: any) {
      console.error("Error updating policy:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update policy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  // Handle delete policy
  const handleDeletePolicy = async (policy: MultiplierPolicy) => {
    setPolicyToDelete(policy)
  }

  const confirmDeletePolicy = async () => {
    if (!policyToDelete) return

    try {
      setIsDeleting(true)
      
      // Call delete API
      await deleteMutiplierPolicy(policyToDelete.id)
      
      // Reload all policies to get the latest data
      await loadAllPolicies()
      
      // Close modal
      setPolicyToDelete(null)
      
      toast({
        title: "Success",
        description: `Multiplier policy deleted successfully`,
      })
    } catch (error: any) {
      console.error("Error deleting policy:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete policy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Calculate statistics
  const clubStats = useMemo(() => {
    const avgMultiplier = clubPolicies.length > 0
      ? clubPolicies.reduce((sum, p) => sum + p.multiplier, 0) / clubPolicies.length
      : 0
    const maxMultiplier = Math.max(...clubPolicies.map(p => p.multiplier), 0)
    const totalPolicies = clubPolicies.length
    return { avgMultiplier, maxMultiplier, totalPolicies }
  }, [clubPolicies])

  const memberStats = useMemo(() => {
    const avgMultiplier = memberPolicies.length > 0
      ? memberPolicies.reduce((sum, p) => sum + p.multiplier, 0) / memberPolicies.length
      : 0
    const maxMultiplier = Math.max(...memberPolicies.map(p => p.multiplier), 0)
    const totalPolicies = memberPolicies.length
    return { avgMultiplier, maxMultiplier, totalPolicies }
  }, [memberPolicies])

  const currentStats = activeTab === "CLUB" ? clubStats : memberStats
  const currentPolicies = activeTab === "CLUB" ? clubPolicies : memberPolicies
  const currentLoading = activeTab === "CLUB" ? loadingClub : loadingMember

  // Render policy card
  const renderPolicyCard = (policy: MultiplierPolicy) => {
    const statusConfig = getStatusConfig(policy.targetType, policy.levelOrStatus)
    const MultiplierIcon = getMultiplierIcon(policy.multiplier)
    const StatusIcon = statusConfig.icon
    
    return (
      <Card 
        key={policy.id} 
        className={`relative overflow-hidden border-2 ${statusConfig.borderColor} transition-all hover:shadow-lg cursor-pointer`}
        onClick={() => handleOpenEditModal(policy)}
      >
        {/* Status indicator stripe */}
        <div className={`h-2 w-full ${statusConfig.color}`} />
        
        <CardHeader className={`${statusConfig.bgColor}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className={`p-2 rounded-lg ${statusConfig.color} flex-shrink-0`}>
                <StatusIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-xl truncate">{statusConfig.label}</CardTitle>
                <CardDescription className="flex items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm">
                  <Target className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{policy.targetType} Policy</span>
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Multiplier Badge - Large and Prominent */}
              <Badge 
                variant="outline" 
                className={`px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-lg font-bold ${getMultiplierBadgeColor(policy.multiplier)}`}
              >
                <MultiplierIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-1" />
                <span className="hidden sm:inline">{policy.multiplier}x</span>
                <span className="sm:hidden">{policy.multiplier}</span>
              </Badge>
              
              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeletePolicy(policy)
                }}
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4 sm:pt-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Minimum Events */}
            <div className={`p-3 sm:p-4 rounded-lg border ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Min Events</span>
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${statusConfig.textColor} truncate`}>
                {policy.minEvents}
              </div>
            </div>

            {/* Points Example */}
            <div className={`p-3 sm:p-4 rounded-lg border ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                <Award className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Example (100 pts)</span>
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${statusConfig.textColor} truncate`}>
                {(100 * policy.multiplier).toFixed(0)} pts
              </div>
            </div>
          </div>

          {/* Points Calculation Visual */}
          <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-muted">
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
              <span className="font-mono font-bold truncate">Base Points</span>
              <span className="text-lg sm:text-xl flex-shrink-0">×</span>
              <Badge variant="outline" className={`${getMultiplierBadgeColor(policy.multiplier)} text-xs sm:text-sm`}>
                <Percent className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{(policy.multiplier * 100).toFixed(0)}%</span>
              </Badge>
              <span className="text-lg sm:text-xl flex-shrink-0">=</span>
              <span className="font-mono font-bold truncate">Final Points</span>
            </div>
            <div className="text-center text-xs text-muted-foreground mt-2 truncate">
              {policy.multiplier > 1 
                ? `+${((policy.multiplier - 1) * 100).toFixed(0)}% bonus points` 
                : policy.multiplier < 1 
                  ? `${((1 - policy.multiplier) * 100).toFixed(0)}% point reduction`
                  : "No modification to base points"
              }
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2 pt-2 border-t">
            {policy.effectiveFrom && (
              <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground flex items-center gap-1 truncate">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Effective From</span>
                </span>
                <span className="font-medium flex-shrink-0 text-xs sm:text-sm">{formatDate(policy.effectiveFrom)}</span>
              </div>
            )}
            
            {policy.updatedAt && (
              <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground flex items-center gap-1 truncate">
                  <Shield className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Last Updated</span>
                </span>
                <span className="font-medium flex-shrink-0 text-xs sm:text-sm">{formatDateTime(policy.updatedAt)}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex items-center gap-1 truncate">
                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Status</span>
              </span>
              <Badge variant={policy.active ? "default" : "secondary"} className="flex-shrink-0">
                {policy.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex items-center gap-1 truncate">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Updated By</span>
              </span>
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded flex-shrink-0 truncate max-w-[150px]">
                {policy.updatedBy}
              </span>
            </div>
          </div>

          {/* Policy ID Badge */}
          <div className="flex items-center justify-center pt-2">
            <Badge variant="outline" className="text-xs truncate">
              Policy ID: #{policy.id}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "uni_staff"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
                <span className="truncate">Multiplier Policy Management</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
                Configure point multipliers for different club statuses and member levels
              </p>
            </div>
            
            {/* Create Button with Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto flex-shrink-0">
                  <Plus className="h-4 w-4" />
                  <span className="truncate">Create Policy</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Create Multiplier Policy
                  </DialogTitle>
                  <DialogDescription>
                    Add a new multiplier policy for clubs or members
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Target Type */}
                  <div className="space-y-2">
                    <Label htmlFor="targetType">Target Type *</Label>
                    <Select
                      value={formData.targetType}
                      onValueChange={(value: PolicyTargetType) =>
                        setFormData({ ...formData, targetType: value })
                      }
                    >
                      <SelectTrigger id="targetType">
                        <SelectValue placeholder="Select target type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLUB">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Club
                          </div>
                        </SelectItem>
                        <SelectItem value="MEMBER">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Member
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Level or Status */}
                  <div className="space-y-2">
                    <Label htmlFor="levelOrStatus">Level or Status *</Label>
                    <Input
                      id="levelOrStatus"
                      placeholder="e.g., EXCELLENT, ACTIVE, INACTIVE"
                      value={formData.levelOrStatus}
                      onChange={(e) =>
                        setFormData({ ...formData, levelOrStatus: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.targetType === "CLUB" 
                        ? "Common values: EXCELLENT, ACTIVE, INACTIVE, SUSPENDED" 
                        : "Enter the member level or status"}
                    </p>
                  </div>

                  {/* Min Events */}
                  <div className="space-y-2">
                    <Label htmlFor="minEvents">Minimum Events *</Label>
                    <Input
                      id="minEvents"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.minEvents}
                      onChange={(e) =>
                        setFormData({ ...formData, minEvents: parseInt(e.target.value) || 0 })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum number of events required for this policy to apply
                    </p>
                  </div>

                  {/* Multiplier */}
                  <div className="space-y-2">
                    <Label htmlFor="multiplier">Multiplier *</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="1.0"
                      value={formData.multiplier}
                      onChange={(e) =>
                        setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 0 })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Point multiplier (e.g., 1.5 = +50%, 0.8 = -20%, 1.0 = no change)
                    </p>
                  </div>

                  {/* Effective From */}
                  <div className="space-y-2">
                    <Label htmlFor="effectiveFrom">Effective From *</Label>
                    <Input
                      id="effectiveFrom"
                      type="date"
                      value={formData.effectiveFrom}
                      onChange={(e) =>
                        setFormData({ ...formData, effectiveFrom: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Date when this policy becomes active
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePolicy}
                    disabled={isCreating}
                    className="gap-2"
                  >
                    {isCreating ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Policy
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Edit Policy Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Edit Multiplier Policy
                </DialogTitle>
                <DialogDescription>
                  Update the multiplier value for this policy
                </DialogDescription>
              </DialogHeader>
              
              {selectedPolicy && (
                <div className="space-y-4 py-4">
                  {/* ID Field (disabled) */}
                  <div className="space-y-2">
                    <Label htmlFor="editId">Policy ID</Label>
                    <Input
                      id="editId"
                      type="number"
                      value={editFormData.id}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Policy identifier (cannot be changed)
                    </p>
                  </div>

                  {/* Target Type (display only) */}
                  <div className="space-y-2">
                    <Label>Target Type</Label>
                    <div className="flex items-center gap-2 p-3 rounded-md border bg-muted">
                      {selectedPolicy.targetType === "CLUB" ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      <span className="font-medium">{selectedPolicy.targetType}</span>
                    </div>
                  </div>

                  {/* Level/Status (display only) */}
                  <div className="space-y-2">
                    <Label>Level / Status</Label>
                    <div className="p-3 rounded-md border bg-muted">
                      <span className="font-medium">{selectedPolicy.levelOrStatus}</span>
                    </div>
                  </div>

                  {/* Min Events (display only) */}
                  <div className="space-y-2">
                    <Label>Minimum Events</Label>
                    <div className="flex items-center gap-2 p-3 rounded-md border bg-muted">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{selectedPolicy.minEvents} events</span>
                    </div>
                  </div>

                  {/* Multiplier Field (editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="editMultiplier">Multiplier *</Label>
                    <Input
                      id="editMultiplier"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1.0"
                      value={editFormData.multiplier}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, multiplier: parseFloat(e.target.value) || 0 })
                      }
                      className="font-mono text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Point multiplier (e.g., 1.5 = +50%, 0.8 = -20%, 1.0 = no change)
                    </p>
                  </div>

                  {/* Updated By Field (disabled) */}
                  <div className="space-y-2">
                    <Label htmlFor="editUpdatedBy">Updated By</Label>
                    <Input
                      id="editUpdatedBy"
                      type="text"
                      value={editFormData.updatedBy}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      User making this update (auto-filled from session)
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isEditing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditPolicy}
                  disabled={isEditing}
                  className="gap-2"
                >
                  {isEditing ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Percent className="h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!policyToDelete} onOpenChange={() => setPolicyToDelete(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Delete Multiplier Policy
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this policy? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              {policyToDelete && (
                <div className="space-y-3 py-4">
                  <div className="p-4 rounded-lg border-2 border-destructive/20 bg-destructive/5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Policy ID:</span>
                        <span className="font-bold">{policyToDelete.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Target Type:</span>
                        <Badge variant="outline">{policyToDelete.targetType}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Level/Status:</span>
                        <span className="font-semibold">{policyToDelete.levelOrStatus}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Multiplier:</span>
                        <Badge className={`${getMultiplierBadgeColor(policyToDelete.multiplier)}`}>
                          {policyToDelete.multiplier}x
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      Warning: Deleting this policy will affect how points are calculated for this level/status.
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPolicyToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeletePolicy}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      Delete Policy
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Statistics Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {/* Total Policies */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <CardTitle className="text-sm font-medium truncate">Total Policies</CardTitle>
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <div className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300 truncate">
                  {currentStats.totalPolicies}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Active {activeTab.toLowerCase()} policies
                </p>
              </CardContent>
            </Card>

            {/* Average Multiplier */}
            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardTitle className="text-sm font-medium truncate">Average Multiplier</CardTitle>
                <Percent className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <div className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-300 truncate">
                  {currentStats.avgMultiplier.toFixed(2)}x
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Mean point multiplier
                </p>
              </CardContent>
            </Card>

            {/* Max Multiplier */}
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <CardTitle className="text-sm font-medium truncate">Highest Multiplier</CardTitle>
                <Award className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <div className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300 truncate">
                  {currentStats.maxMultiplier.toFixed(1)}x
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Maximum bonus available
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Policy Type Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PolicyTargetType)}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="CLUB" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Club Policies</span>
                <Badge variant="secondary" className="ml-1 text-xs flex-shrink-0">{clubPolicies.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="MEMBER" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Member Policies</span>
                <Badge variant="secondary" className="ml-1 text-xs flex-shrink-0">{memberPolicies.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Club Policies Tab */}
            <TabsContent value="CLUB" className="space-y-4 mt-6">
              {loadingClub ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24 mt-2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : clubPolicies.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-base sm:text-lg font-medium">No Club Policies Found</p>
                    <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                      No multiplier policies are configured for clubs yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {clubPolicies
                    .sort((a, b) => b.multiplier - a.multiplier) // Sort by multiplier descending
                    .map(policy => renderPolicyCard(policy))}
                </div>
              )}
            </TabsContent>

            {/* Member Policies Tab */}
            <TabsContent value="MEMBER" className="space-y-4 mt-6">
              {loadingMember ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24 mt-2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : memberPolicies.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-base sm:text-lg font-medium">No Member Policies Found</p>
                    <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                      No multiplier policies are configured for members yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {memberPolicies
                    .sort((a, b) => b.multiplier - a.multiplier) // Sort by multiplier descending
                    .map(policy => renderPolicyCard(policy))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Info Card */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <AlertCircle className="h-5 w-5" />
                How Multipliers Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Point Multipliers</strong> adjust the base points earned based on club status or member level:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Multiplier &gt; 1.0:</strong> Bonus points (e.g., 1.3x = +30% points)</li>
                <li><strong>Multiplier = 1.0:</strong> Standard points (no change)</li>
                <li><strong>Multiplier &lt; 1.0:</strong> Reduced points (e.g., 0.8x = -20% points)</li>
                <li><strong>Multiplier = 0:</strong> No points awarded</li>
              </ul>
              <p className="pt-2">
                <strong>Minimum Events</strong> requirement must be met for the status/level to apply.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
