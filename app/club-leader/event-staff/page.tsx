"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getClubIdFromToken } from "@/service/clubApi"
import { getEventByClubId, type Event } from "@/service/eventApi"
import { getEventStaff, type EventStaff, getEvaluateEventStaff, type StaffEvaluation } from "@/service/eventStaffApi"
import { Calendar, Clock, MapPin, Users, ChevronLeft, Star, Eye, CheckCircle, AlertCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import EvaluateStaffModal from "@/components/evaluate-staff-modal"
import EvaluationDetailModal from "@/components/evaluation-detail-modal"
import { renderTypeBadge } from "@/lib/eventUtils"

export default function EventStaffPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [clubId] = useState(() => getClubIdFromToken())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [staffList, setStaffList] = useState<EventStaff[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  
  // Evaluation states
  const [showEvaluateModal, setShowEvaluateModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<EventStaff | null>(null)
  const [evaluations, setEvaluations] = useState<StaffEvaluation[]>([])
  const [showEvaluationDetail, setShowEvaluationDetail] = useState(false)
  const [selectedEvaluation, setSelectedEvaluation] = useState<StaffEvaluation | null>(null)

  // Load events when component mounts
  useEffect(() => {
    if (clubId) {
      loadEvents()
    }
  }, [clubId])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await getEventByClubId(clubId!)
      setEvents(data)
    } catch (error: any) {
      toast({
        title: "Error Loading Events",
        description: error?.message || "Failed to load events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEventClick = async (event: Event) => {
    setSelectedEvent(event)
    setShowStaffModal(true)
    setLoadingStaff(true)
    setStaffList([])
    setEvaluations([])

    try {
      // Load staff list
      const staff = await getEventStaff(event.id)
      setStaffList(staff)
      
      // Load evaluations
      const evals = await getEvaluateEventStaff(event.id)
      setEvaluations(evals)
    } catch (error: any) {
      toast({
        title: "Error Loading Staff",
        description: error?.message || "Failed to load event staff",
        variant: "destructive",
      })
    } finally {
      setLoadingStaff(false)
    }
  }

  const handleEvaluateClick = (staff: EventStaff) => {
    setSelectedStaff(staff)
    setShowEvaluateModal(true)
  }

  const handleEvaluationSuccess = async () => {
    // Reload evaluations after successful evaluation
    if (selectedEvent) {
      try {
        const evals = await getEvaluateEventStaff(selectedEvent.id)
        setEvaluations(evals)
      } catch (error) {
        console.error("Failed to reload evaluations:", error)
      }
    }
  }

  const handleViewEvaluation = (staff: EventStaff) => {
    // Find evaluation for this staff
    const evaluation = evaluations.find(
      (e) => e.membershipId === staff.membershipId && e.eventId === staff.eventId
    )
    if (evaluation) {
      setSelectedEvaluation(evaluation)
      setShowEvaluationDetail(true)
    }
  }

  // Check if staff has been evaluated
  const hasEvaluation = (staff: EventStaff) => {
    return evaluations.some(
      (e) => e.membershipId === staff.membershipId && e.eventId === staff.eventId
    )
  }

  // Filter events based on status and time
  const now = new Date()
  
  const activeEvents = events.filter((event) => {
    const eventDate = new Date(event.date)
    const isNotExpired = eventDate >= now
    const isApprovedOrOngoing = ["APPROVED", "ONGOING"].includes(event.status)
    return isNotExpired && isApprovedOrOngoing
  })

  const completedEvents = events.filter((event) => {
    const eventDate = new Date(event.date)
    const isExpired = eventDate < now
    const isCompleted = event.status === "COMPLETED"
    return isExpired || isCompleted
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "N/A"
    if (typeof timeStr === "string") {
      const parts = timeStr.split(":")
      return `${parts[0]}:${parts[1]}`
    }
    return "N/A"
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return (
          <Badge variant="secondary" className="bg-blue-900 text-white border-blue-900">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "ONGOING":
        return (
          <Badge variant="default" className="bg-purple-600 text-white border-purple-600">
            <Clock className="h-3 w-3 mr-1" />
            Ongoing
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "PENDING_COCLUB":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending Co-Club
          </Badge>
        )
      case "PENDING_UNISTAFF":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending Uni-Staff
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => renderTypeBadge(type)

  const EventCard = ({ event }: { event: Event }) => (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 shadow-sm"
      onClick={() => handleEventClick(event)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            {event.name}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2 min-w-0">
            {getStatusBadge(event.status)}
            {getTypeBadge(event.type)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(event.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Clock className="h-4 w-4" />
          <span>{formatTime(event.startTime as string)} - {formatTime(event.endTime as string)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="h-4 w-4" />
          <span>{event.locationName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Users className="h-4 w-4" />
          <span>{event.hostClub.name}</span>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="space-y-8">
            <Skeleton className="h-10 w-1/3 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 border border-slate-700/50">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
            </div>
            <div className="relative space-y-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-slate-300 hover:text-white hover:bg-white/10 mb-4"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-4xl font-bold tracking-tight text-white">Event Staff Management</h1>
              <p className="text-slate-300">
                View and manage staff assignments for your club's events
              </p>
            </div>
          </div>

          {/* Tabs for Active and Completed Events */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="active">
                Active Events ({activeEvents.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed Events ({completedEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activeEvents.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-16 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No active events found
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              {completedEvents.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-16 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No completed events found
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Staff List Modal */}
        <Dialog open={showStaffModal} onOpenChange={setShowStaffModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {selectedEvent?.name} - Staff List
              </DialogTitle>
              <DialogDescription>
                Staff members assigned to this event
              </DialogDescription>
            </DialogHeader>

            {loadingStaff ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : staffList.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 dark:text-slate-400">
                  No staff assigned to this event yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {staffList.map((staff) => {
                  const evaluated = hasEvaluation(staff)
                  return (
                    <Card key={staff.id} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {staff.memberName}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              <span className="font-medium">Duty:</span> {staff.duty}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-500">
                              <span className="font-medium">Assigned:</span>{" "}
                              {new Date(staff.assignedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                staff.state === "ACTIVE"
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-500 text-white"
                              }
                            >
                              {staff.state}
                            </Badge>
                            {selectedEvent?.status === "COMPLETED" && (
                              evaluated ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewEvaluation(staff)}
                                  className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEvaluateClick(staff)}
                                  className="flex items-center gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
                                >
                                  <Star className="h-4 w-4" />
                                  Evaluate
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Evaluate Staff Modal */}
        {selectedStaff && (
          <EvaluateStaffModal
            isOpen={showEvaluateModal}
            onClose={() => {
              setShowEvaluateModal(false)
              setSelectedStaff(null)
            }}
            staff={selectedStaff}
            onSuccess={handleEvaluationSuccess}
          />
        )}

        {/* Evaluation Detail Modal */}
        <EvaluationDetailModal
          open={showEvaluationDetail}
          onClose={() => {
            setShowEvaluationDetail(false)
            setSelectedEvaluation(null)
          }}
          evaluation={selectedEvaluation}
        />
      </AppShell>
    </ProtectedRoute>
  )
}
