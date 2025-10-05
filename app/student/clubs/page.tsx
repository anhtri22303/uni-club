"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
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

const clubs = [
  {
    id: "1",
    name: "Tech Club",
    category: "Technology",
    members: 50,
    description: "A club for coding enthusiasts and technology innovators.",
    founded: 2010,
    location: "Campus A",
  },
  {
    id: "2",
    name: "Soccer Club",
    category: "Sports",
    members: 30,
    description: "Join us for soccer matches and training sessions.",
    founded: 2015,
    location: "Field B",
  },
  {
    id: "3",
    name: "Art Society",
    category: "Arts",
    members: 40,
    description: "Explore painting, drawing, and other artistic expressions.",
    founded: 2005,
    location: "Studio C",
  },
  {
    id: "4",
    name: "Math Club",
    category: "Academic",
    members: 25,
    description: "Solve challenging math problems and participate in competitions.",
    founded: 2020,
    location: "Online",
  },
  {
    id: "5",
    name: "Debate Club",
    category: "Social",
    members: 35,
    description: "Hone your debating skills and discuss current issues.",
    founded: 2012,
    location: "Hall D",
  },
  {
    id: "6",
    name: "Music Band",
    category: "Arts",
    members: 20,
    description: "Play instruments and perform music together.",
    founded: 2018,
    location: "Auditorium",
  },
  {
    id: "7",
    name: "Robotics Club",
    category: "Technology",
    members: 45,
    description: "Build and program robots for competitions.",
    founded: 2016,
    location: "Lab E",
  },
  {
    id: "8",
    name: "Basketball Team",
    category: "Sports",
    members: 28,
    description: "Practice and compete in basketball games.",
    founded: 2011,
    location: "Gym F",
  },
  {
    id: "9",
    name: "Photography Club",
    category: "Arts",
    members: 32,
    description: "Learn photography techniques and go on photo walks.",
    founded: 2019,
    location: "Studio G",
  },
  {
    id: "10",
    name: "Science Society",
    category: "Academic",
    members: 38,
    description: "Conduct experiments and discuss scientific discoveries.",
    founded: 2008,
    location: "Lab H",
  },
  {
    id: "11",
    name: "Environmental Club",
    category: "Social",
    members: 42,
    description: "Promote sustainability and organize eco-friendly events.",
    founded: 2017,
    location: "Campus I",
  },
  {
    id: "12",
    name: "Dance Group",
    category: "Arts",
    members: 26,
    description: "Learn various dance styles and perform at events.",
    founded: 2014,
    location: "Hall J",
  },
  {
    id: "13",
    name: "AI Enthusiasts",
    category: "Technology",
    members: 55,
    description: "Explore artificial intelligence and machine learning.",
    founded: 2021,
    location: "Online",
  },
  {
    id: "14",
    name: "Tennis Club",
    category: "Sports",
    members: 22,
    description: "Play tennis and participate in tournaments.",
    founded: 2013,
    location: "Court K",
  },
  {
    id: "15",
    name: "Literature Circle",
    category: "Academic",
    members: 31,
    description: "Read and discuss classic and contemporary literature.",
    founded: 2007,
    location: "Library L",
  },
  {
    id: "16",
    name: "Volunteer Society",
    category: "Social",
    members: 48,
    description: "Organize community service projects and volunteer work.",
    founded: 2022,
    location: "Community Center M",
  },
  {
    id: "17",
    name: "Film Club",
    category: "Arts",
    members: 29,
    description: "Watch and analyze films from various genres.",
    founded: 2010,
    location: "Theater N",
  },
  {
    id: "18",
    name: "Coding Bootcamp",
    category: "Technology",
    members: 60,
    description: "Intensive coding sessions for skill development.",
    founded: 2023,
    location: "Lab O",
  },
]

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
    actions: undefined,
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
    {
      key: "founded",
      label: "Founded Year",
      type: "range" as const,
    },
    {
      key: "location",
      label: "Location",
      type: "select" as const,
      options: [
        { value: "Campus A", label: "Campus A" },
        { value: "Field B", label: "Field B" },
        { value: "Studio C", label: "Studio C" },
        { value: "Online", label: "Online" },
        { value: "Hall D", label: "Hall D" },
        { value: "Auditorium", label: "Auditorium" },
        { value: "Lab E", label: "Lab E" },
        { value: "Gym F", label: "Gym F" },
        { value: "Studio G", label: "Studio G" },
        { value: "Lab H", label: "Lab H" },
        { value: "Campus I", label: "Campus I" },
        { value: "Hall J", label: "Hall J" },
        { value: "Court K", label: "Court K" },
        { value: "Library L", label: "Library L" },
        { value: "Community Center M", label: "Community Center M" },
        { value: "Theater N", label: "Theater N" },
        { value: "Lab O", label: "Lab O" },
      ],
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
      key: "category" as const,
      label: "Category",
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "description" as const,
      label: "Description",
      render: (value: string) => (
        <div className="text-sm text-muted-foreground">{value}</div>
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
            title="Club Directory"
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