"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Gift, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import { Product } from "@/service/productApi"
import { useProducts } from "@/hooks/use-query-hooks"

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
	// ✅ USE REACT QUERY HOOK
	const { data: products = [], isLoading: loading } = useProducts({ page: 0, size: 50, sort: "name" })
	const [searchTerm, setSearchTerm] = useState("")

	const filteredProducts = products.filter(
		(p) =>
			p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			p.description.toLowerCase().includes(searchTerm.toLowerCase())
	)

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
						<p className="text-muted-foreground">
							Browse and redeem available gift products
						</p>
					</div>

					<Input
						placeholder="Search products..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="max-w-sm"
					/>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{loading ? (
							<div className="col-span-full text-center py-12">
								<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
								<p className="text-muted-foreground">Loading products...</p>
							</div>
						) : paginatedProducts.length === 0 ? (
							<div className="col-span-full text-center py-12">
								<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									No products found
								</h3>
								<p className="text-muted-foreground">
									Try adjusting your search terms
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
												src="/placeholder.svg"
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
												Club ID: {p.clubId}
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
