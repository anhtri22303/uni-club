"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
    Search, Trash, Upload, Users, FileSpreadsheet, AlertTriangle, RefreshCcw, X, Filter, Plus, Pencil, CheckCircle2
} from "lucide-react"
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
// Import API functions
import {
    getAllStudentRegistry, deleteStudentFromRegistry, deleteAllStudentRegistry, uploadStudentRegistry,
    createStudentManual, updateStudentRegistry,
    StudentRegistryItem, UploadRegistryResult
} from "@/service/studentCodeApi"

export default function UniStaffStudentRegistryPage() {
    // Search State
    const [query, setQuery] = useState("")

    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Pagination
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)

    // --- STATES FOR FILTER ---
    const [selectedMajor, setSelectedMajor] = useState<string>("all")
    const [selectedIntake, setSelectedIntake] = useState<string>("all")
    const [sortOption, setSortOption] = useState<string>("default")

    // --- STATES FOR ACTIONS ---
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [studentToDelete, setStudentToDelete] = useState<StudentRegistryItem | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const [deleteAllOpen, setDeleteAllOpen] = useState(false)
    const [isDeletingAll, setIsDeletingAll] = useState(false)

    // Upload & Result States
    const [uploadOpen, setUploadOpen] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [importResultOpen, setImportResultOpen] = useState(false)
    const [importResultData, setImportResultData] = useState<UploadRegistryResult | null>(null)

    const [addManualOpen, setAddManualOpen] = useState(false)
    const [newStudentCode, setNewStudentCode] = useState("")
    const [newStudentName, setNewStudentName] = useState("")
    const [isAdding, setIsAdding] = useState(false)

    // --- STATE CHO EDIT ---
    const [editOpen, setEditOpen] = useState(false)
    const [editingStudent, setEditingStudent] = useState<StudentRegistryItem | null>(null)
    const [editName, setEditName] = useState("")
    const [editStudentCode, setEditStudentCode] = useState("") // Cập nhật: Thêm state cho edit MSSV
    const [isUpdating, setIsUpdating] = useState(false)

    // --- DATA FETCHING (CLIENT-SIDE SEARCH STRATEGY) ---
    const { data: students = [], isLoading: loading, isFetching } = useQuery({
        queryKey: ["student-registry-all"],
        queryFn: getAllStudentRegistry,
        staleTime: 1000 * 60 * 5,
    })

    // --- EXTRACT FILTER OPTIONS ---
    const uniqueMajors = useMemo(() => {
        const majors = new Set(students.map(s => s.majorCode).filter(Boolean))
        return Array.from(majors).sort()
    }, [students])

    const uniqueIntakes = useMemo(() => {
        const intakes = new Set(students.map(s => s.intake).filter(Boolean))
        return Array.from(intakes).sort((a, b) => (a as number) - (b as number))
    }, [students])

    // --- FILTER & SORT LOGIC ---
    const filteredAndSortedStudents = useMemo(() => {
        let result = [...students]

        // 1. Search Logic
        if (query.trim()) {
            const lowerQuery = query.toLowerCase().trim()
            result = result.filter(s =>
                s.fullName.toLowerCase().includes(lowerQuery) ||
                s.studentCode.toLowerCase().includes(lowerQuery)
            )
        }

        // 2. Filter Logic
        if (selectedMajor !== "all") {
            result = result.filter(s => s.majorCode === selectedMajor)
        }
        if (selectedIntake !== "all") {
            result = result.filter(s => String(s.intake) === selectedIntake)
        }

        // 3. Sort Logic
        return result.sort((a, b) => {
            if (sortOption === 'intake_asc') return (a.intake || 0) - (b.intake || 0)
            if (sortOption === 'intake_desc') return (b.intake || 0) - (a.intake || 0)

            const majorA = (a.majorCode || '').toLowerCase()
            const majorB = (b.majorCode || '').toLowerCase()
            if (majorA !== majorB) return majorA.localeCompare(majorB)

            const numA = a.studentCode.slice(-4)
            const numB = b.studentCode.slice(-4)
            return numA.localeCompare(numB)
        })
    }, [students, query, selectedMajor, selectedIntake, sortOption])

    // --- PAGINATION ---
    const paginatedStudents = useMemo(() => {
        const start = page * pageSize
        return filteredAndSortedStudents.slice(start, start + pageSize)
    }, [filteredAndSortedStudents, page, pageSize])

    useEffect(() => { setPage(0) }, [query, selectedMajor, selectedIntake])

    const clearFilters = () => {
        setSelectedMajor("all")
        setSelectedIntake("all")
        setSortOption("default")
        setQuery("")
    }

    // --- HANDLERS ---
    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ["student-registry-all"] })
        toast({ title: "Refreshed", description: "Student list updated." })
    }

    const handleUploadSubmit = async () => {
        if (!uploadFile) {
            toast({ title: "Error", description: "Please select a file.", variant: "destructive" })
            return
        }
        setIsUploading(true)
        try {
            const result = await uploadStudentRegistry(uploadFile)
            setUploadOpen(false)
            setUploadFile(null)
            setImportResultData(result)
            setImportResultOpen(true)
            handleRefresh()
        } catch (error: any) {
            toast({
                title: "Import Failed",
                description: error.message || "Failed to upload file.",
                variant: "destructive"
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleCreateManual = async () => {
        if (!newStudentCode.trim() || !newStudentName.trim()) {
            toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" })
            return
        }
        setIsAdding(true)
        try {
            await createStudentManual({
                studentCode: newStudentCode.toUpperCase(),
                fullName: newStudentName
            })
            toast({ title: "Success", description: `Added student ${newStudentCode.toUpperCase()}` })
            setAddManualOpen(false)
            setNewStudentCode("")
            setNewStudentName("")
            handleRefresh()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsAdding(false)
        }
    }

    // --- 3. EDIT (CẬP NHẬT) ---
    const openEditDialog = (student: StudentRegistryItem) => {
        setEditingStudent(student)
        setEditName(student.fullName)
        setEditStudentCode(student.studentCode) // Set giá trị MSSV hiện tại
        setEditOpen(true)
    }

    const handleUpdateStudent = async () => {
        if (!editingStudent || !editingStudent.id) return
        if (!editName.trim() || !editStudentCode.trim()) {
            toast({ title: "Error", description: "Full name and Student Code cannot be empty.", variant: "destructive" })
            return
        }
        setIsUpdating(true)
        try {
            await updateStudentRegistry({
                id: editingStudent.id,
                studentCode: editStudentCode.toUpperCase(), // Gửi thêm studentCode
                fullName: editName
            })
            toast({ title: "Updated", description: `Updated info for ${editStudentCode}` })
            setEditOpen(false)
            setEditingStudent(null)
            handleRefresh()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDeleteSingle = async () => {
        if (!studentToDelete) return
        setIsDeleting(true)
        try {
            await deleteStudentFromRegistry({ code: studentToDelete.studentCode })
            toast({ title: "Deleted", description: `Removed student ${studentToDelete.studentCode}` })
            setDeleteConfirmOpen(false)
            setStudentToDelete(null)
            handleRefresh()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDeleteAll = async () => {
        setIsDeletingAll(true)
        try {
            await deleteAllStudentRegistry()
            toast({ title: "System Cleared", description: "All student registry data has been deleted." })
            setDeleteAllOpen(false)
            handleRefresh()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsDeletingAll(false)
        }
    }

    return (
        <ProtectedRoute allowedRoles={["uni_staff"]}>
            <AppShell>
                <div className="space-y-6 p-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Users className="h-8 w-8 text-primary" />
                                Student Registry
                            </h1>
                            <p className="text-muted-foreground">Manage official student IDs (MSSV) for authentication.</p>
                        </div>
                        <div className="hidden md:block h-20">
                            <Card className="border-0 shadow-sm bg-primary/5 h-full">
                                <CardContent className="p-3 h-full flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-full">
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-primary">{students.length}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Total Student Codes</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                            <div className="relative w-full sm:w-[300px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search name or student code..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="pl-9 pr-12 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                                />
                                {query && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setQuery("")}
                                        type="button"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full sm:w-auto gap-2 border-slate-300 dark:border-slate-700 hover:border-slate-400 
                                    dark:hover:border-slate-600 bg-white dark:bg-slate-950">
                                        <Filter className="h-4 w-4" />
                                        Filters & Sort
                                        {(selectedMajor !== "all" || selectedIntake !== "all" || sortOption !== "default") && (
                                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                                {(selectedMajor !== "all" ? 1 : 0) + (selectedIntake !== "all" ? 1 : 0) + (sortOption !== "default" ? 1 : 0)}
                                            </Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-4" align="start">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium leading-none">Filter Registry Information</h4>
                                            <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2 py-1"
                                                onClick={clearFilters}>
                                                Clear all
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[300px] md:min-w-[600px]">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Major</Label>
                                                <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                                                    <SelectTrigger className="border-slate-300"><SelectValue placeholder="All Majors" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Majors</SelectItem>
                                                        {uniqueMajors.map((m) => (<SelectItem key={m as string} value={m as string}>{m as string}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Intake</Label>
                                                <Select value={selectedIntake} onValueChange={setSelectedIntake}>
                                                    <SelectTrigger className="border-slate-300"><SelectValue placeholder="All Intakes" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Intakes</SelectItem>
                                                        {uniqueIntakes.map((i) => (<SelectItem key={i as number} value={String(i)}>K{i as number}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Sort</Label>
                                                <Select value={sortOption} onValueChange={setSortOption}>
                                                    <SelectTrigger className="border-slate-300"><SelectValue placeholder="Default Sort" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="default">Default (A-Z)</SelectItem>
                                                        <SelectItem value="intake_asc">Intake: Low → High</SelectItem>
                                                        <SelectItem value="intake_desc">Intake: High → Low</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            {isFetching && <RefreshCcw className="h-4 w-4 animate-spin text-muted-foreground" />}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
                            <Button variant="outline" onClick={handleRefresh} title="Refresh Data"><RefreshCcw className="h-4 w-4" /></Button>
                            <Button variant="outline" onClick={() => setAddManualOpen(true)} className="bg-white dark:bg-slate-950"><Plus className="h-4 w-4 mr-2" />Add Manual</Button>
                            <Button onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4 mr-2" />Import CSV</Button>
                            <Button variant="destructive" onClick={() => setDeleteAllOpen(true)} className="hidden md:flex"><Trash className="h-4 w-4 mr-2" />Delete All</Button>
                        </div>
                    </div>

                    {/* Table Section */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Registry List</CardTitle>
                            <CardDescription>Showing {paginatedStudents.length} of {filteredAndSortedStudents.length} students</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 dark:bg-slate-900">
                                            <TableHead className="w-[180px] text-center pl-12">Student Code</TableHead>
                                            <TableHead className="text-center">Full Name</TableHead>
                                            <TableHead className="w-[150px] text-center">Major Code</TableHead>
                                            <TableHead className="w-[150px] text-center">Intake</TableHead>
                                            <TableHead className="w-[150px] text-center pr-12">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            [...Array(5)].map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : paginatedStudents.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                    {query ? "No students found matching your search." : "No students found in registry."}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedStudents.map((s) => (
                                                <TableRow key={s.studentCode}>
                                                    <TableCell className="font-medium text-center pl-12">{s.studentCode}</TableCell>
                                                    <TableCell className="font-medium pl-20">{s.fullName}</TableCell>
                                                    <TableCell className="text-center">
                                                        {s.majorCode ? <Badge variant="outline">{s.majorCode}</Badge> : <span className="text-muted-foreground text-xs italic">N/A</span>}
                                                    </TableCell>
                                                    <TableCell className="text-center">{s.intake ? `K${s.intake}` : "—"}</TableCell>
                                                    <TableCell className="text-center pr-12">
                                                        <div className="flex items-center justify-end gap-5">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => openEditDialog(s)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => { setStudentToDelete(s); setDeleteConfirmOpen(true); }}>
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
                            {filteredAndSortedStudents.length > 0 && (
                                <div className="flex items-center justify-between space-x-2 py-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {page + 1} of {Math.ceil(filteredAndSortedStudents.length / pageSize)}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                                        <Button variant="outline" size="sm" onClick={() =>
                                            setPage(p => Math.min(Math.ceil(filteredAndSortedStudents.length / pageSize) - 1, p + 1))}
                                            disabled={page >= Math.ceil(filteredAndSortedStudents.length / pageSize) - 1}
                                        >
                                            Next
                                        </Button>
                                        <select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={pageSize}
                                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} aria-label="Rows per page">
                                            <option value={10}>10</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* --- MODAL: IMPORT RESULT --- */}
                    <Dialog open={importResultOpen} onOpenChange={setImportResultOpen}>
                        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                    Import Successful
                                </DialogTitle>
                                <DialogDescription>
                                    {importResultData?.total !== undefined ? (
                                        <>
                                            Processed {importResultData.total} rows.
                                            Imported: <strong>{importResultData.imported ?? importResultData.newRecords.length}</strong>.
                                            Skipped: <span className="text-orange-600 font-bold">{importResultData.skipped ?? '0'}</span>.
                                        </>
                                    ) : (
                                        <>
                                            Successfully imported <strong>{importResultData?.newRecords.length}</strong> new student codes.
                                        </>
                                    )}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 overflow-auto py-2">
                                <h4 className="text-sm font-semibold mb-2">New Students Added:</h4>
                                {importResultData?.newRecords && importResultData.newRecords.length > 0 ? (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50">
                                                    <TableHead>MSSV</TableHead>
                                                    <TableHead>Full Name</TableHead>
                                                    <TableHead>Major</TableHead>
                                                    <TableHead>Intake</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {importResultData.newRecords.map((s, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-mono">{s.studentCode}</TableCell>
                                                        <TableCell>{s.fullName}</TableCell>
                                                        <TableCell>{s.majorCode}</TableCell>
                                                        <TableCell>{s.intake ? `K${s.intake}` : ""}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground bg-slate-50 rounded-md border border-dashed">
                                        No new students were added (all might be duplicates).
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button onClick={() => setImportResultOpen(false)}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add Manual Modal */}
                    <Dialog open={addManualOpen} onOpenChange={setAddManualOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Manual Student</DialogTitle>
                                <DialogDescription>Manually add a student to the registry.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="manual-code">Student Code (MSSV)</Label>
                                    <Input id="manual-code" placeholder="e.g. SE123456" value={newStudentCode}
                                        onChange={(e) => setNewStudentCode(e.target.value)}
                                        className="border-slate-300"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="manual-name">Full Name</Label>
                                    <Input id="manual-name" placeholder="e.g. Nguyen Van A" value={newStudentName}
                                        onChange={(e) => setNewStudentName(e.target.value)}
                                        className="border-slate-300"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setAddManualOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateManual} disabled={isAdding}>{isAdding ? "Adding..." : "Add Student"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Student Modal (CẬP NHẬT) */}
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Student</DialogTitle>
                                <DialogDescription>Update info for student</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-code">Student Code</Label>
                                    <Input
                                        id="edit-code"
                                        value={editStudentCode}
                                        onChange={(e) => setEditStudentCode(e.target.value)}
                                        placeholder="e.g. SE123456"
                                        className="border-slate-300"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Full Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="e.g. Nguyen Van A"
                                        className="border-slate-300"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                                <Button onClick={handleUpdateStudent} disabled={isUpdating}>{isUpdating ? "Saving..." : "Save Changes"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Upload Modal */}
                    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Import Student Registry</DialogTitle>
                                <DialogDescription>
                                    Upload an Excel (.xlsx) or CSV file containing student list.<br />
                                    Format required: <strong>student code (MSSV), Full Name</strong><br />
                                    <span className="text-orange-600 text-xs">Note: Duplicate MSSV or Name will be skipped.</span>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="file-upload">Registry File</Label>
                                    <Input id="file-upload" type="file"
                                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                                </div>
                                {uploadFile && (
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4" />
                                        {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                                <Button onClick={handleUploadSubmit} disabled={!uploadFile || isUploading}>
                                    {isUploading ? <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : <><Upload className="mr-2 h-4 w-4" /> Import</>}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirm Modals */}
                    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>Are you sure you want to remove student
                                    <span className="font-bold text-foreground">{studentToDelete?.studentCode}</span>?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteSingle} disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
                        <DialogContent className="border-red-500 border-2">
                            <DialogHeader>
                                <DialogTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="h-6 w-6" />DANGER ZONE: Delete All Registry</DialogTitle>
                                <DialogDescription className="text-base pt-2">This action will
                                    <strong className="text-red-600">PERMANENTLY DELETE ALL</strong> student registry data.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteAllOpen(false)}>Cancel</Button>
                                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteAll}
                                    disabled={isDeletingAll}>{isDeletingAll ? "Nuking Data..." : "Yes, Delete Everything"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </AppShell>
        </ProtectedRoute>
    )
}