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
        policyName: "",
        policyDescription: "",
        targetType: "MEMBER",
        activityType: "SESSION_ATTENDANCE", // Field mới
        conditionType: "ABSOLUTE",         // Field mới
        ruleName: "Default Rule",          // Field mới
        minThreshold: 0,                   // Thay cho minEvents
        maxThreshold: 0,                   // Field mới
        multiplier: 1,
        active: true,
        effectiveFrom: getDefaultDateTime(),
    })
    const [creating, setCreating] = useState(false)

    const reloadPolicies = () => {
        queryClient.invalidateQueries({ queryKey: ["adminMultiplierPolicies"] })
    }

    const filtered = useMemo(() => {
        if (!query) return policies;
        const q = query.toLowerCase();
        return policies.filter(
            (p) =>
                (p.policyName || "").toLowerCase().includes(q) ||
                (p.activityType || "").toLowerCase().includes(q) ||
                (p.ruleName || "").toLowerCase().includes(q)
        );
    }, [policies, query]);

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
                    description: res.message || `Policy updated: ${res.data.policyName}`,
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
                    description: res.message || `Policy created: ${res.data.policyName}`,
                })
                setCreateOpen(false)
                // reset fields
                setCreatePolicy({
                    policyName: "",
                    targetType: "MEMBER",
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
                                                <TableHead className="text-left pl-10 w-[280px]">policyName</TableHead>
                                                <TableHead className="text-left pl-10 w-[240px]">Activity</TableHead>
                                                <TableHead className="text-center w-[120px]">Target</TableHead>
                                                <TableHead className="text-center w-[160px]">Threshold (Min-Max)</TableHead>
                                                <TableHead className="text-center w-[250px]">Multiplier</TableHead>
                                                <TableHead className="text-center w-[100px]">Status</TableHead>
                                                <TableHead className="text-center w-[100px]">Action</TableHead>
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
                                                        {/* 1. Policy Name */}
                                                        {/* <TableCell className="font-medium"> */}
                                                        <TableCell className="font-medium break-words max-w-[150px]">
                                                            {p.policyName || p.id}
                                                        </TableCell>

                                                        {/* 2. Activity - Badge cho Activity Type */}
                                                        <TableCell>
                                                            <Badge variant="outline" className=" bg-cyan-500 text-white border-none flex w-fit items-center gap-1">
                                                                {p.targetType === "CLUB" ? <Users className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                                                {p.activityType}
                                                            </Badge>
                                                        </TableCell>


                                                        {/* 3. Target - Hiển thị ruleName hoặc targetType */}
                                                        <TableCell className="font-bold text-center">
                                                            <span className={
                                                                p.targetType === "MEMBER"
                                                                    ? "text-orange-500"
                                                                    : "text-cyan-600"
                                                            }>
                                                                {p.targetType}
                                                            </span>
                                                        </TableCell>

                                                        {/* 4. Threshold - Hiển thị khoảng Min-Max */}
                                                        {/* <TableCell className="text-center">
                                                            {p.minThreshold} - {p.maxThreshold}
                                                        </TableCell> */}
                                                        {/* Nếu cả hai đều trống hoặc bằng 0 tùy logic, hiện dấu gạch ngang */}
                                                        <TableCell className="text-center whitespace-nowrap">
                                                            {(!p.minThreshold && !p.maxThreshold) ? (
                                                                <span className="text-muted-foreground">-</span>
                                                            ) : (
                                                                <>
                                                                    <span className="font-medium">{p.minThreshold ?? 0}</span>
                                                                    <span className="mx-1 text-muted-foreground">-</span>
                                                                    <span className="font-medium">{p.maxThreshold || "∞"}</span>
                                                                </>
                                                            )}
                                                        </TableCell>

                                                        {/* 5. Multiplier - Tên activityType và giá trị x */}
                                                        <TableCell className="text-center">
                                                            <div className="text-xs text-muted-foreground">{p.activityType}</div>
                                                            <div className="font-bold text-blue-600">{p.multiplier}x</div>
                                                        </TableCell>

                                                        {/* 6. Action - Các nút điều khiển */}
                                                        <TableCell className="text-center">
                                                            <Badge
                                                                variant={p.active ? "default" : "destructive"}
                                                                className={p.active ? "bg-cyan-500 hover:bg-cyan-600" : "bg-red-500 hover:bg-red-600"}
                                                            >
                                                                {p.active ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {/* <div className="flex gap-2 justify-center"> */}
                                                            <div className="flex gap-2 justify-center items-center">

                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-cyan-600" onClick={() => openDetail(p)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500">
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
                                                                                <strong className="mt-2 block">{p.policyName}</strong>
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
                                {/* Pagination controls */}
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
                                <DialogTitle>Edit Multiplier Policy</DialogTitle>
                                <DialogDescription>Update the parameters for the ID policy.: {selected?.id}</DialogDescription>
                            </DialogHeader>

                            <div className="mt-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                                <div className="space-y-2">
                                    <Label>Policy Name</Label>
                                    <Input
                                        value={editPolicy.policyName || ""}
                                        onChange={(e) => handleFormChange("edit", "policyName", e.target.value)}
                                        className="border-slate-300"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Activity Type</Label>
                                        <Input disabled value={editPolicy.activityType || ""} className="bg-slate-100 border-slate-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rule Name</Label>
                                        <Input
                                            value={editPolicy.ruleName || ""}
                                            onChange={(e) => handleFormChange("edit", "ruleName", e.target.value)}
                                            className="border-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Min Threshold</Label>
                                        <Input
                                            type="number"
                                            value={editPolicy.minThreshold ?? 0}
                                            onChange={(e) => handleFormChange("edit", "minThreshold", Number(e.target.value))}
                                            className="border-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Threshold</Label>
                                        <Input
                                            type="number"
                                            value={editPolicy.maxThreshold ?? 0}
                                            onChange={(e) => handleFormChange("edit", "maxThreshold", Number(e.target.value))}
                                            className="border-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Multiplier</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={editPolicy.multiplier ?? 1}
                                            onChange={(e) => handleFormChange("edit", "multiplier", Number(e.target.value))}
                                            className="border-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Effective From</Label>
                                    <Input
                                        type="datetime-local"
                                        value={editPolicy.effectiveFrom || ""}
                                        onChange={(e) => handleFormChange("edit", "effectiveFrom", e.target.value)}
                                        className="border-slate-300 w-full max-w-[200px]"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t">
                                    <input
                                        id="edit-active-check"
                                        type="checkbox"
                                        checked={editPolicy.active || false}
                                        onChange={(e) => handleFormChange("edit", "active", e.target.checked)}
                                        className="h-4 w-4 accent-cyan-600"
                                    />
                                    <Label htmlFor="edit-active-check" className="cursor-pointer">Active Policy</Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
                                <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Create Policy Dialog */}
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Create New Multiplier Policy</DialogTitle>
                                <DialogDescription>Enter details to create a new scoring system policy.</DialogDescription>
                            </DialogHeader>

                            <div className="mt-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                                {/* Policy Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="create-policyName">Policy Name</Label>
                                    <Input
                                        id="create-policyName"
                                        placeholder="Example: Diligent Bronze Member"
                                        value={createPolicy.policyName || ""}
                                        onChange={(e) => handleFormChange("create", "policyName", e.target.value)}
                                        className="border-slate-300"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Target Type */}
                                    <div className="space-y-2">
                                        <Label>Target Type</Label>
                                        <Select
                                            value={createPolicy.targetType}
                                            onValueChange={(val) => handleFormChange("create", "targetType", val)}
                                        >
                                            <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MEMBER">MEMBER</SelectItem>
                                                <SelectItem value="CLUB">CLUB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Activity Type */}
                                    <div className="space-y-2">
                                        <Label>Activity Type</Label>
                                        <Select
                                            value={createPolicy.activityType}
                                            onValueChange={(val) => handleFormChange("create", "activityType", val)}
                                        >
                                            <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SESSION_ATTENDANCE">SESSION_ATTENDANCE</SelectItem>
                                                <SelectItem value="CLUB_EVENT_ACTIVITY">CLUB_EVENT_ACTIVITY</SelectItem>
                                                <SelectItem value="STAFF_EVALUATION">STAFF_EVALUATION</SelectItem>
                                                <SelectItem value="FINAL_SCORE">FINAL_SCORE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Rule Name (Target hiển thị trên bảng) */}
                                    <div className="space-y-2">
                                        <Label>Rule Name (Target Level)</Label>
                                        <Input
                                            placeholder="Examples: LOW, NORMAL, GOOD"
                                            value={createPolicy.ruleName || ""}
                                            onChange={(e) => handleFormChange("create", "ruleName", e.target.value)}
                                            className="border-slate-300"
                                        />
                                    </div>

                                    {/* Condition Type */}
                                    <div className="space-y-2">
                                        <Label>Condition Type</Label>
                                        <Select
                                            value={createPolicy.conditionType}
                                            onValueChange={(val) => handleFormChange("create", "conditionType", val)}
                                        >
                                            <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ABSOLUTE">ABSOLUTE</SelectItem>
                                                <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {/* Min Threshold */}
                                    <div className="space-y-2">
                                        <Label>Min Threshold</Label>
                                        <Input
                                            type="number"
                                            value={createPolicy.minThreshold || 0}
                                            onChange={(e) => handleFormChange("create", "minThreshold", Number(e.target.value))}
                                            className="border-slate-300"
                                        />
                                    </div>

                                    {/* Max Threshold */}
                                    <div className="space-y-2">
                                        <Label>Max Threshold</Label>
                                        <Input
                                            type="number"
                                            value={createPolicy.maxThreshold || 0}
                                            onChange={(e) => handleFormChange("create", "maxThreshold", Number(e.target.value))}
                                            className="border-slate-300"
                                        />
                                    </div>

                                    {/* Multiplier */}
                                    <div className="space-y-2">
                                        <Label>Multiplier (x)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={createPolicy.multiplier || 0}
                                            onChange={(e) => handleFormChange("create", "multiplier", Number(e.target.value))}
                                            className="border-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Effective From</Label>
                                    <Input
                                        type="datetime-local"
                                        value={createPolicy.effectiveFrom || ""}
                                        onChange={(e) => handleFormChange("create", "effectiveFrom", e.target.value)}
                                        className="border-slate-300 w-full max-w-[200px]"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={creating}>
                                    {creating ? "Creating..." : "Create Policy"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </AppShell>
        </ProtectedRoute>
    )
}