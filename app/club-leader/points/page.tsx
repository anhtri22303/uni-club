"use client"

import React, { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useData } from "@/contexts/data-context"
import membershipApi, { ApiMembership } from "@/service/membershipApi"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Users, Award, ChevronLeft, ChevronRight, Send, Filter, X, Wallet, History, TriangleAlert, PlusCircle } from "lucide-react"
import { getClubById, getClubIdFromToken } from "@/service/clubApi"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getClubWallet, ApiClubWallet, rewardPointsToMembers, getClubToMemberTransactions, ApiClubToMemberTransaction } from "@/service/walletApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { createPointRequest } from "@/service/pointRequestsApi"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { getClubPenaltyRules, PenaltyRule, createClubPenalty } from "@/service/disciplineApi"

interface ClubMember {
  id: string;
  userId: string;
  clubId: string;
  role: string;
  status: string;
  joinedAt: string | null;
}

export default function ClubLeaderRewardDistributionPage() {
  const { clubMemberships } = useData()
  const { toast } = useToast()
  const [managedClub, setManagedClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [clubWallet, setClubWallet] = useState<ApiClubWallet | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  // === State và Logic tải dữ liệu thành viên (Tái sử dụng) ===
  const [apiMembers, setApiMembers] = useState<ApiMembership[] | null>(null)
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({})
  const [targetUserIds, setTargetUserIds] = useState<number[]>([]) // ✨ State lưu danh sách userId đã chọn
  // State filters
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)
  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [transactions, setTransactions] = useState<ApiClubToMemberTransaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  // === State cho modal xin điểm ===
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestPoints, setRequestPoints] = useState<number | ''>('')
  const [requestReason, setRequestReason] = useState("")
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  // === State cho chức năng PHẠT ===
  const [showPenaltyModal, setShowPenaltyModal] = useState(false)
  const [penaltyRules, setPenaltyRules] = useState<PenaltyRule[]>([])
  const [penaltyRulesLoading, setPenaltyRulesLoading] = useState(false)
  const [selectedRuleId, setSelectedRuleId] = useState<number | ''>('')
  const [penaltyReason, setPenaltyReason] = useState("")
  const [isSubmittingPenalty, setIsSubmittingPenalty] = useState(false)
  // Lưu member được chọn để phạt
  const [memberToPenalize, setMemberToPenalize] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setMembersLoading(true)
      setPenaltyRulesLoading(true) // Bắt đầu tải luật phạt

      try {
        const clubId = getClubIdFromToken()
        if (!clubId) throw new Error("No club information found")

        const clubResponse = await getClubById(clubId)
        setManagedClub(clubResponse.data)

        // Load club wallet
        setWalletLoading(true)
        try {
          const walletData = await getClubWallet(clubId)
          setClubWallet(walletData)
        } catch (walletErr) {
          console.error("Failed to load club wallet:", walletErr)
        } finally {
          setWalletLoading(false)
        }

        // Load penalty rules 
        try {
          const rules = await getClubPenaltyRules({ clubId })
          setPenaltyRules(rules)
        } catch (ruleErr) {
          console.error("Failed to load penalty rules:", ruleErr)
        } finally {
          setPenaltyRulesLoading(false)
        }

        // Load members - no need to fetch user data separately as it's included in membership data
        const memberData = await membershipApi.getMembersByClubId(clubId)
        setApiMembers(memberData)
      } catch (err: any) {
        setMembersError(err.message || "Error loading members")
      } finally {
        setMembersLoading(false)
        setLoading(false)
      }
    }

    loadData()
  }, [])
  // Chon thanh vien cu the de phan diem
  useEffect(() => {
    if (apiMembers && apiMembers.length > 0) {
      setSelectedMembers((prevSelected) => {
        // Only update if we don't have any selections yet or the members have changed
        const currentMemberIds = Object.keys(prevSelected)
        const newMemberIds = apiMembers.map((m: any) => m.membershipId ?? `m-${m.userId}`)

        // If we already have selections and the IDs match, don't update
        if (currentMemberIds.length === newMemberIds.length &&
          newMemberIds.every(id => id in prevSelected)) {
          return prevSelected
        }

        // Otherwise, create new selection state
        const initialSelected: Record<string, boolean> = {}
        apiMembers.forEach((m: any) => {
          const id = m.membershipId ?? `m-${m.userId}`
          initialSelected[id] = false
        })
        return initialSelected
      })
    }
  }, [apiMembers])

  const handleToggleSelect = (memberId: string) => {
    setSelectedMembers((prev) => {
      const newState = !prev[memberId]

      // Cập nhật targetUserIds ngay lập tức
      // Tìm member để lấy userId
      const member = clubMembers.find(m => m.id === memberId)
      if (member) {
        const numericUserId = Number(member.userId)
        setTargetUserIds((prevIds) => {
          if (newState) {
            // Thêm vào nếu chưa có
            return prevIds.includes(numericUserId) ? prevIds : [...prevIds, numericUserId]
          } else {
            // Xóa khỏi danh sách
            return prevIds.filter(id => id !== numericUserId)
          }
        })
      }

      return { ...prev, [memberId]: newState }
    })
  }

  const clubMembers = managedClub
    ? (apiMembers ?? [])
      .filter((m: any) => String(m.clubId) === String(managedClub.id) && m.state === "ACTIVE")
      .map((m: any) => {
        return {
          id: m.membershipId ?? `m-${m.userId}`,
          userId: m.userId,
          fullName: m.fullName ?? `User ${m.userId}`,
          studentCode: m.studentCode ?? "—",
          avatarUrl: m.avatarUrl ?? null,
          role: m.clubRole ?? "MEMBER",
          isStaff: m.staff ?? false,
        }
      })
    : []

  const filteredMembers = clubMembers.filter((member) => {
    // Tìm kiếm theo tên hoặc mã sinh viên
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchName = member.fullName.toLowerCase().includes(searchLower)
      const matchStudentCode = member.studentCode.toLowerCase().includes(searchLower)
      if (!matchName && !matchStudentCode) return false
    }
    const roleFilter = activeFilters["role"]
    if (roleFilter && roleFilter !== "all") {
      if (member.role !== roleFilter) return false
    }

    //    THÊM MỚI: Lọc theo Staff
    const staffFilter = activeFilters["staff"]
    if (staffFilter && staffFilter !== "all") {
      const isStaff = staffFilter === "true"
      if (member.isStaff !== isStaff) return false
    }
    return true
  })
  const {
    currentPage: membersPage,
    totalPages: membersPages,
    paginatedData: paginatedMembers,
    setCurrentPage: setMembersPage,
  } = usePagination({ data: filteredMembers, initialPageSize: 8 })

  // === State và Logic phân phát điểm thưởng (Mới) ===
  const [rewardAmount, setRewardAmount] = useState<number | ''>('')
  const [rewardReason, setRewardReason] = useState("")
  const [isDistributing, setIsDistributing] = useState(false)
  // State filters
  const uniqueRoles = Array.from(new Set(clubMembers.map((m) => m.role)))
  const handleFilterChange = (filterKey: string, value: any) => {
    setActiveFilters((prev) => ({ ...prev, [filterKey]: value }))
    setMembersPage(1)
  }
  const hasActiveFilters = Object.values(activeFilters).some((v) => v && v !== "all") || Boolean(searchTerm)

  const allFilteredSelected = useMemo(() => {
    if (filteredMembers.length === 0) {
      return false // Không có gì để chọn
    }
    // Kiểm tra xem *mọi* thành viên trong danh sách đã lọc có 'true' trong selectedMembers không
    return filteredMembers.every((member) => selectedMembers[member.id] === true)
  }, [filteredMembers, selectedMembers])

  const handleRewardAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Chỉ cho phép nhập số nguyên dương
    if (value === '' || /^\d+$/.test(value)) {
      setRewardAmount(value === '' ? '' : parseInt(value, 10))
    }
  }

  const handleToggleSelectAll = () => {
    const newSelectionState = !allFilteredSelected

    // Cập nhật trạng thái chọn *chỉ* cho các thành viên trong danh sách đã lọc
    setSelectedMembers((prevSelected) => {
      const newSelected = { ...prevSelected }
      filteredMembers.forEach((member) => {
        newSelected[member.id] = newSelectionState
      })
      return newSelected
    })

    // Cập nhật targetUserIds
    if (newSelectionState) {
      // Select all: thêm tất cả filteredMembers vào targetUserIds
      setTargetUserIds((prevIds) => {
        const newIds = filteredMembers.map(member => Number(member.userId))
        const merged = [...prevIds]
        newIds.forEach(id => {
          if (!merged.includes(id)) {
            merged.push(id)
          }
        })
        return merged
      })
    } else {
      // Deselect all: xóa tất cả filteredMembers khỏi targetUserIds
      setTargetUserIds((prevIds) => {
        const idsToRemove = filteredMembers.map(member => Number(member.userId))
        return prevIds.filter(id => !idsToRemove.includes(id))
      })
    }
  }

  const handleCreatePointRequest = async () => {
    if (!managedClub?.id) {
      toast({ title: "Error", description: "Club information is not loaded.", variant: "destructive" })
      return
    }
    if (requestPoints === '' || requestPoints <= 0) {
      toast({ title: "Invalid points", description: "Please enter a positive number of points.", variant: "destructive" })
      return
    }
    if (!requestReason.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason for the request.", variant: "destructive" })
      return
    }

    setIsSubmittingRequest(true)
    try {
      const payload = {
        clubId: managedClub.id,
        requestedPoints: requestPoints as number,
        reason: requestReason,
      }
      // Giả sử file pointRequestsApi.ts nằm trong @/service/
      await createPointRequest(payload)

      toast({
        title: "Request Submitted",
        description: "Your request for points has been sent to the university staff for review."
      })

      // Reset form và đóng modal
      setShowRequestModal(false)
      setRequestPoints('')
      setRequestReason("")

    } catch (err: any) {
      toast({
        title: "Submission Error",
        description: err?.response?.data?.message || "Failed to submit point request.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  const handleDistributeRewards = async () => {
    if (rewardAmount === '' || rewardAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a bonus point number greater than 0.",
        variant: "destructive"
      })
      return
    }

    if (!rewardReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for distributing points.",
        variant: "destructive"
      })
      return
    }

    if (clubMembers.length === 0) {
      toast({
        title: "Notification",
        description: "There are no members to distribute points to."
      })
      return
    }
    setIsDistributing(true)

    // ✨ Kiểm tra targetUserIds thay vì filter lại
    if (targetUserIds.length === 0) {
      toast({
        title: "No members selected",
        description: "Please select at least one member to distribute points.",
        variant: "destructive"
      })
      setIsDistributing(false)
      return
    }

    try {
      // Sử dụng targetUserIds đã được chuẩn bị sẵn
      const response = await rewardPointsToMembers(
        targetUserIds,
        rewardAmount as number,
        rewardReason.trim()
      )

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || `Distributed ${rewardAmount} points to ${targetUserIds.length} member(s) of ${managedClub.name}.`
        })

        // Reload club wallet balance
        try {
          const walletData = await getClubWallet(managedClub.id)
          setClubWallet(walletData)
        } catch (walletErr) {
          console.error("Failed to reload club wallet:", walletErr)
        }

        setRewardAmount('') // Reset số điểm sau khi thành công
        setRewardReason('') // Reset reason sau khi thành công
        // ✨ Reset selections
        setSelectedMembers({})
        setTargetUserIds([])
      } else {
        throw new Error(response.message || "Failed to distribute points")
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "An error occurred while distributing points."
      const isTimeout = err?.code === 'ECONNABORTED' || errorMessage.toLowerCase().includes('timeout')

      toast({
        title: isTimeout ? "Request Timeout" : "Delivery error",
        description: isTimeout
          ? `The request took too long (processing ${targetUserIds.length} members). The points may still be distributed successfully. Please check the transaction history.`
          : errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsDistributing(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setActiveFilters({})
    setMembersPage(1)
  }

  const loadTransactionHistory = async () => {
    setTransactionsLoading(true)
    try {
      const data = await getClubToMemberTransactions()
      setTransactions(data)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load transaction history",
        variant: "destructive"
      })
    } finally {
      setTransactionsLoading(false)
    }
  }

  const handleOpenHistoryModal = () => {
    setShowHistoryModal(true)
    loadTransactionHistory()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  const handleOpenPenaltyModal = (member: any) => {
    setMemberToPenalize(member)
    setSelectedRuleId('')
    setPenaltyReason("")
    setShowPenaltyModal(true)
  }
  const handleCreatePenalty = async () => {
    // if (!managedClub?.id || !memberToPenalize) {
    //   toast({ title: "Error", description: "Club or member information is missing.", variant: "destructive" })
    //   return
    // }
    if (selectedRuleId === '') {
      toast({ title: "Rule required", description: "Please select a penalty rule.", variant: "destructive" })
      return
    }
    if (!penaltyReason.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason or note for this penalty.", variant: "destructive" })
      return
    }
    const rule = penaltyRules.find(r => r.id === selectedRuleId)
    if (!rule) {
      toast({ title: "Rule not found", description: "Selected penalty rule is invalid.", variant: "destructive" })
      return
    }

    setIsSubmittingPenalty(true)
    try {
      const payload = {
        // Lấy membershipId từ memberToPenalize.id (đã được map thành membershipId)
        // Cần đảm bảo member.id là membershipId thật sự (hoặc chuyển đổi từ `m-${userId}` sang membershipId nếu cần)
        // Dựa trên mapping: m.membershipId ?? `m-${m.userId}`. Ta dùng membershipId.
        // Giả sử member.id là Membership ID
        membershipId: Number(memberToPenalize.id),
        ruleId: selectedRuleId as number,
        // reason: penaltyReason.trim() || rule.description, // Dùng mô tả Rule nếu Leader không nhập gì
        reason: penaltyReason.trim(), // Đảm bảo sử dụng reason đã nhập
        // eventId: 0, // Dựa trên Swagger đã remove EventId. Giữ lại nếu API backend yêu cầu, hoặc xóa. Tôi sẽ giữ theo API gốc để tránh lỗi.
      }

      // TẠO PHIẾU PHẠT
      await createClubPenalty({ clubId: managedClub.id, body: payload })

      toast({
        title: "Penalty Issued",
        description: `Issued a penalty of -${rule.penaltyPoints} pts to ${memberToPenalize.fullName}.`
      })

      // Reset form và đóng modal
      setShowPenaltyModal(false)
      setMemberToPenalize(null)
      setSelectedRuleId('')
      setPenaltyReason("")

    } catch (err: any) {
      toast({
        title: "Issuing Error",
        description: err?.response?.data?.message || "Failed to create penalty ticket.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingPenalty(false)
    }
  }


  // Component Pager đơn giản
  const MinimalPager = ({ current, total, onPrev, onNext }: { current: number; total: number; onPrev: () => void; onNext: () => void }) =>
    total > 1 ? (
      <div className="flex items-center justify-center gap-3 mt-4">
        <Button aria-label="Previous page" variant="outline" size="sm" className="h-8 w-8 p-0 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700" onClick={onPrev} disabled={current === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[2rem] text-center text-sm font-medium dark:text-slate-300">Trang {current} / {total}</div>
        <Button aria-label="Next page" variant="outline" size="sm" className="h-8 w-8 p-0 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700" onClick={onNext} disabled={current === total}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    ) : null


  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 dark:text-white">
              <Award className="h-8 w-8 text-yellow-500 dark:text-yellow-400" /> Reward Point Distribution
            </h1>
            <p className="text-muted-foreground dark:text-slate-400">Distribute bonus points from club funds to members of "<span className="font-semibold text-primary dark:text-blue-400">{managedClub?.name}</span>"</p>
          </div>

          {/* Club Wallet Balance Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-800/50">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                    <Wallet className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground dark:text-slate-400">Club Balance</p>
                    {walletLoading ? (
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">Loading...</p>
                    ) : clubWallet && clubWallet.balancePoints !== undefined ? (
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {clubWallet.balancePoints.toLocaleString()} pts
                      </p>
                    ) : (
                      <p className="text-3xl font-bold text-gray-400 dark:text-slate-500">N/A</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {clubWallet && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground dark:text-slate-400">Wallet ID</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300">#{clubWallet.walletId}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenHistoryModal}
                    className="flex items-center gap-2 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <History className="h-4 w-4" />
                    History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History Modal */}
          <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
            <DialogContent
              className="
                !max-w-none
                w-[72vw]           /* nhỏ hơn 98vw */
                lg:w-[68vw]        /* nhỏ thêm trên màn lớn */
                md:w-[78vw]
                sm:w-[92vw]
                h-[85vh]
                overflow-y-auto p-8 rounded-xl shadow-2xl
                "
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-3xl font-bold dark:text-white">
                  <History className="h-9 w-9" />
                  Club to Member Transaction History
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                {transactionsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground dark:text-slate-400">Loading transaction history...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-12 w-12 text-muted-foreground dark:text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 dark:text-white">No Transactions Yet</h3>
                    <p className="text-muted-foreground dark:text-slate-400">No club-to-member transactions found.</p>
                  </div>
                ) : (
                  <TooltipProvider>
                    <div className="rounded-md border dark:border-slate-700 overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow className="dark:border-slate-700">
                            <TableHead className="w-[80px] dark:text-slate-300">ID</TableHead>
                            <TableHead className="dark:text-slate-300">Type</TableHead>
                            <TableHead className="dark:text-slate-300">Amount</TableHead>
                            <TableHead className="w-[20%] dark:text-slate-300">Sender</TableHead>
                            <TableHead className="w-[20%] dark:text-slate-300">Receiver</TableHead>
                            <TableHead className="w-[15%] dark:text-slate-300 pr-2">Description</TableHead>
                            <TableHead className="w-[180px] dark:text-slate-300 pl-2">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((t) => (
                            <TableRow key={t.id} className="dark:border-slate-700 dark:hover:bg-slate-800">
                              <TableCell className="font-medium dark:text-slate-300">#{t.id}</TableCell>
                              <TableCell><Badge variant="secondary" className="dark:bg-slate-700 dark:text-slate-300">{t.type}</Badge></TableCell>
                              <TableCell className="font-semibold text-green-600 dark:text-green-400">+{t.amount} pts</TableCell>
                              <TableCell className="font-medium text-purple-600 dark:text-purple-400">
                                {t.senderName || "—"}
                              </TableCell>
                              <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                                {t.receiverName || "—"}
                              </TableCell>
                              <TableCell className="dark:text-slate-300 max-w-[200px] pr-2">
                                {t.description && t.description.length > 50 ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="truncate cursor-help">
                                        {t.description}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[400px] break-words" side="top">
                                      <p className="whitespace-normal">{t.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <div className="truncate">{t.description || "—"}</div>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground dark:text-slate-400 whitespace-nowrap pl-2">
                                {formatDate(t.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TooltipProvider>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* === Modal Xin Thêm Điểm === */}
          <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 dark:text-white">
                  <PlusCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  Request Additional Club Points
                </DialogTitle>
                <DialogDescription className="dark:text-slate-400">
                  Submit a request to the university staff to add more points to your club's wallet.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="req-points" className="text-right">
                    Points
                  </Label>

                  <Input
                    id="req-points"
                    type="text" // <-- 1. Chuyển từ "number" sang "text"
                    inputMode="numeric" // <-- 2. Thêm để hiển thị bàn phím số trên di động
                    placeholder="e.g., 1,000,000"
                    // 3. Hiển thị giá trị đã được định dạng
                    value={
                      requestPoints === ''
                        ? ''
                        : new Intl.NumberFormat('en-US').format(requestPoints)
                    }
                    // 4. Khi thay đổi, lọc bỏ dấu phẩy để cập nhật state
                    onChange={(e) => {
                      const value = e.target.value
                      const unformattedValue = value.replace(/[^0-9]/g, '') // Bỏ mọi thứ không phải số

                      if (unformattedValue === '') {
                        setRequestPoints('')
                      } else {
                        setRequestPoints(parseInt(unformattedValue, 10))
                      }
                    }}
                    className="col-span-3"
                    disabled={isSubmittingRequest}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="req-reason" className="text-right">
                    Reason
                  </Label>
                  <Textarea
                    id="req-reason"
                    placeholder="e.g., Funding for 'TechSponk 2025' event prizes..."
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    className="col-span-3 min-h-[100px]"
                    disabled={isSubmittingRequest}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRequestModal(false)} disabled={isSubmittingRequest}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePointRequest}
                  disabled={isSubmittingRequest || requestPoints === '' || requestPoints <= 0 || !requestReason.trim()}
                >
                  {isSubmittingRequest ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* === Modal Tạo Phiếu Phạt === */}
          <Dialog open={showPenaltyModal} onOpenChange={setShowPenaltyModal}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-red-600 dark:text-red-500">
                  <TriangleAlert className="h-6 w-6" />
                  Issue Penalty Ticket
                </DialogTitle>
                <DialogDescription className="dark:text-slate-400">
                  Create a penalty ticket for: <span className="font-semibold text-primary dark:text-blue-400">{memberToPenalize?.fullName}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Rule Selection */}
                <div className="space-y-2">
                  <Label htmlFor="penalty-rule" className="text-sm font-medium">Select Violation Rule</Label>
                  <Select
                    value={selectedRuleId === '' ? '' : String(selectedRuleId)}
                    onValueChange={(v) => setSelectedRuleId(Number(v))}
                    disabled={penaltyRulesLoading || isSubmittingPenalty}
                  >
                    <SelectTrigger id="penalty-rule" className="w-full">
                      <SelectValue placeholder={penaltyRulesLoading ? "Loading rules..." : "Choose a violation rule"} />
                    </SelectTrigger>
                    <SelectContent>
                      {penaltyRules.length === 0 ? (
                        <div className="py-2 text-center text-sm text-muted-foreground">No penalty rules configured.</div>
                      ) : (
                        penaltyRules.map((rule) => (
                          <SelectItem key={rule.id} value={String(rule.id)}>
                            <div className="flex justify-between items-center w-full">
                              <span>
                                {rule.name}
                                <Badge variant="destructive" className="ml-2 text-xs h-auto py-0.5">
                                  -{rule.penaltyPoints} pts
                                </Badge>
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedRuleId !== '' && (
                    <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1">
                      Penalty Points: -{penaltyRules.find(r => r.id === selectedRuleId)?.penaltyPoints || 0} pts
                      | Severity: {penaltyRules.find(r => r.id === selectedRuleId)?.level}
                    </p>
                  )}
                </div>

                {/* Custom Reason */}
                <div className="space-y-2">
                  <Label htmlFor="penalty-reason" className="text-sm font-medium">Reason/Notes<span className="text-red-500">*</span></Label>
                  <Textarea
                    id="penalty-reason"
                    placeholder="Add a specific note for this violation (e.g., absent from event A on date B)..."
                    value={penaltyReason}
                    onChange={(e) => setPenaltyReason(e.target.value)}
                    className="min-h-[80px]"
                    disabled={isSubmittingPenalty}
                  />
                </div>

              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPenaltyModal(false)} disabled={isSubmittingPenalty}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePenalty}
                  variant="destructive"
                  // disabled={isSubmittingPenalty || selectedRuleId === ''}
                  disabled={isSubmittingPenalty || selectedRuleId === '' || !penaltyReason.trim()}
                >
                  {isSubmittingPenalty ? "Issuing..." : "Confirm Penalty"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Set up the Point Distribution Index</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reward-amount">Number of Bonus Points (per member)</Label>

                {/* dùng flex (responsive) */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-3">

                  {/* 1. Input ) */}
                  <div className="flex-1 min-w-[200px] mb-2 sm:mb-0">
                    <Input
                      id="reward-amount"
                      type="text" // <-- 1. Chuyển sang "text"
                      inputMode="numeric" // <-- 2. Thêm inputMode
                      placeholder="Enter bonus points..."

                      // 3. Hiển thị giá trị đã định dạng
                      value={
                        rewardAmount === ''
                          ? ''
                          : new Intl.NumberFormat('en-US').format(rewardAmount)
                      }

                      // 4. Cập nhật hàm onChange
                      onChange={(e) => {
                        const value = e.target.value
                        const unformattedValue = value.replace(/[^0-9]/g, '') // Bỏ mọi thứ không phải số

                        if (unformattedValue === '') {
                          setRewardAmount('')
                        } else {
                          setRewardAmount(parseInt(unformattedValue, 10))
                        }
                      }}

                      disabled={isDistributing}
                    />
                  </div>

                  {/* 2. Nút Phân phát (ĐÃ CẬP NHẬT TEXT) */}
                  <Button
                    onClick={handleDistributeRewards}
                    disabled={isDistributing || rewardAmount === '' || rewardAmount <= 0 || !rewardReason.trim()}
                    className="sm:w-auto"
                  >
                    {isDistributing ? "In the process..." : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Distribution points
                      </>
                    )}
                  </Button>

                  {/* 3. Nút Xin điểm */}
                  <Button
                    variant="outline"
                    className="sm:w-auto mt-2 sm:mt-0" // Tự co giãn, thêm margin top trên mobile
                    onClick={() => setShowRequestModal(true)}
                    disabled={isDistributing} // Vô hiệu hóa khi đang phân phát
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Request more points
                  </Button>

                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-reason">Reason for Distribution</Label>
                <Textarea
                  id="reward-reason"
                  placeholder="e.g., Event giving, Monthly bonus, Achievement reward..."
                  value={rewardReason}
                  onChange={(e) => setRewardReason(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isDistributing}
                />
              </div>
              <p className="text-sm text-muted-foreground dark:text-slate-400">Total number of members who will receive the bonus points: {clubMembers.length}</p>
            </CardContent>
          </Card>
          <Separator className="dark:bg-slate-700" />
          {/* === Tìm kiếm Thành viên === */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {/* Thanh tìm kiếm (từ lần trước) */}
              <div className="flex-1 relative">
                <Input
                  placeholder="Search by name or student code..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setMembersPage(1)
                  }}
                  className="pl-4 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm dark:text-slate-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>

              {/* Nút Filter */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-lg border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-1 h-5 w-5 p-0 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center">
                    {Object.values(activeFilters).filter((v) => v && v !== "all").length + (searchTerm ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Bảng điều khiển Filter */}
            {showFilters && (
              <div className="space-y-4 p-6 border border-slate-200 dark:border-slate-600 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Advanced Filters</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-600 transition-colors"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Role Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Role</label>
                    <Select
                      value={activeFilters["role"] || "all"}
                      onValueChange={(v) => handleFilterChange("role", v)}
                    >
                      <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {uniqueRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Staff Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Staff</label>
                    <Select
                      value={activeFilters["staff"] || "all"}
                      onValueChange={(v) => handleFilterChange("staff", v)}
                    >
                      <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Staff Only</SelectItem>
                        <SelectItem value="false">Non-Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* === Danh sách Thành viên === */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold dark:text-white">
              List of Members ({filteredMembers.length})
            </h2>

            {/* Nút "Select All" */}
            {filteredMembers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSelectAll}
                className="rounded-lg dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {allFilteredSelected ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
          <div className="space-y-4">
            {membersLoading ? (
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground dark:text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Loading member list...</h3>
                  <p className="text-muted-foreground dark:text-slate-400">Please wait for the system to fetch the list.</p>
                </CardContent>
              </Card>
            ) : membersError ? (
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground dark:text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Error loading member list</h3>
                  <p className="text-muted-foreground dark:text-slate-400">{membersError}</p>
                </CardContent>
              </Card>
            ) : clubMembers.length === 0 ? (
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground dark:text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">No members yet</h3>
                  <p className="text-muted-foreground dark:text-slate-400">Please review the application to add members.</p>
                </CardContent>
              </Card>
            ) : filteredMembers.length === 0 ? (
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                    <Filter className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Members Found</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No members match your search term.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="rounded-lg border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 bg-transparent dark:text-slate-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Search
                  </Button>
                </CardContent>
              </Card>

            ) : (
              <>
                {paginatedMembers.map((member) => {
                  const isSelected = selectedMembers[member.id] || false

                  return (
                    <Card
                      key={member.id}
                      className={`transition-all duration-200 border-2 dark:bg-slate-800 dark:border-slate-700 ${isSelected
                        ? "border-primary/70 bg-primary/5 dark:bg-primary/10 dark:border-primary/50 shadow-sm"
                        : "border-transparent hover:border-muted dark:hover:border-slate-600"
                        }`}
                    >
                      <CardContent className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.avatarUrl || ""} alt={member.fullName} />
                            <AvatarFallback>{member.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium dark:text-white">
                              {member.fullName}
                              <span className="text-muted-foreground dark:text-slate-400 text-sm ml-2">
                                ({member.studentCode})
                              </span>
                            </p>
                            <Badge variant="secondary" className="text-xs dark:bg-slate-700 dark:text-slate-300">{member.role}</Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Nút tạo Phiếu Phạt */}
                          <TooltipProvider>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8 text-white hover:bg-red-700 transition-colors"
                                  onClick={() => handleOpenPenaltyModal(member)}
                                >
                                  <TriangleAlert className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Issue Penalty Ticket</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(member.id)}
                            className="w-5 h-5 accent-primary cursor-pointer transition-all duration-150"
                            style={{ transform: "scale(1.2)" }}
                            aria-label={`Select ${member.fullName} for reward distribution`}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className={`dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 ${isSelected ? "border-primary text-primary dark:border-primary dark:text-primary" : ""}`}
                          >
                            + {rewardAmount || 0} pts
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                <MinimalPager
                  current={membersPage}
                  total={membersPages}
                  onPrev={() => setMembersPage(Math.max(1, membersPage - 1))}
                  onNext={() => setMembersPage(Math.min(membersPages, membersPage + 1))}
                />
              </>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}