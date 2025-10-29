"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarModal } from "@/components/calendar-modal"
import { Calendar, Users, MapPin, Search, CheckCircle, XCircle, Clock, Building, Eye, Filter } from "lucide-react"
import { renderTypeBadge } from "@/lib/eventUtils"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { putEventStatus } from "@/service/eventApi"
import { fetchLocation } from "@/service/locationApi"
import { fetchClub } from "@/service/clubApi"
import Link from "next/link"
import { fetchEvent } from "@/service/eventApi"
import { useRouter } from "next/navigation"

// events will be fetched from the API. The API returns a paginated object
// and the UI should display only the `content` array.

export default function UniStaffEventRequestsPage() {
	const router = useRouter()
	const [searchTerm, setSearchTerm] = useState("")
	const [typeFilter, setTypeFilter] = useState<string>("all")
	const [expiredFilter, setExpiredFilter] = useState<string>("hide")
	const [dateFilter, setDateFilter] = useState<string>("")
	const [activeTab, setActiveTab] = useState<"WAITING_UNISTAFF_APPROVAL" | "APPROVED" | "REJECTED">("WAITING_UNISTAFF_APPROVAL")
	const [showWaitingCoClub, setShowWaitingCoClub] = useState<boolean>(false)

	const [events, setEvents] = useState<any[]>([])
	const [locations, setLocations] = useState<any[]>([])
	const [clubs, setClubs] = useState<any[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [showCalendarModal, setShowCalendarModal] = useState(false)

	const { toast } = useToast()
	const [processingId, setProcessingId] = useState<number | string | null>(null)

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

	// Helper to get event status based on date and time
	const getEventStatus = (eventDate: string, eventTime: string | any) => {
		if (!eventDate) return "Finished"
		// Get current time in Vietnam timezone (UTC+7)
		const now = new Date()
		const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))

		// Handle both string and TimeObject formats
		let eventTimeStr = eventTime
		if (typeof eventTime === 'object' && eventTime !== null) {
			const pad = (n: number) => n.toString().padStart(2, '0')
			eventTimeStr = `${pad(eventTime.hour || 0)}:${pad(eventTime.minute || 0)}:${pad(eventTime.second || 0)}`
		}
		
		// Parse event date and time
		const [hour = "00", minute = "00"] = (eventTimeStr || "00:00").split(":")
		const [year, month, day] = eventDate.split('-').map(Number)
		const event = new Date(year, month - 1, day, Number(hour), Number(minute), 0, 0)

		// Event duration: assume 2 hours for "Now" window (customize as needed)
		const EVENT_DURATION_MS = 2 * 60 * 60 * 1000
		const start = event.getTime()
		const end = start + EVENT_DURATION_MS

		if (vnTime.getTime() < start) {
			// If event starts within next 7 days, it's "Soon"
			if (start - vnTime.getTime() < 7 * 24 * 60 * 60 * 1000) return "Soon"
			return "Future"
		}
		if (vnTime.getTime() >= start && vnTime.getTime() <= end) return "Now"
		return "Finished"
	}

	// Helper function to check if event has expired (past endTime) or is COMPLETED
	const isEventExpired = (event: any) => {
		// COMPLETED status is always considered expired
		if (event.status === "COMPLETED") return true
		
		// Check if date and endTime are present
		if (!event.date || !event.endTime) return false

		try {
			// Get current date/time in Vietnam timezone (UTC+7)
			const now = new Date()
			const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))

			// Parse event date (format: YYYY-MM-DD)
			const [year, month, day] = event.date.split('-').map(Number)
			
			// Parse endTime (format: HH:MM:SS or HH:MM)
			const [hours, minutes] = event.endTime.split(':').map(Number)

			// Create event end datetime in Vietnam timezone
			const eventEndDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)

			// Event is expired if current VN time is past the end time
			return vnTime > eventEndDateTime
		} catch (error) {
			console.error('Error checking event expiration:', error)
			return false
		}
	}

	useEffect(() => {
		let mounted = true
		const load = async () => {
			setLoading(true)
			try {
				console.log("🔄 Starting to fetch data for events-req page...")
				// fetch events, locations and clubs in parallel
				const [eventsRes, locationsRes, clubsRes] = await Promise.all([
					fetchEvent(), 
					fetchLocation(), 
					fetchClub()
				])
				
				console.log("✅ Received API responses:", { eventsRes, locationsRes, clubsRes })
				
				const eventsContent = (eventsRes as any) && Array.isArray((eventsRes as any).content) 
					? (eventsRes as any).content 
					: Array.isArray(eventsRes) ? eventsRes : []
				const locationsContent = (locationsRes as any) && Array.isArray((locationsRes as any).content) 
					? (locationsRes as any).content 
					: Array.isArray(locationsRes) ? locationsRes : []
				const clubsContent = (clubsRes as any) && Array.isArray((clubsRes as any).content) 
					? (clubsRes as any).content 
					: Array.isArray(clubsRes) ? clubsRes : []
				
				if (mounted) {
					console.log("📝 Setting state with data:", { eventsContent, locationsContent, clubsContent })
					setEvents(eventsContent)
					setLocations(locationsContent)
					setClubs(clubsContent)
				}
			} catch (err: any) {
				console.error("❌ Error in events-req page:", err)
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

	// Filter events based on active tab and search/filters
	const filteredRequests = events
		.filter((evt) => {
			// Hide WAITING_COCLUB_APPROVAL events by default unless toggle is enabled
			if (!showWaitingCoClub && (evt.status ?? "").toUpperCase() === "WAITING_COCLUB_APPROVAL") {
				return false
			}

			// First filter by active tab status
			// WAITING_COCLUB_APPROVAL events should appear in the WAITING_UNISTAFF_APPROVAL tab
			const eventStatus = (evt.status ?? "").toUpperCase()
			const matchTab = eventStatus === activeTab || 
				(activeTab === "WAITING_UNISTAFF_APPROVAL" && eventStatus === "WAITING_COCLUB_APPROVAL")

			const q = searchTerm.trim().toLowerCase()
			const matchSearch =
				q === "" ||
				evt.name?.toLowerCase().includes(q) ||
				// club names are not included in this payload; fallback to clubId
				String(evt.clubId || "").includes(q)

			// Type filter
			const matchType = typeFilter === "all" ? true : (evt.type || "") === typeFilter

			// Date filter
			const matchDate = !dateFilter ? true : (
				new Date(evt.date).toDateString() === new Date(dateFilter).toDateString()
			)

			// Expired filter
			const isExpired = isEventExpired(evt)
			let matchExpired = true
			if (expiredFilter === "hide") {
				matchExpired = !isExpired
			} else if (expiredFilter === "only") {
				matchExpired = isExpired
			} else if (expiredFilter === "Soon" || expiredFilter === "Finished") {
				const status = getEventStatus(evt.date, evt.startTime || evt.time)
				matchExpired = status.toLowerCase() === expiredFilter.toLowerCase()
			}
			// "show" means show all - no filtering needed

			return matchTab && matchSearch && matchType && matchDate && matchExpired
		})
		// Sort by latest date (newest first)
		.sort((a, b) => {
			const dateA = a.date ? new Date(a.date).getTime() : 0
			const dateB = b.date ? new Date(b.date).getTime() : 0
			return dateB - dateA // Descending order (latest first)
		})

		// Minimal pagination state
		const [page, setPage] = useState(0)
		const [pageSize, setPageSize] = useState(3)

	// Clamp page when filteredRequests or pageSize change
	useEffect(() => {
		const last = Math.max(0, Math.ceil(filteredRequests.length / pageSize) - 1)
		if (page > last) setPage(last)
	}, [filteredRequests.length, pageSize])

	// Reset to page 0 when switching tabs
	useEffect(() => {
		setPage(0)
	}, [activeTab])

		const paginated = (() => {
			const start = page * pageSize
			return filteredRequests.slice(start, start + pageSize)
		})()

	const getStatusBadge = (status: string, isExpired: boolean = false, isCompleted: boolean = false) => {
		// COMPLETED status gets dark blue badge - highest priority
		if (isCompleted || status === "COMPLETED") {
			return (
				<Badge variant="secondary" className="bg-blue-900 text-white border-blue-900 font-semibold">
					<span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
					Completed
				</Badge>
			)
		}
		
		// Override with Expired badge if expired - gray color to override approval status
		if (isExpired) {
			return (
				<Badge variant="secondary" className="bg-gray-400 text-white font-semibold">
					<span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
					Expired
				</Badge>
			)
		}

		switch (status) {
			case "WAITING_UNISTAFF_APPROVAL":
				return (
					<Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-500 font-semibold">
						<span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
						Waiting Uni-Staff
					</Badge>
				)
			case "APPROVED":
				return (
					<Badge variant="default" className="bg-green-600 text-white border-green-600 font-semibold">
						<span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
						Approved
					</Badge>
				)
			case "WAITING_COCLUB_APPROVAL":
				return (
					<Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-500 font-semibold">
						<span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1.5"></span>
						Waiting
					</Badge>
				)
			case "REJECTED":
				return (
					<Badge variant="destructive" className="font-semibold">
						<span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5"></span>
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
	const waitingUniStaffCount = events.filter((e) => (e.status ?? "").toUpperCase() === "WAITING_UNISTAFF_APPROVAL").length
	const approvedCount = events.filter((e) => (e.status ?? "").toUpperCase() === "APPROVED").length
	const rejectedCount = events.filter((e) => (e.status ?? "").toUpperCase() === "REJECTED").length
	const waitingCoClubCount = events.filter((e) => (e.status ?? "").toUpperCase() === "WAITING_COCLUB_APPROVAL").length

	return (
		<ProtectedRoute allowedRoles={["uni_staff"]}>
			<AppShell>
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold">Event Requests</h1>
							<p className="text-muted-foreground">Review and manage event organization requests</p>
						</div>
						<Button variant="outline" onClick={() => setShowCalendarModal(true)}>
							<Calendar className="h-4 w-4 mr-2" /> Calendar View
						</Button>
					</div>

					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
							<CardHeader className="pb-3 px-4 pt-3">
								<CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
									Waiting Approval
								</CardTitle>
							</CardHeader>
							<CardContent className="pb-3 px-4">
								<div className="flex items-center gap-2">
									<div className="p-1.5 bg-yellow-500 rounded-md">
										<Clock className="h-5 w-5 text-white" />
									</div>
									<div>
										<div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
																{waitingUniStaffCount}
															</div>
															<p className="text-sm text-yellow-600 dark:text-yellow-400">Waiting events</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
							<CardHeader className="pb-3 px-4 pt-3">
								<CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
									Approved
								</CardTitle>
							</CardHeader>
							<CardContent className="pb-3 px-4">
								<div className="flex items-center gap-2">
									<div className="p-1.5 bg-green-500 rounded-md">
										<CheckCircle className="h-5 w-5 text-white" />
									</div>
									<div>
										<div className="text-2xl font-bold text-green-900 dark:text-green-100">
																{approvedCount}
															</div>
															<p className="text-sm text-green-600 dark:text-green-400">Approved events</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
							<CardHeader className="pb-3 px-4 pt-3">
								<CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Rejected</CardTitle>
							</CardHeader>
							<CardContent className="pb-3 px-4">
								<div className="flex items-center gap-2">
									<div className="p-1.5 bg-red-500 rounded-md">
										<XCircle className="h-5 w-5 text-white" />
									</div>
									<div>
										<div className="text-2xl font-bold text-red-900 dark:text-red-100">
																{rejectedCount}
															</div>
															<p className="text-sm text-red-600 dark:text-red-400">Rejected events</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Tab Buttons */}
					<div className="flex gap-3 border-b-2 border-gray-200 dark:border-gray-700">
						<Button
							variant={activeTab === "WAITING_UNISTAFF_APPROVAL" ? "default" : "ghost"}
							size="lg"
							className={`flex-1 rounded-b-none py-6 text-base font-semibold transition-all ${
								activeTab === "WAITING_UNISTAFF_APPROVAL"
									? "border-b-4 border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300"
									: "border-b-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
							}`}
							onClick={() => setActiveTab("WAITING_UNISTAFF_APPROVAL")}
						>
							<Clock className="h-5 w-5 mr-2" />
							Waiting ({waitingUniStaffCount})
						</Button>
						<Button
							variant={activeTab === "APPROVED" ? "default" : "ghost"}
							size="lg"
							className={`flex-1 rounded-b-none py-6 text-base font-semibold transition-all ${
								activeTab === "APPROVED"
									? "border-b-4 border-green-500 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300"
									: "border-b-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
							}`}
							onClick={() => setActiveTab("APPROVED")}
						>
							<CheckCircle className="h-5 w-5 mr-2" />
							Approved ({approvedCount})
						</Button>
						<Button
							variant={activeTab === "REJECTED" ? "default" : "ghost"}
							size="lg"
							className={`flex-1 rounded-b-none py-6 text-base font-semibold transition-all ${
								activeTab === "REJECTED"
									? "border-b-4 border-red-500 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
									: "border-b-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
							}`}
							onClick={() => setActiveTab("REJECTED")}
						>
							<XCircle className="h-5 w-5 mr-2" />
							Rejected ({rejectedCount})
						</Button>
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
							<Select value={typeFilter} onValueChange={setTypeFilter}>
								<SelectTrigger className="w-32">
									<SelectValue placeholder="Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="PUBLIC">Public</SelectItem>
									<SelectItem value="PRIVATE">Private</SelectItem>
								</SelectContent>
							</Select>

							<Input
								type="date"
								value={dateFilter}
								onChange={(e) => setDateFilter(e.target.value)}
								className="w-40"
								placeholder="Filter by date"
							/>

							<Select value={expiredFilter} onValueChange={setExpiredFilter}>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="Expired" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="hide">Hide Expired</SelectItem>
									<SelectItem value="show">Show All</SelectItem>
									<SelectItem value="only">Only Expired</SelectItem>
									<SelectItem value="Soon">Soon</SelectItem>
									<SelectItem value="Finished">Finished</SelectItem>
								</SelectContent>
							</Select>

							<Button
								variant={showWaitingCoClub ? "default" : "outline"}
								size="sm"
								onClick={() => setShowWaitingCoClub(!showWaitingCoClub)}
								className="flex items-center gap-2"
							>
								<Filter className="h-4 w-4" />
								{showWaitingCoClub ? "Hide" : "Show"} Waiting Co-Club
								{waitingCoClubCount > 0 && (
									<Badge 
										variant="secondary" 
										className={`ml-1 ${showWaitingCoClub ? "bg-white/20" : "bg-orange-100 text-orange-700"}`}
									>
										{waitingCoClubCount}
									</Badge>
								)}
							</Button>
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
							paginated.map((request) => {
								// COMPLETED status means event has ended, regardless of date/time
								const isCompleted = request.status === "COMPLETED"
								const expired = isCompleted || isEventExpired(request)
								
								// Left border color based on status
								let borderClass = ""
								if (isCompleted) {
									borderClass = 'border-l-4 border-l-blue-900 opacity-60'
								} else if (expired) {
									borderClass = 'border-l-4 border-l-gray-400 opacity-60'
								} else if (request.status === "APPROVED") {
									borderClass = 'border-l-4 border-l-green-500'
								} else if (request.status === "WAITING_COCLUB_APPROVAL") {
									borderClass = 'border-l-4 border-l-orange-500'
								} else if (request.status === "WAITING_UNISTAFF_APPROVAL") {
									borderClass = 'border-l-4 border-l-yellow-500'
								} else if (request.status === "REJECTED") {
									borderClass = 'border-l-4 border-l-red-500'
								}
								
								return (
								<Card key={request.id} className={`hover:shadow-md transition-shadow cursor-pointer ${borderClass}`}>
									<Link href={`/uni-staff/events-req/${request.id}`}>
										<CardContent className="p-6">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-2">
														<Calendar className="h-5 w-5 text-muted-foreground" />
														<h3 className="font-semibold text-lg">{request.name || request.eventName}</h3>
														{renderTypeBadge(request.type || request.eventType)}
														{/* category not provided by API example */}
														{getStatusBadge(request.status || request.type, expired, isCompleted)}
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
													{request.status === "WAITING_UNISTAFF_APPROVAL" && !expired && (
														<>
															<Button size="sm" variant="default" className="h-8 w-8 p-0" onClick={async (e) => {
																e.preventDefault()
																if (processingId) return
																setProcessingId(request.id)
																try {
																	await putEventStatus(request.id, "APPROVED", request.budgetPoints || 0)
																	// optimistic update in local state
																	setEvents(prev => prev.map(ev => ev.id === request.id ? { ...ev, status: "APPROVED" } : ev))
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
																	await putEventStatus(request.id, "REJECTED", request.budgetPoints || 0)
																	setEvents(prev => prev.map(ev => ev.id === request.id ? { ...ev, status: "REJECTED" } : ev))
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
								)
							})
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

						{/* Calendar Modal */}
						<CalendarModal
							open={showCalendarModal}
							onOpenChange={setShowCalendarModal}
							events={events}
							onEventClick={(event) => {
								setShowCalendarModal(false)
								router.push(`/uni-staff/events-req/${event.id}`)
							}}
						/>
				</div>
			</AppShell>
		</ProtectedRoute>
	)
}
