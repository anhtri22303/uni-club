"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AdminMultiplierPolicy, deleteAdminMultiplierPolicy, fetchAdminMultiplierPolicies, saveAdminMultiplierPolicy, } from "@/service/adminApi/adminPolicyApi"
import { useMemo, useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from "@/components/ui/dialog"
import { FileText, Eye, Trash, Plus, Percent, Users, UserCheck, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

// Định nghĩa kiểu cho TargetType
type TargetType = "CLUB" | "MEMBER"
// Lấy thời gian hiện tại cho form, định dạng YYYY-MM-DDTHH:MM
const getDefaultDateTime = () => new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

export default function AdminPoliciesPage() {
    const [query, setQuery] = useState("")
    const [selected, setSelected] = useState<AdminMultiplierPolicy | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const { toast } = useToast()
    const queryClient = useQueryClient()

    // USE REACT QUERY for admin policies
    // const {
    //     data: policies,
    //     isLoading: loading,
    //     isError,
    //     error,
    // } = useQuery({
    //     queryKey: ["adminMultiplierPolicies"],
    //     queryFn: fetchAdminMultiplierPolicies,
    //     // SỬA LỖI 1: Trích xuất `data` từ đối tượng wrapper
    //     select: (res) => res.data || [],
    //     // SỬA LỖI 2: initialData phải khớp với kiểu ApiResponse
    //     initialData: { success: true, message: "", data: [] },
    // })
    const {
        data: policies,
        isLoading: loading,
        isError,
        error,
    } = useQuery({
        queryKey: ["adminMultiplierPolicies"],
        queryFn: fetchAdminMultiplierPolicies,
        select: (res) => res.data || [],
        initialData: { success: true, message: "", data: [] },
        staleTime: 0, // <-- THÊM DÒNG NÀY
    })

    useEffect(() => {
        if (isError && error) {
            const err = error as any // Type assertion để truy cập response
            toast({
                title: "Error fetching policies",
                description: err.response?.data?.error || err.response?.data?.message || err.message,
                variant: "destructive",
            })
        }
    }, [isError, error, toast])

    // edit form state for policy detail modal
    const [saving, setSaving] = useState(false)
    const [editPolicy, setEditPolicy] = useState<Partial<AdminMultiplierPolicy>>({})
    const [createOpen, setCreateOpen] = useState(false)
    const [createPolicy, setCreatePolicy] = useState<Partial<AdminMultiplierPolicy>>({
        name: "",
        description: "",
        targetType: "MEMBER",
        levelOrStatus: "",
        minEvents: 0,
        multiplier: 1,
        active: true,
        effectiveFrom: getDefaultDateTime(),
    })
    const [creating, setCreating] = useState(false)

    const reloadPolicies = () => {
        queryClient.invalidateQueries({ queryKey: ["adminMultiplierPolicies"] })
    }

    const filtered = useMemo(() => {
        if (!query) return policies
        const q = query.toLowerCase()
        return policies.filter(
            (p) =>
                (p.name || "").toLowerCase().includes(q) ||
                (p.description || "").toLowerCase().includes(q) ||
                (p.targetType || "").toLowerCase().includes(q) ||
                (p.levelOrStatus || "").toLowerCase().includes(q),
        )
    }, [policies, query])

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

    const openDetail = (p: AdminMultiplierPolicy) => {
        setSelected(p)
        setEditPolicy({
            ...p,
            // Chuyển đổi ISO string (UTC) sang định dạng datetime-local (YYYY-MM-DDTHH:MM)
            effectiveFrom: p.effectiveFrom ? new Date(new Date(p.effectiveFrom).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : getDefaultDateTime(),
        })
        setDialogOpen(true)
    }
    const handleFormChange = (
        form: "create" | "edit",
        field: keyof AdminMultiplierPolicy,
        value: string | number | boolean,
    ) => {
        if (form === "create") {
            setCreatePolicy((prev) => ({ ...prev, [field]: value }))
        } else {
            setEditPolicy((prev) => ({ ...prev, [field]: value }))
        }
    }

    const handleSave = async () => {
        if (!selected || !editPolicy) return
        setSaving(true)
        try {
            const payload: AdminMultiplierPolicy = {
                ...(selected as AdminMultiplierPolicy), // Giữ lại các trường không chỉnh sửa (updatedBy, updatedAt...)
                ...(editPolicy as AdminMultiplierPolicy), // Ghi đè các trường đã chỉnh sửa
                id: selected.id,
                // Chuyển đổi datetime-local string về ISO string (UTC)
                effectiveFrom: new Date(editPolicy.effectiveFrom || getDefaultDateTime()).toISOString(),
            }

            const res = await saveAdminMultiplierPolicy(payload)

            if (res.success) {
                toast({
                    title: "Update successful",
                    description: res.message || `Policy updated: ${res.data.name}`,
                })
                setSelected(res.data)
                setDialogOpen(false)
                reloadPolicies()
            } else {
                throw new Error(res.message)
            }
        } catch (err: any) {
            console.error("Update policy failed:", err)
            toast({ title: "Error", description: err.message || "Error updating policy.", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleCreate = async () => {
        setCreating(true)
        try {
            const payload: Partial<AdminMultiplierPolicy> = {
                ...createPolicy,
                id: 0,
                // Chuyển đổi datetime-local string về ISO string (UTC)
                effectiveFrom: new Date(createPolicy.effectiveFrom || getDefaultDateTime()).toISOString(),
                active: true,
            }

            const res = await saveAdminMultiplierPolicy(payload as AdminMultiplierPolicy) // Gửi dưới dạng full object

            if (res.success) {
                toast({
                    title: "Create success",
                    description: res.message || `Policy created: ${res.data.name}`,
                })
                setCreateOpen(false)
                // reset fields
                setCreatePolicy({
                    name: "",
                    description: "",
                    targetType: "MEMBER",
                    levelOrStatus: "",
                    minEvents: 0,
                    multiplier: 1,
                    active: true,
                    effectiveFrom: getDefaultDateTime(),
                })
                await reloadPolicies()
            } else {
                throw new Error(res.message)
            }
        } catch (err: any) {
            console.error("Create policy failed:", err)
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Error creating policy."
            toast({ title: "Error", description: errorMsg, variant: "destructive" })
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (policyId: number) => {
        try {
            const res = await deleteAdminMultiplierPolicy(policyId)
            if (res.success) {
                toast({ title: "Delete successful", description: res.message || "Policy has been deleted." })
                if (selected?.id === policyId) setDialogOpen(false)
                await reloadPolicies()
            } else {
                throw new Error(res.message)
            }
        } catch (err: any) {
            console.error("Delete policy failed:", err)
            toast({ title: "Error", description: err.message || "Error deleting policy.", variant: "destructive" })
        }
    }

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <AppShell>
                <div className="space-y-6 p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Multiplier Policy Management</h1>
                            <p className="text-muted-foreground">Manage scoring multiplier policies for Clubs and Members</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Card đếm số lượng */}
                            <div className="w-24 h-24">
                                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 h-full">
                                    <CardContent className="p-2 h-full flex flex-col justify-center">
                                        <div className="text-[10px] font-medium text-blue-700 dark:text-blue-300 mb-1">
                                            Total Policies
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-blue-500 rounded-md">
                                                <FileText className="h-3 w-3 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-blue-900 dark:text-blue-100">
                                                    {policies.length}
                                                </div>
                                                <p className="text-[10px] text-blue-600 dark:text-blue-400">Policies</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="relative w-full max-w-sm">
                                <Input
                                    placeholder="Search policies"
                                    value={query}
                                    onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
                                    className="pr-12 bg-white dark:bg-slate-800 rounded-md px-3 py-2 shadow-sm border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />

                                {/* Nút X (Clear) nằm đè lên Input */}
                                {query && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setQuery("")}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>

                            <Button
                                size="sm"
                                className="ml-2"
                                onClick={() => setCreateOpen(true)}
                                title="Create policy"
                            >
                                Create policy
                                <Plus className="h-4 w-4 ml-1" />
                            </Button>

                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Multiplier Policy List</CardTitle>
                            <CardDescription>
                                Showing {filtered.length} of {policies.length} policies
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="w-full overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[3rem] text-center">ID</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="w-[8rem]">Target</TableHead>
                                                <TableHead className="w-[10rem]">Level/Status</TableHead>
                                                <TableHead className="w-[8rem] text-center">Min Events</TableHead>
                                                <TableHead className="w-[8rem] text-center">Multiplier</TableHead>
                                                <TableHead className="w-[8rem] text-center">Status</TableHead>
                                                <TableHead className="w-[6rem] text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                [...Array(5)].map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell colSpan={8} className="p-2">
                                                            <Skeleton className="h-10 w-full" />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : filtered.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="p-6 text-center">
                                                        No policies found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginated.map((p, idx) => (
                                                    <TableRow
                                                        key={p.id}
                                                        className={`${idx % 2 === 0
                                                            ? "bg-white dark:bg-slate-900"
                                                            : "bg-slate-50 dark:bg-slate-800"
                                                            } hover:bg-slate-100 dark:hover:bg-slate-700`}
                                                    >
                                                        <TableCell className="text-sm text-muted-foreground text-center">
                                                            {p.id}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-primary/90">
                                                            {p.name || "(No name)"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={p.targetType === "CLUB" ? "default" : "secondary"}>
                                                                {p.targetType === "CLUB" ? <Users className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                                                                {p.targetType}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {p.levelOrStatus}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-center">
                                                            {p.minEvents}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-center font-bold text-blue-600">
                                                            {p.multiplier}x
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={p.active ? "default" : "destructive"}>
                                                                {p.active ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2 justify-center">
                                                                <Button size="sm" onClick={() => openDetail(p)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>

                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button size="sm" variant="destructive">
                                                                            <Trash className="h-4 w-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>
                                                                                Are you sure you want to delete?
                                                                            </AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                This action cannot be undone. The following policy will be
                                                                                permanently deleted:
                                                                                <br />
                                                                                <strong className="mt-2 block">{p.name}</strong>
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction asChild>
                                                                                <Button
                                                                                    variant="destructive"
                                                                                    onClick={() => handleDelete(p.id)}
                                                                                >
                                                                                    Continue
                                                                                </Button>
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                {/* Pagination controls (Giữ nguyên) */}
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div>Showing</div>
                                        <div className="font-medium">
                                            {filtered.length === 0 ? 0 : page * pageSize + 1}
                                        </div>
                                        <div>to</div>
                                        <div className="font-medium">
                                            {Math.min((page + 1) * pageSize, filtered.length)}
                                        </div>
                                        <div>of</div>
                                        <div className="font-medium">{filtered.length}</div>
                                        <div>policies</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setPage(0)}
                                            disabled={page === 0}
                                        >
                                            First
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                                            disabled={page === 0}
                                        >
                                            Prev
                                        </Button>
                                        <div className="px-2 text-sm">
                                            Page {filtered.length === 0 ? 0 : page + 1} /{" "}
                                            {Math.max(1, Math.ceil(filtered.length / pageSize))}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.min(p + 1, Math.max(0, Math.ceil(filtered.length / pageSize) - 1)),
                                                )
                                            }
                                            disabled={(page + 1) * pageSize >= filtered.length}
                                        >
                                            Next
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setPage(Math.max(0, Math.ceil(filtered.length / pageSize) - 1))
                                            }
                                            disabled={(page + 1) * pageSize >= filtered.length}
                                        >
                                            Last
                                        </Button>
                                        <select
                                            aria-label="Items per page"
                                            className="ml-2 rounded border px-2 py-1 text-sm"
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(Number((e.target as HTMLSelectElement).value))
                                                setPage(0)
                                            }}
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Edit Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Policy Detail / Edit</DialogTitle>
                                <DialogDescription>
                                    Modify policy fields and press Save to persist changes.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Policy Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={editPolicy.name || ""}
                                        onChange={(e) => handleFormChange("edit", "name", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-desc">Description</Label>
                                    <Textarea
                                        id="edit-desc"
                                        value={editPolicy.description || ""}
                                        onChange={(e) => handleFormChange("edit", "description", e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-targetType">Target Type</Label>
                                        <Select
                                            value={editPolicy.targetType || "MEMBER"}
                                            onValueChange={(value) => handleFormChange("edit", "targetType", value)}
                                        >
                                            <SelectTrigger id="edit-targetType">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MEMBER">MEMBER</SelectItem>
                                                <SelectItem value="CLUB">CLUB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-levelOrStatus">Level or Status</Label>
                                        <Input
                                            id="edit-levelOrStatus"
                                            placeholder="e.g., BRONZE, SILVER..."
                                            value={editPolicy.levelOrStatus || ""}
                                            onChange={(e) => handleFormChange("edit", "levelOrStatus", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-minEvents">Min. Events</Label>
                                        <Input
                                            id="edit-minEvents"
                                            type="number"
                                            value={editPolicy.minEvents || 0}
                                            onChange={(e) => handleFormChange("edit", "minEvents", Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-multiplier">Multiplier</Label>
                                        <Input
                                            id="edit-multiplier"
                                            type="number"
                                            step="0.1"
                                            value={editPolicy.multiplier || 1}
                                            onChange={(e) => handleFormChange("edit", "multiplier", Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-effectiveFrom">Effective From</Label>
                                    <Input
                                        id="edit-effectiveFrom"
                                        type="datetime-local"
                                        value={editPolicy.effectiveFrom || ""}
                                        onChange={(e) => handleFormChange("edit", "effectiveFrom", e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        id="edit-active"
                                        type="checkbox"
                                        checked={editPolicy.active || false}
                                        onChange={(e) => handleFormChange("edit", "active", e.target.checked)}
                                        className="h-4 w-4"
                                        title="Mark policy as active"
                                    />
                                    <Label htmlFor="edit-active">Active</Label>
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Close
                                </Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving..." : "Save"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Create Policy Dialog */}
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Create Policy</DialogTitle>
                                <DialogDescription>Enter policy details and press Create.</DialogDescription>
                            </DialogHeader>

                            <div className="mt-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                                <div className="space-y-2">
                                    <Label htmlFor="create-name">Policy Name</Label>
                                    <Input
                                        id="create-name"
                                        placeholder="e.g., Bronze Member Bonus"
                                        value={createPolicy.name || ""}
                                        onChange={(e) => handleFormChange("create", "name", e.target.value)}
                                        className="border-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="create-desc">Description</Label>
                                    <Textarea
                                        id="create-desc"
                                        placeholder="Policy for rewarding bronze members..."
                                        value={createPolicy.description || ""}
                                        onChange={(e) => handleFormChange("create", "description", e.target.value)}
                                        className="border-slate-300"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="create-targetType">Target Type</Label>
                                        <Select
                                            value={createPolicy.targetType || "MEMBER"}
                                            onValueChange={(value) => handleFormChange("create", "targetType", value)}
                                        >
                                            <SelectTrigger id="create-targetType" className="border-slate-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MEMBER">MEMBER</SelectItem>
                                                <SelectItem value="CLUB">CLUB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="create-levelOrStatus">Level or Status</Label>
                                        <Input
                                            id="create-levelOrStatus"
                                            placeholder="e.g., BRONZE, SILVER..."
                                            value={createPolicy.levelOrStatus || ""}
                                            onChange={(e) => handleFormChange("create", "levelOrStatus", e.target.value)}
                                            className="border-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="create-minEvents">Min. Events</Label>
                                        <Input
                                            id="create-minEvents"
                                            type="number"
                                            value={createPolicy.minEvents || 0}
                                            onChange={(e) => handleFormChange("create", "minEvents", Number(e.target.value))}
                                            className="border-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="create-multiplier">Multiplier</Label>
                                        <Input
                                            id="create-multiplier"
                                            type="number"
                                            step="0.1"
                                            value={createPolicy.multiplier || 1}
                                            onChange={(e) => handleFormChange("create", "multiplier", Number(e.target.value))}
                                            className="border-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="create-effectiveFrom">Effective From</Label>
                                    <Input
                                        id="create-effectiveFrom"
                                        type="datetime-local"
                                        value={createPolicy.effectiveFrom || ""}
                                        onChange={(e) => handleFormChange("create", "effectiveFrom", e.target.value)}
                                        className="border-slate-300"
                                    />
                                </div>

                                {/* 'Active' is true by default on create */}
                            </div>

                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={creating}>
                                    {creating ? "Creating..." : "Create"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </AppShell>
        </ProtectedRoute>
    )
}