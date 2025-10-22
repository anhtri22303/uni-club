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
import { useMemberApplicationsByClub } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { UserCheck, Eye, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { approveMemberApplication, rejectMemberApplication } from "@/service/memberApplicationApi"
import { getClubIdFromToken, getClubById } from "@/service/clubApi"
type MemberApplication = {
  applicationId: number
  clubId: number
  clubName: string
  applicantId: number      // <- Sửa từ userId
  applicantName: string    // <- Sửa từ userName
  applicantEmail: string   // <- Thêm trường này từ API
  status: "PENDING" | "APPROVED" | "REJECTED"
  message: string          // <- Đây là lời nhắn của người nộp đơn
  reason?: string | null     // <- Đây là lý do duyệt/từ chối của leader
  handledById?: number | null
  handledByName?: string | null // <- Sửa từ reviewedBy
  createdAt: string        // <- Sửa từ submittedAt
  updatedAt: string
  studentCode?: string | null
  // client-side only note when reviewer rejects:
  reviewNote?: string
}
// Định nghĩa cấu trúc của một object Club
interface Club {
  id: number;
  name: string;
  // Thêm các trường khác nếu cần
  description: string;
  majorName: string;
  leaderId: number;
  leaderName: string;
}
// Định nghĩa cấu trúc cho toàn bộ response từ API getClubById
interface ClubApiResponse {
  success: boolean;
  message: string;
  data: Club;
}
export default function ClubLeaderApplicationsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)

  const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [reviewNote, setReviewNote] = useState("")

  // clubId leader đang quản lý (lấy từ localStorage.uniclub-auth)
  const [managedClubId, setManagedClubId] = useState<number | null>(null)
  const [managedClubName, setManagedClubName] = useState<string | null>(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)

  // ✅ USE REACT QUERY for member applications
  const { data: applications = [], isLoading: loading } = useMemberApplicationsByClub(
    managedClubId || 0,
    !!managedClubId
  )

  // Get club info when managedClubId is available
  useEffect(() => {
    const loadClubInfo = async () => {
      const clubId = getClubIdFromToken()
      if (clubId) {
        setManagedClubId(clubId)
        try {
          const clubResponse = await getClubById(clubId)
          if (clubResponse?.success && clubResponse.data) {
            setManagedClubName(clubResponse.data.name)
          }
        } catch (error) {
          console.error("Error loading club info:", error)
        }
      }
    }
    loadClubInfo()
  }, [])

  // Applications are already filtered by clubId from API, so use them directly
  const clubApplications = applications

  // Apply filters to applications
  const applyFilters = (apps: any[], isPending: boolean) => {
    return apps.filter((app: any) => {
      // Search by name, email, or student code
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchName = app.applicantName?.toLowerCase().includes(searchLower)
        const matchEmail = app.applicantEmail?.toLowerCase().includes(searchLower)
        const matchStudentCode = app.studentCode?.toLowerCase().includes(searchLower)
        if (!matchName && !matchEmail && !matchStudentCode) return false
      }

      // Filter by submission date (month and year)
      const submissionMonthFilter = activeFilters["submissionMonth"]
      if (submissionMonthFilter && submissionMonthFilter !== "all") {
        if (app.createdAt) {
          const appDate = new Date(app.createdAt)
          const filterDate = new Date(submissionMonthFilter)
          if (appDate.getMonth() !== filterDate.getMonth() || appDate.getFullYear() !== filterDate.getFullYear()) {
            return false
          }
        }
      }

      // For processed applications, filter by status
      if (!isPending) {
        const statusFilter = activeFilters["status"]
        if (statusFilter && statusFilter !== "all") {
          if (app.status !== statusFilter) return false
        }
      }

      return true
    })
  }

  const allPendingApplications = clubApplications.filter((a: any) => a.status === "PENDING")
  const allProcessedApplications = clubApplications.filter((a: any) => a.status !== "PENDING")

  const pendingApplications = applyFilters(allPendingApplications, true)
  const processedApplications = applyFilters(allProcessedApplications, false)

  // Get unique values for filters
  // (uniqueHandlers removed)

  // Filter handlers
  const handleFilterChange = (filterKey: string, value: any) => {
    setActiveFilters((prev) => ({ ...prev, [filterKey]: value }))
    setPendingPage(1)
    setReviewedPage(1)
  }

  const clearFilters = () => {
    setActiveFilters({})
    setSearchTerm("")
    setPendingPage(1)
    setReviewedPage(1)
  }

  const hasActiveFilters = Object.values(activeFilters).some((v) => v && v !== "all") || Boolean(searchTerm)

  // Phân trang (pagination hooks MUST run on every render)
  const {
    currentPage: pendingPage,
    totalPages: pendingPages,
    paginatedData: paginatedPending,
    setCurrentPage: setPendingPage,
  } = usePagination({ data: pendingApplications, initialPageSize: 8 })

  const {
    currentPage: reviewedPage,
    totalPages: reviewedPages,
    paginatedData: paginatedReviewed,
    setCurrentPage: setReviewedPage,
  } = usePagination({ data: processedApplications, initialPageSize: 8 })

  const handleViewApplication = (application: MemberApplication) => {
    setSelectedApplication(application)
    setShowApplicationModal(true)
    setReviewNote("")
  }

  const handleApprove = async (app: MemberApplication) => {
    setProcessingIds(prev => new Set([...prev, app.applicationId]))
    try {
      await approveMemberApplication(app.applicationId)
      toast({
        title: "Application approved",
        description: `${app.applicantName}'s application has been approved.`,
      })
      // ✅ Refetch with React Query
      queryClient.invalidateQueries({ queryKey: ["member-applications", "club", managedClubId] })
    } catch (error) {
      toast({
        title: "Error in application approval",
        description: "This application cannot be approved.",
        variant: "destructive",
      })
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(app.applicationId)
        return newSet
      })
    }
  }

  const handleReject = async (app: MemberApplication, reason = "Rejected by club leader") => {
    setProcessingIds(prev => new Set([...prev, app.applicationId]))
    try {
      await rejectMemberApplication(app.applicationId, reason)
      toast({
        title: "Application rejected",
        description: `${app.applicantName}'s application was rejected.`,
      })
      // ✅ Refetch with React Query
      queryClient.invalidateQueries({ queryKey: ["member-applications", "club", managedClubId] })
    } catch (error) {
      toast({
        title: "Application rejection error",
        description: "This application cannot be refused.",
        variant: "destructive",
      })
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(app.applicationId)
        return newSet
      })
    }
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

  // Khi chưa có clubId (chưa đọc xong localStorage) hoặc đang loading thì hiển thị loading
  if (managedClubId === null) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
          Reading club information...
        </div>
      </AppShell>
    )
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
          Loading applications...
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
              {managedClubName ? ` for "${managedClubName}` : ` for club #"${managedClubId}`}"
            </p>
          </div>

          {/* Filter Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search by applicant name, email, or student code..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPendingPage(1)
                    setReviewedPage(1)
                  }}
                  className="pl-4 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-lg border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-1 h-5 w-5 p-0 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center">
                    {Object.values(activeFilters).filter((v) => v && v !== "all").length + (searchTerm ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="space-y-4 p-6 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">Advanced Filters</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Submission Date Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Submission Month</label>
                    <Input
                      type="month"
                      value={activeFilters["submissionMonth"] || ""}
                      onChange={(e) => handleFilterChange("submissionMonth", e.target.value)}
                      className="h-9 text-sm rounded-lg border-slate-200 bg-white hover:border-slate-300 transition-colors"
                    />
                  </div>

                  {/* Status Filter (for processed tab) */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Status</label>
                    <Select
                      value={activeFilters["status"] || "all"}
                      onValueChange={(v) => handleFilterChange("status", v)}
                    >
                      <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200 bg-white hover:border-slate-300 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted rounded-lg p-1">
              <TabsTrigger
                value="pending"
                className="flex items-center gap-2
                          data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                          dark:data-[state=active]:bg-[#059669]
                          hover:bg-primary/10 dark:hover:bg-[#059669]/20 transition-colors"
              >
                <UserCheck className="h-4 w-4" /> Pending ({pendingApplications.length})
              </TabsTrigger>

              <TabsTrigger
                value="reviewed"
                className="flex items-center gap-2
                          data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                          dark:data-[state=active]:bg-[#059669]
                          hover:bg-primary/10 dark:hover:bg-[#059669]/20 transition-colors"
              >
                <Eye className="h-4 w-4" /> Processed ({processedApplications.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending */}
            <TabsContent value="pending" className="space-y-4">
              {/* Filter Summary */}
              {hasActiveFilters && allPendingApplications.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-700">
                    Showing {pendingApplications.length} of {allPendingApplications.length} pending application{allPendingApplications.length > 1 ? 's' : ''}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear filters
                  </Button>
                </div>
              )}

              {/* Bulk Actions */}
              {pendingApplications.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    {pendingApplications.length} pending application{pendingApplications.length > 1 ? 's' : ''}
                    {hasActiveFilters && ` (filtered)`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={bulkProcessing}
                      onClick={async () => {
                        const confirmReject = window.confirm(
                          `Bạn có chắc muốn từ chối tất cả ${pendingApplications.length} đơn xin gia nhập?`
                        )
                        if (!confirmReject) return

                        setBulkProcessing(true)
                        try {
                          await Promise.all(
                            pendingApplications.map((app: any) =>
                              rejectMemberApplication(app.applicationId, "Bulk rejected by club leader")
                            )
                          )
                          toast({
                            title: "Rejected all",
                            description: `${pendingApplications.length} application has been rejected.`,
                          })
                          // ✅ Refetch with React Query
                          queryClient.invalidateQueries({ queryKey: ["member-applications", "club", managedClubId] })
                        } catch (error) {
                          toast({
                            title: "Application rejection error",
                            description: "Some applications cannot be rejected..",
                            variant: "destructive",
                          })
                        } finally {
                          setBulkProcessing(false)
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {bulkProcessing ? "Processing..." : "Reject All"}
                    </Button>
                    <Button
                      size="sm"
                      disabled={bulkProcessing}
                      onClick={async () => {
                        const confirmApprove = window.confirm(
                          `Are you sure you want to browse all ${pendingApplications.length} applications?`
                        )
                        if (!confirmApprove) return

                        setBulkProcessing(true)
                        try {
                          await Promise.all(
                            pendingApplications.map((app: any) => approveMemberApplication(app.applicationId))
                          )
                          toast({
                            title: "All approved",
                            description: `${pendingApplications.length} application has been approved.`,
                          })
                          // ✅ Refetch with React Query
                          queryClient.invalidateQueries({ queryKey: ["member-applications", "club", managedClubId] })
                        } catch (error) {
                          toast({
                            title: "Error in application approval",
                            description: "Some applications cannot be approved..",
                            variant: "destructive",
                          })
                        } finally {
                          setBulkProcessing(false)
                        }
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {bulkProcessing ? "Processing..." : "Approve All"}
                    </Button>
                  </div>
                </div>
              )}

              {pendingApplications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    {hasActiveFilters ? (
                      <>
                        <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
                        <p className="text-muted-foreground mb-4">No pending applications match your current filters.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="rounded-lg border-slate-200 hover:bg-slate-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
                        <p className="text-muted-foreground">All applications have been reviewed</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {paginatedPending.map((app: any) => (
                    <Card key={app.applicationId}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{app.applicantName}</h3>
                            {/* <p className="text-xs text-muted-foreground mt-1">
                              Submitted: {new Date(app.createdAt).toLocaleDateString()}
                            </p> */}
                            {app.studentCode && (
                              <p className="text-sm text-muted-foreground">
                                Student Code: {app.studentCode}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Submitted: {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                            {app.message && <p className="text-sm mt-2 p-2 bg-muted rounded">"{app.message}"</p>}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewApplication(app)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(app)}
                              disabled={processingIds.has(app.applicationId)}
                              title="Reject application"
                            >
                              {processingIds.has(app.applicationId) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(app)}
                              disabled={processingIds.has(app.applicationId)}
                              title="Approve application"
                            >
                              {processingIds.has(app.applicationId) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
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
              {/* Filter Summary */}
              {hasActiveFilters && allProcessedApplications.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-700">
                    Showing {processedApplications.length} of {allProcessedApplications.length} processed application{allProcessedApplications.length > 1 ? 's' : ''}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear filters
                  </Button>
                </div>
              )}

              {processedApplications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    {hasActiveFilters ? (
                      <>
                        <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
                        <p className="text-muted-foreground mb-4">No processed applications match your current filters.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="rounded-lg border-slate-200 hover:bg-slate-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Processed Applications</h3>
                        <p className="text-muted-foreground">Applications you've processed will appear here</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {paginatedReviewed.map((app: any) => (
                    <Card key={app.applicationId}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{app.applicantName}</h3>
                            {app.studentCode && (
                              <p className="text-sm text-muted-foreground">
                                Student Code: {app.studentCode}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Reviewed: {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : "Recently"}
                            </p>
                            {app.reason && (
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                <span className="font-medium text-red-600">Application message:</span> "{app.message}"
                              </p>
                            )}
                            {app.reason && (
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                <span className="font-medium text-red-600">Review note:</span> "{app.reason}"
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
            description={selectedApplication ? `Application from ${selectedApplication.applicantName}` : ""}
            showCloseButton={false}
          >
            {selectedApplication && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Applicant</Label>
                  <div className="p-3 bg-muted rounded">
                    <p className="font-medium">{selectedApplication.applicantName}</p>
                    {selectedApplication.studentCode && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Student Code: {selectedApplication.studentCode}
                      </p>
                    )}
                  </div>
                </div>

                {selectedApplication.message && (
                  <div className="space-y-2">
                    <Label>Application Message</Label>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm">{selectedApplication.message}</p>
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
                  <Button 
                    variant="outline" 
                    onClick={() => setShowApplicationModal(false)}
                    disabled={selectedApplication && processingIds.has(selectedApplication.applicationId)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={selectedApplication && processingIds.has(selectedApplication.applicationId)}
                    onClick={async () => {
                      if (!selectedApplication) return
                      setProcessingIds(prev => new Set([...prev, selectedApplication.applicationId]))
                      try {
                        await rejectMemberApplication(selectedApplication.applicationId, reviewNote)
                        toast({
                          title: "Application rejected",
                          description: `${selectedApplication.applicantName}'s application was rejected.`,
                        })
                        setShowApplicationModal(false)
                        // ✅ Refetch with React Query
                        queryClient.invalidateQueries({ queryKey: ["member-applications", "club", managedClubId] })
                      } catch (error) {
                        toast({
                          title: "Application rejection error",
                          description: "This application cannot be refused.",
                          variant: "destructive",
                        })
                      } finally {
                        setProcessingIds(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(selectedApplication.applicationId)
                          return newSet
                        })
                      }
                    }}
                  >
                    {selectedApplication && processingIds.has(selectedApplication.applicationId) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </>
                    )}
                  </Button>
                  <Button
                    disabled={selectedApplication && processingIds.has(selectedApplication.applicationId)}
                    onClick={async () => {
                      if (!selectedApplication) return
                      setProcessingIds(prev => new Set([...prev, selectedApplication.applicationId]))
                      try {
                        await approveMemberApplication(selectedApplication.applicationId)
                        toast({
                          title: "Application approved",
                          description: `${selectedApplication.applicantName}'s application has been approved.`,
                        })
                        setShowApplicationModal(false)
                        // ✅ Refetch with React Query
                        queryClient.invalidateQueries({ queryKey: ["member-applications", "club", managedClubId] })
                      } catch (error) {
                        toast({
                          title: "Error in application approval",
                          description: "This application cannot be approved.",
                          variant: "destructive",
                        })
                      } finally {
                        setProcessingIds(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(selectedApplication.applicationId)
                          return newSet
                        })
                      }
                    }}
                  >
                    {selectedApplication && processingIds.has(selectedApplication.applicationId) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </>
                    )}
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
