"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Gift, Package, ChevronLeft, ChevronRight, Layers } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import { useClubs, useProducts } from "@/hooks/use-query-hooks"
import { Product } from "@/service/productApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { safeLocalStorage } from "@/lib/browser-utils"
// ========== Minimal Pager ==========
const MinimalPager = ({
	current,
	total,
	onPrev,
	onNext,
}: {
	current: number
	total: number
	onPrev: () => void
	onNext: () => void
}) =>
	total > 1 ? (
		<div className="flex items-center justify-center gap-3 mt-4">
			<Button
				variant="outline"
				size="sm"
				className="h-8 w-8 p-0"
				onClick={onPrev}
				disabled={current === 1}
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>
			<div className="min-w-[2rem] text-center text-sm font-medium">
				{current}
			</div>
			<Button
				variant="outline"
				size="sm"
				className="h-8 w-8 p-0"
				onClick={onNext}
				disabled={current === total}
			>
				<ChevronRight className="h-4 w-4" />
			</Button>
		</div>
	) : null

// ========== COMPONENT ==========
export default function MemberGiftPage() {
	const [searchTerm, setSearchTerm] = useState("")
	// ✅ MỚI: Thêm state cho logic chọn club
	const [userClubIds, setUserClubIds] = useState<number[]>([])
	const [userClubsDetails, setUserClubsDetails] = useState<any[]>([])
	const [selectedClubId, setSelectedClubId] = useState<string | null>(null) // Bắt đầu là null

	// ✅ USE REACT QUERY for products
	const { data: products = [], isLoading: loading } = useProducts({ page: 0, size: 70, sort: "name" })

	// ✅ MỚI: Fetch all clubs để lấy tên
	const { data: clubsData = [] } = useClubs()

	// ✅ MỚI: Lấy club IDs của user từ localStorage
	useEffect(() => {
		try {
			const saved = safeLocalStorage.getItem("uniclub-auth")
			if (saved) {
				const parsed = JSON.parse(saved)
				let clubIdNumbers: number[] = []
				if (parsed.clubIds && Array.isArray(parsed.clubIds)) {
					clubIdNumbers = parsed.clubIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
				} else if (parsed.clubId) {
					clubIdNumbers = [Number(parsed.clubId)]
				}
				setUserClubIds(clubIdNumbers)
			}
		} catch (error) {
			console.error("Failed to get clubIds from localStorage:", error)
		}
	}, []) // Chạy 1 lần

	// ✅ MỚI: Lấy chi tiết club cho dropdown VÀ set default
	useEffect(() => {
		if (userClubIds.length > 0 && clubsData.length > 0) {
			// Dùng .map() trên `userClubIds` để giữ đúng thứ tự
			const details = userClubIds
				.map((id) => clubsData.find((club: any) => club.id === id))
				.filter(Boolean) // Loại bỏ (filter out) bất kỳ club nào không tìm thấy

			setUserClubsDetails(details as any[])

			// Tự động chọn club đầu tiên nếu chưa có gì được chọn
			if (details.length > 0 && selectedClubId === null) {
				setSelectedClubId(String(details[0].id))
			}
		}
	}, [userClubIds, clubsData]) // Chạy khi data sẵn sàng

	// ✅ CẬP NHẬT: Logic lọc sản phẩm
	const filteredProducts = products.filter((p) => {
		// Lọc 1: Chỉ hiển thị sản phẩm từ các club của user
		if (!userClubIds.includes(p.clubId)) {
			return false
		}

		// Lọc 2: Nếu chưa chọn club (đang tải), không hiển thị gì
		if (!selectedClubId) {
			return false
		}

		// Lọc 3: Lọc theo club ID đã chọn
		if (String(p.clubId) !== selectedClubId) {
			return false
		}

		// Lọc 4: Lọc theo search term
		const searchLower = searchTerm.toLowerCase()
		if (searchTerm && !p.name.toLowerCase().includes(searchLower) && !p.description.toLowerCase().includes(searchLower)) {
			return false
		}

		return true // Nếu qua hết các filter
	})
	const {
		currentPage,
		totalPages,
		setCurrentPage,
		paginatedData: paginatedProducts,
	} = usePagination({ data: filteredProducts, initialPageSize: 9 })

	return (
		<ProtectedRoute allowedRoles={["student"]}>
			<AppShell>
				<div className="space-y-6">
					<div>
						<h1 className="text-3xl font-bold">Gift Products</h1>
						{/* ✅ CẬP NHẬT: Thêm thông tin club */}
						<p className="text-muted-foreground">
							Browse and redeem products from your clubs
							{userClubIds.length > 0 && (
								<span className="text-xs text-muted-foreground/70 ml-2">
									(Viewing for club{userClubIds.length > 1 ? "s" : ""} {userClubIds.join(", ")})
								</span>
							)}
						</p>
					</div>

					{/* ✅ MỚI: Thêm Flex container cho Input và Select */}
					<div className="flex flex-wrap gap-4">
						<Input
							placeholder="Search products..."
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value)
								setCurrentPage(1) // Reset page
							}}
							className="max-w-sm flex-1 min-w-[200px]"
						/>

						{/* ✅ MỚI: Dropdown chọn Club */}
						{userClubIds.length > 0 && (
							<Select
								value={selectedClubId || ""} // Xử lý giá trị null
								onValueChange={(value) => {
									setSelectedClubId(value)
									setCurrentPage(1) // Reset về trang 1 khi đổi filter
								}}
							>
								<SelectTrigger className="w-full sm:w-[240px]">
									<div className="flex items-center gap-2">
										<Layers className="h-4 w-4 text-muted-foreground" />
										<SelectValue placeholder="Select a club" />
									</div>
								</SelectTrigger>
								<SelectContent>
									{/* Không có "All My Clubs" */}
									{userClubsDetails.map((club) => (
										<SelectItem key={club.id} value={String(club.id)}>
											{club.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{/* ✅ CẬP NHẬT: Logic hiển thị loading/empty */}
						{loading ? (
							<div className="col-span-full text-center py-12">
								<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
								<p className="text-muted-foreground">Loading products...</p>
							</div>
						) : userClubIds.length === 0 ? (
							<div className="col-span-full text-center py-12">
								<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-semibold mb-2">No club membership</h3>
								<p className="text-muted-foreground">You must join a club to see its products.</p>
							</div>
						) : !selectedClubId ? (
							<div className="col-span-full text-center py-12">
								<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
								<p className="text-muted-foreground">Loading club products...</p>
							</div>
						) : paginatedProducts.length === 0 ? (
							<div className="col-span-full text-center py-12">
								<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									No products found
								</h3>
								<p className="text-muted-foreground">
									{searchTerm ? "Try adjusting your search terms" : "This club has no products available."}
								</p>
							</div>
						) : (
							paginatedProducts.map((p) => (
								<Card
									key={p.id}
									className="transition-all duration-200 hover:shadow-md flex flex-col h-full relative overflow-hidden"
								>
									<CardHeader className="pb-2">
										<div className="h-28 md:h-32 w-full relative mb-2 overflow-hidden rounded-lg bg-muted">
											<img
												src="/placeholder.svg" // Sẽ thay bằng p.imageUrl sau
												alt={p.name}
												className="object-cover w-full h-full"
											/>
										</div>

										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<CardTitle className="text-sm truncate">
													{p.name}
												</CardTitle>
												<CardDescription className="mt-1 text-xs line-clamp-2">
													{p.description}
												</CardDescription>
											</div>
											<Badge
												variant="outline"
												className="capitalize text-[10px] max-w-[6rem] truncate"
											>
												{/* ✅ Tốt hơn: Hiển thị tên club thay vì ID */}
												{userClubsDetails.find(c => c.id === p.clubId)?.name || `Club ID: ${p.clubId}`}
											</Badge>
										</div>
									</CardHeader>

									<CardContent className="pt-2 flex flex-col gap-2 grow">
										<div className="flex items-center justify-between text-xs">
											<span className="font-semibold">
												{p.pricePoints} pts
											</span>
											<span className="text-muted-foreground">
												Stock: {p.stockQuantity}
											</span>
										</div>

										<div className="mt-auto">
											<Button
												className="w-full bg-transparent"
												variant="outline"
												size="sm"
												disabled={p.stockQuantity === 0}
											>
												<Gift className="h-3 w-3 mr-2" />
												{p.stockQuantity === 0 ? "Out of Stock" : "Redeem"}
											</Button>
										</div>
									</CardContent>
								</Card>
							))
						)}
					</div>

					<MinimalPager
						current={currentPage}
						total={totalPages}
						onPrev={() => setCurrentPage(Math.max(1, currentPage - 1))}
						onNext={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
					/>
				</div>
			</AppShell>
		</ProtectedRoute>
	)
}
