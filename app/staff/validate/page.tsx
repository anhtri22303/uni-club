"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { Calendar, MapPin, Users, QrCode, Maximize2, Minimize2 } from "lucide-react"

const openEvents = [
  {
    id: 1,
    name: "Spring Festival 2024",
    description: "Annual spring celebration with music, food, and activities",
    location: "Main Campus Quad",
    date: "2024-04-15",
    time: "10:00 AM - 6:00 PM",
    status: "Open",
    attendees: 245,
    maxAttendees: 500,
    organizer: "Student Activities Committee",
  },
  {
    id: 2,
    name: "Tech Conference 2024",
    description: "Technology conference featuring industry speakers and workshops",
    location: "Engineering Building",
    date: "2024-04-20",
    time: "9:00 AM - 5:00 PM",
    status: "Open",
    attendees: 180,
    maxAttendees: 300,
    organizer: "Computer Science Club",
  },
  {
    id: 3,
    name: "Music Night",
    description: "Live music performances by student bands and artists",
    location: "Student Center Auditorium",
    date: "2024-04-25",
    time: "7:00 PM - 11:00 PM",
    status: "Open",
    attendees: 95,
    maxAttendees: 200,
    organizer: "Music Club",
  },
  {
    id: 4,
    name: "Career Fair",
    description: "Meet with employers and explore career opportunities",
    location: "Convention Center",
    date: "2024-04-30",
    time: "10:00 AM - 4:00 PM",
    status: "Open",
    attendees: 320,
    maxAttendees: 600,
    organizer: "Career Services",
  },
]

export default function StaffValidatePage() {
  const { auth } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
    setShowQRModal(true)
  }

  const closeModal = () => {
    setShowQRModal(false)
    setSelectedEvent(null)
    setIsFullscreen(false)
  }

  return (
    <ProtectedRoute allowedRoles={["staff"]}>
      <AppShell>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Event Validation</h1>
            <p className="text-muted-foreground">Select an event to generate validation QR code</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {openEvents.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleEventClick(event)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">{event.name}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {event.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {event.date} • {event.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {event.attendees}/{event.maxAttendees} attendees
                    </span>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">Organized by {event.organizer}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={showQRModal} onOpenChange={(v) => (v ? setShowQRModal(true) : closeModal())}>
            <DialogContent
              className={
                isFullscreen
                  ? "!left-0 !top-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !rounded-none !p-0"
                  : "sm:max-w-md"
              }
            >
              <DialogHeader
                className={
                  "flex items-center justify-between" +
                  (isFullscreen ? " px-4 py-3 sm:px-6 sm:py-4" : "")
                }
              >
                <DialogTitle>Event Validation QR Code</DialogTitle>
                {/* Nút toggle phóng to/thu nhỏ (không phải nút X) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsFullscreen((s) => !s)}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </DialogHeader>

              {selectedEvent && (
                <div className={isFullscreen ? "h-full flex flex-col" : ""}>
                  <div className="space-y-4">
                    <div className={"text-center" + (isFullscreen ? " px-4" : "")}>
                      <h3 className="font-semibold text-lg">{selectedEvent.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.date} • {selectedEvent.time}
                      </p>
                    </div>

                    {/* QR Code Placeholder */}
                    <div
                      className={
                        isFullscreen
                          ? "flex-1 flex items-center justify-center"
                          : "flex justify-center"
                      }
                    >
                      <div
                        className={
                          "bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600" +
                          (isFullscreen ? " w-80 h-80" : " w-48 h-48")
                        }
                      >
                        <div className="text-center">
                          <QrCode
                            className={
                              isFullscreen
                                ? "h-20 w-20 mx-auto mb-2 text-gray-400"
                                : "h-12 w-12 mx-auto mb-2 text-gray-400"
                            }
                          />
                          <p className="text-sm text-gray-500">QR Code</p>
                          <p className="text-xs text-gray-400 mt-1">URL will be added later</p>
                        </div>
                      </div>
                    </div>

                    <div className={"flex justify-center" + (isFullscreen ? " pb-4" : "")}>
                      <Button variant="outline" onClick={closeModal}>
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
