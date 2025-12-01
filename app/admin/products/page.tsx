"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { keepPreviousData } from "@tanstack/react-query"
import {
    Package, Search, Loader2, CheckCircle, XCircle, Archive, MoreHorizontal, ToggleLeft, ToggleRight, X, Building2
} from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
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

const ProductTypeBadge = ({ type }: { type: string }) => {
    // Format text: "CLUB_ITEM" -> "Club Item" cho đẹp
    const label = type.replace("_", " ");

    if (type === "CLUB_ITEM") {
        // Dùng variant 'minor' (Sky Blue) từ badge.tsx
        return <Badge variant="minor">{label}</Badge>
    }
    if (type === "EVENT_ITEM") {
        // Dùng variant 'major' (Orange) từ badge.tsx
        return <Badge variant="major">{label}</Badge>
    }

    // Mặc định dùng outline
    return <Badge variant="outline">{label}</Badge>
}

// --- Main Page Component ---
export default function AdminGiftPage() {
    // const [page, setPage] = useState(0) // 0-indexed cho API
    // const [pageSize, setPageSize] = useState(50) // State cho pageSize
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
    // 1. Client-side Pagination State
    const [clientPage, setClientPage] = useState(1);
    const [groupsPerPage] = useState(5); // Bạn muốn hiển thị 5 nhóm mỗi trang

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

    // --- 1. CHỈ GIỮ LẠI QUERY NÀY (Lấy dữ liệu số lượng lớn) ---
    const { data: allData, isLoading } = useQuery({
        queryKey: ["adminProducts", "all", statusFilter, debouncedSearchTerm],
        queryFn: () =>
            fetchAdminProducts({
                page: 0,
                size: 1000, // Lấy 1000 item để gom nhóm cho chuẩn
                status: statusFilter === "all" ? undefined : statusFilter,
                search: debouncedSearchTerm || undefined,
            }),
        placeholderData: keepPreviousData,
    });

    // --- 2. Gom nhóm dữ liệu từ allData ---
    const allGroupedProducts = useMemo(() => {
        if (!allData?.content) return [];

        const groups = new Map();
        allData.content.forEach((product: AdminProduct) => {
            const groupKey = product.clubName || "Unknown Club";
            if (!groups.has(groupKey)) {
                groups.set(groupKey, {
                    clubName: groupKey,
                    products: [],
                    totalProducts: 0
                });
            }
            groups.get(groupKey).products.push(product);
            groups.get(groupKey).totalProducts++;
        });

        return Array.from(groups.values());
    }, [allData]);

    // --- 3. Lọc client-side (nếu cần xử lý thêm) ---
    const filteredGroups = useMemo(() => {
        if (!debouncedSearchTerm) return allGroupedProducts;
        const lowerTerm = debouncedSearchTerm.toLowerCase();

        // Mặc dù API đã filter, nhưng filter thêm ở đây để đảm bảo tính nhất quán khi gom nhóm
        return allGroupedProducts.filter((group: any) =>
            group.clubName.toLowerCase().includes(lowerTerm) ||
            group.products.some((p: any) => p.name.toLowerCase().includes(lowerTerm) || p.productCode.toLowerCase().includes(lowerTerm))
        );
    }, [allGroupedProducts, debouncedSearchTerm]);

    // --- 4. CẮT DỮ LIỆU (Client-side Pagination Logic) ---
    const indexOfLastGroup = clientPage * groupsPerPage;
    const indexOfFirstGroup = indexOfLastGroup - groupsPerPage;

    // Đây là biến quan trọng nhất để render ra màn hình
    const currentGroups = filteredGroups.slice(indexOfFirstGroup, indexOfLastGroup);

    const totalGroupPages = Math.ceil(filteredGroups.length / groupsPerPage);

    // Reset về trang 1 khi filter thay đổi
    useEffect(() => {
        setClientPage(1);
    }, [statusFilter, debouncedSearchTerm]);

    // --- Mutation Toggle Status (Giữ nguyên) ---
    const { mutate: toggleStatus, isPending: isToggling } = useMutation({
        mutationFn: toggleProductStatus,
        onSuccess: () => {
            toast({
                title: "Success",
                description: `Product status updated.`,
                variant: "success",
            })
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
                                // className="h-10 pl-10 pr-12 text-base bg-white border-slate-300"
                                className="h-10 pl-10 pr-12 text-base bg-white border-slate-300 dark:bg-slate-950 dark:border-slate-800"
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
                            {/* <SelectTrigger className="w-[180px] h-12 text-base bg-white border-slate-300"> */}
                            <SelectTrigger className="w-[180px] h-12 text-base bg-white border-slate-300 dark:bg-slate-950 dark:border-slate-800">
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
                            <div className="space-y-4">
                                {isLoading ? (
                                    <Card className="flex h-40 items-center justify-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                            <p>Loading products...</p>
                                        </div>
                                    </Card>
                                ) : currentGroups.length === 0 ? ( // SỬA: Dùng currentGroups
                                    <Card className="flex h-40 items-center justify-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Package className="h-8 w-8" />
                                            <p>No products found.</p>
                                        </div>
                                    </Card>
                                ) : (
                                    <Accordion
                                        type="multiple"
                                        className="space-y-4"
                                        // Key dùng filteredGroups để reset khi filter
                                        key={debouncedSearchTerm + statusFilter + clientPage}
                                        // Mặc định mở tất cả các group đang hiển thị
                                        // defaultValue={currentGroups.map((g: any) => g.clubName)} // MỞ group khi load trang
                                        defaultValue={[]} // ĐÓNG group khi load trang
                                    >
                                        {/* SỬA: Map qua currentGroups thay vì groupedProducts */}
                                        {currentGroups.map((group: any) => (
                                            <AccordionItem
                                                key={group.clubName}
                                                value={group.clubName}
                                                className="border rounded-lg bg-white shadow-sm overflow-hidden dark:bg-slate-950 dark:border-slate-800"
                                            >
                                                <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 hover:no-underline dark:hover:bg-slate-900">
                                                    <div className="flex items-center gap-4 w-full">
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 dark:bg-blue-900/20 dark:text-blue-400">
                                                            <Building2 size={20} />
                                                        </div>
                                                        <div className="flex flex-col items-start text-left flex-1">
                                                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                                                                {group.clubName}
                                                            </h3>
                                                            <span className="text-sm text-slate-500 font-normal">
                                                                {group.totalProducts} items listed
                                                            </span>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>

                                                <AccordionContent className="border-t bg-slate-50/50 p-0 dark:bg-slate-900/50 dark:border-slate-800">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="border-b-slate-200 dark:border-slate-800 hover:bg-transparent">
                                                                <TableHead className="pl-6 text-left">
                                                                    Product
                                                                </TableHead>
                                                                <TableHead className="w-[2%] whitespace-nowrap text-center pr-10">
                                                                    Type
                                                                </TableHead>
                                                                <TableHead className="w-[2%] whitespace-nowrap text-center pr-5">
                                                                    Status
                                                                </TableHead>
                                                                <TableHead className="w-[10%] text-right">
                                                                    Stock
                                                                </TableHead>
                                                                <TableHead className="w-[10%] text-right">
                                                                    Cost
                                                                </TableHead>
                                                                <TableHead className="w-[10%] text-right">
                                                                    Redeemed
                                                                </TableHead>
                                                                <TableHead className="w-[2%] pr-6 text-center">
                                                                    Actions
                                                                </TableHead>
                                                            </TableRow>
                                                        </TableHeader>

                                                        <TableBody>
                                                            {group.products.map((p: AdminProduct) => (
                                                                <TableRow
                                                                    key={p.id}
                                                                    className="hover:bg-white border-b-slate-100 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
                                                                >
                                                                    <TableCell className="pl-6 font-medium">
                                                                        <div>{p.name}</div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {p.productCode}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-center pr-10">
                                                                        <ProductTypeBadge type={p.type} />
                                                                    </TableCell>
                                                                    <TableCell className="text-center pr-5">
                                                                        <ProductStatusBadge status={p.status} />
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {p.stockQuantity}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-semibold text-orange-600">
                                                                        {p.pointCost.toLocaleString()}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {p.redeemCount}
                                                                    </TableCell>
                                                                    <TableCell className="pr-6 text-center">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    className="h-8 w-8 p-0"
                                                                                >
                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                <DropdownMenuLabel>
                                                                                    Actions
                                                                                </DropdownMenuLabel>
                                                                                <DropdownMenuItem
                                                                                    onSelect={(e) => {
                                                                                        e.preventDefault()
                                                                                        if (!isToggling) toggleStatus(p.id)
                                                                                    }}
                                                                                    disabled={isToggling}
                                                                                >
                                                                                    <Switch
                                                                                        checked={p.status === "ACTIVE"}
                                                                                        className="mr-2 h-4 w-8"
                                                                                    />
                                                                                    {p.status === "ACTIVE"
                                                                                        ? "Deactivate"
                                                                                        : "Activate"}
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chúng ta dùng nút điều khiển clientPage thay vì component Pagination cũ */}
                    {filteredGroups.length > 0 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <div className="text-sm text-muted-foreground mr-4">
                                Showing {(clientPage - 1) * groupsPerPage + 1}-
                                {Math.min(clientPage * groupsPerPage, filteredGroups.length)} of{" "}
                                {filteredGroups.length} clubs
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setClientPage((prev) => Math.max(prev - 1, 1))}
                                disabled={clientPage === 1}
                            >
                                Previous
                            </Button>
                            <div className="text-sm font-medium">
                                Page {clientPage} of {totalGroupPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setClientPage((prev) => Math.min(prev + 1, totalGroupPages))
                                }
                                disabled={clientPage === totalGroupPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}

                </div>
            </AppShell>
        </ProtectedRoute>
    )
}