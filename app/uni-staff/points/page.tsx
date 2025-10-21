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
import { Users, ShieldCheck, ChevronLeft, ChevronRight, Send, UserCircle } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
// ✨ --- IMPORT API THẬT --- ✨
import { fetchClub } from "@/service/clubApi"
import { distributePointsToClubs } from "@/service/walletApi"

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

    // Tải danh sách tất cả các CLB khi component được mount bằng API thật
    useEffect(() => {
        const loadClubs = async () => {
            setLoading(true);
            try {
                // response bây giờ sẽ có dạng { content: [...] }
                const response = await fetchClub({ page: 0, size: 1000, sort: ["name"] });

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

    // Khởi tạo trạng thái "chọn" cho mỗi CLB khi danh sách được tải
    useEffect(() => {
        if (allClubs.length > 0) {
            const initialSelected: Record<string, boolean> = {}
            allClubs.forEach(club => {
                initialSelected[club.id] = false
            })
            setSelectedClubs(initialSelected)
        }
    }, [allClubs])

    const handleToggleSelectClub = (clubId: string | number) => {
        setSelectedClubs(prev => ({ ...prev, [clubId]: !prev[clubId] }))
    }

    const handleRewardAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (value === '' || /^\d+$/.test(value)) {
            setRewardAmount(value === '' ? '' : parseInt(value, 10))
        }
    }

    const selectedClubCount = useMemo(() => {
        return Object.values(selectedClubs).filter(Boolean).length
    }, [selectedClubs])

    const {
        currentPage,
        totalPages,
        paginatedData: paginatedClubs,
        setCurrentPage,
    } = usePagination({ data: allClubs, initialPageSize: 8 })

    const handleDistributeRewards = async () => {
        if (rewardAmount === '' || rewardAmount <= 0) {
            toast({ title: "Error", description: "Please enter a valid reward amount.", variant: "destructive" })
            return
        }

        const selectedClubIds = Object.keys(selectedClubs).filter(clubId => selectedClubs[clubId])

        if (selectedClubIds.length === 0) {
            toast({ title: "No clubs selected", description: "Please select at least one club to distribute rewards.", variant: "destructive" })
            return
        }

        setIsDistributing(true)
        try {
            const result = await distributePointsToClubs(selectedClubIds, rewardAmount as number)

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Successfully distributed ${rewardAmount} points to ${selectedClubIds.length} clubs.`,
                    variant: "default"
                })
                setRewardAmount('')
                const resetSelection: Record<string, boolean> = {}
                allClubs.forEach(c => { resetSelection[c.id] = false })
                setSelectedClubs(resetSelection)
            } else {
                throw new Error(result.message || "Failed to distribute rewards.")
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
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <ShieldCheck className="h-8 w-8 text-blue-600" /> Club Reward Distribution
                        </h1>
                        <p className="text-muted-foreground">Distribute reward points to university clubs.</p>
                    </div>

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
                                Total selected clubs: <strong>{selectedClubCount}</strong>
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handleDistributeRewards}
                                disabled={isDistributing || rewardAmount === '' || rewardAmount <= 0 || selectedClubCount === 0}
                                className="w-full"
                            >
                                {isDistributing ? "Distributing..." : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Distribute {rewardAmount || 0} points to {selectedClubCount} clubs
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Separator />

                    <h2 className="text-2xl font-semibold">Club List ({allClubs.length})</h2>

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
                                    const isSelected = selectedClubs[club.id] || false
                                    return (
                                        <Card
                                            key={club.id}
                                            className={`transition-all duration-200 border-2 ${isSelected ? "border-primary/70 bg-primary/5" : "border-transparent hover:border-muted"
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
                                                        {/* {club.memberCount !== undefined && (
                                                            <Badge variant="outline">
                                                                <Users className="mr-1.5 h-3 w-3" />
                                                                {club.memberCount} Members
                                                            </Badge>
                                                        )} */}
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
                                                        className="w-5 h-5 accent-primary cursor-pointer scale-125"
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