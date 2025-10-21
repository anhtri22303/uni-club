"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building, Users, Calendar, Mail, GraduationCap, FileText, CheckCircle, XCircle, ArrowLeft, Clock, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { processClubApplication, ProcessApplicationBody, finalizeClubApplication } from "@/service/clubApplicationAPI"
import { useState } from "react"
import { useClubApplications } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

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
    category: string
    description: string
    faculty?: string
    expectedMembers?: number | null
    reason?: string
    requestedBy: string
    requestedByEmail: string
    requestDate: string
    status: string
  }

  // Use React Query hook to fetch all club applications
  const { data: applications = [], isLoading: loading, error } = useClubApplications()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const queryClient = useQueryClient()
  // Filter client-side to find the specific application by ID
  // params.id might be 'req-<id>' or numeric string. Support both.
  const found = applications.find((d: any) => `req-${d.applicationId}` === params.id || String(d.applicationId) === params.id)
  // NEW: State để quản lý modal từ chối
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false)
  const [rejectionReason, setRejectionReason] = useState<string>("")
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false) // NEW: For Finalize action
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState<boolean>(false)

  const request: UiDetail | null = found ? {
    applicationId: found.applicationId,
    id: `req-${found.applicationId}`,
    clubName: found.clubName,
    category: (found as any).category ?? "Unknown",
    description: found.description,
    faculty: (found as any).faculty ?? "-",
    expectedMembers: (found as any).expectedMembers ?? null,
    reason: (found as any).reason ?? found.description,
    requestedBy: found.submittedBy?.fullName ?? "Unknown",
    requestedByEmail: found.submittedBy?.email ?? "",
    requestDate: found.submittedAt ?? "",
    status: found.status,
  } : null

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

      alert("Application approved successfully!");
    } catch (error) {
      console.error("Failed to approve application:", error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 👇 4. Hàm xử lý khi nhấn nút "Reject"
  const handleReject = async () => {
    if (!request) return
    if (!rejectionReason.trim()) {
      alert("Please enter a reason for rejection.")
      return
    }

    const body: ProcessApplicationBody = {
      approve: false,
      rejectReason: rejectionReason,
      internalNote: "Rejected by Uni Staff."
    }
    setIsProcessing(true)
    try {
      await processClubApplication(request.applicationId, body)
      queryClient.invalidateQueries({ queryKey: ["club-applications"] })
      alert("Application rejected successfully!")
      // Đóng modal và reset state sau khi thành công
      setIsRejectModalOpen(false)
      setRejectionReason("")
    } catch (error) {
      console.error("Failed to reject application:", error)
      alert(`Error: ${(error as Error).message}`)
    } finally {
      setIsProcessing(false)
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
  // NEW: Handler for finalizing the application
  const handleFinalize = async () => {
    if (!request) return

    setIsFinalizing(true)
    try {
      await finalizeClubApplication(request.applicationId)
      queryClient.invalidateQueries({ queryKey: ["club-applications"] })
      alert("Club account created and application finalized successfully!")
      setIsFinalizeModalOpen(false)
    } catch (error) {
      console.error("Failed to finalize application:", error)
      alert(`Error: ${(error as Error).message}`)
    } finally {
      setIsFinalizing(false)
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
                      <Badge variant="outline">{request.category}</Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-1">{request.description}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Faculty</label>
                    <div className="flex items-center gap-2 mt-1">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{request.faculty}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expected Members</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{request.expectedMembers} members</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Purpose & Reason
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed">{request.reason}</p>
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
                    <Dialog open={isFinalizeModalOpen} onOpenChange={setIsFinalizeModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="default" disabled={isFinalizing}>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Create club account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Account Creation</DialogTitle>
                          <DialogDescription>
                            This will create an official account for <strong>{request.clubName}</strong> and finalize the application process. This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsFinalizeModalOpen(false)} disabled={isFinalizing}>Cancel</Button>
                          <Button onClick={handleFinalize} disabled={isFinalizing}>
                            {isFinalizing ? "Creating..." : "Confirm & Create Account"}
                          </Button>
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
