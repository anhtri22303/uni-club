"use client"

import { useEffect, useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Gift, Package, ChevronLeft, ChevronRight, Layers, Loader2, Eye, WalletCards } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import { useClubs, useProductsByClubId, useProfile, queryKeys } from "@/hooks/use-query-hooks"
import { Product } from "@/service/productApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { safeLocalStorage } from "@/lib/browser-utils"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { redeemClubProduct, redeemEventProduct, RedeemPayload } from "@/service/redeemApi"
import { useRouter, useSearchParams } from "next/navigation"
import { ApiMembership } from "@/service/membershipApi"

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
	const { toast } = useToast()
	const router = useRouter()
	const searchParams = useSearchParams()
	const clubIdFromQuery = searchParams.get('clubId') // Lấy clubId từ URL
	// ✅ MỚI: Thêm state cho logic chọn club
	const [userClubIds, setUserClubIds] = useState<number[]>([])
	const [userClubsDetails, setUserClubsDetails] = useState<any[]>([])
	const [selectedClubId, setSelectedClubId] = useState<string | null>(null)// Bắt đầu là null
	const [redeemingProductId, setRedeemingProductId] = useState<number | null>(null)
	const queryClient = useQueryClient()
	// const [wallets, setWallets] = useState<any[]>([]) // Dùng 'any[]' hoặc import 'MembershipWallet'
	// const { data: profile, isLoading: profileLoading } = useProfile(true)
	const { data: profile, isLoading: profileLoading } = useProfile(true) as { data: ApiMembership[], isLoading: boolean }
	const { data: clubsData = [], isLoading: clubsLoading } = useClubs()



	// Dùng useProductsByClubId thay vì useProducts
	const {
		data: products = [],
		isLoading: productsLoading,
		isFetching, // Dùng để hiển thị loading khi đổi club
	} = useProductsByClubId(
		Number(selectedClubId), // Chỉ fetch khi selectedClubId có giá trị
		!!selectedClubId // `enabled` flag
	)
	// Kết hợp trạng thái loading
	const isLoading = clubsLoading || profileLoading || (productsLoading && !selectedClubId); // Chỉ loading chính khi đang tải club hoặc chưa chọn club

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
	}, [])

	useEffect(() => {
		try {
			const saved = safeLocalStorage.getItem("uniclub-auth")
			if (saved) {
				const parsed = JSON.parse(saved)
				let clubIdNumbers: number[] = []

				// Hỗ trợ cả clubIds (mảng) và clubId (số)
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
	}, [])

	useEffect(() => {
		if (userClubIds.length > 0 && clubsData.length > 0) {

			const details = userClubIds
				.map((id) => clubsData.find((club: any) => club.id === id))
				.filter(Boolean);

			setUserClubsDetails(details as any[]);
			const validClubIds = details.map(c => String(c.id));

			if (clubIdFromQuery && validClubIds.includes(clubIdFromQuery)) {
				if (selectedClubId !== clubIdFromQuery) {
					setSelectedClubId(clubIdFromQuery);
				}
				return;
			}
			if (selectedClubId && validClubIds.includes(selectedClubId)) {
				return;
			}
			if (validClubIds.length > 0) {
				setSelectedClubId(validClubIds[0]);
			}
		}
	}, [userClubIds, clubsData, clubIdFromQuery, selectedClubId]);
	//

	// Logic lọc (Luôn lọc 'ACTIVE' trước)
	const filteredProducts = useMemo(() => {
		const activeProducts = products.filter(p => p.status === "ACTIVE");

		if (!searchTerm) {
			return activeProducts;
		}

		const searchLower = searchTerm.toLowerCase()
		return activeProducts.filter((p) => {
			return p.name.toLowerCase().includes(searchLower) ||
				p.description.toLowerCase().includes(searchLower);
		});
	}, [products, searchTerm]); // Chạy lại khi products hoặc searchTerm thay đổi

	const {
		currentPage,
		totalPages,
		setCurrentPage,
		paginatedData: paginatedProducts,
	} = usePagination({ data: filteredProducts, initialPageSize: 9 })
	// Hàm xử lý Redeem với thông báo lỗi cụ thể
	const handleRedeem = async (product: Product) => {
		setRedeemingProductId(product.id);

		try {
			// 1. Kiểm tra xem profile (wallets) đã tải xong và có dữ liệu chưa
			if (!profile || profile.length === 0) {
				throw new Error("Your membership information was not found. You cannot redeem the gift.");
			}

			// 2. Kiểm tra xem club đã được chọn chưa
			if (!selectedClubId) {
				throw new Error("Please select a club from the list.");
			}

			// 3. Tìm wallet (và membershipId) tương ứng với club đang chọn
			const currentMembership = profile.find(m => m.clubId === Number(selectedClubId));

			if (!currentMembership) {
				const clubName = userClubsDetails.find(c => c.id === Number(selectedClubId))?.name || "this club";
				throw new Error(`You are not a member of ${clubName}.`);
			}

			// 4. Tạo payload
			const payload: RedeemPayload = {
				productId: product.id,
				quantity: 1,
				membershipId: currentMembership.membershipId // Gửi ID thành viên
			};

			let order;
			// 5. Kiểm tra loại sản phẩm để gọi đúng API
			if (product.type === "EVENT_ITEM") {
				if (!product.eventId || product.eventId === 0) {
					throw new Error("Sản phẩm này bị lỗi: không có Event ID.");
				}
				order = await redeemEventProduct(product.eventId, payload);
			} else {
				order = await redeemClubProduct(product.clubId, payload);
			}

			// 6. Thành công
			toast({
				title: "Redeemed Successfully",
				description: `Đơn hàng #${order.orderCode} cho "${product.name}" đã được đặt.`,
				variant: "success",
			});

			// Tải lại dữ liệu (Wallet và Products)
			queryClient.invalidateQueries({ queryKey: queryKeys.profile });
			queryClient.invalidateQueries({ queryKey: queryKeys.productsByClubId(product.clubId) });

		} catch (error: any) {
			console.error("Redeem failed:", error);
			// Hiển thị bất kỳ lỗi nào (từ API hoặc từ các bước kiểm tra ở trên)
			toast({
				title: "Redeem Failed",
				description: error.response?.data?.message || error.message || "An error occurred.",
				variant: "destructive",
			});
		} finally {
			setRedeemingProductId(null);
		}
	}

	return (
		<ProtectedRoute allowedRoles={["student"]}>
			<AppShell>
				<div className="space-y-6">
					<div>
						<h1 className="text-3xl font-bold">Gift Products</h1>
						{/* Thêm thông tin club */}
						<p className="text-muted-foreground">
							Browse and redeem products from your clubs
							{userClubIds.length > 0 && (
								<span className="text-xs text-muted-foreground/70 ml-2">
									(Viewing for club{userClubIds.length > 1 ? "s" : ""} {userClubIds.join(", ")})
								</span>
							)}
						</p>
					</div>

					{/* Thêm Flex container cho Input và Select */}
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

						{/*  Dropdown chọn Club */}
						{userClubIds.length > 0 && (
							<Select
								value={selectedClubId || ""}
								onValueChange={(value) => {
									setSelectedClubId(value)
									// ❗️ Dòng này rất quan trọng
									router.push(`/student/gift?clubId=${value}`, { scroll: false })
									setCurrentPage(1)
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
						{/* Logic hiển thị loading/empty */}
						{(isLoading || profileLoading) ? (
							<div className="col-span-full text-center py-12">
								<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
								<p className="text-muted-foreground">Loading clubs...</p>
							</div>
						) : isFetching ? ( //Loading khi đổi club
							<div className="col-span-full text-center py-12">
								<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
								<p className="text-muted-foreground">Loading products for this club...</p>
							</div>
						) : userClubIds.length === 0 ? (
							<div className="col-span-full text-center py-12">
								<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-semibold mb-2">No club membership</h3>
								<p className="text-muted-foreground">You must join a club to see its products.</p>
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
							paginatedProducts.map((p) => {
								// LẤY ẢNH THUMBNAIL
								const thumbnail = p.media?.find((m) => m.thumbnail)?.url || "/placeholder.svg";
								const isRedeeming = redeemingProductId === p.id;
								const isOutOfStock = p.stockQuantity === 0;
								const detailUrl = `/student/gift/${p.id}?clubId=${selectedClubId}`;

								return (
									<Card
										key={p.id}
										className="transition-all duration-200 hover:shadow-md flex flex-col h-full relative overflow-hidden"
									>
										<CardHeader className="p-0 border-b">
											<div
												className="aspect-video w-full relative overflow-hidden bg-muted cursor-pointer"
												onClick={() => router.push(detailUrl)}
											>
												<img
													src={thumbnail}
													alt={p.name}
													className="object-cover w-full h-full"
													onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
												/>
												{/* Badge Club Name */}
												<Badge
													variant="secondary"
													className="absolute right-2 top-2 z-10 text-xs"
												>
													{p.clubName}
												</Badge>
											</div>
										</CardHeader>

										<CardContent className="p-3 flex flex-col gap-2 grow">
											<div className="min-w-0">
												<CardTitle
													className="text-base font-semibold truncate cursor-pointer hover:text-primary"
													title={p.name}
													onClick={() => router.push(detailUrl)}
												>
													{p.name}
												</CardTitle>
												<CardDescription className="mt-1 text-sm line-clamp-2" title={p.description}>
													{p.description || "No description."}
												</CardDescription>
											</div>

											{/*Hiển thị Tags */}
											{p.tags && p.tags.length > 0 && (
												<div className="flex flex-wrap gap-1 mt-1">
													{p.tags.map((tag) => (
														<Badge
															key={tag}
															variant="default"
															className="text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
														>
															{tag}
														</Badge>
													))}
												</div>
											)}

											{/* Đẩy giá và kho xuống dưới */}
											<div className="flex items-center justify-between mt-auto pt-2">

												<span className="font-semibold text-blue-600 text-base flex items-center">
													<WalletCards className="h-4 w-4 text-muted-foreground mr-2" />
													{p.pointCost.toLocaleString('en-US')} points
												</span>
												<span className={`text-sm ${isOutOfStock ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
													Stock: {p.stockQuantity.toLocaleString('en-US')}
												</span>
											</div>

											{/* Nút Redeem và Nút Details */}
											<div className="mt-2 grid grid-cols-2 gap-2">
												{/* Nút View Details */}
												<Button
													variant="outline"
													size="sm"
													onClick={() => router.push(detailUrl)}
													disabled={isRedeeming} // Vô hiệu hóa khi đang redeem
												>
													<Eye className="h-4 w-4 mr-2 flex-shrink-0" />
													<span className="truncate">Details</span>
												</Button>

												{/* Nút Redeem */}
												<Button
													variant={isOutOfStock ? "secondary" : "default"}
													size="sm"
													disabled={isOutOfStock || isRedeeming}
													onClick={() => handleRedeem(p)}
												>
													{isRedeeming ? (
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													) : (
														<Gift className="h-4 w-4 mr-2" />
													)}
													{isOutOfStock ? "Out of Stock" : (isRedeeming ? "Processing..." : "Redeem")}
												</Button>
											</div>
										</CardContent>
									</Card>
								)
							})
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
