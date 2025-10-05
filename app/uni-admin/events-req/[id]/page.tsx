"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Users,
  MapPin,
  Mail,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { eventRequests } from "../page"

interface EventRequestDetailPageProps {
  params: {
    id: string
  }
}

export default function EventRequestDetailPage({ params }: EventRequestDetailPageProps) {
  const request = eventRequests.find((req) => req.id === params.id)

  if (!request) {
    return (
      <ProtectedRoute allowedRoles={["uni_admin"]}>
        <AppShell>
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Event Request Not Found</h1>
            <p className="text-muted-foreground mb-4">The requested event request could not be found.</p>
            <Link href="/uni-admin/events-req">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event Requests
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  return (
    <ProtectedRoute allowedRoles={["uni_admin"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link href="/uni-admin/events-req">
                <Button variant="ghost" size="sm" className="mb-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Event Requests
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">{request.eventName}</h1>
              <p className="text-muted-foreground">Event Organization Request Details</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(request.status)}
              {request.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button variant="default" size="sm" className="h-8 w-8 p-0">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" className="h-8 w-8 p-0">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event Name</label>
                    <p className="text-lg font-semibold">{request.eventName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                      <div className="mt-1">
                        <Badge variant="outline">{request.eventType}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Category</label>
                      <div className="mt-1">
                        <Badge variant="outline">{request.category}</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-1">{request.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Event Date</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(request.eventDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Event Time</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{request.eventTime}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Venue</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{request.venue}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Expected Attendees</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{request.expectedAttendees} people</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Budget</label>
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{formatCurrency(request.budget)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Purpose & Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed">{request.purpose}</p>
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
                    <label className="text-sm font-medium text-muted-foreground">Organizing Club</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{request.requestedBy}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                    <p className="font-semibold mt-1">{request.requestedByContact}</p>
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
                    <Button className="w-full" variant="default">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Request
                    </Button>
                    <Button className="w-full" variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Request
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Organizer
                    </Button>
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
