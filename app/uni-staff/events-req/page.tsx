"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarModal } from "@/components/calendar-modal"
import { Calendar, Users, MapPin, Search, CheckCircle, XCircle, Clock, Building, Eye, Filter, DollarSign, Gift, X, History, HistoryIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { renderTypeBadge } from "@/lib/eventUtils"
import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { putEventStatus, getEventSettle, isEventExpired as isEventExpiredUtil } from "@/service/eventApi"
import { fetchLocation } from "@/service/locationApi"
import { fetchClub } from "@/service/clubApi"
import Link from "next/link"
import { fetchEvent } from "@/service/eventApi"
import { EventDateTimeDisplay } from "@/components/event-date-time-display"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { getUniToEventTransactions, ApiUniToEventTransaction } from "@/service/walletApi"

// Bảng màu theo ngành học (giống như trong clubs page)
const majorColors: Record<string, string> = {
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

// Helper function để lấy màu cho major name
const getMajorColor = (majorName?: string | null): string => {
	if (!majorName) return "#E2E8F0"
	return majorColors[majorName] || "#E2E8F0"
}

// Tính màu chữ tương phản (đen/trắng) dựa trên nền HEX
const getContrastTextColor = (hexColor: string): string => {
	const hex = hexColor.replace('#', '')
	const r = parseInt(hex.substring(0, 2), 16)
	const g = parseInt(hex.substring(2, 4), 16)
	const b = parseInt(hex.substring(4, 6), 16)
	// YIQ luma
	const yiq = (r * 299 + g * 587 + b * 114) / 1000
	return yiq >= 140 ? "#111827" : "#FFFFFF" // text-slate-900 or white
}

// events will be fetched from the API. The API returns a paginated object
// and the UI should display only the `content` array.

export default function UniStaffEventRequestsPage() {
	const router = useRouter()
	const [searchTerm, setSearchTerm] = useState("")
	const [typeFilter, setTypeFilter] = useState<string>("all")
	const [expiredFilter, setExpiredFilter] = useState<string>("hide")
	const [dateFilter, setDateFilter] = useState<string>("")
	const [activeTab, setActiveTab] = useState<"PENDING_UNISTAFF" | "APPROVED" | "ONGOING" | "REJECTED" | "COMPLETED">("PENDING_UNISTAFF")
	const [showWaitingCoClub, setShowWaitingCoClub] = useState<boolean>(false)
	const [showAllEvents, setShowAllEvents] = useState<boolean>(false) // Toggle to show all events including invalid dates
	const [showInvalidDateEvents, setShowInvalidDateEvents] = useState<boolean>(true) // Toggle to show events with invalid/past dates

	const [events, setEvents] = useState<any[]>([])
	const [allEvents, setAllEvents] = useState<any[]>([])
	const [locations, setLocations] = useState<any[]>([])
	const [clubs, setClubs] = useState<any[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [showCalendarModal, setShowCalendarModal] = useState(false)
	const [settledEventIds, setSettledEventIds] = useState<Set<number>>(new Set())

	// Event Points modal state
	const [showEventPointsModal, setShowEventPointsModal] = useState(false)
	const [eventTransactions, setEventTransactions] = useState<ApiUniToEventTransaction[]>([])
	const [eventTransactionsLoading, setEventTransactionsLoading] = useState(false)
	const [eventTransactionTypeFilter, setEventTransactionTypeFilter] = useState<string>("all")
	const [eventDateFilter, setEventDateFilter] = useState<string>("all")
	const [eventCurrentPage, setEventCurrentPage] = useState(1)
	const [eventPageSize] = useState(8)

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
	const getEventStatus = (event: any, eventStatus?: string) => {
		// Nếu event.status là ONGOING thì bắt buộc phải là "Now"
		if (eventStatus === "ONGOING") return "Now"

		const eventDate = getEventDateString(event)
		if (!eventDate) return "Finished"

		// Get current time in Vietnam timezone (UTC+7)
		const now = new Date()
		const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))

		// Handle both string and TimeObject formats for time
		let eventTime = event.startTime || event.time
		let eventTimeStr = eventTime
		if (typeof eventTime === 'object' && eventTime !== null) {
			const pad = (n: number) => n.toString().padStart(2, '0')
			eventTimeStr = `${pad(eventTime.hour || 0)}:${pad(eventTime.minute || 0)}:${pad(eventTime.second || 0)}`
		}

		// Parse event date and time
		const [hour = "00", minute = "00"] = (eventTimeStr || "00:00").split(":")
		const [year, month, day] = eventDate.split('-').map(Number)
		const eventDateTime = new Date(year, month - 1, day, Number(hour), Number(minute), 0, 0)

		// Event duration: assume 2 hours for "Now" window (customize as needed)
		const EVENT_DURATION_MS = 2 * 60 * 60 * 1000
		const start = eventDateTime.getTime()
		const end = start + EVENT_DURATION_MS

		if (vnTime.getTime() < start) {
			// If event starts within next 7 days, it's "Soon"
			if (start - vnTime.getTime() < 7 * 24 * 60 * 60 * 1000) return "Soon"
			return "Future"
		}
		if (vnTime.getTime() >= start && vnTime.getTime() <= end) return "Now"
		return "Finished"
	}

	// Helper functions to safely get event date
	const getEventDate = (event: any): Date | null => {
		// Multi-day event: use startDate or first day's date
		if (event.days && event.days.length > 0) {
			return event.days[0].date ? new Date(event.days[0].date) : null
		}
		// Single-day event: use date field
		if (event.date) {
			return new Date(event.date)
		}
		return null
	}

	const getEventDateString = (event: any): string => {
		const date = getEventDate(event)
		return date ? date.toISOString().split('T')[0] : ''
	}

	// Use isEventExpired from eventApi.ts which supports both single-day and multi-day events
	const isEventExpired = isEventExpiredUtil

	useEffect(() => {
		let mounted = true
		const load = async () => {
			setLoading(true)
			try {
				// fetch events, locations, clubs, and settled events in parallel
				const [eventsRes, locationsRes, clubsRes, settledEventsRes] = await Promise.all([
					fetchEvent(),
					fetchLocation(),
					fetchClub(),
					getEventSettle().catch(err => {
						console.warn("Failed to fetch settled events:", err)
						return []
					})
				])


				const eventsContent = (eventsRes as any) && Array.isArray((eventsRes as any).content)
					? (eventsRes as any).content
					: Array.isArray(eventsRes) ? eventsRes : []
				const locationsContent = (locationsRes as any) && Array.isArray((locationsRes as any).content)
					? (locationsRes as any).content
					: Array.isArray(locationsRes) ? locationsRes : []
				const clubsContent = (clubsRes as any) && Array.isArray((clubsRes as any).content)
					? (clubsRes as any).content
					: Array.isArray(clubsRes) ? clubsRes : []

				// Create a set of settled event IDs
				const settledIds = new Set(
					Array.isArray(settledEventsRes)
						? settledEventsRes.map((e: any) => e.id)
						: []
				)

				if (mounted) {
					setEvents(eventsContent)
					setAllEvents(eventsContent) // Store all events for CalendarModal
					setLocations(locationsContent)
					setClubs(clubsContent)
					setSettledEventIds(settledIds)
				}
			} catch (err: any) {
				console.error("  Error in events-req page:", err)
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

	// Helper function to check if event has valid date/time
	const hasValidDateTime = (event: any): boolean => {
		// Check if event has multi-day format (days array)
		const isMultiDay = !!(event.days && event.days.length > 0)

		// Check if event has single-day format (date and endTime)
		const isSingleDay = !!(event.date || event.endTime)

		// Event must have either multi-day or single-day date/time
		return isMultiDay || isSingleDay
	}

	// Helper function to check if event has invalid/past date
	const hasInvalidDate = (event: any): boolean => {
		const now = new Date()
		
		// Check if event has date fields
		if (event.startDate) {
			const startDate = new Date(event.startDate)
			// If start date is more than 30 days in the past, consider it invalid
			const daysDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
			return daysDiff > 30
		}
		
		if (event.date) {
			const eventDate = new Date(event.date)
			const daysDiff = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
			return daysDiff > 30
		}
		
		return false
	}

	// Filter events based on active tab and search/filters
	const filteredRequests = events
		.filter((evt) => {
			// If showAllEvents is enabled, show ALL events from ALL tabs (ignore status filter)
			if (showAllEvents) {
				// Only apply search and type filters
				const q = searchTerm.trim().toLowerCase()
				const matchSearch =
					q === "" ||
					evt.name?.toLowerCase().includes(q) ||
					String(evt.clubId || "").includes(q)

				// Apply type filter
				const matchType = typeFilter === "all" ? true : (evt.type || "") === typeFilter

				return matchSearch && matchType
			}

			// Normal filtering mode (showAllEvents = false)
			// Filter by active tab status
			const eventStatus = (evt.status ?? "").toUpperCase()
			const matchTab = eventStatus === activeTab ||
				(activeTab === "PENDING_UNISTAFF" && eventStatus === "PENDING_COCLUB") ||
				(activeTab === "REJECTED" && eventStatus === "CANCELLED")
			
			if (!matchTab) return false

			// Normal filtering mode (showAllEvents = false)
			
			// Filter out events without valid date/time (draft events)
			// These events are not ready for review and should not appear in the list
			if (!hasValidDateTime(evt)) {
				return false
			}

			// Filter out events with invalid dates unless toggle is enabled
			if (!showInvalidDateEvents && hasInvalidDate(evt)) {
				return false
			}

			// Hide PENDING_COCLUB events by default unless toggle is enabled
			if (!showWaitingCoClub && eventStatus === "PENDING_COCLUB") {
				return false
			}

			const q = searchTerm.trim().toLowerCase()
			const matchSearch =
				q === "" ||
				evt.name?.toLowerCase().includes(q) ||
				// club names are not included in this payload; fallback to clubId
				String(evt.clubId || "").includes(q)

			// Type filter
			const matchType = typeFilter === "all" ? true : (evt.type || "") === typeFilter

			// Date filter - use helper function for proper date handling
			const matchDate = !dateFilter ? true : (
				getEventDateString(evt) === dateFilter
			)

			// Expired filter
			const isExpired = isEventExpired(evt)
			let matchExpired = true
			if (expiredFilter === "hide") {
				matchExpired = !isExpired
			} else if (expiredFilter === "only") {
				matchExpired = isExpired
			} else if (expiredFilter === "Soon" || expiredFilter === "Finished") {
				const status = getEventStatus(evt, evt.status)
				matchExpired = status.toLowerCase() === expiredFilter.toLowerCase()
			}
			// "show" means show all - no filtering needed

			return matchSearch && matchType && matchDate && matchExpired
		})
		// Sort by latest date (newest first)
		.sort((a, b) => {
			const dateA = getEventDate(a)?.getTime() || 0
			const dateB = getEventDate(b)?.getTime() || 0
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

	// Reset to page 0 and adjust expired filter when switching tabs
	useEffect(() => {
		setPage(0)
		// When switching to COMPLETED or ONGOING tab, automatically show all events (don't hide expired)
		if (activeTab === "COMPLETED" || activeTab === "ONGOING") {
			setExpiredFilter("show")
		}
	}, [activeTab])

	const paginated = (() => {
		const start = page * pageSize
		return filteredRequests.slice(start, start + pageSize)
	})()

	const getStatusBadge = (status: string, isExpired: boolean = false, isCompleted: boolean = false) => {
		// COMPLETED status gets dark blue badge - highest priority
		if (isCompleted || status === "COMPLETED") {
			return (
				<Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 
				dark:border-blue-700 font-semibold">
					<span className="inline-block w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mr-1.5"></span>
					Complete
				</Badge>
			)
		}

		// Override with Expired badge if expired - gray color to override approval status
		if (isExpired) {
			return (
				<Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 
				font-semibold">
					<span className="inline-block w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 mr-1.5"></span>
					Expired
				</Badge>
			)
		}

		switch (status) {
			case "ONGOING":
				return (
					<Badge variant="default" className="bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 
					dark:border-purple-700 font-semibold">
						<span className="inline-block w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 mr-1.5"></span>
						Ongoing
					</Badge>
				)
			case "PENDING_UNISTAFF":
				return (
					<Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 
					dark:border-yellow-700 font-semibold">
						<span className="inline-block w-2 h-2 rounded-full bg-yellow-500 dark:bg-yellow-400 mr-1.5"></span>
						Pending Uni-Staff
					</Badge>
				)
			case "APPROVED":
				return (
					<Badge variant="default" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 
					dark:border-green-700 font-semibold">
						<span className="inline-block w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 mr-1.5"></span>
						Approved
					</Badge>
				)
			case "PENDING_COCLUB":
				return (
					<Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 
					dark:border-orange-700 font-semibold">
						<span className="inline-block w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400 mr-1.5"></span>
						Waiting
					</Badge>
				)
			case "REJECTED":
				return (
					<Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300 
					dark:border-red-700 font-semibold">
						<span className="inline-block w-2 h-2 rounded-full bg-red-600 dark:bg-red-400 mr-1.5"></span>
						Rejected
					</Badge>
				)
			case "CANCELLED":
				return (
					<Badge variant="destructive" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 
					dark:border-orange-700 font-semibold">
						<span className="inline-block w-2 h-2 rounded-full bg-orange-600 dark:bg-orange-400 mr-1.5"></span>
						Cancelled
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

	const formatDate = (event: any) => {
		const date = getEventDate(event)
		if (!date) return 'Invalid Date'
		
		// If event has invalid date, don't show date
		if (hasInvalidDate(event)) {
			return '—' // Em dash to indicate no date
		}
		
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const formatTransactionDate = (dateString: string) => {
		try {
			const date = new Date(dateString)
			if (isNaN(date.getTime())) return 'Invalid Date'
			return date.toLocaleString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})
		} catch (error) {
			return 'Invalid Date'
		}
	}

	// Get badge color for transaction type
	const getTransactionTypeBadgeColor = (type: string) => {
		const colorMap: Record<string, string> = {
			ADD: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
			REDUCE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
			TRANSFER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
			UNI_TO_CLUB: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
			CLUB_TO_MEMBER: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
			EVENT_BUDGET_GRANT: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
			EVENT_REFUND_REMAINING: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
			COMMIT_LOCK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
			REFUND_COMMIT: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
			BONUS_REWARD: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
			RETURN_SURPLUS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
			REDEEM_PRODUCT: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
			REFUND_PRODUCT: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
			EVENT_REDEEM_PRODUCT: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
			EVENT_REFUND_PRODUCT: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
			CLUB_RECEIVE_REDEEM: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
			CLUB_REFUND: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
			ADMIN_ADJUST: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
			MEMBER_PENALTY: "bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300",
			CLUB_FROM_PENALTY: "bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-300",
			EVENT_BUDGET_FORFEIT: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
			MEMBER_REWARD: "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
			CLUB_REWARD_DISTRIBUTE: "bg-teal-200 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
			PRODUCT_CREATION_COST: "bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
		};
		return colorMap[type] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
	};

	// Get unique transaction types from Event transactions
	const uniqueEventTransactionTypes = useMemo(() => {
		const types = new Set(eventTransactions.map(t => t.type));
		return Array.from(types).sort();
	}, [eventTransactions]);

	// Filter Event transactions
	const filteredEventTransactions = useMemo(() => {
		let filtered = [...eventTransactions];
		
		if (eventTransactionTypeFilter !== "all") {
			filtered = filtered.filter(t => t.type === eventTransactionTypeFilter);
		}
		
		if (eventDateFilter !== "all") {
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			
			filtered = filtered.filter(t => {
				const transactionDate = new Date(t.createdAt);
				const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
				
				switch (eventDateFilter) {
					case "today":
						return transactionDay.getTime() === today.getTime();
					case "week":
						const weekAgo = new Date(today);
						weekAgo.setDate(weekAgo.getDate() - 7);
						return transactionDay >= weekAgo;
					case "month":
						return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
					case "year":
						return transactionDate.getFullYear() === now.getFullYear();
					default:
						return true;
				}
			});
		}
		
		return filtered;
	}, [eventTransactions, eventDateFilter, eventTransactionTypeFilter]);

	// Paginate filtered Event transactions
	const paginatedEventTransactions = useMemo(() => {
		const startIndex = (eventCurrentPage - 1) * eventPageSize;
		const endIndex = startIndex + eventPageSize;
		return filteredEventTransactions.slice(startIndex, endIndex);
	}, [filteredEventTransactions, eventCurrentPage, eventPageSize]);

	const eventTotalPages = Math.ceil(filteredEventTransactions.length / eventPageSize);

	const loadEventTransactionHistory = async () => {
		setEventTransactionsLoading(true)
		try {
			const data = await getUniToEventTransactions()
			setEventTransactions(data)
		} catch (err: any) {
			toast({
				title: "Error",
				description: err?.response?.data?.error || err?.response?.data?.message || "Failed to load event transaction history",
				variant: "destructive"
			})
		} finally {
			setEventTransactionsLoading(false)
		}
	}

	const handleOpenEventPointsModal = () => {
		setShowEventPointsModal(true)
		setEventTransactionTypeFilter("all")
		setEventDateFilter("all")
		setEventCurrentPage(1)
		loadEventTransactionHistory()
	}

	// Compute counts by status from ALL events (including those with invalid dates)
	// Stats cards show total counts regardless of date validity
	const totalCount = events.length
	const waitingUniStaffCount = events.filter((e) =>
		(e.status ?? "").toUpperCase() === "PENDING_UNISTAFF" &&
		hasValidDateTime(e) &&
		!isEventExpired(e)
	).length
	const approvedCount = events.filter((e) =>
		(e.status ?? "").toUpperCase() === "APPROVED" &&
		hasValidDateTime(e) &&
		!isEventExpired(e)
	).length
	const ongoingCount = events.filter((e) =>
		(e.status ?? "").toUpperCase() === "ONGOING" &&
		hasValidDateTime(e) &&
		!isEventExpired(e)
	).length
	const rejectedCount = events.filter((e) => {
		const status = (e.status ?? "").toUpperCase()
		return (status === "REJECTED" || status === "CANCELLED") &&
			hasValidDateTime(e)
	}).length
	const completedCount = events.filter((e) =>
		(e.status ?? "").toUpperCase() === "COMPLETED" &&
		hasValidDateTime(e)
	).length
	const waitingCoClubCount = events.filter((e) =>
		(e.status ?? "").toUpperCase() === "PENDING_COCLUB" &&
		hasValidDateTime(e) &&
		!isEventExpired(e)
	).length

	return (
		<ProtectedRoute allowedRoles={["uni_staff"]}>
			<AppShell>
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold">Event Requests</h1>
							<p className="text-muted-foreground">Review and manage event organization requests</p>
						</div>
						<div className="flex gap-2">
							<Button
								variant={showAllEvents ? "default" : "outline"}
								onClick={() => setShowAllEvents(!showAllEvents)}
								className={showAllEvents 
									? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 font-semibold shadow-md" 
									: "bg-emerald-50 border-emerald-400 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-600 font-semibold shadow-sm dark:bg-emerald-900/30 dark:border-emerald-300 dark:text-emerald-200 dark:hover:bg-emerald-800/60 dark:hover:border-emerald-100"
								}
							>
								<Eye className="h-4 w-4 mr-2" />
								{showAllEvents ? "Showing All" : "Show All Events"}
							</Button>
							<Button
								variant="outline"
								onClick={handleOpenEventPointsModal}
								className="bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 hover:border-blue-600 font-semibold shadow-sm 
								dark:bg-blue-900/30 dark:border-blue-300 dark:text-blue-200 dark:hover:bg-blue-800/60 dark:hover:border-blue-100"
							>
								<HistoryIcon className="h-4 w-4 mr-2" /> Event Points
							</Button>
							<Button
								variant="outline"
								onClick={() => setShowCalendarModal(true)}
								className="bg-purple-50 border-purple-400 text-purple-700 hover:bg-purple-100 hover:border-purple-600 font-semibold 
								shadow-sm dark:bg-purple-900/30 dark:border-purple-300 dark:text-purple-200 dark:hover:bg-purple-800/60 dark:hover:border-purple-100"
							>
								<Calendar className="h-4 w-4 mr-2" /> Calendar View
							</Button>
						</div>
					</div>

					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<Card className="border-0 shadow-md bg-linear-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
							<CardHeader className="pb-3 px-4 pt-3">
								<CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
									Pending Approval
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

						<Card className="border-0 shadow-md bg-linear-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
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

						<Card className="border-0 shadow-md bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
							<CardHeader className="pb-3 px-4 pt-3">
								<CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
									Completed
								</CardTitle>
							</CardHeader>
							<CardContent className="pb-3 px-4">
								<div className="flex items-center gap-2">
									<div className="p-1.5 bg-blue-500 rounded-md">
										<CheckCircle className="h-5 w-5 text-white" />
									</div>
									<div>
										<div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
											{completedCount}
										</div>
										<p className="text-sm text-blue-600 dark:text-blue-400">Completed events</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-md bg-linear-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
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
							variant={activeTab === "PENDING_UNISTAFF" ? "default" : "ghost"}
							size="lg"
							className={`flex-1 rounded-b-none py-6 text-base font-semibold transition-all dark:bg-gray-800 bg-white ${activeTab === "PENDING_UNISTAFF"
								? "border-b-4 border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300"
								: "border-b-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
							onClick={() => setActiveTab("PENDING_UNISTAFF")}
						>
							<Clock className="h-5 w-5 mr-2" />
							Waiting ({waitingUniStaffCount})
						</Button>
						<Button
							variant={activeTab === "APPROVED" ? "default" : "ghost"}
							size="lg"
							className={`flex-1 rounded-b-none py-6 text-base font-semibold transition-all dark:bg-gray-800 bg-white ${activeTab === "APPROVED"
								? "border-b-4 border-green-500 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300"
								: "border-b-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
							onClick={() => setActiveTab("APPROVED")}
						>
							<CheckCircle className="h-5 w-5 mr-2" />
							Approved ({approvedCount})
						</Button>
						<Button
							variant={activeTab === "ONGOING" ? "default" : "ghost"}
							size="lg"
							className={`flex-1 rounded-b-none py-6 text-base font-semibold transition-all dark:bg-gray-800 bg-white ${activeTab === "ONGOING"
								? "border-b-4 border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300"
								: "border-b-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
							onClick={() => setActiveTab("ONGOING")}
						>
							<Clock className="h-5 w-5 mr-2" />
							Ongoing ({ongoingCount})
						</Button>
						<Button
							variant={activeTab === "COMPLETED" ? "default" : "ghost"}
							size="lg"
							className={`flex-1 rounded-b-none py-6 text-base font-semibold transition-all dark:bg-gray-800 bg-white ${activeTab === "COMPLETED"
								? "border-b-4 border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
								: "border-b-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
							onClick={() => setActiveTab("COMPLETED")}
						>
							<CheckCircle className="h-5 w-5 mr-2" />
							Completed ({completedCount})
						</Button>
						<Button
							variant={activeTab === "REJECTED" ? "default" : "ghost"}
							size="lg"
							className={`flex-1 rounded-b-none py-6 text-base font-semibold transition-all dark:bg-gray-800 bg-white ${activeTab === "REJECTED"
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
						{/* <div className="flex items-center gap-2 max-w-sm w-full">
							<Search className="h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search by event name or organizer..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div> */}
						<div className="flex items-center gap-2 max-w-sm w-full">
							<Search className="h-4 w-4 text-muted-foreground" />
							{/* Wrap Input and Button in relative div */}
							<div className="relative w-full">
								<Input
									placeholder="Search by event name or organizer..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									// Add padding-right so text doesn't hit the button
									className="pr-12 border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
								/>
								{/* Render Clear Button only when there is text */}
								{searchTerm && (
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setSearchTerm("")}
										className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
									>
										<X className="h-4 w-4 text-muted-foreground" />
									</Button>
								)}
							</div>
						</div>


						<div className="flex items-center gap-3">
							<Select value={typeFilter} onValueChange={setTypeFilter}>
								<SelectTrigger className="w-32 border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700">
									<SelectValue placeholder="Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="PUBLIC">Public</SelectItem>
									<SelectItem value="PRIVATE">Private</SelectItem>
									<SelectItem value="SPECIAL">Special</SelectItem>
								</SelectContent>
							</Select>

							<Input
								type="date"
								value={dateFilter}
								onChange={(e) => setDateFilter(e.target.value)}
								className="w-40 border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
								placeholder="Filter by date"
							/>

							<Select value={expiredFilter} onValueChange={setExpiredFilter}>
								<SelectTrigger className="w-40 border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700">
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
								className={`flex items-center gap-2 border-slate-300 dark:border-slate-700
    									${showWaitingCoClub
										? "bg-teal-600 text-white bg-primary" // Khi nút là Hide (Active): Nền màu, chữ trắng
										: "bg-white text-slate-900 hover:bg-slate-100 hover:text-black dark:bg-slate-800 dark:text-slate-100" // Khi nút là Show (Inactive): Nền trắng, chữ đen
									}`}
							>
								<Filter className="h-4 w-4" />
								{showWaitingCoClub ? "Hide" : "Show"} Pending Co-Club
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
								} else if (request.status === "PENDING_COCLUB") {
									borderClass = 'border-l-4 border-l-orange-500'
								} else if (request.status === "PENDING_UNISTAFF") {
									borderClass = 'border-l-4 border-l-yellow-500'
								} else if (request.status === "REJECTED") {
									borderClass = 'border-l-4 border-l-red-500'
								}

								return (
									<Card key={request.id} className={`hover:shadow-md transition-shadow cursor-pointer dark:border-slate-700 ${borderClass}`}>
										<Link href={`/uni-staff/events-req/${request.id}`}>
											<CardContent className="p-6">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="flex items-center gap-3 mb-2 flex-wrap">
															<Calendar className="h-5 w-5 text-muted-foreground" />
															<h3 className="font-semibold text-lg">{request.name || request.eventName}</h3>
															{renderTypeBadge(request.type || request.eventType)}
															{/* Major Name Badge - lấy từ majorName, category, hoặc hostClub.majorName */}
															{(request.majorName || request.category || request.hostClub?.majorName) && (
																<Badge
																	variant="secondary"
																	className="max-w-[160px] truncate"
																	style={{
																		backgroundColor: getMajorColor(request.majorName || request.category || request.hostClub?.majorName),
																		color: getContrastTextColor(getMajorColor(request.majorName || request.category || request.hostClub?.majorName)),
																	}}
																>
																	{request.majorName || request.category || request.hostClub?.majorName}
																</Badge>
															)}
															{getStatusBadge(request.status || request.type, expired, isCompleted)}
															{/* Show "Need Settle" badge if event is COMPLETED but not in settled list */}
															{isCompleted && !settledEventIds.has(request.id) && (
																<Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 
																dark:text-amber-300 dark:border-amber-700 font-semibold animate-pulse">
																	<DollarSign className="h-3 w-3 mr-1" />
																	Need Settle
																</Badge>
															)}
															{/* Receive Point badge */}
															<Badge
																variant="default"
																className="flex items-center gap-1 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
															>
																<Gift className="h-3 w-3" />
																{(() => {
																	const budgetPoints = request.budgetPoints ?? 0
																	const maxCheckInCount = request.maxCheckInCount ?? 1
																	return maxCheckInCount > 0 ? Math.floor(budgetPoints / maxCheckInCount) : 0
																})()} pts
															</Badge>
														</div>

														<p className="text-muted-foreground mb-3 line-clamp-2">{request.description}</p>

														<div className="flex items-center gap-6 text-sm text-muted-foreground">
															<div className="flex items-center gap-1">
																<Calendar className="h-4 w-4" />
																<span>{formatDate(request)}</span>
															</div>
															<div className="flex items-center gap-1">
																<MapPin className="h-4 w-4" />
																<span>
																	{request.locationName || `ID: ${request.locationId || 'N/A'}`}
																</span>
															</div>
															<div className="flex items-center gap-1">
																<Users className="h-4 w-4" />
																<span>
																	{typeof request.maxCheckInCount === 'number' ? `${request.maxCheckInCount} max check-ins` : "-"}
																</span>
															</div>
															<div className="flex items-center gap-1">
																<Building className="h-4 w-4" />
																<span>
																	{request.hostClub?.name || request.clubName || `ID: ${request.clubId || '?'}`}
																</span>
															</div>
														</div>
													</div>

													<div className="flex items-center gap-2 ml-4">
														{/* Show "Need Settle" button for completed events not yet settled */}
														{isCompleted && !settledEventIds.has(request.id) && (
															<Button
																size="sm"
																variant="default"
																className="h-8 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800"
															>
																<DollarSign className="h-3 w-3 mr-1" />
																Need Settle
															</Button>
														)}
														<Button size="sm" variant="outline" className="h-8 bg-transparent dark:border-slate-600 dark:hover:bg-slate-800">
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
							<div className="px-2 text-sm">
								Page {filteredRequests.length === 0 ? 0 : page + 1} / {Math.max(1, Math.ceil(filteredRequests.length / pageSize))}
							</div>
							<Button size="sm" variant="outline"
								onClick={() => setPage(p => Math.min(p + 1, Math.max(0, Math.ceil(filteredRequests.length / pageSize) - 1)))}
								disabled={(page + 1) * pageSize >= filteredRequests.length}>Next</Button>
							<Button size="sm" variant="outline"
								onClick={() => setPage(Math.max(0, Math.ceil(filteredRequests.length / pageSize) - 1))}
								disabled={(page + 1) * pageSize >= filteredRequests.length}>Last</Button>
							<select aria-label="Items per page" className="ml-2 rounded border px-2 py-1 text-sm" value={pageSize}
								onChange={(e) => { setPageSize(Number((e.target as HTMLSelectElement).value)); setPage(0) }}>
								<option value={10}>10</option>
								<option value={20}>20</option>
								<option value={50}>50</option>
							</select>
						</div>
					</div>

					{/* Calendar Modal */}
					<CalendarModal
						open={showCalendarModal}
						onOpenChange={setShowCalendarModal}
						events={allEvents}
						onEventClick={(event) => {
							setShowCalendarModal(false)
							router.push(`/uni-staff/events-req/${event.id}`)
						}}
					/>

					{/* Event Points Transaction History Modal */}
					<Dialog open={showEventPointsModal} onOpenChange={setShowEventPointsModal}>
						<DialogContent className="!w-[70vw] !max-w-[70vw] sm:!max-w-[70vw] max-h-[85vh] flex flex-col">
							<DialogHeader>
								<DialogTitle className="flex items-center gap-3">
									<History className="h-6 w-6" />
									University to Event Transaction History
								</DialogTitle>
							</DialogHeader>
							
							<div className="flex-1 overflow-y-auto space-y-4">
								{/* Filters */}
								<div className="flex gap-3 flex-wrap">
									<Select value={eventTransactionTypeFilter} onValueChange={(value) => {
										setEventTransactionTypeFilter(value);
										setEventCurrentPage(1);
									}}>
										<SelectTrigger className="w-[200px]">
											<SelectValue placeholder="Transaction type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Transaction Types</SelectItem>
											{uniqueEventTransactionTypes.map(type => (
												<SelectItem key={type} value={type}>
													{type.replace(/_/g, " ")}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									
									<Select value={eventDateFilter} onValueChange={(value) => {
										setEventDateFilter(value);
										setEventCurrentPage(1);
									}}>
										<SelectTrigger className="w-[180px]">
											<SelectValue placeholder="Filter by date" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Time</SelectItem>
											<SelectItem value="today">Today</SelectItem>
											<SelectItem value="week">This Week</SelectItem>
											<SelectItem value="month">This Month</SelectItem>
											<SelectItem value="year">This Year</SelectItem>
										</SelectContent>
									</Select>
									
									{(eventDateFilter !== "all" || eventTransactionTypeFilter !== "all") && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setEventDateFilter("all");
												setEventTransactionTypeFilter("all");
												setEventCurrentPage(1);
											}}
										>
											<X className="h-4 w-4 mr-1" />
											Clear
										</Button>
									)}
								</div>
								
								{/* Statistics */}
								{!eventTransactionsLoading && filteredEventTransactions.length > 0 && (
									<div className="flex gap-3">
										<div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
											<div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Total Distributed</div>
											<div className="text-xl font-bold text-green-700 dark:text-green-300">
												+{filteredEventTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} pts
											</div>
											<div className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">
												{filteredEventTransactions.length} transactions
											</div>
										</div>
									</div>
								)}
								
								{/* Table */}
								{eventTransactionsLoading ? (
									<div className="flex flex-col items-center justify-center py-12">
										<p className="text-muted-foreground">Loading event transaction history...</p>
									</div>
								) : filteredEventTransactions.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										{eventTransactions.length === 0 ? "No transactions found" : "No transactions match the selected filters"}
									</div>
								) : (
									<>
										<TooltipProvider>
											<div className="rounded-md border overflow-x-auto">
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead className="w-[80px]">#</TableHead>
															<TableHead>Amount</TableHead>
															<TableHead>Type</TableHead>
															<TableHead className="w-[20%]">Sender</TableHead>
															<TableHead className="w-[20%]">Receiver Event</TableHead>
															<TableHead className="w-[15%]">Description</TableHead>
															<TableHead className="w-[180px]">Date</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{paginatedEventTransactions.map((t, idx) => {
															const displayIndex = ((eventCurrentPage - 1) * eventPageSize) + idx + 1;
															return (
																<TableRow key={t.id}>
																	<TableCell className="font-medium">#{displayIndex}</TableCell>
																	<TableCell className="font-semibold text-green-600">+{t.amount.toLocaleString()} pts</TableCell>
																	<TableCell>
																		<Badge variant="outline" className={`text-xs font-medium ${getTransactionTypeBadgeColor(t.type)}`}>
																			{t.type.replace(/_/g, " ")}
																		</Badge>
																	</TableCell>
																	<TableCell className="font-medium text-slate-800 dark:text-blue-300">
																		{t.senderName || "—"}
																	</TableCell>
																	<TableCell className="font-medium text-slate-800 dark:text-purple-300">
																		{t.receiverName || "—"}
																	</TableCell>
																	<TableCell className="max-w-[200px]">
																		{t.description && t.description.length > 50 ? (
																			<Tooltip>
																				<TooltipTrigger asChild>
																					<div className="truncate cursor-help">
																						{t.description}
																					</div>
																				</TooltipTrigger>
																				<TooltipContent className="max-w-[400px] break-words" side="top">
																					<p className="whitespace-normal">{t.description}</p>
																				</TooltipContent>
																			</Tooltip>
																		) : (
																			<div className="truncate">{t.description || "—"}</div>
																		)}
																	</TableCell>
																	<TableCell className="text-sm text-muted-foreground whitespace-nowrap">
																		{formatTransactionDate(t.createdAt)}
																	</TableCell>
																</TableRow>
															);
														})}
													</TableBody>
												</Table>
											</div>
										</TooltipProvider>
										
										{/* Pagination */}
										{eventTotalPages > 1 && (
											<div className="flex items-center justify-between pt-4 border-t">
												<div className="text-sm text-muted-foreground">
													Showing {((eventCurrentPage - 1) * eventPageSize) + 1} to {Math.min(eventCurrentPage * eventPageSize, filteredEventTransactions.length)} of {filteredEventTransactions.length} transactions
												</div>
												<div className="flex items-center gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => setEventCurrentPage(prev => Math.max(1, prev - 1))}
														disabled={eventCurrentPage === 1}
													>
														<ChevronLeft className="h-4 w-4" />
													</Button>
													<div className="text-sm font-medium">
														Page {eventCurrentPage} of {eventTotalPages}
													</div>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setEventCurrentPage(prev => Math.min(eventTotalPages, prev + 1))}
														disabled={eventCurrentPage === eventTotalPages}
													>
														<ChevronRight className="h-4 w-4" />
													</Button>
												</div>
											</div>
										)}
									</>
								)}
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</AppShell>
		</ProtectedRoute>
	)
}
