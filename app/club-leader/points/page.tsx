"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/contexts/protected-route";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/contexts/data-context";
import membershipApi, { ApiMembership } from "@/service/membershipApi";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import {
  Users,
  Award,
  ChevronLeft,
  ChevronRight,
  Send,
  Filter,
  X,
  Wallet,
  History,
  TriangleAlert,
  PlusCircle,
  DownloadCloud, // Icon mới
  RefreshCw,     // Icon mới
  Trash2,
  HandCoins,
  Coins,
  MessageSquare,        // Icon mới
} from "lucide-react";
import { getClubById, getClubIdFromToken } from "@/service/clubApi";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getClubWallet,
  ApiClubWallet,
  rewardPointsToMembers,
  getWalletTransactions,
  ApiWalletTransaction,
} from "@/service/walletApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createPointRequest } from "@/service/pointRequestsApi";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  getClubPenaltyRules,
  PenaltyRule,
  createClubPenalty,
} from "@/service/disciplineApi";
// --- IMPORT MỚI ---
import { getClubMemberActivity } from "@/service/memberActivityReportApi";

interface ClubMember {
  id: string;
  userId: string;
  clubId: string;
  role: string;
  status: string;
  joinedAt: string | null;
}

export default function ClubLeaderRewardDistributionPage() {
  const { clubMemberships } = useData();
  const { toast } = useToast();
  const [managedClub, setManagedClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clubWallet, setClubWallet] = useState<ApiClubWallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  // === Data Members ===
  const [apiMembers, setApiMembers] = useState<ApiMembership[] | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});
  const [targetUserIds, setTargetUserIds] = useState<number[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);

  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transactions, setTransactions] = useState<ApiWalletTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestPoints, setRequestPoints] = useState<number | "">("");
  const [requestReason, setRequestReason] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Penalty Modal
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyRules, setPenaltyRules] = useState<PenaltyRule[]>([]);
  const [penaltyRulesLoading, setPenaltyRulesLoading] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<number | "">("");
  const [penaltyReason, setPenaltyReason] = useState("");
  const [isSubmittingPenalty, setIsSubmittingPenalty] = useState(false);
  const [memberToPenalize, setMemberToPenalize] = useState<any>(null);

  // === NEW STATE FOR SYNCING SCORES ===
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncYear, setSyncYear] = useState(new Date().getFullYear());
  const [syncMonth, setSyncMonth] = useState(new Date().getMonth() + 1);
  const [isSyncing, setIsSyncing] = useState(false);

  // Lưu điểm riêng cho từng member: Key là userId (number), Value là score (number)
  // Nếu null -> Chế độ Manual (nhập chung 1 số). Nếu object -> Chế độ Sync.
  const [individualScores, setIndividualScores] = useState<Record<number, number> | null>(null);

  // Progress bar khi gửi điểm hàng loạt
  const [distributionProgress, setDistributionProgress] = useState<{ current: number, total: number } | null>(null);

  // === Reward State (Existing) ===
  const [rewardAmount, setRewardAmount] = useState<number | "">("");
  const [rewardReason, setRewardReason] = useState("");
  const [isDistributing, setIsDistributing] = useState(false);

  // --- LOGIC CHECK BALANCE (MỚI) ---
  const currentBalance = clubWallet?.balancePoints || 0;
  const recipientCount = targetUserIds.length;
  const currentRewardAmount = typeof rewardAmount === 'number' ? rewardAmount : 0;
  const totalRequired = currentRewardAmount * recipientCount;

  // Kiểm tra xem có vượt quá số dư không
  const isOverBudget = totalRequired > currentBalance;

  // Tính số điểm tối đa cho mỗi người (nếu chia đều)
  const maxPerMember = recipientCount > 0
    ? Math.floor(currentBalance / recipientCount)
    : 0;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setMembersLoading(true);
      setPenaltyRulesLoading(true);

      try {
        const clubId = getClubIdFromToken();
        if (!clubId) throw new Error("No club information found");

        const clubResponse = await getClubById(clubId);
        setManagedClub(clubResponse.data);

        setWalletLoading(true);
        try {
          const walletData = await getClubWallet(clubId);
          setClubWallet(walletData);
        } catch (walletErr) {
          console.error("Failed to load club wallet:", walletErr);
        } finally {
          setWalletLoading(false);
        }

        try {
          const rules = await getClubPenaltyRules({ clubId });
          setPenaltyRules(rules);
        } catch (ruleErr) {
          console.error("Failed to load penalty rules:", ruleErr);
        } finally {
          setPenaltyRulesLoading(false);
        }

        const memberData = await membershipApi.getMembersByClubId(clubId);
        setApiMembers(memberData);
      } catch (err: any) {
        setMembersError(err.message || "Error loading members");
      } finally {
        setMembersLoading(false);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Init selection state
  useEffect(() => {
    if (apiMembers && apiMembers.length > 0) {
      setSelectedMembers((prevSelected) => {
        const currentMemberIds = Object.keys(prevSelected);
        const newMemberIds = apiMembers.map(
          (m: any) => m.membershipId ?? `m-${m.userId}`
        );

        if (
          currentMemberIds.length === newMemberIds.length &&
          newMemberIds.every((id) => id in prevSelected)
        ) {
          return prevSelected;
        }

        const initialSelected: Record<string, boolean> = {};
        apiMembers.forEach((m: any) => {
          const id = m.membershipId ?? `m-${m.userId}`;
          initialSelected[id] = false;
        });
        return initialSelected;
      });
    }
  }, [apiMembers]);

  const clubMembers = managedClub
    ? (apiMembers ?? [])
      .filter(
        (m: any) =>
          String(m.clubId) === String(managedClub.id) && m.state === "ACTIVE"
      )
      .map((m: any) => {
        return {
          id: m.membershipId ?? `m-${m.userId}`,
          userId: m.userId,
          fullName: m.fullName ?? `User ${m.userId}`,
          studentCode: m.studentCode ?? "—",
          avatarUrl: m.avatarUrl ?? null,
          role: m.clubRole ?? "MEMBER",
          isStaff: m.staff ?? false,
        };
      })
    : [];

  const filteredMembers = clubMembers.filter((member) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchName = member.fullName.toLowerCase().includes(searchLower);
      const matchStudentCode = member.studentCode
        .toLowerCase()
        .includes(searchLower);
      if (!matchName && !matchStudentCode) return false;
    }
    const roleFilter = activeFilters["role"];
    if (roleFilter && roleFilter !== "all") {
      if (member.role !== roleFilter) return false;
    }
    const staffFilter = activeFilters["staff"];
    if (staffFilter && staffFilter !== "all") {
      const isStaff = staffFilter === "true";
      if (member.isStaff !== isStaff) return false;
    }
    return true;
  });

  const {
    currentPage: membersPage,
    totalPages: membersPages,
    paginatedData: paginatedMembers,
    setCurrentPage: setMembersPage,
  } = usePagination({ data: filteredMembers, initialPageSize: 8 });

  const uniqueRoles = Array.from(new Set(clubMembers.map((m) => m.role)));

  const handleFilterChange = (filterKey: string, value: any) => {
    setActiveFilters((prev) => ({ ...prev, [filterKey]: value }));
    setMembersPage(1);
  };

  const hasActiveFilters =
    Object.values(activeFilters).some((v) => v && v !== "all") ||
    Boolean(searchTerm);

  const allFilteredSelected = useMemo(() => {
    if (filteredMembers.length === 0) return false;
    return filteredMembers.every((member) => selectedMembers[member.id] === true);
  }, [filteredMembers, selectedMembers]);

  // --- SELECTION LOGIC ---
  const handleToggleSelect = (memberId: string) => {
    setSelectedMembers((prev) => {
      const newState = !prev[memberId];
      const member = clubMembers.find((m) => m.id === memberId);
      if (member) {
        const numericUserId = Number(member.userId);
        setTargetUserIds((prevIds) => {
          if (newState) {
            return prevIds.includes(numericUserId) ? prevIds : [...prevIds, numericUserId];
          } else {
            return prevIds.filter((id) => id !== numericUserId);
          }
        });
      }
      return { ...prev, [memberId]: newState };
    });
  };

  const handleToggleSelectAll = () => {
    const newSelectionState = !allFilteredSelected;
    setSelectedMembers((prevSelected) => {
      const newSelected = { ...prevSelected };
      filteredMembers.forEach((member) => {
        newSelected[member.id] = newSelectionState;
      });
      return newSelected;
    });

    if (newSelectionState) {
      setTargetUserIds((prevIds) => {
        const newIds = filteredMembers.map((member) => Number(member.userId));
        const merged = [...prevIds];
        newIds.forEach((id) => {
          if (!merged.includes(id)) merged.push(id);
        });
        return merged;
      });
    } else {
      setTargetUserIds((prevIds) => {
        const idsToRemove = filteredMembers.map((member) => Number(member.userId));
        return prevIds.filter((id) => !idsToRemove.includes(id));
      });
    }
  };

  // --- SYNC SCORE LOGIC (NEW) ---
  const handleSyncActivityScores = async () => {
    if (!managedClub?.id) return;

    setIsSyncing(true);
    try {
      // Gọi API lịch sử để lấy điểm đã lưu
      const activities = await getClubMemberActivity({
        clubId: managedClub.id,
        year: syncYear,
        month: syncMonth,
      });

      // Map dữ liệu về dạng: { [userId]: finalScore }
      const scoreMap: Record<number, number> = {};
      const userIdsToSelect: number[] = [];
      let countZero = 0;

      activities.forEach((act) => {
        if (act.finalScore && act.finalScore > 0) {
          scoreMap[act.userId] = Math.round(act.finalScore);
          userIdsToSelect.push(act.userId);
        } else {
          countZero++;
        }
      });

      if (Object.keys(scoreMap).length === 0) {
        toast({
          title: "No Scores Found",
          description: countZero > 0
            ? "Members found but all have 0 points. Please 'Save' the report in the Activity page first."
            : "No activity data found for this period.",
          variant: "destructive" // Hoặc destructive nếu không có variant warning
        });
        setIsSyncing(false);
        return;
      }

      setIndividualScores(scoreMap);

      // Auto-select members có điểm trong list hiện tại
      setSelectedMembers((prev) => {
        const newSelected = { ...prev };
        filteredMembers.forEach(m => {
          const uId = Number(m.userId);
          if (scoreMap[uId] !== undefined) {
            newSelected[m.id] = true;
          }
        });
        return newSelected;
      });

      // Update targetUserIds
      setTargetUserIds(prev => {
        const uniqueIds = new Set([...prev, ...userIdsToSelect]);
        return Array.from(uniqueIds);
      });

      toast({
        title: "Scores Imported",
        description: `Loaded final scores for ${Object.keys(scoreMap).length} members.`,
      });

      setShowSyncModal(false);
      setRewardReason(`Activity Bonus ${syncMonth}/${syncYear}`);

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Sync Failed",
        description: "Could not fetch activity history.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearSync = () => {
    setIndividualScores(null);
    setRewardAmount("");
    toast({ title: "Reset", description: "Switched back to manual input mode." });
  };

  // --- MAIN DISTRIBUTION LOGIC (UPDATED) ---
  const handleDistributeRewards = async () => {
    // Validation
    if (!rewardReason.trim()) {
      toast({ title: "Reason required", description: "Please enter a reason.", variant: "destructive" });
      return;
    }
    if (clubMembers.length === 0) {
      toast({ title: "Notification", description: "There are no members.", });
      return;
    }
    if (targetUserIds.length === 0) {
      toast({ title: "No selection", description: "Please select at least one member.", variant: "destructive" });
      return;
    }

    // === CASE 1: MANUAL MODE (Gửi 1 cục điểm giống nhau) ===
    if (!individualScores) {
      if (rewardAmount === "" || rewardAmount <= 0) {
        toast({ title: "Error", description: "Invalid point amount.", variant: "destructive" });
        return;
      }

      setIsDistributing(true);
      try {
        const response = await rewardPointsToMembers(
          targetUserIds,
          rewardAmount as number,
          rewardReason.trim()
        );
        if (response.success) {
          toast({ title: "Success", description: response.message });
          // Reload wallet
          const walletData = await getClubWallet(managedClub.id);
          setClubWallet(walletData);
          // Reset
          setRewardAmount("");
          setRewardReason("");
          setSelectedMembers({});
          setTargetUserIds([]);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "Error distributing points";
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setIsDistributing(false);
      }
    }
    // === CASE 2: SYNC MODE (Gửi điểm riêng từng người - Batching Client Side) ===
    else {
      setIsDistributing(true);
      setDistributionProgress({ current: 0, total: targetUserIds.length });

      let successCount = 0;
      let failCount = 0;

      // Loop qua từng user để gửi đúng điểm của họ
      for (let i = 0; i < targetUserIds.length; i++) {
        const userId = targetUserIds[i];
        const score = individualScores[userId];

        if (score && score > 0) {
          try {
            // Gọi API cho 1 người (Mảng chứa 1 userId)
            await rewardPointsToMembers(
              [userId],
              score,
              rewardReason.trim()
            );
            successCount++;
          } catch (error) {
            console.error(`Failed to send to user ${userId}`, error);
            failCount++;
          }
        }

        // Cập nhật progress bar
        setDistributionProgress({ current: i + 1, total: targetUserIds.length });
      }

      setIsDistributing(false);
      setDistributionProgress(null);

      toast({
        title: "Distribution Complete",
        description: `Sent points to ${successCount} members. Failed: ${failCount}.`,
        variant: failCount > 0 ? "destructive" : "default"
      });

      // Reload wallet
      try {
        const walletData = await getClubWallet(managedClub.id);
        setClubWallet(walletData);
      } catch (e) { }

      // Nếu thành công 100%, reset
      if (failCount === 0) {
        handleClearSync(); // Tắt chế độ sync
        setSelectedMembers({});
        setTargetUserIds([]);
        setRewardReason("");
      }
    }
  };

  // --- Other Handlers ---
  const handleRewardAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Lấy giá trị từ ô input (vd: "1,1112")
    const rawValue = e.target.value;

    // 2. Xóa tất cả dấu phẩy đi (thành "11112")
    const numericString = rawValue.replace(/,/g, "");

    // 3. Kiểm tra xem chuỗi sau khi xóa phẩy có phải là số không
    if (numericString === "" || /^\d+$/.test(numericString)) {
      setRewardAmount(numericString === "" ? "" : parseInt(numericString, 10));
    }
  };

  const handleCreatePointRequest = async () => {
    if (!managedClub?.id) return;
    if (requestPoints === "" || requestPoints <= 0 || !requestReason.trim()) {
      toast({ title: "Invalid Input", description: "Check points and reason.", variant: "destructive" });
      return;
    }
    setIsSubmittingRequest(true);
    try {
      await createPointRequest({
        clubId: managedClub.id,
        requestedPoints: requestPoints as number,
        reason: requestReason,
      });
      toast({ title: "Request Submitted", description: "Sent to university staff." });
      setShowRequestModal(false);
      setRequestPoints("");
      setRequestReason("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const loadTransactionHistory = async () => {
    if (!clubWallet?.walletId) return;
    setTransactionsLoading(true);
    try {
      const data = await getWalletTransactions(clubWallet.walletId);
      setTransactions(data);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load history", variant: "destructive" });
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleOpenHistoryModal = () => {
    setShowHistoryModal(true);
    loadTransactionHistory();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const handleOpenPenaltyModal = (member: any) => {
    setMemberToPenalize(member);
    setSelectedRuleId("");
    setPenaltyReason("");
    setShowPenaltyModal(true);
  };

  const handleCreatePenalty = async () => {
    if (selectedRuleId === "" || !penaltyReason.trim() || !memberToPenalize) {
      toast({ title: "Invalid Input", description: "Check rule and reason.", variant: "destructive" });
      return;
    }
    const rule = penaltyRules.find((r) => r.id === selectedRuleId);
    if (!rule) return;

    setIsSubmittingPenalty(true);
    try {
      await createClubPenalty({
        clubId: managedClub.id,
        body: {
          membershipId: Number(memberToPenalize.id),
          ruleId: selectedRuleId as number,
          reason: penaltyReason.trim(),
        }
      });
      toast({ title: "Penalty Issued", description: `Issued -${rule.penaltyPoints} pts to ${memberToPenalize.fullName}.` });
      setShowPenaltyModal(false);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to issue penalty.", variant: "destructive" });
    } finally {
      setIsSubmittingPenalty(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveFilters({});
    setMembersPage(1);
  };

  const MinimalPager = ({ current, total, onPrev, onNext }: any) =>
    total > 1 ? (
      <div className="flex items-center justify-center gap-3 mt-4">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={current === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[2rem] text-center text-sm font-medium dark:text-slate-300">
          Page {current} / {total}
        </div>
        <Button variant="outline" size="sm" onClick={onNext} disabled={current === total}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    ) : null;

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 dark:text-white">
              <Award className="h-8 w-8 text-yellow-500 dark:text-yellow-400" /> Reward Point Distribution
            </h1>
            <p className="text-muted-foreground dark:text-slate-400">
              Distribute bonus points from club funds to members of "<span className="font-semibold text-primary dark:text-blue-400">{managedClub?.name}</span>"
            </p>
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
                    ) : clubWallet ? (
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{clubWallet.balancePoints?.toLocaleString()} pts</p>
                    ) : (
                      <p className="text-3xl font-bold text-gray-400">N/A</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {clubWallet && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Wallet ID</p>
                      <p className="text-sm font-medium">#{clubWallet.walletId}</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={handleOpenHistoryModal} className="gap-2">
                    <History className="h-4 w-4" /> History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* === SETUP DISTRIBUTION CARD (UPDATED) === */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">
                Set up the Point Distribution Index
              </CardTitle>
              {/* Nút bật/tắt Sync Mode */}
              {!individualScores ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSyncModal(true)}
                  className="gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300"
                >
                  <DownloadCloud className="h-4 w-4" />
                  Sync from Activity Report
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearSync}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Activity Scores
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* UI thay đổi dựa trên Sync Mode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

                {/* CỘT 1: NHẬP ĐIỂM HOẶC HIỂN THỊ SYNC MODE */}
                <div className="md:col-span-1 space-y-2">
                  {individualScores ? (
                    // Giao diện khi đang Sync Mode (Thu gọn lại một chút padding)
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-center gap-3 h-[74px]">
                      <RefreshCw className="h-5 w-5 text-blue-600 animate-pulse shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
                          Individual Scores
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                          Based on Activity Report
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Giao diện nhập điểm thủ công
                    <div className="space-y-2">
                      <Label htmlFor="reward-amount">Bonus Points (per member)</Label>
                      <Input
                        id="reward-amount"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={rewardAmount === "" ? "" : new Intl.NumberFormat("en-US").format(rewardAmount)}
                        onChange={handleRewardAmountChange}
                        disabled={isDistributing}
                        className={`h-[38px] transition-colors ${isOverBudget
                          ? "border-red-500 focus-visible:ring-red-500 bg-red-50 text-red-900"
                          : "border-slate-300"
                          }`}
                      />

                      {/* THÔNG BÁO LỖI VÀ GỢI Ý (MỚI) */}
                      {isOverBudget && recipientCount > 0 && (
                        <div className="text-xs font-medium text-red-600 animate-in slide-in-from-top-1 fade-in duration-200">
                          <div className="flex items-center gap-1 mb-1">
                            <TriangleAlert className="h-3 w-3" />
                            <span>Exceeds wallet balance!</span>
                          </div>
                          <p className="text-red-500/80">
                            Max possible: <span className="font-bold underline decoration-dotted cursor-pointer hover:text-red-700"
                              onClick={() => setRewardAmount(maxPerMember)}
                              title="Click to apply max amount"
                            >
                              {maxPerMember.toLocaleString()}
                            </span> pts/member
                          </p>
                        </div>
                      )}

                      {/* Hiển thị tổng tiền dự kiến nếu chưa vượt hạn mức (Optional - để người dùng dễ ước lượng) */}
                      {!isOverBudget && currentRewardAmount > 0 && recipientCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Total: <span className="font-medium text-foreground">{totalRequired.toLocaleString()}</span> / {currentBalance.toLocaleString()} pts
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* CỘT 2 & 3: NHẬP LÝ DO (REASON) */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="reward-reason">Reason for Distribution</Label>
                  <Textarea
                    id="reward-reason"
                    placeholder="e.g., Event giving, Monthly bonus..."
                    value={rewardReason}
                    onChange={(e) => setRewardReason(e.target.value)}
                    disabled={isDistributing}
                    // THAY ĐỔI QUAN TRỌNG: Giảm min-h từ 100px xuống thấp hơn
                    className="min-h-[38px] border-slate-300 resize-none overflow-hidden focus:min-h-[80px] transition-all duration-200"
                    rows={1} // Mặc định chỉ hiện 1 dòng
                    // Script nhỏ để tự động giãn chiều cao khi nhập liệu (tuỳ chọn)
                    onInput={(e) => {
                      e.currentTarget.style.height = "auto";
                      e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                    }}
                  />
                </div>
              </div>

              {/* Progress Bar khi sync */}
              {distributionProgress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Processing transactions...</span>
                    <span>{distributionProgress.current} / {distributionProgress.total}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 ease-out"
                      style={{ width: `${(distributionProgress.current / distributionProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleDistributeRewards}
                  disabled={
                    isDistributing ||
                    (!individualScores && (rewardAmount === "" || rewardAmount <= 0)) ||
                    !rewardReason.trim()
                  }
                  className="w-full sm:w-auto"
                >
                  {isDistributing ? (
                    individualScores ? "Distributing Batch..." : "Processing..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {individualScores ? "Distribute Activity Points" : "Distribute Points"}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="sm:w-auto mt-2 sm:mt-0"
                  onClick={() => setShowRequestModal(true)}
                  disabled={isDistributing}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Request more points
                </Button>
              </div>
              <p className="text-sm text-muted-foreground dark:text-slate-400">
                Total recipients: {targetUserIds.length} members
              </p>
            </CardContent>
          </Card>

          <Separator className="dark:bg-slate-700" />

          {/* === Filter & List (Giữ nguyên logic cũ) === */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative w-full max-w-sm">
                <Input
                  placeholder="Search by name or student code..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setMembersPage(1); }}
                  className="pl-4 pr-10 border-slate-300 bg-white"
                />
                {searchTerm && (
                  <Button variant="ghost" size="icon" onClick={() => { setSearchTerm(""); setMembersPage(1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-400 hover:bg-primary 
                      hover:text-primary-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                className="gap-2 bg-white"
              >
                <Filter className="h-4 w-4" /> Filters {hasActiveFilters && <Badge className="ml-1 h-5 w-5 bg-blue-500">!</Badge>}
              </Button>
            </div>

            {showFilters && (
              <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-800 grid grid-cols-2 gap-4">
                {/* Filters UI */}
                <Select value={activeFilters["role"] || "all"} onValueChange={(v) => handleFilterChange("role", v)}>
                  <SelectTrigger className="border-slate-300 bg-white"><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={activeFilters["staff"] || "all"} onValueChange={(v) => handleFilterChange("staff", v)}>
                  <SelectTrigger className="border-slate-300 bg-white"><SelectValue placeholder="Staff" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Staff Only</SelectItem>
                    <SelectItem value="false">Non-Staff</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="col-span-2">Clear Filters</Button>}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold dark:text-white">List of Members ({filteredMembers.length})</h2>
            {filteredMembers.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleToggleSelectAll}>
                {allFilteredSelected ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {membersLoading ? (
              <div className="text-center py-10">Loading members...</div>
            ) : (
              <>
                {paginatedMembers.map((member) => {
                  const isSelected = selectedMembers[member.id] || false;
                  // Lấy điểm activity nếu đang ở chế độ Sync
                  const activityScore = individualScores ? individualScores[Number(member.userId)] : null;

                  return (
                    <Card
                      key={member.id}
                      className={`transition-all duration-200 border-2 dark:bg-slate-800 dark:border-slate-700 ${isSelected
                        ? "border-primary/70 bg-primary/5 shadow-sm"
                        : "border-transparent hover:border-muted"
                        }`}
                    >
                      <CardContent className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatarUrl || ""} />
                            <AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.fullName} <span className="text-muted-foreground text-sm">({member.studentCode})</span></p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                              {member.isStaff && <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">Staff</Badge>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleOpenPenaltyModal(member)}>
                            <TriangleAlert className="h-4 w-4" />
                          </Button>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(member.id)}
                            className="w-5 h-5 accent-primary cursor-pointer"
                          />

                          {/* NÚT HIỂN THỊ ĐIỂM (CẬP NHẬT LOGIC HIỂN THỊ) */}
                          <Button
                            variant="outline"
                            size="sm"
                            className={`min-w-[80px] ${isSelected ? "border-primary text-primary" : "text-muted-foreground"}`}
                          >
                            + {
                              (individualScores
                                ? (activityScore || 0)
                                : (typeof rewardAmount === 'number' ? rewardAmount : 0)
                              ).toLocaleString("en-US")
                            } pts
                          </Button>                        </div>
                      </CardContent>
                    </Card>
                  );
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

        {/* === MODAL CONFIG SYNC ACTIVITY (NEW) === */}
        <Dialog open={showSyncModal} onOpenChange={setShowSyncModal}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Import Saved Scores</DialogTitle>
              <DialogDescription>
                Use <strong>Final Scores</strong> currently saved in the Activity Report.
                <br />
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  If scores are 0, please go to Activity Report and click "Save".
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={String(syncYear)} onValueChange={(v) => setSyncYear(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2023, 2024, 2025, 2026].map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={String(syncMonth)} onValueChange={(v) => setSyncMonth(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i} value={String(i + 1)}>Month {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSyncModal(false)}>Cancel</Button>
              <Button onClick={handleSyncActivityScores} disabled={isSyncing}>
                {isSyncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
                {isSyncing ? "Loading..." : "Import Scores"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Other Modals (History, Penalty, Request) */}
        {/* Transaction History Modal */}
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>History</DialogTitle></DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {transactionsLoading ? <p>Loading...</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Desc</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(t => (
                      <TableRow key={t.id}>
                        <TableCell>#{t.id}</TableCell>
                        <TableCell className={t.amount > 0 ? "text-green-600" : "text-red-600"}>{t.signedAmount}</TableCell>
                        <TableCell>{t.receiverName}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>{formatDate(t.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Request Points Modal */}
        <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">
            {/* HEADER: Thêm màu nền nhẹ để tách biệt tiêu đề */}
            <DialogHeader className="p-6 pb-4 bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-800">
              <DialogTitle className="flex items-center gap-2 text-xl text-primary">
                <HandCoins className="h-6 w-6" />
                Request Additional Funding
              </DialogTitle>
              <DialogDescription>
                Submit a request to University Staff for more club points.
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-5">
              {/* INFO BANNER: Hiển thị số dư hiện tại để tham khảo */}
              <div className="flex items-center justify-between p-3 rounded-md bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Current Wallet Balance
                </span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {clubWallet?.balancePoints?.toLocaleString() ?? 0} pts
                </span>
              </div>

              <div className="space-y-4">
                {/* INPUT POINTS: Làm to và rõ ràng */}
                <div className="space-y-2">
                  <Label htmlFor="req-points" className="text-sm font-semibold flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    Amount to Request
                  </Label>
                  <div className="relative">
                    <Input
                      id="req-points"
                      type="text"                  // Đổi thành text để hiển thị được dấu ","
                      inputMode="numeric"          // Giúp hiển thị bàn phím số trên điện thoại
                      placeholder="e.g. 5,000"

                      // LOGIC HIỂN THỊ: Nếu có giá trị, format thêm dấu phẩy
                      value={
                        requestPoints === ""
                          ? ""
                          : new Intl.NumberFormat("en-US").format(Number(requestPoints))
                      }

                      // LOGIC CẬP NHẬT: Xóa dấu phẩy trước khi lưu vào state
                      onChange={(e) => {
                        // Lấy giá trị thô từ input (vd: "5,000")
                        const rawValue = e.target.value;

                        // Xóa tất cả dấu phẩy để lấy số (vd: "5000")
                        const numericString = rawValue.replace(/,/g, "");

                        // Kiểm tra xem chuỗi còn lại có phải là số không (chỉ chứa ký tự 0-9)
                        if (/^\d*$/.test(numericString)) {
                          setRequestPoints(numericString === "" ? "" : Number(numericString));
                        }
                      }}

                      className="pl-4 pr-12 h-11 text-lg font-medium border-slate-300 focus-visible:ring-primary"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      pts
                    </div>
                  </div>
                </div>

                {/* TEXTAREA REASON */}
                <div className="space-y-2">
                  <Label htmlFor="req-reason" className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    Justification
                  </Label>
                  <Textarea
                    id="req-reason"
                    placeholder="Explain why the club needs these points (e.g., Budget for upcoming Hackathon event, Rewards for excellent members...)"
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    className="min-h-[100px] border-slate-300 resize-none focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* FOOTER: Tách biệt và thêm nút Cancel */}
            <DialogFooter className="p-6 pt-2 bg-slate-50/50 dark:bg-slate-900/50 sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRequestModal(false)}
                disabled={isSubmittingRequest}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePointRequest}
                disabled={isSubmittingRequest || !requestPoints || !requestReason}
                className="min-w-[120px]"
              >
                {isSubmittingRequest ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Penalty Modal */}
        <Dialog open={showPenaltyModal} onOpenChange={setShowPenaltyModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue Penalty</DialogTitle></DialogHeader>
            <Select value={String(selectedRuleId)} onValueChange={v => setSelectedRuleId(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Select Rule" /></SelectTrigger>
              <SelectContent>
                {penaltyRules.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name} (-{r.penaltyPoints})</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Reason" value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)} />
            <DialogFooter>
              <Button variant="destructive" onClick={handleCreatePenalty} disabled={isSubmittingPenalty}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </AppShell>
    </ProtectedRoute>
  );
}