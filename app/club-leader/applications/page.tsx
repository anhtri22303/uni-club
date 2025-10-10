"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Modal } from "@/components/modal"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { UserCheck, Eye, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react"
import { fetchAllMemberApplications, approveMemberApplication, rejectMemberApplication } from "@/service/memberApplicationApi"

type MemberApplication = {
  applicationId: number
  userId: number
  userName: string
  clubId: number
  clubName: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  reason?: string | null
  reviewedBy?: string | null
  submittedAt: string
  updatedAt?: string | null
  studentCode?: string | null
  majorName?: string | null
  bio?: string | null
  // client-side only note when reviewer rejects:
  reviewNote?: string
}

export default function ClubLeaderApplicationsPage() {
  const { toast } = useToast()
  const [applications, setApplications] = useState<MemberApplication[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [reviewNote, setReviewNote] = useState("")

  // clubId leader đang quản lý (lấy từ localStorage.uniclub-auth)
  const [managedClubId, setManagedClubId] = useState<number | null>(null)
  const [managedClubName, setManagedClubName] = useState<string | null>(null)

  // Lấy clubId từ localStorage một lần khi mount (an toàn SSR)
  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = localStorage.getItem("uniclub-auth")
    if (!raw) {
      setManagedClubId(null)
      return
    }
    try {
      const parsed = JSON.parse(raw)
      // chấp nhận clubId là number hoặc string -> ép về number
      const cid = parsed?.clubId ?? parsed?.club_id
      const name = parsed?.clubName ?? parsed?.club_name ?? null
      const normalized = typeof cid === "string" ? parseInt(cid, 10) : cid
      setManagedClubId(Number.isFinite(normalized) ? normalized : null)
      setManagedClubName(typeof name === "string" ? name : null)
    } catch (e) {
      console.error("Failed to parse uniclub-auth:", e)
      setManagedClubId(null)
    }
  }, [])

  // Fetch dữ liệu application
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAllMemberApplications()
        setApplications(data as MemberApplication[])
      } catch (error) {
        toast({
          title: "Error loading applications",
          description: "Không thể tải danh sách đơn xin gia nhập.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toast])

  // Lọc theo clubId từ localStorage (safe when managedClubId is null)
  const clubApplications = useMemo(
    () =>
      managedClubId === null
        ? []
        : applications.filter((a) => Number(a.clubId) === managedClubId),
    [applications, managedClubId]
  )

  const pendingApplications = clubApplications.filter((a) => a.status === "PENDING")
  const reviewedApplications = clubApplications.filter((a) => a.status !== "PENDING")

  // Phân trang (pagination hooks MUST run on every render)
  const {
    currentPage: pendingPage,
    totalPages: pendingPages,
    paginatedData: paginatedPending,
    setCurrentPage: setPendingPage,
  } = usePagination({ data: pendingApplications, initialPageSize: 3 })

  const {
    currentPage: reviewedPage,
    totalPages: reviewedPages,
    paginatedData: paginatedReviewed,
    setCurrentPage: setReviewedPage,
  } = usePagination({ data: reviewedApplications, initialPageSize: 3 })

  const handleViewApplication = (application: MemberApplication) => {
    setSelectedApplication(application)
    setShowApplicationModal(true)
    setReviewNote("")
  }

  const MinimalPager = ({
    current,
    total,
    onPrev,
    onNext,
  }: {
    current: number
    total: number
    onPrev: () => void
    onNext: () => void
  }) =>
    total > 1 ? (
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev} disabled={current === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[2rem] text-center text-sm font-medium">{current}</div>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onNext} disabled={current === total}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    ) : null

  // Khi chưa có clubId (chưa đọc xong localStorage) thì chờ
  if (loading || managedClubId === null) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
          {managedClubId === null ? "Đang đọc thông tin câu lạc bộ..." : "Loading applications..."}
        </div>
      </AppShell>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Membership Applications</h1>
            <p className="text-muted-foreground">
              Review and manage new applications
              {managedClubName ? ` for ${managedClubName}` : ` for club #${managedClubId}`}
            </p>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" /> Pending ({pendingApplications.length})
              </TabsTrigger>
              <TabsTrigger value="reviewed" className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> Reviewed ({reviewedApplications.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending */}
            <TabsContent value="pending" className="space-y-4">
              {pendingApplications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
                    <p className="text-muted-foreground">All applications have been reviewed</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {paginatedPending.map((app) => (
                    <Card key={app.applicationId}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{app.userName}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                            </p>
                            {app.reason && <p className="text-sm mt-2 p-2 bg-muted rounded">"{app.reason}"</p>}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => handleViewApplication(app)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <MinimalPager
                    current={pendingPage}
                    total={pendingPages}
                    onPrev={() => setPendingPage(Math.max(1, pendingPage - 1))}
                    onNext={() => setPendingPage(Math.min(pendingPages, pendingPage + 1))}
                  />
                </>
              )}
            </TabsContent>

            {/* Reviewed */}
            <TabsContent value="reviewed" className="space-y-4">
              {reviewedApplications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reviewed Applications</h3>
                    <p className="text-muted-foreground">Applications you've reviewed will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {paginatedReviewed.map((app) => (
                    <Card key={app.applicationId}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{app.userName}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Reviewed: {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : "Recently"}
                            </p>
                            {app.reason && (
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                <span className="font-medium text-red-600">Application message:</span> "{app.reason}"
                              </p>
                            )}
                            {app.reviewNote && (
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                <span className="font-medium text-red-600">Review note:</span> "{app.reviewNote}"
                              </p>
                            )}
                          </div>
                          <Badge variant={app.status === "APPROVED" ? "default" : "destructive"}>
                            {app.status === "APPROVED" ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" /> Approved
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" /> Rejected
                              </>
                            )}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <MinimalPager
                    current={reviewedPage}
                    total={reviewedPages}
                    onPrev={() => setReviewedPage(Math.max(1, reviewedPage - 1))}
                    onNext={() => setReviewedPage(Math.min(reviewedPages, reviewedPage + 1))}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Modal review */}
          <Modal
            open={showApplicationModal}
            onOpenChange={setShowApplicationModal}
            title="Review Application"
            description={selectedApplication ? `Application from ${selectedApplication.userName}` : ""}
            showCloseButton={false}
          >
            {selectedApplication && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Applicant</Label>
                  <div className="p-3 bg-muted rounded">
                    <p className="font-medium">{selectedApplication.userName}</p>
                  </div>
                </div>

                {selectedApplication.reason && (
                  <div className="space-y-2">
                    <Label>Application Message</Label>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm">{selectedApplication.reason}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reviewNote">Review Note (Optional)</Label>
                  <Textarea
                    id="reviewNote"
                    placeholder="Add a note about your decision..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowApplicationModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      try {
                        await rejectMemberApplication(selectedApplication.applicationId, reviewNote)
                        toast({
                          title: "Đã từ chối đơn",
                          description: `Đơn của ${selectedApplication.userName} đã bị từ chối.`,
                        })
                        setShowApplicationModal(false)
                        setApplications((list) =>
                          list.map((app) =>
                            app.applicationId === selectedApplication.applicationId
                              ? { ...app, status: "REJECTED", reviewNote }
                              : app
                          )
                        )
                      } catch (error) {
                        toast({
                          title: "Lỗi từ chối đơn",
                          description: "Không thể từ chối đơn này.",
                          variant: "destructive",
                        })
                      }
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        await approveMemberApplication(selectedApplication.applicationId)
                        toast({
                          title: "Đã duyệt đơn",
                          description: `Đơn của ${selectedApplication.userName} đã được duyệt.`,
                        })
                        setShowApplicationModal(false)
                        setApplications((list) =>
                          list.map((app) =>
                            app.applicationId === selectedApplication.applicationId
                              ? { ...app, status: "APPROVED", reviewNote: undefined }
                              : app
                          )
                        )
                      } catch (error) {
                        toast({
                          title: "Lỗi duyệt đơn",
                          description: "Không thể duyệt đơn này.",
                          variant: "destructive",
                        })
                      }
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
