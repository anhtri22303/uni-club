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
    Search,
    Trash,
    Upload,
    Users,
    FileSpreadsheet,
    AlertTriangle,
    RefreshCcw,
    X
} from "lucide-react"

// Import API functions
import {
    getAllStudentRegistry,
    searchStudentRegistry,
    deleteStudentFromRegistry,
    deleteAllStudentRegistry,
    uploadStudentRegistry,
    StudentRegistryItem
} from "@/service/studentCodeApi" // Đảm bảo đường dẫn đúng tới file API bạn đã tạo

export default function UniStaffStudentRegistryPage() {
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("") // Dùng để tránh gọi API liên tục khi gõ
    const { toast } = useToast()
    const router = useRouter()
    const queryClient = useQueryClient()

    // --- STATES ---
    // Pagination
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)

    // Delete Single State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [studentToDelete, setStudentToDelete] = useState<StudentRegistryItem | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Delete ALL State
    const [deleteAllOpen, setDeleteAllOpen] = useState(false)
    const [isDeletingAll, setIsDeletingAll] = useState(false)

    // Upload State
    const [uploadOpen, setUploadOpen] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // --- DEBOUNCE SEARCH ---
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
            setPage(0) // Reset về trang 1 khi search
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    // --- DATA FETCHING ---
    // Tự động chuyển đổi giữa Search API và Get All API dựa vào input
    const { data: students = [], isLoading: loading, isFetching } = useQuery({
        queryKey: ["student-registry", debouncedQuery],
        queryFn: async () => {
            if (debouncedQuery.trim()) {
                return await searchStudentRegistry({ keyword: debouncedQuery })
            }
            return await getAllStudentRegistry()
        },
        staleTime: 1000 * 60 * 5, // 5 phút
    })

    // --- PAGINATION LOGIC (Client-side pagination for simplicity) ---
    // Lưu ý: Nếu dữ liệu quá lớn, nên chuyển sang Server-side pagination
    const paginatedStudents = useMemo(() => {
        const start = page * pageSize
        return students.slice(start, start + pageSize)
    }, [students, page, pageSize])

    // --- HANDLERS ---

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ["student-registry"] })
        toast({ title: "Refreshed", description: "Student list updated." })
    }

    // Xử lý Upload File
    const handleUploadSubmit = async () => {
        if (!uploadFile) {
            toast({ title: "Error", description: "Please select a file.", variant: "destructive" })
            return
        }

        setIsUploading(true)
        try {
            const result = await uploadStudentRegistry(uploadFile)

            toast({
                title: "Import Successful",
                description: `Total: ${result.total} | Imported: ${result.imported} | Skipped: ${result.skipped}`,
                className: "bg-green-50 dark:bg-green-900 border-green-200"
            })

            setUploadOpen(false)
            setUploadFile(null)
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

    // Xử lý Xóa 1 sinh viên
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

    // Xử lý Xóa TOÀN BỘ (Nguy hiểm)
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
                    {/* --- HEADER SECTION --- */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Users className="h-8 w-8 text-primary" />
                                Student Registry
                            </h1>
                            <p className="text-muted-foreground">Manage official student IDs (MSSV) for authentication.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Stats Card */}
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
                    </div>

                    {/* --- ACTION BAR --- */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-[300px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Name or MSSV..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="pl-9 pr-9 bg-white dark:bg-slate-950"
                                />
                                {/* Logic hiển thị nút Clear */}
                                {query && (
                                    <button
                                        onClick={() => setQuery("")}
                                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                        type="button"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            {isFetching && <RefreshCcw className="h-4 w-4 animate-spin text-muted-foreground" />}
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Button variant="outline" onClick={handleRefresh} title="Refresh Data">
                                <RefreshCcw className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={() => setDeleteAllOpen(true)}
                                className="hidden md:flex"
                            >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete All
                            </Button>

                            <Button onClick={() => setUploadOpen(true)}>
                                <Upload className="h-4 w-4 mr-2" />
                                Import CSV/Excel
                            </Button>
                        </div>
                    </div>

                    {/* --- DATA TABLE --- */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Registry List</CardTitle>
                            <CardDescription>
                                Showing {paginatedStudents.length} of {students.length} students
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 dark:bg-slate-900">
                                            <TableHead className="w-[170px] text-left pl-12">MSSV</TableHead>
                                            <TableHead className="text-center">Full Name</TableHead>
                                            <TableHead className="w-[150px] text-center">Major Code</TableHead>
                                            <TableHead className="w-[150px] text-center">Intake/Year</TableHead>
                                            <TableHead className="w-[100px] text-center">Actions</TableHead>
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
                                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : paginatedStudents.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                    No students found in registry.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedStudents.map((s) => (
                                                <TableRow key={s.studentCode}>
                                                    <TableCell className="font-mono font-medium text-left pl-8">{s.studentCode}</TableCell>
                                                    <TableCell className="font-medium pl-10">{s.fullName}</TableCell>
                                                    <TableCell className="text-center">
                                                        {s.majorCode ? (
                                                            <Badge variant="outline">{s.majorCode}</Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs italic">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {s.intake ? `K${s.intake}` : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => {
                                                                setStudentToDelete(s)
                                                                setDeleteConfirmOpen(true)
                                                            }}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            {students.length > 0 && (
                                <div className="flex items-center justify-between space-x-2 py-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {page + 1} of {Math.ceil(students.length / pageSize)}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                            disabled={page === 0}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(Math.ceil(students.length / pageSize) - 1, p + 1))}
                                            disabled={page >= Math.ceil(students.length / pageSize) - 1}
                                        >
                                            Next
                                        </Button>
                                        <select
                                            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(Number(e.target.value))
                                                setPage(0)
                                            }}
                                        >
                                            <option value={10}>10</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* --- MODAL: UPLOAD FILE --- */}
                    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Import Student Registry</DialogTitle>
                                <DialogDescription>
                                    Upload an Excel (.xlsx) or CSV file containing student list.<br />
                                    Format required: <strong>MSSV, Full Name</strong>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="file-upload">Registry File</Label>
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    />
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
                                    {isUploading ? (
                                        <>
                                            <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" /> Import
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* --- MODAL: DELETE SINGLE --- */}
                    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to remove student <span className="font-bold text-foreground">{studentToDelete?.studentCode}</span>?
                                    <br />
                                    This will prevent this student code from registering in the future unless re-imported.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteSingle} disabled={isDeleting}>
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* --- MODAL: DELETE ALL (DANGER) --- */}
                    <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
                        <DialogContent className="border-red-500 border-2">
                            <DialogHeader>
                                <DialogTitle className="text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="h-6 w-6" />
                                    DANGER ZONE: Delete All Registry
                                </DialogTitle>
                                <DialogDescription className="text-base pt-2">
                                    This action will <strong className="text-red-600">PERMANENTLY DELETE ALL</strong> student registry data from the system.
                                    <br /><br />
                                    - All verified student codes will be removed.
                                    <br />
                                    - New students won&apos;t be able to sign up.
                                    <br />
                                    - This action <strong>cannot</strong> be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-2">
                                <Label className="text-red-600 font-semibold">Are you absolutely sure?</Label>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteAllOpen(false)}>Cancel</Button>
                                <Button
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleDeleteAll}
                                    disabled={isDeletingAll}
                                >
                                    {isDeletingAll ? "Nuking Data..." : "Yes, Delete Everything"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </AppShell>
        </ProtectedRoute>
    )
}