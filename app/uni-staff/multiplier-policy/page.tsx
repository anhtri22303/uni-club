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
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import {
  getMutiplierPolicy, createMultiplierPolicy, updateMultiplierPolicy, deleteMutiplierPolicy, MultiplierPolicy, PolicyTargetType, ConditionType,
} from "@/service/multiplierPolicyApi"
import {
  TrendingUp, TrendingDown, Minus, Users, Shield, Target, Calendar, Clock, Award, Percent, CheckCircle2, XCircle, AlertCircle, Sparkles, Plus, X, Activity,
  Gauge, Layers, FileText, Search,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// We base colors/icons on TargetType only, per user request.
const getStatusConfig = (targetType: PolicyTargetType) => {
  if (targetType === "CLUB") {
    return {
      label: "Club Policy",
      icon: Shield,
      color: "bg-gradient-to-br from-blue-500 to-cyan-500",
      textColor: "text-blue-700 dark:text-blue-300",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    }
  }
  return {
    // MEMBER
    label: "Member Policy",
    icon: Users,
    color: "bg-gradient-to-br from-purple-500 to-indigo-500",
    textColor: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  }
}

const getMultiplierIcon = (multiplier: number) => {
  if (multiplier > 1) return TrendingUp
  if (multiplier < 1) return TrendingDown
  return Minus
}

const getMultiplierBadgeColor = (multiplier: number) => {
  // 1. Mốc = 0 (Không có điểm)
  if (multiplier === 0) {
    return "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700"
  }
  // 2. Mốc (0 < x < 1) (Giảm điểm)
  if (multiplier < 1) {
    return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700"
  }
  // 3. Mốc = 1 (Chuẩn, không đổi)
  if (multiplier === 1) {
    return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
  }
  // 5. Mốc > 2 (Thưởng cao)
  if (multiplier > 2) {
    return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700"
  }
  // 4. Mốc (1 < x <= 2) (Thưởng)
  // (Chúng ta kiểm tra điều này sau khi đã kiểm tra > 2)
  if (multiplier > 1) {
    return "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
  }
  // Trường hợp dự phòng (ví dụ: số âm, dù logic của bạn đã chặn)
  return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-700"
}

const formatNumberWithCommas = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === "") return ""

  // Xóa các dấu phẩy cũ để định dạng lại
  const stringValue = String(value).replace(/,/g, '')

  const parts = stringValue.split('.')
  // dấu phẩy cho phần nguyên
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return parts.join('.')
}

// Hàm này sẽ xóa dấu phẩy và ký tự không phải số (trừ dấu chấm)
const parseNumber = (value: string): number => {
  // 1. Thay thế tất cả dấu phẩy (,) bằng dấu chấm (.)
  const dotValue = value.replace(/,/g, ".")
  // 2. Xóa tất cả các ký tự không phải là số hoặc dấu chấm
  const cleanedValue = dotValue.replace(/[^0-9.]/g, "")
  // 3. Xử lý trường hợp nhập nhiều dấu chấm (ví dụ: "1.500.5" do nhập "1,500.5" hoặc "1.500,5")
  // Bằng cách giữ lại dấu chấm cuối cùng làm dấu thập phân
  const parts = cleanedValue.split('.')
  if (parts.length > 1) {
    const lastPart = parts.pop() // Lấy phần thập phân (ví dụ: "5")
    const firstPart = parts.join('') // Ghép phần nguyên lại (ví dụ: "1500")
    const finalValue = `${firstPart}.${lastPart}`
    return parseFloat(finalValue) || 0
  }
  // 4. Nếu chỉ có một (hoặc không có) dấu chấm, parse bình thường
  return parseFloat(cleanedValue) || 0
}

