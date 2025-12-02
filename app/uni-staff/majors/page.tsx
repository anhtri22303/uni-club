"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Major, deleteMajorById, updateMajorById, createMajor, CreateMajorPayload, UpdateMajorPayload } from "@/service/majorApi"
import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookMarked, Search, Eye, Trash, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useMajors } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

// Danh sách các màu phổ biến để chọn
const COLOR_OPTIONS = [
    { value: "#FF6B6B", label: "Red" },
    { value: "#C0392B", label: "Dark Red" },
    { value: "#E74C3C", label: "Light Red" },
    { value: "#FFB3B3", label: "Pink Red" },
    { value: "#FF69B4", label: "Hot Pink" },
    { value: "#F06292", label: "Pink" },
    { value: "#BA68C8", label: "Light Purple" },
    { value: "#8E44AD", label: "Deep Purple" },
    { value: "#BB8FCE", label: "Purple" },
    { value: "#8338EC", label: "Violet" },
    { value: "#4ECDC4", label: "Turquoise" },
    { value: "#45B7D1", label: "Sky Blue" },
    { value: "#85C1E2", label: "Light Blue" },
    { value: "#3A86FF", label: "Blue" },
    { value: "#1565C0", label: "Dark Blue" },
    { value: "#00BFFF", label: "Deep Sky Blue" },
    { value: "#06FFA5", label: "Aquamarine" },
    { value: "#2A9D8F", label: "Teal" },
    { value: "#52B788", label: "Green" },
    { value: "#388E3C", label: "Dark Green" },
    { value: "#98D8C8", label: "Mint" },
    { value: "#F7DC6F", label: "Yellow" },
    { value: "#FFEB3B", label: "Bright Yellow" },
    { value: "#E9C46A", label: "Gold" },
    { value: "#FFD700", label: "Golden" },
    { value: "#F8B739", label: "Orange" },
    { value: "#FFA500", label: "Bright Orange" },
    { value: "#FB5607", label: "Orange Red" },
    { value: "#F4A261", label: "Sandy Brown" },
    { value: "#FFA07A", label: "Light Salmon" },
    { value: "#E76F51", label: "Coral" },
    { value: "#A0522D", label: "Sienna" },
    { value: "#795548", label: "Brown" },
    { value: "#264653", label: "Dark Slate" },
    { value: "#34495E", label: "Slate Blue" },
    { value: "#607D8B", label: "Blue Grey" },
    { value: "#FFBE0B", label: "Amber" },
    { value: "#B0BEC5", label: "Light Grey" },
    { value: "#616161", label: "Grey" },
    { value: "#000000", label: "Black" },
    { value: "#FFFFFF", label: "White" },
]


