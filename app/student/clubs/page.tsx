"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { Users, PlusIcon } from "lucide-react"
import { fetchClub, getClubMemberCount } from "@/service/clubApi"
import { postMemAppli } from "@/service/memberApplicationApi"
import { safeLocalStorage } from "@/lib/browser-utils"
import { fetchMajors, Major } from "@/service/majorApi"
// We'll fetch clubs from the backend and only use the `content` array.
type ClubApiItem = {
  id: number
  name: string
  description?: string
  majorPolicyName?: string
  majorName?: string
  major?: { name?: string; majorName?: string }
}

export default function MemberClubsPage() {
  const router = useRouter()
  const { auth } = useAuth()
  const { clubMemberships, membershipApplications, addMembershipApplication, removeMembershipApplication, replaceMembershipApplication } = useData()
  const { toast } = useToast()
  const [selectedClub, setSelectedClub] = useState<any>(null)
  const [applicationText, setApplicationText] = useState("")
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  // Create club modal state
  const [showCreateClubModal, setShowCreateClubModal] = useState(false)
  const [newClubName, setNewClubName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newProposerReason, setNewProposerReason] = useState("")
  const [clubs, setClubs] = useState<ClubApiItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingClubIds, setPendingClubIds] = useState<string[]>([])
  const [userClubIds, setUserClubIds] = useState<number[]>([])
  const [userClubId, setUserClubId] = useState<number | null>(null) // Keep for backward compatibility
  const [majors, setMajors] = useState<Major[]>([])
  const [selectedMajorId, setSelectedMajorId] = useState<number | "">("")

  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({}) // Thêm state mới này

  // Get user's current memberships and applications
  const userMemberships = clubMemberships.filter((m) => m.userId === auth.userId)
  const userApplications = membershipApplications.filter((a) => a.userId === auth.userId)

  // Get user's club IDs from localStorage
  useEffect(() => {
    try {
      const saved = safeLocalStorage.getItem("uniclub-auth")
      console.log("Raw localStorage data:", saved)
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log("Parsed localStorage data:", parsed)

        // Check for clubIds array first, then fallback to single clubId
        if (parsed.clubIds && Array.isArray(parsed.clubIds)) {
          const clubIdNumbers = parsed.clubIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
          console.log("Setting userClubIds from clubIds array to:", clubIdNumbers)
          setUserClubIds(clubIdNumbers)
          // Set the first club as primary for backward compatibility
          if (clubIdNumbers.length > 0) {
            setUserClubId(clubIdNumbers[0])
          }
        } else if (parsed.clubId) {
          const clubIdNumber = Number(parsed.clubId)
          console.log("Setting userClubId from single clubId to:", clubIdNumber)
          setUserClubId(clubIdNumber)
          setUserClubIds([clubIdNumber])
        }
      }
    } catch (error) {
      console.error("Failed to get clubId from localStorage:", error)
    }
  }, [])


  useEffect(() => {
    const loadMajors = async () => {
      try {
        const data = await fetchMajors()
        setMajors(data)
      } catch (error) {
        console.error("Failed to load majors:", error)
      }
    }
    loadMajors()
  }, [])


  const categoryColors: Record<string, string> = {
    "Software Engineering": "#0052CC",
    "Artificial Intelligence": "#6A00FF",
    "Information Assurance": "#243447",
    "Data Science": "#00B8A9",
    "Business Administration": "#1E2A78",
    "Digital Marketing": "#FF3366",
    "Graphic Design": "#FFC300",
    "Multimedia Communication": "#FF6B00",
    "Hospitality Management": "#E1B382",
    "International Business": "#007F73",
    "Finance and Banking": "#006B3C",
    "Japanese Language": "#D80032",
    "Korean Language": "#5DADEC",
  }
  const getClubStatus = (clubId: string) => {
    // If we have a local pending marker for this club, show pending immediately
    if (pendingClubIds.includes(clubId)) return "pending"
    const membership = userMemberships.find((m) => m.clubId === clubId)
    if (membership?.status === "APPROVED") return "member"

    const application = userApplications.find((a) => a.clubId === clubId)
    if (application?.status === "PENDING") return "pending"

    return "none"
  }

  // Map API items to table rows and filter out user's current clubs
  console.log("Total clubs before filter:", clubs.length, "userClubIds:", userClubIds)
  const enhancedClubs = clubs
    .filter((club) => {
      // Hide clubs that user is already a member of
      const clubIdNumber = Number(club.id)
      if (userClubIds.length > 0 && userClubIds.includes(clubIdNumber)) {
        console.log(`Hiding club ${club.name} (ID: ${club.id}) - user is member of this club`)
        return false
      }
      return true
    })
    .map((club) => ({
      id: String(club.id),
      name: club.name,
      category: club.majorName ?? (club as any).major?.name ?? (club as any).major?.majorName ?? "",
      description: club.description,
      // members: 0,
      members: memberCounts[String(club.id)] ?? 0, // ✅ THAY ĐỔI DÒNG NÀY
      founded: 0,
      location: "",
      policy: club.majorPolicyName ?? "",
      status: getClubStatus(String(club.id)),
      actions: undefined,
    }))
  console.log("Enhanced clubs after filter:", enhancedClubs.length)

  const getMajorVariant = (major?: string) => {
    if (!major) return "outline"
    const m = major.toLowerCase()
    if (m.includes("design") || m.includes("arts")) return "secondary"
    if (m.includes("business") || m.includes("management")) return "destructive"
    if (m.includes("technology") || m.includes("computer") || m.includes("ai") || m.includes("artificial")) return "default"
    if (m.includes("environment") || m.includes("sustain")) return "secondary"
    // fallback
    return "outline"
  }

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

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res: any = await fetchClub({ page: 0, size: 10, sort: ["name"] })
        const fetchedClubs = res?.content ?? []

        if (mounted) {
          setClubs(fetchedClubs)

          // ✅ BẮT ĐẦU THAY ĐỔI: Fetch member counts sau khi có danh sách clubs
          if (fetchedClubs.length > 0) {
            // Tạo một mảng các promise gọi API lấy member count
            const countPromises = fetchedClubs.map((club: ClubApiItem) =>
              getClubMemberCount(club.id)
            )

            // Chờ tất cả các promise hoàn thành
            const counts = await Promise.all(countPromises)

            // Tạo một object để map clubId với member count tương ứng
            const countsMap: Record<string, number> = {}
            fetchedClubs.forEach((club: ClubApiItem, index: number) => {
              countsMap[String(club.id)] = counts[index]
            })

            // Cập nhật state memberCounts
            if (mounted) {
              setMemberCounts(countsMap)
            }
          }
        }
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
  }, [])


  const submitApplication = () => {
    if (!selectedClub || !applicationText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for joining",
        variant: "destructive",
      })
      return
    }

    // Call backend API to create membership application
    ; (async () => {
      if (!auth.userId) {
        toast({ title: "Not authenticated", description: "You must be signed in to apply", variant: "destructive" })
        return
      }

      const tempId = `temp-${Date.now()}`
      const tempApp = {
        id: tempId,
        clubId: selectedClub.id,
        userId: auth.userId,
        status: "PENDING",
        applicationText: applicationText.trim(),
        appliedAt: new Date().toISOString(),
      }

      // Optimistic update: add temp application to local context and mark club pending
      addMembershipApplication(tempApp)
      setPendingClubIds((p) => Array.from(new Set([...p, String(selectedClub.id)])))

      try {
        const serverRes: any = await postMemAppli({
          clubId: selectedClub.id,
          message: applicationText.trim(),
        })

        // Normalize server response to our local shape and replace temp entry
        if (serverRes) {
          const normalized = {
            id: String(serverRes.id ?? serverRes.applicationId ?? Date.now()),
            clubId: String(serverRes.clubId ?? selectedClub.id),
            userId: String(serverRes.userId ?? auth.userId),
            status: serverRes.status ?? "PENDING",
            applicationText: serverRes.reason ?? serverRes.applicationText ?? tempApp.applicationText,
            appliedAt: serverRes.submittedAt ?? serverRes.appliedAt ?? tempApp.appliedAt,
            // include any other fields the server returned for completeness
            ...serverRes,
          }

          replaceMembershipApplication(tempId, normalized)
          // Keep pending marker if server says PENDING, otherwise remove it
          if ((normalized.status ?? "").toUpperCase() !== "PENDING") {
            setPendingClubIds((p) => p.filter((id) => id !== String(selectedClub.id)))
          }
        } else {
          // If no response body, remove temp and inform user
          removeMembershipApplication(tempId)
          toast({ title: "Error", description: "Server did not return created application", variant: "destructive" })
          return
        }

        toast({
          title: "Application Submitted",
          // description: `Your application to ${selectedClub.name} has been submitted successfully`,
          description: `Successfully applied to ${serverRes.clubName || selectedClub.name}. Status: ${serverRes.status}`,
        })

        setShowApplicationModal(false)
        setApplicationText("")
        setSelectedClub(null)

        // Refresh the page data (client-side Next.js refresh)
        try {
          router.refresh()
        } catch (e) {
          // fallback to full reload
          window.location.reload()
        }
      } catch (err: any) {
        // Rollback optimistic update
        removeMembershipApplication(tempId)
        // remove pending marker
        setPendingClubIds((p) => p.filter((id) => id !== String(selectedClub.id)))

        // Extract validation errors if present
        const apiMessage = err?.response?.data?.message || err?.message || "Failed to submit application"
        const validationErrors = err?.response?.data?.errors

        if (validationErrors) {
          // Show first validation error or aggregate
          const firstKey = Object.keys(validationErrors)[0]
          const firstMsg = validationErrors[firstKey]
          toast({ title: "Validation error", description: firstMsg || apiMessage, variant: "destructive" })
        } else {
          toast({ title: "Error", description: apiMessage, variant: "destructive" })
        }
      }
    })()
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
      // render: (value: string) => {
      //   const variant = getMajorVariant(value)
      //   return (
      //     <Badge title={value || ""} variant={variant as any} className="max-w-[140px] truncate">
      //       {value || "-"}
      //     </Badge>
      //   )
      // },
      render: (value: string) => {
        const color = categoryColors[value] || "#E2E8F0" // fallback nếu không có
        return (
          <Badge
            variant="secondary"
            className="max-w-[160px] truncate"
            style={{
              backgroundColor: color,
              color: "#fff", // chữ trắng cho rõ
            }}
          >
            {value || "-"}
          </Badge>
        )
      },
    },
    {
      key: "description" as const,
      label: "Description",
      render: (value: string) => (
        <div
          className="text-sm text-muted-foreground max-w-[180px] truncate"
          title={value}
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
      key: "policy" as const,
      label: "Major Policy",
      render: (value: string) => {
        return (
          <div className="max-w-[220px]">
            <Badge title={value || ""} variant={"outline"} className="truncate max-w-full">
              {value || "-"}
            </Badge>
          </div>
        )
      },
    },
    {
      key: "actions" as const,
      label: "Actions",
      render: (_: any, club: any) => {
        const status = getClubStatus(club.id)
        // Allow members to apply to clubs (except their current club which is already filtered out)
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
                <PlusIcon className="h-4 w-4 mr-1" />
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
        {/* Floating '+' button for create club */}
        <Button
          aria-label="Create club application"
          size="sm"
          variant="default"
          className="fixed top-4 right-4 z-50 rounded-full flex items-center justify-center"
          onClick={() => setShowCreateClubModal(true)}
        >
          <PlusIcon className="h-5 w-5" />
          <span className="font-medium">Create new club</span>
        </Button>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Club Directory</h1>
            <p className="text-muted-foreground">
              Discover and join clubs that match your interests.
              {userClubIds.length > 0 && (
                <span className="text-xs text-muted-foreground/70 ml-2">
                  (Your club{userClubIds.length > 1 ? 's' : ''} {userClubIds.join(', ')} {userClubIds.length > 1 ? 'are' : 'is'} hidden)
                </span>
              )}
            </p>
          </div>

          <DataTable
            title="Club Directory"
            data={enhancedClubs}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search clubs..."
            filters={filters}
            initialPageSize={8}
            pageSizeOptions={[8, 20, 50]}
          />
          {loading && (
            <div className="text-center text-sm text-muted-foreground">Loading clubs...</div>
          )}

          {error && (
            <div className="text-center text-sm text-destructive">Error: {error}</div>
          )}

          {/* Modal for applying to a club (join) */}
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

          {/* Modal form application for creating a new club */}
          <Modal
            open={showCreateClubModal}
            onOpenChange={setShowCreateClubModal}
            title="Create Club Application"
          >
            <div className="space-y-4">
              {/* Club Name */}
              <div className="space-y-2">
                <Label htmlFor="clubName">Club Name</Label>
                <Textarea
                  id="clubName"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  placeholder="Enter club name"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>

              {/* Category (Major Selection) */}
              <div className="space-y-2">
                <Label htmlFor="category">Category (Major)</Label>
                <select
                  id="category"
                  aria-label="Category (Major)"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedMajorId}
                  onChange={(e) => setSelectedMajorId(Number(e.target.value))}
                >
                  <option value="">Select a major</option>
                  {majors
                    .filter((m) => m.active)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Proposer Reason */}
              <div className="space-y-2">
                <Label htmlFor="proposerReason">Proposer Reason</Label>
                <Textarea
                  id="proposerReason"
                  value={newProposerReason}
                  onChange={(e) => setNewProposerReason(e.target.value)}
                  placeholder="Why do you want to create this club?"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreateClubModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (
                      !newClubName.trim() ||
                      !newDescription.trim() ||
                      !selectedMajorId ||
                      !newProposerReason.trim()
                    ) {
                      toast({
                        title: "Missing Information",
                        description: "Please fill in all fields.",
                        variant: "destructive",
                      })
                      return
                    }

                    try {
                      const { postClubApplication } = await import("@/service/clubApplicationAPI")
                      const payload = {
                        clubName: newClubName.trim(),
                        description: newDescription.trim(),
                        category: selectedMajorId, // ✅ ID của major
                        proposerReason: newProposerReason.trim(),
                      }

                      console.log("Submitting club application:", payload)
                      const created = await postClubApplication(payload)
                      console.log("API response:", created)

                      toast({
                        title: "Application Sent",
                        description: `Your application for ${created.clubName} submitted successfully.`,
                        variant: "success",
                      })

                      // Reset form
                      setShowCreateClubModal(false)
                      setNewClubName("")
                      setNewDescription("")
                      setSelectedMajorId("")
                      setNewProposerReason("")
                    } catch (err: any) {
                      console.error("Error submitting application:", err)
                      toast({
                        title: "Error",
                        description:
                          err?.response?.data?.message ||
                          "Failed to send application",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  Send
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
