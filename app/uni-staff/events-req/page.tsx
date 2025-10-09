"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, MapPin, Search, CheckCircle, XCircle, Clock, Building, Eye } from "lucide-react"
import { renderTypeBadge } from "@/lib/eventUtils"
import { useState, useEffect } from "react"
import { fetchLocation } from "@/service/locationApi"
import { fetchClub } from "@/service/clubApi"
import Link from "next/link"
import { fetchEvent } from "@/service/eventApi"

// events will be fetched from the API. The API returns a paginated object
// and the UI should display only the `content` array.

export default function UniStaffEventRequestsPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState<string>("all")
	const [categoryFilter, setCategoryFilter] = useState<string>("all")
	const [typeFilter, setTypeFilter] = useState<string>("all")

	const [events, setEvents] = useState<any[]>([])
	const [locations, setLocations] = useState<any[]>([])
	const [clubs, setClubs] = useState<any[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	const getLocationById = (id: string | number | undefined) => {
		if (id === undefined || id === null) return null
		return locations.find((l) => String(l.id) === String(id)) ?? null
	}

	const getLocationCapacity = (id: string | number | undefined) => {
		const loc: any = getLocationById(id)
		if (!loc) return null
		// common field names: capacity, maxCapacity, seatingCapacity
		return loc.capacity ?? loc.maxCapacity ?? loc.seatingCapacity ?? null
	}

	useEffect(() => {
		let mounted = true
		const load = async () => {
			setLoading(true)
			try {
				// fetch events, locations and clubs in parallel
				const [eventsRes, locationsRes, clubsRes] = await Promise.all([fetchEvent(), fetchLocation(), fetchClub()])
				const eventsContent = (eventsRes as any) && Array.isArray((eventsRes as any).content) ? (eventsRes as any).content : Array.isArray(eventsRes) ? eventsRes : []
				const locationsContent = (locationsRes as any) && Array.isArray((locationsRes as any).content) ? (locationsRes as any).content : Array.isArray(locationsRes) ? locationsRes : []
				const clubsContent = (clubsRes as any) && Array.isArray((clubsRes as any).content) ? (clubsRes as any).content : Array.isArray(clubsRes) ? clubsRes : []
				if (mounted) {
					setEvents(eventsContent)
					setLocations(locationsContent)
					setClubs(clubsContent)
				}
			} catch (err: any) {
				console.error(err)
				if (mounted) setError(err?.message || "Failed to fetch events or locations")
			} finally {
				if (mounted) setLoading(false)
			}
		}

		load()
		return () => {
			mounted = false
		}
	}, [])

	// Filter events based on API shape: { id, clubId, name, description, type, date, time, locationId }
	const filteredRequests = events.filter((evt) => {
		const q = searchTerm.trim().toLowerCase()
		const matchSearch =
			q === "" ||
			evt.name?.toLowerCase().includes(q) ||
			// club names are not included in this payload; fallback to clubId
			String(evt.clubId || "").includes(q)

		// status/category filters were for the old static data; map them to type for now
		const matchStatus = statusFilter === "all" ? true : (evt.status || evt.type) === statusFilter
		const matchCategory = categoryFilter === "all" ? true : (evt.category || "") === categoryFilter
		const matchType = typeFilter === "all" ? true : (evt.type || "") === typeFilter

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

	// Since API uses `type` (PUBLIC/PRIVATE) and doesn't provide status/category in example,
	// we'll compute simple counts: total, public, private
	const totalCount = events.length
	const publicCount = events.filter((e) => e.type === "PUBLIC").length
	const privateCount = events.filter((e) => e.type === "PRIVATE").length

	return (
		<ProtectedRoute allowedRoles={["uni_staff"]}>
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
										<div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
											{totalCount}
										</div>
										<p className="text-xs text-yellow-600 dark:text-yellow-400">Total events</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
							<CardHeader className="pb-1 px-4 pt-3">
								<CardTitle className="text-xs font-medium text-green-700 dark:text-green-300">
									Approved
								</CardTitle>
							</CardHeader>
							<CardContent className="pb-3 px-4">
								<div className="flex items-center gap-2">
									<div className="p-1.5 bg-green-500 rounded-md">
										<CheckCircle className="h-4 w-4 text-white" />
									</div>
									<div>
										<div className="text-lg font-bold text-green-900 dark:text-green-100">
											{publicCount}
										</div>
										<p className="text-xs text-green-600 dark:text-green-400">Public events</p>
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
										<div className="text-lg font-bold text-red-900 dark:text-red-100">
											{privateCount}
										</div>
										<p className="text-xs text-red-600 dark:text-red-400">Private events</p>
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
						{loading ? (
							<Card>
								<CardContent className="py-8 text-center text-muted-foreground">Loading events...</CardContent>
							</Card>
						) : error ? (
							<Card>
								<CardContent className="py-8 text-center text-destructive">{error}</CardContent>
							</Card>
						) : filteredRequests.length === 0 ? (
							<Card>
								<CardContent className="py-8 text-center text-muted-foreground">No events found</CardContent>
							</Card>
						) : (
							filteredRequests.map((request) => (
								<Card key={request.id} className="hover:shadow-md transition-shadow cursor-pointer">
									<Link href={`/uni-staff/events-req/${request.id}`}>
										<CardContent className="p-6">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-2">
														<Calendar className="h-5 w-5 text-muted-foreground" />
														<h3 className="font-semibold text-lg">{request.name || request.eventName}</h3>
														{renderTypeBadge(request.type || request.eventType)}
														{/* category not provided by API example */}
														{getStatusBadge(request.status || request.type)}
													</div>

													<p className="text-muted-foreground mb-3 line-clamp-2">{request.description}</p>

													<div className="flex items-center gap-6 text-sm text-muted-foreground">
														<div className="flex items-center gap-1">
															<Calendar className="h-4 w-4" />
															<span>{request.date ? new Date(request.date).toLocaleDateString() : request.eventDate}</span>
														</div>
														<div className="flex items-center gap-1">
															<MapPin className="h-4 w-4" />
															<span>{
																(() => {
																	const loc = locations.find((l) => String(l.id) === String(request.locationId))
																	if (loc && loc.name) return loc.name
																	if (request.venue) return request.venue
																	return `Location #${request.locationId ?? "N/A"}`
																})()
															}</span>
														</div>
														<div className="flex items-center gap-1">
															<Users className="h-4 w-4" />
															<span>{
																(() => {
																	const cap = getLocationCapacity(request.locationId)
																	if (cap !== null && cap !== undefined) return `${cap} capacity`
																	if (request.expectedAttendees) return `${request.expectedAttendees} attendees`
																	return "-"
																})()
															}</span>
														</div>
														<div className="flex items-center gap-1">
															<Building className="h-4 w-4" />
															<span>{
																(() => {
																	const club = clubs.find((c) => String(c.id) === String(request.clubId))
																	if (club && club.name) return club.name
																	if (request.requestedBy) return request.requestedBy
																	return `Club #${request.clubId || "?"}`
																})()
															}</span>
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
