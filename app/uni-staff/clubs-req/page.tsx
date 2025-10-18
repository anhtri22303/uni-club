"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Users, Calendar, Search, CheckCircle, XCircle, Clock, Eye, Plus } from "lucide-react"
import Link from "next/link"
import { getClubApplications, ClubApplication, putClubApplicationStatus } from "@/service/clubApplicationAPI"
import { postClubApplication } from "@/service/clubApplicationAPI"
import { Modal } from "@/components/modal"
import { useToast } from "@/hooks/use-toast"

// We'll fetch real club application data from the backend and map it to the
// UI data shape used previously.

type UiClubRequest = {
	id: string
	applicationId?: number
	clubName: string
	category: string
	description: string
	requestedBy: string
	requestedByEmail: string
	requestDate: string
	status: string
	expectedMembers?: number
	faculty?: string
	reason?: string
}

export default function UniStaffClubRequestsPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [categoryFilter, setCategoryFilter] = useState<string>("all")
	const [requests, setRequests] = useState<UiClubRequest[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
	const [newClubName, setNewClubName] = useState<string>("")
	const [newDescription, setNewDescription] = useState<string>("")
	const [newCategory, setNewCategory] = useState<string>("")
	const [newProposerReason, setNewProposerReason] = useState<string>("")
	const [activeTab, setActiveTab] = useState<string>("pending")
	const { toast } = useToast()

	useEffect(() => {
		let mounted = true
		setLoading(true)
		getClubApplications()
			.then((data: ClubApplication[]) => {
				if (!mounted) return
				// Map API shape to UI shape. The API doesn't include category, expectedMembers, etc.
				const mapped: UiClubRequest[] = data.map((d) => ({
					id: `req-${d.applicationId}`,
					clubName: d.clubName,
					category: "Unknown",
					description: d.description,
					requestedBy: d.submittedBy?.fullName ?? "Unknown",
					requestedByEmail: d.submittedBy?.email ?? "",
					requestDate: d.submittedAt,
					status: d.status,
				}))
				setRequests(mapped)
			})
			.catch((err) => {
				console.error(err)
				setError("Failed to load club applications")
			})
			.finally(() => mounted && setLoading(false))

		return () => {
			mounted = false
		}
	}, []) 

	async function handleSendNewApplication() {
			if (!newClubName.trim() || !newDescription.trim() || !newCategory.trim() || !newProposerReason.trim()) {
				toast({ title: 'Missing Information', description: 'Please fill in all fields.', variant: 'destructive' });
				return;
			}
			setLoading(true);
			setError(null);
			try {
				const created = await postClubApplication({
					clubName: newClubName,
					description: newDescription,
					category: parseInt(newCategory, 10),
					proposerReason: newProposerReason,
				});
				toast({ title: 'Application sent', description: `${created.clubName} submitted`, variant: 'success' });
				// reload list
				const data = await getClubApplications();
					const mapped: UiClubRequest[] = data.map((d) => ({
						id: `req-${d.applicationId}`,
						applicationId: d.applicationId,
						clubName: d.clubName,
						category: (d as any).category ?? "Unknown",
						description: d.description,
						requestedBy: d.submittedBy?.fullName ?? "Unknown",
						requestedByEmail: d.submittedBy?.email ?? "",
						requestDate: d.submittedAt,
						status: d.status,
					}));
				setRequests(mapped);
				setIsModalOpen(false);
				setNewClubName("");
				setNewDescription("");
				setNewCategory("");
				setNewProposerReason("");
			} catch (err) {
				console.error(err);
				setError('Failed to create application');
				toast({ title: 'Error', description: 'Failed to send application', variant: 'destructive' });
			} finally {
				setLoading(false);
			}
	}

	async function approveApplication(appId?: number) {
		if (!appId) return
		setLoading(true)
		try {
			const updated = await putClubApplicationStatus(appId, true, '')
			// Safe behavior: refetch the whole list from backend and update UI
			const data = await getClubApplications()
			const mapped: UiClubRequest[] = data.map((d) => ({
				id: `req-${d.applicationId}`,
				applicationId: d.applicationId,
				clubName: d.clubName,
				category: "Unknown",
				description: d.description,
				requestedBy: d.submittedBy?.fullName ?? "Unknown",
				requestedByEmail: d.submittedBy?.email ?? "",
				requestDate: d.submittedAt,
				status: d.status,
			}))
			setRequests(mapped)
			toast({ title: 'Application submitted', description: `Application ${updated.applicationId} set to ${updated.status}`, variant: 'success' })
		} catch (err) {
			console.error(err)
			toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
		} finally {
			setLoading(false)
		}
	}

	async function rejectApplication(appId?: number) {
		if (!appId) return
		setLoading(true)
		try {
			const updated = await putClubApplicationStatus(appId, false, 'Rejected by staff')
			// Safe behavior: refetch the whole list from backend and update UI
			const data = await getClubApplications()
			const mapped: UiClubRequest[] = data.map((d) => ({
				id: `req-${d.applicationId}`,
				applicationId: d.applicationId,
				clubName: d.clubName,
				category: "Unknown",
				description: d.description,
				requestedBy: d.submittedBy?.fullName ?? "Unknown",
				requestedByEmail: d.submittedBy?.email ?? "",
				requestDate: d.submittedAt,
				status: d.status,
			}))
			setRequests(mapped)
			toast({ title: 'Application rejected', description: `Application ${updated.applicationId} set to ${updated.status}`, variant: 'destructive' })
		} catch (err) {
			console.error(err)
			toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
		} finally {
			setLoading(false)
		}
	}

	const getFilteredRequests = (tabType: "pending" | "processed") => {
		return requests.filter((req) => {
			const matchSearch =
				req.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
				req.category.toLowerCase().includes(searchTerm.toLowerCase())

			const matchCategory = categoryFilter === "all" ? true : req.category === categoryFilter

			let matchStatus = false
			if (tabType === "pending") {
				matchStatus = req.status === "PENDING"
			} else {
				matchStatus = req.status === "SUBMITTED" || req.status === "REJECTED"
			}

			return matchSearch && matchStatus && matchCategory
		})
	}

	const pendingRequests = getFilteredRequests("pending")
	const processedRequests = getFilteredRequests("processed")

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
			case "SUBMITTED":
				return (
					<Badge
						variant="default"
						className="bg-green-100 text-green-700 border-green-300"
					>
						<CheckCircle className="h-3 w-3 mr-1" />
						Submitted
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
			default:
				return <Badge variant="outline">{status}</Badge>
		}
	}

	const pendingCount = requests.filter((req) => req.status === "PENDING").length
	const approvedCount = requests.filter((req) => req.status === "SUBMITTED").length
	const rejectedCount = requests.filter((req) => req.status === "REJECTED").length

	return (
		<ProtectedRoute allowedRoles={["uni_staff"]}>
			<AppShell>
				{/* Floating add button (always visible) */}
				<Button
					aria-label="Add club application"
					size="sm"
					variant="default"
					className="fixed top-4 right-4 z-50 h-10 w-10 rounded-full flex items-center justify-center"
					onClick={() => setIsModalOpen(true)}
				>
					<Plus className="h-5 w-5" />
				</Button>
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
								<Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Create Club Application">
									<div className="space-y-3">
										<label className="text-sm font-medium">Club Name</label>
										<Input value={newClubName} onChange={(e) => setNewClubName(e.target.value)} placeholder="Tri&Duc" />
										<label className="text-sm font-medium">Description</label>
										<Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description" />
										<label className="text-sm font-medium">Category</label>
										<Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category" />
										<label className="text-sm font-medium">Proposer Reason</label>
										<Input value={newProposerReason} onChange={(e) => setNewProposerReason(e.target.value)} placeholder="Why do you want to create this club?" />
										<div className="flex justify-end gap-2 pt-2">
											<Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
											<Button onClick={handleSendNewApplication}>Send</Button>
										</div>
									</div>
								</Modal>

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
									Submitted
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
											Successfully submitted
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
											Not submitted
										</p>
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
								placeholder="Search by club name or requester..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>

						<div className="flex items-center gap-3">
							<Select value={categoryFilter} onValueChange={setCategoryFilter}>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="All Categories" />
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

					{/* Tabs */}
					<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="pending" className="flex items-center gap-2">
								<Clock className="h-4 w-4" />
								Pending ({pendingRequests.length})
							</TabsTrigger>
							<TabsTrigger value="processed" className="flex items-center gap-2">
								<CheckCircle className="h-4 w-4" />
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
										{error}
									</CardContent>
								</Card>
							) : pendingRequests.length === 0 ? (
								<Card>
									<CardContent className="py-8 text-center text-muted-foreground">
										No pending club requests found
									</CardContent>
								</Card>
							) : (
								pendingRequests.map((request) => (
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
																{request.category}
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
															variant="default"
															className="h-8 w-8 p-0"
															onClick={(e) => {
																e.preventDefault()
																approveApplication(request.applicationId)
															}}
														>
															<CheckCircle className="h-4 w-4" />
														</Button>
														<Button
															size="sm"
															variant="destructive"
															className="h-8 w-8 p-0"
															onClick={(e) => {
																e.preventDefault()
																rejectApplication(request.applicationId)
															}}
														>
															<XCircle className="h-4 w-4" />
														</Button>
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
								))
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
										{error}
									</CardContent>
								</Card>
							) : processedRequests.length === 0 ? (
								<Card>
									<CardContent className="py-8 text-center text-muted-foreground">
										No processed club requests found
									</CardContent>
								</Card>
							) : (
								processedRequests.map((request) => (
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
																{request.category}
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
								))
							)}
						</TabsContent>
					</Tabs>
				</div>
			</AppShell>
		</ProtectedRoute>
	)
}
