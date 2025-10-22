"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building, Calendar, Mail, FileText, CheckCircle, XCircle, ArrowLeft, Clock, ShieldCheck, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { processClubApplication, ProcessApplicationBody, createClubAccount, CreateClubAccountBody } from "@/service/clubApplicationAPI"
import { useState } from "react"
import { useClubApplications } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input" // ✅ CẬP NHẬT: Import Input

interface ClubRequestDetailPageProps {
  params: {
    id: string
  }
}

export default function ClubRequestDetailPage({ params }: ClubRequestDetailPageProps) {
  type UiDetail = {
    applicationId: number
    id: string
    clubName: string
    description: string
    majorName: string // THAY THẾ category/faculty
    vision: string // MỚI
    proposerReason: string // THAY THẾ reason
    requestedBy: string
    requestedByEmail: string
    requestDate: string
    status: string
    rejectReason?: string | null // MỚI
  }

  // Use React Query hook to fetch all club applications
  const { data: applications = [], isLoading: loading, error } = useClubApplications()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  // Filter client-side to find the specific application by ID
  const found = applications.find((d: any) => `req-${d.applicationId}` === params.id || String(d.applicationId) === params.id)
  // STATE
  const [rejectionReason, setRejectionReason] = useState<string>("")
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false) // NEW: For Finalize action
  const [isCreatingAccount, setIsCreatingAccount] = useState<boolean>(false) // Create Account
  // MODALS
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false)
  // const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState<boolean>(false)
  const [isCreateAccountModalOpen, setCreateAccountModalOpen] = useState<boolean>(false)
  // show password state
  const [showPassword, setShowPassword] = useState<boolean>(false);


  const [accountForm, setAccountForm] = useState({
    leaderFullName: "",
    leaderEmail: "",
    viceFullName: "",
    viceEmail: "",
    defaultPassword: "",
  })

  const request: UiDetail | null = found ? {
    applicationId: found.applicationId,
    id: `req-${found.applicationId}`,
    clubName: found.clubName,
    description: found.description,
    majorName: (found as any).majorName ?? "Unknown", // SỬ DỤNG majorName
    vision: (found as any).vision ?? "N/A", // SỬ DỤNG vision
    proposerReason: (found as any).proposerReason ?? "N/A", // SỬ DỤNG proposerReason
    // Swagger dùng 'proposer', code cũ dùng 'submittedBy'. Ưu tiên 'proposer'
    requestedBy: (found as any).proposer?.fullName ?? found.submittedBy?.fullName ?? "Unknown",
    requestedByEmail: (found as any).proposer?.email ?? found.submittedBy?.email ?? "",
    requestDate: found.submittedAt ?? "",
    status: found.status,
    rejectReason: (found as any).rejectReason ?? null, // SỬ DỤNG rejectReason
  } : null

  // Function to handle input change for the account creation form
  const handleAccountFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setAccountForm(prev => ({ ...prev, [id]: value }))
  }
  // 👇 3. Hàm xử lý khi nhấn nút "Approve"
  const handleApprove = async () => {
    if (!request) return;
    // Body giờ chỉ cần thông tin duy nhất là 'approve: true'
    // vì các trường khác trong ProcessApplicationBody đều là optional.
    const body: ProcessApplicationBody = {
      approve: true,
    };

    setIsProcessing(true);
    try {
      await processClubApplication(request.applicationId, body);
      // Invalidate cache để React Query tự động fetch lại danh sách
      // và cập nhật trạng thái mới trên giao diện.
      queryClient.invalidateQueries({ queryKey: ["club-applications"] });

      toast({
        title: "Success",
        description: "Application approved successfully!",
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to approve application:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to approve application",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false);
    }
  };

  // 👇 4. Hàm xử lý khi nhấn nút "Reject"
  const handleReject = async () => {
    if (!request) return
    if (!rejectionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a reason for rejection.",
        variant: "destructive",
      })
      return
    }
    const body: ProcessApplicationBody = {
      approve: false,
      rejectReason: rejectionReason.trim(),
    }
    setIsProcessing(true)
    try {
      await processClubApplication(request.applicationId, body)
      queryClient.invalidateQueries({ queryKey: ["club-applications"] })
      toast({
        title: "Success",
        description: "Application rejected successfully!",
        variant: "success",
      })
      // Đóng modal và reset state sau khi thành công
      setIsRejectModalOpen(false)
      setRejectionReason("")
    } catch (error) {
      console.error("Failed to reject application:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to reject application",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }
  // ✅ CẬP NHẬT: Hàm xử lý tạo tài khoản CLB
  const handleCreateClubAccount = async () => {
    if (!request) return;
    // ✅ HIỂN THỊ ID TRONG CONSOLE ĐỂ KIỂM TRA
    console.log("Submitting with clubId:", request.applicationId);
    // Simple validation
    for (const key in accountForm) {
      if (!accountForm[key as keyof typeof accountForm]) {
        toast({
          title: "Validation Error",
          description: `Field '${key}' cannot be empty.`,
          variant: "destructive"
        })
        return;
      }
    }

    const body: CreateClubAccountBody = {
      clubId: request.applicationId,
      ...accountForm
    }

    setIsCreatingAccount(true);
    try {
      await createClubAccount(body);
      queryClient.invalidateQueries({ queryKey: ["club-applications"] });
      toast({
        title: "Success",
        description: `Account for ${request.clubName} created successfully!`,
        variant: "success",
      });
      setCreateAccountModalOpen(false); // Close modal on success
    } catch (error) {
      console.error("Failed to create club account:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to create club account",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAccount(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["uni_staff"]}>
        <AppShell>
          <div className="py-8 text-center">Loading...</div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (error || !request) {
    return (
      <ProtectedRoute allowedRoles={["uni_staff"]}>
        <AppShell>
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Club Request Not Found</h1>
            <p className="text-muted-foreground mb-4">
              {error ? String(error) : "The requested club request could not be found."}
            </p>
            <Link href="/uni-staff/clubs-req">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Club Requests
              </Button>
            </Link>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["uni_staff"]}>
        <AppShell>
          <div className="py-8 text-center">Loading...</div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (error || !request) {
    return (
      <ProtectedRoute allowedRoles={["uni_staff"]}>
        <AppShell>
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Club Request Not Found</h1>
            <p className="text-muted-foreground mb-4">
              {error ? String(error) : "The requested club request could not be found."}
            </p>
            <Link href="/uni-staff/clubs-req">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Club Requests
              </Button>
            </Link>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link href="/uni-staff/clubs-req">
                <Button variant="ghost" size="sm" className="mb-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Club Requests
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">{request.clubName}</h1>
              <p className="text-muted-foreground">Club Registration Request Details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Club Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Club Name</label>
                    <p className="text-lg font-semibold">{request.clubName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <div className="mt-1">
                      <Badge variant="outline">{request.majorName}</Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-1">{request.description}</p>
                  </div>

                  {/* ✅ CẬP NHẬT: Thêm 'Vision' */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vision</label>
                    <div className="flex items-start gap-2 mt-1">
                      <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      <p className="mt-0">{request.vision}</p>
                    </div>
                  </div>


                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Proposer Reason
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed">{request.proposerReason}</p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Request Date</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(request.requestDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Requested By</label>
                    <p className="font-semibold mt-1">{request.requestedBy}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${request.requestedByEmail}`} className="text-blue-600 hover:underline">
                        {request.requestedByEmail}
                      </a>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                    <div className="mt-2">{getStatusBadge(request.status)}</div>
                  </div>
                  {/* ✅ CẬP NHẬT: Hiển thị lý do từ chối nếu có */}
                  {request.status === "REJECTED" && request.rejectReason && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-destructive">Rejection Reason</label>
                        <p className="mt-1 text-sm text-red-700">{request.rejectReason}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {request.status === "PENDING" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={handleApprove}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isProcessing ? "Approving..." : "Approve Request"}
                    </Button>

                    {/* NEW: Thay thế nút Reject cũ bằng Dialog */}
                    <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          variant="destructive"
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Request
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Reason for Rejection</DialogTitle>
                          <DialogDescription>
                            Please provide a clear reason for rejecting this club application. This will be saved for records.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="reason" className="text-right">
                              Reason
                            </Label>
                            <Textarea
                              id="reason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="col-span-3"
                              placeholder="Type your reason here..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsRejectModalOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isProcessing || !rejectionReason.trim()}
                          >
                            {isProcessing ? "Rejecting..." : "Confirm Rejection"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}
              {/* NEW ACTION CARD: APPROVED */}
              {request.status === "APPROVED" && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Next Step</CardTitle></CardHeader>
                  <CardContent>
                    <Dialog open={isCreateAccountModalOpen} onOpenChange={setCreateAccountModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="default" disabled={isCreatingAccount}><ShieldCheck className="h-4 w-4 mr-2" />Create Club Account</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Create Account for "{request.clubName}"</DialogTitle>
                          <DialogDescription>Enter the details for the club's leadership and a default password.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="leaderFullName" className="text-right">Leader Name</Label>
                            <Input id="leaderFullName" value={accountForm.leaderFullName} onChange={handleAccountFormChange} className="col-span-3 bg-white border border-slate-300" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="leaderEmail" className="text-right">Leader Email</Label>
                            <Input id="leaderEmail" type="email" value={accountForm.leaderEmail} onChange={handleAccountFormChange} className="col-span-3 bg-white border border-slate-300" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="viceFullName" className="text-right">Vice Name</Label>
                            <Input id="viceFullName" value={accountForm.viceFullName} onChange={handleAccountFormChange} className="col-span-3 bg-white border border-slate-300" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="viceEmail" className="text-right">Vice Email</Label>
                            <Input id="viceEmail" type="email" value={accountForm.viceEmail} onChange={handleAccountFormChange} className="col-span-3 bg-white border border-slate-300" />
                          </div>
                          {/* ✅ CẬP NHẬT: Ô nhập mật khẩu với nút xem/ẩn */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="defaultPassword" className="text-right">Password</Label>
                            <div className="relative col-span-3">
                              <Input
                                id="defaultPassword"
                                type={showPassword ? "text" : "password"}
                                value={accountForm.defaultPassword}
                                onChange={handleAccountFormChange}
                                className="bg-white border border-slate-300 pr-10" // Thêm padding-right
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCreateAccountModalOpen(false)} disabled={isCreatingAccount}>Cancel</Button>
                          <Button onClick={handleCreateClubAccount} disabled={isCreatingAccount}>{isCreatingAccount ? "Creating..." : "Confirm & Create"}</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
