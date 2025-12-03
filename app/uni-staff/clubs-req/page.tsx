"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Building, Users, Calendar, Search, CheckCircle, XCircle, Clock, Eye, Filter, X, CheckCheck, Loader2, Info } from "lucide-react"
import Link from "next/link"
import { useClubApplications } from "@/hooks/use-query-hooks"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Type definition (Giữ nguyên từ code cũ của bạn)
type UiClubRequest = {
	id: string
	applicationId?: number
	clubName: string
	major: string
	description: string
	requestedBy: string
	requestedByEmail: string
	requestDate: string
	status: string
	expectedMembers?: number
}

export default function UniStaffClubRequestsPage() {
	// --- STATE QUẢN LÝ ---
	const [searchTerm, setSearchTerm] = useState("")
	const [activeTab, setActiveTab] = useState<"PENDING" | "IN_PROGRESS" | "PROCESSED">("PENDING")

	// Filter states
	const [majorFilter, setMajorFilter] = useState<string>("all")
	const [dateFromFilter, setDateFromFilter] = useState<string>("")
	const [dateToFilter, setDateToFilter] = useState<string>("")

	// Pagination
	const [page, setPage] = useState(0)
	const [pageSize, setPageSize] = useState(6) // Đồng bộ size với trang points

	// Fetch Data
	const { data: applications = [], isLoading: loading, error } = useClubApplications()

	// --- DATA MAPPING & PROCESSING ---
	const requests: UiClubRequest[] = useMemo(() => {
		return applications.map((d: any) => ({
			id: `req-${d.applicationId}`,
			applicationId: d.applicationId,
			clubName: d.clubName,
			major: d.majorName ?? "Unknown",
			description: d.description,
			requestedBy: d.proposer?.fullName ?? "Unknown",
			requestedByEmail: d.proposer?.email ?? "",
			requestDate: d.submittedAt,
			status: d.status,
			expectedMembers: d.expectedMembers,
		})).sort((a: any, b: any) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
	}, [applications])

	// Get unique majors for filter
	const uniqueMajors = useMemo(() => Array.from(new Set(requests.map(req => req.major))).sort(), [requests])

	// --- LOGIC FILTER (Gộp chung logic filter của các tab) ---
	const filteredRequests = useMemo(() => {
		return requests.filter((req) => {
			// 1. Filter by Tab Status
			let matchTab = false
			if (activeTab === "PENDING") {
				matchTab = req.status === "PENDING"
			} else if (activeTab === "IN_PROGRESS") {
				matchTab = req.status === "APPROVED" // Giả sử APPROVED là đang xử lý tiếp
			} else { // PROCESSED
				matchTab = req.status === "COMPLETED" || req.status === "REJECTED"
			}

			// 2. Filter by Search
			const q = searchTerm.toLowerCase()
			const matchSearch =
				q === "" ||
				req.clubName.toLowerCase().includes(q) ||
				req.requestedBy.toLowerCase().includes(q) ||
				req.major.toLowerCase().includes(q)

			// 3. Filter by Major
			const matchMajor = majorFilter === "all" || req.major === majorFilter

			// 4. Filter by Date
			let matchDateRange = true
			if (dateFromFilter || dateToFilter) {
				const reqDate = new Date(req.requestDate)
				if (dateFromFilter) {
					matchDateRange = matchDateRange && reqDate >= new Date(dateFromFilter)
				}
				if (dateToFilter) {
					const toDate = new Date(dateToFilter)
					toDate.setHours(23, 59, 59, 999)
					matchDateRange = matchDateRange && reqDate <= toDate
				}
			}

			return matchTab && matchSearch && matchMajor && matchDateRange
		})
	}, [requests, activeTab, searchTerm, majorFilter, dateFromFilter, dateToFilter])

	// Reset pagination when filters change
	useEffect(() => {
		setPage(0)
	}, [activeTab, searchTerm, majorFilter, dateFromFilter, dateToFilter])

	const paginatedRequests = filteredRequests.slice(page * pageSize, (page + 1) * pageSize)

	// --- STATS CALCULATION ---
	const pendingCount = requests.filter((req) => req.status === "PENDING").length
	const inProgressCount = requests.filter((req) => req.status === "APPROVED").length
	// const processedCount = requests.filter((req) => req.status === "COMPLETED" || req.status === "REJECTED").length
	// Tách riêng số lượng Completed và Rejected
	const completedCount = requests.filter((req) => req.status === "COMPLETED").length
	const rejectedCount = requests.filter((req) => req.status === "REJECTED").length
	// Tổng số đã xử lý
	const processedCount = completedCount + rejectedCount

	// --- HELPER UI ---
	const getStatusBadge = (status: string) => {
		switch (status) {
			case "PENDING":
				return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
			case "APPROVED":
				return <Badge variant="default" className="bg-blue-600 border-blue-600"><CheckCircle className="w-3 h-3 mr-1" />In Progress</Badge>
			case "COMPLETED":
				return <Badge variant="default" className="bg-green-600 border-green-600"><CheckCheck className="w-3 h-3 mr-1" />Completed</Badge>
			case "REJECTED":
				return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
			default: return <Badge variant="outline">{status}</Badge>
		}
	}

	const clearFilters = () => {
		setSearchTerm("")
		setMajorFilter("all")
		setDateFromFilter("")
		setDateToFilter("")
	}

	const hasActiveFilters = searchTerm || majorFilter !== "all" || dateFromFilter || dateToFilter

	return (
		<ProtectedRoute allowedRoles={["uni_staff"]}>
			<AppShell>
				<div className="space-y-6">
					{/* --- HEADER --- */}
					<div>
						<h1 className="text-3xl font-bold flex items-center gap-3">
							Club Requests
						</h1>
						<p className="text-muted-foreground">
							Review and manage club registration applications
						</p>
					</div>

					{/* --- STATS CARDS (Style mới giống points-req) --- */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* Pending */}
						<Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
							<CardHeader className="pb-3 px-4 pt-3">
								<CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending</CardTitle>
							</CardHeader>
							<CardContent className="pb-3 px-4 flex items-center gap-2">
								<div className="p-1.5 bg-yellow-500 rounded-md"><Clock className="h-5 w-5 text-white" /></div>
								<div>
									<div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{pendingCount}</div>
									<p className="text-sm text-yellow-600">Awaiting review</p>
								</div>
							</CardContent>
						</Card>

						{/* In Progress */}
						<Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
							<CardHeader className="pb-3 px-4 pt-3">
								<CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">In Progress</CardTitle>
							</CardHeader>
							<CardContent className="pb-3 px-4 flex items-center gap-2">
								<div className="p-1.5 bg-blue-500 rounded-md"><CheckCircle className="h-5 w-5 text-white" /></div>
								<div>
									<div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{inProgressCount}</div>
									<p className="text-sm text-blue-600">Approved & Processing</p>
								</div>
							</CardContent>
						</Card>

						{/* Processed */}
						{/* <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
							<CardHeader className="pb-3 px-4 pt-3">
								<CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Processed</CardTitle>
							</CardHeader>
							<CardContent className="pb-3 px-4 flex items-center gap-2">
								<div className="p-1.5 bg-green-600 rounded-md"><CheckCheck className="h-5 w-5 text-white" /></div>
								<div>
									<div className="text-2xl font-bold text-green-900 dark:text-green-100">{processedCount}</div>
									<p className="text-sm text-green-600">Completed or Rejected</p>
								</div>
							</CardContent>
						</Card> */}
						{/* Processed - CẬP NHẬT MỚI */}
						<Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
							<CardHeader className="pb-2 px-4 pt-3">
								<CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Processed</CardTitle>
							</CardHeader>
							<CardContent className="pb-3 px-4">
								{/* Phần tổng số (Total) */}
								<div className="flex items-center gap-2 mb-3">
									<div className="p-1.5 bg-green-600 rounded-md">
										<CheckCheck className="h-5 w-5 text-white" />
									</div>
									<div>
										<div className="text-2xl font-bold text-green-900 dark:text-green-100">{processedCount}</div>
										<p className="text-sm text-green-600">Total Finalized</p>
									</div>
								</div>

								{/* Phần chi tiết (Breakdown: Approved vs Rejected) */}
								<div className="flex items-center justify-between pt-2 border-t border-green-200 dark:border-green-800/30">
									<div className="flex items-center gap-2" title="Approved requests">
										<div className="h-2 w-2 rounded-full bg-green-500"></div>
										<span className="text-sm font-bold text-green-800 dark:text-green-200">{completedCount}</span>
										<span className="text-xs text-green-700 dark:text-green-300">Approved</span>
									</div>

									<div className="h-4 w-px bg-green-300 dark:bg-green-700"></div>

									<div className="flex items-center gap-2" title="Rejected requests">
										<div className="h-2 w-2 rounded-full bg-red-500"></div>
										<span className="text-sm font-bold text-red-700 dark:text-red-300">{rejectedCount}</span>
										<span className="text-xs text-red-600 dark:text-red-300">Rejected</span>
									</div>
								</div>
							</CardContent>
						</Card>

					</div>

					{/* --- TABS (Style mới) --- */}
					<div className="flex gap-3 border-b-2 border-gray-200 dark:border-gray-700 overflow-x-auto">
						<Button
							variant={activeTab === "PENDING" ? "default" : "ghost"}
							size="lg"
							className={`flex-1 min-w-[150px] rounded-b-none py-6 text-base font-semibold transition-all dark:bg-gray-800 bg-white ${activeTab === "PENDING"
								? "border-b-4 border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
								: "border-b-4 border-transparent hover:bg-gray-100"
								}`}
							onClick={() => setActiveTab("PENDING")}
						>
							<Clock className="h-5 w-5 mr-2" /> Pending ({pendingCount})
						</Button>
						<Button
							variant={activeTab === "IN_PROGRESS" ? "default" : "ghost"}
							size="lg"
							className={`flex-1 min-w-[150px] rounded-b-none py-6 text-base font-semibold transition-all dark:bg-gray-800 bg-white ${activeTab === "IN_PROGRESS"
								? "border-b-4 border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100"
								: "border-b-4 border-transparent hover:bg-gray-100"
								}`}
							onClick={() => setActiveTab("IN_PROGRESS")}
						>
							<CheckCircle className="h-5 w-5 mr-2" /> In Progress ({inProgressCount})
						</Button>
						<Button
							variant={activeTab === "PROCESSED" ? "default" : "ghost"}
							size="lg"
							className={`flex-1 min-w-[150px] rounded-b-none py-6 text-base font-semibold transition-all dark:bg-gray-800 bg-white ${activeTab === "PROCESSED"
								? "border-b-4 border-green-500 bg-green-50 text-green-700 hover:bg-green-100"
								: "border-b-4 border-transparent hover:bg-gray-100"
								}`}
							onClick={() => setActiveTab("PROCESSED")}
						>
							<CheckCheck className="h-5 w-5 mr-2" /> Processed ({processedCount})
						</Button>
					</div>

					{/* --- FILTERS (Compact Style) --- */}
					<div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
						<div className="flex flex-1 flex-col md:flex-row gap-2 w-full">

							{/* 1. Search Input Container */}
							<div className="relative w-full md:max-w-xs">
								<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

								<Input
									placeholder="Search club, requester..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									// THÊM: h-10 để bằng chiều cao với select
									className="pl-9 pr-9 h-10 bg-white dark:bg-gray-800 border-slate-300"
								/>

								{/* Nút Clear trong Search */}
								{searchTerm && (
									<div className="absolute right-1 top-0 bottom-0 flex items-center justify-center">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setSearchTerm("")}
											className="h-7 w-7 rounded-full"
										>
											<X className="h-4 w-4 text-muted-foreground" />
										</Button>
									</div>
								)}
							</div>

							{/* 2. Major Select */}
							<div className="w-full md:w-[200px]">
								<Select value={majorFilter} onValueChange={setMajorFilter}>
									<SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-slate-300 w-full">
										<SelectValue placeholder="Select Major" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Majors</SelectItem>
										{uniqueMajors.map((m) => (
											<SelectItem key={m} value={m}>
												{m}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* 3. Date Inputs */}
							<Input
								type="date"
								value={dateFromFilter}
								onChange={(e) => setDateFromFilter(e.target.value)}
								// THÊM: h-10
								className="w-full md:w-auto h-10 bg-white dark:bg-gray-800 border-slate-300"
							/>

							<span className="self-center hidden md:inline text-muted-foreground">-</span>

							<Input
								type="date"
								value={dateToFilter}
								onChange={(e) => setDateToFilter(e.target.value)}
								// THÊM: h-10
								className="w-full md:w-auto h-10 bg-white dark:bg-gray-800 border-slate-300"
							/>

							{/* 4. Clear Filter Button (Nút X ngoài cùng) */}
							{hasActiveFilters && (
								<Button
									variant="outline"
									// LƯU Ý: Đã xóa thuộc tính size="icon"
									onClick={clearFilters}
									title="Clear filters"
									// Thêm px-4 để có lề 2 bên, gap-2 để icon cách chữ ra
									className="h-10 px-4 shrink-0 flex items-center gap-2 border-slate-300 bg-white dark:bg-gray-800"
								>
									<X className="h-4 w-4" />
									<span>Clear filters</span>
								</Button>
							)}
						</div>
					</div>

					{/* --- LIST ITEMS --- */}
					<div className="grid gap-4">
						{loading ? (
							<Card><CardContent className="py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading applications...</CardContent></Card>
						) : error ? (
							<Card><CardContent className="py-12 text-center text-destructive">Error: {String(error)}</CardContent></Card>
						) : filteredRequests.length === 0 ? (
							<Card><CardContent className="py-12 text-center text-muted-foreground"><Info className="h-8 w-8 mx-auto mb-2" />No applications found matching your criteria.</CardContent></Card>
						) : (
							paginatedRequests.map((req) => {
								// Logic border màu
								let borderClass = ""
								if (req.status === "COMPLETED") borderClass = "border-l-4 border-l-green-500"
								else if (req.status === "APPROVED") borderClass = "border-l-4 border-l-blue-500"
								else if (req.status === "REJECTED") borderClass = "border-l-4 border-l-red-500 opacity-70"
								else borderClass = "border-l-4 border-l-yellow-500"

								return (
									<Card key={req.id} className={`hover:shadow-md transition-shadow group ${borderClass}`}>
										<CardContent className="p-6">
											<div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
												<div className="flex-1 space-y-3">
													{/* Header Line */}
													<div className="flex flex-wrap items-center gap-3">
														<div className="p-2 bg-muted rounded-full">
															<Building className="h-5 w-5 text-foreground" />
														</div>
														<h3 className="font-bold text-lg text-primary">{req.clubName}</h3>
														<Badge variant="outline" className="font-normal">{req.major}</Badge>
														{getStatusBadge(req.status)}
													</div>

													{/* Description */}
													<p className="text-muted-foreground line-clamp-2 text-sm">
														{req.description}
													</p>

													{/* Meta Info Row */}
													<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
														<div className="flex items-center gap-1.5">
															<Users className="h-4 w-4" />
															<span>{req.expectedMembers ?? "-"} members</span>
														</div>
														<div className="w-px h-3 bg-gray-300 hidden md:block"></div>
														<div className="flex items-center gap-1.5">
															<Calendar className="h-4 w-4" />
															<span>{new Date(req.requestDate).toLocaleDateString()}</span>
														</div>
														<div className="w-px h-3 bg-gray-300 hidden md:block"></div>
														<div className="flex items-center gap-1.5">
															<span className="font-medium text-foreground">Proposer:</span>
															<span>{req.requestedBy}</span>
														</div>
													</div>
												</div>

												{/* Action Button */}
												<div className="flex items-center self-start md:self-center">
													<Link href={`/uni-staff/clubs-req/${req.applicationId}`}>
														<Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
															<Eye className="h-4 w-4 mr-2" />
															View Details
														</Button>
													</Link>
												</div>
											</div>
										</CardContent>
									</Card>
								)
							})
						)}
					</div>

					{/* --- PAGINATION (Dùng chung logic cho tất cả Tabs) --- */}
					<div className="flex items-center justify-between mt-2">
						<div className="text-sm text-muted-foreground">
							Showing {filteredRequests.length === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredRequests.length)} of {filteredRequests.length} applications
						</div>
						<div className="flex items-center gap-2">
							<Button size="sm" variant="outline" onClick={() => setPage(0)} disabled={page === 0}>First</Button>
							<Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
							<div className="px-2 text-sm hidden md:block">
								Page {filteredRequests.length === 0 ? 0 : page + 1} / {Math.max(1, Math.ceil(filteredRequests.length / pageSize))}
							</div>
							<Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(p + 1, Math.max(0, Math.ceil(filteredRequests.length / pageSize) - 1)))} disabled={(page + 1) * pageSize >= filteredRequests.length}>Next</Button>
							<Button size="sm" variant="outline" onClick={() => setPage(Math.max(0, Math.ceil(filteredRequests.length / pageSize) - 1))} disabled={(page + 1) * pageSize >= filteredRequests.length}>Last</Button>

							<select
								aria-label="Items per page"
								className="ml-2 rounded border px-2 py-1 text-sm bg-background"
								value={pageSize}
								onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
							>
								<option value={6}>6</option>
								<option value={10}>10</option>
								<option value={20}>20</option>
							</select>
						</div>
					</div>

				</div>
			</AppShell>
		</ProtectedRoute>
	)
}