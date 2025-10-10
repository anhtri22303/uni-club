"use client"

import { useEffect, useState } from "react"
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
import clubs from "@/src/data/clubs.json"
import { fetchAllMemberApplications, approveMemberApplication, rejectMemberApplication } from "@/service/memberApplicationApi"


export default function ClubLeaderApplicationsPage() {
    const { toast } = useToast()
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedApplication, setSelectedApplication] = useState<any>(null)
    const [showApplicationModal, setShowApplicationModal] = useState(false)
    const [reviewNote, setReviewNote] = useState("")

    // Map id club FE ('c-ai') sang id số backend (ví dụ: 1)
    // Giả sử mapping tạm: 'c-ai' <-> 1, 'c-robot' <-> 2, ...
    const clubIdMap: Record<string, number> = {
        'c-ai': 1,
        'c-robot': 2,
        'c-music': 3,
        'c-sport': 4,
        'c-art': 5
    }
    const managedClub = { ...clubs[0], backendId: clubIdMap[clubs[0].id] }

    // 🟢 Lấy dữ liệu thật từ API
    useEffect(() => {
        const loadApplications = async () => {
            try {
                const data = await fetchAllMemberApplications()
                setApplications(data as any[])
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

        loadApplications()
    }, [toast])


    // Debug: log thực tế để kiểm tra dữ liệu
    useEffect(() => {
        console.log("managedClub.id", managedClub.id)
        console.log("applications", applications)
        if (applications && applications.length > 0) {
            applications.forEach((a, idx) => {
                console.log(`application[${idx}].clubId:`, a.clubId)
            })
        }
    }, [applications, managedClub.id])

    // 🧩 Phân loại trạng thái
    // Đảm bảo clubId so sánh đúng kiểu (API trả về number, local có thể là string)
    const pendingApplications = applications.filter(
        (a) => a.clubId === managedClub.backendId && a.status === "PENDING"
    )
    const reviewedApplications = applications.filter(
        (a) => a.clubId === managedClub.backendId && a.status !== "PENDING"
    )

    // 🔢 Phân trang
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

    const handleViewApplication = (application: any) => {
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
                            Review and manage new applications for {managedClub.name}
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

                        {/* Pending Applications */}
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
                                                    <div>
                                                        <h3 className="font-semibold">{app.userName}</h3>
                                                        <p className="text-sm text-muted-foreground">{app.clubName}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-sm mt-2 p-2 bg-muted rounded">Reason: "{app.reason}"</p>
                                                    </div>
                                                    <Button size="sm" variant="outline" onClick={() => handleViewApplication(app)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
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

                        {/* Reviewed Applications */}
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
                                                    <div>
                                                        <h3 className="font-semibold">{app.userName}</h3>
                                                        <p className="text-sm text-muted-foreground">{app.clubName}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Reviewed: {new Date(app.updatedAt).toLocaleDateString()}
                                                        </p>
                                                        {app.reason && (
                                                            <p className="text-sm mt-2 p-2 bg-muted rounded">
                                                                <span className="font-medium text-red-600">Reason:</span> "{app.reason}"
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge variant={app.status === "APPROVED" ? "default" : "destructive"}>
                                                        {app.status}
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
                </div>
            </AppShell>
        </ProtectedRoute>
    )
}
