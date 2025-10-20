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
import { Users, Award, ChevronLeft, ChevronRight, Send } from "lucide-react"
import { getClubById, getClubIdFromToken } from "@/service/clubApi"
import { fetchUserById, fetchProfile } from "@/service/userApi"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface ClubMember {
  id: string;
  userId: string;
  clubId: string;
  role: string;
  status: string;
  joinedAt: string | null;
}

// Giả định service API mới
const rewardApi = {
  // Giả lập hàm phân phát điểm
  distributeRewards: async (clubId: string, amount: number, memberIds: string[]): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Distributing ${amount} points to ${memberIds.length} members of club ${clubId}`);
        resolve({ success: true, count: memberIds.length, amount });
      }, 1500); // Giả lập độ trễ API
    });
  }
}

export default function ClubLeaderRewardDistributionPage() {
  const { clubMemberships } = useData()
  const { toast } = useToast()
  const [managedClub, setManagedClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | number | null>(null)
  // === State và Logic tải dữ liệu thành viên (Tái sử dụng) ===
  const [apiMembers, setApiMembers] = useState<ApiMembership[] | null>(null)
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)

  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const clubId = getClubIdFromToken()
        if (!clubId) throw new Error("No club information found")

        const clubResponse = await getClubById(clubId)
        setManagedClub(clubResponse.data)

        const memberData = await membershipApi.getMembersByClubId(clubId)
        const membersWithUserData = await Promise.all(
          memberData.map(async (m: any) => {
            try {
              const userInfo = await fetchUserById(m.userId)
              return { ...m, userInfo }
            } catch {
              return { ...m, userInfo: null }
            }
          })
        )
        setApiMembers(membersWithUserData)
      } catch (err: any) {
        setMembersError(err.message || "Error loading members")
      } finally {
        setMembersLoading(false)
        setLoading(false)
      }
    }

    const loadProfile = async () => {
      try {
        const profile = await fetchProfile()
        // setUserId(profile?.userId)
        setUserId((profile as any)?.userId)
      } catch (err) {
        console.error("Failed to load profile:", err)
      }
    }

    loadProfile()
    loadData()
  }, [])
  // Chon thanh vien cu the de phan diem
  useEffect(() => {
    if (apiMembers) {
      const initialSelected: Record<string, boolean> = {}
      apiMembers.forEach((m: any) => {
        const id = m.membershipId ?? `m-${m.userId}`
        initialSelected[id] = false
      })
      setSelectedMembers(initialSelected)
    }
  }, [apiMembers])

  const handleToggleSelect = (memberId: string) => {
    setSelectedMembers((prev) => ({ ...prev, [memberId]: !prev[memberId] }))
  }

  const clubMembers = managedClub
    ? (apiMembers ?? [])
      .filter((m: any) => String(m.clubId) === String(managedClub.id) && m.state === "ACTIVE")
      .map((m: any) => {
        const u = m.userInfo || {}
        return {
          id: m.membershipId ?? `m-${m.userId}`,
          userId: m.userId,
          fullName: u.fullName ?? m.fullName ?? `User ${m.userId}`,
          studentCode: m.studentCode ?? "—",
          avatarUrl: m.avatarUrl ?? null,
          role: m.clubRole ?? "MEMBER",
        }
      })
    : []

  const {
    currentPage: membersPage,
    totalPages: membersPages,
    paginatedData: paginatedMembers,
    setCurrentPage: setMembersPage,
  } = usePagination({ data: clubMembers, initialPageSize: 8 }) // Tăng pageSize lên 5 cho ví dụ

  // === State và Logic phân phát điểm thưởng (Mới) ===
  const [rewardAmount, setRewardAmount] = useState<number | ''>('')
  const [isDistributing, setIsDistributing] = useState(false)

  const handleRewardAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Chỉ cho phép nhập số nguyên dương
    if (value === '' || /^\d+$/.test(value)) {
      setRewardAmount(value === '' ? '' : parseInt(value, 10))
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
    // const memberUserIds = clubMembers.map(m => m.userId)
    const memberUserIds = clubMembers.filter(m => selectedMembers[m.id]).map(m => m.userId)
    if (memberUserIds.length === 0) {
      toast({
        title: "No members selected",
        description: "Please select at least one member to distribute points.",
        variant: "destructive"
      })
      return
    }

    try {
      // Gọi API phân phát điểm thưởng
      const result = await rewardApi.distributeRewards(
        String(managedClub.id),
        rewardAmount as number,
        memberUserIds
      )

      if (result.success) {
        toast({
          title: "Success",
          description: `Distributed ${result.amount} points to ${result.count} members of ${managedClub.name}.`,
          variant: "default"
        })
        setRewardAmount('') // Reset số điểm sau khi thành công
      } else {
        throw new Error("Failure point distribution")
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
            <p className="text-muted-foreground">Distribute bonus points from club funds to members {managedClub?.name}.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Set up the Point Distribution Index</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reward-amount">Number of Bonus Points (per member)</Label>
                <Input
                  id="reward-amount"
                  type="number"
                  placeholder="Enter bonus points..."
                  value={rewardAmount}
                  onChange={handleRewardAmountChange}
                  disabled={isDistributing}
                  min="1"
                />
              </div>
              <p className="text-sm text-muted-foreground">Total number of members who will receive the bonus points: {clubMembers.length}</p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleDistributeRewards}
                disabled={isDistributing || rewardAmount === '' || rewardAmount <= 0}
                className="w-full"
              >
                {isDistributing ? "In the process of distribution..." : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Distribution {rewardAmount || 0} point
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          <Separator />
          {/* === Danh sách Thành viên === */}
          <h2 className="text-2xl font-semibold">List of Members ({clubMembers.length})</h2>

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
            ) : (
              <>
                {paginatedMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* <input
                          type="checkbox"
                          checked={selectedMembers[member.id] || false}
                          onChange={() => handleToggleSelect(member.id)}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        /> */}
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatarUrl || ""} alt={member.fullName} />
                          <AvatarFallback>{member.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.fullName}
                            <span className="text-muted-foreground text-sm ml-2">
                              ({member.studentCode})
                            </span>
                          </p>
                          <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                        </div>
                      </div>
                      {/* <Button variant="outline" size="sm">
                        + {rewardAmount || 0} pts
                      </Button> */}
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedMembers[member.id] || false}
                          onChange={() => handleToggleSelect(member.id)}
                          className="w-5 h-5 accent-primary cursor-pointer transition-all duration-150"
                          style={{ transform: "scale(1.2)" }}
                        />
                        <Button variant="outline" size="sm">
                          + {rewardAmount || 0} pts
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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