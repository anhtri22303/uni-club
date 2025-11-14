"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Users, Calendar, Search, CheckCircle, XCircle, Clock, Eye, Plus, CheckCheck, Filter } from "lucide-react"
import Link from "next/link"
// import { postClubApplication } from "@/service/clubApplicationAPI"
// import { Modal } from "@/components/modal"
// import { useToast } from "@/hooks/use-toast"
import { useClubApplications } from "@/hooks/use-query-hooks"
// import { useQueryClient } from "@tanstack/react-query"

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
	vision?: string
	proposerReason?: string
	reviewedBy?: {
		fullName: string
		email: string
	} | null
	rejectReason?: string | null
	reviewedAt?: string | null
}

export default function UniStaffClubRequestsPage() {
	const [searchTerm, setSearchTerm] = useState("")
	// const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
	// const [newClubName, setNewClubName] = useState<string>("")
	// const [newDescription, setNewDescription] = useState<string>("")
	// const [newMajor, setNewMajor] = useState<string>("")
	// const [newProposerReason, setNewProposerReason] = useState<string>("")
	const [activeTab, setActiveTab] = useState<string>("pending")
	// const [newVision, setNewVision] = useState<string>("")
	// Pagination states
	const [pendingPage, setPendingPage] = useState(0)
	const [processedPage, setProcessedPage] = useState(0)
	const [inProgressPage, setInProgressPage] = useState(0)
	const [pageSize, setPageSize] = useState(10)
	// Filter states
	const [majorFilter, setMajorFilter] = useState<string>("all")
	const [dateFromFilter, setDateFromFilter] = useState<string>("")
	const [dateToFilter, setDateToFilter] = useState<string>("")

	// const { toast } = useToast()
	// const queryClient = useQueryClient()
	// Use React Query hook to fetch club applications
	const { data: applications = [], isLoading: loading, error } = useClubApplications()
	// Map API shape to UI shape and sort by latest submittedAt
	const requests: UiClubRequest[] = applications
		.map((d: any) => ({
			id: `req-${d.applicationId}`,
			applicationId: d.applicationId,
			clubName: d.clubName,
			major: d.majorName ?? "Unknown",
			description: d.description,
			requestedBy: d.proposer?.fullName ?? "Unknown",
			requestedByEmail: d.submittedBy?.email ?? "",
			requestDate: d.submittedAt,
			status: d.status,
			expectedMembers: d.expectedMembers,
			vision: d.vision,
			proposerReason: d.proposerReason,
			reviewedBy: d.reviewedBy,
			rejectReason: d.rejectReason,
			reviewedAt: d.reviewedAt,
		}))
		.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())

	// async function handleSendNewApplication() {
	// 	if (!newClubName.trim() || !newDescription.trim() || !newMajor.trim() || !newProposerReason.trim() || !newVision.trim()) {
	// 		toast({ title: 'Missing Information', description: 'Please fill in all fields.', variant: 'destructive' });
	// 		return;
	// 	}
	// 	try {
	// 		const created = await postClubApplication({
	// 			clubName: newClubName,
	// 			description: newDescription,
	// 			vision: newVision,
	// 			majorId: parseInt(newMajor, 10),
	// 			proposerReason: newProposerReason,
	// 		});
	// 		toast({ title: 'Application sent', description: `${created.clubName} submitted`, variant: 'success' });

	// 		// Invalidate cache to refetch updated list
	// 		queryClient.invalidateQueries({ queryKey: ["club-applications"] });

	// 		// Reset form
	// 		setIsModalOpen(false);
	// 		setNewClubName("");
	// 		setNewDescription("");
	// 		setNewVision("");
	// 		setNewMajor("");
	// 		setNewProposerReason("");
	// 	} catch (err) {
	// 		console.error(err);
	// 		toast({ title: 'Error', description: 'Failed to send application', variant: 'destructive' });
	// 	}
	// }

	const getFilteredRequests = (tabType: "pending" | "in_progress" | "processed") => {
		return requests.filter((req) => {
			// Search filter
			const matchSearch =
				req.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
				req.major.toLowerCase().includes(searchTerm.toLowerCase())

			// Status filter
			let matchStatus = false
			if (tabType === "pending") {
				matchStatus = req.status === "PENDING"
			} else if (tabType === "in_progress") {
				matchStatus = req.status === "APPROVED"
			} else {
				matchStatus = req.status === "COMPLETE" || req.status === "REJECTED"
			}

			// Major filter
			const matchMajor = majorFilter === "all" || req.major === majorFilter

			// Date range filter
			let matchDateRange = true
			if (dateFromFilter || dateToFilter) {
				const reqDate = new Date(req.requestDate)
				if (dateFromFilter) {
					const fromDate = new Date(dateFromFilter)
					matchDateRange = matchDateRange && reqDate >= fromDate
				}
				if (dateToFilter) {
					const toDate = new Date(dateToFilter)
					toDate.setHours(23, 59, 59, 999) // Include the entire day
					matchDateRange = matchDateRange && reqDate <= toDate
				}
			}

			return matchSearch && matchStatus && matchMajor && matchDateRange
		})
	}

	// Get unique majors for filter dropdown
	const uniqueMajors = Array.from(new Set(requests.map(req => req.major))).sort()

	const pendingRequests = getFilteredRequests("pending")
	const inProgressRequests = getFilteredRequests("in_progress")
	const processedRequests = getFilteredRequests("processed")
	// Auto-adjust page when filtered data changes
	const [prevPendingLength, setPrevPendingLength] = useState(0)
	const [prevInProgressLength, setPrevInProgressLength] = useState(0)
	const [prevProcessedLength, setPrevProcessedLength] = useState(0)

	if (pendingRequests.length !== prevPendingLength) {
		setPrevPendingLength(pendingRequests.length)
		const lastPendingPage = Math.max(0, Math.ceil(pendingRequests.length / pageSize) - 1)
		if (pendingPage > lastPendingPage) setPendingPage(lastPendingPage)
	}
	if (inProgressRequests.length !== prevInProgressLength) {
		setPrevInProgressLength(inProgressRequests.length)
		const lastInProgressPage = Math.max(0, Math.ceil(inProgressRequests.length / pageSize) - 1)
		if (inProgressPage > lastInProgressPage) setInProgressPage(lastInProgressPage)
	}

	if (processedRequests.length !== prevProcessedLength) {
		setPrevProcessedLength(processedRequests.length)
		const lastProcessedPage = Math.max(0, Math.ceil(processedRequests.length / pageSize) - 1)
		if (processedPage > lastProcessedPage) setProcessedPage(lastProcessedPage)
	}

	// Paginate data
	const paginatedPending = (() => {
		const start = pendingPage * pageSize
		return pendingRequests.slice(start, start + pageSize)
	})()

	const paginatedInProgress = (() => {
		const start = inProgressPage * pageSize
		return inProgressRequests.slice(start, start + pageSize)
	})()

	const paginatedProcessed = (() => {
		const start = processedPage * pageSize
		return processedRequests.slice(start, start + pageSize)
	})()

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "PENDING":
				return (
					<Badge
						variant="outline"
						className="bg-yellow-50 text-yellow-700 border-yellow-300"
					>
						<Clock className="h-3 w-3 mr-1" />
						Pending
					</Badge>
				)
			case "APPROVED":
				return (
					<Badge
						variant="default"
						className="bg-green-100 text-green-700 border-green-300"
					>
						<CheckCircle className="h-3 w-3 mr-1" />
						Approved
					</Badge>
				)
			case "REJECTED":
				return (
					<Badge
						variant="destructive"
						className="bg-red-100 text-red-700 border-red-300"
					>
						<XCircle className="h-3 w-3 mr-1" />
						Rejected
					</Badge>
				)
			case "COMPLETE":
				return (
					<Badge
						variant="outline"
						className="bg-blue-50 text-blue-700 border-blue-300"
					>
						<CheckCheck className="h-3 w-3 mr-1" />
						Complete
					</Badge>
				)
			default:
				return <Badge variant="outline">{status}</Badge>
		}
	}

	const pendingCount = requests.filter((req) => req.status === "PENDING").length
	const approvedCount = requests.filter((req) => req.status === "APPROVED").length
	const rejectedCount = requests.filter((req) => req.status === "REJECTED").length
	const completedCount = requests.filter((req) => req.status === "COMPLETE").length

	return (
		<ProtectedRoute allowedRoles={["uni_staff"]}>
			<AppShell>
				{/* Floating add button (always visible) */}
				{/* <Button
					aria-label="Add club application"
					size="sm"
					variant="default"
					className="fixed top-4 right-4 z-50 h-10 w-10 rounded-full flex items-center justify-center"
					onClick={() => setIsModalOpen(true)}
				>
					<Plus className="h-5 w-5" />
				</Button> */}
				<div className="space-y-6">
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-3xl font-bold">Club Requests</h1>
						</div>
						<p className="text-muted-foreground">
							Review and manage club registration requests
						</p>
					</div>

					{/* Modal for creating new club application */}
					{/* <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Create Club Application">
						<div className="space-y-3">
							<label className="text-sm font-medium">Club Name</label>
							<Input value={newClubName} className="mt-2 border-slate-300" onChange={(e) => setNewClubName(e.target.value)} placeholder="Enter name of club" />
							<label className="text-sm font-medium">Description</label>
							<Input value={newDescription} className="mt-2 border-slate-300" onChange={(e) => setNewDescription(e.target.value)} placeholder="Enter description of club" />
							<label className="text-sm font-medium">Vision</label>
							<Input value={newVision} className="mt-2 border-slate-300" onChange={(e) => setNewVision(e.target.value)} placeholder="Enter vision of club" />
							<label className="text-sm font-medium">Major</label>
							<Input value={newMajor} className="mt-2 border-slate-300" onChange={(e) => setNewMajor(e.target.value)} placeholder="Enter major of club" />
							<label className="text-sm font-medium">Proposer Reason</label>
							<Input value={newProposerReason} className="mt-2 border-slate-300" onChange={(e) => setNewProposerReason(e.target.value)} placeholder="Why do you want to create this club?" />
							<div className="flex justify-end gap-2 pt-2">
								<Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
								<Button onClick={handleSendNewApplication}>Send</Button>
							</div>
						</div>
					</Modal> */}

					{/* Stats Cards */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
										<p className="text-xs text-yellow-600 dark:text-yellow-400">
											Awaiting review
										</p>
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
										<p className="text-xs text-green-600 dark:text-green-400">
											Awaiting account creation
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* THẺ MỚI CHO COMPLETE */}
						<Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
							<CardHeader className="pb-1 px-4 pt-3">
								<CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-300">
									Complete
								</CardTitle>
							</CardHeader>
							<CardContent className="pb-3 px-4">
								<div className="flex items-center gap-2">
									<div className="p-1.5 bg-blue-500 rounded-md">
										<CheckCheck className="h-4 w-4 text-white" />
									</div>
									<div>
										<div className="text-lg font-bold text-blue-900 dark:text-blue-100">
											{completedCount}
										</div>
										<p className="text-xs text-blue-600 dark:text-blue-400">
											Successfully processed
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
							<CardHeader className="pb-1 px-4 pt-3">
								<CardTitle className="text-xs font-medium text-red-700 dark:text-red-300">
									Rejected
								</CardTitle>
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
										<p className="text-xs text-red-600 dark:text-red-400">
											Not eligible
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Filters */}
					<Card className="border-muted">
						<CardHeader className="pb-3">
							<CardTitle className="text-base font-medium flex items-center gap-2">
								<Filter className="h-4 w-4" />
								Filters & Search
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex flex-col gap-3 md:flex-row md:items-center">
								<div className="flex items-center gap-2 flex-1 max-w-sm">
									<Search className="h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Search by club name or requester..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>

								<div className="flex items-center gap-2">
									<label htmlFor="major-filter" className="text-sm font-medium whitespace-nowrap">Major:</label>
									<select
										id="major-filter"
										className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
										value={majorFilter}
										onChange={(e) => {
											setMajorFilter(e.target.value)
											setPendingPage(0)
											setInProgressPage(0)
											setProcessedPage(0)
										}}
									>
										<option value="all">All Majors</option>
										{uniqueMajors.map(major => (
											<option key={major} value={major}>{major}</option>
										))}
									</select>
								</div>
							</div>

							<div className="flex flex-col gap-3 md:flex-row md:items-center">
								<div className="flex items-center gap-2">
									<label className="text-sm font-medium whitespace-nowrap">From:</label>
									<Input
										type="date"
										className="w-auto"
										value={dateFromFilter}
										onChange={(e) => {
											setDateFromFilter(e.target.value)
											setPendingPage(0)
											setInProgressPage(0)
											setProcessedPage(0)
										}}
									/>
								</div>

								<div className="flex items-center gap-2">
									<label className="text-sm font-medium whitespace-nowrap">To:</label>
									<Input
										type="date"
										className="w-auto"
										value={dateToFilter}
										onChange={(e) => {
											setDateToFilter(e.target.value)
											setPendingPage(0)
											setInProgressPage(0)
											setProcessedPage(0)
										}}
									/>
								</div>

								{(majorFilter !== "all" || dateFromFilter || dateToFilter) && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setMajorFilter("all")
											setDateFromFilter("")
											setDateToFilter("")
											setPendingPage(0)
											setInProgressPage(0)
											setProcessedPage(0)
										}}
									>
										Clear Filters
									</Button>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Tabs */}
					<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
						{/* <TabsList className="grid w-full grid-cols-2"> */}
						<TabsList className="grid w-full grid-cols-3 gap-3">
							<TabsTrigger value="pending" className="flex items-center gap-2">
								<Clock className="h-4 w-4" />
								Pending ({pendingRequests.length})
							</TabsTrigger>
							<TabsTrigger value="in_progress" className="flex items-center gap-2">
								<CheckCircle className="h-4 w-4" />
								In progress ({inProgressRequests.length})
							</TabsTrigger>
							<TabsTrigger value="processed" className="flex items-center gap-2">
								<CheckCheck className="h-4 w-4" />
								Processed ({processedRequests.length})
							</TabsTrigger>
						</TabsList>

						<TabsContent value="pending" className="space-y-4 mt-6">
							{loading ? (
								<Card>
									<CardContent className="py-8 text-center text-muted-foreground">
										Loading club applications...
									</CardContent>
								</Card>
							) : error ? (
								<Card>
									<CardContent className="py-8 text-center text-destructive">
										{String(error)}
									</CardContent>
								</Card>
							) : pendingRequests.length === 0 ? (
								<Card>
									<CardContent className="py-8 text-center text-muted-foreground">
										No pending club requests found
									</CardContent>
								</Card>
							) : (
								<>
									{paginatedPending.map((request) => (
										<Card
											key={request.id}
											className="hover:shadow-md transition-shadow cursor-pointer"
										>
											<Link href={`/uni-staff/clubs-req/${request.id}`}>
												<CardContent className="p-6">
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<div className="flex items-center gap-3 mb-2">
																<Building className="h-5 w-5 text-muted-foreground" />
																<h3 className="font-semibold text-lg">
																	{request.clubName}
																</h3>
																<Badge
																	variant="outline"
																	className="bg-gray-50 text-gray-600 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700"
																>
																	{request.major}
																</Badge>
																{getStatusBadge(request.status)}
															</div>

															<p className="text-muted-foreground mb-3 line-clamp-2">
																Description:  {request.description}
															</p>

															<div className="flex items-center gap-6 text-sm text-muted-foreground">
																{/* <div className="flex items-center gap-1">
																	<Users className="h-4 w-4" />
																	<span>{request.expectedMembers ?? "-"} members</span>
																</div> */}
																<div className="flex items-center gap-1">
																	<Calendar className="h-4 w-4" />
																	<span>
																		Submitted day: {new Date(request.requestDate).toLocaleDateString()}
																	</span>
																</div>
																<div>
																	<span>by {request.requestedBy}</span>
																</div>
															</div>
														</div>

														<div className="flex items-center gap-2 ml-4">

															<Button
																size="sm"
																variant="outline"
																className="h-8 bg-transparent"
															>
																<Eye className="h-3 w-3 mr-1" />
																View Details
															</Button>
														</div>
													</div>
												</CardContent>
											</Link>
										</Card>
									))}

									{/* Pagination controls for Pending */}
									<div className="flex items-center justify-between mt-4">
										<div className="text-sm text-muted-foreground">
											Showing {pendingRequests.length === 0 ? 0 : pendingPage * pageSize + 1} to {Math.min((pendingPage + 1) * pageSize, pendingRequests.length)} of {pendingRequests.length} requests
										</div>
										<div className="flex items-center gap-2">
											<Button size="sm" variant="outline" onClick={() => setPendingPage(0)} disabled={pendingPage === 0}>First</Button>
											<Button size="sm" variant="outline" onClick={() => setPendingPage(p => Math.max(0, p - 1))} disabled={pendingPage === 0}>Prev</Button>
											<div className="px-2 text-sm">Page {pendingRequests.length === 0 ? 0 : pendingPage + 1} / {Math.max(1, Math.ceil(pendingRequests.length / pageSize))}</div>
											<Button size="sm" variant="outline" onClick={() => setPendingPage(p => Math.min(p + 1, Math.max(0, Math.ceil(pendingRequests.length / pageSize) - 1)))} disabled={(pendingPage + 1) * pageSize >= pendingRequests.length}>Next</Button>
											<Button size="sm" variant="outline" onClick={() => setPendingPage(Math.max(0, Math.ceil(pendingRequests.length / pageSize) - 1))} disabled={(pendingPage + 1) * pageSize >= pendingRequests.length}>Last</Button>
											<select aria-label="Items per page" className="ml-2 rounded border px-2 py-1 text-sm" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPendingPage(0); setProcessedPage(0); setProcessedPage(0) }}>
												<option value={3}>3</option>
												<option value={6}>6</option>
												<option value={12}>12</option>
											</select>
										</div>
									</div>
								</>
							)}
						</TabsContent>

						<TabsContent value="in_progress" className="space-y-4 mt-6">
							{loading ? (
								<Card>
									<CardContent className="py-8 text-center text-muted-foreground">
										Loading club registration form...
									</CardContent>
								</Card>
							) : error ? (
								<Card>
									<CardContent className="py-8 text-center text-destructive">
										{String(error)}
									</CardContent>
								</Card>
							) : inProgressRequests.length === 0 ? (
								<Card>
									<CardContent className="py-8 text-center text-muted-foreground">
										No pending applications found
									</CardContent>
								</Card>
							) : (
								<>
									{paginatedInProgress.map((request) => (
										<Card
											key={request.id}
											className="hover:shadow-md transition-shadow cursor-pointer"
										>
											<Link href={`/uni-staff/clubs-req/${request.id}`}>
												<CardContent className="p-6">
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<div className="flex items-center gap-3 mb-2">
																<Building className="h-5 w-5 text-muted-foreground" />
																<h3 className="font-semibold text-lg">
																	{request.clubName}
																</h3>
																<Badge
																	variant="outline"
																	className="bg-gray-50 text-gray-600 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700"
																>
																	{request.major}
																</Badge>
																{getStatusBadge(request.status)}
															</div>

															<p className="text-muted-foreground mb-3 line-clamp-2">
																Description:  {request.description}
															</p>

															<div className="flex items-center gap-6 text-sm text-muted-foreground">
																<div className="flex items-center gap-1">
																	<Users className="h-4 w-4" />
																	<span>{request.expectedMembers ?? "-"} members</span>
																</div>
																<div className="flex items-center gap-1">
																	<Calendar className="h-4 w-4" />
																	<span>
																		{new Date(
																			request.requestDate
																		).toLocaleDateString()}
																	</span>
																</div>
																<div>
																	<span>by {request.requestedBy}</span>
																</div>
															</div>
														</div>

														<div className="flex items-center gap-2 ml-4">

															<Button
																size="sm"
																variant="outline"
																className="h-8 bg-transparent"
															>
																<Eye className="h-3 w-3 mr-1" />
																View Details
															</Button>
														</div>
													</div>
												</CardContent>
											</Link>
										</Card>
									))}

									{/* Điều khiển phân trang cho Đang xử lý */}
									<div className="flex items-center justify-between mt-4">
										<div className="text-sm text-muted-foreground">
											Hiển thị {inProgressRequests.length === 0 ? 0 : inProgressPage * pageSize + 1} đến {Math.min((inProgressPage + 1) * pageSize, inProgressRequests.length)} trên {inProgressRequests.length} đơn
										</div>
										<div className="flex items-center gap-2">
											<Button size="sm" variant="outline" onClick={() => setInProgressPage(0)} disabled={inProgressPage === 0}>Đầu</Button>
											<Button size="sm" variant="outline" onClick={() => setInProgressPage(p => Math.max(0, p - 1))} disabled={inProgressPage === 0}>Trước</Button>
											<div className="px-2 text-sm">Trang {inProgressRequests.length === 0 ? 0 : inProgressPage + 1} / {Math.max(1, Math.ceil(inProgressRequests.length / pageSize))}</div>
											<Button size="sm" variant="outline" onClick={() => setInProgressPage(p => Math.min(p + 1, Math.max(0, Math.ceil(inProgressRequests.length / pageSize) - 1)))} disabled={(inProgressPage + 1) * pageSize >= inProgressRequests.length}>Sau</Button>
											<Button size="sm" variant="outline" onClick={() => setInProgressPage(Math.max(0, Math.ceil(inProgressRequests.length / pageSize) - 1))} disabled={(inProgressPage + 1) * pageSize >= inProgressRequests.length}>Cuối</Button>
											<select aria-label="Số mục mỗi trang" className="ml-2 rounded border px-2 py-1 text-sm" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPendingPage(0); setProcessedPage(0); setInProgressPage(0) }}>
												<option value={3}>3</option>
												<option value={6}>6</option>
												<option value={12}>12</option>
											</select>
										</div>
									</div>
								</>
							)}
						</TabsContent>

						<TabsContent value="processed" className="space-y-4 mt-6">
							{loading ? (
								<Card>
									<CardContent className="py-8 text-center text-muted-foreground">
										Loading club applications...
									</CardContent>
								</Card>
							) : error ? (
								<Card>
									<CardContent className="py-8 text-center text-destructive">
										{String(error)}
									</CardContent>
								</Card>
							) : processedRequests.length === 0 ? (
								<Card>
									<CardContent className="py-8 text-center text-muted-foreground">
										No processed club requests found
									</CardContent>
								</Card>
							) : (
								<>
									{paginatedProcessed.map((request) => (
										<Card
											key={request.id}
											className="hover:shadow-md transition-shadow cursor-pointer"
										>
											<Link href={`/uni-staff/clubs-req/${request.id}`}>
												<CardContent className="p-6">
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<div className="flex items-center gap-3 mb-2">
																<Building className="h-5 w-5 text-muted-foreground" />
																<h3 className="font-semibold text-lg">
																	{request.clubName}
																</h3>
																<Badge variant="outline">
																	{request.major}
																</Badge>
																{getStatusBadge(request.status)}
															</div>

															<p className="text-muted-foreground mb-3 line-clamp-2">
																{request.description}
															</p>

															<div className="flex items-center gap-6 text-sm text-muted-foreground">
																<div className="flex items-center gap-1">
																	<Users className="h-4 w-4" />
																	<span>{request.expectedMembers ?? "-"} members</span>
																</div>
																<div className="flex items-center gap-1">
																	<Calendar className="h-4 w-4" />
																	<span>
																		{new Date(
																			request.requestDate
																		).toLocaleDateString()}
																	</span>
																</div>
																<div>
																	<span>by {request.requestedBy}</span>
																</div>
															</div>
														</div>

														<div className="flex items-center gap-2 ml-4">
															<Button
																size="sm"
																variant="outline"
																className="h-8 bg-transparent"
															>
																<Eye className="h-3 w-3 mr-1" />
																View Details
															</Button>
														</div>
													</div>
												</CardContent>
											</Link>
										</Card>
									))}

									{/* Pagination controls for Processed */}
									<div className="flex items-center justify-between mt-4">
										<div className="text-sm text-muted-foreground">
											Showing {processedRequests.length === 0 ? 0 : processedPage * pageSize + 1} to {Math.min((processedPage + 1) * pageSize, processedRequests.length)} of {processedRequests.length} requests
										</div>
										<div className="flex items-center gap-2">
											<Button size="sm" variant="outline" onClick={() => setProcessedPage(0)} disabled={processedPage === 0}>First</Button>
											<Button size="sm" variant="outline" onClick={() => setProcessedPage(p => Math.max(0, p - 1))} disabled={processedPage === 0}>Prev</Button>
											<div className="px-2 text-sm">Page {processedRequests.length === 0 ? 0 : processedPage + 1} / {Math.max(1, Math.ceil(processedRequests.length / pageSize))}</div>
											<Button size="sm" variant="outline" onClick={() => setProcessedPage(p => Math.min(p + 1, Math.max(0, Math.ceil(processedRequests.length / pageSize) - 1)))} disabled={(processedPage + 1) * pageSize >= processedRequests.length}>Next</Button>
											<Button size="sm" variant="outline" onClick={() => setProcessedPage(Math.max(0, Math.ceil(processedRequests.length / pageSize) - 1))} disabled={(processedPage + 1) * pageSize >= processedRequests.length}>Last</Button>
											<select aria-label="Items per page" className="ml-2 rounded border px-2 py-1 text-sm" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPendingPage(0); setProcessedPage(0) }}>
												<option value={3}>3</option>
												<option value={6}>6</option>
												<option value={12}>12</option>
											</select>
										</div>
									</div>
								</>
							)}
						</TabsContent>
					</Tabs>
				</div>
			</AppShell>
		</ProtectedRoute>
	)
}
