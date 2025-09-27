"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, MapPin, Search, CheckCircle, XCircle, Clock, Building, Eye } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export const eventRequests = [
  {
    id: "evt-req-001",
    eventName: "Tech Innovation Summit 2024",
    eventType: "Conference",
    description: "A summit showcasing the latest innovations in technology and startups",
    requestedBy: "AI & Machine Learning Society",
    requestedByContact: "Nguyen Van A",
    requestedByEmail: "nguyenvana@university.edu",
    requestDate: "2024-01-20",
    eventDate: "2024-03-15",
    eventTime: "09:00 - 17:00",
    venue: "Main Auditorium",
    expectedAttendees: 200,
    budget: 5000000,
    status: "PENDING",
    category: "Technology",
    purpose: "To showcase student innovations and connect with industry professionals",
  },
  {
    id: "evt-req-002",
    eventName: "Environmental Awareness Week",
    eventType: "Workshop Series",
    description: "A week-long series of workshops on environmental conservation",
    requestedBy: "Sustainable Living Club",
    requestedByContact: "Tran Thi B",
    requestedByEmail: "tranthib@university.edu",
    requestDate: "2024-01-18",
    eventDate: "2024-04-22",
    eventTime: "08:00 - 18:00",
    venue: "Student Center",
    expectedAttendees: 150,
    budget: 3000000,
    status: "APPROVED",
    category: "Social",
    purpose: "To raise awareness about environmental issues and promote sustainable practices",
  },
  {
    id: "evt-req-003",
    eventName: "Photography Exhibition",
    eventType: "Exhibition",
    description: "Student photography exhibition showcasing campus life",
    requestedBy: "Digital Photography Club",
    requestedByContact: "Le Van C",
    requestedByEmail: "levanc@university.edu",
    requestDate: "2024-01-15",
    eventDate: "2024-02-28",
    eventTime: "10:00 - 20:00",
    venue: "Art Gallery",
    expectedAttendees: 100,
    budget: 1500000,
    status: "REJECTED",
    category: "Arts",
    purpose: "To showcase student photography talents and promote visual arts",
  },
  {
    id: "evt-req-004",
    eventName: "Blockchain Workshop",
    eventType: "Workshop",
    description: "Hands-on workshop on blockchain development",
    requestedBy: "Blockchain & Cryptocurrency Club",
    requestedByContact: "Pham Thi D",
    requestedByEmail: "phamthid@university.edu",
    requestDate: "2024-01-12",
    eventDate: "2024-03-10",
    eventTime: "13:00 - 17:00",
    venue: "Computer Lab 1",
    expectedAttendees: 50,
    budget: 2000000,
    status: "PENDING",
    category: "Technology",
    purpose: "To provide practical experience in blockchain development",
  },
  {
    id: "evt-req-005",
    eventName: "Mental Health Awareness Day",
    eventType: "Seminar",
    description: "Seminar on mental health awareness and support resources",
    requestedBy: "Mental Health Awareness Club",
    requestedByContact: "Hoang Van E",
    requestedByEmail: "hoangvane@university.edu",
    requestDate: "2024-01-10",
    eventDate: "2024-05-10",
    eventTime: "14:00 - 16:00",
    venue: "Conference Room A",
    expectedAttendees: 80,
    budget: 1000000,
    status: "APPROVED",
    category: "Social",
    purpose: "To promote mental health awareness and provide support resources",
  },
]

export default function EventRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredRequests = eventRequests.filter((req) => {
    const matchSearch =
      req.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestedByContact.toLowerCase().includes(searchTerm.toLowerCase())

    const matchStatus = statusFilter === "all" ? true : req.status === statusFilter
    const matchCategory = categoryFilter === "all" ? true : req.category === categoryFilter
    const matchType = typeFilter === "all" ? true : req.eventType === typeFilter

    return matchSearch && matchStatus && matchCategory && matchType
  })

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

  const pendingCount = eventRequests.filter((req) => req.status === "PENDING").length
  const approvedCount = eventRequests.filter((req) => req.status === "APPROVED").length
  const rejectedCount = eventRequests.filter((req) => req.status === "REJECTED").length

  return (
    <ProtectedRoute allowedRoles={["uni_admin"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Event Requests</h1>
            <p className="text-muted-foreground">Review and manage event organization requests</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  Pending Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-yellow-500 rounded-md">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">{pendingCount}</div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Awaiting review</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-green-700 dark:text-green-300">Approved</CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-500 rounded-md">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-900 dark:text-green-100">{approvedCount}</div>
                    <p className="text-xs text-green-600 dark:text-green-400">Successfully approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
              <CardHeader className="pb-1 px-4 pt-3">
                <CardTitle className="text-xs font-medium text-red-700 dark:text-red-300">Rejected</CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-500 rounded-md">
                    <XCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-900 dark:text-red-100">{rejectedCount}</div>
                    <p className="text-xs text-red-600 dark:text-red-400">Not approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 max-w-sm w-full">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by event name or organizer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Workshop Series">Workshop Series</SelectItem>
                  <SelectItem value="Exhibition">Exhibition</SelectItem>
                  <SelectItem value="Seminar">Seminar</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">No event requests found</CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <Link href={`/uni-admin/events-req/${request.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">{request.eventName}</h3>
                            <Badge variant="outline">{request.eventType}</Badge>
                            <Badge variant="outline">{request.category}</Badge>
                            {getStatusBadge(request.status)}
                          </div>

                          <p className="text-muted-foreground mb-3 line-clamp-2">{request.description}</p>

                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(request.eventDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{request.venue}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{request.expectedAttendees} attendees</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              <span>{request.requestedBy}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {request.status === "PENDING" && (
                            <>
                              <Button size="sm" variant="default" className="h-8 w-8 p-0">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" className="h-8 bg-transparent">
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