export default function UniStaffMajorsPage() {
    const [query, setQuery] = useState("")
    const [selected, setSelected] = useState<Major | null>(null)
    // State để quản lý việc hiển thị full description
    const [viewDescription, setViewDescription] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
    const queryClient = useQueryClient()
    // USE REACT QUERY for majors
    const { data: majors = [], isLoading: loading } = useMajors()
    // Thêm bước sắp xếp majors theo ID
    const sortedMajors = useMemo(() => {
        // Sao chép mảng trước khi sắp xếp để tránh thay đổi trực tiếp state của react-query (nếu có)
        // và đảm bảo logic filter/pagination luôn nhận được mảng đã sort.
        return [...majors].sort((a, b) => a.id - b.id)
    }, [majors]) // Sắp xếp lại khi majors thay đổi
    // edit form state for major detail modal
    const [editMajorName, setEditMajorName] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editActive, setEditActive] = useState<boolean>(true)
    const [saving, setSaving] = useState(false)
    const [editMajorCode, setEditMajorCode] = useState("")
    const [editColorHex, setEditColorHex] = useState("")
    const [colorError, setColorError] = useState<string | null>(null)
    // create modal state
    const [createOpen, setCreateOpen] = useState(false)
    const [createMajorName, setCreateMajorName] = useState("")
    const [createDescription, setCreateDescription] = useState("")
    const [creating, setCreating] = useState(false)
    const [createMajorCode, setCreateMajorCode] = useState("")
    const [createColorHex, setCreateColorHex] = useState("")
    const [createNameError, setCreateNameError] = useState<string | null>(null)
    const [createCodeError, setCreateCodeError] = useState<string | null>(null)
    // Delete confirm state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [majorToDelete, setMajorToDelete] = useState<Major | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    // Helper để kiểm tra định dạng màu Hex
    const isValidHex = (color: string): boolean => {
        if (!color) return false // Cho phép rỗng (nếu logic của bạn cho phép)
        const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/
        return hexRegex.test(color)
    }

    // Hàm xử lý đóng/mở modal tạo mới (để reset state)
    const handleCreateModalOpenChange = (open: boolean) => {
        setCreateOpen(open)
        if (!open) {
            // Reset toàn bộ form và lỗi khi đóng
            setCreateMajorName("")
            setCreateMajorCode("")
            setCreateDescription("")
            setCreateColorHex("")
            setCreateNameError(null)
            setCreateCodeError(null)
        }
    }

    const reloadMajors = () => {
        queryClient.invalidateQueries({ queryKey: ["majors"] })
    }

    // Hàm kiểm tra màu trùng lặp
    const isColorInUse = (color: string): boolean => {
        if (!selected || !color) return false // Không có major nào đang được chọn hoặc không có màu

        const normalizedColor = color.trim().toUpperCase()

        // Tìm xem có major nào KHÁC (khác ID) đang dùng màu này không
        return majors.some(
            (major) =>
                major.id !== selected.id && // Phải là một major khác
                (major.colorHex || "").trim().toUpperCase() === normalizedColor,
        )
    }

    // const filtered = useMemo(() => {
    //     if (!query) return majors
    //     const q = query.toLowerCase()
    //     // Lọc theo tên hoặc mô tả major
    //     return majors.filter((m) =>
    //         (m.name || "").toLowerCase().includes(q) ||
    //         (m.description || "").toLowerCase().includes(q) ||
    //         (m.majorCode || "").toLowerCase().includes(q)
    //     )
    // }, [majors, query])
    const filtered = useMemo(() => {
        if (!query) return sortedMajors // <- SỬA: dùng sortedMajors
        const q = query.toLowerCase()
        // Lọc theo tên hoặc mô tả major
        return sortedMajors.filter((m) => // <- SỬA: dùng sortedMajors
            (m.name || "").toLowerCase().includes(q) ||
            (m.description || "").toLowerCase().includes(q) ||
            (m.majorCode || "").toLowerCase().includes(q)
        )
    }, [sortedMajors, query]) // <- Cập nhật dependencies

    // Minimal pagination state
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)

    // Ensure page is clamped when filtered data or pageSize change - auto-adjust on data change
    const lastPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1)
    if (page > lastPage && filtered.length > 0) {
        setPage(lastPage)
    }

    const paginated = useMemo(() => {
        const start = page * pageSize
        return filtered.slice(start, start + pageSize)
    }, [filtered, page, pageSize])

    const openDetail = (m: Major) => {
        setSelected(m)
        setEditMajorName(m.name || "")
        setEditMajorCode(m.majorCode || "")
        setEditDescription(m.description || "")
        setEditActive(m.active)
        setEditColorHex(m.colorHex || "")
        setColorError(null) // Reset lỗi khi mở modal
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!selected) return
        // Thêm validation cuối cùng trong handleSave
        const normalizedColor = editColorHex.trim()
        if (!normalizedColor) {
            toast({ title: "Validation Error", description: "Color hex is required.", variant: "destructive" })
            setColorError("Color hex is required.") // Đảm bảo lỗi được hiển thị
            return
        }
        if (!isValidHex(normalizedColor)) {
            toast({ title: "Validation Error", description: "Invalid hex color format.", variant: "destructive" })
            setColorError("Invalid format. Must be #FFF or #FFFFFF") // Đảm bảo lỗi được hiển thị
            return
        }
        if (isColorInUse(normalizedColor)) {
            toast({ title: "Validation Error", description: "This color is already in use by another major.", variant: "destructive" })
            setColorError("This color is already in use by another major.") // Đảm bảo lỗi được hiển thị
            return
        }

        setSaving(true)
        try {
            // Sử dụng normalizedColor để đảm bảo không có khoảng trắng
            const payload: UpdateMajorPayload = {
                name: editMajorName,
                description: editDescription,
                majorCode: editMajorCode,
                active: editActive,
                colorHex: normalizedColor, // Sử dụng màu đã trim
            }

            const updatedMajor: Major = await updateMajorById(selected.id, payload)

            toast({
                title: "Update successful",
                description: `Major "${updatedMajor.name}" updated.`,
            })
            setSelected(updatedMajor)
            reloadMajors()
            setColorError(null) // Xóa lỗi sau khi thành công
            setDialogOpen(false) // Đóng modal sau khi cập nhật thành công
            try {
                router.refresh() // Reload lại trang
            } catch (e) {
                // ignore
            }
        } catch (err: any) {
            console.error("Update major failed:", err)
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || "Error while updating major."
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!majorToDelete) return
        setIsDeleting(true)
        try {
            // API deleteMajorById trả về void.
            // Nếu không ném lỗi (error) nghĩa là thành công.
            await deleteMajorById(majorToDelete.id)

            toast({
                title: "Deleted",
                description: `Major "${majorToDelete.name}" has been deleted.`,
            })

            if (selected?.id === majorToDelete.id) setDialogOpen(false) // Đóng dialog edit nếu đang edit
            await reloadMajors()
            try {
                router.refresh()
            } catch (e) {
                /* ignore */
            }
        } catch (err: any) {
            console.error("Delete major failed:", err)
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || "Error deleting major."
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
            setDeleteConfirmOpen(false)
            setMajorToDelete(null)
        }
    }

    return (
        <ProtectedRoute allowedRoles={["uni_staff"]}>
            <AppShell>
                <div className="space-y-6 p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Major Management</h1>
                            <p className="text-muted-foreground">View and manage all majors</p>
                        </div>
                        <div className="flex items-center gap-4"> {/* Nested flex for card + search */}
                            {/* Total Majors Card */}
                            <div className="w-24 h-24 flex-shrink-0"> {/* Added flex-shrink-0 to prevent card shrinking */}
                                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 h-full">
                                    <CardContent className="p-2 h-full flex flex-col justify-center">
                                        <div className="text-[12px] font-medium text-blue-700 dark:text-blue-300 mb-1">Total Majors</div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-blue-500 rounded-md">
                                                <BookMarked className="h-3 w-3 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-blue-900 dark:text-blue-100">{majors.length}</div>
                                                <p className="text-[10px] text-blue-600 dark:text-blue-400">Majors</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Search Input and Buttons */}
                            <div className="flex items-center gap-2">
                                <div className="relative w-full max-w-sm">
                                    <Input
                                        placeholder="Search majors"
                                        value={query}
                                        onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
                                        // Thêm 'pr-12' để chừa chỗ cho nút X
                                        className="w-[250px] pr-12 bg-white dark:bg-slate-800 rounded-md px-3 py-2 shadow-sm border 
                                        border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />

                                    {/* Nút X (Clear) nằm đè lên Input */}
                                    {query && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setQuery("")}
                                            // Style định vị tuyệt đối, bo tròn
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                                        >
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    )}
                                </div>
                                <Button size="sm" className="ml-2" onClick={() => setCreateOpen(true)} title="Create major">
                                    Create major
                                    <Plus className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Major List</CardTitle>
                            {/* description */}
                            <CardDescription>Showing {filtered.length} of {majors.length} majors</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="w-full overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {/* cột cho Major */}
                                                <TableHead className="w-[4rem] text-center">ID</TableHead>
                                                <TableHead>Major Name</TableHead>
                                                <TableHead className="w-[7rem] text-center">Major Code</TableHead>
                                                <TableHead className="pl-20">Descriptions</TableHead>
                                                <TableHead className="w-[6rem]">Major Color</TableHead>
                                                <TableHead className="w-[6rem] text-center">Status</TableHead>
                                                <TableHead className="w-[6rem] text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    {/* colSpan */}
                                                    <TableCell colSpan={7} className="p-6 text-center">Loading...</TableCell>
                                                </TableRow>
                                            ) : filtered.length === 0 ? (
                                                <TableRow>
                                                    {/* colSpan và text */}
                                                    <TableCell colSpan={7} className="p-6 text-center">No majors found</TableCell>
                                                </TableRow>
                                            ) : (
                                                // Lặp qua m (major)
                                                paginated.map((m, idx) => (
                                                    <TableRow
                                                        key={m.id}
                                                        className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'} 
                                                        hover:bg-slate-100 dark:hover:bg-slate-700`}
                                                    >
                                                        <TableCell className="text-sm text-muted-foreground text-center">{m.id}</TableCell>
                                                        <TableCell className="font-medium text-primary/90">{m.name}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground text-center">{m.majorCode || "—"}</TableCell>
                                                        {/* <TableCell className="text-sm text-muted-foreground truncate max-w-xs pl-5">
                                                            {m.description || "—"}
                                                        </TableCell> */}
                                                        <TableCell
                                                            className="text-sm text-muted-foreground truncate max-w-xs pl-5 cursor-pointer hover:text-primary 
                                                            hover:underline transition-colors"
                                                            onClick={() => setViewDescription(m.description || "No description")}
                                                            title="Click to view full description"
                                                        >
                                                            {m.description || "—"}
                                                        </TableCell>
                                                        {/* Cell cho Color */}
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="h-4 w-4 rounded-full border"
                                                                    style={{
                                                                        backgroundColor:
                                                                            m.colorHex || "#ffffff",
                                                                    }}
                                                                />
                                                                <span className="font-mono text-xs">
                                                                    {m.colorHex || "N/A"}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={m.active ? "default" : "destructive"}>{m.active ? "Active" : "Inactive"}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2 justify-center">
                                                                {/* openDetail(m) */}
                                                                <Button size="sm" onClick={() => openDetail(m)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    // Mở dialog xác nhận
                                                                    onClick={() => {
                                                                        setMajorToDelete(m)
                                                                        setDeleteConfirmOpen(true)
                                                                    }}
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </Button>

                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                {/* Pagination controls */}
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div>Showing</div>
                                        <div className="font-medium">{filtered.length === 0 ? 0 : page * pageSize + 1}</div>
                                        <div>to</div>
                                        <div className="font-medium">{Math.min((page + 1) * pageSize, filtered.length)}</div>
                                        <div>of</div>
                                        <div className="font-medium">{filtered.length}</div>
                                        <div>majors</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => setPage(0)} disabled={page === 0}>First</Button>
                                        <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                                            Prev
                                        </Button>
                                        <div className="px-2 text-sm">
                                            Page {filtered.length === 0 ? 0 : page + 1} / {Math.max(1, Math.ceil(filtered.length / pageSize))}
                                        </div>
                                        <Button size="sm" variant="outline"
                                            onClick={() => setPage(p => Math.min(p + 1, Math.max(0, Math.ceil(filtered.length / pageSize) - 1)))}
                                            disabled={(page + 1) * pageSize >= filtered.length}>
                                            Next
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setPage(Math.max(0, Math.ceil(filtered.length / pageSize) - 1))}
                                            disabled={(page + 1) * pageSize >= filtered.length}>
                                            Last
                                        </Button>
                                        <select aria-label="Items per page" className="ml-2 rounded border px-2 py-1 text-sm" value={pageSize}
                                            onChange={(e) => { setPageSize(Number((e.target as HTMLSelectElement).value)); setPage(0) }}>
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Edit Major Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Major Detail / Edit</DialogTitle>
                                <DialogDescription>Modify major fields and press Save to persist changes.</DialogDescription>
                            </DialogHeader>

                            <div className="mt-2 space-y-3">
                                <div>
                                    <Label htmlFor="major-name">Major Name</Label>
                                    <Input id="major-name" className="mt-2 border-slate-300" value={editMajorName}
                                        onChange={(e) => setEditMajorName((e.target as HTMLInputElement).value)} />
                                </div>

                                <div>
                                    <Label htmlFor="major-code">Major Code</Label>
                                    <Input id="major-code" className="mt-2 border-slate-300" value={editMajorCode}
                                        onChange={(e) => setEditMajorCode((e.target as HTMLInputElement).value)} />
                                </div>

                                {/* Dropdown cho Color Hex (Edit) */}
                                <div>
                                    <Label htmlFor="major-color">Color Hex</Label>
                                    <Select
                                        value={editColorHex}
                                        onValueChange={(value) => {
                                            setEditColorHex(value)
                                            // Validation khi chọn màu
                                            if (!value.trim()) {
                                                setColorError("Color hex is required.")
                                            } else if (!isValidHex(value)) {
                                                setColorError("Invalid format. Must be #FFF or #FFFFFF")
                                            } else if (isColorInUse(value)) {
                                                setColorError("This color is already in use by another major.")
                                            } else {
                                                setColorError(null)
                                            }
                                        }}
                                    >
                                        <SelectTrigger className={`mt-2 border-slate-300 ${colorError ? "border-red-500 ring-red-500" : ""}`}>
                                            <SelectValue placeholder="Select a color">
                                                {editColorHex && (
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-4 h-4 rounded border"
                                                            style={{ backgroundColor: editColorHex }}
                                                        />
                                                        <span>{editColorHex}</span>
                                                    </div>
                                                )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COLOR_OPTIONS.filter(color => {
                                                // Chỉ cho phép chọn màu chưa bị major khác sử dụng hoặc là màu hiện tại của major đang edit
                                                const normalized = (color.value || "").trim().toUpperCase();
                                                const isUsed = majors.some(m => m.id !== selected?.id && (m.colorHex || "").trim().toUpperCase() === normalized);
                                                return !isUsed || normalized === (editColorHex || "").trim().toUpperCase();
                                            }).map((color) => (
                                                <SelectItem key={color.value} value={color.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-4 h-4 rounded border"
                                                            style={{ backgroundColor: color.value }}
                                                        />
                                                        <span>{color.label} ({color.value})</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {/* Hiển thị thông báo lỗi */}
                                    {colorError && <p className="text-xs text-red-600 mt-1">{colorError}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="major-desc">Description</Label>
                                    <Textarea id="major-desc" className="mt-2 border-slate-300" value={editDescription}
                                        onChange={(e) => setEditDescription((e.target as HTMLTextAreaElement).value)} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="major-active">Change status: </Label>
                                    <input id="major-active" title="Active" type="checkbox" checked={editActive}
                                        onChange={(e) => setEditActive(e.target.checked)} className="h-4 w-4" />
                                    <Label htmlFor="major-active">Active</Label>
                                </div>

                                <div className="mt-4 flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                        Close
                                    </Button>
                                    {/* Vô hiệu hóa nút Save nếu đang lưu HOẶC có lỗi màu */}
                                    <Button onClick={handleSave} disabled={saving || !!colorError}>
                                        {saving ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Create Major Dialog (validation) */}
                    <Dialog open={createOpen} onOpenChange={handleCreateModalOpenChange}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Major</DialogTitle>
                                <DialogDescription>Enter major details and press Create.</DialogDescription>
                            </DialogHeader>

                            <div className="mt-2 space-y-3">
                                {/* Input Major Name */}
                                <div>
                                    <Label htmlFor="create-major-name">Major Name</Label>
                                    <Input
                                        id="create-major-name"
                                        className={`mt-2 border-slate-300 ${createNameError ? "border-red-500 ring-red-500" : ""
                                            }`}
                                        value={createMajorName}
                                        onChange={(e) => {
                                            setCreateMajorName(e.target.value)
                                            // Xóa lỗi ngay khi người dùng bắt đầu nhập
                                            if (e.target.value.trim()) {
                                                setCreateNameError(null)
                                            }
                                        }}
                                    />
                                    {/* Hiển thị lỗi */}
                                    {createNameError && <p className="text-xs text-red-600 mt-1">{createNameError}</p>}
                                </div>

                                {/* Input Major Code */}
                                <div>
                                    <Label htmlFor="create-major-code">Major Code</Label>
                                    <Input
                                        id="create-major-code"
                                        className={`mt-2 border-slate-300 ${createCodeError ? "border-red-500 ring-red-500" : ""
                                            }`}
                                        value={createMajorCode}
                                        onChange={(e) => {
                                            setCreateMajorCode(e.target.value)
                                            // Xóa lỗi ngay khi người dùng bắt đầu nhập
                                            if (e.target.value.trim()) {
                                                setCreateCodeError(null)
                                            }
                                        }}
                                    />
                                    {/* Hiển thị lỗi */}
                                    {createCodeError && <p className="text-xs text-red-600 mt-1">{createCodeError}</p>}
                                </div>

                                {/* Dropdown cho Color Hex (Create) */}
                                <div>
                                    <Label htmlFor="create-major-color">Color Hex</Label>
                                    <Select
                                        value={createColorHex}
                                        onValueChange={(value) => setCreateColorHex(value)}
                                    >
                                        <SelectTrigger className="mt-2 border-slate-300">
                                            <SelectValue placeholder="Select a color">
                                                {createColorHex && (
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-4 h-4 rounded border"
                                                            style={{ backgroundColor: createColorHex }}
                                                        />
                                                        <span>{createColorHex}</span>
                                                    </div>
                                                )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COLOR_OPTIONS.map((color) => (
                                                <SelectItem key={color.value} value={color.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-4 h-4 rounded border"
                                                            style={{ backgroundColor: color.value }}
                                                        />
                                                        <span>{color.label} ({color.value})</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Input Description (không đổi) */}
                                <div>
                                    <Label htmlFor="create-desc">Description</Label>
                                    <Textarea
                                        id="create-desc"
                                        className="mt-2 border-slate-300"
                                        value={createDescription}
                                        onChange={(e) => setCreateDescription((e.target as HTMLTextAreaElement).value)}
                                    />
                                </div>

                                {/* [CẬP NHẬT] Nút Cancel và Create */}
                                <div className="mt-4 flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => handleCreateModalOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            // Chạy validation
                                            let hasError = false
                                            if (!createMajorName.trim()) {
                                                setCreateNameError("Major Name is required.")
                                                hasError = true
                                            }
                                            if (!createMajorCode.trim()) {
                                                setCreateCodeError("Major Code is required.")
                                                hasError = true
                                            }

                                            if (hasError) {
                                                toast({
                                                    title: "Missing Information",
                                                    description: "Please fill in all required fields.",
                                                    variant: "destructive",
                                                })
                                                return // Dừng lại, không submit
                                            }

                                            // Nếu không lỗi, tiếp tục
                                            setCreating(true)
                                            try {
                                                const payload: CreateMajorPayload = {
                                                    name: createMajorName.trim(), // Gửi giá trị đã trim
                                                    majorCode: createMajorCode.trim(), // Gửi giá trị đã trim
                                                    description: createDescription,
                                                    colorHex: createColorHex || "#FFFFFF", // Đặt màu mặc định nếu rỗng
                                                }
                                                const res: Major = await createMajor(payload)
                                                if (res && res.id) {
                                                    toast({
                                                        title: "Created Successfully",
                                                        description: `Major "${res.name}" created with ID: ${res.id}`,
                                                    })
                                                    // Dùng hàm để đóng và reset
                                                    handleCreateModalOpenChange(false)
                                                    await reloadMajors()
                                                } else {
                                                    toast({
                                                        title: "Failure",
                                                        description:
                                                            (res && (res as any).message) ||
                                                            "Failed major creation. Invalid response from server.",
                                                        variant: "destructive",
                                                    })
                                                }
                                            } catch (err: any) {
                                                console.error("Create major failed:", err)
                                                const errorMessage =
                                                    err.response?.data?.error || err.response?.data?.message || err.message || "Error creating major."
                                                toast({
                                                    title: "Error",
                                                    description: errorMessage,
                                                    variant: "destructive",
                                                })
                                            } finally {
                                                setCreating(false)
                                            }
                                        }}
                                        // Logic disable nút
                                        disabled={
                                            creating ||
                                            !createMajorName.trim() || // Vô hiệu hóa nếu Tên rỗng
                                            !createMajorCode.trim() // Vô hiệu hóa nếu Code rỗng
                                        }
                                    >
                                        {creating ? "Creating..." : "Create"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Dialog Xác Nhận Xóa */}
                    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Delete</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete the major:
                                    <br />
                                    <span className="font-bold">{majorToDelete?.name} - {majorToDelete?.majorCode}</span>
                                    (ID: {majorToDelete?.id})?
                                    <br />
                                    This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setDeleteConfirmOpen(false)
                                        setMajorToDelete(null)
                                    }}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive" // Dùng màu đỏ
                                    onClick={handleDelete} // Gọi hàm xóa
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* [MỚI] Dialog Xác Nhận Xóa */}
                    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Delete</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete the major:
                                    <br />
                                    <span className="font-bold">
                                        {majorToDelete?.name} - {majorToDelete?.majorCode}
                                    </span>{" "}
                                    (ID: {majorToDelete?.id})?
                                    <br />
                                    This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setDeleteConfirmOpen(false)
                                        setMajorToDelete(null)
                                    }}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* View Description Dialog */}
                    <Dialog open={!!viewDescription} onOpenChange={(open) => !open && setViewDescription(null)}>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Major Description Details</DialogTitle>
                                {/* <DialogDescription>
                                    Full content of the description.
                                </DialogDescription> */}
                            </DialogHeader>

                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-md max-h-[60vh] overflow-y-auto">
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    {viewDescription}
                                </p>
                            </div>

                            <div className="flex justify-end mt-4">
                                <Button onClick={() => setViewDescription(null)} className="border-slate-300">
                                    Close
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                </div>
            </AppShell>
        </ProtectedRoute>
    )
}