"use client"

import { useEffect, useState, useMemo } from "react"
import { usePathname } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/modal"
import { DataTable } from "@/components/data-table"
import { useToast } from "@/hooks/use-toast"
import { Users, Trash, Plus, Loader2, Mail, X } from "lucide-react"
import { fetchClub, getClubMemberCount } from "@/service/clubApi"
import { fetchMajors, Major } from "@/service/majorApi" // Thêm import fetchMajors và Major

type ClubApiItem = {
  id: number
  name: string
  description?: string
  majorPolicyName?: string
  majorName?: string
  major?: { name?: string; id?: number } // Thêm id cho major
  leaderName?: string
  memberCount?: number
  approvedEvents?: number
}

export default function UniStaffClubsPage() {
  const { toast } = useToast()
  const pathname = usePathname()
  const [clubs, setClubs] = useState<ClubApiItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Remove add club modal and related states
  const [majors, setMajors] = useState<Major[]>([])

  // OTP Modal states
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpEmail, setOtpEmail] = useState("")
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  // Thêm Delete Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [clubToDelete, setClubToDelete] = useState<{ id: string, name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  // State để lưu description đang cần xem chi tiết
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null)

  // Fetch club list - Re-fetch when pathname changes (fix navigation issue)
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res: any = await fetchClub({ page: 0, size: 70, sort: ["name"] })
        const clubList = res?.data.content ?? []

        // Fetch member count for each club
        const clubsWithMemberCount = await Promise.all(
          clubList.map(async (club: ClubApiItem) => {
            const clubData = await getClubMemberCount(club.id)
            return {
              ...club,
              memberCount: clubData.activeMemberCount,
              approvedEvents: clubData.approvedEvents
            }
          })
        )

        if (mounted) setClubs(clubsWithMemberCount)
      } catch (err: any) {
        console.error(err)
        if (mounted) setError(err?.message ?? "Failed to load clubs")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [pathname])

  // Fetch Majors - Re-fetch when pathname changes
  useEffect(() => {
    const loadMajors = async () => {
      try {
        const majorsData = await fetchMajors();
        setMajors(majorsData);
      } catch (error) {
        console.error("Failed to load majors:", error);
        // Có thể hiển thị toast lỗi ở đây nếu cần
      }
    };

    loadMajors();
  }, [pathname]);

  // Map API data to match admin/clubs - Sử dụng useMemo để tính toán
  const enhancedClubs = useMemo(() => {
    return clubs.map((club) => {
      // 1. Lấy tên major
      let majorName = club.majorName ?? club.major?.name ?? "-";
      let majorColor = "#E2E8F0"; // Màu mặc định

      // 2. Tìm majorId (nếu có)
      // Giả định majorId có thể nằm ở club.major?.id hoặc majorPolicyId (tên không khớp hoàn toàn, nhưng có thể là intent)
      // Ta ưu tiên tìm major theo tên majorName mà API trả về (vì nó là cột chính)
      const majorId = club.major?.id || (club as any).majorId;

      // 3. Tìm Major trong danh sách đã fetch để lấy màu
      let foundMajor = majors.find(m => m.name === majorName);

      if (!foundMajor && majorId) {
        // Nếu không tìm thấy theo tên, thử tìm theo ID
        foundMajor = majors.find(m => m.id === Number(majorId));
      }

      if (foundMajor) {
        majorColor = foundMajor.colorHex || majorColor;
      }

      return {
        id: String(club.id),
        name: club.name,
        major: majorName, // Giữ nguyên tên major để lọc và hiển thị
        majorColor: majorColor, // Thêm majorColor vào enhancedClubs
        leaderName: club.leaderName ?? "-",
        description: club.description,
        members: club.memberCount ?? 0,
        events: club.approvedEvents ?? 0,
      }
    });
  }, [clubs, majors]); // Depend on clubs và majors

  // Delete logic matches admin/clubs
  // Hàm này chỉ MỞ MODAL
  const handleDelete = (id: string, name: string) => {
    setClubToDelete({ id, name })
    setShowDeleteModal(true)
  }

  // Hàm này THỰC HIỆN LOGIC XÓA
  const confirmDelete = async () => {
    if (!clubToDelete) return

    const { id, name } = clubToDelete
    setIsDeleting(true)

    try {
      await (await import("@/service/clubApi")).deleteClub(id);
      toast({ title: "Club Deleted", description: `Club '${name}' has been deleted.` });

      // Reload club list
      try {
        const res: any = await fetchClub({ page: 0, size: 70, sort: ["name"] });

        const clubList = res?.data?.content ?? [];

        const clubsWithMemberCount = await Promise.all(
          clubList.map(async (club: ClubApiItem) => {
            const clubData = await getClubMemberCount(club.id);
            return {
              ...club,
              memberCount: clubData.activeMemberCount,
              approvedEvents: clubData.approvedEvents
            };
          })
        );

        setClubs(clubsWithMemberCount);
      } catch (err) {
        toast({ title: "Reload Error", description: "Failed to reload club list.", variant: "destructive" });
      }

      // Sau khi xóa thành công hoặc thất bại do lỗi ràng buộc
    } catch (err) {
      toast({
        title: "Delete Failed",
        description: "Cannot delete this club. Please remove all related members and events before deleting.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setClubToDelete(null);
    }
  }

  // Dynamic filters based on actual data (like admin/clubs)
  const uniqueCategories = Array.from(new Set(clubs.map((c) => c.majorName).filter((v): v is string => !!v)));
  const uniqueLeaders = Array.from(new Set(clubs.map((c) => c.leaderName).filter((v): v is string => !!v)));

  const filters = [
    {
      key: "major",
      label: "Major Name",
      type: "select" as const,
      options: uniqueCategories.map((cat) => ({ value: cat, label: cat })),
    },
    {
      key: "leaderName",
      label: "Leader",
      type: "select" as const,
      options: uniqueLeaders.map((l) => ({ value: l, label: l })),
    },
  ];

  const columns = [
    {
      key: "name" as const,
      label: "Club Name",
      render: (value: string, club: any) => (
        <div>
          <div className="font-medium">{value}</div>
        </div>
      ),
    },

    {
      key: "major" as const,
      label: "Major Name",
      render: (value: string, club: any) => { // Nhận club object
        // Lấy majorColor từ club object đã được tính toán trong useMemo
        const color = club.majorColor || "#E2E8F0" // Sử dụng majorColor từ enhancedClubs
        return (
          <Badge
            variant="secondary"
            className="max-w-[160px] truncate"
            style={{ backgroundColor: color, color: "#fff" }} // Áp dụng màu động
          >
            {value || "-"}
          </Badge>
        )
      },
    },

    {
      key: "leaderName" as const,
      label: "Leader",
      render: (value: string) => (
        <div className="text-sm text-muted-foreground max-w-[180px] truncate" title={value}>
          {value || "-"}
        </div>
      ),
    },

    {
      key: "description" as const,
      label: "Description",
      render: (value: string) => (
        <div
          className="text-sm text-muted-foreground max-w-[200px] truncate cursor-pointer hover:text-primary hover:underline"
          title="Click to view full description" // Tooltip gợi ý
          onClick={() => setSelectedDescription(value)} // Mở modal khi click
        >
          {value || "-"}
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
      key: "events" as const,
      label: "Events",
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {value}
        </div>
      ),
    },
    {
      key: "id" as const,
      label: "Actions",
      render: (id: string, club: any) => (
        <button
          className="p-2 rounded hover:bg-red-100"
          title="Delete club"
          // SỬA: Gọi hàm handleDelete mới
          onClick={() => handleDelete(club.id, club.name)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ),
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        {/* Floating Send OTP button */}
        <Button
          aria-label="Send OTP to student"
          size="sm"
          variant="default"
          className="fixed top-4 right-4 z-50 rounded-full flex items-center justify-center gap-2"
          onClick={() => setShowOtpModal(true)}
        >
          <Mail className="h-5 w-5" />
          <span className="font-medium">Send OTP</span>
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Club Management</h1>
            <p className="text-muted-foreground">View and manage all student clubs</p>
          </div>

          <DataTable
            title="Club Directory"
            data={enhancedClubs}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search clubs..."
            filters={filters}
            initialPageSize={12}
            pageSizeOptions={[12, 24, 48]}
          />

          {loading && (
            <div className="text-center text-sm text-muted-foreground">
              Loading clubs...
            </div>
          )}
          {error && (
            <div className="text-center text-sm text-destructive">
              Error: {error}
            </div>
          )}
        </div>

        {/* OTP Modal */}
        <Modal
          open={showOtpModal}
          onOpenChange={setShowOtpModal}
          title="Send OTP to Student"
          description="Enter student email to send OTP for club application"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentEmail">Student Email</Label>
              <Input
                id="studentEmail"
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                placeholder="student@university.edu"
                className="border-slate-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOtpModal(false)
                  setOtpEmail("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!otpEmail.trim()) {
                    toast({
                      title: "Email Required",
                      description: "Please enter a student email address",
                      variant: "destructive",
                    })
                    return
                  }

                  // Basic email validation
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                  if (!emailRegex.test(otpEmail.trim())) {
                    toast({
                      title: "Invalid Email",
                      description: "Please enter a valid email address",
                      variant: "destructive",
                    })
                    return
                  }

                  setIsSendingOtp(true)
                  try {
                    const { sendOtp } = await import("@/service/clubApplicationAPI")
                    const result = await sendOtp(otpEmail.trim())

                    toast({
                      title: "OTP Sent Successfully",
                      description: result || `OTP has been sent to ${otpEmail}`,
                    })

                    // Reset and close modal
                    setShowOtpModal(false)
                    setOtpEmail("")
                  } catch (err: any) {
                    console.error("Error sending OTP:", err)
                    toast({
                      title: "Failed to Send OTP",
                      description: err?.response?.data?.message || err?.message || "An error occurred while sending OTP",
                      variant: "destructive",
                    })
                  } finally {
                    setIsSendingOtp(false)
                  }
                }}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Thêm Delete Confirmation Modal */}
        <Modal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          title={`Delete Club: ${clubToDelete?.name ?? '...'}`}
          description="Are you absolutely sure you want to delete this club? This action cannot 
          be undone and will permanently remove all associated data."
        >
          <div className="space-y-4">
            <p className="text-sm text-red-500 font-medium">
              Type the club name **<span className="font-bold">{clubToDelete?.name}</span>** below to confirm deletion.
            </p>

            <Input
              placeholder={clubToDelete?.name}
              id="confirmDelete"
              type="text"
              // Sử dụng state otpEmail tạm thời để lưu giá trị nhập vào cho việc xác nhận tên
              value={otpEmail}
              onChange={(e) => setOtpEmail(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setClubToDelete(null)
                  setOtpEmail("") // Reset input
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting || otpEmail.trim() !== clubToDelete?.name}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* --- MODAL XEM DESCRIPTION --- */}
        <Modal
          open={!!selectedDescription}
          onOpenChange={(open) => !open && setSelectedDescription(null)}
          title="Club Description"
          // description="Full details about the club."
        >
          <div className="mt-4">
            <div className="p-4 bg-slate-50 rounded-md border text-sm text-slate-700 max-h-[60vh] 
            overflow-y-auto whitespace-pre-wrap leading-relaxed border-slate-300">
              {selectedDescription || "No description available."}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setSelectedDescription(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>

      </AppShell>
    </ProtectedRoute>
  )
}
