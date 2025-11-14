"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getTags, addTag, deleteTag, Tag, updateTag, UpdateTagDto } from "@/service/tagApi"
import {
    Search, Tag as TagIcon, Info, ArrowUpDown, SortAsc, SortDesc, Grid3x3, List, Plus, X, Trash2, ShieldCheck, Tags
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

// -----------------------------------------------------------------
// (THAY ĐỔI) Types: Cập nhật cho Tag
// -----------------------------------------------------------------
type SortField = "name" | "description" | "tagId"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"
type TagFilter = "all" | "core" | "custom"
// Định nghĩa kiểu cho form data (Update DTO bao gồm cả trường của Create)
type TagFormData = {
    name: string
    description: string
    core: boolean // <-- ĐÃ THÊM
}

export default function UniStaffTagsPage() {
    const { toast } = useToast()

    // State management
    const [tags, setTags] = useState<Tag[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [sortField, setSortField] = useState<SortField>("name") // Sửa: default sort
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc") // Sửa: default sort
    const [viewMode, setViewMode] = useState<ViewMode>("grid")
    const [tagFilter, setTagFilter] = useState<TagFilter>("all") // Sửa: capacityFilter -> tagFilter

    // Modal and form state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingTag, setEditingTag] = useState<Tag | null>(null) // Sửa: editingLocation -> editingTag
    const [formData, setFormData] = useState<TagFormData>({
        name: "",
        description: "",
        core: false, // <-- ĐÃ THÊM
    })

    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [tagToDelete, setTagToDelete] = useState<Tag | null>(null) // Sửa: locationToDelete -> tagToDelete
    const [isDeleting, setIsDeleting] = useState(false)

    // -----------------------------------------------------------------
    // (THAY ĐỔI) Fetch tags: Chỉ chạy 1 lần khi mount
    // -----------------------------------------------------------------
    useEffect(() => {
        loadTags()
    }, [])

    const loadTags = async () => {
        try {
            setLoading(true)
            // (THAY ĐỔI) Gọi getTags() - không có tham số
            const response = await getTags()

            if (response) {
                setTags(response)
                // (XÓA BỎ) Set state phân trang
            }
        } catch (error) {
            console.error("Error loading tags:", error)
            toast({
                title: "Error",
                description: "Failed to load tags. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    // -----------------------------------------------------------------
    // (THAY ĐỔI) Helper: Chuyển từ Capacity -> Tag (Core/Custom)
    // -----------------------------------------------------------------
    const getTagBadge = (isCore: boolean) => {
        if (isCore) {
            return {
                label: "Core Tag",
                color: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700"
            }
        }
        return {
            label: "Custom Tag",
            color: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700"
        }
    }

    // -----------------------------------------------------------------
    // (THAY ĐỔI) Filter, Sort (Client-side), và Stats
    // -----------------------------------------------------------------
    const filteredTags = useMemo(() => {
        let processedTags = [...tags]

        // 1. Filter
        processedTags = processedTags.filter((tag) => {
            // Search filter
            const matchesSearch =
                tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()))

            // Tag filter
            const matchesFilter =
                tagFilter === "all" ||
                (tagFilter === "core" && tag.core) ||
                (tagFilter === "custom" && !tag.core)

            return matchesSearch && matchesFilter
        })

        // 2. Sort (Client-side)
        processedTags.sort((a, b) => {
            const fieldA = a[sortField] ?? "" // Handle null/undefined descriptions
            const fieldB = b[sortField] ?? ""

            let comparison = 0;
            if (typeof fieldA === 'string' && typeof fieldB === 'string') {
                comparison = fieldA.localeCompare(fieldB, undefined, { sensitivity: 'base' });
            } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
                comparison = fieldA - fieldB;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        })

        return processedTags

    }, [tags, searchQuery, tagFilter, sortField, sortOrder]) // Thêm sort dependencies

    // Statistics
    const stats = useMemo(() => {
        return {
            total: tags.length,
            core: tags.filter(t => t.core).length,
            custom: tags.filter(t => !t.core).length,
        }
    }, [tags])

    // Handlers
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortOrder("asc") // Default to asc for names
        }
        // (XÓA BỎ) Reset page
    }

    // (XÓA BỎ) handlePageChange

    /**
     * Xử lý khi nhấn nút "Create Tag"
     */
    const handleOpenCreateModal = () => {
        setEditingTag(null)
        // (CẬP NHẬT) Reset cả 'core'
        setFormData({
            name: "",
            description: "",
            core: false,
        })
        setIsModalOpen(true)
    }

    /**
     * Xử lý khi nhấn vào Card (mở modal ở chế độ sửa)
     */
    const handleEditClick = (tag: Tag) => {
        // (CẬP NHẬT) 4. XÓA BỎ logic chặn edit 'core' tag
        // if (tag.core) { ... } // <-- ĐÃ XÓA
        setEditingTag(tag)
        // (CẬP NHẬT) 5. Thêm 'core' khi set form
        setFormData({
            name: tag.name,
            description: tag.description || "",
            core: tag.core, // <-- ĐÃ THÊM
        })
        setIsModalOpen(true)
    }

    /**
     * Xử lý khi đóng/mở modal
     */
    const handleModalOpenChange = (isOpen: boolean) => {
        setIsModalOpen(isOpen)
        if (!isOpen) {
            setEditingTag(null)
            // (CẬP NHẬT) Reset cả 'core'
            setFormData({ name: "", description: "", core: false })
        }
    }

    const handleFormChange = (field: keyof TagFormData, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    /**
     * Hàm Submit chính, kiểm tra validation và gọi create hoặc update
     */
    const handleFormSubmit = async () => {
        // Validation
        if (!formData.name.trim()) {
            toast({ title: "Validation Error", description: "Tag name is required", variant: "destructive" })
            return
        }
        // (XÓA BỎ) Validation cho address và capacity

        // Quyết định gọi hàm create hay update
        if (editingTag) {
            await handleUpdateTag()
        } else {
            await handleCreateTag()
        }
    }

    /**
       * Logic Create
       */
    const handleCreateTag = async () => {
        try {
            setIsSaving(true)
            // Gọi addTag chỉ với 'name'
            await addTag(formData.name)

            toast({
                title: "Success",
                description: "Tag created successfully",
            })
            handleModalOpenChange(false)
            loadTags() // Tải lại danh sách
        } catch (error) {
            console.error("Error creating tag:", error)
            toast({
                title: "Error",
                description: "Failed to create tag. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    /**
     * Logic Update
     */
    const handleUpdateTag = async () => {
        if (!editingTag) return

        try {
            setIsSaving(true)
            // Gọi updateTag với id và formData (name, description)
            const updateData: UpdateTagDto = {
                name: formData.name,
                description: formData.description,
                core: formData.core,
            }
            await updateTag(editingTag.tagId, updateData)

            toast({
                title: "Success",
                description: `Tag "${editingTag.name}" updated successfully`,
            })
            handleModalOpenChange(false)
            loadTags() // Tải lại danh sách
        } catch (error) {
            console.error("Error updating tag:", error)
            toast({
                title: "Error",
                description: "Failed to update tag. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteClick = (tag: Tag, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card click event
        if (tag.core) { // (LOGIC MỚI) Không cho xóa Core Tag
            toast({
                title: "Action Prohibited",
                description: "Core tags cannot be deleted.",
                variant: "default",
            })
            return
        }
        setTagToDelete(tag)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!tagToDelete) return

        try {
            setIsDeleting(true)
            await deleteTag(tagToDelete.tagId) // Sửa: Dùng tagId

            toast({
                title: "Success",
                description: `Tag "${tagToDelete.name}" has been deleted successfully`,
            })

            setDeleteDialogOpen(false)
            setTagToDelete(null)
            loadTags() // Tải lại
        } catch (error) {
            console.error("Error deleting tag:", error)
            toast({
                title: "Error",
                description: "Failed to delete tag. It might be in use.", // Cập nhật mô tả
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setTagToDelete(null)
    }

    return (
        <ProtectedRoute allowedRoles={["uni_staff"]}>
            <AppShell>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                                {/* (SỬA) Icon và Title */}
                                <Tags className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
                                <span className="truncate">Tag Management</span>
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
                                {/* (SỬA) Description */}
                                Create, edit, and manage system-wide tags for categorization.
                            </p>
                        </div>

                        {/* Create Tag Button */}
                        <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 w-full sm:w-auto flex-shrink-0" onClick={handleOpenCreateModal}>
                                    <Plus className="h-4 w-4" />
                                    <span className="truncate">Create Tag</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        {/* (SỬA) Title động */}
                                        {editingTag ? "Edit Tag" : "Create New Tag"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {/* (SỬA) Description động */}
                                        {editingTag
                                            ? `Update the details for "${editingTag.name}"`
                                            : "Add a new tag to the system"}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    {/* Name Input */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Tag Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., Workshop, Seminar, Music"
                                            value={formData.name}
                                            onChange={(e) => handleFormChange("name", e.target.value)}
                                            className="border-slate-300"
                                        />
                                    </div>

                                    {/* Description Input - CHỈ HIỂN THỊ KHI EDIT */}
                                    {editingTag && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="description">
                                                    Description
                                                </Label>
                                                <Input
                                                    id="description"
                                                    placeholder="e.g., For official academic workshops"
                                                    value={formData.description}
                                                    onChange={(e) => handleFormChange("description", e.target.value)}
                                                    className="border-slate-300"
                                                />
                                            </div>

                                            {/* Checkbox "Set as Core Tag" */}
                                            <div className="flex items-center space-x-2 pt-2">
                                                <Checkbox
                                                    id="core"
                                                    checked={formData.core}
                                                    onCheckedChange={(checked) => handleFormChange("core", !!checked)}
                                                />
                                                <Label
                                                    htmlFor="core"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Set as Core Tag
                                                </Label>
                                            </div>
                                            <p className="text-xs text-muted-foreground -mt-2">
                                                Core tags are system-defined and cannot be deleted by users.
                                            </p>
                                        </>
                                    )}

                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleModalOpenChange(false)}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleFormSubmit}
                                        disabled={isSaving}
                                    >
                                        {isSaving
                                            ? (editingTag ? "Saving..." : "Creating...")
                                            : (editingTag ? "Save Changes" : "Create Tag")}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* (SỬA) Statistics Cards */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                            <CardHeader className="pb-3">
                                <CardDescription className="text-purple-700 dark:text-purple-300 font-medium truncate">Total Tags</CardDescription>
                                <CardTitle className="text-3xl sm:text-4xl text-purple-900 dark:text-purple-100 truncate">{stats.total}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium truncate">
                                    System-wide categories
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                            <CardHeader className="pb-3">
                                <CardDescription className="text-blue-700 dark:text-blue-300 font-medium truncate">Core Tags</CardDescription>
                                <CardTitle className="text-3xl sm:text-4xl text-blue-900 dark:text-blue-100 truncate">{stats.core}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                                    System-defined tags
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters and Search */}
                    <Card className="dark:border-slate-700">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <div className="flex-1 w-full sm:w-auto">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name or description..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full sm:w-auto">
                                    {/* (SỬA) Tag Filter */}
                                    <Select value={tagFilter} onValueChange={(v) => setTagFilter(v as TagFilter)}>
                                        <SelectTrigger className="w-full sm:w-[140px]">
                                            <SelectValue placeholder="All Tags" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Tags</SelectItem>
                                            <SelectItem value="core">Core Tags</SelectItem>
                                            <SelectItem value="custom">Custom Tags</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* (SỬA) Sort Dropdown */}
                                    <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
                                        const [field, order] = value.split('-') as [SortField, SortOrder]
                                        setSortField(field)
                                        setSortOrder(order)
                                    }}>
                                        <SelectTrigger className="w-full sm:w-[160px]">
                                            <ArrowUpDown className="h-4 w-4 mr-2 flex-shrink-0" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                            <SelectItem value="description-asc">Description (A-Z)</SelectItem>
                                            <SelectItem value="description-desc">Description (Z-A)</SelectItem>
                                            <SelectItem value="tagId-desc">Newest</SelectItem>
                                            <SelectItem value="tagId-asc">Oldest</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* View Mode Toggle */}
                                    <div className="flex border rounded-md">
                                        <Button
                                            variant={viewMode === "grid" ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setViewMode("grid")}
                                            className="rounded-r-none"
                                        >
                                            <Grid3x3 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={viewMode === "list" ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setViewMode("list")}
                                            className="rounded-l-none"
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Loading State */}
                    {loading && (
                        <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
                            {[...Array(6)].map((_, i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-1/2 mt-2" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-10 w-full" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {!loading && filteredTags.length === 0 && (
                        <Card className="dark:border-slate-700">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <TagIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No tags found</h3>
                                <p className="text-muted-foreground text-center">
                                    {searchQuery || tagFilter !== "all"
                                        ? "Try adjusting your filters or search query"
                                        : "No tags are available at the moment"}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Grid View */}
                    {!loading && filteredTags.length > 0 && viewMode === "grid" && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredTags.map((tag) => {
                                const badge = getTagBadge(tag.core)
                                return (
                                    <Card
                                        key={tag.tagId}
                                        className="hover:shadow-lg transition-shadow cursor-pointer group relative dark:border-slate-700"
                                        onClick={() => handleEditClick(tag)}
                                    >
                                        {/* Delete Button: Thêm logic 'disabled' */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed"
                                            onClick={(e) => handleDeleteClick(tag, e)}
                                            disabled={tag.core}
                                            title={tag.core ? "Core tags cannot be deleted" : "Delete tag"}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>

                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2 pr-8">
                                                <CardTitle className="text-base sm:text-lg line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors min-w-0">
                                                    {tag.name}
                                                </CardTitle>
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0 text-xs"
                                                >
                                                    #{tag.tagId}
                                                </Badge>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`${badge.color} w-fit mt-2 text-xs truncate max-w-full`}
                                            >
                                                {badge.label}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {/* Description */}
                                            <div className="flex items-start gap-2 text-sm min-w-0 h-10">
                                                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                                <p className="text-muted-foreground line-clamp-2 min-w-0 italic">
                                                    {tag.description || "No description provided."}
                                                </p>
                                            </div>
                                            {/* Capacity */}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}

                    {/* List View */}
                    {!loading && filteredTags.length > 0 && viewMode === "list" && (
                        <div className="space-y-3">
                            {filteredTags.map((tag) => {
                                const badge = getTagBadge(tag.core)
                                return (
                                    <Card
                                        key={tag.tagId}
                                        className="hover:shadow-md transition-shadow cursor-pointer group relative dark:border-slate-700"
                                        onClick={() => handleEditClick(tag)}
                                    >
                                        {/* Delete Button: Thêm logic 'disabled' */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed"
                                            onClick={(e) => handleDeleteClick(tag, e)}
                                            disabled={tag.core}
                                            title={tag.core ? "Core tags cannot be deleted" : "Delete tag"}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>

                                        <CardContent className="p-4 pr-12">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                {/* Left Side - Info */}
                                                <div className="flex-1 space-y-2 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-base sm:text-lg font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors truncate min-w-0">
                                                            {tag.name}
                                                        </h3>
                                                        <Badge variant="outline" className="text-xs flex-shrink-0">
                                                            #{tag.tagId}
                                                        </Badge>
                                                        <Badge variant="outline" className={`${badge.color} text-xs truncate max-w-[120px]`}>
                                                            {badge.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-start gap-2 text-sm min-w-0">
                                                        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                                        <p className="text-muted-foreground line-clamp-2 min-w-0 italic">
                                                            {tag.description || "No description provided."}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* (XÓA BỎ) Capacity Box */}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}

                    {/* (XÓA BỎ) Pagination */}

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-red-600">
                                    <Trash2 className="h-5 w-5" />
                                    Delete Tag
                                </DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this tag? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>

                            {tagToDelete && (
                                <div className="py-4">
                                    <Card className="bg-muted/50">
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-base sm:text-lg truncate">{tagToDelete.name}</span>
                                                <Badge variant="outline" className="flex-shrink-0">#{tagToDelete.tagId}</Badge>
                                                L </div>
                                            <div className="flex items-start gap-2 text-sm text-muted-foreground min-w-0">
                                                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                                <span className="line-clamp-2 min-w-0 italic">{tagToDelete.description || "No description"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <ShieldCheck className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                                <span className="font-medium truncate">Core Tag: {tagToDelete.core ? "Yes" : "No"}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={handleDeleteCancel}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                    className="gap-2"
                                >
                                    {isDeleting ? (
                                        <>Deleting...</>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Delete Tag
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </AppShell>
        </ProtectedRoute>
    )
}