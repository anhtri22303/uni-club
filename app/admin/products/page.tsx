// file: app/admin/gift/page.tsx
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { keepPreviousData } from "@tanstack/react-query"
import {
    Package, Search, Loader2, CheckCircle, XCircle, Archive, MoreHorizontal, ToggleLeft, ToggleRight, X
} from "lucide-react"
import {
    fetchAdminProducts, toggleProductStatus, type AdminProduct, type Page,
} from "@/service/adminApi/adminProductApi" // 1. Import từ API của Admin

// --- Hooks ---
import { useToast } from "@/hooks/use-toast"
// --- Components ---
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route" // 3. Dùng ProtectedRoute
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Pagination } from "@/components/pagination"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"

// --- Helper Component: ProductStatusBadge ---
const ProductStatusBadge = ({ status }: { status: string }) => {
    if (status === "ACTIVE") {
        return (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
            </Badge>
        )
    }
    if (status === "INACTIVE") {
        return (
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                <XCircle className="h-3 w-3 mr-1" />
                Inactive
            </Badge>
        )
    }
    if (status === "ARCHIVED") {
        return (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                <Archive className="h-3 w-3 mr-1" />
                Archived
            </Badge>
        )
    }
    return <Badge variant="outline">{status}</Badge>
}


// --- Main Page Component ---
export default function AdminGiftPage() {
    const [page, setPage] = useState(0) // 0-indexed cho API
    const [pageSize, setPageSize] = useState(10) // State cho pageSize
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")

    const { toast } = useToast()
    const queryClient = useQueryClient()
    // useEffect cho debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 500) // 500ms delay

        return () => {
            clearTimeout(timer)
        }
    }, [searchTerm])

    useEffect(() => {
        setPage(0)
    }, [debouncedSearchTerm, statusFilter, pageSize])

    // 6. Fetch dữ liệu bằng React Query, truyền page, filter, search
    const {
        data: pagedData,
        isLoading,
        isError,
    } = useQuery({
        queryKey: [
            "adminProducts",
            page,
            pageSize, // Thêm pageSize
            statusFilter,
            debouncedSearchTerm, // Dùng giá trị đã debounce
        ],
        queryFn: () =>
            fetchAdminProducts({
                page,
                size: pageSize, // Gửi pageSize
                status: statusFilter === "all" ? undefined : statusFilter,
                search: debouncedSearchTerm || undefined, // Gửi search
            }),
        placeholderData: keepPreviousData,
    })

    // 7. Mutation để bật/tắt status
    const { mutate: toggleStatus, isPending: isToggling } = useMutation({
        mutationFn: toggleProductStatus,
        onSuccess: (data, variables) => {
            toast({
                title: "Success",
                description: `Product status updated.`,
                variant: "success",
            })
            // Invalidate query để refresh data
            queryClient.invalidateQueries({ queryKey: ["adminProducts"] })
        },
        onError: (err: any) => {
            toast({
                title: "Error",
                description: err.message || "Failed to update status.",
                variant: "destructive",
            })
        },
    })

    // 8. Helper để lấy data từ pagedData
    const products = pagedData?.content || []
    const totalPages = pagedData?.totalPages || 0
    const totalItems = pagedData?.totalElements || 0

    const handlePageChange = (newPage: number) => {
        setPage(newPage - 1) // Component là 1-indexed, state là 0-indexed
    }

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize)
        // useEffect (THAY ĐỔI 4) sẽ tự động reset page về 0
    }

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <AppShell>
                <div className="space-y-8">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Product Management
                            </h1>
                            <p className="text-muted-foreground mt-2 text-lg">
                                View and moderate all products across the platform
                            </p>
                        </div>
                        {/* Không có nút "Add New Product" cho Admin */}
                    </div>

                    {/* Filter Bar */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or product code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-10 pl-10 pr-12 text-base bg-white border-slate-300"
                            />
                            {/*  Nút Clear (X) */}
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
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => {
                                setStatusFilter(value)
                                // useEffect (THAY ĐỔI 4) sẽ tự động reset page về 0
                            }}
                        >
                            <SelectTrigger className="w-[180px] h-12 text-base bg-white border-slate-300">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                <SelectItem value="ARCHIVED">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 9. Data Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Products</CardTitle>
                            <CardDescription>
                                A list of all products from all clubs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">Product</TableHead>
                                        <TableHead>Club</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Redeemed</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center h-24">
                                                <Loader2 className="h-6 w-6 animate-spin inline-block" />
                                                <p>Loading products...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : isError ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="text-center h-24 text-red-600"
                                            >
                                                Failed to load products.
                                            </TableCell>
                                        </TableRow>
                                    ) : products.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="text-center h-24"
                                            >
                                                <Package className="h-10 w-10 mx-auto text-muted-foreground" />
                                                <p className="mt-2">No products found.</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Try adjusting your filters.
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        products.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell>
                                                    <div className="font-medium">{p.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {p.productCode}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{p.clubName}</TableCell>
                                                <TableCell>{p.type}</TableCell>
                                                <TableCell>
                                                    <ProductStatusBadge status={p.status} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {p.stockQuantity}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {p.pointCost.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {p.redeemCount}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(p.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                onSelect={(e) => {
                                                                    e.preventDefault() // Ngăn dropdown đóng
                                                                    if (isToggling) return
                                                                    toggleStatus(p.id)
                                                                }}
                                                                disabled={isToggling}
                                                            >
                                                                <Switch
                                                                    id={`status-switch-${p.id}`}
                                                                    checked={p.status === "ACTIVE"}
                                                                    // onClick để toggle
                                                                    onCheckedChange={() => toggleStatus(p.id)}
                                                                    disabled={isToggling}
                                                                    className="mr-2"
                                                                />
                                                                <label htmlFor={`status-switch-${p.id}`}>
                                                                    {p.status === "ACTIVE"
                                                                        ? "Deactivate"
                                                                        : "Activate"}
                                                                </label>
                                                            </DropdownMenuItem>
                                                            {/* Bạn có thể thêm link tới trang chi tiết ở đây */}
                                                            {/* <DropdownMenuItem>View Details</DropdownMenuItem> */}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Sử dụng component Pagination tùy chỉnh */}
                    <Pagination
                        currentPage={page + 1} // Chuyển state 0-indexed sang prop 1-indexed
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        // Bạn có thể tùy chỉnh các tùy chọn này nếu muốn
                        pageSizeOptions={[10, 25, 50]}
                    />
                </div>
            </AppShell>
        </ProtectedRoute>
    )
}