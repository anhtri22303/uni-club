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
import { useToast } from "@/hooks/use-toast"
import { putEventStatus } from "@/service/eventApi"
import { fetchLocation } from "@/service/locationApi"
import Link from "next/link"
import { useEvents, useClubs } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/hooks/use-query-hooks"

// events will be fetched from the API. The API returns a paginated object
// and the UI should display only the `content` array.

export default function UniStaffEventRequestsPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState<string>("all")
	const [categoryFilter, setCategoryFilter] = useState<string>("all")
	const [typeFilter, setTypeFilter] = useState<string>("all")

	const [locations, setLocations] = useState<any[]>([])
	const [error, setError] = useState<string | null>(null)

	const { toast } = useToast()
	const queryClient = useQueryClient()
	const [processingId, setProcessingId] = useState<number | string | null>(null)

	// Use React Query hooks
	const { data: apiEvents = [], isLoading: loading } = useEvents()
	const { data: apiClubs = [] } = useClubs()

	// Set local events and clubs state
	const events = apiEvents
	const clubs = Array.isArray(apiClubs) ? apiClubs : []

	// Fetch locations (not migrated yet)
	useEffect(() => {
		let mounted = true
		const loadLocations = async () => {
			try {
				const locationsRes = await fetchLocation()
				const locationsContent = (locationsRes as any) && Array.isArray((locationsRes as any).content) 
					? (locationsRes as any).content 
					: Array.isArray(locationsRes) ? locationsRes : []
				
				if (mounted) {
					setLocations(locationsContent)
				}
			} catch (err: any) {
				console.error("❌ Error loading locations:", err)
				if (mounted) setError(err?.message || "Failed to fetch locations")
			}
		}

		loadLocations()
		return () => {
			mounted = false
		}
	}, [])

	const getLocationById = (id: string | number | undefined) => {
		if (id === undefined || id === null) return null
		return locations.find((l) => String(l.id) === String(id)) ?? null
	}

	const getLocationCapacity = (id: string | number | undefined) => {
		const loc: any = getLocationById(id)
		if (!loc) return null
		return loc.capacity ?? loc.maxCapacity ?? loc.seatingCapacity ?? null
	}

	// Filter events based on API shape: { id, clubId, name, description, type, date, time, locationId, status }
	const filteredRequests = events.filter((evt) => {
		const q = searchTerm.trim().toLowerCase()
		const matchSearch =
			q === "" ||
			evt.name?.toLowerCase().includes(q) ||
			// club names are not included in this payload; fallback to clubId
			String(evt.clubId || "").includes(q)

		// status/category filters: prefer `status` field (new API). fall back to `type` when `status` missing
		const matchStatus = statusFilter === "all" ? true : ((evt.status ?? evt.type) === statusFilter)
		const matchCategory = categoryFilter === "all" ? true : (evt.category || "") === categoryFilter
		const matchType = typeFilter === "all" ? true : (evt.type || "") === typeFilter

		return matchSearch && matchStatus && matchCategory && matchType
	})

		// Minimal pagination state
		const [page, setPage] = useState(0)
		const [pageSize, setPageSize] = useState(3)

		// Clamp page when filteredRequests or pageSize change
		useEffect(() => {
			const last = Math.max(0, Math.ceil(filteredRequests.length / pageSize) - 1)
			if (page > last) setPage(last)
		}, [filteredRequests.length, pageSize])

		const paginated = (() => {
			const start = page * pageSize
			return filteredRequests.slice(start, start + pageSize)
		})()

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

	// Compute counts by status (prefer `status` field). Fallback to type-based heuristics when missing
	const totalCount = events.length
	const pendingCount = events.filter((e) => (e.status ?? "").toUpperCase() === "PENDING").length
	const approvedCount = events.filter((e) => (e.status ?? "").toUpperCase() === "APPROVED").length
	const rejectedCount = events.filter((e) => (e.status ?? "").toUpperCase() === "REJECTED").length

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
																{pendingCount}
															</div>
															<p className="text-xs text-yellow-600 dark:text-yellow-400">Pending events</p>
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
																{approvedCount}
															</div>
															<p className="text-xs text-green-600 dark:text-green-400">Approved events</p>
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
																{rejectedCount}
															</div>
															<p className="text-xs text-red-600 dark:text-red-400">Rejected events</p>
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
							paginated.map((request) => (
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
															<Button size="sm" variant="default" className="h-8 w-8 p-0" onClick={async (e) => {
																e.preventDefault()
																if (processingId) return
																setProcessingId(request.id)
																try {
																	await putEventStatus(request.id, "APPROVED")
																	// Invalidate events cache to refetch
																	queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() })
																	toast({ title: 'Approved', description: `Event ${request.name || request.id} approved.` })
																} catch (err: any) {
																	console.error('Approve failed', err)
																	toast({ title: 'Error', description: err?.message || 'Failed to approve event' })
																} finally {
																	setProcessingId(null)
																}
															}}>
																<CheckCircle className="h-4 w-4" />
															</Button>
															<Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={async (e) => {
																e.preventDefault()
																if (processingId) return
																setProcessingId(request.id)
																try {
																	await putEventStatus(request.id, "REJECTED")
																	// Invalidate events cache to refetch
																	queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() })
																	toast({ title: 'Rejected', description: `Event ${request.name || request.id} rejected.` })
																} catch (err: any) {
																	console.error('Reject failed', err)
																	toast({ title: 'Error', description: err?.message || 'Failed to reject event' })
																} finally {
																	setProcessingId(null)
																}
															}}>
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

						{/* Pagination controls */}
						<div className="flex items-center justify-between mt-2">
							<div className="text-sm text-muted-foreground">
								Showing {filteredRequests.length === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredRequests.length)} of {filteredRequests.length} requests
							</div>
							<div className="flex items-center gap-2">
								<Button size="sm" variant="outline" onClick={() => setPage(0)} disabled={page === 0}>First</Button>
								<Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
								<div className="px-2 text-sm">Page {filteredRequests.length === 0 ? 0 : page + 1} / {Math.max(1, Math.ceil(filteredRequests.length / pageSize))}</div>
								<Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(p + 1, Math.max(0, Math.ceil(filteredRequests.length / pageSize) - 1)))} disabled={(page + 1) * pageSize >= filteredRequests.length}>Next</Button>
								<Button size="sm" variant="outline" onClick={() => setPage(Math.max(0, Math.ceil(filteredRequests.length / pageSize) - 1))} disabled={(page + 1) * pageSize >= filteredRequests.length}>Last</Button>
								<select aria-label="Items per page" className="ml-2 rounded border px-2 py-1 text-sm" value={pageSize} onChange={(e) => { setPageSize(Number((e.target as HTMLSelectElement).value)); setPage(0) }}>
									<option value={3}>3</option>
									<option value={6}>6</option>
									<option value={12}>12</option>
								</select>
							</div>
						</div>
				</div>
			</AppShell>
		</ProtectedRoute>
	)
}
