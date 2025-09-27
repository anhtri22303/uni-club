"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
import { DataTable } from "@/components/data-table"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { useToast } from "@/hooks/use-toast"
import { Users, UserPlus } from "lucide-react"

// Import data
import clubs from "@/src/data/clubs.json"

export default function StudentClubsPage() {
  const { auth } = useAuth()
  const { clubMemberships, membershipApplications, addMembershipApplication } = useData()
  const { toast } = useToast()
  const [selectedClub, setSelectedClub] = useState<any>(null)
  const [applicationText, setApplicationText] = useState("")
  const [showApplicationModal, setShowApplicationModal] = useState(false)

  // Get user's current memberships and applications
  const userMemberships = clubMemberships.filter((m) => m.userId === auth.userId)
  const userApplications = membershipApplications.filter((a) => a.userId === auth.userId)

  const getClubStatus = (clubId: string) => {
    const membership = userMemberships.find((m) => m.clubId === clubId)
    if (membership?.status === "APPROVED") return "member"

    const application = userApplications.find((a) => a.clubId === clubId)
    if (application?.status === "PENDING") return "pending"

    return "none"
  }

  const enhancedClubs = clubs.map((club) => ({
    ...club,
    status: getClubStatus(club.id),
  }))

  const filters = [
    {
      key: "category",
      label: "Category",
      type: "select" as const,
      options: [
        { value: "Technology", label: "Technology" },
        { value: "Sports", label: "Sports" },
        { value: "Arts", label: "Arts" },
        { value: "Academic", label: "Academic" },
        { value: "Social", label: "Social" },
      ],
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
  ]

  const handleApply = (club: any) => {
    setSelectedClub(club)
    setShowApplicationModal(true)
  }

  const submitApplication = () => {
    if (!selectedClub || !applicationText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for joining",
        variant: "destructive",
      })
      return
    }

    addMembershipApplication({
      clubId: selectedClub.id,
      userId: auth.userId,
      status: "PENDING",
      applicationText: applicationText.trim(),
      appliedAt: new Date().toISOString(),
    })

    toast({
      title: "Application Submitted",
      description: `Your application to ${selectedClub.name} has been submitted successfully`,
    })

    setShowApplicationModal(false)
    setApplicationText("")
    setSelectedClub(null)
  }

  const columns = [
    {
      key: "name" as const,
      label: "Club Name",
      render: (value: string, club: any) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{club.category}</div>
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
          <Badge variant={status === "member" ? "default" : status === "pending" ? "secondary" : "outline"}>
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
        return (
          <Button
            size="sm"
            variant={status === "none" ? "default" : "outline"}
            disabled={status !== "none"}
            onClick={() => handleApply(club)}
          >
            {status === "member" ? (
              "Joined"
            ) : status === "pending" ? (
              "Applied"
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1" />
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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Club Directory</h1>
            <p className="text-muted-foreground">Discover and join student clubs</p>
          </div>

          {/* Thêm cấu hình phân trang giống trang Offers:
              - initialPageSize = 6 để luôn có 2+ trang khi >6 rows
              - pageSizeOptions để người dùng đổi số dòng/trang
              Lưu ý: DataTable của bạn đã có phân trang nội bộ, nên chỉ cần truyền props này. */}
          <DataTable
            data={enhancedClubs}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search clubs..."
            filters={filters}
            initialPageSize={6}
            pageSizeOptions={[6, 12, 24, 48]}
          />

          <Modal
            open={showApplicationModal}
            onOpenChange={setShowApplicationModal}
            title={`Apply to ${selectedClub?.name}`}
            description="Tell us why you want to join this club"
          >
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
                <Button variant="outline" onClick={() => setShowApplicationModal(false)}>
                  Cancel
                </Button>
                <Button onClick={submitApplication}>Submit Application</Button>
              </div>
            </div>
          </Modal>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
