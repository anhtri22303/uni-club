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
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Users, ShieldCheck, ChevronLeft, ChevronRight, Send, UserCircle, History } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// ✨ --- IMPORT API THẬT --- ✨
import { fetchClub } from "@/service/clubApi"
import { pointsToClubs, getUniToClubTransactions, ApiUniToClubTransaction } from "@/service/walletApi"

// Định nghĩa một kiểu dữ liệu cơ bản cho Club
interface Club {
    id: number | string;
    name: string;
    logoUrl?: string | null;
    memberCount?: number;
    leaderName?: string | null;
}

export default function UniversityStaffRewardPage() {
    const { toast } = useToast()
    const [allClubs, setAllClubs] = useState<Club[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [selectedClubs, setSelectedClubs] = useState<Record<string, boolean>>({})
    const [rewardAmount, setRewardAmount] = useState<number | ''>('')
    const [isDistributing, setIsDistributing] = useState(false)

    // History modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [transactions, setTransactions] = useState<ApiUniToClubTransaction[]>([])
    const [transactionsLoading, setTransactionsLoading] = useState(false)

    // Tải danh sách tất cả các CLB khi component được mount bằng API thật
    useEffect(() => {
        const loadClubs = async () => {
            setLoading(true);
            try {
                // response bây giờ sẽ có dạng { content: [...] }
                const response = await fetchClub({ page: 0, size: 70, sort: ["name"] });

                // ✨ THAY ĐỔI QUAN TRỌNG: Truy cập trực tiếp vào response.content ✨
                if (response && response.content) {
                    setAllClubs(response.content);
                } else {
                    setAllClubs([]);
                }
            } catch (err: any) {
                setError(err.message || "Error loading club list");
            } finally {
                setLoading(false);
            }
        };
        loadClubs();
    }, []);

    // Initialize selection state for all clubs
    useEffect(() => {
        if (allClubs && allClubs.length > 0) {
            setSelectedClubs((prevSelected) => {
                const currentClubIds = Object.keys(prevSelected)
                const newClubIds = allClubs.map((c) => String(c.id))

                // If we already have selections and the IDs match, don't update
                if (currentClubIds.length === newClubIds.length &&
                    newClubIds.every(id => id in prevSelected)) {
                    return prevSelected
                }

                // Otherwise, create new selection state
                const initialSelected: Record<string, boolean> = {}
                allClubs.forEach((c) => {
                    initialSelected[String(c.id)] = false
                })
                return initialSelected
            })
        }
    }, [allClubs])

    const handleToggleSelectClub = (clubId: string | number) => {
        setSelectedClubs((prev) => ({ ...prev, [String(clubId)]: !prev[String(clubId)] }))
    }

    const handleRewardAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (value === '' || /^\d+$/.test(value)) {
            setRewardAmount(value === '' ? '' : parseInt(value, 10))
        }
    }

    const allSelected = useMemo(() => {
        if (allClubs.length === 0) {
            return false
        }
        return allClubs.every((club) => selectedClubs[String(club.id)] === true)
    }, [allClubs, selectedClubs])

    const handleToggleSelectAll = () => {
        const newSelectionState = !allSelected
        setSelectedClubs((prevSelected) => {
            const newSelected = { ...prevSelected }
            allClubs.forEach((club) => {
                newSelected[String(club.id)] = newSelectionState
            })
            return newSelected
        })
    }

    const selectedCount = useMemo(() => {
        return Object.values(selectedClubs).filter(v => v === true).length
    }, [selectedClubs])

    const {
        currentPage,
        totalPages,
        paginatedData: paginatedClubs,
        setCurrentPage,
    } = usePagination({ data: allClubs, initialPageSize: 8 })

    const handleDistributeRewards = async () => {
        if (rewardAmount === '' || rewardAmount <= 0) {
            toast({ 
                title: "Error", 
                description: "Please enter a valid reward amount.", 
                variant: "destructive" 
            })
            return
        }

        // Get selected clubs
        const selectedClubsList = allClubs.filter(club => selectedClubs[String(club.id)])
        if (selectedClubsList.length === 0) {
            toast({ 
                title: "No clubs selected", 
                description: "Please select at least one club to distribute rewards.", 
                variant: "destructive" 
            })
            return
        }

        setIsDistributing(true)
        try {
            // Collect all club IDs as numbers
            const targetIds = selectedClubsList.map(club => Number(club.id))

            // Call the new batch API
            const response = await pointsToClubs(
                targetIds,
                rewardAmount as number,
                "Giving Point Month"
            )

            if (response.success) {
                toast({
                    title: "Success",
                    description: response.message || `Distributed ${rewardAmount} points to ${selectedClubsList.length} club(s).`,
                    variant: "default"
                })
                setRewardAmount('')
            } else {
                throw new Error(response.message || "Failed to distribute points")
            }
        } catch (err: any) {
            toast({
                title: "Distribution Error",
                description: err?.response?.data?.message || err.message || "An error occurred.",
                variant: "destructive"
            })
        } finally {
            setIsDistributing(false)
        }
    }

    const loadTransactionHistory = async () => {
        setTransactionsLoading(true)
        try {
            const data = await getUniToClubTransactions()
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

    const MinimalPager = ({ current, total, onPrev, onNext }: { current: number; total: number; onPrev: () => void; onNext: () => void }) =>
        total > 1 ? (
            <div className="flex items-center justify-center gap-3 mt-4">
                <Button aria-label="Previous page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev} disabled={current === 1}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[2rem] text-center text-sm font-medium">Page {current} / {total}</div>
                <Button aria-label="Next page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onNext} disabled={current === total}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        ) : null

    return (
        <ProtectedRoute allowedRoles={["uni_staff"]}>
            <AppShell>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <ShieldCheck className="h-8 w-8 text-blue-600" /> Club Reward Distribution
                            </h1>
                            <p className="text-muted-foreground">Distribute reward points to university clubs.</p>
                        </div>
                        <Button
                            variant="outline"
                            size="default"
                            onClick={handleOpenHistoryModal}
                            className="flex items-center gap-2"
                        >
                            <History className="h-4 w-4" />
                            History
                        </Button>
                    </div>

                    {/* Transaction History Modal */}
                    <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
                        <DialogContent
                            className="
                                !max-w-none
                                w-[72vw]
                                lg:w-[68vw]
                                md:w-[78vw]
                                sm:w-[92vw]
                                h-[85vh]
                                overflow-y-auto p-8 rounded-xl shadow-2xl
                            "
                        >
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3 text-3xl font-bold">
                                    <History className="h-8 w-8" />
                                    University to Club Transaction History
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
                                        <p className="text-muted-foreground">No university-to-club transactions found.</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table className="min-w-full">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px]">ID</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead className="w-[25%]">Receiver Club</TableHead>
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Set Reward Parameters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reward-amount">Reward Points (per club)</Label>
                                <Input
                                    id="reward-amount"
                                    type="number"
                                    placeholder="Enter reward points..."
                                    value={rewardAmount}
                                    onChange={handleRewardAmountChange}
                                    disabled={isDistributing}
                                    min="1"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Selected clubs: <strong>{selectedCount} club(s)</strong>
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handleDistributeRewards}
                                disabled={isDistributing || rewardAmount === '' || rewardAmount <= 0 || selectedCount === 0}
                                className="w-full"
                            >
                                {isDistributing ? "Distributing..." : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Distribute {rewardAmount || 0} points to {selectedCount} club(s)
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Select Clubs ({allClubs.length})</h2>
                        {allClubs.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToggleSelectAll}
                                className="rounded-lg"
                            >
                                {allSelected ? "Deselect All" : "Select All"}
                            </Button>
                        )}
                    </div>
                    <div className="space-y-4">
                        {loading ? (
                            <p>Loading clubs...</p>
                        ) : error ? (
                            <p className="text-red-500">{error}</p>
                        ) : allClubs.length === 0 ? (
                            <p>No active clubs found.</p>
                        ) : (
                            <>
                                {paginatedClubs.map((club) => {
                                    const isSelected = selectedClubs[String(club.id)] || false
                                    return (
                                        <Card
                                            key={club.id}
                                            className={`transition-all duration-200 border-2 ${isSelected 
                                                ? "border-primary/70 bg-primary/5 shadow-sm" 
                                                : "border-transparent hover:border-muted"
                                            }`}
                                        >
                                            <CardContent className="py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="w-12 h-12">
                                                        <AvatarImage src={club.logoUrl || ""} alt={club.name} />
                                                        <AvatarFallback>{club.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-lg">{club.name}</p>
                                                        {club.leaderName && (
                                                            <p className="text-sm text-muted-foreground flex items-center">
                                                                <UserCircle className="mr-1.5 h-4 w-4" />
                                                                {club.leaderName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelectClub(club.id)}
                                                        className="w-5 h-5 accent-primary cursor-pointer transition-all duration-150"
                                                        style={{ transform: "scale(1.2)" }}
                                                        aria-label={`Select ${club.name}`}
                                                        title={`Select ${club.name}`}
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
                                    current={currentPage}
                                    total={totalPages}
                                    onPrev={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    onNext={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                />
                            </>
                        )}
                    </div>
                </div>
            </AppShell>
        </ProtectedRoute>
    )
}