"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  getClubRanking,
  recalculateAllClubs,
  lockClubActivity,
  approveClubActivity,
  deleteClubActivity,
  getClubActivityBreakdown,
  ClubMonthlyActivity,
  ClubActivityBreakdown
} from "@/service/clubActivityReportApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  RotateCw, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Trash2, 
  Calendar, 
  Info, 
  Eye, 
  AlertTriangle 
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// --- Helper Functions ---
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= currentYear - 3; i--) {
    years.push(i)
  }
  return years
}

const generateMonthOptions = () => {
  return [
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
    { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
    { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
  ]
}

const getAwardBadgeColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case "PLATINUM": return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300";
    case "GOLD": return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300";
    case "SILVER": return "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300";
    case "BRONZE": return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300";
    default: return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

// --- Detail Modal Component ---
const ClubActivityDetail = ({ breakdown, loading }: { breakdown: ClubActivityBreakdown | null, loading: boolean }) => {
  if (loading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>
  }

  if (!breakdown) return <div className="p-6 text-center text-muted-foreground">No details available.</div>;

  return (
    <div className="space-y-6">
      {/* Final Score Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2 text-center">
          <CardDescription className="uppercase font-semibold tracking-wider text-primary">Monthly Final Score</CardDescription>
          <CardTitle className="text-5xl font-bold text-primary">{breakdown.finalScore?.toFixed(1) || 0}</CardTitle>
          <div className="flex justify-center gap-2 mt-2">
            <Badge variant="outline" className={getAwardBadgeColor(breakdown.awardLevel)}>
              {breakdown.awardLevel || "NO RANK"}
            </Badge>
            {breakdown.rewardPoints > 0 && (
              <Badge variant="default" className="bg-green-600">
                +{breakdown.rewardPoints.toLocaleString()} Points
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* Activity Stats */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Activity Stats</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Events:</span>
              <span className="font-medium">{breakdown.totalEvents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg. Feedback:</span>
              <span className="font-medium">{breakdown.avgFeedback?.toFixed(1)} / 5.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-in Rate:</span>
              <span className="font-medium">{breakdown.avgCheckinRate?.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Score Components */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Component Scores</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
             <div className="flex justify-between">
              <span className="text-muted-foreground">Member Score:</span>
              <span className="font-medium text-blue-600">{breakdown.avgMemberActivityScore?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Staff Score:</span>
              <span className="font-medium text-yellow-600">{breakdown.staffPerformanceScore?.toFixed(1)}</span>
            </div>
             <div className="flex justify-between pt-2 border-t mt-2">
              <span className="text-muted-foreground">Award Score:</span>
              <span className="font-bold">{breakdown.awardScore?.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function UniStaffActivityReportPage() {
  const { toast } = useToast()

  // --- State ---
  const [yearOptions] = useState(generateYearOptions())
  const [monthOptions] = useState(generateMonthOptions())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const [clubs, setClubs] = useState<ClubMonthlyActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false) // Chung cho các action Lock/Approve/Recalculate

  // Modal State
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)
  const [breakdownData, setBreakdownData] = useState<ClubActivityBreakdown | null>(null)
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false)

  // --- Fetch Data ---
  const loadClubRanking = useCallback(async () => {
    setIsLoading(true)
    try {
      // Dùng API Ranking để lấy danh sách CLB đã có điểm (hoặc danh sách trống nếu chưa tính)
      // Lưu ý: API ranking trả về mảng ClubMonthlyActivity
      const data = await getClubRanking({ year: selectedYear, month: selectedMonth })
      setClubs(data)
    } catch (error: any) {
      console.error("Error loading clubs:", error)
      toast({ title: "Error", description: "Failed to load club reports.", variant: "destructive" })
      setClubs([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedYear, selectedMonth, toast])

  useEffect(() => {
    loadClubRanking()
  }, [loadClubRanking])

  // --- Actions ---

  // 1. Recalculate All
  const handleRecalculateAll = async () => {
    setIsProcessing(true)
    try {
      const updatedList = await recalculateAllClubs({ year: selectedYear, month: selectedMonth })
      setClubs(updatedList)
      toast({ 
        title: "Calculation Complete", 
        description: `Successfully recalculated scores for ${updatedList.length} clubs.`,
        className: "bg-green-600 text-white border-none"
      })
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  // 2. Lock Single Club
  const handleLock = async (clubId: number) => {
    setIsProcessing(true)
    try {
      const updatedRecord = await lockClubActivity({ clubId, year: selectedYear, month: selectedMonth })
      // Update local state
      setClubs(prev => prev.map(c => c.clubId === clubId ? updatedRecord : c))
      toast({ title: "Locked", description: "Club activity has been locked." })
    } catch (error: any) {
      toast({ title: "Lock Failed", description: error.message, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  // 3. Approve Single Club
  const handleApprove = async (clubId: number) => {
    setIsProcessing(true)
    try {
      const result = await approveClubActivity({ clubId, year: selectedYear, month: selectedMonth })
      // Update local state (Assign result to match types, ApproveResult extends ClubMonthlyActivity)
      setClubs(prev => prev.map(c => c.clubId === clubId ? { ...c, ...result } : c))
      toast({ 
        title: "Approved & Rewarded", 
        description: `Points distributed. New Wallet Balance: ${result.walletBalance?.toLocaleString()}`,
        className: "bg-blue-600 text-white border-none"
      })
    } catch (error: any) {
      toast({ title: "Approval Failed", description: error.message, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  // 4. Delete/Reset Record
  const handleDelete = async (clubId: number) => {
    if(!confirm("Are you sure? This will delete the monthly record and require recalculation.")) return;
    
    setIsProcessing(true)
    try {
      await deleteClubActivity({ clubId, year: selectedYear, month: selectedMonth })
      // Remove from list
      setClubs(prev => prev.filter(c => c.clubId !== clubId))
      toast({ title: "Reset", description: "Club record deleted successfully." })
    } catch (error: any) {
      toast({ title: "Reset Failed", description: error.message, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  // 5. View Detail (Breakdown)
  const handleViewDetail = async (clubId: number) => {
    setSelectedClubId(clubId)
    setIsLoadingBreakdown(true)
    try {
      const data = await getClubActivityBreakdown({ clubId, year: selectedYear, month: selectedMonth })
      setBreakdownData(data)
    } catch (error: any) {
        // Fallback: nếu chưa có breakdown thì dùng data từ list
        const club = clubs.find(c => c.clubId === clubId);
        if(club) {
             // Map ClubMonthlyActivity to ClubActivityBreakdown structure roughly for display
             setBreakdownData(club as unknown as ClubActivityBreakdown);
        } else {
             toast({ title: "Error", description: "Could not load details.", variant: "destructive" })
        }
    } finally {
      setIsLoadingBreakdown(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["uni_staff", "admin"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                University Club Activity Report
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage monthly scores, rankings, and reward distribution for <strong>{selectedMonth}/{selectedYear}</strong>.
              </p>
            </div>
            
            {/* Global Actions */}
            <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border">
                 {/* Selectors */}
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))} disabled={isProcessing}>
                    <SelectTrigger className="w-[100px] bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
                    <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))} disabled={isProcessing}>
                    <SelectTrigger className="w-[120px] bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
                    <SelectContent>{monthOptions.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                </Select>

                <div className="w-px h-8 bg-border mx-2"></div>

                <Button 
                    onClick={handleRecalculateAll} 
                    disabled={isProcessing}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                    {isProcessing ? <RotateCw className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                    Recalculate All
                </Button>
            </div>
          </div>

          {/* Ranking & List Table */}
          <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Club Rankings & Status</CardTitle>
                <CardDescription>Found {clubs.length} clubs with activity records.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[50px] text-center">#</TableHead>
                            <TableHead className="w-[200px]">Club Name</TableHead>
                            <TableHead className="text-center">Total Events</TableHead>
                            <TableHead className="text-center">Scores (M/S)</TableHead>
                            <TableHead className="text-center">Final Score</TableHead>
                            <TableHead className="text-center">Award</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : clubs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <AlertTriangle className="h-8 w-8 opacity-20" />
                                        <p>No records found for this month.</p>
                                        <Button variant="link" onClick={handleRecalculateAll}>Click "Recalculate All" to start.</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clubs.map((club, index) => (
                                <TableRow key={club.clubId}>
                                    <TableCell className="text-center font-medium text-muted-foreground">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="font-semibold">{club.clubName}</TableCell>
                                    <TableCell className="text-center">{club.totalEvents}</TableCell>
                                    <TableCell className="text-center text-sm">
                                        <span className="text-blue-600 font-medium">{club.avgMemberActivityScore.toFixed(0)}</span>
                                        <span className="text-muted-foreground mx-1">/</span>
                                        <span className="text-yellow-600 font-medium">{club.staffPerformanceScore.toFixed(0)}</span>
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-lg">
                                        {club.finalScore.toFixed(0)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={getAwardBadgeColor(club.awardLevel)}>
                                            {club.awardLevel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {club.locked ? (
                                            club.rewardPoints > 0 ? ( // Logic giả định: Đã lock và có điểm thưởng -> coi như đã Approve
                                                 <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <div className="flex items-center justify-center gap-1 text-green-600 font-medium text-xs border border-green-200 bg-green-50 px-2 py-1 rounded-full">
                                                                <CheckCircle2 className="h-3 w-3" /> Approved
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Record Locked & Rewards Distributed</p></TooltipContent>
                                                    </Tooltip>
                                                 </TooltipProvider>
                                            ) : (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                             <div className="flex items-center justify-center gap-1 text-orange-600 font-medium text-xs border border-orange-200 bg-orange-50 px-2 py-1 rounded-full">
                                                                <Lock className="h-3 w-3" /> Locked
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Record Locked. Waiting for Approval.</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )
                                        ) : (
                                            <div className="flex items-center justify-center gap-1 text-slate-500 font-medium text-xs border border-slate-200 bg-slate-50 px-2 py-1 rounded-full">
                                                <Unlock className="h-3 w-3" /> Open
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* 1. Detail Button */}
                                            <Button variant="ghost" size="icon" onClick={() => handleViewDetail(club.clubId)}>
                                                <Eye className="h-4 w-4 text-slate-500" />
                                            </Button>

                                            {/* 2. Logic Action Button */}
                                            {!club.locked ? (
                                                <>
                                                    {/* Lock Button */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" onClick={() => handleLock(club.clubId)} disabled={isProcessing}>
                                                                    <Lock className="h-4 w-4 text-orange-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Lock Record</p></TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    {/* Delete/Reset Button (Only when Open) */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(club.clubId)} disabled={isProcessing}>
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Reset Calculation</p></TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </>
                                            ) : (
                                                // Approve Button (Only show if Locked but maybe not yet rewarded?)
                                                // Giả sử API check nếu đã reward thì không cho approve nữa (ẩn nút)
                                                // Nhưng ở đây để đơn giản ta cứ hiện nếu locked. 
                                                // Nâng cao: check thêm field rewardedAt nếu có.
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => handleApprove(club.clubId)} disabled={isProcessing}>
                                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Approve & Distribute Rewards</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>

           {/* Detail Modal */}
           <Dialog open={!!selectedClubId} onOpenChange={(open) => !open && setSelectedClubId(null)}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Club Activity Breakdown</DialogTitle>
                    <DialogDescription>
                        Detailed scoring analysis for {selectedMonth}/{selectedYear}.
                    </DialogDescription>
                </DialogHeader>
                
                <ClubActivityDetail breakdown={breakdownData} loading={isLoadingBreakdown} />

                <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedClubId(null)}>Close</Button>
                </DialogFooter>
            </DialogContent>
           </Dialog>

        </div>
      </AppShell>
    </ProtectedRoute>
  )
}