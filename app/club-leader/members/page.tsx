"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Modal } from "@/components/modal"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import {
  Users,
  UserCheck,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

// Import data
import clubs from "@/src/data/clubs.json"
import users from "@/src/data/users.json"

export default function ClubLeaderMembersPage() {
  const { auth } = useAuth()
  const { clubMemberships, membershipApplications, updateClubMemberships, updateMembershipApplications } = useData()
  const { toast } = useToast()

  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [reviewNote, setReviewNote] = useState("")

  // For demo purposes, assume managing the first club
  const managedClub = clubs[0]

  const mockPendingApplications = [
    {
      id: "app-1",
      clubId: managedClub.id,
      userId: "u-pending-1",
      status: "PENDING",
      appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      applicationText:
        "I'm passionate about AI and machine learning. I have experience with Python and TensorFlow, and I'd love to contribute to club projects and learn from other members.",
    },
    {
      id: "app-2",
      clubId: managedClub.id,
      userId: "u-pending-2",
      status: "PENDING",
      appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      applicationText:
        "I'm a computer science student interested in deep learning and neural networks. I want to participate in hackathons and collaborative AI projects.",
    },
    {
      id: "app-3",
      clubId: managedClub.id,
      userId: "u-pending-3",
      status: "PENDING",
      appliedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      applicationText:
        "I have a background in data science and would like to explore AI applications in healthcare. Looking forward to networking with like-minded individuals.",
    },
  ]

  const mockPendingUsers = [
    { id: "u-pending-1", fullName: "Sarah Chen", email: "sarah.chen@university.edu", role: "member" },
    { id: "u-pending-2", fullName: "Michael Rodriguez", email: "m.rodriguez@university.edu", role: "member" },
    { id: "u-pending-3", fullName: "Emily Johnson", email: "emily.j@university.edu", role: "member" },
  ]

  const mockRejectedApplications = [
    {
      id: "app-rejected-1",
      clubId: managedClub.id,
      userId: "u-rejected-1",
      status: "REJECTED",
      appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      reviewNote:
        "Insufficient experience with AI/ML technologies. We recommend gaining more hands-on experience before reapplying.",
    },
    {
      id: "app-rejected-2",
      clubId: managedClub.id,
      userId: "u-rejected-2",
      status: "REJECTED",
      appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      reviewNote:
        "Application lacks specific examples of relevant projects or coursework. Please provide more detailed information about your background.",
    },
    {
      id: "app-rejected-3",
      clubId: managedClub.id,
      userId: "u-rejected-3",
      status: "REJECTED",
      appliedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      reviewedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      reviewNote:
        "Currently at capacity for new members. We encourage you to reapply next semester when spots become available.",
    },
    {
      id: "app-rejected-4",
      clubId: managedClub.id,
      userId: "u-rejected-4",
      status: "REJECTED",
      appliedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      reviewNote:
        "Application does not demonstrate sufficient commitment to club activities and time availability conflicts with meeting schedule.",
    },
  ]

  const mockRejectedUsers = [
    { id: "u-rejected-1", fullName: "David Kim", email: "david.kim@university.edu", role: "member" },
    { id: "u-rejected-2", fullName: "Lisa Thompson", email: "lisa.t@university.edu", role: "member" },
    { id: "u-rejected-3", fullName: "James Wilson", email: "j.wilson@university.edu", role: "member" },
    { id: "u-rejected-4", fullName: "Maria Garcia", email: "maria.garcia@university.edu", role: "member" },
  ]

  // Get club-specific data
  const clubMembers = clubMemberships.filter((m) => m.clubId === managedClub.id && m.status === "APPROVED")
  const pendingApplications = mockPendingApplications
  const reviewedApplications = [
    ...membershipApplications.filter((a) => a.clubId === managedClub.id && a.status !== "PENDING"),
    ...mockRejectedApplications,
  ]

  // pagination hooks... (same as source)
  const {
    currentPage: pendingPage,
    totalPages: pendingPages,
    paginatedData: paginatedPending,
    setCurrentPage: setPendingPage,
  } = usePagination({ data: pendingApplications, initialPageSize: 3 })

  const {
    currentPage: membersPage,
    totalPages: membersPages,
    paginatedData: paginatedMembers,
    setCurrentPage: setMembersPage,
  } = usePagination({ data: clubMembers, initialPageSize: 3 })

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

  const handleQuickApprove = (applicationId: string) => {
    const application = pendingApplications.find((a) => a.id === applicationId)
    if (!application) return
    toast({ title: "Application Approved", description: "The member has been added to your club" })
    setPendingPage(1)
  }

  const handleQuickReject = (applicationId: string) => {
    toast({ title: "Application Rejected", description: "The application has been rejected" })
    setPendingPage(1)
  }

  const handleDeleteMember = (membershipId: string) => {
    const member = clubMembers.find((m) => m.id === membershipId)
    if (!member) return
    const user = getUserDetails(member.userId)
    toast({ title: "Member Removed", description: `${user?.fullName} has been removed from the club` })
    setMembersPage(1)
  }

  const handleApprove = (applicationId: string) => {
    const application = membershipApplications.find((a) => a.id === applicationId)
    if (!application) return

    const updatedApplications = membershipApplications.map((a) =>
      a.id === applicationId ? { ...a, status: "APPROVED", reviewedAt: new Date().toISOString(), reviewNote } : a,
    )
    updateMembershipApplications(updatedApplications)

    const newMembership = {
      id: `m-${Date.now()}`,
      clubId: application.clubId,
      userId: application.userId,
      role: "MEMBER",
      status: "APPROVED",
      joinedAt: new Date().toISOString(),
    }
    updateClubMemberships([...clubMemberships, newMembership])

    toast({ title: "Application Approved", description: "The member has been added to your club" })
    setShowApplicationModal(false)
    setSelectedApplication(null)
    setReviewNote("")
    setPendingPage(1)
    setMembersPage(1)
    setReviewedPage(1)
  }

  const handleReject = (applicationId: string) => {
    const updatedApplications = membershipApplications.map((a) =>
      a.id === applicationId ? { ...a, status: "REJECTED", reviewedAt: new Date().toISOString(), reviewNote } : a,
    )
    updateMembershipApplications(updatedApplications)

    toast({ title: "Application Rejected", description: "The application has been rejected" })
    setShowApplicationModal(false)
    setSelectedApplication(null)
    setReviewNote("")
    setPendingPage(1)
    setReviewedPage(1)
  }

  const getUserDetails = (userId: string) => {
    return (
      users.find((u) => u.id === userId) || mockPendingUsers.find((u) => u.id === userId) || mockRejectedUsers.find((u) => u.id === userId)
    )
  }

  const MinimalPager = ({ current, total, onPrev, onNext }: { current: number; total: number; onPrev: () => void; onNext: () => void }) =>
    total > 1 ? (
      <div className="flex items-center justify-center gap-3">
        <Button aria-label="Previous page" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev} disabled={current === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[2rem] text-center text-sm font-medium">{current}</div>
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
            <h1 className="text-3xl font-bold">Members & Applications</h1>
            <p className="text-muted-foreground">Manage {managedClub.name} membership</p>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Pending ({pendingApplications.length})
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members ({clubMembers.length})
              </TabsTrigger>
              <TabsTrigger value="reviewed" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Reviewed ({reviewedApplications.length})
              </TabsTrigger>
            </TabsList>

            {/* PENDING */}
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
                  {paginatedPending.map((application) => {
                    const user = getUserDetails(application.userId)
                    return (
                      <Card key={application.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold">{user?.fullName}</h3>
                              <p className="text-sm text-muted-foreground">{user?.email}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Applied: {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : "Recently"}
                              </p>
                              {application.applicationText && (
                                <p className="text-sm mt-2 p-2 bg-muted rounded">"{application.applicationText}"</p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 bg-transparent"
                                onClick={() => handleQuickApprove(application.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                                onClick={() => handleQuickReject(application.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleViewApplication(application)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  <MinimalPager
                    current={pendingPage}
                    total={pendingPages}
                    onPrev={() => setPendingPage(Math.max(1, pendingPage - 1))}
                    onNext={() => setPendingPage(Math.min(pendingPages, pendingPage + 1))}
                  />
                </>
              )}
            </TabsContent>

            {/* MEMBERS */}
            <TabsContent value="members" className="space-y-4">
              {clubMembers.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Members Yet</h3>
                    <p className="text-muted-foreground">Approve applications to add members</p>
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
                              <h3 className="font-semibold">{user?.fullName}</h3>
                              <p className="text-sm text-muted-foreground">{user?.email}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Joined: {membership.joinedAt ? new Date(membership.joinedAt).toLocaleDateString() : "Recently"}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="default">{membership.role}</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                                onClick={() => handleDeleteMember(membership.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
            </TabsContent>

            {/* REVIEWED */}
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
                  {paginatedReviewed.map((application) => {
                    const user = getUserDetails(application.userId)
                    return (
                      <Card key={application.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold">{user?.fullName}</h3>
                              <p className="text-sm text-muted-foreground">{user?.email}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Reviewed: {application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString() : "Recently"}
                              </p>
                              {application.reviewNote && (
                                <p className="text-sm mt-2 p-2 bg-muted rounded">
                                  <span className="font-medium text-red-600">Rejection reason:</span> "{application.reviewNote}"
                                </p>
                              )}
                            </div>
                            <Badge variant={application.status === "APPROVED" ? "default" : "destructive"}>
                              {application.status === "APPROVED" ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </>
                              )}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  <MinimalPager
                    current={reviewedPage}
                    total={reviewedPages}
                    onPrev={() => setReviewedPage(Math.max(1, reviewedPage - 1))}
                    onNext={() => setReviewedPage(Math.min(reviewedPages, reviewedPage + 1))}
                  />
                </>
              )}
            </TabsContent>

            {/* Application Review Modal */}
            <Modal
              open={showApplicationModal}
              onOpenChange={setShowApplicationModal}
              title="Review Application"
              description={selectedApplication ? `Application from ${getUserDetails(selectedApplication.userId)?.fullName}` : ""}
            >
              {selectedApplication && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Applicant</Label>
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium">{getUserDetails(selectedApplication.userId)?.fullName}</p>
                      <p className="text-sm text-muted-foreground">{getUserDetails(selectedApplication.userId)?.email}</p>
                    </div>
                  </div>

                  {selectedApplication.applicationText && (
                    <div className="space-y-2">
                      <Label>Application Message</Label>
                      <div className="p-3 bg-muted rounded">
                        <p className="text-sm">{selectedApplication.applicationText}</p>
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
                    <Button variant="destructive" onClick={() => handleReject(selectedApplication.id)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button onClick={() => handleApprove(selectedApplication.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </Modal>
          </Tabs>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