// Hàm này sẽ xóa dấu phẩy và chỉ lấy số nguyên (cho threshold)
const parseIntWithCommas = (value: string): number => {
  // Chỉ cho phép số
  const cleanedValue = value.replace(/[^0-9]/g, '')
  return parseInt(cleanedValue) || 0
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
  const [searchQuery, setSearchQuery] = useState("")

  // Create modal state
  // REBUILT: Create modal state for NEW API fields
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const initialFormData: Omit<MultiplierPolicy, "id" | "updatedBy"> & {
    minThresholdString: string
    maxThresholdString: string
    multiplierString: string
  } = {
    targetType: "CLUB",
    activityType: "",
    ruleName: "",
    conditionType: "PERCENTAGE",
    minThreshold: 0,
    maxThreshold: 0,
    policyDescription: "",
    multiplier: 1,
    active: true,
    // giá trị mặc định cho chuỗi
    minThresholdString: "0",
    maxThresholdString: "0",
    multiplierString: "1",
  }

  // const [formData, setFormData] =
  const [formData, setFormData] = useState(initialFormData)
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<MultiplierPolicy | null>(null)
  // các trường string để người dùng có thể nhập số thập phân/số có dấu phẩy mà không bị parse ngay lập tức
  const [editFormData, setEditFormData] = useState<Partial<MultiplierPolicy> & {
    minThresholdString?: string
    maxThresholdString?: string
    multiplierString?: string
  }>({})

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<MultiplierPolicy | null>(null)
  const [currentUserInfo, setCurrentUserInfo] = useState({ id: "system", name: "System" });
  // Load policies on mount
  useEffect(() => {
    loadAllPolicies()
    // Tải thông tin user hiện tại từ session
    const authData = sessionStorage.getItem("uniclub-auth");
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        // Lấy ID
        const id = parsedAuth.userId || parsedAuth.id || "system";
        // CỐ GẮNG TÌM TÊN (ưu tiên fullName, name, rồi email, cuối cùng là ID)
        const name = parsedAuth.fullName || parsedAuth.name || parsedAuth.email || id;
        setCurrentUserInfo({ id, name });
      } catch (e) {
        console.error("Failed to parse auth data", e);
      }
    }
  }, [])

  // REBUILT: loadAllPolicies to use ONE API call and filter
  const loadAllPolicies = async () => {
    try {
      setLoadingClub(true)
      setLoadingMember(true)

      // Call the new API that returns all policies
      const allPolicies = await getMutiplierPolicy() // FIXED TYPO

      // Filter by target type
      const clubPolicies = allPolicies.filter(
        policy => policy.targetType === "CLUB"
      )
      const memberPolicies = allPolicies.filter(
        policy => policy.targetType === "MEMBER"
      )

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
    if (!formData.ruleName.trim()) {
      toast({
        title: "Validation Error",
        description: "Rule Name is required",
        variant: "destructive",
      })
      return
    }
    if (!formData.activityType.trim()) {
      toast({
        title: "Validation Error",
        description: "Activity Type is required",
        variant: "destructive",
      })
      return
    }

    // Parse các giá trị string về number
    const minThreshold = parseIntWithCommas(formData.minThresholdString)
    const maxThreshold = parseIntWithCommas(formData.maxThresholdString)
    const multiplier = parseNumber(formData.multiplierString)

    if (minThreshold < 0 || maxThreshold < 0) {
      toast({
        title: "Validation Error",
        description: "Thresholds must be 0 or greater",
        variant: "destructive",
      })
      return
    }

    if (formData.conditionType === 'PERCENTAGE' && maxThreshold > 101) {
      toast({
        title: "Validation Error",
        description: "Max Threshold cannot be greater than 101 when the type is PERCENTAGE.",
        variant: "destructive",
      })
      return
    }

    if (minThreshold >= maxThreshold) {
      toast({
        title: "Validation Error",
        description: "Min Threshold must be less than Max Threshold.",
        variant: "destructive",
      })
      return
    }

    if (multiplier < 0) {
      toast({
        title: "Validation Error",
        description: "Multiplier must be 0 or greater",
        variant: "destructive",
      })
      return
    }

    // Get user from session... (Phần còn lại của hàm giữ nguyên)
    const authData = sessionStorage.getItem("uniclub-auth")
    let userId = "system"
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData)
        userId = parsedAuth.userId || parsedAuth.id || parsedAuth.email || "system"
      } catch (error) {
        console.error("Error parsing auth data:", error)
      }
    }

    try {
      setIsCreating(true)

      const payload = {
        ...formData,
        minThreshold,
        maxThreshold,
        multiplier,
        updatedBy: userId,
      }
      delete (payload as any).minThresholdString
      delete (payload as any).maxThresholdString
      delete (payload as any).multiplierString


      const newPolicy = await createMultiplierPolicy(payload)

      await loadAllPolicies()
      setFormData(initialFormData)
      setIsCreateModalOpen(false)

      toast({
        title: "Success",
        description: `Multiplier policy "${newPolicy.ruleName}" created successfully`,
      })
    } catch (error: any) {
      console.error("Error creating policy:", error)
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to create policy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }


  const handleOpenEditModal = (policy: MultiplierPolicy) => {
    setSelectedPolicy(policy);

    // Lấy userId từ sessionStorage
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

    // Tải TẤT CẢ dữ liệu từ policy vào form
    // ĐẶC BIỆT: Khởi tạo các trường `...String` từ giá trị số đã có của policy
    setEditFormData({
      ...policy,
      minThresholdString: formatNumberWithCommas(policy.minThreshold),
      maxThresholdString: formatNumberWithCommas(policy.maxThreshold),
      multiplierString: formatNumberWithCommas(policy.multiplier),
      updatedBy: currentUserInfo.id, // Vẫn dùng currentUserInfo.id cho updatedBy khi lưu
    });
    setIsEditModalOpen(true);
  }

  const handleEditPolicy = async () => {
    // Kiểm tra và parse các giá trị từ string sang number
    const ruleName = editFormData.ruleName?.trim()
    const activityType = editFormData.activityType?.trim()

    if (!ruleName) {
      toast({ title: "Validation Error", description: "Rule Name is required", variant: "destructive" }); return;
    }
    if (!activityType) {
      toast({ title: "Validation Error", description: "Activity Type is required", variant: "destructive" }); return;
    }

    // Parse từ string sang number
    const minThreshold = parseIntWithCommas(editFormData.minThresholdString || "");
    const maxThreshold = parseIntWithCommas(editFormData.maxThresholdString || "");
    const multiplier = parseNumber(editFormData.multiplierString || "");

    // Validation cho các giá trị đã parse
    if (minThreshold < 0 || maxThreshold < 0) {
      toast({ title: "Validation Error", description: "Thresholds must be 0 or greater", variant: "destructive" }); return;
    }

    {/* --- START EDIT: Thêm validation cho PERCENTAGE --- */ }
    if (editFormData.conditionType === 'PERCENTAGE' && maxThreshold > 101) {
      toast({
        title: "Validation Error",
        description: "Max Threshold cannot be greater than 101 when the type is PERCENTAGE.",
        variant: "destructive",
      })
      return
    }
    {/* --- END EDIT --- */ }

    if (minThreshold >= maxThreshold) {
      toast({
        title: "Validation Error",
        description: "Min Threshold must be less than Max Threshold.",
        variant: "destructive",
      })
      return
    }

    if (multiplier < 0) {
      toast({ title: "Validation Error", description: "Multiplier must be 0 or greater", variant: "destructive" }); return;
    }

    if (!selectedPolicy) {
      toast({
        title: "Error",
        description: "No policy selected",
        variant: "destructive",
      })
      return
    }

    try {
      setIsEditing(true)

      const payload = {
        ...editFormData,
        ruleName,
        activityType,
        minThreshold,
        maxThreshold,
        multiplier,
        minThresholdString: undefined,
        maxThresholdString: undefined,
        multiplierString: undefined,
      };

      await updateMultiplierPolicy(selectedPolicy.id, payload as MultiplierPolicy);

      await loadAllPolicies()
      setIsEditModalOpen(false)
      toast({
        title: "Success",
        description: `Multiplier policy updated successfully`,
      })
    } catch (error: any) {
      console.error("Error updating policy:", error)
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update policy. Please try again.",
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
      ? clubPolicies.reduce((sum, p) => sum + p.multiplier, 0) / clubPolicies.length : 0
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
  const filteredPolicies = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase()

    const filterPolicy = (policy: MultiplierPolicy) => {
      if (!lowerCaseQuery) return true // Hiển thị tất cả nếu ô tìm kiếm trống

      return (
        // Tìm theo tên luật
        policy.ruleName.toLowerCase().includes(lowerCaseQuery) ||
        // Tìm theo loại hoạt động
        policy.activityType.toLowerCase().includes(lowerCaseQuery) ||
        // Tìm theo mô tả
        (policy.policyDescription || "").toLowerCase().includes(lowerCaseQuery)
      )
    }

    return {
      club: clubPolicies.filter(filterPolicy),
      member: memberPolicies.filter(filterPolicy),
    }
  }, [searchQuery, clubPolicies, memberPolicies])

  // renderPolicyCard to use NEW API fields
  const renderPolicyCard = (policy: MultiplierPolicy) => {
    const statusConfig = getStatusConfig(policy.targetType) //  Simplified
    const MultiplierIcon = getMultiplierIcon(policy.multiplier)
    const StatusIcon = statusConfig.icon // Simplified

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
              <div
                className={`p-2 rounded-lg ${statusConfig.color} flex-shrink-0`}
              >
                <StatusIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                {/* <CardTitle className="text-base sm:text-xl truncate"> */}
                <CardTitle className="text-base sm:text-xl">
                  {policy.ruleName}
                </CardTitle>{" "}
                {/* policy.ruleName */}
                <CardDescription className="flex items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm">
                  <Activity className="h-3 w-3 flex-shrink-0" />{" "}
                  {/* Icon */}
                  {/* <span className="truncate">{policy.activityType}</span>{" "} */}
                  <span>{policy.activityType}</span>{" "}
                  {/* policy.activityType */}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-3 sm:pt-0">
          {/* Multiplier Badge */}
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={`px-3 sm:px-3 py-1 sm:py-1 text-sm sm:text-2xl font-bold ${getMultiplierBadgeColor(
                policy.multiplier
              )}`}
            >
              <MultiplierIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-1" />
              <span className="hidden sm:inline">{policy.multiplier}x</span>
              <span className="sm:hidden">{policy.multiplier}</span>
            </Badge>
          </div>
          {/* Points Calculation Visual - (only depends on multiplier) */}
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border border-muted">
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
              <span className="font-mono font-bold truncate">Base Points</span>
              <span className="text-lg sm:text-xl flex-shrink-0">×</span>
              <Badge
                variant="outline"
                className={`${getMultiplierBadgeColor(
                  policy.multiplier
                )} text-xs sm:text-sm`}
              >
                <Percent className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {(policy.multiplier * 100).toFixed(0)}%
                </span>
              </Badge>
              <span className="text-lg sm:text-xl flex-shrink-0">=</span>
              <span className="font-mono font-bold truncate">Final Points</span>
            </div>
            <div className="text-center text-xs text-muted-foreground mt-2 truncate">
              {policy.multiplier > 1
                ? `+${((policy.multiplier - 1) * 100).toFixed(0)}% bonus points`
                : policy.multiplier < 1
                  ? `${((1 - policy.multiplier) * 100).toFixed(0)}% point reduction`
                  : "No modification to base points"}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-1.5 pt-3 border-t">
            {/*  Thresholds */}
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex items-center gap-1 truncate">
                <Gauge className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Min Threshold</span>
              </span>
              <span
                className={`font-semibold ${statusConfig.textColor} truncate`}
              >
                {policy.minThreshold}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex items-center gap-1 truncate">
                <Gauge className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Max Threshold</span>
              </span>
              <span
                className={`font-semibold ${statusConfig.textColor} truncate`}
              >
                {policy.maxThreshold}
              </span>
            </div>
            {/* Condition Type */}
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex items-center gap-1 truncate">
                <Layers className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Condition Type</span>
              </span>
              <Badge variant="outline" className="flex-shrink-0">
                {policy.conditionType}
              </Badge>
            </div>

            {/* Status (active) */}
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex items-center gap-1 truncate">
                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Status</span>
              </span>
              <Badge
                variant={policy.active ? "default" : "secondary"}
                className="flex-shrink-0"
              >
                {policy.active ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Updated By */}
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex items-center gap-1 truncate">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Updated By</span>
              </span>
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded flex-shrink-0 truncate max-w-[150px]">
                {policy.updatedBy || "Unknown"}
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
            {/* Create Button with Modal (New Form) */}
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
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
                    <Label htmlFor="targetType">Target Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.targetType}
                      onValueChange={(value: PolicyTargetType) =>
                        setFormData({ ...formData, targetType: value })
                      }
                    >
                      <SelectTrigger id="targetType" className="border-slate-300">
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

                  {/* Rule Name */}
                  <div className="space-y-2">
                    <Label htmlFor="ruleName">Rule Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="ruleName"
                      placeholder="e.g., High Activity Bonus"
                      value={formData.ruleName}
                      onChange={e =>
                        setFormData({ ...formData, ruleName: e.target.value })
                      }
                      className="border-slate-300"
                    />
                  </div>

                  {/* Activity Type */}
                  <div className="space-y-2">
                    <Label htmlFor="activityType">Activity Type <span className="text-red-500">*</span></Label>
                    <Input
                      id="activityType"
                      placeholder="e.g., EVENT_PARTICIPATION"
                      value={formData.activityType}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          activityType: e.target.value,
                        })
                      }
                      className="border-slate-300"
                    />
                  </div>

                  {/* Policy Description */}
                  <div className="space-y-2">
                    <Label htmlFor="policyDescription">Policy Description</Label>
                    <Textarea
                      id="policyDescription"
                      placeholder="e.g., Applies to clubs with high event participation..."
                      value={formData.policyDescription || ""}
                      onChange={e =>
                        setFormData({ ...formData, policyDescription: e.target.value })
                      }
                      className="border-slate-300"
                    />
                  </div>

                  {/* Condition Type */}
                  <div className="space-y-2">
                    <Label htmlFor="conditionType">Condition Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.conditionType}
                      onValueChange={(value: ConditionType) => {
                        let currentMax = formData.maxThresholdString;
                        if (value === 'PERCENTAGE') {
                          const numValue = parseIntWithCommas(currentMax);
                          if (numValue > 101) {
                            currentMax = "101"; // Giới hạn lại
                          }
                        }
                        setFormData({
                          ...formData,
                          conditionType: value,
                          maxThresholdString: currentMax, // Cập nhật lại max
                        });
                      }}
                    >
                      <SelectTrigger id="conditionType" className="border-slate-300">
                        <SelectValue placeholder="Select condition type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                        <SelectItem value="ABSOLUTE">ABSOLUTE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Min/Max Threshold */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minThreshold">Min Threshold <span className="text-red-500">*</span></Label>
                      {/* <Input
                        id="minThreshold"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formData.minThresholdString}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            minThresholdString: e.target.value.replace(/[^0-9]/g, ''),
                          })
                        }
                        className="border-slate-300"
                      /> */}
                      <div className="relative">
                        <Input
                          id="minThreshold"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={formData.minThresholdString}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              minThresholdString: e.target.value.replace(/[^0-9]/g, ''),
                            })
                          }
                          className="border-slate-300 pr-8" // Thêm padding
                        />
                        {formData.conditionType === 'PERCENTAGE' && (
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxThreshold">Max Threshold <span className="text-red-500">*</span></Label>
                      {/* <Input
                        id="maxThreshold"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formData.maxThresholdString}
                        onChange={e => {
                          const cleanedValue = e.target.value.replace(/[^0-9]/g, '');
                          let finalValue = cleanedValue;

                          if (formData.conditionType === 'PERCENTAGE') {
                            const numValue = parseInt(cleanedValue);
                            if (!isNaN(numValue) && numValue > 101) {
                              finalValue = "101"; // Giới hạn
                            }
                          }

                          setFormData({
                            ...formData,
                            maxThresholdString: finalValue,
                          });
                        }}
                        className="border-slate-300"
                      /> */}
                      <div className="relative">
                        <Input
                          id="maxThreshold"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={formData.maxThresholdString}
                          onChange={e => {
                            const cleanedValue = e.target.value.replace(/[^0-9]/g, '');
                            let finalValue = cleanedValue;

                            if (formData.conditionType === 'PERCENTAGE') {
                              const numValue = parseInt(cleanedValue);
                              if (!isNaN(numValue) && numValue > 101) {
                                finalValue = "101"; // Giới hạn
                              }
                            }

                            setFormData({
                              ...formData,
                              maxThresholdString: finalValue,
                            });
                          }}
                          className="border-slate-300 pr-8" // Thêm padding
                        />
                        {formData.conditionType === 'PERCENTAGE' && (
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multiplier */}
                  <div className="space-y-2">
                    <Label htmlFor="multiplier">Multiplier <span className="text-red-500">*</span></Label>
                    <Input
                      id="multiplier"
                      type="text"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="1.0"
                      value={formData.multiplierString}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          multiplierString: e.target.value.replace(/[^0-9,.]/g, ''),
                        })
                      }
                      className="border-slate-300 w-full sm:w-1/3"
                    />
                    <p className="text-xs text-muted-foreground">
                      e.g., 1.5 = +50%, 0.8 = -20%, 1.0 = no change
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
                  Update the details for this multiplier policy.
                </DialogDescription>
              </DialogHeader>

              {selectedPolicy && editFormData && (
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                  {/* Policy ID (display only) */}
                  <div className="space-y-2 w-full sm:w-1/3">
                    <Label>Policy ID</Label>
                    <Input
                      value={selectedPolicy.id}
                      disabled
                      className="bg-muted cursor-not-allowed border-slate-400"
                    />
                  </div>

                  {/* Target Type (editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="editTargetType">
                      Target Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={editFormData.targetType}
                      onValueChange={(value: PolicyTargetType) =>
                        setEditFormData({ ...editFormData, targetType: value })
                      }
                    >
                      <SelectTrigger id="editTargetType" className="border-slate-300">
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

                  {/* Rule Name (editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="editRuleName">
                      Rule Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="editRuleName"
                      placeholder="e.g., High Activity Bonus"
                      value={editFormData.ruleName}
                      onChange={e =>
                        setEditFormData({
                          ...editFormData,
                          ruleName: e.target.value,
                        })
                      }
                      className="border-slate-300"
                    />
                  </div>

                  {/* Activity Type (editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="editActivityType">
                      Activity Type <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="editActivityType"
                      placeholder="e.g., EVENT_PARTICIPATION"
                      value={editFormData.activityType}
                      onChange={e =>
                        setEditFormData({
                          ...editFormData,
                          activityType: e.target.value,
                        })
                      }
                      className="border-slate-300"
                    />
                  </div>

                  {/* Policy Description (editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="editPolicyDescription">
                      Policy Description
                    </Label>
                    <Textarea
                      id="editPolicyDescription"
                      placeholder="e.g., Applies to clubs with high event participation..."
                      value={editFormData.policyDescription || ""}
                      onChange={e =>
                        setEditFormData({
                          ...editFormData,
                          policyDescription: e.target.value,
                        })
                      }
                      className="border-slate-300"
                    />
                  </div>

                  {/* Condition Type (editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="editConditionType">
                      Condition Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={editFormData.conditionType}
                      // onValueChange={(value: ConditionType) =>
                      //   setEditFormData({
                      //     ...editFormData,
                      //     conditionType: value,
                      //   })
                      // }
                      onValueChange={(value: ConditionType) => {
                        let currentMax = editFormData.maxThresholdString || "";
                        if (value === 'PERCENTAGE') {
                          const numValue = parseIntWithCommas(currentMax);
                          if (numValue > 101) {
                            currentMax = "101"; // Giới hạn
                          }
                        }
                        setEditFormData({
                          ...editFormData,
                          conditionType: value,
                          maxThresholdString: currentMax,
                        });
                      }}
                    >
                      <SelectTrigger id="editConditionType" className="border-slate-300">
                        <SelectValue placeholder="Select condition type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                        <SelectItem value="ABSOLUTE">ABSOLUTE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Min/Max Threshold (editable) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editMinThreshold">
                        Min Threshold <span className="text-red-500">*</span>
                      </Label>
                      {/* <Input
                        id="editMinThreshold"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={editFormData.minThresholdString || ""} // Lấy từ trường string mới
                        onChange={e =>
                          setEditFormData({
                            ...editFormData,
                            minThresholdString: e.target.value.replace(/[^0-9]/g, ''), // Chỉ cho phép số
                          })
                        }
                        className="border-slate-300"
                      /> */}
                      <div className="relative">
                        <Input
                          id="editMinThreshold"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={editFormData.minThresholdString || ""} // Lấy từ trường string mới
                          onChange={e =>
                            setEditFormData({
                              ...editFormData,
                              minThresholdString: e.target.value.replace(/[^0-9]/g, ''), // Chỉ cho phép số
                            })
                          }
                          className="border-slate-300 pr-8" // Thêm padding
                        />
                        {editFormData.conditionType === 'PERCENTAGE' && (
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editMaxThreshold">
                        Max Threshold <span className="text-red-500">*</span>
                      </Label>
                      {/* <Input
                        id="editMaxThreshold"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={editFormData.maxThresholdString || ""} // Lấy từ trường string mới
                        onChange={e => {
                          const cleanedValue = e.target.value.replace(/[^0-9]/g, '');
                          let finalValue = cleanedValue;

                          if (editFormData.conditionType === 'PERCENTAGE') {
                            const numValue = parseInt(cleanedValue);
                            if (!isNaN(numValue) && numValue > 101) {
                              finalValue = "101"; // Giới hạn
                            }
                          }

                          setEditFormData({
                            ...editFormData,
                            maxThresholdString: finalValue,
                          });
                        }}
                        className="border-slate-300"
                      /> */}
                      <div className="relative">
                        <Input
                          id="editMaxThreshold"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={editFormData.maxThresholdString || ""} // Lấy từ trường string mới
                          onChange={e => {
                            const cleanedValue = e.target.value.replace(/[^0-9]/g, '');
                            let finalValue = cleanedValue;

                            if (editFormData.conditionType === 'PERCENTAGE') {
                              const numValue = parseInt(cleanedValue);
                              if (!isNaN(numValue) && numValue > 101) {
                                finalValue = "101"; // Giới hạn
                              }
                            }

                            setEditFormData({
                              ...editFormData,
                              maxThresholdString: finalValue,
                            });
                          }}
                          className="border-slate-300 pr-8" // Thêm padding
                        />
                        {editFormData.conditionType === 'PERCENTAGE' && (
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Multiplier (editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="editMultiplier">
                      Multiplier <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="editMultiplier"
                      type="text"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="1.0"
                      value={editFormData.multiplierString || ""} // Lấy từ trường string mới
                      onChange={e =>
                        setEditFormData({
                          ...editFormData,
                          multiplierString: e.target.value.replace(/[^0-9,.]/g, ''), // Cho phép số, dấu phẩy, dấu chấm
                        })
                      }
                      className="font-mono text-lg border-slate-300 w-full sm:w-1/3"
                    />
                  </div>

                  {/* Status (editable) */}
                  <div className="space-y-2">
                    <Label htmlFor="editStatus">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={String(editFormData.active)} // Chuyển boolean thành string
                      onValueChange={(value: string) =>
                        setEditFormData({
                          ...editFormData,
                          active: value === "true", // Chuyển string về boolean
                        })
                      }
                    >
                      <SelectTrigger id="editStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="false">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            Inactive
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Updated By (display only) */}
                  <div className="space-y-2">
                    <Label htmlFor="editUpdatedBy">Updated By</Label>
                    <Input
                      id="editUpdatedBy"
                      type="text"
                      value={currentUserInfo.name}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="sm:justify-between">
                <Button
                  variant="destructive"
                  className="gap-2"
                  disabled={isEditing} // Vẫn disable khi đang editing
                  onClick={() => {
                    if (selectedPolicy) {
                      handleDeletePolicy(selectedPolicy)
                      setIsEditModalOpen(false) // Đóng modal edit
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                  Delete Policy
                </Button>

                <div className="flex gap-2">
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
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>

            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          {/* Delete Confirmation Dialog (Updated fields) */}
          <Dialog
            open={!!policyToDelete}
            onOpenChange={() => setPolicyToDelete(null)}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Delete Multiplier Policy
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this policy? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>

              {policyToDelete && (
                <div className="space-y-3 py-4">
                  <div className="p-4 rounded-lg border-2 border-destructive/20 bg-destructive/5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Policy ID:
                        </span>
                        <span className="font-bold">
                          #{policyToDelete.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Rule Name:
                        </span>
                        <span className="font-semibold text-right">
                          {policyToDelete.ruleName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Target Type:
                        </span>
                        <Badge variant="outline">
                          {policyToDelete.targetType}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Multiplier:
                        </span>
                        <Badge
                          className={`${getMultiplierBadgeColor(
                            policyToDelete.multiplier
                          )}`}
                        >
                          {policyToDelete.multiplier}x
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      Warning: Deleting this policy will immediately affect all
                      future point calculations.
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
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle className="text-sm font-medium truncate">Total Policies</CardTitle>
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300 truncate">
                  {currentStats.totalPolicies}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Active {activeTab.toLowerCase()} policies
                </p>
              </CardContent>
            </Card>

            {/* Average Multiplier */}
            <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle className="text-sm font-medium truncate">Average Multiplier</CardTitle>
                <Percent className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-300 truncate">
                  {currentStats.avgMultiplier.toFixed(2)}x
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Mean point multiplier
                </p>
              </CardContent>
            </Card>

            {/* Max Multiplier */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle className="text-sm font-medium truncate">Highest Multiplier</CardTitle>
                <Award className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-0">
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Tabs List */}
              {/* <TabsList className="grid w-full sm:w-auto sm:max-w-md grid-cols-2"> */}
              <TabsList className="grid w-full sm:w-2/5 sm:max-w-2xl grid-cols-2">
                <TabsTrigger value="CLUB" className="group flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Club Policies</span>
                  {/* Cập nhật số lượng hiển thị */}
                  <Badge variant="secondary"
                    // className="ml-1 text-xs flex-shrink-0"
                    className="ml-1 text-xs flex-shrink-0 group-data-[state=active]:bg-white group-data-[state=active]:text-black"
                  >{filteredPolicies.club.length}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger value="MEMBER" className=" group flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Member Policies</span>
                  {/* Cập nhật số lượng hiển thị */}
                  <Badge variant="secondary"
                    // className="ml-1 text-xs flex-shrink-0"
                    className="ml-1 text-xs flex-shrink-0 group-data-[state=active]:bg-white group-data-[state=active]:text-black"
                  >{filteredPolicies.member.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Thanh Tìm Kiếm Mới */}
              {/* <div className="relative w-full sm:w-auto sm:max-w-xs"> */}
              <div className="relative w-full sm:w-1/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 w-full border-slate-300 bg-white"
                />
                {/* Nút Clear (X) */}
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>

            {/* Club Policies Tab */}
            <TabsContent value="CLUB" className="space-y-4 mt-6">
              {loadingClub ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
              ) : filteredPolicies.club.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-base sm:text-lg font-medium">
                      {searchQuery ? "No policies match your search" : "No Club Policies Found"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                      {searchQuery ? "Try searching for a different name or activity type." : "No multiplier policies are configured for clubs yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))]">
                  {filteredPolicies.club
                    .sort((a, b) => b.multiplier - a.multiplier) // Sort by multiplier descending
                    .map(policy => renderPolicyCard(policy))}
                </div>
              )}
            </TabsContent>

            {/* Member Policies Tab */}
            <TabsContent value="MEMBER" className="space-y-4 mt-6">
              {loadingMember ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
              ) : filteredPolicies.member.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-base sm:text-lg font-medium">
                      {searchQuery ? "No policies match your search" : "No Member Policies Found"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                      {searchQuery ? "Try searching for a different name or activity type." : "No multiplier policies are configured for members yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))]">
                  {filteredPolicies.member
                    .sort((a, b) => b.multiplier - a.multiplier) // Sort by multiplier descending
                    .map(policy => renderPolicyCard(policy))}
                </div>

              )}
            </TabsContent>
          </Tabs>

          {/* Info Card */}
          {/* Info Card (Updated text) */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <AlertCircle className="h-5 w-5" />
                How Multipliers Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Point Multipliers</strong> adjust the base points earned
                based on the rules defined:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Multiplier &gt; 1.0:</strong> Bonus points (e.g., 1.3x =
                  +30% points)
                </li>
                <li>
                  <strong>Multiplier = 1.0:</strong> Standard points (no
                  change)
                </li>
                <li>
                  <strong>Multiplier &lt; 1.0:</strong> Reduced points (e.g.,
                  0.8x = -20% points)
                </li>
                <li>
                  <strong>Multiplier = 0:</strong> No points awarded
                </li>
              </ul>
              <p className="pt-2">
                <strong>Min/Max Thresholds</strong> define the range for which this policy rule applies (e.g., applies when activity count is between 10 and 20).
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute >
  )
}
