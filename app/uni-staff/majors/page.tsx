"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useMajors } from "@/hooks/use-query-hooks"
import { useQueryClient } from "@tanstack/react-query"
import { 
  Major, 
  createMajor, 
  updateMajorById, 
  deleteMajorById,
  CreateMajorPayload,
  UpdateMajorPayload
} from "@/service/majorApi"
import { 
  BookOpen, 
  Search, 
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  Grid3x3,
  List,
  Code,
  FileText
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ViewMode = "grid" | "list"

export default function UniStaffMajorsPage() {
    const { toast } = useToast()
    const queryClient = useQueryClient()
  
  // Fetch majors using React Query
    const { data: majors = [], isLoading: loading } = useMajors()
  
  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

  // Selected major for edit/delete
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null)
  
  // Form data
  const [createFormData, setCreateFormData] = useState<CreateMajorPayload>({
    name: "",
    description: "",
    majorCode: "",
  })
  
  const [editFormData, setEditFormData] = useState<UpdateMajorPayload>({
    name: "",
    description: "",
    majorCode: "",
    active: true,
  })

  // Reload majors helper
    const reloadMajors = () => {
        queryClient.invalidateQueries({ queryKey: ["majors"] })
    }

  // Filter and search
  const filteredMajors = useMemo(() => {
    let filtered = majors

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter(m => m.active)
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(m => !m.active)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        m =>
          m.name.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.majorCode.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [majors, statusFilter, searchQuery])

  // Statistics
  const stats = useMemo(() => {
    const total = majors.length
    const active = majors.filter(m => m.active).length
    const inactive = total - active
    
    return { total, active, inactive }
  }, [majors])

  // Handlers
  const handleCreateFormChange = (field: keyof CreateMajorPayload, value: string) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEditFormChange = (field: keyof UpdateMajorPayload, value: string | boolean) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateMajor = async () => {
    if (!createFormData.name || !createFormData.majorCode) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name and Major Code).",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      const newMajor = await createMajor(createFormData)
      
      toast({
        title: "Success",
        description: `Major "${newMajor.name}" has been created successfully.`,
      })

      setIsCreateModalOpen(false)
      setCreateFormData({
        name: "",
        description: "",
        majorCode: "",
      })
      reloadMajors()
    } catch (error) {
      console.error("Error creating major:", error)
      toast({
        title: "Error",
        description: "Failed to create major. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditClick = (major: Major) => {
    setSelectedMajor(major)
    setEditFormData({
      name: major.name,
      description: major.description,
      majorCode: major.majorCode,
      active: major.active,
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateMajor = async () => {
    if (!selectedMajor) return

    if (!editFormData.name || !editFormData.majorCode) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name and Major Code).",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdating(true)
      await updateMajorById(selectedMajor.id, editFormData)
      
      toast({
        title: "Success",
        description: `Major "${editFormData.name}" has been updated successfully.`,
      })

      setIsEditModalOpen(false)
      setSelectedMajor(null)
                reloadMajors()
    } catch (error) {
      console.error("Error updating major:", error)
      toast({
        title: "Error",
        description: "Failed to update major. Please try again.",
        variant: "destructive",
      })
        } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteClick = (major: Major) => {
    setSelectedMajor(major)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedMajor) return

    try {
        setIsDeleting(true)
      await deleteMajorById(selectedMajor.id)
      
      toast({
        title: "Success",
        description: `Major "${selectedMajor.name}" has been deleted successfully.`,
      })

      setIsDeleteDialogOpen(false)
      setSelectedMajor(null)
      reloadMajors()
    } catch (error) {
      console.error("Error deleting major:", error)
      toast({
        title: "Error",
        description: "Failed to delete major. Please try again.",
        variant: "destructive",
      })
        } finally {
            setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setSelectedMajor(null)
  }

    return (
        <ProtectedRoute allowedRoles={["uni_staff"]}>
            <AppShell>
                <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
                        <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  Major Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage university majors and programs
                </p>
                        </div>

              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Add New Major
              </Button>
                                            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-blue-700 dark:text-blue-300 font-medium">
                  Total Majors
                </CardDescription>
                <CardTitle className="text-4xl text-blue-900 dark:text-blue-100">
                  {stats.total}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  All programs
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-green-700 dark:text-green-300 font-medium">
                  Active Majors
                </CardDescription>
                <CardTitle className="text-4xl text-green-900 dark:text-green-100">
                  {stats.active}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Currently available
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-orange-700 dark:text-orange-300 font-medium">
                  Inactive Majors
                </CardDescription>
                <CardTitle className="text-4xl text-orange-900 dark:text-orange-100">
                  {stats.inactive}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Not available
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                      placeholder="Search by name, code, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Tabs 
                    value={statusFilter} 
                    onValueChange={setStatusFilter}
                    className="w-full sm:w-auto"
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="inactive">Inactive</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 w-8 p-0"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 w-8 p-0"
                    >
                      <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
              </div>
            </CardHeader>
          </Card>

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{filteredMajors.length}</span> of{" "}
              <span className="font-medium">{majors.length}</span> majors
            </p>
                    </div>

          {/* Loading State */}
          {loading ? (
            <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                        <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMajors.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No majors found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "Get started by creating your first major"}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Major
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === "grid" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMajors.map((major) => (
                    <Card 
                      key={major.id} 
                      className="group hover:shadow-lg transition-all duration-200 relative overflow-hidden"
                    >
                      {/* Status indicator stripe */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        major.active 
                          ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                          : "bg-gradient-to-r from-red-500 to-orange-500"
                      }`} />

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl mb-2 line-clamp-1">
                              {major.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="gap-1">
                                <Code className="h-3 w-3" />
                                {major.majorCode}
                              </Badge>
                              <Badge variant={major.active ? "default" : "destructive"}>
                                {major.active ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {major.description || "No description available"}
                        </p>

                        <div className="flex items-center gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => handleEditClick(major)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                                                                </Button>
                                                                <Button
                            variant="outline"
                                                                    size="sm"
                            className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            onClick={() => handleDeleteClick(major)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                                                                </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
                <div className="space-y-3">
                  {filteredMajors.map((major) => (
                    <Card 
                      key={major.id} 
                      className="group hover:shadow-md transition-all duration-200"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div className={`p-3 rounded-lg ${
                            major.active 
                              ? "bg-green-100 dark:bg-green-900" 
                              : "bg-gray-100 dark:bg-gray-800"
                          }`}>
                            <BookOpen className={`h-6 w-6 ${
                              major.active 
                                ? "text-green-600 dark:text-green-400" 
                                : "text-gray-600 dark:text-gray-400"
                            }`} />
                                                            </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{major.name}</h3>
                              <Badge variant="secondary" className="gap-1">
                                <Code className="h-3 w-3" />
                                {major.majorCode}
                              </Badge>
                              <Badge variant={major.active ? "default" : "destructive"}>
                                {major.active ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                                </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {major.description || "No description available"}
                            </p>
                                    </div>

                          {/* Actions */}
                                    <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleEditClick(major)}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              onClick={() => handleDeleteClick(major)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Create Major Dialog */}
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent className="sm:max-w-[550px]">
                            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Major
                </DialogTitle>
                <DialogDescription>
                  Add a new major to the university program catalog.
                </DialogDescription>
                            </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">
                    Major Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="create-name"
                    placeholder="e.g., Software Engineering"
                    value={createFormData.name}
                    onChange={(e) => handleCreateFormChange("name", e.target.value)}
                  />
                                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-code">
                    Major Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="create-code"
                    placeholder="e.g., SE"
                    value={createFormData.majorCode}
                    onChange={(e) => handleCreateFormChange("majorCode", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    A short code to identify this major
                  </p>
                                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-description">Description</Label>
                  <Textarea
                    id="create-description"
                    placeholder="Describe the major program..."
                    value={createFormData.description}
                    onChange={(e) => handleCreateFormChange("description", e.target.value)}
                    rows={4}
                  />
                                </div>
                                </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateMajor}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create Major"}
                </Button>
              </DialogFooter>
                        </DialogContent>
                    </Dialog>

          {/* Edit Major Dialog */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[550px]">
                            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Major
                </DialogTitle>
                <DialogDescription>
                  Update major information. All fields marked with * are required.
                </DialogDescription>
                            </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    Major Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder="e.g., Software Engineering"
                    value={editFormData.name}
                    onChange={(e) => handleEditFormChange("name", e.target.value)}
                  />
                                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-code">
                    Major Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-code"
                    placeholder="e.g., SE"
                    value={editFormData.majorCode}
                    onChange={(e) => handleEditFormChange("majorCode", e.target.value)}
                  />
                                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Describe the major program..."
                    value={editFormData.description}
                    onChange={(e) => handleEditFormChange("description", e.target.value)}
                    rows={4}
                  />
                                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={editFormData.active}
                    onChange={(e) => handleEditFormChange("active", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="edit-active" className="cursor-pointer">
                    Active (available for student enrollment)
                  </Label>
                                </div>
                            </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateMajor}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update Major"}
                </Button>
              </DialogFooter>
                        </DialogContent>
                    </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Delete Major
                </DialogTitle>
                                <DialogDescription>
                  Are you sure you want to delete this major? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>

              {selectedMajor && (
                <div className="py-4">
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">{selectedMajor.name}</span>
                        <Badge variant="outline">#{selectedMajor.id}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedMajor.majorCode}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{selectedMajor.description}</span>
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
                      Delete Major
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
