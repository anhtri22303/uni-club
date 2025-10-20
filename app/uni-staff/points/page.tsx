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
import { Users, ShieldCheck, ChevronLeft, ChevronRight, Send } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// ✨ --- IMPORT API THẬT --- ✨
import { getAllClubs } from "@/service/clubApi" 
import { distributePointsToClubs } from "@/service/walletApi"

// Định nghĩa một kiểu dữ liệu cơ bản cho Club để tăng type-safety
// Bạn nên export interface `Club` từ file clubApi.ts và import ở đây để dùng chung
interface Club {
  id: number | string;
  name: string;
  logoUrl?: string | null;
  memberCount?: number;
  state?: 'ACTIVE' | 'INACTIVE';
}

export default function UniversityStaffRewardPage() {
    const { toast } = useToast()
    const [allClubs, setAllClubs] = useState<Club[]>([]) // Sử dụng type Club
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [selectedClubs, setSelectedClubs] = useState<Record<string, boolean>>({})
    const [rewardAmount, setRewardAmount] = useState<number | ''>('')
    const [isDistributing, setIsDistributing] = useState(false)

    // Tải danh sách tất cả các CLB khi component được mount bằng API thật
    useEffect(() => {
        const loadClubs = async () => {
            setLoading(true)
            try {
                // ✨ SỬ DỤNG API THẬT ✨
                const clubsData = await getAllClubs() 
                setAllClubs(clubsData) // Hàm getAllClubs đã lọc sẵn các CLB 'ACTIVE'
            } catch (err: any) {
                setError(err.message || "Error loading club list")
            } finally {
                setLoading(false)
            }
        }
        loadClubs()
    }, [])

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
    } = usePagination({ data: allClubs, initialPageSize: 5 })

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
            // ✨ SỬ DỤNG API THẬT ✨
            // Lưu ý thứ tự tham số: (clubIds, points)
            const result = await distributePointsToClubs(selectedClubIds, rewardAmount as number)
            
            // Giả định backend trả về một object có thuộc tính success
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

    // Giao diện (JSX) giữ nguyên không đổi
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
                                            className={`transition-all duration-200 border-2 ${
                                                isSelected ? "border-primary/70 bg-primary/5" : "border-transparent hover:border-muted"
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
                                                        <Badge variant="outline">
                                                            <Users className="mr-1.5 h-3 w-3" />
                                                            {club.memberCount} Members
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={isSelected ? "border-primary text-primary" : ""}
                                                    >
                                                        + {rewardAmount || 0} pts
                                                    </Button>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelectClub(club.id)}
                                                        className="w-5 h-5 accent-primary cursor-pointer"
                                                        style={{ transform: "scale(1.2)" }}
                                                    />
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