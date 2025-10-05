"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/modal"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Calendar, Plus, Edit, MapPin, Trophy, ChevronLeft, ChevronRight } from "lucide-react"

// Import data
import initialEvents from "@/src/data/events.json"
import clubs from "@/src/data/clubs.json"

export default function ClubManagerEventsPage() {
  const [events, setEvents] = useLocalStorage("uniclub-events", initialEvents)
  const { toast } = useToast()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    points: 50,
  })

  // For demo purposes, assume managing the first club
  const managedClub = clubs[0] // AI Club
  const clubEvents = events.filter((e) => e.clubId === managedClub.id)

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedEvents,
    setCurrentPage,
  } = usePagination({
    data: clubEvents,
    initialPageSize: 3,
  })

  const goPrev = () => setCurrentPage(Math.max(1, currentPage - 1))
  const goNext = () => setCurrentPage(Math.min(totalPages, currentPage + 1))

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      location: "",
      points: 50,
    })
  }

  const handleCreate = () => {
    if (!formData.title || !formData.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const newEvent = {
      id: `e-${Date.now()}`,
      clubId: managedClub.id,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: "14:00", // Default time, or you can add a time field to the form
      location: formData.location,
      points: formData.points,
      createdAt: new Date().toISOString(),
    }

    setEvents([...events, newEvent])
    setCurrentPage(1) // reset về trang đầu

    toast({
      title: "Event Created",
      description: `${formData.title} has been created successfully`,
    })

    setShowCreateModal(false)
    resetForm()
  }

  const handleEdit = (event: any) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      date: event.date,
      location: event.location || "",
      points: event.points,
    })
    setShowEditModal(true)
  }

  const handleUpdate = () => {
    if (!formData.title || !formData.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const updatedEvents = events.map((e) =>
      e.id === selectedEvent.id
        ? {
            ...e,
            title: formData.title,
            description: formData.description ?? "",
            date: formData.date,
            location: formData.location ?? "",
            points: formData.points,
            time: e.time ?? "14:00",
            updatedAt: new Date().toISOString(),
          }
        : e,
    )

    setEvents(updatedEvents)
    setCurrentPage(1)

    toast({
      title: "Event Updated",
      description: `${formData.title} has been updated successfully`,
    })

    setShowEditModal(false)
    setSelectedEvent(null)
    resetForm()
  }

  const getEventStatus = (eventDate: string) => {
    const now = new Date()
    const event = new Date(eventDate)

    if (event < now) return "past"
    if (event.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) return "upcoming"
    return "future"
  }

  return (
    <ProtectedRoute allowedRoles={["club_manager"]}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Events</h1>
              <p className="text-muted-foreground">Manage {managedClub.name} events</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>

          {clubEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first event to get started</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedEvents.map((event) => {
                  const status = getEventStatus(event.date)

                  return (
                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            {event.description && <CardDescription className="mt-1">{event.description}</CardDescription>}
                          </div>
                          <Badge
                            variant={status === "past" ? "secondary" : status === "upcoming" ? "default" : "outline"}
                          >
                            {status === "past" ? "Past" : status === "upcoming" ? "Soon" : "Future"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4" />
                            {event.points} loyalty points
                          </div>

                          <Button variant="outline" className="w-full bg-transparent" onClick={() => handleEdit(event)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Event
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Minimal Pager */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <Button
                    aria-label="Previous page"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={goPrev}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="min-w-[2rem] text-center text-sm font-medium">{currentPage}</div>

                  <Button
                    aria-label="Next page"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={goNext}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Create Event Modal */}
          <Modal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            title="Create New Event"
            description="Add a new event for your club members"
          >
            {/* form fields giữ nguyên */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your event..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points">Points Reward</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Event location"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Event</Button>
              </div>
            </div>
          </Modal>

          {/* Edit Event Modal giữ nguyên */}
          <Modal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            title="Edit Event"
            description="Update event details"
          >
            {/* form fields giữ nguyên */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Event Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your event..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-points">Points Reward</Label>
                  <Input
                    id="edit-points"
                    type="number"
                    min="0"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Event location"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>Update Event</Button>
              </div>
            </div>
          </Modal>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
