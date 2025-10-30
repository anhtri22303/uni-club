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
import { Users, Award, ChevronLeft, ChevronRight, Send, Filter, X, Wallet, History } from "lucide-react"
import { getClubById, getClubIdFromToken } from "@/service/clubApi"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getClubWallet, ApiClubWallet, rewardPointsToMember, ApiRewardResponse, getClubToMemberTransactions, ApiClubToMemberTransaction } from "@/service/walletApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea" // <-- THÊM MỚI
import { createPointRequest } from "@/service/pointRequestsApi" // <-- THÊM MỚI
import { PlusCircle } from "lucide-react" // <-- THÊM MỚI (hoặc icon bạn muốn)

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
  // State filters
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)
  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [transactions, setTransactions] = useState<ApiClubToMemberTransaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  // === MỚI: State cho modal xin điểm ===
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestPoints, setRequestPoints] = useState<number | ''>('')
  const [requestReason, setRequestReason] = useState("")
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setMembersLoading(true)
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
    setSelectedMembers((prev) => ({ ...prev, [memberId]: !prev[memberId] }))
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

    // ✅ THÊM MỚI: Lọc theo Staff
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
    const newSelectionState = !allFilteredSelected // Trạng thái mới (true hoặc false)

    // Cập nhật trạng thái chọn *chỉ* cho các thành viên trong danh sách đã lọc
    // Những thành viên khác không bị ảnh hưởng
    setSelectedMembers((prevSelected) => {
      const newSelected = { ...prevSelected } // Bắt đầu với trạng thái cũ
      filteredMembers.forEach((member) => {
        newSelected[member.id] = newSelectionState // Áp dụng trạng thái mới
      })
      return newSelected
    })
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
        description: "Your request for points has been sent to the university staff for review.",
        variant: "default",
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

    if (clubMembers.length === 0) {
      toast({
        title: "Notification",
        description: "There are no members to distribute points to.",
        variant: "default"
      })
      return
    }
    setIsDistributing(true)

    // Get selected members with their membershipIds
    const selectedMembersList = clubMembers.filter(m => selectedMembers[m.id])
    if (selectedMembersList.length === 0) {
      toast({
        title: "No members selected",
        description: "Please select at least one member to distribute points.",
        variant: "destructive"
      })
      setIsDistributing(false)
      return
    }

    try {
      // Reward points to each selected member individually
      const rewardPromises = selectedMembersList.map(member =>
        rewardPointsToMember(
          member.id, // membershipId
          rewardAmount as number,
          "Event giving" // reason
        )
      )

      // Execute all reward API calls in parallel
      const results = await Promise.allSettled(rewardPromises)

      // Count successes and failures
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failureCount = results.filter(r => r.status === 'rejected').length

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `Distributed ${rewardAmount} points to ${successCount} member(s) of ${managedClub.name}.${failureCount > 0 ? ` ${failureCount} failed.` : ''}`,
          variant: "default"
        })

        // Reload club wallet balance
        try {
          const walletData = await getClubWallet(managedClub.id)
          setClubWallet(walletData)
        } catch (walletErr) {
          console.error("Failed to reload club wallet:", walletErr)
        }

        setRewardAmount('') // Reset số điểm sau khi thành công
      } else {
        throw new Error("All reward distributions failed")
      }
    } catch (err: any) {
      toast({
        title: "Delivery error",
        description: err?.message || "An error occurred while distributing points.",
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

  // Component Pager đơn giản (Tái sử dụng)
  const MinimalPager = ({ current, total, onPrev, onNext }: { current: number; total: number; onPrev: () => void; onNext: () => void }) =>
    total > 1 ? (
      <div className="flex items-center justify-center gap-3 mt-4">
        <Button aria-label="Previous page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev} disabled={current === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[2rem] text-center text-sm font-medium">Trang {current} / {total}</div>
        <Button aria-label="Next page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onNext} disabled={current === total}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    ) : null


  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Award className="h-8 w-8 text-yellow-500" /> Reward Point Distribution
            </h1>
            <p className="text-muted-foreground">Distribute bonus points from club funds to members of "<span className="font-semibold text-primary">{managedClub?.name}</span>"</p>
          </div>

          {/* Club Wallet Balance Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-blue-500 flex items-center justify-center">
                    <Wallet className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Club Balance</p>
                    {walletLoading ? (
                      <p className="text-3xl font-bold text-blue-600">Loading...</p>
                    ) : clubWallet ? (
                      <p className="text-3xl font-bold text-blue-600">
                        {clubWallet.balancePoints.toLocaleString()} pts
                      </p>
                    ) : (
                      <p className="text-3xl font-bold text-gray-400">N/A</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {clubWallet && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Wallet ID</p>
                      <p className="text-sm font-medium text-gray-700">#{clubWallet.walletId}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenHistoryModal}
                    className="flex items-center gap-2"
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
                <DialogTitle className="flex items-center gap-3 text-3xl font-bold">
                  <History className="h-9 w-9" />
                  Club to Member Transaction History
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                {transactionsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">Loading transaction history...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                    <p className="text-muted-foreground">No club-to-member transactions found.</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="w-[25%]">Receiver</TableHead>
                          <TableHead className="w-[30%]">Description</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium">#{t.id}</TableCell>
                            <TableCell><Badge variant="secondary">{t.type}</Badge></TableCell>
                            <TableCell className="font-semibold text-green-600">+{t.amount} pts</TableCell>
                            <TableCell className="font-medium text-blue-600">
                              {t.receiverName || "—"}
                            </TableCell>
                            <TableCell className="truncate">{t.description || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(t.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* === MỚI: Modal Xin Thêm Điểm === */}
          <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PlusCircle className="h-6 w-6 text-green-600" />
                  Request Additional Club Points
                </DialogTitle>
                <DialogDescription>
                  Submit a request to the university staff to add more points to your club's wallet.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="req-points" className="text-right">
                    Points
                  </Label>

                  {/* === CẬP NHẬT CHÍNH Ở ĐÂY === */}
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

          <Card>
            <CardHeader>
              <CardTitle>Set up the Point Distribution Index</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reward-amount">Number of Bonus Points (per member)</Label>

                {/* Container MỚI: dùng flex (responsive) */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-3">

                  {/* 1. Input (Cập nhật logic format) */}
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
                    disabled={isDistributing || rewardAmount === '' || rewardAmount <= 0}
                    className="sm:w-auto"
                  >
                    {isDistributing ? "In the process..." : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Distribution points
                      </>
                    )}
                  </Button>

                  {/* 3. Nút MỚI: Xin điểm */}
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
              <p className="text-sm text-muted-foreground">Total number of members who will receive the bonus points: {clubMembers.length}</p>
            </CardContent>
            {/* CardFooter đã được xóa vì nút đã chuyển lên trên */}
          </Card>



          <Separator />

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
                  className="pl-4 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* ✅ THÊM MỚI: Nút Filter */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-lg border-slate-200 hover:bg-slate-50 transition-colors"
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

            {/* ✅ THÊM MỚI: Bảng điều khiển Filter */}
            {showFilters && (
              <div className="space-y-4 p-6 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">Advanced Filters</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Role Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Role</label>
                    <Select
                      value={activeFilters["role"] || "all"}
                      onValueChange={(v) => handleFilterChange("role", v)}
                    >
                      <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 bg-white hover:border-slate-300 transition-colors">
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
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Staff</label>
                    <Select
                      value={activeFilters["staff"] || "all"}
                      onValueChange={(v) => handleFilterChange("staff", v)}
                    >
                      <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 bg-white hover:border-slate-300 transition-colors">
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
            <h2 className="text-2xl font-semibold">
              List of Members ({filteredMembers.length})
            </h2>

            {/* ✅ THÊM MỚI: Nút "Select All" */}
            {filteredMembers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSelectAll}
                className="rounded-lg"
              >
                {allFilteredSelected ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
          <div className="space-y-4">
            {membersLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Loading member list...</h3>
                  <p className="text-muted-foreground">Please wait for the system to fetch the list.</p>
                </CardContent>
              </Card>
            ) : membersError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error loading member list</h3>
                  <p className="text-muted-foreground">{membersError}</p>
                </CardContent>
              </Card>
            ) : clubMembers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                  <p className="text-muted-foreground">Please review the application to add members.</p>
                </CardContent>
              </Card>
            ) : filteredMembers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Filter className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Members Found</h3>
                  <p className="text-sm text-slate-500 mb-4">No members match your search term.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="rounded-lg border-slate-200 hover:bg-slate-50 bg-transparent"
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
                      className={`transition-all duration-200 border-2 ${isSelected
                        ? "border-primary/70 bg-primary/5 shadow-sm"
                        : "border-transparent hover:border-muted"
                        }`}
                    >
                      <CardContent className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.avatarUrl || ""} alt={member.fullName} />
                            <AvatarFallback>{member.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.fullName}
                              <span className="text-muted-foreground text-sm ml-2">
                                ({member.studentCode})
                              </span>
                            </p>
                            <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(member.id)}
                            className="w-5 h-5 accent-primary cursor-pointer transition-all duration-150"
                            style={{ transform: "scale(1.2)" }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className={isSelected ? "border-primary text-primary" : ""}
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