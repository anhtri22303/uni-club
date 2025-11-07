"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Major, deleteMajorById, updateMajorById, createMajor } from "@/service/majorApi"
import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { BookMarked, Search, Eye, Trash, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useMajors } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

export default function UniStaffMajorsPage() {
    const [query, setQuery] = useState("")
    const [selected, setSelected] = useState<Major | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
    const queryClient = useQueryClient()
    // ✅ USE REACT QUERY for majors
    const { data: majors = [], isLoading: loading } = useMajors()
    // edit form state for major detail modal
    const [editMajorName, setEditMajorName] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editActive, setEditActive] = useState<boolean>(true)
    const [saving, setSaving] = useState(false)
    const [editMajorCode, setEditMajorCode] = useState("")
    // create modal state
    const [createOpen, setCreateOpen] = useState(false)
    const [createMajorName, setCreateMajorName] = useState("")
    const [createDescription, setCreateDescription] = useState("")
    const [creating, setCreating] = useState(false)
    const [createMajorCode, setCreateMajorCode] = useState("")
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [majorToDelete, setMajorToDelete] = useState<Major | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const reloadMajors = () => {
        queryClient.invalidateQueries({ queryKey: ["majors"] })
    }

    const filtered = useMemo(() => {
        if (!query) return majors
        const q = query.toLowerCase()
        // ✅ Lọc theo tên hoặc mô tả major
        return majors.filter((m) =>
            (m.name || "").toLowerCase().includes(q) ||
            (m.description || "").toLowerCase().includes(q) ||
            (m.majorCode || "").toLowerCase().includes(q)
        )
    }, [majors, query])

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
        // populate edit fields
        setEditMajorName(m.name || "")
        setEditMajorCode(m.majorCode || "")
        setEditDescription(m.description || "")
        setEditActive(m.active)
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!selected) return
        setSaving(true)
        try {
            // ✅ Payload cho major
            const payload = {
                name: editMajorName,
                description: editDescription,
                majorCode: editMajorCode,
                active: editActive,
            }
            // ✅ Gọi API update major
            const res: any = await updateMajorById(selected.id, payload)
            if (res && (res.success || res.updated || res.data)) {
                toast({ title: (res && res.message) || 'Update successful', description: '' })
                const updated = (res && res.data) ? res.data : { ...selected, ...payload }
                setSelected(updated as Major)
                // ✅ Refresh list
                reloadMajors()
            } else {
                toast({ title: 'Failure', description: (res && res.message) || 'Major update failed.' })
            }
        } catch (err) {
            console.error('Update major failed:', err)
            toast({ title: 'Error', description: 'Error while updating major.' })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!majorToDelete) return
        setIsDeleting(true)
        try {
            const res: any = await deleteMajorById(majorToDelete.id)
            if (res && (res.success === true || res.deleted)) {
                toast({ title: res.message || 'Deleted', description: '' })
                if (selected?.id === majorToDelete.id) setDialogOpen(false) // Đóng dialog edit nếu đang edit
                await reloadMajors()
                try { router.refresh() } catch (e) { /* ignore */ }
            } else {
                toast({ title: 'Failure', description: (res && res.message) || 'Major deletion failed.' })
            }
        } catch (err) {
            console.error('Delete major failed:', err)
            toast({ title: 'Error', description: 'Error deleting major.' })
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
                                        <div className="text-[10px] font-medium text-blue-700 dark:text-blue-300 mb-1">Total Majors</div>
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
                                <Input
                                    placeholder="Search majors"
                                    value={query}
                                    onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
                                    className="max-w-sm bg-white dark:bg-slate-800 rounded-md px-3 py-2 shadow-sm border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                                <Button onClick={() => { setQuery("") }} variant="ghost">Clear</Button>
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
                            {/* ✅ Cập nhật description */}
                            <CardDescription>Showing {filtered.length} of {majors.length} majors</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="w-full overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {/* ✅ Cập nhật cột cho Major */}
                                                <TableHead className="w-[4rem] text-center">ID</TableHead>
                                                <TableHead>Major Name</TableHead>
                                                <TableHead className="w-[7rem] text-center">Major Code</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="w-[6rem] text-center">Status</TableHead>
                                                <TableHead className="w-[6rem] text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    {/* ✅ Cập nhật colSpan */}
                                                    <TableCell colSpan={6} className="p-6 text-center">Loading...</TableCell>
                                                </TableRow>
                                            ) : filtered.length === 0 ? (
                                                <TableRow>
                                                    {/* ✅ Cập nhật colSpan và text */}
                                                    <TableCell colSpan={6} className="p-6 text-center">No majors found</TableCell>
                                                </TableRow>
                                            ) : (
                                                // ✅ Lặp qua m (major)
                                                paginated.map((m, idx) => (
                                                    <TableRow
                                                        key={m.id}
                                                        className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'} hover:bg-slate-100 dark:hover:bg-slate-700`}
                                                    >
                                                        <TableCell className="text-sm text-muted-foreground text-center">{m.id}</TableCell>
                                                        <TableCell className="font-medium text-primary/90">{m.name}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground text-center">{m.majorCode || "—"}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{m.description || "—"}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={m.active ? "default" : "destructive"}>{m.active ? "Active" : "Inactive"}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2 justify-center">
                                                                {/* ✅ openDetail(m) */}
                                                                <Button size="sm" onClick={() => openDetail(m)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    // ✅ [THAY ĐỔI] Mở dialog xác nhận
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
                                        <div>majors</div> {/* ✅ Cập nhật text */}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => setPage(0)} disabled={page === 0}>First</Button>
                                        <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
                                        <div className="px-2 text-sm">Page {filtered.length === 0 ? 0 : page + 1} / {Math.max(1, Math.ceil(filtered.length / pageSize))}</div>
                                        <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(p + 1, Math.max(0, Math.ceil(filtered.length / pageSize) - 1)))} disabled={(page + 1) * pageSize >= filtered.length}>Next</Button>
                                        <Button size="sm" variant="outline" onClick={() => setPage(Math.max(0, Math.ceil(filtered.length / pageSize) - 1))} disabled={(page + 1) * pageSize >= filtered.length}>Last</Button>
                                        <select aria-label="Items per page" className="ml-2 rounded border px-2 py-1 text-sm" value={pageSize} onChange={(e) => { setPageSize(Number((e.target as HTMLSelectElement).value)); setPage(0) }}>
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ✅ Edit Major Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Major Detail / Edit</DialogTitle>
                                <DialogDescription>Modify major fields and press Save to persist changes.</DialogDescription>
                            </DialogHeader>

                            <div className="mt-2 space-y-3">
                                <div>
                                    <Label htmlFor="major-name">Major Name</Label>
                                    <Input id="major-name" className="mt-2 border-slate-300" value={editMajorName} onChange={(e) => setEditMajorName((e.target as HTMLInputElement).value)} />
                                </div>

                                <div>
                                    <Label htmlFor="major-code">Major Code</Label>
                                    <Input id="major-code" className="mt-2 border-slate-300" value={editMajorCode} onChange={(e) => setEditMajorCode((e.target as HTMLInputElement).value)} />
                                </div>

                                <div>
                                    <Label htmlFor="major-desc">Description</Label>
                                    <Textarea id="major-desc" className="mt-2 border-slate-300" value={editDescription} onChange={(e) => setEditDescription((e.target as HTMLTextAreaElement).value)} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="major-active">Change status: </Label>
                                    <input id="major-active" title="Active" type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="h-4 w-4" />
                                    <Label htmlFor="major-active">Active</Label>
                                </div>

                                <div className="mt-4 flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
                                    <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* ✅ Create Major Dialog */}
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Major</DialogTitle>
                                <DialogDescription>Enter major details and press Create.</DialogDescription>
                            </DialogHeader>

                            <div className="mt-2 space-y-3">
                                <div>
                                    <Label htmlFor="create-major-name">Major Name</Label>
                                    <Input id="create-major-name" className="mt-2 border-slate-300" value={createMajorName} onChange={(e) => setCreateMajorName((e.target as HTMLInputElement).value)} />
                                </div>

                                <div>
                                    <Label htmlFor="create-major-code">Major Code</Label>
                                    <Input id="create-major-code" className="mt-2 border-slate-300" value={createMajorCode} onChange={(e) => setCreateMajorCode((e.target as HTMLInputElement).value)} />
                                </div>

                                <div>
                                    <Label htmlFor="create-desc">Description</Label>
                                    <Textarea id="create-desc" className="mt-2 border-slate-300" value={createDescription} onChange={(e) => setCreateDescription((e.target as HTMLTextAreaElement).value)} />
                                </div>

                                <div className="mt-4 flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                    <Button onClick={async () => {
                                        setCreating(true)
                                        try {
                                            // ✅ Payload cho create major
                                            const payload = {
                                                id: 0,
                                                name: createMajorName,
                                                majorCode: createMajorCode,
                                                description: createDescription,
                                                active: true // Mặc định là active khi tạo mới
                                            }
                                            // ✅ Gọi API createMajor
                                            const res: Major = await createMajor(payload as any)
                                            if (res && res.id) { // Nếu có res và res.id (khác 0) nghĩa là tạo thành công
                                                toast({ title: 'Created Successfully', description: `Major "${res.name}" created with ID: ${res.id}` })
                                                setCreateOpen(false)
                                                // ✅ Reset form state
                                                setCreateMajorName("")
                                                setCreateMajorCode("")
                                                setCreateDescription("")
                                                await reloadMajors()
                                            } else {
                                                // Trường hợp API trả về cấu trúc lỗi khác hoặc không có ID
                                                toast({
                                                    title: 'Failure',
                                                    description: (res && (res as any).message) || 'Failed major creation. Invalid response from server.',
                                                    variant: "destructive"
                                                })
                                            }
                                        } catch (err: any) {
                                            console.error('Create major failed:', err)
                                            // toast({ title: 'Error', description: 'Error creating major.' })
                                            const errorMessage = err.response?.data?.message || err.message || 'Error creating major.'
                                            toast({
                                                title: 'Error',
                                                description: errorMessage,
                                                variant: "destructive"
                                            })
                                        } finally {
                                            setCreating(false)
                                        }
                                    }} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* ✅ [MỚI] Dialog Xác Nhận Xóa */}
                    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Delete</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete the major:
                                    <br />
                                    <span className="font-bold">{majorToDelete?.name} - {majorToDelete?.majorCode}</span> (ID: {majorToDelete?.id})?
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

                </div>
            </AppShell>
        </ProtectedRoute>
    )
}