"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { DataTable } from "@/components/data-table"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { useToast } from "@/hooks/use-toast"
import { Users, PlusIcon, Calendar, Loader2, Eye } from "lucide-react"
import { Loading } from "@/components/ui/loading"
import { fetchClub, getClubMemberCount } from "@/service/clubApi"
import { postMemAppli } from "@/service/memberApplicationApi"
import { safeSessionStorage } from "@/lib/browser-utils"
import { fetchMajors, Major } from "@/service/majorApi"
import { useClubs, useClubMemberCounts, useMyMemberApplications, queryKeys } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// We'll fetch clubs from the backend and only use the `content` array.
type ClubApiItem = {
  id: number
  name: string
  description?: string
  majorPolicyName?: string
  majorName?: string
  major?: { name?: string; majorName?: string }
  memberCount?: number
  approvedEvents?: number
}

export default function MemberClubsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { auth } = useAuth()
  const { clubMemberships, membershipApplications, addMembershipApplication, removeMembershipApplication, replaceMembershipApplication } = useData()
  const { toast } = useToast()
  const [selectedClub, setSelectedClub] = useState<any>(null)
  const [applicationText, setApplicationText] = useState("")
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)
  // club modal state
  const [showCreateClubModal, setShowCreateClubModal] = useState(false)
  const [newClubName, setNewClubName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newMajor, setNewMajor] = useState("")
  const [newProposerReason, setNewProposerReason] = useState("")
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  // state cho modal xem mô tả
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [selectedDescription, setSelectedDescription] = useState("")
  const [selectedClubName, setSelectedClubName] = useState("")
  // USE REACT QUERY instead of manual state
  const { data: clubs = [], isLoading: loading, error: queryError } = useClubs({ page: 0, size: 70, sort: ["name"] })
  const clubIds = clubs.map((club: ClubApiItem) => club.id)
  const { data: memberCounts = {}, isLoading: memberCountsLoading } = useClubMemberCounts(clubIds)
  // Fetch user's existing applications
  const { data: myApplications = [], isLoading: applicationsLoading } = useMyMemberApplications()

  useEffect(() => {
    // Tác dụng: Bất cứ khi nào bạn điều hướng đến trang này,
    // nó sẽ đánh dấu dữ liệu "clubs" và "myApplications" trong cache là "cũ".
    // Điều này buộc React Query phải tự động fetch lại dữ liệu mới,
    // giống như khi bạn nhấn F5.
    queryClient.invalidateQueries({ queryKey: queryKeys.clubs });
    queryClient.invalidateQueries({ queryKey: queryKeys.myMemberApplications() });

  }, [queryClient]); // Chỉ chạy một lần khi component được mount (tải)


  // Debug: Log clubs data when it loads
  useEffect(() => {

    if (clubs.length > 0) {
    }
  }, [clubs, loading, queryError, clubIds])

  // Debug: Log applications when they load
  useEffect(() => {
    if (myApplications.length > 0) {
    }
  }, [myApplications])

  const error = queryError ? (queryError as any)?.message ?? "Failed to load clubs" : null

  const [pendingClubIds, setPendingClubIds] = useState<string[]>([])
  // Khởi tạo userClubIds ngay từ đầu để tránh race condition
  const [userClubIds, setUserClubIds] = useState<number[]>(() => {
    try {
      const saved = safeSessionStorage.getItem("uniclub-auth")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.clubIds && Array.isArray(parsed.clubIds)) {
          return parsed.clubIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
        } else if (parsed.clubId) {
          return [Number(parsed.clubId)]
        }
      }
    } catch (error) {
      console.error("Failed to get clubId from sessionStorage:", error)
    }
    return []
  })
  const [userClubId, setUserClubId] = useState<number | null>(null) // Keep for backward compatibility
  const [majors, setMajors] = useState<Major[]>([])
  const [selectedMajorId, setSelectedMajorId] = useState<number | "">("")
  const [newVision, setNewVision] = useState("")

  // Combine clubs with member counts using useMemo (no extra API calls)
  const clubsWithData = useMemo(() => {
    if (clubs.length === 0) return []

    return clubs.map((club: ClubApiItem) => {
      const countData = memberCounts[club.id]
      return {
        ...club,
        memberCount: countData?.activeMemberCount ?? 0,
        approvedEvents: countData?.approvedEvents ?? 0
      }
    })
  }, [clubs, memberCounts])

  // Get user's current memberships and applications
  const userMemberships = clubMemberships.filter((m) => m.userId === auth.userId)
  const userApplications = membershipApplications.filter((a) => a.userId === auth.userId)

  // Đã khởi tạo userClubIds trong useState, không cần useEffect nữa
  // Chỉ cần set userClubId cho backward compatibility
  useEffect(() => {
    if (userClubIds.length > 0 && !userClubId) {
      setUserClubId(userClubIds[0])
    }
  }, [userClubIds, userClubId])

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        // Tải song song majors và locations
        const majorsData = await fetchMajors();
        setMajors(majorsData);

      } catch (error) {
        console.error("Failed to load dropdown data majors:", error);
        toast({
          title: "Error",
          description: "Could not load filter options.",
          variant: "destructive"
        })
      }
    };

    loadDropdownData();
  }, [toast]); // Thêm toast vào dependency array vì nó được sử dụng trong catch

  //  Wrap getClubStatus in useCallback to avoid unnecessary re-renders
  const getClubStatus = useCallback((clubId: string) => {
    // If we have a local pending marker for this club, show pending immediately
    if (pendingClubIds.includes(clubId)) return "pending"

    // Check memberships from context
    const membership = userMemberships.find((m) => m.clubId === clubId)
    if (membership?.status === "APPROVED") return "member"

    // Check applications from context (local state)
    const application = userApplications.find((a) => a.clubId === clubId)
    if (application?.status === "PENDING") return "pending"

    // Check applications from API (server state)
    const apiApplication = myApplications.find((app: any) => {
      const appClubId = String(app.clubId)
      const matches = appClubId === clubId && app.status === "PENDING"
      if (matches) {
      }
      return matches
    })
    if (apiApplication) return "pending"

    return "none"
  }, [pendingClubIds, userMemberships, userApplications, myApplications])

  // Map API items to table rows and filter out user's current clubs
  // Use useMemo to ensure proper dependency tracking and avoid race conditions
  const enhancedClubs = useMemo(() => {

    if (clubsWithData.length === 0) {
      return []
    }


    const filtered = clubsWithData.filter((club: ClubApiItem) => {
      // Hide clubs that user is already a member of
      const clubIdNumber = Number(club.id)
      if (userClubIds.length > 0 && userClubIds.includes(clubIdNumber)) {
        return false
      }
      return true
    })


    return filtered.map((club: ClubApiItem) => {
      // 1. Thử lấy tên major trực tiếp (logic cũ)
      let majorName = club.majorName ?? (club as any).major?.name ?? (club as any).major?.majorName
      let majorColor: string | undefined = undefined // Khởi tạo màu

      // 2. Nếu không có tên, thử tìm bằng ID
      // (Chúng ta cũng tìm ngay cả khi có tên, để lấy màu)
      if (majors.length > 0) {
        // Giả sử API trả về 'majorId' hoặc 'major' (dưới dạng ID hoặc object {id: ...})
        const clubMajorId = (club as any).majorId ?? (club as any).major?.id ?? (club as any).major

        if (clubMajorId) {
          const majorFromList = majors.find(m => m.id === Number(clubMajorId))
          if (majorFromList) {
            majorName = majorFromList.name // Đã tìm thấy tên từ danh sách majors
            majorColor = majorFromList.colorHex // Lấy colorHex từ danh sách
          }
        }
      }
      return {
        id: String(club.id),
        name: club.name,
        major: majorName ?? "", // Sử dụng tên đã được tìm thấy
        majorColor: majorColor ?? "#E2E8F0",
        description: club.description,
        members: club.memberCount ?? 0,
        founded: 0,
        // location: "",
        status: getClubStatus(String(club.id)),
        actions: undefined,
      }
    })
  }, [clubsWithData, userClubIds, majors, getClubStatus, myApplications, userMemberships, userApplications, pendingClubIds])


  const getMajorVariant = (major?: string) => {
    if (!major) return "outline"
    const m = major.toLowerCase()
    if (m.includes("design") || m.includes("arts")) return "secondary"
    if (m.includes("business") || m.includes("management")) return "destructive"
    if (m.includes("technology") || m.includes("computer") || m.includes("ai") || m.includes("artificial")) return "default"
    if (m.includes("environment") || m.includes("sustain")) return "secondary"
    // fallback
    return "outline"
  }

  // ĐỊNH NGHĨA `filters` MỚI Ở ĐÂY (BÊN TRONG COMPONENT)
  const filters = useMemo(() => {
    // 1. Chuyển đổi state `majors` thành options
    const majorOptions = majors
      .filter(m => m.active) // Chỉ hiển thị các ngành đang hoạt động
      .map((major: Major) => ({
        value: major.name, // Lọc theo tên
        label: major.name,
      }));

    // Trả về mảng filters
    return [
      {
        key: "major",
        label: "Major",
        type: "select" as const,
        options: majorOptions, // <-- DỮ LIỆU ĐỘNG
      },
      {
        key: "status",
        label: "Membership Status",
        type: "select" as const,
        options: [
          { value: "member", label: "Member" },
          { value: "pending", label: "Pending" },
          { value: "none", label: "Not Applied" },
        ],
      },
      {
        key: "members",
        label: "Member Count",
        type: "range" as const,
      },
      {
        key: "founded",
        label: "Founded Year",
        type: "range" as const,
      },
    ];
  }, [majors]); // Chỉ tính toán lại khi majors hoặc locations thay đổi

  const handleApply = (club: any) => {
    setSelectedClub(club)
    setShowApplicationModal(true)
  }

  // useEffect for fetching clubs - now using React Query hooks above
  const submitApplication = () => {
    if (!selectedClub || !applicationText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for joining",
        variant: "destructive",
      })
      return
    }

    // Call backend API to create membership application
    ; (async () => {
      if (!auth.userId) {
        toast({ title: "Not authenticated", description: "You must be signed in to apply", variant: "destructive" })
        return
      }

      setIsSubmittingApplication(true)

      const tempId = `temp-${Date.now()}`
      const tempApp = {
        id: tempId,
        clubId: selectedClub.id,
        userId: auth.userId,
        status: "PENDING",
        applicationText: applicationText.trim(),
        appliedAt: new Date().toISOString(),
      }

      // Optimistic update: add temp application to local context and mark club pending
      addMembershipApplication(tempApp)
      setPendingClubIds((p) => Array.from(new Set([...p, String(selectedClub.id)])))

      try {
        const serverRes: any = await postMemAppli({
          clubId: selectedClub.id,
          message: applicationText.trim(),
        })

        // Normalize server response to our local shape and replace temp entry
        if (serverRes) {
          const normalized = {
            id: String(serverRes.id ?? serverRes.applicationId ?? Date.now()),
            clubId: String(serverRes.clubId ?? selectedClub.id),
            userId: String(serverRes.userId ?? auth.userId),
            status: serverRes.status ?? "PENDING",
            applicationText: serverRes.reason ?? serverRes.applicationText ?? tempApp.applicationText,
            appliedAt: serverRes.submittedAt ?? serverRes.appliedAt ?? tempApp.appliedAt,
            // include any other fields the server returned for completeness
            ...serverRes,
          }

          replaceMembershipApplication(tempId, normalized)
          // Keep pending marker if server says PENDING, otherwise remove it
          if ((normalized.status ?? "").toUpperCase() !== "PENDING") {
            setPendingClubIds((p) => p.filter((id) => id !== String(selectedClub.id)))
          }
        } else {
          // If no response body, remove temp and inform user
          removeMembershipApplication(tempId)
          toast({ title: "Error", description: "Server did not return created application", variant: "destructive" })
          return
        }

        toast({
          title: "Application Submitted",
          // description: `Your application to ${selectedClub.name} has been submitted successfully`,
          description: `Successfully applied to ${serverRes.clubName || selectedClub.name}. Status: ${serverRes.status}`,
        })

        setShowApplicationModal(false)
        setApplicationText("")
        setSelectedClub(null)
        setIsSubmittingApplication(false)

        //  Invalidate React Query cache to refetch applications
        queryClient.invalidateQueries({ queryKey: queryKeys.myMemberApplications() })
        queryClient.invalidateQueries({ queryKey: queryKeys.clubs })

        // Refresh the page data (client-side Next.js refresh)
        try {
          router.refresh()
        } catch (e) {
          // fallback to full reload
          window.location.reload()
        }

      } catch (err: any) {
        // Rollback optimistic update
        removeMembershipApplication(tempId)
        // remove pending marker
        setPendingClubIds((p) => p.filter((id) => id !== String(selectedClub.id)))

        // Lấy thông báo gốc
        let apiMessage = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to submit application"

        // --- CẬP NHẬT: Trích xuất số lượng và tùy biến thông báo ---
        if (typeof apiMessage === 'string' && apiMessage.toLowerCase().includes("maximum number of clubs")) {
          const match = apiMessage.match(/\((\d+)\)/);
          const maxLimit = match ? match[1] : "Policy";

          // Kiểm tra xem giới hạn có phải là 1 không
          const isSingleClubLimit = maxLimit === "1";

          // Hiển thị toast với JSX để xuống dòng
          toast({
            title: "Participation limit reached",
            description: (
              <div className="flex flex-col gap-1 mt-2">
                {isSingleClubLimit ? (
                  // --- TRƯỜNG HỢP GIỚI HẠN LÀ 1 ---
                  <>
                    <span>
                      According to the major policy, you can only join <span className="font-bold">1</span> club.
                    </span>
                    <span>
                      You are already a member of a club. You must leave it before joining a new one.
                    </span>
                  </>
                ) : (
                  // --- TRƯỜNG HỢP GIỚI HẠN > 1 ---
                  <>
                    <span>
                      According to the major policy, you can join up to <span className="font-bold">{maxLimit}</span> clubs.
                    </span>
                    <span>
                      You have now reached this limit.
                    </span>
                  </>
                )}
              </div>
            ),
            variant: "destructive"
          })

          // QUAN TRỌNG: return luôn để không chạy xuống dòng toast mặc định ở dưới
          setIsSubmittingApplication(false)
          return
        }        // -----------------------------------------------------------

        const validationErrors = err?.response?.data?.errors

        if (validationErrors) {
          const firstKey = Object.keys(validationErrors)[0]
          const firstMsg = validationErrors[firstKey]
          toast({ title: "Validation error", description: firstMsg || apiMessage, variant: "destructive" })
        } else {
          // Hiển thị thông báo với tiêu đề thân thiện hơn
          toast({
            title: "Participation limit",
            description: apiMessage,
            variant: "destructive"
          })
        }

        setIsSubmittingApplication(false)
      }

    })()
  }

  const columns = [
    {
      key: "name" as const,
      label: "Club Name",
      render: (value: string, club: any) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{club.major}</div>
        </div>
      ),
    },
    {
      key: "major" as const,
      label: "Major",
      render: (value: string, club: any) => { // Nhận toàn bộ đối tượng 'club' (hàng)
        // Lấy màu từ 'club.majorColor' đã được thêm vào ở useMemo
        const color = club.majorColor || "#E2E8F0" // fallback nếu không có
        return (
          <Badge
            variant="secondary"
            className="max-w-[160px] truncate"
            style={{
              backgroundColor: color,
              color: "#fff", // chữ trắng cho rõ
            }}
          >
            {value || "-"} {/* 'value' vẫn là club.major (tên) */}
          </Badge>
        )
      },
    },
    {
      key: "description" as const,
      label: "Description",
      render: (value: string, club: any) => (
        <div className="flex items-center justify-between gap-2 max-w-[220px]">
          <div
            className="text-sm text-muted-foreground truncate"
          // title={value}
          >
            {value || "-"}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation() // Ngăn sự kiện click khác (nếu có)
              setSelectedClubName(club.name)
              setSelectedDescription(value)
              setShowDescriptionModal(true)
            }}
            title="View full description"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
    {
      key: "members" as const,
      label: "Members",
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {value}
        </div>
      ),
    },
    {
      key: "status" as const,
      label: "Status",
      render: (_: any, club: any) => {
        const status = getClubStatus(club.id)
        return (
          <Badge
            variant={status === "member" ? "default" : status === "pending" ? "secondary" : "outline"}
            className={
              status === "member"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                : status === "pending"
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            }
          >
            {status === "member" ? "Member" : status === "pending" ? "Pending" : "Not Applied"}
          </Badge>
        )
      },
    },
    {
      key: "actions" as const,
      label: "Actions",
      render: (_: any, club: any) => {
        const status = getClubStatus(club.id)
        const isProcessing = isSubmittingApplication && selectedClub?.id === club.id
        // Allow members to apply to clubs (except their current club which is already filtered out)
        return (
          <Button
            size="sm"
            variant={status === "none" ? "default" : "outline"}
            disabled={status !== "none" || isProcessing}
            onClick={() => handleApply(club)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Applying...
              </>
            ) : status === "member" ? (
              "Joined"
            ) : status === "pending" ? (
              "Applied"
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-1" />
                Apply
              </>
            )}
          </Button>
        )
      },
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        {/* Floating '+' button for create club */}
        <Button
          aria-label="Create club application"
          size="sm"
          variant="default"
          className="fixed top-4 right-4 z-50 rounded-full flex items-center justify-center"
          onClick={() => setShowCreateClubModal(true)}
        >
          <PlusIcon className="h-5 w-5" />
          <span className="font-medium">Create new club</span>
        </Button>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Club Directory</h1>
            <p className="text-muted-foreground">
              Discover and join clubs that match your interests.
            </p>
          </div>

          {(loading || memberCountsLoading || applicationsLoading) ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loading
                size="lg"
                text={loading ? "Loading clubs..." : applicationsLoading ? "Loading applications..." : "Loading member counts..."}
              />
            </div>
          ) : (
            <DataTable
              title="Club Directory"
              data={enhancedClubs}
              columns={columns}
              searchKey="name"
              searchPlaceholder="Search clubs..."
              filters={filters}
              initialPageSize={8}
              pageSizeOptions={[10, 20, 50]}
            />
          )}

          {error && (
            <div className="text-center text-sm text-destructive">Error: {error}</div>
          )}

          {/* Modal for applying to a club (join) */}
          <Modal
            open={showApplicationModal}
            onOpenChange={setShowApplicationModal}
            title={`Apply to ${selectedClub?.name}`}
            description="Tell us why you want to join this club"
          >
            {isSubmittingApplication ? (
              <div className="py-8">
                <Loading size="lg" text="Submitting your application..." />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="application">Why do you want to join?</Label>
                  <Textarea
                    id="application"
                    placeholder="Share your interests and what you hope to gain from joining this club..."
                    value={applicationText}
                    onChange={(e) => setApplicationText(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowApplicationModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitApplication}
                  >
                    Submit Application
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Modal form application for creating a new club */}
          <Modal
            open={showCreateClubModal}
            onOpenChange={setShowCreateClubModal}
            title="Create Club Application"
            className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="space-y-4 overflow-x-hidden">
              {/* Club Name */}
              <div className="space-y-2">
                <Label htmlFor="clubName">Club Name</Label>
                <Textarea
                  id="clubName"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  placeholder="Enter club name"
                  className="border-slate-400 break-words"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description ({newDescription.length}/300)
                </Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setNewDescription(e.target.value)
                    }
                  }}
                  placeholder="Enter description"
                  className="border-slate-400 break-words"
                  maxLength={300}
                />
              </div>

              {/* Vision */}
              <div className="space-y-2">
                <Label htmlFor="vision">Vision ({newVision.length}/300)</Label>
                <Textarea
                  id="vision"
                  value={newVision}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setNewVision(e.target.value)
                    }
                  }}
                  placeholder="Enter the club's vision"
                  className="border-slate-400 break-words"
                  maxLength={300}
                />
              </div>

              {/* Major Selection */}
              {/* <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <select
                  id="major"
                  aria-label="Major"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm border-slate-400"
                  value={selectedMajorId}
                  onChange={(e) => setSelectedMajorId(Number(e.target.value))}
                >
                  <option value="">Select a major</option>
                  {majors
                    .filter((m) => m.active)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div> */}
              {/* Major Selection - Đã thay đổi sang Shadcn UI */}
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Select
                  value={selectedMajorId ? selectedMajorId.toString() : ""}
                  onValueChange={(value) => setSelectedMajorId(Number(value))}
                >
                  <SelectTrigger
                    id="major"
                    className="w-full border-slate-400 focus:ring-offset-0 focus:ring-1 focus:ring-slate-400 rounded-lg w-2/3" // rounded-lg để bo tròn input
                  >
                    <SelectValue placeholder="Select a major" />
                  </SelectTrigger>

                  <SelectContent className="rounded-xl border-slate-200 shadow-lg bg-white dark:bg-slate-950">
                    {majors
                      .filter((m) => m.active)
                      .map((m) => (
                        <SelectItem
                          key={m.id}
                          value={m.id.toString()}
                          className="cursor-pointer rounded-md my-1 focus:bg-slate-100 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-slate-100"
                        >
                          {m.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Proposer Reason */}
              <div className="space-y-2">
                <Label htmlFor="proposerReason">
                  Proposer Reason ({newProposerReason.length}/300)
                </Label>
                <Textarea
                  id="proposerReason"
                  value={newProposerReason}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setNewProposerReason(e.target.value)
                    }
                  }}
                  placeholder="Why do you want to create this club?"
                  className="border-slate-400 break-words"
                  maxLength={300}
                />
              </div>


              {/* OTP Input */}
              <div className="space-y-2 w-1/4">
                <Label htmlFor="otpCode">OTP Code (6 digits)</Label>
                <Input
                  id="otpCode"
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '') // Only allow digits
                    if (value.length <= 6) {
                      setOtpCode(value)
                    }
                  }}
                  placeholder="Enter 6-digit OTP"
                  className="border-slate-400 break-words"
                  maxLength={6}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreateClubModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (
                      !newClubName.trim() ||
                      !newDescription.trim() ||
                      !selectedMajorId ||
                      !newVision.trim() ||
                      !newProposerReason.trim()
                    ) {
                      toast({
                        title: "Missing Information",
                        description: "Please fill in all fields.",
                        variant: "destructive",
                      })
                      return
                    }

                    if (!otpCode.trim()) {
                      toast({
                        title: "OTP Required",
                        description: "Please enter the OTP code sent to your email.",
                        variant: "destructive",
                      })
                      return
                    }

                    try {
                      const { postClubApplication } = await import("@/service/clubApplicationAPI")
                      const payload = {
                        clubName: newClubName.trim(),
                        description: newDescription.trim(),
                        majorId: selectedMajorId,
                        vision: newVision.trim(),
                        proposerReason: newProposerReason.trim(),
                      }

                      const created = await postClubApplication(payload, otpCode.trim())

                      toast({
                        title: "Application Sent",
                        description: `Your application for ${created.clubName} submitted successfully.`,
                        variant: "success",
                      })

                      // Reset form
                      setShowCreateClubModal(false)
                      setNewClubName("")
                      setNewDescription("")
                      setSelectedMajorId("")
                      setNewVision("")
                      setNewProposerReason("")
                      setOtpCode("")
                    } catch (err: any) {
                      console.error("Error submitting application:", err)
                      toast({
                        title: "Error",
                        description:
                          err?.response?.data?.error || err?.response?.data?.message ||
                          "Failed to send application",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  Send
                </Button>
              </div>
            </div>
          </Modal>

          {/* Thêm Modal để xem mô tả đầy đủ */}
          <Modal
            open={showDescriptionModal}
            onOpenChange={setShowDescriptionModal}
            // title={`-- ${selectedClubName} --`}
            title=""
            // description="Full club description"
            showCloseButton={false}
          >
            <div className="space-y-4">
              {/* Thêm header thủ công với padding top và căn giữa */}
              <div className=" text-center">
                <h2 className="text-lg font-semibold">
                  {`--- ${selectedClubName} ---`}
                </h2>
              </div>

              <div className="p-4 bg-muted rounded-md max-h-[60vh] overflow-y-auto">
                <p className="text-base text-center whitespace-pre-wrap">
                  {selectedDescription || "No description provided."}
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowDescriptionModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>

        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
