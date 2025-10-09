"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Users, Calendar, Search, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export const clubRequests = [
	{
		id: "req-001",
		clubName: "AI & Machine Learning Society",
		category: "Technology",
		description:
			"A club dedicated to exploring artificial intelligence and machine learning technologies",
		requestedBy: "Nguyen Van A",
		requestedByEmail: "nguyenvana@university.edu",
		requestDate: "2024-01-15",
		status: "PENDING",
		expectedMembers: 25,
		faculty: "Computer Science",
		reason:
			"To provide students with hands-on experience in AI/ML technologies and foster innovation in the field",
	},
	{
		id: "req-002",
		clubName: "Sustainable Living Club",
		category: "Social",
		description: "Promoting environmental awareness and sustainable practices on campus",
		requestedBy: "Tran Thi B",
		requestedByEmail: "tranthib@university.edu",
		requestDate: "2024-01-12",
		status: "APPROVED",
		expectedMembers: 40,
		faculty: "Environmental Science",
		reason:
			"To create awareness about environmental issues and promote sustainable living practices among students",
	},
	{
		id: "req-003",
		clubName: "Digital Photography Club",
		category: "Arts",
		description: "For students passionate about photography and digital arts",
		requestedBy: "Le Van C",
		requestedByEmail: "levanc@university.edu",
		requestDate: "2024-01-10",
		status: "REJECTED",
		expectedMembers: 15,
		faculty: "Fine Arts",
		reason:
			"To provide a platform for photography enthusiasts to learn and showcase their work",
	},
	{
		id: "req-004",
		clubName: "Blockchain & Cryptocurrency Club",
		category: "Technology",
		description: "Exploring blockchain technology and cryptocurrency applications",
		requestedBy: "Pham Thi D",
		requestedByEmail: "phamthid@university.edu",
		requestDate: "2024-01-08",
		status: "PENDING",
		expectedMembers: 30,
		faculty: "Business",
		reason:
			"To educate students about blockchain technology and its real-world applications",
	},
	{
		id: "req-005",
		clubName: "Mental Health Awareness Club",
		category: "Social",
		description: "Supporting student mental health and wellness on campus",
		requestedBy: "Hoang Van E",
		requestedByEmail: "hoangvane@university.edu",
		requestDate: "2024-01-05",
		status: "APPROVED",
		expectedMembers: 50,
		faculty: "Psychology",
		reason:
			"To create a supportive community for mental health awareness and provide resources for students",
	},
]

export default function UniStaffClubRequestsPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState<string>("all")
	const [categoryFilter, setCategoryFilter] = useState<string>("all")

	const filteredRequests = clubRequests.filter((req) => {
		const matchSearch =
			req.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
			req.category.toLowerCase().includes(searchTerm.toLowerCase())

		const matchStatus = statusFilter === "all" ? true : req.status === statusFilter
		const matchCategory = categoryFilter === "all" ? true : req.category === categoryFilter

		return matchSearch && matchStatus && matchCategory
	})

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
			default:
				return <Badge variant="outline">{status}</Badge>
		}
	}

	const pendingCount = clubRequests.filter((req) => req.status === "PENDING").length
	const approvedCount = clubRequests.filter((req) => req.status === "APPROVED").length
	const rejectedCount = clubRequests.filter((req) => req.status === "REJECTED").length

	return (
		<ProtectedRoute allowedRoles={["uni_staff"]}>
			<AppShell>
				<div className="space-y-6">
					<div>
						<h1 className="text-3xl font-bold">Club Requests</h1>
						<p className="text-muted-foreground">
							Review and manage club registration requests
						</p>
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
											Successfully approved
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
											Not approved
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
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="All Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="PENDING">Pending</SelectItem>
									<SelectItem value="APPROVED">Approved</SelectItem>
									<SelectItem value="REJECTED">Rejected</SelectItem>
								</SelectContent>
							</Select>

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

					<div className="grid gap-4">
						{filteredRequests.length === 0 ? (
							<Card>
								<CardContent className="py-8 text-center text-muted-foreground">
									No club requests found
								</CardContent>
							</Card>
						) : (
							filteredRequests.map((request) => (
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
															<span>{request.expectedMembers} members</span>
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
													{request.status === "PENDING" && (
														<>
															<Button
																size="sm"
																variant="default"
																className="h-8 w-8 p-0"
															>
																<CheckCircle className="h-4 w-4" />
															</Button>
															<Button
																size="sm"
																variant="destructive"
																className="h-8 w-8 p-0"
															>
																<XCircle className="h-4 w-4" />
															</Button>
														</>
													)}
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
					</div>
				</div>
			</AppShell>
		</ProtectedRoute>
	)
}
