"use client"

import { useState, useEffect, useMemo } from "react"
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
import {
  Users,
  Award, // Biểu tượng cho điểm thưởng
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react"

// Import data (giả định)
import clubs from "@/src/data/clubs.json"
import users from "@/src/data/users.json"

// Định nghĩa kiểu cho thành viên (cần khớp với cách map ở dưới)
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

  // For demo purposes, assume managing the first club
  const managedClub = clubs[0]

  // === State và Logic tải dữ liệu thành viên (Tái sử dụng) ===
  const [apiMembers, setApiMembers] = useState<ApiMembership[] | null>(null)
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setMembersLoading(true)
      setMembersError(null)
      try {
        // Gọi API để lấy danh sách thành viên của club
        const data = await membershipApi.getClubMembers() 
        if (!mounted) return
        setApiMembers(data)
      } catch (err: any) {
        setMembersError(err?.message || "Failed to load members")
      } finally {
        setMembersLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  // Map và lọc thành viên (Tái sử dụng)
  const clubMembers: ClubMember[] = useMemo(() => {
    // Ưu tiên dữ liệu từ API, nếu không có thì dùng dữ liệu mock (clubMemberships)
    const sourceMembers = apiMembers
      ? apiMembers
      : clubMemberships.filter((m: any) => 
          String(m.clubId) === String(managedClub.id) && 
          (m.state ? m.state === "ACTIVE" : m.status === "APPROVED")
        )

    return sourceMembers.map((m: any) => ({
      id: m.membershipId ?? m.id ?? `m-${m.userId}`,
      userId: String(m.userId),
      clubId: String(m.clubId),
      role: m.level ? m.level : m.role ?? "MEMBER",
      status: m.state ? (m.state === "ACTIVE" ? "APPROVED" : m.state) : m.status ?? "APPROVED",
      joinedAt: m.joinedAt ?? null,
    }));
  }, [apiMembers, clubMemberships, managedClub.id]);


  const getUserDetails = (userId: string) => {
    const found = users.find((u) => u.id === userId)
    if (found) return found
    // fallback minimal user when not available in local data
    return { id: userId, fullName: String(userId), email: "" }
  }

  // Phân trang (Tái sử dụng)
  const {
    currentPage: membersPage,
    totalPages: membersPages,
    paginatedData: paginatedMembers,
    setCurrentPage: setMembersPage,
  } = usePagination({ data: clubMembers, initialPageSize: 5 }) // Tăng pageSize lên 5 cho ví dụ

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
        title: "Lỗi", 
        description: "Vui lòng nhập số điểm thưởng lớn hơn 0.",
        variant: "destructive" 
      })
      return
    }

    if (clubMembers.length === 0) {
        toast({ 
            title: "Thông báo", 
            description: "Không có thành viên nào để phân phát điểm.",
            variant: "default" 
          })
          return
    }

    setIsDistributing(true)
    const memberUserIds = clubMembers.map(m => m.userId)

    try {
      // Gọi API phân phát điểm thưởng
      const result = await rewardApi.distributeRewards(
        String(managedClub.id), 
        rewardAmount as number, 
        memberUserIds
      )

      if (result.success) {
        toast({ 
          title: "Thành công 🎉", 
          description: `Đã phân phát ${result.amount} điểm cho ${result.count} thành viên của ${managedClub.name}.`,
          variant: "default" 
        })
        setRewardAmount('') // Reset số điểm sau khi thành công
      } else {
        throw new Error("Phân phát điểm thất bại")
      }
    } catch (err: any) {
      toast({ 
        title: "Lỗi phân phát", 
        description: err?.message || "Đã xảy ra lỗi trong quá trình phân phát điểm.",
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
              <Award className="h-8 w-8 text-yellow-500" /> Phân phát Điểm Thưởng
            </h1>
            <p className="text-muted-foreground">Phân phát điểm thưởng từ quỹ câu lạc bộ cho thành viên {managedClub.name}.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cài đặt Phân phát Điểm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reward-amount">Số Điểm Thưởng (mỗi thành viên)</Label>
                <Input
                  id="reward-amount"
                  type="number"
                  placeholder="Nhập số điểm..."
                  value={rewardAmount}
                  onChange={handleRewardAmountChange}
                  disabled={isDistributing}
                  min="1"
                />
              </div>
              <p className="text-sm text-muted-foreground">Tổng số thành viên sẽ nhận thưởng: **{clubMembers.length}**</p>
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={handleDistributeRewards} 
                    disabled={isDistributing || rewardAmount === '' || rewardAmount <= 0}
                    className="w-full"
                >
                    {isDistributing ? "Đang phân phát..." : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Phân phát {rewardAmount || 0} Điểm
                        </>
                    )}
                </Button>
            </CardFooter>
          </Card>

          <Separator />
          
          {/* === Danh sách Thành viên === */}
          <h2 className="text-2xl font-semibold">Danh sách Thành viên ({clubMembers.length})</h2>

          <div className="space-y-4">
            {membersLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Đang tải thành viên...</h3>
                  <p className="text-muted-foreground">Vui lòng chờ chúng tôi tìm nạp danh sách.</p>
                </CardContent>
              </Card>
            ) : membersError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Lỗi tải thành viên</h3>
                  <p className="text-muted-foreground">{membersError}</p>
                </CardContent>
              </Card>
            ) : clubMembers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Chưa có thành viên</h3>
                  <p className="text-muted-foreground">Hãy duyệt đơn đăng ký để thêm thành viên.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {paginatedMembers.map((membership) => {
                  const user = getUserDetails(membership.userId)
                  return (
                    <Card key={membership.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{user?.fullName ?? membership.userId}</h3>
                            <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Tham gia: {membership.joinedAt ? new Date(membership.joinedAt).toLocaleDateString() : "Gần đây"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="default">{membership.role}</Badge>
                            {/* Bạn có thể thêm trạng thái hoặc thông tin khác ở đây */}
                          </div>
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