"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building, Users, Calendar, Mail, GraduationCap, FileText, CheckCircle, XCircle, ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"
import { processClubApplication, ProcessApplicationBody } from "@/service/clubApplicationAPI"
import { useState } from "react"
import { useClubApplications } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
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
    if (!request) return
    const viceLeaderData = {
      viceLeaderEmail: "vleader@example.com",
      viceLeaderFullName: "Vice Leader Name",
      viceLeaderStudentCode: "SE123457",
      internalNote: "Approved by Uni Staff."
    }
    const body: ProcessApplicationBody = {
      approve: true,
      ...viceLeaderData
    }
    setIsProcessing(true)
    try {
      await processClubApplication(request.applicationId, body)
      // Invalidate cache to refetch updated status
      queryClient.invalidateQueries({ queryKey: ["club-applications"] })
      alert("Application approved successfully!")
    } catch (error) {
      console.error("Failed to approve application:", error)
      alert(`Error: ${(error as Error).message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // 👇 4. Hàm xử lý khi nhấn nút "Reject"
  const handleReject = async () => {
    if (!request) return
    const reason = prompt("Please enter the reason for rejection:")
    if (!reason) return
    const body: ProcessApplicationBody = {
      approve: false,
      rejectReason: reason,
      internalNote: "Rejected by Uni Staff."
    }
    setIsProcessing(true)
    try {
      await processClubApplication(request.applicationId, body)
      // Invalidate cache to refetch updated status
      queryClient.invalidateQueries({ queryKey: ["club-applications"] })
      alert("Application rejected successfully!")
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


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      // case "SUBMITTED":
      //   return (
      //     <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">
      //       <CheckCircle className="h-3 w-3 mr-1" />
      //       Submitted
      //     </Badge>
      //   )
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
                    {/* <Button className="w-full" variant="default">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Request
                    </Button> */}
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={handleApprove}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isProcessing ? "Approving..." : "Approve Request"}
                    </Button>

                    {/* <Button className="w-full" variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Request
                    </Button> */}
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {isProcessing ? "Rejecting..." : "Reject Request"}
                    </Button>

                    <Button 
                      className="w-full bg-transparent" 
                      variant="outline"
                      disabled={isProcessing}
                      onClick={() => window.location.href = `mailto:${request.requestedByEmail}`}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Requester
                    </Button>
                  </CardContent>
                </Card>
              ) }
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
