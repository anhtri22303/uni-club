"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton
import { useData } from "@/contexts/data-context"
import membershipApi, { ApiMembership } from "@/service/membershipApi"
import { getClubById, getClubIdFromToken } from "@/service/clubApi" // Import các hàm cần thiết
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Users, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { fetchUserById } from "@/service/userApi"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Define a type for the club (có thể đặt trong một file dùng chung)
interface Club {
  id: number;
  name: string;
  description: string;
  majorPolicyName: string;
  majorName: string;
  leaderId: number;
  leaderName: string;
}
interface ClubApiResponse {
  success: boolean;
  message: string;
  data: Club;
}

export default function ClubLeaderMembersPage() {
  const { clubMemberships } = useData()
  const { toast } = useToast()
  // State để lưu thông tin club và quản lý loading
  const [managedClub, setManagedClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiMembers, setApiMembers] = useState<ApiMembership[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)

  // useEffect để lấy thông tin club và thành viên
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        // 1. Lấy clubId từ token
        const clubId = getClubIdFromToken()
        if (!clubId) {
          throw new Error("Không tìm thấy thông tin câu lạc bộ của bạn.")
        }
        // 2. Lấy thông tin chi tiết của club
        const clubResponse = (await getClubById(clubId)) as ClubApiResponse
        if (clubResponse && clubResponse.success) {
          setManagedClub(clubResponse.data)
          // 3. Sau khi có club, tải danh sách thành viên
          setMembersLoading(true)
          setMembersError(null)
          // try {
          //   // Gọi đúng API để lấy danh sách member theo clubId
          //   const memberData = await membershipApi.getMembersByClubId(clubId)
          //   // Dùng Promise.all để fetch chi tiết từng user
          //   const membersWithUserData = await Promise.all(
          //     memberData.map(async (m: any) => {
          //       try {
          //         const userInfo = await fetchUserById(m.userId)
          //         console.log(`User info for ${m.userId}:`, userInfo)
          //         console.log("fetchUserById raw:", userInfo)
          //         return { ...m, userInfo }
          //       } catch (err) {
          //         console.warn(`Không thể lấy thông tin user ${m.userId}`, err)
          //         return { ...m, userInfo: null }
          //       }
          //     })
          //   )
          //   // setApiMembers(memberData)
          //   setApiMembers(membersWithUserData)
          //   console.log("MEMBER DATA:", membersWithUserData);
          //   console.table(membersWithUserData.map(m => ({
          //     userId: m.userId,
          //     fullName: m.userInfo?.fullName,
          //     email: m.userInfo?.email,
          //     avatarUrl: m.userInfo?.avatarUrl
          //   })))

          // } catch (err: any) {
          //   setMembersError(err?.message || "Failed to load members")
          // } finally {
          //   setMembersLoading(false)
          // }
          try {
            const memberData = await membershipApi.getMembersByClubId(clubId)
            console.log("MEMBER DATA FROM API:", memberData)

            setApiMembers(memberData)
          } catch (err: any) {
            setMembersError(err?.message || "Failed to load members")
          } finally {
            setMembersLoading(false)
          }
        } else {
          // throw new Error(clubResponse?.message || "Không thể tải thông tin câu lạc bộ.")
          throw new Error("Không thể tải thông tin câu lạc bộ.")
        }
      } catch (error: any) {
        setMembersError(error.message)
        console.error("Lỗi khi tải dữ liệu:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])
  console.log("CLUB ĐỂ LỌC (managedClub):", managedClub);
  console.log("DANH SÁCH MEMBER TỪ API (apiMembers):", apiMembers);


  // Lọc thành viên dựa trên managedClub đã được tải về
  const clubMembers = managedClub
    ? apiMembers
      .filter((m: any) => String(m.clubId) === String(managedClub.id) && m.state === "ACTIVE")
      // .map((m: any) => {
      //   const u = m.userInfo || {}
      //   return {
      //     id: m.membershipId ?? `m-${m.userId}`,
      //     userId: m.userId,
      //     clubId: m.clubId,
      //     fullName: u.fullName ?? m.fullName ?? `User ${m.userId}`,
      //     email: u.email ?? "N/A",
      //     phone: u.phone ?? "N/A",
      //     studentCode: u.studentCode ?? "N/A",
      //     majorName: u.majorName ?? "N/A",
      //     avatarUrl: u.avatarUrl ?? "/placeholder-user.jpg",
      //     role: m.clubRole ?? "MEMBER",
      //     status: m.state,
      //     joinedAt: m.joinedDate ? new Date(m.joinedDate).toLocaleDateString() : "N/A",
      //   }
      // })
      .map((m: any) => ({
        id: m.membershipId ?? `m-${m.userId}`,
        userId: m.userId,
        clubId: m.clubId,
        fullName: m.fullName ?? `User ${m.userId}`,
        email: m.email ?? "N/A",
        phone: m.phone ?? "N/A",
        studentCode: m.studentCode ?? "N/A",
        majorName: m.major ?? "N/A",
        avatarUrl: m.avatarUrl ?? "/placeholder-user.jpg",
        role: m.clubRole ?? "MEMBER",
        status: m.state,
        joinedAt: m.joinedDate ? new Date(m.joinedDate).toLocaleDateString() : "N/A",
      }))

    : []

  const {
    currentPage: membersPage,
    totalPages: membersPages,
    paginatedData: paginatedMembers,
    setCurrentPage: setMembersPage,
  } = usePagination({ data: clubMembers, initialPageSize: 5 }) // Tăng page size lên một chút

  const handleDeleteMember = (membershipId: string) => {
    const member = clubMembers.find((m) => m.id === membershipId)
    if (!member) return
    toast({ title: "Member Removed", description: `${member.fullName} has been removed from the club` })
    setMembersPage(1)
  }


  const MinimalPager = ({ current, total, onPrev, onNext }: { current: number; total: number; onPrev: () => void; onNext: () => void }) =>
    total > 1 ? (
      <div className="flex items-center justify-center gap-3 mt-4">
        <Button aria-label="Previous page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev} disabled={current === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[2rem] text-center text-sm font-medium">
          Page {current} of {total}
        </div>
        <Button aria-label="Next page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onNext} disabled={current === total}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    ) : null

  // Giao diện khi đang tải thông tin ban đầu
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-6">
            <div>
              <Skeleton className="h-9 w-1/4" />
              <Skeleton className="h-5 w-1/3 mt-2" />
            </div>
            <Card>
              <CardContent className="py-12 text-center">
                <p>Loading club information...</p>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }
  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Members</h1>
            {managedClub ? (
              <p className="text-muted-foreground">Manage membership of "{managedClub.name}""</p>
            ) : (
              <p className="text-destructive">Could not load club details. Please try again.</p>
            )}
          </div>
          <div className="space-y-4">
            {membersLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Loading members...</h3>
                  <p className="text-muted-foreground">Please wait while we fetch the latest members</p>
                </CardContent>
              </Card>
            ) : membersError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-destructive">Failed to load members</h3>
                  <p className="text-muted-foreground">{membersError}</p>
                </CardContent>
              </Card>
            ) : clubMembers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Members Yet</h3>
                  <p className="text-muted-foreground">Your club currently has no active members.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {paginatedMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        {/* Avatar + thông tin */}
                        <div className="flex items-center gap-4">
                          <img
                            src={member.avatarUrl}
                            alt={member.fullName}
                            className="w-12 h-12 rounded-full object-cover border border-gray-700"
                          />
                          <div>
                            <h3 className="font-semibold">{member.fullName}</h3>
                            <p className="text-xs text-muted-foreground">Joined: {member.joinedAt}</p>
                            <p className="text-xs text-muted-foreground">Email: {member.email}</p>
                            <p className="text-xs text-muted-foreground">Student code: {member.studentCode}</p>
                            <p className="text-xs text-muted-foreground">Major: {member.majorName}</p>
                          
                        </div>
                      </div>
                      {/* Role + Remove button */}
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{member.role}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
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
    </ProtectedRoute >
  )
}