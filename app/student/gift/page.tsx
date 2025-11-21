"use client"

import { useEffect, useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Gift, Package, ChevronLeft, ChevronRight, Layers, Loader2, Eye, WalletCards, Search } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import { useClubs, useProductsByClubId, useProfile, queryKeys, useEventProductsOnTime } from "@/hooks/use-query-hooks"
import { Product } from "@/service/productApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { safeSessionStorage } from "@/lib/browser-utils"
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
		<div className="flex items-center justify-center gap-2">
			<button
				onClick={onPrev}
				disabled={current === 1}
				className="h-10 w-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700"
				aria-label="Previous page"
			>
				<ChevronLeft className="h-5 w-5 text-gray-600 dark:text-slate-200" />
			</button>
			<div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200">
				Page {current} of {total}
			</div>
			<button
				onClick={onNext}
				disabled={current === total}
				className="h-10 w-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700"
				aria-label="Next page"
			>
				<ChevronRight className="h-5 w-5 text-gray-600 dark:text-slate-200" />
			</button>
		</div>
	) : null

// ========== COMPONENT ==========
export default function MemberGiftPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedTab, setSelectedTab] = useState<"CLUB_ITEM" | "EVENT_ITEM">("CLUB_ITEM")
	const { toast } = useToast()
	const router = useRouter()
	const searchParams = useSearchParams()
	const clubIdFromQuery = searchParams.get('clubId') // Lấy clubId từ URL
	// state cho logic chọn club
	const [userClubIds, setUserClubIds] = useState<number[]>([])
	const [userClubsDetails, setUserClubsDetails] = useState<any[]>([])
	const [selectedClubId, setSelectedClubId] = useState<string | null>(null)// Bắt đầu là null
	const [redeemingProductId, setRedeemingProductId] = useState<number | null>(null)
	const queryClient = useQueryClient()
	// const [wallets, setWallets] = useState<any[]>([]) // Dùng 'any[]' hoặc import 'MembershipWallet'
	// const { data: profile, isLoading: profileLoading } = useProfile(true)
	const { data: profile, isLoading: profileLoading } = useProfile(true) as { data: ApiMembership[], isLoading: boolean }
	const { data: clubsData = [], isLoading: clubsLoading } = useClubs()



	// Dùng useProductsByClubId cho CLUB_ITEM
	const {
		data: clubProducts = [],
		isLoading: clubProductsLoading,
		isFetching: clubProductsFetching,
	} = useProductsByClubId(
		Number(selectedClubId),
		!!selectedClubId && selectedTab === "CLUB_ITEM"
	)

	// Dùng useEventProductsOnTime cho EVENT_ITEM (auto refresh 10s)
	const {
		data: eventProducts = [],
		isLoading: eventProductsLoading,
		isFetching: eventProductsFetching,
	} = useEventProductsOnTime(
		Number(selectedClubId),
		!!selectedClubId && selectedTab === "EVENT_ITEM"
	)

	// Combine products based on selected tab
	const products = selectedTab === "CLUB_ITEM" ? clubProducts : eventProducts
	const productsLoading = selectedTab === "CLUB_ITEM" ? clubProductsLoading : eventProductsLoading
	const isFetching = selectedTab === "CLUB_ITEM" ? clubProductsFetching : eventProductsFetching
	// Kết hợp trạng thái loading
	const isLoading = clubsLoading || profileLoading || (productsLoading && !selectedClubId); // Chỉ loading chính khi đang tải club hoặc chưa chọn club

	// Luôn refresh khi mở trang Gift để đảm bảo dữ liệu mới
	useEffect(() => {
		// Làm mới cache các query liên quan và yêu cầu refresh UI
		queryClient.invalidateQueries({ queryKey: queryKeys.profile })
		if (selectedClubId) {
			if (selectedTab === "CLUB_ITEM") {
				queryClient.invalidateQueries({ queryKey: queryKeys.productsByClubId(Number(selectedClubId)) })
			} else {
				queryClient.invalidateQueries({ queryKey: queryKeys.eventProductsOnTime(Number(selectedClubId)) })
			}
		}
		// Soft refresh để cập nhật dữ liệu server/client (không full reload)
		router.refresh()
		// Chỉ chạy khi vào trang này và khi club đang chọn thay đổi
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedClubId, selectedTab])

	useEffect(() => {
		try {
			const saved = safeSessionStorage.getItem("uniclub-auth")
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
			console.error("Failed to get clubIds from sessionStorage:", error)
		}
	}, [])

	useEffect(() => {
		try {
			const saved = safeSessionStorage.getItem("uniclub-auth")
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
			console.error("Failed to get clubIds from sessionStorage:", error)
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

	// Logic lọc (Luôn lọc 'ACTIVE' trước, sau đó filter theo tab và search)
	const filteredProducts = useMemo(() => {
		const activeProducts = products.filter(p => p.status === "ACTIVE");
		
		// Filter by selected tab (type)
		const typeFilteredProducts = activeProducts.filter(p => p.type === selectedTab);

		if (!searchTerm) {
			return typeFilteredProducts;
		}

		const searchLower = searchTerm.toLowerCase()
		return typeFilteredProducts.filter((p) => {
			return p.name.toLowerCase().includes(searchLower) ||
				p.description.toLowerCase().includes(searchLower);
		});
	}, [products, searchTerm, selectedTab]); // Chạy lại khi products, searchTerm hoặc selectedTab thay đổi

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
				<div className="space-y-8 pb-8">
					{/* Header */}
					<div className="bg-gradient-to-r from-blue-600 to-purple-600 -mx-6 -mt-6 px-6 py-8 text-white">
						<h1 className="text-3xl font-bold mb-2">Gift Store</h1>
						<p className="text-blue-100">Redeem your points for amazing rewards</p>
					</div>

				{/* Tab Buttons - Moved to top */}
				<div className="flex gap-3 -mt-4">
					<button
						onClick={() => {
							setSelectedTab("CLUB_ITEM")
							setCurrentPage(1)
						}}
						className={`flex-1 py-4 px-6 rounded-lg font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
							selectedTab === "CLUB_ITEM"
								? "bg-blue-600 text-white shadow-lg shadow-blue-200"
								: "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200"
						}`}
					>
						<Gift className="h-5 w-5" />
						Club Gift
					</button>
					<button
						onClick={() => {
							setSelectedTab("EVENT_ITEM")
							setCurrentPage(1)
						}}
						className={`flex-1 py-4 px-6 rounded-lg font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
							selectedTab === "EVENT_ITEM"
								? "bg-purple-600 text-white shadow-lg shadow-purple-200"
								: "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200"
						}`}
					>
						<Package className="h-5 w-5" />
						Event Gift
					</button>
				</div>

				{/* Gift Completed Button - Only show when EVENT_ITEM tab is selected */}
				{selectedTab === "EVENT_ITEM" && (
					<div className="flex justify-end -mt-4">
						<button
							onClick={() => router.push(`/student/gift/completed?clubId=${selectedClubId}`)}
							className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-md"
						>
							<Package className="h-5 w-5" />
							Gift Completed
						</button>
					</div>
				)}					{/* Search and Filter Section */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 dark:bg-slate-900 dark:border-slate-800">
						<div className="flex flex-col md:flex-row gap-3">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-400" />
								<Input
									placeholder="Search for gifts..."
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value)
										setCurrentPage(1)
									}}
									className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
								/>
							</div>

							{userClubIds.length > 0 && (
								<Select
									value={selectedClubId || ""}
									onValueChange={(value) => {
										setSelectedClubId(value)
										router.push(`/student/gift?clubId=${value}`, { scroll: false })
										setCurrentPage(1)
									}}
								>
									<SelectTrigger className="w-full md:w-[280px] h-11 border-gray-300 dark:border-slate-700 dark:bg-slate-950/50">
										<div className="flex items-center gap-2">
											<Layers className="h-4 w-4 text-gray-500 dark:text-slate-300" />
											<SelectValue placeholder="Select a club" />
										</div>
									</SelectTrigger>
									<SelectContent>
										{userClubsDetails.map((club) => (
											<SelectItem key={club.id} value={String(club.id)}>
												{club.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					</div>

				{/* Products Grid */}
				<div className="grid gap-4 grid-cols-4">
						{(isLoading || profileLoading) ? (
							<div className="col-span-full">
								<div className="bg-white rounded-lg border border-gray-200 p-16 text-center dark:bg-slate-900 dark:border-slate-800">
									<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900/40">
										<Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
									</div>
									<h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-slate-100">Loading Amazing Gifts...</h3>
									<p className="text-gray-600 dark:text-slate-400">Please wait while we fetch the best rewards for you</p>
								</div>
							</div>
						) : isFetching ? (
							<div className="col-span-full">
								<div className="bg-white rounded-lg border border-gray-200 p-16 text-center dark:bg-slate-900 dark:border-slate-800">
									<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-100 flex items-center justify-center dark:bg-purple-900/40">
										<Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
									</div>
									<h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-slate-100">Loading Products...</h3>
									<p className="text-gray-600 dark:text-slate-400">Fetching gifts from this club</p>
								</div>
							</div>
						) : userClubIds.length === 0 ? (
							<div className="col-span-full">
								<div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200 p-16 text-center">
									<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white flex items-center justify-center shadow-md">
										<Package className="h-10 w-10 text-orange-500" />
									</div>
									<h3 className="text-2xl font-bold mb-2 text-orange-900">No Club Membership</h3>
									<p className="text-orange-700 mb-6">Join a club to start redeeming amazing rewards!</p>
									<button 
										onClick={() => router.push('/student/club')}
										className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
									>
										<Layers className="h-4 w-4" />
										Browse Clubs
									</button>
								</div>
							</div>
						) : paginatedProducts.length === 0 ? (
							<div className="col-span-full">
								<div className="bg-white rounded-lg border border-gray-200 p-16 text-center dark:bg-slate-900 dark:border-slate-800">
									<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center dark:bg-slate-800">
										<Package className="h-10 w-10 text-gray-400 dark:text-slate-400" />
									</div>
									<h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-slate-100">No Products Found</h3>
									<p className="text-gray-600 mb-4">
										{searchTerm ? "Try adjusting your search terms" : `No ${selectedTab === "CLUB_ITEM" ? "club" : "event"} gifts available`}
									</p>
									{searchTerm && (
										<button 
											onClick={() => setSearchTerm("")}
											className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
										>
											Clear Search
										</button>
									)}
								</div>
							</div>
						) : (
							paginatedProducts.map((p) => {
								const thumbnail = p.media?.find((m) => m.thumbnail)?.url || "/placeholder.svg";
								const isRedeeming = redeemingProductId === p.id;
								const isOutOfStock = p.stockQuantity === 0;
								const detailUrl = `/student/gift/${p.id}?clubId=${selectedClubId}`;

								return (
									<div
										key={p.id}
										className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col dark:bg-slate-900 dark:border-slate-800"
									>
										{/* Image Section */}
										<div 
											className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer dark:bg-slate-800"
											onClick={() => router.push(detailUrl)}
										>
											<img
												src={thumbnail}
												alt={p.name}
												className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
												onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
											/>
											
											{/* Stock Badge */}
											{isOutOfStock && (
												<div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
													Out of Stock
												</div>
											)}
										</div>

										<div className="p-3 flex flex-col gap-2 grow">
											{/* Title */}
											<h3
												className="text-sm font-bold line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors min-h-10 dark:text-slate-100 dark:hover:text-blue-400"
												title={p.name}
												onClick={() => router.push(detailUrl)}
											>
												{p.name}
											</h3>

											{/* Description */}
											<p className="text-xs text-gray-600 line-clamp-2 dark:text-slate-300">
												{p.description || "An amazing reward waiting for you!"}
											</p>

											{/* Tags */}
											{p.tags && p.tags.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{p.tags.slice(0, 2).map((tag) => (
														<span
															key={tag}
															className="text-xs font-medium px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
														>
															{tag}
														</span>
													))}
													{p.tags.length > 2 && (
														<span className="text-xs font-medium px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded dark:bg-slate-800 dark:text-slate-200">
															+{p.tags.length - 2}
														</span>
													)}
												</div>
											)}

											{/* Price and Stock Info */}
											<div className="mt-auto pt-2 border-t border-gray-200 space-y-2 dark:border-slate-800">
												<div className="flex items-center justify-between">
													<div>
														<p className="text-xs text-gray-500 dark:text-slate-400">Points</p>
														<p className="text-lg font-bold text-gray-900 dark:text-white">
															{p.pointCost.toLocaleString('en-US')}
														</p>
													</div>
													<div className="text-right">
														<p className="text-xs text-gray-500 dark:text-slate-400">Stock</p>
														<p className={`text-sm font-bold ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
															{p.stockQuantity.toLocaleString('en-US')}
														</p>
													</div>
												</div>

												{/* Action Button */}
												<button
													onClick={() => router.push(detailUrl)}
													disabled={isRedeeming}
													className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{isRedeeming ? (
														<>
															<Loader2 className="h-4 w-4 animate-spin" />
															Processing...
														</>
													) : (
														<>
															<Eye className="h-3.5 w-3.5" />
															View
														</>
													)}
												</button>
											</div>
										</div>
									</div>
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
